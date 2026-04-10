import React, { useRef, useEffect, useState, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

interface iTunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
  collectionName: string;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const SpotifyWidget: React.FC = () => {
  const { profile, refreshProfile } = useAppContext();
  const { user } = useAuth();
  const isOwner = !!user;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<iTunesTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [track, setTrack] = useState<iTunesTrack | null>(null);

  const [audioDuration, setAudioDuration] = useState(30);
  const [startTime, setStartTime] = useState(0);
  const [clipDuration, setClipDuration] = useState(20);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedProgress, setSavedProgress] = useState(0);
  const [savedPlaying, setSavedPlaying] = useState(false);

  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const savedAudioRef = useRef<HTMLAudioElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const song = profile?.profileSong;
  const endTime = Math.min(startTime + clipDuration, audioDuration);
  const clipPct = audioDuration > 0 ? (startTime / audioDuration) * 100 : 0;
  const clipWidthPct = audioDuration > 0 ? (clipDuration / audioDuration) * 100 : 0;
  const playheadPct = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;
  const clipProgress = clipDuration > 0
    ? Math.min(100, Math.max(0, ((currentTime - startTime) / clipDuration) * 100))
    : 0;

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); setShowResults(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=8`
        );
        const data = await res.json();
        setResults(data.results || []);
        setShowResults(true);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 450);
  }, []);

  const selectTrack = useCallback((t: iTunesTrack) => {
    setTrack(t);
    setShowResults(false);
    setQuery("");
    setStartTime(0);
    setClipDuration(20);
    setPlaying(false);
    setCurrentTime(0);
    setAudioDuration(30);
    setSaved(false);
    const audio = previewAudioRef.current;
    if (!audio) return;
    audio.src = t.previewUrl;
    audio.currentTime = 0;
  }, []);

  useEffect(() => {
    const audio = previewAudioRef.current;
    if (!audio || !track) return;
    const onLoaded = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
        setClipDuration((d) => Math.min(d, Math.floor(audio.duration)));
      }
    };
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.currentTime >= endTime) {
        audio.currentTime = startTime;
        audio.play();
      }
    };
    const onEnd = () => setPlaying(false);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [track, startTime, endTime]);

  const togglePlay = useCallback(() => {
    const audio = previewAudioRef.current;
    if (!audio || !track) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.currentTime = startTime; audio.play().then(() => setPlaying(true)).catch(() => {}); }
  }, [playing, track, startTime]);

  const applyStart = useCallback((t: number) => {
    const maxStart = Math.max(0, audioDuration - clipDuration);
    const clamped = Math.min(maxStart, Math.max(0, t));
    setStartTime(clamped);
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = clamped;
      if (playing) previewAudioRef.current.play();
    }
    setCurrentTime(clamped);
  }, [audioDuration, clipDuration, playing]);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || audioDuration <= 0) return;
    const pct = (e.clientX - rect.left) / rect.width;
    const t = pct * audioDuration;
    applyStart(t);
  }, [audioDuration, applyStart]);

  useEffect(() => {
    if (track || !song?.url) {
      if (savedAudioRef.current) { savedAudioRef.current.pause(); savedAudioRef.current = null; }
      setSavedPlaying(false);
      return;
    }
    const audio = new Audio(song.url);
    savedAudioRef.current = audio;
    const onTime = () => {
      const start = song.startTime || 0;
      const end = song.endTime || start + 20;
      const elapsed = audio.currentTime - start;
      const dur = end - start;
      setSavedProgress(dur > 0 ? Math.min(100, (elapsed / dur) * 100) : 0);
      if (audio.currentTime >= end) { audio.currentTime = start; audio.play(); }
    };
    audio.addEventListener("timeupdate", onTime);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      savedAudioRef.current = null;
    };
  }, [song, track]);

  const toggleSavedPlay = useCallback(() => {
    const audio = savedAudioRef.current;
    if (!audio || !song?.url) return;
    if (savedPlaying) { audio.pause(); setSavedPlaying(false); }
    else { audio.currentTime = song.startTime || 0; audio.play().then(() => setSavedPlaying(true)).catch(() => {}); }
  }, [savedPlaying, song]);

  const handleSave = async () => {
    if (!track || !user) return;
    setSaving(true);
    try {
      const largeArt = track.artworkUrl100
        .replace("100x100bb", "600x600bb")
        .replace("100x100", "600x600");
      await api.profile.update(user.id, {
        profileSong: {
          url: track.previewUrl,
          title: track.trackName,
          artist: track.artistName,
          artwork: largeArt,
          startTime,
          endTime: endTime,
        },
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => { setTrack(null); setSaved(false); }, 1600);
    } catch {
      alert("Failed to save. Please try again.");
    }
    setSaving(false);
  };

  const largeArt = track?.artworkUrl100
    ?.replace("100x100bb", "600x600bb")
    .replace("100x100", "600x600") || "";

  return (
    <div className="spotify-widget">
      <audio ref={previewAudioRef} />

      {isOwner && (
        <div className="spotify-search-wrap">
          <div className="spotify-search-row">
            <svg className="spotify-search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="spotify-search-input"
              type="text"
              placeholder="Search for a song..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => { if (results.length) setShowResults(true); }}
            />
            {searching && <span className="spotify-dots">●●●</span>}
          </div>
          {showResults && results.length > 0 && (
            <div className="spotify-results-dropdown">
              {results.map((r) => (
                <div key={r.trackId} className="spotify-result-item" onClick={() => selectTrack(r)}>
                  <img src={r.artworkUrl100} alt="" className="spotify-result-thumb" />
                  <div className="spotify-result-text">
                    <div className="spotify-result-name">{r.trackName}</div>
                    <div className="spotify-result-artist">{r.artistName}</div>
                  </div>
                </div>
              ))}
              <div className="spotify-results-close" onClick={() => setShowResults(false)}>✕ close</div>
            </div>
          )}
        </div>
      )}

      {track && (
        <div className="spotify-player">
          <div className="spotify-album-art-wrap">
            <img src={largeArt || track.artworkUrl100} alt="Album" className="spotify-album-art" />
            {playing && <div className="spotify-playing-ring" />}
          </div>
          <div className="spotify-info-row">
            <div>
              <div className="spotify-track-name">{track.trackName}</div>
              <div className="spotify-track-artist">{track.artistName}</div>
            </div>
            <div className="spotify-heart">♡</div>
          </div>

          {/* Clip progress bar — shows progress within the selected clip */}
          <div className="spotify-progress-section">
            <div className="spotify-progress-bar">
              <div className="spotify-progress-fill" style={{ width: `${clipProgress}%` }} />
              <div className="spotify-progress-thumb" style={{ left: `${clipProgress}%` }} />
            </div>
            <div className="spotify-time-row">
              <span>{fmt(Math.max(0, currentTime - startTime))}</span>
              <span>{fmt(clipDuration)}</span>
            </div>
          </div>

          <div className="spotify-controls">
            <button className="spotify-ctrl-sec" title="Shuffle">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm0.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
              </svg>
            </button>
            <button className="spotify-ctrl-skip" onClick={() => applyStart(startTime - 1)}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            <button className="spotify-ctrl-play" onClick={togglePlay}>
              {playing
                ? <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>
            <button className="spotify-ctrl-skip" onClick={() => applyStart(startTime + 1)}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
            <button className="spotify-ctrl-sec" title="Repeat">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
              </svg>
            </button>
          </div>

          {/* ── Clip Selector ── */}
          <div className="spotify-clip-section">
            <div className="spotify-clip-section-title">✂️ Choose Your Clip</div>

            {/* Full-duration visual timeline — click to set start */}
            <div className="spotify-tl-label-row">
              <span>Full preview</span>
              <span>{fmt(audioDuration)}</span>
            </div>
            <div
              className="spotify-timeline"
              ref={timelineRef}
              onClick={handleTimelineClick}
              title="Click to move clip start"
            >
              {/* grey track */}
              <div className="spotify-tl-track">
                {/* pink highlighted clip region */}
                <div
                  className="spotify-tl-clip"
                  style={{ left: `${clipPct}%`, width: `${clipWidthPct}%` }}
                />
                {/* playhead */}
                {playing && (
                  <div className="spotify-tl-playhead" style={{ left: `${playheadPct}%` }} />
                )}
              </div>
              <div className="spotify-tl-ends">
                <span>0:00</span>
                <span>{fmt(audioDuration)}</span>
              </div>
            </div>

            {/* Start time slider */}
            <div className="spotify-slider-row">
              <span className="spotify-slider-label">▶ Start</span>
              <input
                type="range"
                min={0}
                max={Math.max(0, audioDuration - clipDuration)}
                step={0.5}
                value={startTime}
                onChange={(e) => applyStart(Number(e.target.value))}
                className="spotify-clip-slider"
              />
              <span className="spotify-slider-val">{fmt(startTime)}</span>
            </div>

            {/* Clip duration slider */}
            <div className="spotify-slider-row">
              <span className="spotify-slider-label">⏱ Length</span>
              <input
                type="range"
                min={1}
                max={Math.min(20, Math.floor(audioDuration))}
                step={1}
                value={clipDuration}
                onChange={(e) => {
                  const d = Number(e.target.value);
                  setClipDuration(d);
                  setStartTime((s) => Math.min(s, Math.max(0, audioDuration - d)));
                }}
                className="spotify-clip-slider"
              />
              <span className="spotify-slider-val">{clipDuration}s</span>
            </div>

            <div className="spotify-clip-summary">
              📌 {fmt(startTime)} – {fmt(endTime)} &nbsp;·&nbsp; {clipDuration}s clip
            </div>

            <button className="spotify-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : saved ? "✅ Saved!" : "💾 Set as Profile Song"}
            </button>
          </div>
        </div>
      )}

      {!track && song?.url && (
        <div className="spotify-player">
          {song.artwork && (
            <div className="spotify-album-art-wrap">
              <img src={song.artwork} alt="Album" className="spotify-album-art" />
              {savedPlaying && <div className="spotify-playing-ring" />}
            </div>
          )}
          <div className="spotify-info-row">
            <div>
              <div className="spotify-track-name">{song.title || "Profile Song"}</div>
              <div className="spotify-track-artist">{song.artist || ""}</div>
            </div>
            <div className="spotify-heart">♡</div>
          </div>
          <div className="spotify-progress-section">
            <div className="spotify-progress-bar">
              <div className="spotify-progress-fill" style={{ width: `${savedProgress}%` }} />
              <div className="spotify-progress-thumb" style={{ left: `${savedProgress}%` }} />
            </div>
            <div className="spotify-time-row">
              <span>0:00</span>
              <span>{fmt((song.endTime || 0) - (song.startTime || 0))}s clip</span>
            </div>
          </div>
          <div className="spotify-controls">
            <button className="spotify-ctrl-sec">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm0.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
              </svg>
            </button>
            <button className="spotify-ctrl-skip">
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            <button className="spotify-ctrl-play" onClick={toggleSavedPlay}>
              {savedPlaying
                ? <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>
            <button className="spotify-ctrl-skip">
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
            <button className="spotify-ctrl-sec">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {!track && !song?.url && (
        <div className="spotify-empty">
          <div className="spotify-empty-icon">🎵</div>
          <p className="spotify-empty-text">
            {isOwner ? "Search above to set your profile song" : "No profile song set"}
          </p>
        </div>
      )}
    </div>
  );
};

export default SpotifyWidget;
