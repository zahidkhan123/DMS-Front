"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/axios";
import { getSocket } from "@/lib/socket";
import toast from "react-hot-toast";
import { formatShortRelativeTime } from "@/lib/dateUtils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Setup socket listener
    const socket = getSocket();
    if (socket) {
      socket.on("notification:new", (data: { notification: Notification }) => {
        // Play sound
        playNotificationSound();
        
        // Add to notifications list
        setNotifications((prev) => [data.notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Show toast with message (not title) - auto-dismiss after 5 seconds
        toast.success(data.notification.message, {
          duration: 5000,
          position: "top-right",
        });
      });
    }

    return () => {
      if (socket) {
        socket.off("notification:new");
      }
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications");
      if (response.data.success) {
        const notifications = response.data.data.notifications || [];
        setNotifications(notifications);
      }
    } catch (error: any) {
      // Failed to fetch notifications
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/notifications/unread/count");
      if (response.data.success) {
        const count = response.data.data.count || 0;
        setUnreadCount(count);
      }
    } catch (error: any) {
      // Failed to fetch unread count
    }
  };

  const playNotificationSound = () => {
    try {
      if (audioRef.current && audioRef.current.readyState >= 2) {
        audioRef.current.play().catch(() => {
          // Ignore audio play errors (user might have blocked autoplay or file missing)
        });
      }
    } catch (error) {
      // Ignore audio errors (file might not exist)
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.put("/notifications/read/all");
      if (response.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error: any) {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <>
      {/* Hidden audio element for notification sound (optional) */}
      <audio ref={audioRef} preload="none" onError={() => {
        // Silently handle missing audio file
      }}>
        <source src="/notification.mp3" type="audio/mpeg" onError={() => {
          // Silently handle missing audio file
        }} />
      </audio>

      <div className="relative">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              fetchNotifications();
              fetchUnreadCount();
            }
          }}
          className="relative p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg
            className="w-6 h-6 transition-transform duration-200 hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold flex items-center justify-center shadow-lg animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-3 w-96 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl z-50 border border-gray-200/50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="p-5 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Loading...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 cursor-pointer transition-all duration-200 ${
                        !notification.read ? "bg-gradient-to-r from-indigo-50/30 to-blue-50/30" : ""
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          handleMarkAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            {!notification.read && (
                              <span className="mt-1.5 h-2 w-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex-shrink-0"></span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-semibold ${
                                  !notification.read
                                    ? "text-gray-900"
                                    : "text-gray-600"
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatShortRelativeTime(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-200/50 bg-gray-50/50 text-center">
                <a
                  href="/notifications"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 hover:underline"
                >
                  View all notifications
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

