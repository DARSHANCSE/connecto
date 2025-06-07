import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 6969 });

let senderSocket: WebSocket | null = null;
let receiverSocket: WebSocket | null = null;

wss.on("connection", (ws: any) => {
  ws.on("error", (err: any) => {
    console.error("WebSocket error:", err);
  });

  ws.on("message", (data: any) => {
    const message = JSON.parse(data.toString());
    console.log("Received message:", message.type);

    switch (message.type) {
      case "identifyasSender":
        senderSocket = ws;
        console.log("Sender connected");
        break;

      case "identifyasreceiver":
        receiverSocket = ws;
        console.log("Receiver connected");
        break;

      case "create-offer":
        if (ws !== senderSocket) return;
        if (receiverSocket) {
          receiverSocket.send(JSON.stringify({ type: "offer", sdp: message.sdp }));
        } else {
          console.warn("Receiver not connected");
        }
        break;

      case "create-answer":
        if (ws !== receiverSocket) return;
        if (senderSocket) {
          senderSocket.send(JSON.stringify({ type: "answer", sdp: message.sdp }));
        } else {
          console.warn("Sender not connected");
        }
        break;

      case "iceCandidate":
        const target =
          ws === senderSocket ? receiverSocket : ws === receiverSocket ? senderSocket : null;
        if (target) {
          target.send(
            JSON.stringify({ type: "iceCandidate", candidate: message.candidate })
          );
        } else {
          console.warn("No target socket available for ICE candidate");
        }
        break;
    }
  });

  ws.on("close", () => {
    if (ws === senderSocket) {
      console.log("Sender disconnected");
      senderSocket = null;
    } else if (ws === receiverSocket) {
      console.log("Receiver disconnected");
      receiverSocket = null;
    }
  });
});
