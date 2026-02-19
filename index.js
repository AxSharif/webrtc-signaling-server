// server/index.js
// Simple WebSocket signaling server for WebRTC

const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// Map of userId -> WebSocket
const clients = new Map();

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.error("Invalid JSON:", msg);
      return;
    }

    // First message from client should be a register event
    if (data.type === "register") {
      const { userId } = data;
      if (!userId) return;
      clients.set(userId, ws);
      console.log(`Registered user: ${userId}`);
      return;
    }

    // Forward signaling messages to target user
    const { to } = data;
    if (!to) return;

    const targetSocket = clients.get(to);
    if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
      targetSocket.send(JSON.stringify(data));
    }
  });

  ws.on("close", () => {
    // Remove disconnected client from map
    for (const [userId, socket] of clients.entries()) {
      if (socket === ws) {
        clients.delete(userId);
        console.log(`User disconnected: ${userId}`);
        break;
      }
    }
  });
});

console.log(`Signaling server running on ws://localhost:${PORT}`);
