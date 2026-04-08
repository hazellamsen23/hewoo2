import React, { useState, useEffect } from 'react';

interface ArchiveEntry {
  id: number;
  text: string;
  img: string;
  date: string;
}

const Home: React.FC = () => {
  const [archives, setArchives] = useState<ArchiveEntry[]>(() => {
    const saved = localStorage.getItem('hazel_archive_v1');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: "Welcome to my personal archive! 🌸", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500", date: "04/09/2026" }
    ];
  });

  const [text, setText] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [uploadedImg, setUploadedImg] = useState('');
  const imgFileRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('hazel_archive_v1', JSON.stringify(archives));
  }, [archives]);

  const handleImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImg(ev.target?.result as string);
      setImgUrl('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    if (!text.trim()) { alert("Please type a memory first!"); return; }
    const finalImg = uploadedImg || imgUrl;
    const newEntry: ArchiveEntry = {
      id: Date.now(),
      text,
      img: finalImg,
      date: new Date().toLocaleDateString()
    };
    setArchives([newEntry, ...archives]);
    setText('');
    setImgUrl('');
    setUploadedImg('');
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this memory forever?")) {
      setArchives(archives.filter(item => item.id !== id));
    }
  };

  return (
    <>
      <div className="box upload-area">
        <div className="box-header">Create New Archive Entry</div>
        <div className="input-group">
          <textarea
            placeholder="What's the memory today? (e.g. Finished my BSA Midterms!)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="img-input-row">
            <input
              type="text"
              placeholder="Paste an Image URL (optional)"
              value={imgUrl}
              onChange={(e) => { setImgUrl(e.target.value); setUploadedImg(''); }}
            />
            <span className="or-text">or</span>
            <button className="upload-btn" onClick={() => imgFileRef.current?.click()}>📁 Upload Photo</button>
            <input ref={imgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImgUpload} />
          </div>
          {uploadedImg && (
            <div className="img-preview-row">
              <img src={uploadedImg} alt="Preview" className="img-preview" />
              <button className="remove-img-btn" onClick={() => setUploadedImg('')}>✕ Remove</button>
            </div>
          )}
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
    </>
  );
};

export default Home;
