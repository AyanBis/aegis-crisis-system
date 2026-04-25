import { useRef, useState } from "react";
import Card from "../common/Card";
import { useApp } from "../../context/AppContext";

const labelStyle = {
  fontSize: "12px",
  color: "var(--muted)",
  display: "block",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const uploadCardStyle = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  padding: "12px",
  background: "linear-gradient(180deg, var(--surface-raised), var(--surface))",
};

const InputPanel = () => {
  const { addIncident } = useApp();
  const [form, setForm] = useState({ text: "", location: "" });
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], "live_recording.webm", {
          type: "audio/webm",
        });
        setAudioFile(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!form.text.trim() && !imageFile && !audioFile) {
      alert("Please provide a text description, an image, or an audio clip.");
      return;
    }

    addIncident({
      text: form.text.trim(),
      location: form.location.trim() || "Unknown",
      image: imageFile,
      audio: audioFile,
    });

    setForm({ text: "", location: "" });
    setImageFile(null);
    setAudioFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  return (
    <Card
      title="Manual Incident Report"
      subtitle="Submit multimodal reports without changing the AI ingestion path."
    >
      <form onSubmit={onSubmit} className="stack-lg">
        <div className="panel-section panel-section--tinted stack-md">
          <div>
            <label style={labelStyle}>Situation Summary</label>
            <textarea
              value={form.text}
              placeholder="Describe the situation, hazard signs, or operator notes..."
              rows="5"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, text: event.target.value }))
              }
              style={{ resize: "none" }}
            />
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input
              type="text"
              value={form.location}
              placeholder="Location (for example: Room 204)"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, location: event.target.value }))
              }
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <div style={uploadCardStyle}>
            <label style={labelStyle}>Image Upload</label>
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            />
            <div style={{ color: "var(--muted)", fontSize: "12px", marginTop: "8px" }}>
              {imageFile ? imageFile.name : "Attach a still image for visual analysis."}
            </div>
          </div>

          <div style={uploadCardStyle}>
            <label style={labelStyle}>Audio Upload</label>
            <input
              type="file"
              accept="audio/*"
              ref={audioInputRef}
              onChange={(event) => setAudioFile(event.target.files?.[0] || null)}
            />
            <div style={{ color: "var(--muted)", fontSize: "12px", marginTop: "8px" }}>
              {audioFile ? audioFile.name : "Attach an audio sample or spoken operator note."}
            </div>
          </div>
        </div>

        <div className="panel-section panel-section--dashed stack-md">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div className="metric-tile__label">Live Audio Capture</div>
              <div style={{ color: "var(--muted)", marginTop: "4px" }}>
                Record directly from the browser when file upload is not available.
              </div>
            </div>
            {audioFile && (
              <div className="soft-pill">
                <span className="status-dot" style={{ background: "var(--success)" }} />
                Audio ready
              </div>
            )}
          </div>

          {!isRecording ? (
            <button type="button" className="button-secondary" onClick={startRecording}>
              Start Live Recording
            </button>
          ) : (
            <button type="button" className="button-danger" onClick={stopRecording}>
              Stop Recording
            </button>
          )}
        </div>

        <button type="submit" className="button-primary">
          Send to AI Engine
        </button>
      </form>
    </Card>
  );
};

export default InputPanel;
