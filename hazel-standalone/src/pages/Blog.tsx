import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

interface BlogPost {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  date: string;
  mood: string;
  tags: string[];
  coverImg: string;
  claps: number;
}

const MOODS = ['😊 Happy', '😢 Sad', '😤 Stressed', '😴 Tired', '🥰 Grateful', '🤔 Thoughtful', '🎉 Excited', '☕ Cozy'];

const readingTime = (text: string) => Math.max(1, Math.round(text.split(/\s+/).length / 200));

const fmtDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

type View = 'list' | 'write' | 'read';

const Blog: React.FC = () => {
  const { profilePic, settings } = useAppContext();

  const [posts, setPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('hazel_blog_v2');
    if (saved) return JSON.parse(saved);
    const legacy = localStorage.getItem('hazel_blog_v1');
    if (legacy) {
      return JSON.parse(legacy).map((p: any) => ({
        id: p.id, title: p.title, subtitle: '',
        content: p.content, date: p.date, mood: p.mood || MOODS[0],
        tags: [], coverImg: '', claps: 0,
      }));
    }
    return [{
      id: 1,
      title: "First Entry",
      subtitle: "A little note to start things off.",
      content: "Starting this blog to keep track of my thoughts. 🌸 Life as a BSA student is hectic but I love it.\n\nEvery day is a new story waiting to be written. I hope this little corner of the internet becomes a place where I can be honest, creative, and just… me.",
      date: new Date().toISOString().split('T')[0],
      mood: "🥰 Grateful",
      tags: ["life", "bsa", "thoughts"],
      coverImg: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600",
      claps: 0,
    }];
  });

  const [view, setView] = useState<View>('list');
  const [readingPost, setReadingPost] = useState<BlogPost | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(MOODS[0]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [coverImg, setCoverImg] = useState('');
  const [coverUpload, setCoverUpload] = useState('');
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('hazel_blog_v2', JSON.stringify(posts));
  }, [posts]);

  const resetForm = () => {
    setTitle(''); setSubtitle(''); setContent('');
    setMood(MOODS[0]); setTagInput(''); setTags([]);
    setCoverImg(''); setCoverUpload('');
    setEditingPost(null);
  };

  const openWrite = () => { resetForm(); setView('write'); };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title); setSubtitle(post.subtitle);
    setContent(post.content); setMood(post.mood);
    setTags(post.tags); setCoverImg(post.coverImg);
    setCoverUpload('');
    setView('write');
  };

  const openRead = (post: BlogPost) => { setReadingPost(post); setView('read'); };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setCoverUpload(ev.target?.result as string); setCoverImg(''); };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const handlePublish = () => {
    if (!title.trim() || !content.trim()) { alert('Title and content are required.'); return; }
    const finalCover = coverUpload || coverImg;
    if (editingPost) {
      setPosts(prev => prev.map(p => p.id === editingPost.id
        ? { ...p, title, subtitle, content, mood, tags, coverImg: finalCover }
        : p));
    } else {
      const newPost: BlogPost = {
        id: Date.now(), title, subtitle, content,
        date: new Date().toISOString().split('T')[0],
        mood, tags, coverImg: finalCover, claps: 0,
      };
      setPosts([newPost, ...posts]);
    }
    resetForm(); setView('list');
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this post?')) {
      setPosts(prev => prev.filter(p => p.id !== id));
      setView('list'); setReadingPost(null);
    }
  };

  const handleClap = (id: number) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, claps: p.claps + 1 } : p));
    if (readingPost?.id === id) setReadingPost(prev => prev ? { ...prev, claps: prev.claps + 1 } : prev);
  };

  /* ─── EDITOR VIEW ─── */
  if (view === 'write') return (
    <div className="medium-editor">
      <div className="medium-editor-topbar">
        <span className="medium-editor-logo">hazelshey · stories</span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={mood} onChange={e => setMood(e.target.value)} className="medium-mood-select">
            {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="medium-publish-btn" onClick={handlePublish}>
            {editingPost ? 'Update' : 'Publish'}
          </button>
          <button className="medium-cancel-btn" onClick={() => { resetForm(); setView('list'); }}>✕</button>
        </div>
      </div>

      <div className="medium-editor-body">
        <div className="medium-cover-area">
          {(coverUpload || coverImg) ? (
            <div className="medium-cover-preview-wrap">
              <img src={coverUpload || coverImg} alt="Cover" className="medium-cover-preview" />
              <button className="medium-remove-cover" onClick={() => { setCoverImg(''); setCoverUpload(''); }}>✕ Remove</button>
            </div>
          ) : (
            <div className="medium-cover-placeholder" onClick={() => coverRef.current?.click()}>
              📷 Add a cover image
            </div>
          )}
          <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
          {!coverUpload && (
            <input
              className="medium-cover-url"
              placeholder="or paste image URL here..."
              value={coverImg}
              onChange={e => setCoverImg(e.target.value)}
            />
          )}
        </div>

        <input
          className="medium-title-input"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          className="medium-subtitle-input"
          placeholder="Add a subtitle..."
          value={subtitle}
          onChange={e => setSubtitle(e.target.value)}
        />
        <textarea
          className="medium-content-input"
          placeholder="Tell your story..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />

        <div className="medium-tags-area">
          <div className="medium-tags-list">
            {tags.map(t => (
              <span key={t} className="medium-tag">
                {t}
                <span className="medium-tag-remove" onClick={() => setTags(tags.filter(x => x !== t))}>✕</span>
              </span>
            ))}
          </div>
          <div className="medium-tag-input-row">
            <input
              className="medium-tag-input"
              placeholder="Add a tag..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
            />
            <button className="medium-add-tag-btn" onClick={addTag}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── READ VIEW ─── */
  if (view === 'read' && readingPost) {
    const post = posts.find(p => p.id === readingPost.id) || readingPost;
    return (
      <div className="medium-read-view">
        <button className="medium-back-btn" onClick={() => setView('list')}>← Back to Stories</button>

        {post.coverImg && <img src={post.coverImg} alt="Cover" className="medium-read-cover" />}

        <div className="medium-read-body">
          <div className="medium-read-mood">{post.mood}</div>
          <h1 className="medium-read-title">{post.title}</h1>
          {post.subtitle && <p className="medium-read-subtitle">{post.subtitle}</p>}

          <div className="medium-read-meta">
            <img src={profilePic} alt={settings.displayName} className="medium-read-avatar" />
            <div>
              <div className="medium-read-author">{settings.displayName}</div>
              <div className="medium-read-info">
                {fmtDate(post.date)} · {readingTime(post.content)} min read
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button className="medium-edit-btn" onClick={() => openEdit(post)}>Edit</button>
              <button className="medium-delete-btn" onClick={() => handleDelete(post.id)}>Delete</button>
            </div>
          </div>

          <hr className="medium-divider" />

          <div className="medium-read-content">
            {post.content.split('\n').map((para, i) =>
              para.trim() ? <p key={i}>{para}</p> : <br key={i} />
            )}
          </div>

          {post.tags.length > 0 && (
            <div className="medium-read-tags">
              {post.tags.map(t => <span key={t} className="medium-tag-pill">{t}</span>)}
            </div>
          )}

          <div className="medium-clap-section">
            <button className="medium-clap-btn" onClick={() => handleClap(post.id)}>
              👏
            </button>
            <span className="medium-clap-count">{post.claps > 0 ? post.claps : ''}</span>
            <span className="medium-clap-label">{post.claps === 1 ? 'clap' : 'claps'}</span>
          </div>
        </div>
      </div>
    );
  }

  /* ─── LIST VIEW ─── */
  return (
    <>
      <div className="medium-list-header">
        <div>
          <div className="medium-list-title">Stories</div>
          <div className="medium-list-sub">{posts.length} {posts.length === 1 ? 'story' : 'stories'}</div>
        </div>
        <button className="medium-write-btn" onClick={openWrite}>✍️ Write a Story</button>
      </div>

      {posts.length === 0 && (
        <div className="box empty-state"><p>No stories yet. Write your first one! ✍️</p></div>
      )}

      <div className="medium-cards">
        {posts.map(post => (
          <div key={post.id} className="medium-card" onClick={() => openRead(post)}>
            <div className="medium-card-body">
              <div className="medium-card-meta-top">
                <img src={profilePic} alt={settings.displayName} className="medium-card-avatar" />
                <span className="medium-card-author">{settings.displayName}</span>
                <span className="medium-card-dot">·</span>
                <span className="medium-card-date">{fmtDate(post.date)}</span>
              </div>
              <div className="medium-card-main">
                <div className="medium-card-text">
                  <h2 className="medium-card-title">{post.title}</h2>
                  {post.subtitle && <p className="medium-card-subtitle">{post.subtitle}</p>}
                  <p className="medium-card-preview">
                    {post.content.slice(0, 120)}{post.content.length > 120 ? '...' : ''}
                  </p>
                </div>
                {post.coverImg && (
                  <img src={post.coverImg} alt="Cover" className="medium-card-thumb" />
                )}
              </div>
              <div className="medium-card-footer" onClick={e => e.stopPropagation()}>
                <div className="medium-card-tags">
                  <span className="medium-card-mood">{post.mood}</span>
                  {post.tags.slice(0, 2).map(t => (
                    <span key={t} className="medium-tag-pill">{t}</span>
                  ))}
                </div>
                <div className="medium-card-actions">
                  <span className="medium-card-read-time">{readingTime(post.content)} min read</span>
                  <button className="medium-card-clap" onClick={() => handleClap(post.id)}>
                    👏 {post.claps > 0 ? post.claps : ''}
                  </button>
                  <button className="medium-card-edit" onClick={() => openEdit(post)}>Edit</button>
                  <button className="medium-card-del" onClick={() => handleDelete(post.id)}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Blog;
