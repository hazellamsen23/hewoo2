import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

interface GuestbookEntry {
  id: string;
  profileUserId: string;
  authorId: string | null;
  authorName: string;
  message: string;
  sticker: string;
  gifUrl: string;
  voiceData: string;
  createdAt: string;
}

const STICKERS = ["🌸", "💕", "✨", "🦋", "🌈", "💖", "🎀", "🌺", "💫", "⭐", "🌙", "🎵", "🍓", "🌼", "🦄", "💜", "🔮", "🌟", "💎", "🌻"];

const GuestbookPage: React.FC = () => {
  const { profile } = useAppContext();
  const { user } = useAuth();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [guestName, setGuestName] = useState("");
  const [selectedSticker, setSelectedSticker] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [voiceData, setVoiceData] = useState("");
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const loadEntries = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const data = await api.guestbook.getEntries(profile.id);
      setEntries(data);
    } catch {} finally { setLoading(false); }
  }, [profile?.id]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = (ev) => setVoiceData(ev.target?.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch { alert("Microphone access denied"); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !voiceData && !selectedSticker && !gifUrl) return;
    if (!profile?.id) return;
    setSubmitting(true);
    try {
      const entry = await api.guestbook.addEntry(profile.id, {
        message,
        authorName: user?.displayName || guestName || "Anonymous Visitor",
        sticker: selectedSticker,
        gifUrl,
        voiceData,
      });
      setEntries((prev) => [entry, ...prev]);
      setMessage(""); setGuestName(""); setSelectedSticker(""); setGifUrl(""); setVoiceData("");
    } catch (err: any) { alert(err.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (entryId: string) => {
    if (!profile?.id || !confirm("Delete this entry?")) return;
    try {
      await api.guestbook.deleteEntry(profile.id, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (e: any) { alert(e.message); }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      <div className="box">
        <div className="box-header">📖 Sign the Guestbook!</div>
        <form onSubmit={handleSubmit} style={{ padding: "14px" }}>
          {!user && (
            <div className="auth-field" style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "11px", fontWeight: "bold", display: "block", marginBottom: "3px" }}>Your Name</label>
              <input
                className="wall-url-input"
                style={{ width: "100%" }}
                placeholder="Anonymous Visitor"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>
          )}

          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "bold", display: "block", marginBottom: "3px" }}>Message</label>
            <textarea
              className="wall-textarea"
              placeholder="Leave a message! ✨ (hi nice profile! 🌸)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Pick a Sticker</label>
            <div className="sticker-picker">
              {STICKERS.map((s) => (
                <span
                  key={s}
                  className={`sticker-option ${selectedSticker === s ? "sticker-selected" : ""}`}
                  onClick={() => setSelectedSticker(selectedSticker === s ? "" : s)}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "bold", display: "block", marginBottom: "3px" }}>GIF URL (paste from Tenor/Giphy)</label>
            <input
              className="wall-url-input"
              style={{ width: "100%" }}
              placeholder="https://media.tenor.com/..."
              value={gifUrl}
              onChange={(e) => setGifUrl(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "11px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Voice Message</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                type="button"
                className={`upload-btn ${recording ? "recording-btn" : ""}`}
                onClick={recording ? stopRecording : startRecording}
              >
                {recording ? "⏹ Stop Recording" : "🎙 Record Voice"}
              </button>
              {voiceData && (
                <>
                  <audio src={voiceData} controls style={{ height: "30px" }} />
                  <button type="button" className="remove-img-btn" onClick={() => setVoiceData("")}>✕</button>
                </>
              )}
            </div>
          </div>

          <button type="submit" className="wall-post-btn" disabled={submitting}>
            {submitting ? "Signing..." : "💌 Sign Guestbook"}
          </button>
        </form>
      </div>

      <div className="wall-feed-header">
        <span className="wall-feed-title">💌 Guestbook Entries</span>
        <span className="wall-count">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
      </div>

      {loading && <div className="box empty-state"><p>Loading... 🌸</p></div>}

      {!loading && entries.length === 0 && (
        <div className="box empty-state"><p>No entries yet! Be the first to sign! 🌸</p></div>
      )}

      <div className="guestbook-entries">
        {entries.map((entry) => (
          <div key={entry.id} className="guestbook-entry">
            <div className="guestbook-entry-header">
              <img
                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${entry.authorName}`}
                alt={entry.authorName}
                className="guestbook-avatar"
              />
              <div className="guestbook-entry-meta">
                <span className="guestbook-author">{entry.authorName}</span>
                <span className="guestbook-date">{formatDate(entry.createdAt)}</span>
              </div>
              {user?.id === profile?.id && (
                <span className="delete-text" onClick={() => handleDelete(entry.id)}>[Delete]</span>
              )}
            </div>

            {entry.sticker && <div className="guestbook-sticker">{entry.sticker}</div>}
            {entry.message && <p className="guestbook-message">{entry.message}</p>}
            {entry.gifUrl && (
              <img src={entry.gifUrl} alt="gif" className="guestbook-gif" />
            )}
            {entry.voiceData && (
              <audio src={entry.voiceData} controls style={{ margin: "8px 0", height: "32px" }} />
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default GuestbookPage;
