import React, { useState, useRef } from "react";
import { useAppContext, UserProfile } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const uuid = () => crypto.randomUUID();

const FONTS = [
  { label: "Tahoma (Default)", value: "Tahoma, Arial, sans-serif" },
  { label: "Comic Sans 😄", value: "'Comic Sans MS', cursive" },
  { label: "Georgia (Elegant)", value: "Georgia, serif" },
  { label: "Courier (Typewriter)", value: "'Courier New', monospace" },
  { label: "Impact (Bold)", value: "Impact, sans-serif" },
  { label: "Trebuchet (Clean)", value: "'Trebuchet MS', sans-serif" },
  { label: "Palatino (Literary)", value: "Palatino, serif" },
  { label: "Verdana (Readable)", value: "Verdana, sans-serif" },
];

const CURSOR_OPTIONS = [
  { label: "Default", value: "none" },
  { label: "✨ Sparkle Trail", value: "sparkle" },
  { label: "✚ Crosshair", value: "crosshair" },
  { label: "👆 Pointer", value: "pointer" },
];

const ZODIAC_SIGNS = ["♈ Aries","♉ Taurus","♊ Gemini","♋ Cancer","♌ Leo","♍ Virgo","♎ Libra","♏ Scorpio","♐ Sagittarius","♑ Capricorn","♒ Aquarius","♓ Pisces"];
const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = (e) => res(e.target?.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

const ProfilePage: React.FC = () => {
  const { profile, saveProfile, refreshProfile } = useAppContext();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const songPreviewRef = useRef<HTMLAudioElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile"|"appearance"|"music"|"friends"|"about">("profile");

  const [draft, setDraft] = useState<Partial<UserProfile>>({});

  const get = <K extends keyof UserProfile>(key: K): UserProfile[K] | undefined =>
    (key in draft ? draft[key] : profile?.[key]) as UserProfile[K] | undefined;

  const set = (patch: Partial<UserProfile>) => setDraft((d) => ({ ...d, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile(draft);
      setDraft({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };

  const handlePfpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await toBase64(file);
    set({ profilePic: b64 });
    e.target.value = "";
  };

  const addFriend = () => {
    const friends = [...(get("top8Friends") || [])];
    friends.push({ id: uuid(), name: "", avatar: "", profileUrl: "" });
    set({ top8Friends: friends });
  };

  const updateFriend = (idx: number, patch: any) => {
    const friends = [...(get("top8Friends") || [])];
    friends[idx] = { ...friends[idx], ...patch };
    set({ top8Friends: friends });
  };

  const removeFriend = (idx: number) => {
    const friends = [...(get("top8Friends") || [])];
    friends.splice(idx, 1);
    set({ top8Friends: friends });
  };

  const addPlaylistItem = () => {
    const playlist = [...(get("playlist") || [])];
    playlist.push({ id: uuid(), title: "", url: "" });
    set({ playlist });
  };

  const updatePlaylistItem = (idx: number, patch: any) => {
    const playlist = [...(get("playlist") || [])];
    playlist[idx] = { ...playlist[idx], ...patch };
    set({ playlist });
  };

  const removePlaylistItem = (idx: number) => {
    const playlist = [...(get("playlist") || [])];
    playlist.splice(idx, 1);
    set({ playlist });
  };

  const addAboutItem = () => set({ aboutItems: [...(get("aboutItems") || []), ""] });
  const updateAboutItem = (i: number, val: string) => {
    const items = [...(get("aboutItems") || [])];
    items[i] = val;
    set({ aboutItems: items });
  };
  const removeAboutItem = (i: number) => {
    const items = [...(get("aboutItems") || [])];
    items.splice(i, 1);
    set({ aboutItems: items });
  };

  const addFunFact = () => set({ funFacts: [...(get("funFacts") || []), ""] });
  const updateFunFact = (i: number, val: string) => {
    const facts = [...(get("funFacts") || [])];
    facts[i] = val;
    set({ funFacts: facts });
  };
  const removeFunFact = (i: number) => {
    const facts = [...(get("funFacts") || [])];
    facts.splice(i, 1);
    set({ funFacts: facts });
  };

  const previewSong = () => {
    const audio = songPreviewRef.current;
    if (!audio) return;
    const songUrl = get("profileSong")?.url || "";
    const start = get("profileSong")?.startTime ?? 0;
    audio.src = songUrl;
    audio.currentTime = start;
    audio.play();
  };

  const tabs = [
    { id: "profile", label: "👤 Profile" },
    { id: "appearance", label: "🎨 Appearance" },
    { id: "music", label: "🎵 Music" },
    { id: "friends", label: "💕 Friends" },
    { id: "about", label: "📝 About" },
  ];

  const hasDraft = Object.keys(draft).length > 0;

  return (
    <>
      <div className="box">
        <div className="box-header">✨ My Profile Editor</div>
        <div style={{ padding: "10px" }}>
          <div className="profile-tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`profile-tab-btn ${activeTab === t.id ? "active" : ""}`}
                onClick={() => setActiveTab(t.id as any)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {hasDraft && (
            <div className="unsaved-banner">
              You have unsaved changes!{" "}
              <button onClick={handleSave} disabled={saving} className="save-inline-btn">
                {saving ? "Saving..." : "💾 Save Now"}
              </button>
              <button onClick={() => setDraft({})} className="discard-inline-btn">Discard</button>
            </div>
          )}
          {saved && <div className="saved-banner">✅ Changes saved!</div>}

          {activeTab === "profile" && (
            <div className="edit-form" style={{ marginTop: "12px" }}>
              <div className="profile-pfp-section">
                <div className="profile-page-pfp-wrapper" onClick={() => fileInputRef.current?.click()}>
                  <img
                    src={get("profilePic") || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.username}`}
                    alt="Profile"
                    className="profile-page-pfp"
                  />
                  <div className="pfp-overlay">📷 Change</div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePfpChange} />
                <div style={{ marginTop: "6px" }}>
                  <label style={{ fontSize: "11px", display: "block", marginBottom: "3px" }}>Or paste image URL:</label>
                  <input
                    style={{ width: "100%", fontSize: "11px" }}
                    placeholder="https://..."
                    value={get("profilePic")?.startsWith("http") ? get("profilePic") : ""}
                    onChange={(e) => set({ profilePic: e.target.value })}
                  />
                </div>
              </div>

              <label>Display Name</label>
              <input value={get("displayName") || ""} onChange={(e) => set({ displayName: e.target.value })} />
              <label>Site Title (header logo)</label>
              <input value={get("siteTitle") || ""} onChange={(e) => set({ siteTitle: e.target.value })} />
              <label>Status / Tagline</label>
              <input value={get("statusText") || ""} onChange={(e) => set({ statusText: e.target.value })} />
              <label>Location</label>
              <input value={get("location") || ""} onChange={(e) => set({ location: e.target.value })} />
              <label>Course / Occupation</label>
              <input value={get("course") || ""} onChange={(e) => set({ course: e.target.value })} />
              <label>Bio</label>
              <textarea rows={3} value={get("bio") || ""} onChange={(e) => set({ bio: e.target.value })} />

              <div className="settings-nav-grid">
                <div>
                  <label>Home Nav Label</label>
                  <input value={get("navHomeLabel") || ""} onChange={(e) => set({ navHomeLabel: e.target.value })} />
                </div>
                <div>
                  <label>Profile Nav Label</label>
                  <input value={get("navProfileLabel") || ""} onChange={(e) => set({ navProfileLabel: e.target.value })} />
                </div>
                <div>
                  <label>Gallery Nav Label</label>
                  <input value={get("navGalleryLabel") || ""} onChange={(e) => set({ navGalleryLabel: e.target.value })} />
                </div>
                <div>
                  <label>Blog Nav Label</label>
                  <input value={get("navBlogLabel") || ""} onChange={(e) => set({ navBlogLabel: e.target.value })} />
                </div>
                <div>
                  <label>Guestbook Nav Label</label>
                  <input value={get("navGuestbookLabel") || ""} onChange={(e) => set({ navGuestbookLabel: e.target.value })} />
                </div>
                <div>
                  <label>Sidebar Panel Title</label>
                  <input value={get("controlPanelTitle") || ""} onChange={(e) => set({ controlPanelTitle: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="edit-form" style={{ marginTop: "12px" }}>
              <div className="color-row">
                <div>
                  <label>Background Color</label>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input type="color" value={get("bgColor") || "#fff0f5"} onChange={(e) => set({ bgColor: e.target.value })} style={{ width: "40px", height: "30px", padding: "2px", border: "1px solid #ffb3d9" }} />
                    <input value={get("bgColor") || "#fff0f5"} onChange={(e) => set({ bgColor: e.target.value })} style={{ flex: 1 }} />
                  </div>
                </div>
                <div>
                  <label>Text Color</label>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input type="color" value={get("textColor") || "#333333"} onChange={(e) => set({ textColor: e.target.value })} style={{ width: "40px", height: "30px", padding: "2px", border: "1px solid #ffb3d9" }} />
                    <input value={get("textColor") || "#333333"} onChange={(e) => set({ textColor: e.target.value })} style={{ flex: 1 }} />
                  </div>
                </div>
                <div>
                  <label>Link / Accent Color</label>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input type="color" value={get("linkColor") || "#cc0066"} onChange={(e) => set({ linkColor: e.target.value })} style={{ width: "40px", height: "30px", padding: "2px", border: "1px solid #ffb3d9" }} />
                    <input value={get("linkColor") || "#cc0066"} onChange={(e) => set({ linkColor: e.target.value })} style={{ flex: 1 }} />
                  </div>
                </div>
              </div>

              <label>Font Family</label>
              <select value={get("fontFamily") || "Tahoma, Arial, sans-serif"} onChange={(e) => set({ fontFamily: e.target.value })}>
                {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>

              <label>Cursor Effect</label>
              <select value={get("cursorEffect") || "none"} onChange={(e) => set({ cursorEffect: e.target.value })}>
                {CURSOR_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>

              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "4px" }}>
                <label style={{ margin: 0 }}>✨ Glitter on hover</label>
                <input type="checkbox" checked={!!get("glitterEnabled")} onChange={(e) => set({ glitterEnabled: e.target.checked })} />
              </div>

              <label>Marquee Text (moving banner)</label>
              <input
                placeholder="Type something fun that scrolls across the page! ✨"
                value={get("marqueeText") || ""}
                onChange={(e) => set({ marqueeText: e.target.value })}
              />

              <label>Custom CSS (advanced — have fun! 🎨)</label>
              <textarea
                rows={8}
                style={{ fontFamily: "monospace", fontSize: "11px" }}
                placeholder={`/* Your custom CSS here! */\n.myspace-body { background-image: url('...'); }\n.box { border-color: purple; }\n/* etc. */`}
                value={get("customCSS") || ""}
                onChange={(e) => set({ customCSS: e.target.value })}
              />
              <small style={{ color: "#999" }}>Changes apply immediately after saving. You can use any CSS to make your profile truly yours!</small>
            </div>
          )}

          {activeTab === "music" && (
            <div className="edit-form" style={{ marginTop: "12px" }}>
              <audio ref={songPreviewRef} style={{ display: "none" }} />

              <div className="music-section-header">🎵 Profile Song</div>
              <small style={{ color: "#999", display: "block", marginBottom: "8px" }}>
                Your profile song plays when people visit. Max 20 seconds, pick your start time like an Instagram story!
              </small>

              <label>Song URL (YouTube, SoundCloud, direct MP3, etc.)</label>
              <input
                placeholder="https://..."
                value={get("profileSong")?.url || ""}
                onChange={(e) => set({ profileSong: { ...((get("profileSong") as any) || {}), url: e.target.value } })}
              />

              <label>Song Title</label>
              <input
                placeholder="e.g. The Night We Met - Lord Huron"
                value={get("profileSong")?.title || ""}
                onChange={(e) => set({ profileSong: { ...((get("profileSong") as any) || {}), title: e.target.value } })}
              />

              <div className="song-time-row">
                <div>
                  <label>Start Time (seconds)</label>
                  <input
                    type="number"
                    min="0"
                    value={get("profileSong")?.startTime ?? 0}
                    onChange={(e) => set({ profileSong: { ...((get("profileSong") as any) || {}), startTime: Number(e.target.value) } })}
                  />
                </div>
                <div>
                  <label>End Time (seconds, max +20)</label>
                  <input
                    type="number"
                    min="0"
                    value={get("profileSong")?.endTime ?? 20}
                    onChange={(e) => {
                      const start = get("profileSong")?.startTime ?? 0;
                      const end = Math.min(Number(e.target.value), start + 20);
                      set({ profileSong: { ...((get("profileSong") as any) || {}), endTime: end } });
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button type="button" onClick={previewSong} className="upload-btn">▶ Preview</button>
                </div>
              </div>
              <small style={{ color: "#cc0066" }}>
                Clip length: {Math.max(0, (get("profileSong")?.endTime ?? 20) - (get("profileSong")?.startTime ?? 0))}s / max 20s
              </small>

              <div className="music-section-header" style={{ marginTop: "18px" }}>🎶 Background Music</div>
              <small style={{ color: "#999", display: "block", marginBottom: "8px" }}>
                Background music plays on loop when visitors open your page (with a mute button ✨)
              </small>
              <label>Background Music URL (direct MP3/audio link)</label>
              <input
                placeholder="https://example.com/song.mp3"
                value={get("bgMusicUrl") || ""}
                onChange={(e) => set({ bgMusicUrl: e.target.value })}
              />
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <label style={{ margin: 0 }}>Auto-play</label>
                  <input type="checkbox" checked={!!get("bgMusicEnabled")} onChange={(e) => set({ bgMusicEnabled: e.target.checked })} />
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: 1 }}>
                  <label style={{ margin: 0, whiteSpace: "nowrap" }}>Volume: {Math.round((get("bgMusicVolume") ?? 0.5) * 100)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={get("bgMusicVolume") ?? 0.5}
                    onChange={(e) => set({ bgMusicVolume: Number(e.target.value) })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="music-section-header" style={{ marginTop: "18px" }}>📋 Playlist</div>
              <small style={{ color: "#999", display: "block", marginBottom: "8px" }}>
                Your playlist shows in the sidebar so visitors can see what you&apos;re listening to!
              </small>
              {(get("playlist") || []).map((item: any, i: number) => (
                <div key={item.id} className="playlist-edit-row">
                  <input placeholder="Song title" value={item.title} onChange={(e) => updatePlaylistItem(i, { title: e.target.value })} style={{ flex: 1 }} />
                  <input placeholder="URL" value={item.url} onChange={(e) => updatePlaylistItem(i, { url: e.target.value })} style={{ flex: 2 }} />
                  <button type="button" className="remove-item-btn" onClick={() => removePlaylistItem(i)}>✕</button>
                </div>
              ))}
              <button type="button" className="add-item-btn" onClick={addPlaylistItem}>+ Add Song</button>
            </div>
          )}

          {activeTab === "friends" && (
            <div className="edit-form" style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <label>Label (e.g. "Top 8", "Top Villains", "My Besties")</label>
                  <input value={get("top8Label") || "Top 8"} onChange={(e) => set({ top8Label: e.target.value })} />
                </div>
                <div>
                  <label>How many to show?</label>
                  <select value={get("top8Count") || 8} onChange={(e) => set({ top8Count: Number(e.target.value) })}>
                    {[4, 6, 8, 10, 12, 16].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              {(get("top8Friends") || []).map((friend: any, i: number) => (
                <div key={friend.id} className="friend-edit-row">
                  <img
                    src={friend.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${friend.name || i}`}
                    alt=""
                    style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #ffb3d9", objectFit: "cover" }}
                  />
                  <input placeholder="Name" value={friend.name} onChange={(e) => updateFriend(i, { name: e.target.value })} style={{ flex: 1 }} />
                  <input placeholder="Avatar URL" value={friend.avatar} onChange={(e) => updateFriend(i, { avatar: e.target.value })} style={{ flex: 2 }} />
                  <input placeholder="Profile link (optional)" value={friend.profileUrl} onChange={(e) => updateFriend(i, { profileUrl: e.target.value })} style={{ flex: 2 }} />
                  <button type="button" className="remove-item-btn" onClick={() => removeFriend(i)}>✕</button>
                </div>
              ))}
              <button type="button" className="add-item-btn" onClick={addFriend}>+ Add Friend</button>
            </div>
          )}

          {activeTab === "about" && (
            <div className="edit-form" style={{ marginTop: "12px" }}>
              <div className="about-section-grid">
                <div>
                  <label>☀️ Zodiac Sign</label>
                  <select value={get("zodiac") || ""} onChange={(e) => set({ zodiac: e.target.value })}>
                    <option value="">— Select —</option>
                    {ZODIAC_SIGNS.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label>🩸 Blood Type</label>
                  <select value={get("bloodType") || ""} onChange={(e) => set({ bloodType: e.target.value })}>
                    <option value="">— Select —</option>
                    {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <label>Sidebar Title</label>
              <input value={get("aboutTitle") || "About Me"} onChange={(e) => set({ aboutTitle: e.target.value })} />

              <label>About Me Items (sidebar bullets)</label>
              {(get("aboutItems") || []).map((item: string, i: number) => (
                <div key={i} className="about-item-row">
                  <input value={item} onChange={(e) => updateAboutItem(i, e.target.value)} placeholder={`Item ${i + 1}`} />
                  <button type="button" className="remove-item-btn" onClick={() => removeAboutItem(i)}>✕</button>
                </div>
              ))}
              <button type="button" className="add-item-btn" onClick={addAboutItem}>+ Add Item</button>

              <label style={{ marginTop: "14px" }}>Random Fun Facts ✨</label>
              <small style={{ color: "#999", display: "block", marginBottom: "6px" }}>No one asked, but here they are!</small>
              {(get("funFacts") || []).map((fact: string, i: number) => (
                <div key={i} className="about-item-row">
                  <input value={fact} onChange={(e) => updateFunFact(i, e.target.value)} placeholder="e.g. I can eat an entire bag of chips in one sitting" />
                  <button type="button" className="remove-item-btn" onClick={() => removeFunFact(i)}>✕</button>
                </div>
              ))}
              <button type="button" className="add-item-btn" onClick={addFunFact}>+ Add Fun Fact</button>
            </div>
          )}

          {hasDraft && (
            <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
              <button onClick={handleSave} disabled={saving} className="wall-post-btn" style={{ flex: 1 }}>
                {saving ? "Saving..." : "💾 Save Changes"}
              </button>
              <button onClick={() => setDraft({})} className="cancel-btn">Discard</button>
            </div>
          )}
          {saved && <div className="saved-banner">✅ Profile saved!</div>}
        </div>
      </div>

      <div className="box">
        <div className="box-header">🔗 Share Your Page</div>
        <div style={{ padding: "14px" }}>
          <p style={{ margin: "0 0 8px", fontSize: "12px" }}>Share this link with anyone — they can view your wall, guestbook, blog, and photos!</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              readOnly
              value={`${window.location.origin}/?view=${user?.id}`}
              style={{ flex: 1, fontSize: "12px" }}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              className="upload-btn"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/?view=${user?.id}`);
                alert("🔗 Link copied!");
              }}
            >
              📋 Copy
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
