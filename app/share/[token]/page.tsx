"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface Document {
  id: string;
  name: string;
  description?: string;
  category?: string;
  s3_url: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedDocument();
  }, [token]);

  const fetchSharedDocument = async () => {
    try {
      const response = await api.get(`/documents/share/${token}`);
      if (response.data.success) {
        setDocument(response.data.data.document);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load shared document");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading shared document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-200/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Document not found</h1>
          <p className="text-gray-600">This shared link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Shared Document
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="px-6 py-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200/50">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{document.name}</h3>
              {document.description && <p className="text-gray-600 mt-2">{document.description}</p>}
            </div>

            <div className="p-6">
              <div className="mb-6">
                {document.file_type.startsWith("image/") || ["png", "jpg", "jpeg"].includes(document.file_type.split("/").pop() || "") ? (
                  <img src={document.s3_url} alt={document.name} className="max-w-full h-auto mx-auto rounded-lg shadow-lg" />
                ) : document.file_type === "application/pdf" || document.file_type.includes("pdf") ? (
                  <iframe src={document.s3_url} className="w-full h-full min-h-[600px] rounded-lg border border-gray-200" />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    <a
                      href={document.s3_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Open in New Tab
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200/50">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">File Type</dt>
                  <dd className="text-lg font-semibold text-gray-900">{document.file_type}</dd>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200/50">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">File Size</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatFileSize(document.file_size)}</dd>
                </div>
              </div>

              <div className="flex justify-center">
                <a
                  href={document.s3_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Document
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

