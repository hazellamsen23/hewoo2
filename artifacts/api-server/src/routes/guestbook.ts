import { Router } from "express";
import { v4 as uuid } from "uuid";
import { db, GuestbookEntry } from "../lib/dataStore.js";
import { authenticate, optionalAuth } from "../middleware/authenticate.js";

const router = Router();

router.get("/guestbook/:userId", (req, res) => {
  res.json(db.guestbook.forUser(req.params.userId));
});

router.post("/guestbook/:userId", optionalAuth, (req, res) => {
  const { message, authorName, sticker, gifUrl, voiceData } = req.body;
  if (!message?.trim() && !voiceData && !sticker && !gifUrl) {
    res.status(400).json({ error: "Entry must have a message, sticker, GIF, or voice" }); return;
  }
  const user = req.user ? db.users.findById(req.user.id) : null;
  const entry: GuestbookEntry = {
    id: uuid(),
    profileUserId: req.params.userId,
    authorId: req.user?.id || null,
    authorName: user?.displayName || authorName || "Anonymous Visitor",
    message: message || "",
    sticker: sticker || "",
    gifUrl: gifUrl || "",
    voiceData: voiceData || "",
    createdAt: new Date().toISOString(),
  };
  db.guestbook.save(entry);
  res.status(201).json(entry);
});

router.delete("/guestbook/:userId/:entryId", authenticate, (req, res) => {
  if (req.user!.id !== req.params.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  db.guestbook.delete(req.params.entryId);
  res.json({ ok: true });
});

export default router;
