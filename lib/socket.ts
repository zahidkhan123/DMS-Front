import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  if (typeof window === "undefined") return null;

  if (!socket) {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, socket connection skipped");
      return null;
    }

    const serverUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3000";
    
    socket = io(serverUrl, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    socket.on("connect", () => {
      console.log("Socket connected successfully");
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      // Don't log as error for normal disconnections
      if (reason === "io server disconnect") {
        console.log("Server disconnected the socket");
      }
    });

    socket.on("connect_error", (error) => {
      // Only log if it's not an authentication error or connection refused (server might be down)
      if (
        error.message !== "Authentication error" &&
        !error.message.includes("ECONNREFUSED") &&
        !error.message.includes("websocket error")
      ) {
        console.error("Socket connection error:", error.message);
      }
    });

    socket.on("connection:status", (data: { status: string; userId?: string; error?: string }) => {
      console.log("Connection status:", data);
      if (data.status === "error") {
        console.error("Socket error:", data.error);
      }
    });

    // Handle reconnection
    socket.io.on("reconnect", (attempt: number) => {
      console.log(`Socket reconnected after ${attempt} attempts`);
    });

    socket.io.on("reconnect_attempt", (attempt: number) => {
      // Only log first few attempts to reduce noise
      if (attempt <= 3) {
        console.log(`Reconnection attempt ${attempt}`);
      }
    });

    socket.io.on("reconnect_error", (error: Error) => {
      // Only log if it's not a connection refused error (server might be down)
      if (!error.message.includes("ECONNREFUSED") && !error.message.includes("websocket error")) {
        console.error("Reconnection error:", error);
      }
    });

    socket.io.on("reconnect_failed", () => {
      console.warn("Socket reconnection failed. Server may be offline.");
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

