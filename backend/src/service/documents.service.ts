import Documents, { DocumentStatus } from "../models/documents.model";
import Users from "../models/users.model";
import AuditLog from "../models/auditLogs.model";

class DocumentsService {
  public async getAllDocuments(actingUserId: number, roleName: string, ipAddress: string): Promise<Documents[]> {
    const documents = await Documents.findAll({
      attributes: [
        "id",
        "title",
        "slug",
        "description",
        "status",
        "version",
        "created_by",
        "updatedAt",
      ],
      include: [
        {
          model: Users,
          as: "Creator",
          attributes: ["username"],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    await AuditLog.create({
      userId: actingUserId,
      actionType: "READ_ALL_DOCUMENTS",
      tableName: "Documents",
      recordId: undefined,
      ipAddress: ipAddress,
      details: {
        endpoint: "/api/documents/all",
        count: documents.length,
        userRole: roleName,
      },
    });

    return documents;
  }

  public async getDocumentById(id: number, actingUserId: number, roleName: string, ipAddress: string): Promise<Documents | null> {
    const document = await Documents.findByPk(id, {
      include: [
        { model: Users, as: "Creator", attributes: ["username"] },
        { model: Users, as: "Updater", attributes: ["username"] },
      ],
    });

    if (!document) {
      await AuditLog.create({
        userId: actingUserId,
        actionType: "READ_DOCUMENT_FAILED",
        tableName: "Documents",
        recordId: id,
        ipAddress: ipAddress,
        details: {
          reason: "Dokumen tidak ditemukan (404)",
          userRole: roleName,
        },
      });
      return null;
    }

    await AuditLog.create({
      userId: actingUserId,
      actionType: "READ_DOCUMENT_SUCCESS",
      tableName: "Documents",
      recordId: id,
      ipAddress: ipAddress,
      details: {
        title: document.title,
        status: document.status,
        userRole: roleName,
      },
    });

    return document;
  }

  public async getDocumentBySlug(slug: string, actingUserId: number, roleName: string, ipAddress: string): Promise<Documents | null> {
    try {
      const document = await Documents.findOne({
        where: { slug },
        include: [
          { model: Users, as: "Creator", attributes: ["username"] },
          { model: Users, as: "Updater", attributes: ["username"] },
        ],
      });

      if (!document) {
        await AuditLog.create({
          userId: actingUserId,
          actionType: "READ_DOCUMENT_FAILED",
          tableName: "Documents",
          recordId: undefined,
          ipAddress: ipAddress,
          details: {
            reason: "Dokumen tidak ditemukan (404)",
            searchParam: `Slug: ${slug}`,
            userRole: roleName,
          },
        });
        return null;
      }

      await AuditLog.create({
        userId: actingUserId,
        actionType: "READ_DOCUMENT_SUCCESS",
        tableName: "Documents",
        recordId: document.id,
        ipAddress: ipAddress,
        details: {
          title: document.title,
          status: document.status,
          searchParam: `Slug: ${slug}`,
          userRole: roleName,
        },
      });

      return document;
    } catch (error) {
      await AuditLog.create({
        userId: actingUserId,
        actionType: "READ_DOCUMENT_ERROR",
        tableName: "Documents",
        recordId: undefined,
        ipAddress: ipAddress,
        details: {
          error: (error as Error).message,
          searchParam: `Slug: ${slug}`,
          userRole: roleName,
        },
      });
      throw error;
    }
  }

  public async findBySlugOnly(slug: string): Promise<Documents | null> {
    return await Documents.findOne({ where: { slug } });
  }

  public async findByIdOnly(id: number): Promise<Documents | null> {
    return await Documents.findByPk(id);
  }

  public async logCreateDocumentFailed(
    userId: number,
    title: string,
    reason: string,
    ipAddress: string,
    generatedSlug?: string
  ): Promise<void> {
    await AuditLog.create({
      userId: userId,
      actionType: "CREATE_DOCUMENT_FAILED",
      tableName: "Documents",
      recordId: undefined,
      ipAddress: ipAddress,
      details: {
        reason,
        attemptedTitle: title,
        generatedSlug,
      },
    });
  }

  public async createDocument(
    title: string,
    slug: string,
    description: string,
    markdown_content: string,
    checksum: string,
    userId: number,
    roleName: string,
    ipAddress: string
  ): Promise<Documents> {
    const newDocument = await Documents.create({
      title,
      slug,
      description,
      markdown_content,
      status: DocumentStatus.Draft,
      version: "1.0",
      checksum,
      created_by: userId,
      updated_by: userId,
    });

    await AuditLog.create({
      userId: userId,
      actionType: "DOCUMENT_CREATED",
      tableName: "Documents",
      recordId: newDocument.id,
      ipAddress: ipAddress,
      details: {
        title: newDocument.title,
        status: newDocument.status,
        userRole: roleName,
      },
    });

    return newDocument;
  }

  public async updateDocumentById(
    document: Documents,
    updateFields: {
      title: string;
      description: string;
      markdown_content: string;
      slug: string;
      checksum: string;
    },
    currentUserId: number
  ): Promise<Documents> {
    return await document.update({
      title: updateFields.title,
      description: updateFields.description,
      markdown_content: updateFields.markdown_content,
      slug: updateFields.slug,
      checksum: updateFields.checksum,
      updated_by: currentUserId,
    });
  }

  public async logUpdateFailed(
    userId: number,
    slug: string,
    reason: string
  ): Promise<void> {
    await AuditLog.create({
      userId: userId,
      actionType: "UPDATE_DOCUMENT_FAILED",
      details: {
        reason,
        slug,
      },
    });
  }

  public async logUpdateError(
    userId: number,
    ipAddress: string,
    reason: string,
    errorMsg: string
  ): Promise<void> {
    await AuditLog.create({
      userId: userId,
      actionType: "UPDATE_DOCUMENT_ERROR",
      tableName: "Documents",
      recordId: undefined,
      ipAddress: ipAddress,
      details: { reason, error: errorMsg },
    });
  }

  public async updateDocumentBySlug(
    document: Documents,
    updateFields: {
      title: string;
      description: string;
      markdown_content: string;
      slug: string;
      checksum: string;
    },
    userId: number,
    roleName: string,
    ipAddress: string
  ): Promise<Documents> {
    const updatedDocument = await document.update({
      title: updateFields.title,
      description: updateFields.description,
      markdown_content: updateFields.markdown_content,
      slug: updateFields.slug,
      checksum: updateFields.checksum,
      updated_by: userId,
    });

    await AuditLog.create({
      userId: userId,
      actionType: "DOCUMENT_UPDATED_BY_SLUG",
      tableName: "Documents",
      recordId: updatedDocument.id,
      ipAddress: ipAddress,
      details: {
        title: updatedDocument.title,
        slug_updated: updateFields.slug !== document.slug,
        userRole: roleName,
      },
    });

    return updatedDocument;
  }

  public async deleteDocumentBySlug(
    document: Documents,
    slugToDelete: string,
    userId: number,
    roleName: string,
    ipAddress: string
  ): Promise<void> {
    const documentTitle = document.title;
    const documentId = document.id;
    const documentStatus = document.status;

    await document.destroy();

    await AuditLog.create({
      userId: userId,
      actionType: "DOCUMENT_DELETED",
      tableName: "Documents",
      recordId: documentId,
      ipAddress: ipAddress,
      details: {
        deletedTitle: documentTitle,
        deletedSlug: slugToDelete,
        userRole: roleName,
        deletedStatus: documentStatus,
      },
    });
  }

  public async logDeleteFailed(
    userId: number,
    slug: string,
    roleName: string,
    ipAddress: string
  ): Promise<void> {
    await AuditLog.create({
      userId: userId,
      actionType: "DELETE_DOCUMENT_FAILED",
      tableName: "Documents",
      recordId: undefined,
      ipAddress: ipAddress,
      details: {
        reason: "Dokumen target tidak ditemukan (404)",
        slug: slug,
        userRole: roleName,
      },
    });
  }
}

export default new DocumentsService();
