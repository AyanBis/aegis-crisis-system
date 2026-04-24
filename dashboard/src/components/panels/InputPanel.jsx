import { useState, useRef } from "react";
import Card from "../common/Card";
import { useApp } from "../../context/AppContext";

const InputPanel = () => {
  const { addIncident } = useApp();
  const [form, setForm] = useState({
    text: "",
    location: "",
  });
  
  // State to hold our files
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const onSubmit = (event) => {
    event.preventDefault();

    // Ensure they provided at least some data
    if (!form.text.trim() && !imageFile && !audioFile) {
      alert("Please provide a text description, an image, or an audio clip.");
      return;
    }

    // Pass everything to AppContext
    addIncident({
      text: form.text.trim(),
      location: form.location.trim() || "Unknown",
      image: imageFile,
      audio: audioFile,
    });

    // Reset the form after submitting
    setForm({ text: "", location: "" });
    setImageFile(null);
    setAudioFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  return (
    <Card title="Manual Incident Report">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "12px" }}>
        
        {/* TEXT INPUT */}
        <textarea
          value={form.text}
          placeholder="Describe the situation (e.g. 'Huge fire in the lobby...')"
          rows="3"
          onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            resize: "none"
          }}
        />

        {/* LOCATION INPUT */}
        <input
          type="text"
          value={form.location}
          placeholder="Location (e.g. Room 204)"
          onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)"
          }}
        />

        {/* FILE UPLOADS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>
              Upload Image
            </label>
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              onChange={(e) => setImageFile(e.target.files[0])}
              style={{ fontSize: "12px", width: "100%" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>
              Upload Audio
            </label>
            <input
              type="file"
              accept="audio/*"
              ref={audioInputRef}
              onChange={(e) => setAudioFile(e.target.files[0])}
              style={{ fontSize: "12px", width: "100%" }}
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
            marginTop: "4px"
          }}
        >
          Send to AI Engine
        </button>
      </form>
    </Card>
  );
};

export default InputPanel;