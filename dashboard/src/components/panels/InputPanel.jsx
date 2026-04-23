import { useState } from "react";
import Card from "../common/Card";
import { useApp } from "../../context/AppContext";

const InputPanel = () => {
  const { addIncident } = useApp();
  const [form, setForm] = useState({
    type: "Fire",
    location: "",
    priority: "MEDIUM",
    confidence: 80,
  });

  const onSubmit = (event) => {
    event.preventDefault();

    if (!form.location.trim()) {
      return;
    }

    addIncident({
      id: Date.now(),
      type: form.type,
      location: form.location.trim(),
      priority: form.priority,
      status: "ACTIVE",
      confidence: Number(form.confidence),
      timestamp: "just now",
    });

    setForm((prev) => ({ ...prev, location: "" }));
  };

  return (
    <Card title="Input Panel">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "10px" }}>
        <select
          value={form.type}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, type: event.target.value }))
          }
        >
          <option value="Fire">Fire</option>
          <option value="Medical">Medical</option>
          <option value="Threat">Threat</option>
          <option value="Unknown">Unknown</option>
        </select>

        <input
          type="text"
          value={form.location}
          placeholder="Location"
          onChange={(event) =>
            setForm((prev) => ({ ...prev, location: event.target.value }))
          }
        />

        <select
          value={form.priority}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, priority: event.target.value }))
          }
        >
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>

        <label style={{ fontSize: "12px", color: "var(--muted)" }}>
          Confidence: {form.confidence}%
        </label>
        <input
          type="range"
          min="50"
          max="99"
          value={form.confidence}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, confidence: event.target.value }))
          }
        />

        <button
          type="submit"
          style={{
            padding: "8px 10px",
            borderRadius: "8px",
            border: "1px solid var(--accent)",
            background: "var(--accent)",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Add Incident
        </button>
      </form>
    </Card>
  );
};

export default InputPanel;
