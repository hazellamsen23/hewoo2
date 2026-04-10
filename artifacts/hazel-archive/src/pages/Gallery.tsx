import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

interface Photo {
  id: string;
  userId: string;
  albumId: string;
  url: string;
  caption: string;
  createdAt: string;
}

interface Album {
  id: string;
  userId: string;
  name: string;
  description: string;
  coverPhoto: string;
  createdAt: string;
  photos: Photo[];
  photoCount: number;
}

const Gallery: React.FC = () => {
  const { profile } = useAppContext();
  const { user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"albums" | "album-view" | "upload">("albums");
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [editCaption, setEditCaption] = useState<Record<string, string>>({});
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [uploadedPhoto, setUploadedPhoto] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAlbums = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const data = await api.photos.getAlbums(profile.id);
      setAlbums(data);
      if (activeAlbum) {
        const updated = data.find((a: Album) => a.id === activeAlbum.id);
        if (updated) setActiveAlbum(updated);
      }
    } catch {} finally { setLoading(false); }
  }, [profile?.id]);

  useEffect(() => { loadAlbums(); }, [loadAlbums]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim() || !profile?.id) return;
    setSubmitting(true);
    try {
      await api.photos.createAlbum(profile.id, { name: newAlbumName, description: newAlbumDesc });
      setNewAlbumName(""); setNewAlbumDesc("");
      await loadAlbums();
      setMode("albums");
    } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!profile?.id || !confirm("Delete this album and all its photos?")) return;
    try {
      await api.photos.deleteAlbum(profile.id, albumId);
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
      setMode("albums");
    } catch (e: any) { alert(e.message); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setUploadedPhoto(ev.target?.result as string); setPhotoUrl(""); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddPhoto = async (albumId: string) => {
    const url = uploadedPhoto || photoUrl;
    if (!url || !profile?.id) return;
    setSubmitting(true);
    try {
      await api.photos.addPhoto(profile.id, { url, caption: photoCaption, albumId });
      setPhotoUrl(""); setUploadedPhoto(""); setPhotoCaption("");
      await loadAlbums();
    } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!profile?.id || !confirm("Delete this photo?")) return;
    try {
      await api.photos.deletePhoto(profile.id, photoId);
      await loadAlbums();
      setLightbox(null);
    } catch (e: any) { alert(e.message); }
  };

  const handleSaveCaption = async (photoId: string) => {
    if (!profile?.id) return;
    try {
      await api.photos.updatePhoto(profile.id, photoId, { caption: editCaption[photoId] });
      await loadAlbums();
      setEditingCaption(null);
    } catch (e: any) { alert(e.message); }
  };

  const isOwner = user?.id === profile?.id;

  if (loading) return <div className="box empty-state"><p>Loading... 🌸</p></div>;

  if (mode === "album-view" && activeAlbum) {
    return (
      <>
        <div className="box">
          <div className="box-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>📷 {activeAlbum.name}</span>
            <span className="delete-text" style={{ margin: "0 8px" }} onClick={() => setMode("albums")}>← Albums</span>
          </div>
          {activeAlbum.description && <p style={{ padding: "8px 14px", margin: 0, fontSize: "12px", color: "#666", borderBottom: "1px solid #ffb3d9" }}>{activeAlbum.description}</p>}
          {isOwner && (
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #ffb3d9" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <input type="text" className="wall-url-input" placeholder="Paste photo URL..." value={photoUrl} onChange={(e) => { setPhotoUrl(e.target.value); setUploadedPhoto(""); }} style={{ flex: 2 }} />
                <span style={{ color: "#999", fontSize: "11px" }}>or</span>
                <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>📷 Upload</button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
              </div>
              {(photoUrl || uploadedPhoto) && (
                <div style={{ marginTop: "8px" }}>
                  <img src={uploadedPhoto || photoUrl} alt="preview" style={{ width: "80px", height: "60px", objectFit: "cover", border: "2px solid #ffb3d9", borderRadius: "3px" }} />
                  <input className="wall-url-input" placeholder="Add a caption... (the story behind this photo ✨)" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} style={{ marginLeft: "8px", flex: 1 }} />
                  <button className="wall-post-btn" onClick={() => handleAddPhoto(activeAlbum.id)} disabled={submitting} style={{ marginLeft: "8px" }}>
                    {submitting ? "Adding..." : "Add Photo"}
                  </button>
                </div>
              )}
              <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                {isOwner && <button className="cancel-btn" onClick={() => handleDeleteAlbum(activeAlbum.id)}>🗑 Delete Album</button>}
              </div>
            </div>
          )}
        </div>

        {activeAlbum.photos.length === 0 ? (
          <div className="box empty-state"><p>No photos yet!{isOwner ? " Add some above 📷" : ""}</p></div>
        ) : (
          <div className="gallery-grid">
            {activeAlbum.photos.map((photo) => (
              <div key={photo.id} className="gallery-item" onClick={() => setLightbox(photo)}>
                <img src={photo.url} alt={photo.caption || "photo"} className="gallery-img" />
                {photo.caption && <p className="gallery-caption">{photo.caption}</p>}
              </div>
            ))}
          </div>
        )}

        {lightbox && (
          <div className="lightbox" onClick={() => setLightbox(null)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img src={lightbox.url} alt={lightbox.caption} className="lightbox-img" />
              {editingCaption === lightbox.id ? (
                <div style={{ padding: "10px", display: "flex", gap: "6px" }}>
                  <input
                    value={editCaption[lightbox.id] ?? lightbox.caption}
                    onChange={(e) => setEditCaption((prev) => ({ ...prev, [lightbox.id]: e.target.value }))}
                    className="wall-url-input"
                    style={{ flex: 1 }}
                    placeholder="Add a caption..."
                    autoFocus
                  />
                  <button className="comment-send-btn" onClick={() => handleSaveCaption(lightbox.id)}>Save</button>
                  <button className="cancel-btn" onClick={() => setEditingCaption(null)}>Cancel</button>
                </div>
              ) : (
                <div className="lightbox-caption-row">
                  <p className="lightbox-caption">{lightbox.caption || "No caption"}</p>
                  {isOwner && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="upload-btn" onClick={() => { setEditingCaption(lightbox.id); setEditCaption((prev) => ({ ...prev, [lightbox.id]: lightbox.caption })); }}>✏️ Edit</button>
                      <button className="cancel-btn" onClick={() => handleDeletePhoto(lightbox.id)}>🗑 Delete</button>
                    </div>
                  )}
                </div>
              )}
              <button className="lightbox-close" onClick={() => setLightbox(null)}>✕ Close</button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="box">
        <div className="box-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>📸 Photo Albums</span>
        </div>
        {isOwner && (
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #ffb3d9" }}>
            <form onSubmit={handleCreateAlbum} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input
                className="wall-url-input"
                placeholder="New album name..."
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                style={{ flex: 2, minWidth: "160px" }}
              />
              <input
                className="wall-url-input"
                placeholder="Description (optional)"
                value={newAlbumDesc}
                onChange={(e) => setNewAlbumDesc(e.target.value)}
                style={{ flex: 3, minWidth: "200px" }}
              />
              <button type="submit" className="upload-btn" disabled={submitting}>
                {submitting ? "Creating..." : "+ Create Album"}
              </button>
            </form>
          </div>
        )}
      </div>

      {albums.length === 0 ? (
        <div className="box empty-state">
          <p>No albums yet!{isOwner ? " Create your first album above 📸" : ""}</p>
        </div>
      ) : (
        <div className="albums-grid">
          {albums.map((album) => (
            <div key={album.id} className="album-card" onClick={() => { setActiveAlbum(album); setMode("album-view"); }}>
              <div className="album-cover">
                {album.coverPhoto ? (
                  <img src={album.coverPhoto} alt={album.name} className="album-cover-img" />
                ) : (
                  <div className="album-cover-placeholder">📷</div>
                )}
              </div>
              <div className="album-info">
                <div className="album-name">{album.name}</div>
                {album.description && <div className="album-desc">{album.description}</div>}
                <div className="album-count">{album.photoCount} photo{album.photoCount !== 1 ? "s" : ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Gallery;
