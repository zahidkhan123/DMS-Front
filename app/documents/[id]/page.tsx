"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { getSocket } from "@/lib/socket";
import toast from "react-hot-toast";
import { formatDateTime } from "@/lib/dateUtils";

interface Document {
  id: string;
  name: string;
  description?: string;
  category?: string;
  s3_url: string;
  s3_key: string;
  file_size: number;
  file_type: string;
  created_at: string;
  updated_at: string;
}

export default function DocumentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.push("/login");
      return;
    }

    fetchDocument();

    // Setup socket listeners for real-time updates
    const socket = getSocket();
    if (socket) {
      socket.on("document:updated", (data: { document: Document }) => {
        if (data.document.id === documentId) {
          setDocument(data.document);
          // Notification toast will be shown by NotificationBell component
        }
      });

      socket.on("document:deleted", (data: { documentId: string }) => {
        if (data.documentId === documentId) {
          // Notification toast will be shown by NotificationBell component
          router.push("/dashboard");
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("document:updated");
        socket.off("document:deleted");
      }
    };
  }, [documentId, router]);

  const fetchDocument = async () => {
    try {
      const response = await api.get(`/documents/${documentId}`);
      if (response.data.success) {
        setDocument(response.data.data.document);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch document");
      if (error.response?.status === 404) {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await api.delete(`/documents/${documentId}`);
      if (response.data.success) {
        // Notification toast will be shown by NotificationBell component
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading document...</p>
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
          <Link href="/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold hover:underline">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mr-4 font-semibold transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Link>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Document Details
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-xl hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{document.name}</h3>
                  {document.description && (
                    <p className="text-gray-600 mt-2">{document.description}</p>
                  )}
                </div>
                <div className="ml-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
                    {document.category || "Uncategorized"}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-5 border border-gray-200/50">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">File Type</dt>
                  <dd className="text-lg font-semibold text-gray-900">{document.file_type}</dd>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-5 border border-gray-200/50">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">File Size</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatFileSize(document.file_size)}</dd>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-5 border border-gray-200/50">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Created At</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatDateTime(document.created_at)}</dd>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-5 border border-gray-200/50">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Last Updated</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatDateTime(document.updated_at)}</dd>
                </div>
              </div>

              {/* Document URL */}
              <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200/50">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Document URL</dt>
                <dd className="mt-2">
                  <a
                    href={document.s3_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-700 break-all hover:underline font-medium"
                  >
                    {document.s3_url}
                  </a>
                </dd>
              </div>

              {/* Action Button */}
              <div className="mt-6 flex justify-center">
                <a
                  href={document.s3_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Document
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

