import { useEffect, useRef, useState } from "react";
import Card from "../common/Card";

const API_BASE_URL = "http://127.0.0.1:8000";

const CCTVPanel = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [status, setStatus] = useState("Camera Off");
  const [aiLog, setAiLog] = useState("Awaiting AI analysis...");

  useEffect(() => {
    let activeStream = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        activeStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((error) => console.error("Video play error:", error));
          setStatus("Camera active / standby");
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setStatus("Camera error / check permissions");
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
      setStatus("Monitoring / analyzing frames");
      setAiLog("Streaming frames to vision engine...");
      interval = setInterval(captureAndSendFrame, 5000);
    } else {
      if (videoRef.current?.srcObject) {
        setStatus("Camera active / standby");
      }
      setAiLog("AI monitoring paused");
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
      formData.append("frame", blob, "cctv_frame.jpg");

      try {
        const response = await fetch(`${API_BASE_URL}/cctv-frame`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error(`Server returned ${response.status}`);

        const data = await response.json();

        const detectedItems = data.detections || data.objects || [];
        if (detectedItems.length > 0) {
          setAiLog(`Alert: detected ${detectedItems.join(", ")}`);
        } else if (
          data.crisis_type &&
          data.crisis_type !== "None" &&
          data.crisis_type !== "unknown"
        ) {
          setAiLog(`Alert: ${String(data.crisis_type).toUpperCase()} detected`);
        } else {
          setAiLog("Scene clear / no threats detected");
        }
      } catch (error) {
        console.error("CCTV feed error:", error);
        setAiLog("Backend connection error");
      }
    }, "image/jpeg");
  };

  const isAlert = aiLog.toLowerCase().includes("alert");
  const isClear = aiLog.toLowerCase().includes("scene clear");

  return (
    <Card
      title="Live CCTV Feed"
      subtitle="Browser webcam monitoring, styled without changing the frame-analysis path."
    >
      <div className="stack-lg">
        <div
          style={{
            position: "relative",
            width: "100%",
            minHeight: "280px",
            borderRadius: "var(--radius)",
            overflow: "hidden",
            background: "#050b14",
            border: "1px solid var(--border)",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => videoRef.current?.play()}
            style={{
              width: "100%",
              minHeight: "280px",
              objectFit: "cover",
              display: "block",
              transform: "scaleX(-1)",
            }}
          />

          <div
            className="soft-pill"
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: "rgba(5, 11, 20, 0.72)",
              color: isMonitoring ? "#ff8b8b" : "#f5f7fb",
              borderColor: "rgba(255, 255, 255, 0.12)",
            }}
          >
            <span
              className="status-dot"
              style={{ background: isMonitoring ? "var(--danger)" : "var(--success)" }}
            />
            {isMonitoring ? "REC / AI ON" : "LIVE"}
          </div>
        </div>

        <div className="panel-section panel-section--tinted stack-md">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div className="soft-pill">
              <span className="status-dot" style={{ background: "var(--accent)" }} />
              Status <strong>{status}</strong>
            </div>

            <button
              type="button"
              className={isMonitoring ? "button-danger" : "button-primary"}
              onClick={() => setIsMonitoring((prev) => !prev)}
            >
              {isMonitoring ? "Stop AI Monitoring" : "Start AI Monitoring"}
            </button>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--surface-raised)",
              border: "1px dashed var(--border)",
              fontSize: "13px",
              fontWeight: 600,
              color: isAlert ? "var(--danger)" : isClear ? "var(--success)" : "var(--text)",
            }}
          >
            {aiLog}
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </Card>
  );
};

export default CCTVPanel;
