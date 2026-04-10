import { Router } from "express";
import { db } from "../lib/dataStore.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.get("/profile/:userId", (req, res) => {
  const user = db.users.findById(req.params.userId);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

router.get("/profile/by-username/:username", (req, res) => {
  const user = db.users.findByUsername(req.params.username);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

router.put("/profile/:userId", authenticate, (req, res) => {
  if (req.user!.id !== req.params.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const allowed = [
    "displayName","statusText","profilePic","aboutItems","zodiac","bloodType",
    "funFacts","location","course","bio","customCSS","bgColor","textColor",
    "linkColor","fontFamily","bgMusicUrl","bgMusicEnabled","bgMusicVolume",
    "cursorEffect","marqueeText","glitterEnabled","siteTitle","controlPanelTitle",
    "aboutTitle","navHomeLabel","navProfileLabel","navGalleryLabel","navBlogLabel",
    "navGuestbookLabel","top8Label","top8Count","top8Friends","playlist","profileSong",
  ];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in req.body) patch[key] = req.body[key];
  }
  const updated = db.users.update(req.params.userId, patch);
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  const { passwordHash: _, ...safeUser } = updated;
  res.json(safeUser);
});

router.get("/users", (_req, res) => {
  const users = db.users.all().map(({ passwordHash: _, ...u }) => ({
    id: u.id, username: u.username, displayName: u.displayName, profilePic: u.profilePic,
  }));
  res.json(users);
});

export default router;
