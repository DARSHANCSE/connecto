import { useEffect, useRef, useState } from "react";

export const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const videoref = useRef<HTMLVideoElement | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const peer = new RTCPeerConnection();
    pc.current = peer;

    const ws = new WebSocket("ws://1localhost:6969");
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      ws.send(JSON.stringify({ medium:"webrtc",type: "identifyasSender" }));
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        ws.send(JSON.stringify({ medium:"webrtc",type: "iceCandidate", candidate: event.candidate }));  
      }
    };

    peer.onnegotiationneeded = async () => {
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        console.log("Sending offer...");
        ws.send(JSON.stringify({ medium:"webrtc",type: "create-offer", sdp: offer }));
      } catch (err) {
        console.error("Negotiation error:", err);
      }
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "answer") {
        await peer.setRemoteDescription(new RTCSessionDescription(message.sdp));
      } else if (message.type === "iceCandidate") {
        await peer.addIceCandidate(message.candidate);
      }
    };

    return () => {
      ws.close();
      peer.close();
    };
  }, []);

  const sendvideo = async () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not ready");
      return;
    }

    try {
      console.log("hell0")
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoref.current) videoref.current.srcObject = stream;

      const peer = pc.current!;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  };

  return (
    <div>
      <div>Sender</div>
      <video
        ref={videoref}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", height: "auto" }}
      ></video>
      <button onClick={sendvideo}>send video</button>
    </div>
  );
};
