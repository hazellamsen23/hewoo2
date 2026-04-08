import React, { useState, useEffect } from 'react';

interface BlogPost {
  id: number;
  title: string;
  content: string;
  date: string;
  mood: string;
}

const MOODS = ['😊 Happy', '😢 Sad', '😤 Stressed', '😴 Tired', '🥰 Grateful', '🤔 Thoughtful', '🎉 Excited', '☕ Cozy'];

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('hazel_blog_v1');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: "First Entry", content: "Starting this blog to keep track of my thoughts. 🌸 Life as a BSA student is hectic but I love it.", date: "04/09/2026", mood: "🥰 Grateful" }
    ];
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(MOODS[0]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editing, setEditing] = useState<BlogPost | null>(null);

  useEffect(() => {
    localStorage.setItem('hazel_blog_v1', JSON.stringify(posts));
  }, [posts]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) { alert("Please fill in both title and content!"); return; }
    if (editing) {
      setPosts(prev => prev.map(p => p.id === editing.id ? { ...p, title, content, mood } : p));
      setEditing(null);
    } else {
      const newPost: BlogPost = {
        id: Date.now(),
        title,
        content,
        mood,
        date: new Date().toLocaleDateString()
      };
      setPosts([newPost, ...posts]);
    }
    setTitle('');
    setContent('');
    setMood(MOODS[0]);
  };

  const handleEdit = (post: BlogPost) => {
    setEditing(post);
    setTitle(post.title);
    setContent(post.content);
    setMood(post.mood);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this blog post?")) {
      setPosts(prev => prev.filter(p => p.id !== id));
      if (expanded === id) setExpanded(null);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setTitle('');
    setContent('');
    setMood(MOODS[0]);
  };

  return (
    <>
      <div className="box upload-area">
        <div className="box-header">{editing ? '✏️ Edit Blog Post' : '📝 New Blog Post'}</div>
        <div className="input-group">
          <input
            type="text"
            placeholder="Post title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Write your thoughts here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ height: '120px' }}
          />
          <div className="mood-row">
            <label style={{ fontSize: '12px', color: '#cc0066', fontWeight: 'bold' }}>Today's mood:</label>
            <select value={mood} onChange={(e) => setMood(e.target.value)} className="mood-select">
              {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSave} style={{ flex: 1 }}>
              {editing ? 'Update Post ✏️' : 'Publish Post 📝'}
            </button>
            {editing && (
              <button onClick={handleCancel} className="cancel-btn">Cancel</button>
            )}
          </div>
        </div>
      </div>

      <h3 className="feed-title">My Blog ({posts.length})</h3>

      {posts.length === 0 && (
        <div className="box empty-state">
          <p>No blog posts yet! Write your first one above. 📝</p>
        </div>
      )}

      {posts.map(post => (
        <div key={post.id} className="box post-card">
          <div className="post-info">
            <span>📅 {post.date} &nbsp;·&nbsp; {post.mood}</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="edit-text" onClick={() => handleEdit(post)}>[Edit]</span>
              <span className="delete-text" onClick={() => handleDelete(post.id)}>[Delete]</span>
            </div>
          </div>
          <div className="post-content">
            <h4 className="blog-post-title" onClick={() => setExpanded(expanded === post.id ? null : post.id)}>
              {post.title}
              <span className="expand-hint">{expanded === post.id ? ' ▲' : ' ▼'}</span>
            </h4>
            {expanded === post.id && (
              <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{post.content}</p>
            )}
            {expanded !== post.id && (
              <p className="blog-preview">{post.content.slice(0, 100)}{post.content.length > 100 ? '...' : ''}</p>
            )}
          </div>
        </div>
      ))}
    </>
  );
};

export default Blog;
