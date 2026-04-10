import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { db, User } from "../lib/dataStore.js";
import { signToken } from "../lib/auth.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

const DEFAULT_USER: Omit<User, "id" | "username" | "email" | "passwordHash" | "displayName" | "createdAt" | "updatedAt"> = {
  statusText: "Living my best life ✨",
  profilePic: "",
  aboutItems: ["🌸 Living life"],
  zodiac: "",
  bloodType: "",
  funFacts: [],
  location: "",
  course: "",
  bio: "",
  customCSS: "",
  bgColor: "#fff0f5",
  textColor: "#333333",
  linkColor: "#cc0066",
  fontFamily: "Tahoma, Arial, sans-serif",
  bgMusicUrl: "",
  bgMusicEnabled: false,
  bgMusicVolume: 0.5,
  cursorEffect: "none",
  marqueeText: "",
  glitterEnabled: false,
  siteTitle: "",
  controlPanelTitle: "Control Panel",
  aboutTitle: "About Me",
  navHomeLabel: "🏠 Home",
  navProfileLabel: "👤 My Profile",
  navGalleryLabel: "📸 Gallery",
  navBlogLabel: "📝 Blog",
  navGuestbookLabel: "📖 Guestbook",
  top8Label: "Top 8",
  top8Count: 8,
  top8Friends: [],
  playlist: [],
  profileSong: { url: "", title: "", startTime: 0, endTime: 20 },
};

router.post("/auth/register", async (req, res) => {
  const { username, email, password, displayName } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ error: "Username, email, and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  if (db.users.findByUsername(username)) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }
  if (db.users.findByEmail(email)) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  const user: User = {
    ...DEFAULT_USER,
    id: uuid(),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    displayName: displayName?.trim() || username.trim(),
    siteTitle: username.trim(),
    createdAt: now,
    updatedAt: now,
  };
  db.users.save(user);
  const token = signToken({ id: user.id, username: user.username });
  const { passwordHash: _, ...safeUser } = user;
  res.status(201).json({ token, user: safeUser });
});

router.post("/auth/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    res.status(400).json({ error: "Username/email and password are required" });
    return;
  }
  const user = db.users.findByUsername(usernameOrEmail) || db.users.findByEmail(usernameOrEmail);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({ id: user.id, username: user.username });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.get("/auth/me", authenticate, (req, res) => {
  const user = db.users.findById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
