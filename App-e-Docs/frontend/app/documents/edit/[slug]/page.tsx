"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiSave,
  FiLoader,
  FiFileText,
  FiTag,
  FiAlertTriangle,
  FiBold,
  FiItalic,
  FiList,
  FiType,
  FiLink,
  FiCode,
  FiList as FiListIcon,
} from "react-icons/fi";

// URL API dan Role yang Sesuai
const BASE_URL = "http://localhost:3200/api";
const EDITOR_ROLES = ["admin", "editor"];

// --- DEFINISI TIPE ---
interface DocumentForm {
  title: string;
  description: string;
  markdown_content: string;
  version: string;
}

// -----------------------------------------------------------------------------
// --- FUNGSI HELPER: Kenaikan Versi Otomatis ---
// -----------------------------------------------------------------------------
const calculateNextVersion = (currentVersion: string): string => {
  if (
    !currentVersion ||
    typeof currentVersion !== "string" ||
    !currentVersion.includes(".")
  ) {
    return "1.1";
  }

  try {
    const parts = currentVersion.split(".");
    const major = parseInt(parts[0]);
    let minor = parseInt(parts[1]);

    if (isNaN(major) || isNaN(minor)) {
      return "1.1";
    }

    // Naikkan versi minor
    minor += 1;

    return `${major}.${minor}`;
  } catch (e) {
    return "1.1";
  }
};

// -----------------------------------------------------------------------------
// --- Komponen Styling Reusable ---
// -----------------------------------------------------------------------------

const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  children,
  ...props
}) => (
  <label {...props} className="block text-sm font-semibold text-gray-700 mb-2">
    {children}
  </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props
) => (
  <input
    {...props}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 text-gray-900"
  />
);

const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => (
  <textarea
    {...props}
    ref={ref}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 resize-y text-gray-900"
  />
));
TextArea.displayName = "TextArea";

// -----------------------------------------------------------------------------
// --- KOMPONEN MARKDOWN TOOLBAR ---
// -----------------------------------------------------------------------------

interface ToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setMarkdown: (value: string) => void;
}

const MarkdownToolbar: React.FC<ToolbarProps> = ({
  textareaRef,
  setMarkdown,
}) => {
  const applyFormat = (format: string, placeholder: string = "teks") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const currentValue = textarea.value;

    let newText = "";
    let newCursorPos = 0;

    switch (format) {
      case "bold":
        newText = `**${selectedText || placeholder}**`;
        newCursorPos =
          start + 2 + (selectedText ? selectedText.length : placeholder.length);
        break;
      case "italic":
        newText = `*${selectedText || placeholder}*`;
        newCursorPos =
          start + 1 + (selectedText ? selectedText.length : placeholder.length);
        break;
      case "header":
        newText = `\n## ${selectedText || placeholder}`;
        newCursorPos =
          start + 4 + (selectedText ? selectedText.length : placeholder.length);
        break;
      case "link":
        newText = `[${selectedText || placeholder}](url)`;
        newCursorPos =
          start + (selectedText ? selectedText.length : placeholder.length) + 3;
        break;
      case "ul":
        const lines = (selectedText || placeholder).split("\n");
        newText = lines.map((line) => `* ${line}`).join("\n");
        newCursorPos = start + newText.length;
        break;
      case "ol":
        const linesOl = (selectedText || placeholder).split("\n");
        newText = linesOl
          .map((line, index) => `${index + 1}. ${line}`)
          .join("\n");
        newCursorPos = start + newText.length;
        break;
      case "code":
        newText = `\`${selectedText || placeholder}\``;
        newCursorPos =
          start + 1 + (selectedText ? selectedText.length : placeholder.length);
        break;
      default:
        return;
    }

    const newValue =
      currentValue.substring(0, start) + newText + currentValue.substring(end);
    setMarkdown(newValue);

    setTimeout(() => {
      if (textarea) {
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;
        textarea.focus();
      }
    }, 0);
  };

  const Button = ({
    icon,
    label,
    format,
    placeholder,
  }: {
    icon: React.ReactElement;
    label: string;
    format: string;
    placeholder?: string;
  }) => (
    <button
      type="button"
      title={label}
      onClick={() => applyFormat(format, placeholder)}
      className="p-2 text-gray-600 hover:bg-gray-200 rounded transition duration-150"
    >
      {icon}
    </button>
  );

  return (
    <div className="flex space-x-1 p-2 bg-gray-50 border border-gray-300 rounded-t-lg">
      <Button icon={<FiBold />} label="Bold (**teks**)" format="bold" />
      <Button icon={<FiItalic />} label="Italic (*teks*)" format="italic" />
      <span className="border-l border-gray-300 mx-2"></span>
      <Button
        icon={<FiType />}
        label="Header (##)"
        format="header"
        placeholder="Judul Bagian"
      />
      <span className="border-l border-gray-300 mx-2"></span>
      <Button
        icon={<FiList />}
        label="List (Unordered)"
        format="ul"
        placeholder="item list"
      />
      <Button
        icon={<FiList className="rotate-90" />}
        label="List (Ordered)"
        format="ol"
        placeholder="item list"
      />
      <span className="border-l border-gray-300 mx-2"></span>
      <Button
        icon={<FiLink />}
        label="Link [teks](url)"
        format="link"
        placeholder="Nama Link"
      />
      <Button icon={<FiCode />} label="Inline Code (`code`)" format="code" />
    </div>
  );
};

// -----------------------------------------------------------------------------
// --- KOMPONEN UTAMA EDIT DOKUMEN ---
// -----------------------------------------------------------------------------

const EditDocumentPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const encodedSlug = params.slug as string;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [currentOldVersion, setCurrentOldVersion] = useState<string>("1.0"); // State untuk versi lama
  const [formData, setFormData] = useState<DocumentForm>({
    title: "",
    description: "",
    markdown_content: "",
    version: "1.0",
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [canAccess, setCanAccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // --- 1. PROTEKSI ROLE & FETCH DATA LAMA ---
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userRole =
      typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
    const currentSlug = encodedSlug ? decodeURIComponent(encodedSlug) : null;

    if (!authToken) {
      router.push("/login");
      return;
    }

    if (!userRole || !EDITOR_ROLES.includes(userRole)) {
      alert(
        `Akses Ditolak! Halaman ini hanya untuk peran ${EDITOR_ROLES.join(
          " atau "
        )}.`
      );
      router.push("/");
      return;
    }

    if (!currentSlug) {
      setError("Slug dokumen tidak valid.");
      setLoading(false);
      return;
    }

    setToken(authToken);
    setCanAccess(true);
    setOriginalSlug(currentSlug);

    // --- FETCH DATA LAMA ---
    const fetchOldData = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/document/slug/${currentSlug}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.status === 404) {
          setError("Dokumen tidak ditemukan.");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Gagal memuat data dokumen lama.");
        }

        const data = await response.json();
        const doc = data.data;

        const oldVersion = doc.version || "1.0";
        const nextVersion = calculateNextVersion(oldVersion);

        setCurrentOldVersion(oldVersion);

        setFormData({
          title: doc.title || "",
          description: doc.description || "",
          markdown_content: doc.markdown_content || "",
          version: nextVersion,
        });
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Terjadi kesalahan saat mengambil data dokumen.");
      } finally {
        setLoading(false);
      }
    };

    fetchOldData();
  }, [router, encodedSlug]);

  // --- 2. HANDLE INPUT CHANGE ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setMarkdown = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      markdown_content: value,
    }));
  };

  // --- 3. HANDLE SUBMIT (UPDATE) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !originalSlug) return;

    if (!formData.title || !formData.markdown_content) {
      setMessage({
        type: "error",
        text: "Judul dan Konten Utama wajib diisi!",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const dataToSend = {
      title: formData.title,
      description: formData.description,
      markdown_content: formData.markdown_content,
      version: formData.version,
    };

    try {
      // KRITIS: MENGGUNAKAN URL BACKEND YANG SESUAI (PUT /api/document/update/:slug)
      const response = await fetch(
        `${BASE_URL}/document/update/${originalSlug}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dataToSend),
        }
      );

      // --- PENANGANAN ERROR JSON YANG TANGGUH ---
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend Status:", response.status);
        console.error("Backend Error Text:", errorText);

        try {
          const result = JSON.parse(errorText);
          const errorMsg =
            result.message || "Gagal mengupdate dokumen (Backend JSON error).";
          setMessage({ type: "error", text: errorMsg });
        } catch (e) {
          setMessage({
            type: "error",
            text: `Kesalahan Server (${response.status}): Cek konsol untuk detail error (HTML/non-JSON).`,
          });
        }
        return;
      }

      const result = await response.json();

      if (response.ok) {
        const updatedSlug = result.data.slug || originalSlug;
        setMessage({
          type: "success",
          text: `Dokumen "${result.data.title}" berhasil diupdate! Mengalihkan...`,
        });

        setTimeout(() => {
          router.push(`/documents/${encodeURIComponent(updatedSlug)}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Update Document Error (Catch Blok):", error);
      setMessage({
        type: "error",
        text: "Terjadi kesalahan jaringan/server saat mengupdate dokumen.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- TAMPILAN LOADING/ERROR ---
  if (loading || !canAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <FiLoader className="animate-spin w-8 h-8 text-red-600 mr-3" />
        <span className="text-xl font-medium text-gray-700">
          {error ? `ERROR: ${error}` : "Memuat data dan memverifikasi akses..."}
        </span>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="p-8 min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiListIcon className="mr-2" /> Kembali ke Daftar Dokumen
        </button>
      </div>
    );
  }

  // --- TAMPILAN FORM UTAMA ---
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 transition font-medium"
          >
            <FiArrowLeft className="mr-2" /> Kembali
          </button>
          <h1 className="text-3xl font-extrabold text-gray-800">
            <FiFileText className="mr-2 inline-block text-yellow-600" /> Edit
            Dokumen: {formData.title || originalSlug}
          </h1>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl shadow-2xl space-y-6"
        >
          {/* Input Judul */}
          <div>
            <Label htmlFor="title">
              Judul Dokumen <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Contoh: Kebijakan Keamanan Versi 2.0"
            />
          </div>

          {/* Input Versi (Editable) */}
          <div>
            <Label htmlFor="version">Nomor Versi Saat Ini</Label>
            <Input
              id="version"
              name="version"
              value={formData.version}
              onChange={handleChange}
              placeholder="Misal: 1.0"
            />
            {/* PESAN TAMPILAN BARU */}
            <p className="text-xs text-gray-500 mt-1">
              Versi dokumen otomatis dinaikkan dari **{currentOldVersion}**
              menjadi **{formData.version}**. Ubah di sini hanya jika ini adalah
              rilis *major* (misal, dari 1.x ke 2.0).
            </p>
          </div>

          {/* Input Deskripsi Singkat */}
          <div>
            <Label htmlFor="description">Deskripsi Singkat</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="Ringkasan singkat tentang isi dokumen (Opsional)."
            />
          </div>

          {/* Input Konten Utama (Markdown) */}
          <div>
            <Label htmlFor="markdown_content">
              Konten Utama (Markdown) <span className="text-red-500">*</span>
            </Label>

            {/* TOOLBAR MARKDOWN */}
            <MarkdownToolbar
              textareaRef={textareaRef}
              setMarkdown={setMarkdown}
            />

            <TextArea
              ref={textareaRef}
              id="markdown_content"
              name="markdown_content"
              value={formData.markdown_content}
              onChange={handleChange}
              required
              rows={15}
              placeholder="Tulis konten dokumen di sini. Gunakan tombol di atas untuk bantuan format."
            />
            <p className="text-xs text-gray-500 mt-1">
              <FiTag className="inline-block mr-1" /> Konten ini wajib diisi.
            </p>
          </div>

          {/* Pesan Status */}
          {message && (
            <div
              className={`p-3 rounded-lg border text-sm flex items-center ${
                message.type === "success"
                  ? "bg-green-100 border-green-400 text-green-700"
                  : "bg-red-100 border-red-400 text-red-700"
              }`}
            >
              <FiAlertTriangle className="mr-2 w-5 h-5" />
              {message.text}
            </div>
          )}

          {/* Tombol Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center py-3 bg-yellow-600 text-white rounded-lg font-bold hover:bg-yellow-700 transition duration-300 disabled:bg-yellow-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FiLoader className="animate-spin mr-2 w-5 h-5" />
                Menyimpan Perubahan...
              </>
            ) : (
              <>
                <FiSave className="mr-2 w-5 h-5" />
                Simpan Perubahan Dokumen
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditDocumentPage;
