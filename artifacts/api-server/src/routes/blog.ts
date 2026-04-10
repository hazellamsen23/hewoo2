import { Router } from "express";
import { v4 as uuid } from "uuid";
import { db, BlogPost, BlogComment } from "../lib/dataStore.js";
import { authenticate, optionalAuth } from "../middleware/authenticate.js";

const router = Router();

router.get("/blog/:userId", optionalAuth, (req, res) => {
  const posts = db.blogs.forUser(req.params.userId);
  const viewerId = req.user?.id;
  const filtered = posts.filter((p) => {
    if (p.visibility === "public") return true;
    if (!viewerId) return false;
    if (viewerId === p.userId) return true;
    if (p.visibility === "specific") return p.specificUserId === viewerId;
    return false;
  });
  res.json(filtered);
});

router.get("/blog/:userId/:postId", optionalAuth, (req, res) => {
  const post = db.blogs.findById(req.params.postId);
  if (!post || post.userId !== req.params.userId) {
    res.status(404).json({ error: "Post not found" }); return;
  }
  const viewerId = req.user?.id;
  const canView =
    post.visibility === "public" ||
    viewerId === post.userId ||
    (post.visibility === "specific" && post.specificUserId === viewerId);
  if (!canView) { res.status(403).json({ error: "Forbidden" }); return; }
  res.json(post);
});

router.post("/blog/:userId", authenticate, (req, res) => {
  if (req.user!.id !== req.params.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { title, content, mood, tags, visibility, specificUserId, coverImage } = req.body;
  if (!title?.trim() || !content?.trim()) {
    res.status(400).json({ error: "Title and content are required" }); return;
  }
  const now = new Date().toISOString();
  const post: BlogPost = {
    id: uuid(),
    userId: req.params.userId,
    title,
    content,
    mood: mood || "",
    tags: tags || [],
    visibility: visibility || "public",
    specificUserId: specificUserId || "",
    coverImage: coverImage || "",
    comments: [],
    createdAt: now,
    updatedAt: now,
  };
  db.blogs.save(post);
  res.status(201).json(post);
});

router.put("/blog/:userId/:postId", authenticate, (req, res) => {
  if (req.user!.id !== req.params.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const post = db.blogs.findById(req.params.postId);
  if (!post || post.userId !== req.params.userId) {
    res.status(404).json({ error: "Post not found" }); return;
  }
  const { title, content, mood, tags, visibility, specificUserId, coverImage } = req.body;
  const updated = db.blogs.update(req.params.postId, {
    ...(title !== undefined && { title }),
    ...(content !== undefined && { content }),
    ...(mood !== undefined && { mood }),
    ...(tags !== undefined && { tags }),
    ...(visibility !== undefined && { visibility }),
    ...(specificUserId !== undefined && { specificUserId }),
    ...(coverImage !== undefined && { coverImage }),
  });
  res.json(updated);
});

router.delete("/blog/:userId/:postId", authenticate, (req, res) => {
  if (req.user!.id !== req.params.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  db.blogs.delete(req.params.postId);
  res.json({ ok: true });
});

router.post("/blog/:userId/:postId/comments", optionalAuth, (req, res) => {
  const post = db.blogs.findById(req.params.postId);
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  const { text, authorName } = req.body;
  if (!text?.trim()) { res.status(400).json({ error: "Comment text required" }); return; }
  const user = req.user ? db.users.findById(req.user.id) : null;
  const comment: BlogComment = {
    id: uuid(),
    authorId: req.user?.id || null,
    authorName: user?.displayName || authorName || "Anonymous",
    text,
    createdAt: new Date().toISOString(),
  };
  const updated = db.blogs.update(req.params.postId, {
    comments: [...post.comments, comment],
  });
  res.status(201).json(updated);
});

router.delete("/blog/:userId/:postId/comments/:commentId", authenticate, (req, res) => {
  const post = db.blogs.findById(req.params.postId);
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  const comment = post.comments.find((c) => c.id === req.params.commentId);
  if (!comment) { res.status(404).json({ error: "Comment not found" }); return; }
  if (comment.authorId !== req.user!.id && post.userId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  db.blogs.update(req.params.postId, {
    comments: post.comments.filter((c) => c.id !== req.params.commentId),
  });
  res.json({ ok: true });
});

export default router;
