import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

interface BlogPost {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  visibility: "public" | "friends" | "private" | "specific";
  specificUserId: string;
  coverImage: string;
  comments: any[];
  createdAt: string;
  updatedAt: string;
}

const MOODS = ["😊 Happy","😔 Sad","😡 Angry","😭 Crying","😌 Peaceful","☕ Cozy","🥺 Emotional","💪 Motivated","🤩 Excited","😩 Exhausted","🌸 Soft","✨ Grateful"];

const Blog: React.FC = () => {
  const { profile } = useAppContext();
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "write" | "view">("list");
  const [viewPost, setViewPost] = useState<BlogPost | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [guestName, setGuestName] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public"|"friends"|"private"|"specific">("public");
  const [specificUserId, setSpecificUserId] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const data = await api.blog.getPosts(profile.id);
      setPosts(data);
    } catch {} finally { setLoading(false); }
  }, [profile?.id]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim() || !profile?.id) return;
    setSubmitting(true);
    try {
      const post = await api.blog.createPost(profile.id, { title, content, mood, tags, visibility, specificUserId, coverImage });
      setPosts((prev) => [post, ...prev]);
      setMode("list");
      setTitle(""); setContent(""); setMood(""); setTags([]); setTagInput("");
      setVisibility("public"); setSpecificUserId(""); setCoverImage("");
    } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (postId: string) => {
    if (!profile?.id || !confirm("Delete this post?")) return;
    try {
      await api.blog.deletePost(profile.id, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (viewPost?.id === postId) setMode("list");
    } catch (e: any) { alert(e.message); }
  };

  const handleAddComment = async (post: BlogPost) => {
    const txt = commentText[post.id]?.trim();
    if (!txt || !profile?.id) return;
    try {
      const updated = await api.blog.addComment(profile.id, post.id, {
        text: txt,
        authorName: user?.displayName || guestName || "Anonymous",
      });
      setPosts((prev) => prev.map((p) => p.id === post.id ? updated : p));
      if (viewPost?.id === post.id) setViewPost(updated);
      setCommentText((prev) => ({ ...prev, [post.id]: "" }));
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!profile?.id) return;
    try {
      await api.blog.deleteComment(profile.id, postId, commentId);
      const updated = await api.blog.getPost(profile.id, postId);
      setPosts((prev) => prev.map((p) => p.id === postId ? updated : p));
      if (viewPost?.id === postId) setViewPost(updated);
    } catch (e: any) { alert(e.message); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const readingTime = (text: string) => Math.max(1, Math.ceil(text.split(" ").length / 200));
  const visibilityIcon = (v: string) => v === "public" ? "🌐" : v === "friends" ? "👥" : v === "specific" ? "👤" : "🔒";

  if (mode === "write") {
    return (
      <div className="box blog-write-box">
        <div className="box-header">✍️ Write a New Post</div>
        <div style={{ padding: "16px" }}>
          {coverImage && <img src={coverImage} alt="cover" style={{ width: "100%", maxHeight: "200px", objectFit: "cover", marginBottom: "12px", borderRadius: "3px" }} />}
          <input
            className="blog-title-input"
            placeholder="Give your post a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            style={{ marginBottom: "10px", fontSize: "12px", width: "100%", padding: "6px", border: "1px solid #ffb3d9" }}
            placeholder="Cover image URL (optional)"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
          />
          <textarea
            className="blog-content-input"
            placeholder="Pour your heart out here... 💕 This is your diary, your space."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
          />

          <div className="blog-meta-row">
            <div>
              <label style={{ fontSize: "11px", fontWeight: "bold", display: "block", marginBottom: "3px" }}>Mood</label>
              <select value={mood} onChange={(e) => setMood(e.target.value)} style={{ fontSize: "12px" }}>
                <option value="">— How are you feeling? —</option>
                {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "bold", display: "block", marginBottom: "3px" }}>Who can see this?</label>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)} style={{ fontSize: "12px" }}>
                <option value="public">🌐 Public — anyone can see</option>
                <option value="private">🔒 Private — only me</option>
                <option value="specific">👤 Specific person only</option>
              </select>
              {visibility === "specific" && (
                <input
                  placeholder="User ID of the person"
                  value={specificUserId}
                  onChange={(e) => setSpecificUserId(e.target.value)}
                  style={{ marginTop: "4px", width: "100%", fontSize: "11px", padding: "4px", border: "1px solid #ffb3d9" }}
                />
              )}
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "bold", display: "block", marginBottom: "3px" }}>Tags</label>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add a tag, press Enter"
                style={{ flex: 1, fontSize: "12px", padding: "5px", border: "1px solid #ffb3d9" }}
              />
              <button type="button" className="upload-btn" onClick={addTag}>Add</button>
            </div>
            <div className="tag-list" style={{ marginTop: "6px" }}>
              {tags.map((t) => (
                <span key={t} className="tag-chip">
                  #{t} <span className="tag-remove" onClick={() => setTags((prev) => prev.filter((x) => x !== t))}>✕</span>
                </span>
              ))}
            </div>
          </div>

          {content && <p style={{ fontSize: "11px", color: "#999", margin: "8px 0 0" }}>~{readingTime(content)} min read</p>}

          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <button className="wall-post-btn" onClick={handlePublish} disabled={submitting} style={{ flex: 1 }}>
              {submitting ? "Publishing..." : "📝 Publish Post"}
            </button>
            <button className="cancel-btn" onClick={() => setMode("list")}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "view" && viewPost) {
    return (
      <div className="box">
        <div className="box-header" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>📖 Reading</span>
          <span className="delete-text" style={{ margin: "0 8px" }} onClick={() => setMode("list")}>← Back to Blog</span>
        </div>
        {viewPost.coverImage && (
          <img src={viewPost.coverImage} alt="cover" style={{ width: "100%", maxHeight: "260px", objectFit: "cover" }} />
        )}
        <div style={{ padding: "16px" }}>
          <h2 style={{ margin: "0 0 8px", color: "#cc0066", fontSize: "20px" }}>{viewPost.title}</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
            {viewPost.mood && <span className="blog-mood-chip">{viewPost.mood}</span>}
            <span style={{ color: "#999", fontSize: "11px" }}>{formatDate(viewPost.createdAt)}</span>
            <span style={{ color: "#999", fontSize: "11px" }}>~{readingTime(viewPost.content)} min read</span>
            <span style={{ fontSize: "12px" }} title={viewPost.visibility}>{visibilityIcon(viewPost.visibility)}</span>
            {user?.id === viewPost.userId && (
              <span className="delete-text" onClick={() => handleDelete(viewPost.id)}>[Delete]</span>
            )}
          </div>
          {viewPost.tags.length > 0 && (
            <div className="tag-list" style={{ marginBottom: "12px" }}>
              {viewPost.tags.map((t) => <span key={t} className="tag-chip">#{t}</span>)}
            </div>
          )}
          <div className="blog-content-view">{viewPost.content}</div>

          <div style={{ marginTop: "24px", borderTop: "1px solid #ffb3d9", paddingTop: "16px" }}>
            <div className="wall-feed-header">
              <span className="wall-feed-title">💬 Comments ({viewPost.comments.length})</span>
            </div>
            {viewPost.comments.map((c: any) => (
              <div key={c.id} className="comment-item" style={{ marginBottom: "10px" }}>
                <div className="comment-bubble">
                  <span className="comment-author">{c.authorName}</span>
                  <span className="comment-text">{c.text}</span>
                </div>
                <div className="comment-meta-row">
                  <span className="comment-time">{formatDate(c.createdAt)}</span>
                  {(user?.id === c.authorId || user?.id === viewPost.userId) && (
                    <span className="delete-text comment-delete" onClick={() => handleDeleteComment(viewPost.id, c.id)}>[Delete]</span>
                  )}
                </div>
              </div>
            ))}
            <div className="comment-inputs" style={{ marginTop: "12px" }}>
              {!user && (
                <input
                  className="comment-author-input"
                  placeholder="Your name (optional)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              )}
              <div className="comment-input-row">
                <input
                  className="comment-input"
                  placeholder="Leave a comment..."
                  value={commentText[viewPost.id] || ""}
                  onChange={(e) => setCommentText((prev) => ({ ...prev, [viewPost.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(viewPost); }}
                />
                <button className="comment-send-btn" onClick={() => handleAddComment(viewPost)}>Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="box">
        <div className="box-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>📝 Blog Posts</span>
          {user?.id === profile?.id && (
            <button className="upload-btn" onClick={() => setMode("write")} style={{ margin: "0 6px 0 0" }}>
              ✏️ Write Post
            </button>
          )}
        </div>
      </div>

      {loading && <div className="box empty-state"><p>Loading... 🌸</p></div>}

      {!loading && posts.length === 0 && (
        <div className="box empty-state">
          <p>No blog posts yet!{user?.id === profile?.id ? " Hit 'Write Post' to start your digital diary 🌸" : ""}</p>
        </div>
      )}

      {posts.map((post) => (
        <div key={post.id} className="box blog-card" onClick={() => { setViewPost(post); setMode("view"); }} style={{ cursor: "pointer" }}>
          {post.coverImage && (
            <img src={post.coverImage} alt="cover" style={{ width: "100%", height: "140px", objectFit: "cover" }} />
          )}
          <div style={{ padding: "12px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "6px" }}>
              {post.mood && <span className="blog-mood-chip">{post.mood}</span>}
              <span style={{ color: "#999", fontSize: "11px" }}>{formatDate(post.createdAt)}</span>
              <span style={{ color: "#999", fontSize: "11px" }}>~{readingTime(post.content)} min read</span>
              <span title={post.visibility}>{visibilityIcon(post.visibility)}</span>
            </div>
            <h3 className="blog-card-title">{post.title}</h3>
            <p className="blog-card-preview">{post.content.slice(0, 140)}{post.content.length > 140 ? "..." : ""}</p>
            {post.tags.length > 0 && (
              <div className="tag-list" style={{ marginTop: "6px" }}>
                {post.tags.map((t) => <span key={t} className="tag-chip">#{t}</span>)}
              </div>
            )}
            <div style={{ marginTop: "8px", fontSize: "11px", color: "#cc0066" }}>
              💬 {post.comments.length} comment{post.comments.length !== 1 ? "s" : ""} · Read more →
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default Blog;
