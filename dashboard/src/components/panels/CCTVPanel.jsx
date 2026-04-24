import { useEffect, useRef, useState } from "react";
import Card from "../common/Card";

const API_BASE_URL = "http://127.0.0.1:8000";

const CCTVPanel = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [status, setStatus] = useState("Camera Off");
  const [aiLog, setAiLog] = useState("Awaiting AI Analysis..."); 

  useEffect(() => {
    let activeStream = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        activeStream = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Video play error:", e));
          setStatus("Camera Active - Standby");
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setStatus("Camera Error (Check Permissions)");
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isMonitoring) {
      setStatus("Monitoring... Analyzing frames");
      setAiLog("Streaming frames to vision engine...");
      // Auto-fetch loop: Capture a frame every 5 seconds
      interval = setInterval(captureAndSendFrame, 5000); 
    } else {
      if (videoRef.current?.srcObject) {
        setStatus("Camera Active - Standby");
      }
      setAiLog("AI Monitoring Paused");
    }
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const captureAndSendFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      // MUST be named "frame" for your backend!
      formData.append("frame", blob, "cctv_frame.jpg"); 

      try {
        const res = await fetch(`${API_BASE_URL}/cctv-frame`, {
          method: "POST",
          body: formData,
        });
        
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        
        const data = await res.json();
        
        const detectedItems = data.detections || data.objects || [];
        if (detectedItems.length > 0) {
          setAiLog(`⚠️ Detected: ${detectedItems.join(", ")}`);
        } else if (data.crisis_type && data.crisis_type !== "None" && data.crisis_type !== "unknown") {
          setAiLog(`⚠️ Alert: ${String(data.crisis_type).toUpperCase()} DETECTED!`);
        } else {
          setAiLog("✅ Scene Clear (No threats detected)");
        }
      } catch (error) {
        console.error("CCTV feed error:", error);
        setAiLog("❌ Backend Connection Error");
      }
    }, "image/jpeg");
  };

  return (
    <Card title="Live CCTV Feed (Webcam)">
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ position: "relative", width: "100%", minHeight: "220px", borderRadius: "8px", overflow: "hidden", background: "#000" }}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            onLoadedMetadata={() => videoRef.current?.play()}
            style={{ width: "100%", minHeight: "220px", objectFit: "cover", display: "block", transform: "scaleX(-1)" }} 
          />
          <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", color: isMonitoring ? "#ff4d4f" : "#fff" }}>
            {isMonitoring ? "● REC (AI ON)" : "LIVE"}
          </div>
        </div>
        
        <div style={{ fontSize: "12px", color: "var(--muted)" }}>Status: {status}</div>

        <div style={{
          padding: "8px 12px", borderRadius: "6px", background: "var(--surface-strong)", border: "1px dashed var(--border)",
          fontSize: "13px", fontWeight: "bold", textAlign: "center",
          color: aiLog.includes("⚠️") ? "#ff4d4f" : aiLog.includes("✅") ? "#4cd964" : "var(--text)"
        }}>
          {aiLog}
        </div>

        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          style={{
            padding: "8px", background: isMonitoring ? "transparent" : "var(--accent)", border: isMonitoring ? "1px solid #ff4d4f" : "none",
            color: isMonitoring ? "#ff4d4f" : "#fff", borderRadius: "6px", cursor: "pointer", fontWeight: "bold"
          }}
        >
          {isMonitoring ? "Stop AI Monitoring" : "Start AI Monitoring"}
        </button>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </Card>
  );
};

export default CCTVPanel;

