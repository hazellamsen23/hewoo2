import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

interface WallPost {
  id: number;
  text: string;
  img: string;
  date: string;
  time: string;
}

const Home: React.FC = () => {
  const { profilePic, settings } = useAppContext();

  const [posts, setPosts] = useState<WallPost[]>(() => {
    const saved = localStorage.getItem('hazel_archive_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((p: any) => ({
        ...p,
        time: p.time || '12:00 PM',
      }));
    }
    return [
      {
        id: 1,
        text: "Welcome to my Freedom Wall! ✨ Drop a message, a memory, or just say hi 🌸",
        img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500",
        date: "04/09/2026",
        time: "10:00 AM",
      }
    ];
  });

  const [text, setText] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [uploadedImg, setUploadedImg] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const imgFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('hazel_archive_v1', JSON.stringify(posts));
  }, [posts]);

  const handleImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setUploadedImg(ev.target?.result as string); setImgUrl(''); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const now = () => {
    const d = new Date();
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const handlePost = () => {
    if (!text.trim()) return;
    const { date, time } = now();
    const newPost: WallPost = {
      id: Date.now(),
      text,
      img: uploadedImg || imgUrl,
      date,
      time,
    };
    setPosts([newPost, ...posts]);
    setText('');
    setImgUrl('');
    setUploadedImg('');
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Remove this post from the wall?")) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  const handleEditSave = (id: number) => {
    setPosts(posts.map(p => p.id === id ? { ...p, text: editText } : p));
    setEditingId(null);
    setEditText('');
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
              <button className="wall-post-btn" onClick={handlePost}>
                Post to Wall 💬
              </button>
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
                <span className="wall-post-meta">
                  {post.date} at {post.time}
                </span>
                <div className="wall-post-actions">
                  <span className="edit-text" onClick={() => { setEditingId(post.id); setEditText(post.text); }}>[Edit]</span>
                  <span className="delete-text" onClick={() => handleDelete(post.id)}>[Delete]</span>
                </div>
              </div>

              {editingId === post.id ? (
                <div className="wall-edit-form">
                  <textarea
                    className="wall-textarea"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button className="wall-post-btn" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => handleEditSave(post.id)}>
                      💾 Save
                    </button>
                    <button className="cancel-btn" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="wall-post-text">{post.text}</p>
              )}

              {post.img && !editingId && (
                <div className="wall-post-img-wrap">
                  <img src={post.img} alt="wall post" className="wall-post-img" />
                </div>
              )}

              <div className="wall-post-footer">
                <span className="wall-heart">🩷 Like</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Home;
