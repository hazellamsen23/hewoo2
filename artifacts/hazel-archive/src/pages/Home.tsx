import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { useLocation } from "wouter";

interface WallPost {
  id: string;
  wallOwnerId: string;
  authorId: string | null;
  authorName: string;
  authorAvatar: string;
  text: string;
  img: string;
  comments: any[];
  likes: number;
  likedBy: string[];
  createdAt: string;
}

const Home: React.FC = () => {
  const { profile } = useAppContext();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [uploadedImg, setUploadedImg] = useState("");
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [guestName, setGuestName] = useState("");
  const imgFileRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState<Record<string, boolean>>({});
  const [voiceData, setVoiceData] = useState<Record<string, string>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [postVoice, setPostVoice] = useState("");
  const [recordingPost, setRecordingPost] = useState(false);
  const wallOwner = profile;

  const loadPosts = useCallback(async () => {
    if (!wallOwner?.id) return;
    try {
      const data = await api.wall.getPosts(wallOwner.id);
      setPosts(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [wallOwner?.id]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setUploadedImg(ev.target?.result as string); setImgUrl(""); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const startPostRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = (ev) => setPostVoice(ev.target?.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecordingPost(true);
    } catch { alert("Microphone access denied"); }
  };

  const stopPostRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecordingPost(false);
  };

  const startCommentRecording = async (postId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const localChunks: Blob[] = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) localChunks.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(localChunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = (ev) => setVoiceData((prev) => ({ ...prev, [postId]: ev.target?.result as string }));
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording((prev) => ({ ...prev, [postId]: true }));
    } catch { alert("Microphone access denied"); }
  };

  const stopCommentRecording = (postId: string) => {
    mediaRecorderRef.current?.stop();
    setRecording((prev) => ({ ...prev, [postId]: false }));
  };

  const handlePost = async () => {
    if (!text.trim() && !uploadedImg && !imgUrl && !postVoice) return;
    if (!wallOwner) return;
    try {
      const post = await api.wall.createPost(wallOwner.id, {
        text,
        img: uploadedImg || imgUrl,
        authorName: user?.displayName || guestName || "Anonymous",
        voiceData: postVoice,
      });
      setPosts((prev) => [post, ...prev]);
      setText(""); setImgUrl(""); setUploadedImg(""); setPostVoice("");
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (postId: string) => {
    if (!wallOwner || !confirm("Remove this post?")) return;
    try {
      await api.wall.deletePost(wallOwner.id, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e: any) { alert(e.message); }
  };

  const handleLike = async (postId: string) => {
    if (!wallOwner) return;
    try {
      const updated = await api.wall.likePost(wallOwner.id, postId, user?.id || "visitor");
      setPosts((prev) => prev.map((p) => p.id === postId ? updated : p));
    } catch {}
  };

  const handleAddComment = async (postId: string) => {
    const txt = commentText[postId]?.trim();
    const vd = voiceData[postId];
    if (!txt && !vd) return;
    if (!wallOwner) return;
    try {
      const updated = await api.wall.addComment(wallOwner.id, postId, {
        text: txt || "",
        authorName: user?.displayName || guestName || "Anonymous",
        voiceData: vd || "",
      });
      setPosts((prev) => prev.map((p) => p.id === postId ? updated : p));
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      setVoiceData((prev) => ({ ...prev, [postId]: "" }));
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!wallOwner) return;
    try {
      const updated = await api.wall.deleteComment(wallOwner.id, postId, commentId);
      setPosts((prev) => prev.map((p) => p.id === postId ? updated : p));
    } catch (e: any) { alert(e.message); }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + " at " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <div className="box empty-state"><p>Loading... 🌸</p></div>;

  return (
    <>
      <div className="box wall-compose-box">
        <div className="box-header">✍️ Post on the Freedom Wall</div>
        <div className="wall-compose">
          <div className="wall-compose-avatar">
            <img
              src={user ? (profile?.profilePic || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`) : "https://api.dicebear.com/7.x/pixel-art/svg?seed=guest"}
              alt="you"
              className="wall-mini-avatar"
            />
          </div>
          <div className="wall-compose-right">
            {!user && (
              <input
                className="wall-url-input"
                placeholder="Your name (optional)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                style={{ marginBottom: "6px" }}
              />
            )}
            <textarea
              className="wall-textarea"
              placeholder="What's on your mind? ✨"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handlePost(); }}
            />
            <div className="wall-compose-actions">
              <div className="img-input-row">
                <input
                  type="text"
                  placeholder="Paste image URL..."
                  value={imgUrl}
                  onChange={(e) => { setImgUrl(e.target.value); setUploadedImg(""); }}
                  className="wall-url-input"
                />
                <span className="or-text">or</span>
                <button className="upload-btn" onClick={() => imgFileRef.current?.click()}>📷 Photo</button>
                <input ref={imgFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImgUpload} />
                <button
                  className={`upload-btn ${recordingPost ? "recording-btn" : ""}`}
                  onClick={recordingPost ? stopPostRecording : startPostRecording}
                >
                  {recordingPost ? "⏹ Stop" : "🎙 Voice"}
                </button>
              </div>
              {uploadedImg && (
                <div className="img-preview-row">
                  <img src={uploadedImg} alt="Preview" className="img-preview" />
                  <button className="remove-img-btn" onClick={() => setUploadedImg("")}>✕</button>
                </div>
              )}
              {postVoice && (
                <div className="voice-preview">
                  <audio src={postVoice} controls style={{ height: "32px" }} />
                  <button className="remove-img-btn" onClick={() => setPostVoice("")}>✕</button>
                </div>
              )}
              <button className="wall-post-btn" onClick={handlePost}>Post to Wall 💬</button>
            </div>
          </div>
        </div>
      </div>

      <div className="wall-feed-header">
        <span className="wall-feed-title">💬 Freedom Wall</span>
        <span className="wall-count">{posts.length} {posts.length === 1 ? "post" : "posts"}</span>
      </div>

      {posts.length === 0 && (
        <div className="box empty-state">
          <p>The wall is empty! Be the first to post. 🌸</p>
        </div>
      )}

      <div className="wall-thread">
        {posts.map((post, index) => (
          <div key={post.id} className="wall-post">
            <div className="wall-post-avatar-col">
              <img
                src={post.authorAvatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.authorName}`}
                alt={post.authorName}
                className="wall-post-avatar"
              />
              {index < posts.length - 1 && <div className="wall-thread-line" />}
            </div>

            <div className="wall-post-body">
              <div className="wall-post-header">
                <span className="wall-post-name">{post.authorName}</span>
                <span className="wall-post-meta">{formatDate(post.createdAt)}</span>
                <div className="wall-post-actions">
                  {(user?.id === post.authorId || user?.id === post.wallOwnerId) && (
                    <span className="delete-text" onClick={() => handleDelete(post.id)}>[Delete]</span>
                  )}
                </div>
              </div>

              {post.text && <p className="wall-post-text">{post.text}</p>}
              {post.img && (
                <div className="wall-post-img-wrap">
                  <img src={post.img} alt="wall post" className="wall-post-img" />
                </div>
              )}
              {(post as any).voiceData && (
                <audio src={(post as any).voiceData} controls className="wall-voice" style={{ margin: "6px 0", height: "36px" }} />
              )}

              <div className="wall-post-footer">
                <button className="wall-action-btn" onClick={() => handleLike(post.id)}>
                  🩷 {post.likes > 0 ? post.likes : ""} Like
                </button>
                <button className="wall-action-btn" onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}>
                  💬 {post.comments.length > 0 ? post.comments.length : ""} Comment{post.comments.length !== 1 ? "s" : ""}
                </button>
              </div>

              {openComments[post.id] && (
                <div className="comments-section">
                  {post.comments.length > 0 && (
                    <div className="comments-list">
                      {post.comments.map((c: any) => (
                        <div key={c.id} className="comment-item">
                          <div className="comment-bubble">
                            <img
                              src={c.authorAvatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${c.authorName}`}
                              alt={c.authorName}
                              className="comment-avatar-small"
                            />
                            <div>
                              <span className="comment-author">{c.authorName}</span>
                              {c.text && <span className="comment-text">{c.text}</span>}
                              {c.voiceData && <audio src={c.voiceData} controls style={{ height: "28px", marginTop: "4px" }} />}
                            </div>
                          </div>
                          <div className="comment-meta-row">
                            <span className="comment-time">{formatDate(c.createdAt)}</span>
                            {(user?.id === c.authorId || user?.id === post.wallOwnerId) && (
                              <span className="delete-text comment-delete" onClick={() => handleDeleteComment(post.id, c.id)}>[Delete]</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="comment-compose">
                    <img
                      src={user ? (profile?.profilePic || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`) : "https://api.dicebear.com/7.x/pixel-art/svg?seed=guest"}
                      alt="you"
                      className="comment-avatar"
                    />
                    <div className="comment-inputs">
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
                          placeholder="Write a comment..."
                          value={commentText[post.id] || ""}
                          onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(post.id); }}
                        />
                        <button
                          className={`upload-btn ${recording[post.id] ? "recording-btn" : ""}`}
                          onClick={() => recording[post.id] ? stopCommentRecording(post.id) : startCommentRecording(post.id)}
                          title="Voice comment"
                        >
                          {recording[post.id] ? "⏹" : "🎙"}
                        </button>
                        <button className="comment-send-btn" onClick={() => handleAddComment(post.id)}>Send</button>
                      </div>
                      {voiceData[post.id] && (
                        <div className="voice-preview">
                          <audio src={voiceData[post.id]} controls style={{ height: "28px" }} />
                          <button className="remove-img-btn" onClick={() => setVoiceData((prev) => ({ ...prev, [post.id]: "" }))}>✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Home;
