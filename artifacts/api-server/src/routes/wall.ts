import { Router } from "express";
import { v4 as uuid } from "uuid";
import { db, WallPost, WallComment } from "../lib/dataStore.js";
import { authenticate, optionalAuth } from "../middleware/authenticate.js";

const router = Router();

router.get("/wall/:userId", optionalAuth, (req, res) => {
  const posts = db.wallPosts.forUser(req.params.userId);
  res.json(posts);
});

router.post("/wall/:userId", optionalAuth, (req, res) => {
  const { text, img, authorName, authorAvatar, voiceData } = req.body;
  if (!text?.trim() && !img && !voiceData) {
    res.status(400).json({ error: "Post must have text, image, or voice message" }); return;
  }
  const user = req.user ? db.users.findById(req.user.id) : null;
  const post: WallPost = {
    id: uuid(),
    wallOwnerId: req.params.userId,
    authorId: req.user?.id || null,
    authorName: user?.displayName || authorName || "Anonymous",
    authorAvatar: user?.profilePic || authorAvatar || "",
    text: text || "",
    img: img || "",
    comments: [],
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
  };
  db.wallPosts.save(post);
  res.status(201).json(post);
});

router.delete("/wall/:userId/:postId", authenticate, (req, res) => {
  const posts = db.wallPosts.forUser(req.params.userId);
  const post = posts.find((p) => p.id === req.params.postId);
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  if (post.authorId !== req.user!.id && post.wallOwnerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  db.wallPosts.delete(req.params.postId);
  res.json({ ok: true });
});

router.post("/wall/:userId/:postId/like", optionalAuth, (req, res) => {
  const post = db.wallPosts.forUser(req.params.userId).find((p) => p.id === req.params.postId);
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  const userId = req.user?.id || req.body.visitorId || "anon";
  if (post.likedBy.includes(userId)) {
    const updated = db.wallPosts.update(req.params.postId, {
      likes: post.likes - 1,
      likedBy: post.likedBy.filter((id) => id !== userId),
    });
    res.json(updated);
  } else {
    const updated = db.wallPosts.update(req.params.postId, {
      likes: post.likes + 1,
      likedBy: [...post.likedBy, userId],
    });
    res.json(updated);
  }
});

router.post("/wall/:userId/:postId/comments", optionalAuth, (req, res) => {
  const { text, authorName, authorAvatar, voiceData } = req.body;
  if (!text?.trim() && !voiceData) {
    res.status(400).json({ error: "Comment must have text or voice" }); return;
  }
  const post = db.wallPosts.forUser(req.params.userId).find((p) => p.id === req.params.postId);
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  const user = req.user ? db.users.findById(req.user.id) : null;
  const comment: WallComment = {
    id: uuid(),
    authorId: req.user?.id || null,
    authorName: user?.displayName || authorName || "Anonymous",
    authorAvatar: user?.profilePic || authorAvatar || "",
    text: text || "",
    voiceData: voiceData || "",
    createdAt: new Date().toISOString(),
  };
  const updated = db.wallPosts.update(req.params.postId, {
    comments: [...post.comments, comment],
  });
  res.status(201).json(updated);
});

router.delete("/wall/:userId/:postId/comments/:commentId", authenticate, (req, res) => {
  const post = db.wallPosts.forUser(req.params.userId).find((p) => p.id === req.params.postId);
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  const comment = post.comments.find((c) => c.id === req.params.commentId);
  if (!comment) { res.status(404).json({ error: "Comment not found" }); return; }
  if (comment.authorId !== req.user!.id && post.wallOwnerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const updated = db.wallPosts.update(req.params.postId, {
    comments: post.comments.filter((c) => c.id !== req.params.commentId),
  });
  res.json(updated);
});

export default router;
