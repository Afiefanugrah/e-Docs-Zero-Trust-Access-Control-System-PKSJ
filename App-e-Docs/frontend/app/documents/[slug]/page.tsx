// app/documents/[slug]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiLoader,
  FiFileText,
  FiUser,
  FiCalendar,
  FiEdit,
  FiDownload,
  FiList,
} from "react-icons/fi";
// PENTING: Import library React Markdown
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw"; // Opsional: Untuk mengizinkan HTML di dalam markdown

// URL API yang Sesuai dengan Backend Anda
const BASE_URL = "http://localhost:3200/api";

// --- DEFINISI TIPE (Tetap Sama) ---
interface DocumentDetail {
  id: number;
  title: string;
  slug: string;
  description: string;
  // Memastikan tipe markdown_content ada
  markdown_content: string;
  status: string;
  version: number;
  Creator: {
    username: string;
  };
  updatedAt: string;
}

// Komponen StatusBadge (Helper)
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const safeStatus = status || "";

  let colorClass = "bg-gray-200 text-gray-800";
  if (safeStatus === "PUBLISHED" || safeStatus === "approved") {
    colorClass = "bg-green-100 text-green-800";
  } else if (safeStatus === "DRAFT") {
    colorClass = "bg-yellow-100 text-yellow-800";
  } else if (safeStatus === "ARCHIVED") {
    colorClass = "bg-red-100 text-red-800";
  }

  return (
    <span
      className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${colorClass}`}
    >
      {safeStatus.toUpperCase()}
    </span>
  );
};

const DocumentDetailPage: React.FC = () => {
  const params = useParams();
  const encodedSlug = params.slug as string;
  const router = useRouter();

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const userRole =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const canEdit = userRole === "admin" || userRole === "editor";

  // --- LOGIKA FETCH DETAIL DOKUMEN (Tetap Sama) ---
  useEffect(() => {
    const documentSlug = encodedSlug ? decodeURIComponent(encodedSlug) : null;

    if (!documentSlug) {
      setError("Slug dokumen tidak valid atau hilang.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("authToken");

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchDocumentDetail = async () => {
      setLoading(true);
      setError(null);

      const API_URL = `${BASE_URL}/document/slug/${documentSlug}`;

      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          setError("Dokumen tidak ditemukan. (Error 404)");
          return;
        }

        if (!response.ok) {
          const errorMessage = `Gagal memuat detail dokumen. Status: ${response.status}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.data) {
          setError("Data dokumen kosong.");
          return;
        }

        setDocument(data.data);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(
          "Terjadi kesalahan saat mengambil data dokumen. Cek koneksi API."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentDetail();
  }, [encodedSlug, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <FiLoader className="animate-spin w-8 h-8 text-blue-600 mr-3" />
        <span className="text-xl font-medium text-gray-700">
          Memuat Detail Dokumen...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiList className="mr-2" /> Kembali ke Daftar Dokumen
        </button>
      </div>
    );
  }

  if (!document) return null;

  // --- TAMPILAN DETAIL DOKUMEN UTAMA ---
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition font-medium"
        >
          <FiArrowLeft className="mr-2" /> Kembali ke Daftar
        </button>

        <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl">
          <header className="border-b pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800 mb-1 flex items-center">
                <FiFileText className="mr-3 text-blue-600 w-7 h-7" />
                {document.title}
              </h1>
              <p className="text-sm text-gray-500 ml-10">
                Slug: {document.slug}
              </p>
            </div>

            <StatusBadge status={document.status} />
          </header>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-base text-gray-600 mb-8 border-b pb-4">
            <div className="flex items-center">
              <FiUser className="mr-2 text-gray-500" />
              Diunggah oleh:{" "}
              <span className="font-semibold">{document.Creator.username}</span>
            </div>
            <div className="flex items-center">
              <FiCalendar className="mr-2 text-gray-500" />
              Update Terakhir:{" "}
              <span className="font-semibold">
                {new Date(document.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center">
              <FiFileText className="mr-2 text-gray-500" />
              Versi: <span className="font-semibold">{document.version}</span>
            </div>
          </div>

          {/* Konten Utama */}
          <section className="text-gray-700">
            <h3 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-800">
              Konten Dokumen
            </h3>

            {/* PENTING: MENGGANTIKAN document.description dengan ReactMarkdown */}
            <div className="prose max-w-full text-gray-800">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {document.markdown_content ||
                  `Dokumen ini belum memiliki konten (Markdown content kosong). Deskripsi singkat: ${document.description}`}
              </ReactMarkdown>
            </div>

            {/* Tombol Aksi */}
            <div className="mt-8 pt-4 border-t flex space-x-4">
              <button
                onClick={() => alert(`Mendownload dokumen: ${document.title}`)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <FiDownload className="mr-2" /> Download File
              </button>

              {canEdit && (
                <button
                  onClick={() =>
                    router.push(`/documents/edit/${document.slug}`)
                  }
                  className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                >
                  <FiEdit className="mr-2" /> Edit Dokumen
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailPage;
