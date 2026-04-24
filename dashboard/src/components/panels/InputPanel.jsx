import { useState, useRef } from "react";
import Card from "../common/Card";
import { useApp } from "../../context/AppContext";

const InputPanel = () => {
  const { addIncident } = useApp();
  const [form, setForm] = useState({ text: "", location: "" });
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  // --- NEW: Audio Recording States ---
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
        // Create a File object from the Blob to send to the backend
        const file = new File([audioBlob], "live_recording.webm", { type: "audio/webm" });
        setAudioFile(file);
        
        // Stop the microphone tracks
        stream.getTracks().forEach(track => track.stop());
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
    <Card title="Manual Incident Report">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "12px" }}>
        
        <textarea
          value={form.text}
          placeholder="Describe the situation..."
          rows="3"
          onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
          style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", resize: "none" }}
        />

        <input
          type="text"
          value={form.location}
          placeholder="Location (e.g. Room 204)"
          onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
          style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
        />

        {/* FILE & AUDIO UPLOADS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Image</label>
            <input type="file" accept="image/*" ref={imageInputRef} onChange={(e) => setImageFile(e.target.files[0])} style={{ fontSize: "12px", width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Audio File</label>
            <input type="file" accept="audio/*" ref={audioInputRef} onChange={(e) => setAudioFile(e.target.files[0])} style={{ fontSize: "12px", width: "100%" }} />
          </div>
        </div>

        {/* LIVE AUDIO RECORDING CONTROLS */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", borderTop: "1px dashed var(--border)", paddingTop: "10px" }}>
          {!isRecording ? (
            <button type="button" onClick={startRecording} style={{ flex: 1, padding: "8px", background: "var(--surface-strong)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", cursor: "pointer" }}>
              🎤 Start Live Recording
            </button>
          ) : (
            <button type="button" onClick={stopRecording} style={{ flex: 1, padding: "8px", background: "rgba(255, 77, 79, 0.2)", border: "1px solid #ff4d4f", color: "#ff4d4f", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
              ⏹ Stop Recording (Listening...)
            </button>
          )}
          {audioFile && <span style={{ fontSize: "12px", color: "#4cd964" }}>✅ Audio Ready</span>}
        </div>

        <button
          type="submit"
          style={{ padding: "10px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontWeight: "bold", marginTop: "4px" }}
        >
          Send to AI Engine
        </button>
      </form>
    </Card>
  );
};

export default InputPanel;