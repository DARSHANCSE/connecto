import { WebSocketServer, WebSocket } from "ws";
import { PrismaClient } from "@prisma/client";
import express from "express";
import http from "http";
import { Router } from "express";
import { backrouter } from "./Routers/backRouters";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
app.use(backrouter);
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const prisma = new PrismaClient();
let senderSocket: WebSocket | null = null;
let receiverSocket: WebSocket | null = null;

const clients: Map<WebSocket, { userId: string; groupId: number }> = new Map();

wss.on("connection", (ws: WebSocket) => {
  ws.on("error", console.error);

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());

    switch (message.medium) {
      case "websocket":
        if (message.type === "identify") {
          clients.set(ws, { userId: message.userId, groupId: message.groupId });
        } else if (message.type === "chat") {
          const sender = clients.get(ws);
          if (!sender) return;
          wss.clients.forEach((client) => {
            const info = clients.get(client);
            if (client !== ws && info?.groupId === message.to && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(message));
            }
          });
        }
        break;

      case "webrtc":
        switch (message.type) {
          case "identifyasSender":
            senderSocket = ws;
            break;
          case "identifyasreceiver":
            receiverSocket = ws;
            break;
          case "create-offer":
            if (ws === senderSocket && receiverSocket) {
              receiverSocket.send(JSON.stringify({ type: "offer", sdp: message.sdp }));
            }
            break;
          case "create-answer":
            if (ws === receiverSocket && senderSocket) {
              senderSocket.send(JSON.stringify({ type: "answer", sdp: message.sdp }));
            }
            break;
          case "iceCandidate":
            const target =
              ws === senderSocket ? receiverSocket :
              ws === receiverSocket ? senderSocket : null;
            if (target) {
              target.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
            }
            break;
        }
        break;
    }
  });

  ws.on("close", () => {
    if (ws === senderSocket) senderSocket = null;
    if (ws === receiverSocket) receiverSocket = null;
    clients.delete(ws);
  });
});

server.listen(6969,'0.0.0.0' ,()=>{
  console.log("Server is running on port 6969");
})
