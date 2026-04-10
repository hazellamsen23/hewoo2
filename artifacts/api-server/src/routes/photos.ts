import { Router } from "express";
import { v4 as uuid } from "uuid";
import { db, Photo, Album } from "../lib/dataStore.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.get("/photos/:userId/albums", (req, res) => {
  const albums = db.albums.forUser(req.params.userId);
  const photos = db.photos.forUser(req.params.userId);
  const result = albums.map((a) => ({
    ...a,
    photos: photos.filter((p) => p.albumId === a.id),
    photoCount: photos.filter((p) => p.albumId === a.id).length,
  }));
  res.json(result);
});

router.post("/photos/:userId/albums", authenticate, (req, res) => {
  if (req.user!.id !== req.params.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { name, description } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: "Album name required" }); return; }
  const album: Album = {
    id: uuid(),
    userId: req.params.userId,
    name: name.trim(),
    description: description || "",
    coverPhoto: "",
    createdAt: new Date().toISOString(),
  };
  db.albums.save(album);
  res.status(201).json(album);
});

router.put("/photos/:userId/albums/:albumId", authenticate, (req, res) => {
  if (req.user!.id !== req.params.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const updated = db.albums.update(req.params.albumId, req.body);
  if (!updated) { res.status(404).json({ error: "Album not found" }); return; }
  res.json(updated);
});

router.delete("/photos/:userId/albums/:albumId", authenticate, (req, res) => {
  if (req.user!.id !== req.params.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  db.albums.delete(req.params.albumId);
  db.photos.forUser(req.params.userId)
    .filter((p) => p.albumId === req.params.albumId)
    .forEach((p) => db.photos.delete(p.id));
  res.json({ ok: true });
});

router.get("/photos/:userId", (req, res) => {
  res.json(db.photos.forUser(req.params.userId));
});

router.post("/photos/:userId", authenticate, (req, res) => {
  if (req.user!.id !== req.params.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { url, caption, albumId } = req.body;
  if (!url) { res.status(400).json({ error: "Photo URL required" }); return; }
  const photo: Photo = {
    id: uuid(),
    userId: req.params.userId,
    albumId: albumId || "uncategorized",
    url,
    caption: caption || "",
    createdAt: new Date().toISOString(),
  };
  db.photos.save(photo);
  if (albumId) {
    const album = db.albums.findById(albumId);
    if (album && !album.coverPhoto) {
      db.albums.update(albumId, { coverPhoto: url });
    }
  }
  res.status(201).json(photo);
});

router.put("/photos/:userId/:photoId", authenticate, (req, res) => {
  if (req.user!.id !== req.params.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const updated = db.photos.update(req.params.photoId, req.body);
  if (!updated) { res.status(404).json({ error: "Photo not found" }); return; }
  res.json(updated);
});

router.delete("/photos/:userId/:photoId", authenticate, (req, res) => {
  if (req.user!.id !== req.params.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  db.photos.delete(req.params.photoId);
  res.json({ ok: true });
});

export default router;
