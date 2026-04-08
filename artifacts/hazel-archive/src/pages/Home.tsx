import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

interface Comment {
  id: number;
  author: string;
  text: string;
  date: string;
  time: string;
}

interface WallPost {
  id: number;
  text: string;
  img: string;
  date: string;
  time: string;
  comments: Comment[];
  likes: number;
}

const STORAGE_KEY = 'hazel_wall_v2';

const getTimestamp = () => {
  const d = new Date();
  return {
    date: d.toLocaleDateString(),
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

const Home: React.FC = () => {
  const { profilePic, settings } = useAppContext();

  const [posts, setPosts] = useState<WallPost[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    const legacy = localStorage.getItem('hazel_archive_v1');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      return parsed.map((p: any) => ({
        id: p.id,
        text: p.text,
        img: p.img || '',
        date: p.date,
        time: p.time || '12:00 PM',
        comments: [],
        likes: 0,
      }));
    }
    return [
      {
        id: 1,
        text: "Welcome to my Freedom Wall! ✨ Drop a message, a memory, or just say hi 🌸",
        img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500",
        date: "04/09/2026",
        time: "10:00 AM",
        comments: [],
        likes: 0,
      }
    ];
  });

  const [text, setText] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [uploadedImg, setUploadedImg] = useState('');
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [commentAuthor, setCommentAuthor] = useState<Record<number, string>>({});
  const imgFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  const handleImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setUploadedImg(ev.target?.result as string); setImgUrl(''); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePost = () => {
    if (!text.trim()) return;
    const { date, time } = getTimestamp();
    const newPost: WallPost = {
      id: Date.now(),
      text,
      img: uploadedImg || imgUrl,
      date,
      time,
      comments: [],
      likes: 0,
    };
    setPosts([newPost, ...posts]);
    setText('');
    setImgUrl('');
    setUploadedImg('');
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Remove this post from the wall?")) {
      setPosts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleLike = (id: number) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

  const toggleComments = (id: number) => {
    setOpenComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComment = (postId: number) => {
    const txt = (commentText[postId] || '').trim();
    if (!txt) return;
    const author = (commentAuthor[postId] || '').trim() || 'Anonymous';
    const { date, time } = getTimestamp();
    const newComment: Comment = { id: Date.now(), author, text: txt, date, time };
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
    ));
    setCommentText(prev => ({ ...prev, [postId]: '' }));
    setCommentAuthor(prev => ({ ...prev, [postId]: '' }));
  };

  const handleDeleteComment = (postId: number, commentId: number) => {
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
        : p
    ));
  };

  return (
    <>
      <div className="box wall-compose-box">
        <div className="box-header">✍️ Post on Hazel's Freedom Wall</div>
        <div className="wall-compose">
          <div className="wall-compose-avatar">
            <img src={profilePic} alt="you" className="wall-mini-avatar" />
          </div>
          <div className="wall-compose-right">
            <textarea
              className="wall-textarea"
              placeholder="What's on your mind, Hazel? ✨"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handlePost(); }}
            />
            <div className="wall-compose-actions">
              <div className="img-input-row">
                <input
                  type="text"
                  placeholder="Paste image URL..."
                  value={imgUrl}
                  onChange={(e) => { setImgUrl(e.target.value); setUploadedImg(''); }}
                  className="wall-url-input"
                />
                <span className="or-text">or</span>
                <button className="upload-btn" onClick={() => imgFileRef.current?.click()}>📷 Photo</button>
                <input ref={imgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImgUpload} />
              </div>
              {uploadedImg && (
                <div className="img-preview-row" style={{ margin: '4px 0' }}>
                  <img src={uploadedImg} alt="Preview" className="img-preview" />
                  <button className="remove-img-btn" onClick={() => setUploadedImg('')}>✕ Remove</button>
                </div>
              )}
              <button className="wall-post-btn" onClick={handlePost}>Post to Wall 💬</button>
            </div>
          </div>
        </div>
      </div>

      <div className="wall-feed-header">
        <span className="wall-feed-title">💬 Hazel's Freedom Wall</span>
        <span className="wall-count">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
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
              <img src={profilePic} alt={settings.displayName} className="wall-post-avatar" />
              {index < posts.length - 1 && <div className="wall-thread-line" />}
            </div>

            <div className="wall-post-body">
              <div className="wall-post-header">
                <span className="wall-post-name">{settings.displayName}</span>
                <span className="wall-post-meta">{post.date} at {post.time}</span>
                <div className="wall-post-actions">
                  <span className="delete-text" onClick={() => handleDelete(post.id)}>[Delete]</span>
                </div>
              </div>

              <p className="wall-post-text">{post.text}</p>

              {post.img && (
                <div className="wall-post-img-wrap">
                  <img src={post.img} alt="wall post" className="wall-post-img" />
                </div>
              )}

              <div className="wall-post-footer">
                <button className="wall-action-btn" onClick={() => handleLike(post.id)}>
                  🩷 {post.likes > 0 ? post.likes : ''} Like
                </button>
                <button className="wall-action-btn" onClick={() => toggleComments(post.id)}>
                  💬 {post.comments.length > 0 ? post.comments.length : ''} Comment{post.comments.length !== 1 ? 's' : ''}
                </button>
              </div>

              {openComments[post.id] && (
                <div className="comments-section">
                  {post.comments.length > 0 && (
                    <div className="comments-list">
                      {post.comments.map(c => (
                        <div key={c.id} className="comment-item">
                          <div className="comment-bubble">
                            <span className="comment-author">{c.author}</span>
                            <span className="comment-text">{c.text}</span>
                          </div>
                          <div className="comment-meta-row">
                            <span className="comment-time">{c.date} at {c.time}</span>
                            <span className="delete-text comment-delete" onClick={() => handleDeleteComment(post.id, c.id)}>[Delete]</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="comment-compose">
                    <img src={profilePic} alt="you" className="comment-avatar" />
                    <div className="comment-inputs">
                      <input
                        className="comment-author-input"
                        placeholder="Your name (optional)"
                        value={commentAuthor[post.id] || ''}
                        onChange={e => setCommentAuthor(prev => ({ ...prev, [post.id]: e.target.value }))}
                      />
                      <div className="comment-input-row">
                        <input
                          className="comment-input"
                          placeholder="Write a comment..."
                          value={commentText[post.id] || ''}
                          onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddComment(post.id); }}
                        />
                        <button className="comment-send-btn" onClick={() => handleAddComment(post.id)}>Send</button>
                      </div>
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
