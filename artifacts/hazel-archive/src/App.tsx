import React, { useState, useEffect } from 'react';
import './App.css';

interface ArchiveEntry {
  id: number;
  text: string;
  img: string;
  date: string;
}

const App = () => {
  const [archives, setArchives] = useState<ArchiveEntry[]>(() => {
    const saved = localStorage.getItem('hazel_archive_v1');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: "Welcome to my personal archive! 🌸", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500", date: "04/09/2026" }
    ];
  });

  const [text, setText] = useState('');
  const [imgUrl, setImgUrl] = useState('');

  useEffect(() => {
    localStorage.setItem('hazel_archive_v1', JSON.stringify(archives));
  }, [archives]);

  const handleSave = () => {
    if (!text.trim()) { alert("Please type a memory first!"); return; }
    const newEntry: ArchiveEntry = {
      id: Date.now(),
      text: text,
      img: imgUrl,
      date: new Date().toLocaleDateString()
    };
    setArchives([newEntry, ...archives]);
    setText('');
    setImgUrl('');
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this memory forever?")) {
      setArchives(archives.filter(item => item.id !== id));
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Clear ALL memories? This cannot be undone!")) {
      setArchives([]);
    }
  };

  return (
    <div className="myspace-body">
      <div className="pink-header">
        <div className="header-content">
          <span className="logo">hazelshey</span>
          <div className="search-box">
            Search Archive: <input type="text" /><button>Go</button>
          </div>
        </div>
      </div>

      <div className="main-container">
        <div className="left-column">
          <h2 className="name-title">Hazel</h2>
          <div className="box">
            <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop" alt="Profile" className="profile-pic" />
            <p className="status-text">"Accounting by day, Photography by night" <br/> <span className="online">● ONLINE</span></p>
          </div>

          <div className="box contact-box">
            <div className="box-header">Control Panel</div>
            <div className="contact-links">
              <div className="link">👤 My Profile</div>
              <div className="link">📸 Photo Gallery</div>
              <div className="link">📝 Blog Admin</div>
              <div className="link" onClick={handleClearAll}>🗑️ Clear All</div>
            </div>
          </div>

          <div className="box">
            <div className="box-header">About Me</div>
            <div className="about-content">
              <p>📍 Philippines</p>
              <p>🎓 BSA Student</p>
              <p>🐱 Cat mom to Bobo</p>
              <p>📷 Amateur photographer</p>
              <p>☕ Coffee addict</p>
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="box upload-area">
            <div className="box-header">Create New Archive Entry</div>
            <div className="input-group">
              <textarea
                placeholder="What's the memory today? (e.g. Finished my BSA Midterms!)"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
              />
              <button onClick={handleSave}>Save to Archive ✨</button>
            </div>
          </div>

          <div className="archive-feed">
            <h3 className="feed-title">Hazel's Memories ({archives.length})</h3>
            {archives.length === 0 && (
              <div className="box empty-state">
                <p>No memories yet! Add your first one above. 🌸</p>
              </div>
            )}
            {archives.map(item => (
              <div key={item.id} className="box post-card">
                <div className="post-info">
                  <span>📅 {item.date}</span>
                  <span className="delete-text" onClick={() => handleDelete(item.id)}>[Delete Entry]</span>
                </div>
                <div className="post-content">
                  <p>{item.text}</p>
                  {item.img && <img src={item.img} alt="Archive" className="entry-img" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
