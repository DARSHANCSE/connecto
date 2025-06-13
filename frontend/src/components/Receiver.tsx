import { useEffect, useRef } from "react";

export const Receiver = () => {
  const videoref = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const peer = new RTCPeerConnection();
    pc.current = peer;

    const socket = new WebSocket("ws://192.168.137.81:6969");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connection established");
      socket.send(JSON.stringify({ type: "identifyasreceiver" ,medium:"webrtc"}));
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        socket.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate ,medium:"webrtc"}));
      }
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);

      if (message.type === "offer") {
        await peer.setRemoteDescription(new RTCSessionDescription(message.sdp));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.send(JSON.stringify({ type: "create-answer", sdp: answer,medium:"webrtc" }));
      } else if (message.type === "iceCandidate") {
        await peer.addIceCandidate(message.candidate);
      }
    };


    peer.ontrack = (event) => {
      console.log("Received track:", event.track.kind);
      const stream = event.streams[0];
      if (event.track.kind === "video" && videoref.current) {
        videoref.current.srcObject = stream;
      } else if (event.track.kind === "audio" && audioRef.current) {
        audioRef.current.srcObject = stream;
      }
    };

    return () => {
      socket.close();
      peer.close();
    };
  }, []);

  return (
    <div>
      <div>Receiver</div>
      <div>Receiver</div>

      <video
        ref={videoref}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", height: "auto" }}
      />
      <audio ref={audioRef} autoPlay />
    </div>
  );
};
