import React, { useRef, useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import SpotifyWidget from "./SpotifyWidget";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, navigate] = useLocation();
  const { profile } = useAppContext();
  const { user, logout } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const sparklesRef = useRef<any[]>([]);
  const animFrameRef = useRef<number>(0);

  const p = profile;

  const navLinks = [
    { label: p?.navHomeLabel || "🏠 Home", path: "/" },
    { label: p?.navProfileLabel || "👤 My Profile", path: "/profile" },
    { label: p?.navGalleryLabel || "📸 Gallery", path: "/gallery" },
    { label: p?.navBlogLabel || "📝 Blog", path: "/blog" },
  ];

  useEffect(() => {
    if (!p?.customCSS) return;
    const id = "user-custom-css";
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = p.customCSS;
    return () => { el?.remove(); };
  }, [p?.customCSS]);

  useEffect(() => {
    if (!p) return;
    document.documentElement.style.setProperty("--profile-bg", p.bgColor || "#fff0f5");
    document.documentElement.style.setProperty("--profile-text", p.textColor || "#333");
    document.documentElement.style.setProperty("--profile-link", p.linkColor || "#cc0066");
    document.documentElement.style.setProperty("--profile-font", p.fontFamily || "Tahoma, Arial, sans-serif");
  }, [p?.bgColor, p?.textColor, p?.linkColor, p?.fontFamily]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !p?.bgMusicUrl) return;
    audio.src = p.bgMusicUrl;
    audio.loop = true;
    audio.volume = p.bgMusicVolume ?? 0.5;
    if (p.bgMusicEnabled && !musicStarted) {
      audio.play().then(() => setMusicStarted(true)).catch(() => {});
    }
    if (!p.bgMusicEnabled) {
      audio.pause();
      setMusicStarted(false);
    }
  }, [p?.bgMusicUrl, p?.bgMusicEnabled, p?.bgMusicVolume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  const drawGlitter = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sparklesRef.current = sparklesRef.current.filter((s) => s.life > 0);
    for (const s of sparklesRef.current) {
      ctx.save();
      ctx.globalAlpha = s.life / s.maxLife;
      ctx.fillStyle = s.color;
      ctx.font = `${s.size}px serif`;
      ctx.fillText(s.char, s.x, s.y);
      s.y -= 0.8;
      s.x += s.vx;
      s.life--;
      ctx.restore();
    }
    animFrameRef.current = requestAnimationFrame(drawGlitter);
  }, []);

  useEffect(() => {
    if (!p?.glitterEnabled && p?.cursorEffect !== "sparkle") {
      cancelAnimationFrame(animFrameRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    animFrameRef.current = requestAnimationFrame(drawGlitter);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [p?.glitterEnabled, p?.cursorEffect, drawGlitter]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (p?.cursorEffect !== "sparkle" && !p?.glitterEnabled) return;
    const chars = ["✦", "✧", "★", "✨", "💫", "⭐", "🌸", "✿", "❀", "♡"];
    const colors = ["#ff66b2", "#ff0090", "#ff99cc", "#ffcc00", "#cc00ff", "#00ccff", "#ff3399"];
    sparklesRef.current.push({
      x: e.clientX + (Math.random() - 0.5) * 20,
      y: e.clientY + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      char: chars[Math.floor(Math.random() * chars.length)],
      size: 10 + Math.random() * 14,
      life: 30 + Math.random() * 30,
      maxLife: 60,
    });
    if (sparklesRef.current.length > 60) sparklesRef.current.shift();
  }, [p?.cursorEffect, p?.glitterEnabled]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cursorStyle =
    p?.cursorEffect === "crosshair" ? { cursor: "crosshair" } :
    p?.cursorEffect === "pointer" ? { cursor: "pointer" } :
    {};

  return (
    <div
      className="myspace-body"
      style={{
        backgroundColor: p?.bgColor || "#fff0f5",
        color: p?.textColor || "#333",
        fontFamily: p?.fontFamily || "Tahoma, Arial, sans-serif",
        ...cursorStyle,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          pointerEvents: "none", zIndex: 9999,
        }}
      />

      <audio ref={audioRef} loop style={{ display: "none" }} />

      {p?.bgMusicUrl && (
        <button
          className="music-mute-btn"
          onClick={() => setMuted((m) => !m)}
          title={muted ? "Unmute music" : "Mute music"}
        >
          {muted ? "🔇" : "🎵"}
        </button>
      )}

      <div className="pink-header">
        <div className="header-content">
          <span className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer", color: p?.linkColor }}>
            {p?.siteTitle || user?.username || "✨ My Space"}
          </span>
          <div className="header-nav">
            {navLinks.map((link) => (
              <span
                key={link.path}
                className={`header-nav-link ${location === link.path ? "active" : ""}`}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </span>
            ))}
            {user && (
              <span className="header-nav-link logout-btn" onClick={logout}>🚪 Logout</span>
            )}
          </div>
        </div>
      </div>

      {p?.marqueeText && (
        <div className="marquee-bar">
          <marquee>{p.marqueeText}</marquee>
        </div>
      )}

      <div className="main-container">
        <div className="left-column">
          <h2 className="name-title" style={{ color: p?.linkColor || "#cc0066" }}>
            {p?.displayName || user?.displayName || user?.username || "My Space"}
          </h2>

          <div className="box">
            <div
              className="pfp-wrapper"
              onClick={() => navigate("/profile")}
              title="Go to profile"
            >
              <img
                src={p?.profilePic || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.username}`}
                alt="Profile"
                className="profile-pic"
              />
              <div className="pfp-overlay">✏️ Edit Profile</div>
            </div>
            <p className="status-text">
              "{p?.statusText || "living my best life ✨"}"<br />
              <span className="online">● ONLINE</span>
            </p>
          </div>

          <div className="box" style={{ padding: 0, overflow: "hidden" }}>
            <div className="box-header" style={{ padding: "8px 12px" }}>🎵 Now Playing</div>
            <SpotifyWidget />
          </div>

          <div className="box">
            <div className="box-header">{p?.aboutTitle || "About Me"}</div>
            <div className="about-content">
              {p?.zodiac && <p>♊ Zodiac: {p.zodiac}</p>}
              {p?.bloodType && <p>🩸 Blood Type: {p.bloodType}</p>}
              {p?.location && <p>📍 {p.location}</p>}
              {p?.course && <p>🎓 {p.course}</p>}
              {(p?.aboutItems || []).map((item: string, i: number) => (
                <p key={i}>{item}</p>
              ))}
              {(p?.funFacts || []).map((fact: string, i: number) => (
                <p key={`ff-${i}`}>✨ {fact}</p>
              ))}
            </div>
          </div>

          <div className="box contact-box">
            <div className="box-header">🔗 Links</div>
            <div className="contact-links">
              <div className="link share-link" onClick={() => {
                const url = window.location.origin + `/?view=${user?.id}`;
                navigator.clipboard.writeText(url);
                alert("🔗 Profile link copied! Share it with anyone.");
              }}>
                🔗 Share My Page
              </div>
            </div>
          </div>

          {(p?.top8Friends?.length ?? 0) > 0 && (
            <div className="box">
              <div className="box-header">💕 {p?.top8Label || "Top 8"}</div>
              <div className="top8-grid" style={{ gridTemplateColumns: `repeat(${Math.min(p?.top8Count || 8, 4) <= 4 ? 2 : 4}, 1fr)` }}>
                {(p?.top8Friends || []).slice(0, p?.top8Count || 8).map((friend: any) => (
                  <div key={friend.id} className="top8-friend" onClick={() => friend.profileUrl && window.open(friend.profileUrl, "_blank")}>
                    <img
                      src={friend.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${friend.name}`}
                      alt={friend.name}
                      className="top8-avatar"
                    />
                    <span className="top8-name">{friend.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(p?.playlist?.length ?? 0) > 0 && (
            <div className="box">
              <div className="box-header">🎶 Playlist</div>
              <div className="playlist-list">
                {(p?.playlist || []).map((item: any) => (
                  <div key={item.id} className="playlist-item" onClick={() => window.open(item.url, "_blank")}>
                    <span className="playlist-icon">▶</span>
                    <span className="playlist-title">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="right-column">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
