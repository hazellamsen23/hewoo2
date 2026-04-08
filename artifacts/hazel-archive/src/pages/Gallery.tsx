import React, { useState, useEffect, useRef } from 'react';

interface GalleryPhoto {
  id: number;
  src: string;
  caption: string;
  date: string;
}

const Gallery: React.FC = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(() => {
    const saved = localStorage.getItem('hazel_gallery_v1');
    return saved ? JSON.parse(saved) : [];
  });
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<GalleryPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('hazel_gallery_v1', JSON.stringify(photos));
  }, [photos]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newPhoto: GalleryPhoto = {
          id: Date.now() + Math.random(),
          src: ev.target?.result as string,
          caption: caption || file.name.replace(/\.[^.]+$/, ''),
          date: new Date().toLocaleDateString()
        };
        setPhotos(prev => [newPhoto, ...prev]);
      };
      reader.readAsDataURL(file);
    });
    setCaption('');
    e.target.value = '';
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Remove this photo?")) {
      setPhotos(prev => prev.filter(p => p.id !== id));
      if (preview?.id === id) setPreview(null);
    }
  };

  return (
    <>
      <div className="box upload-area">
        <div className="box-header">📸 Photo Gallery</div>
        <div className="input-group">
          <input
            type="text"
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <button onClick={() => fileInputRef.current?.click()}>
            📁 Upload Photos from Gallery
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>
            You can select multiple photos at once.
          </p>
        </div>
      </div>

      <div className="page-title-bar">
        <h3 className="feed-title">My Photos ({photos.length})</h3>
      </div>

      {photos.length === 0 && (
        <div className="box empty-state">
          <p>No photos yet! Upload some from your gallery above. 📸</p>
        </div>
      )}

      <div className="gallery-grid">
        {photos.map(photo => (
          <div key={photo.id} className="gallery-item" onClick={() => setPreview(photo)}>
            <img src={photo.src} alt={photo.caption} />
            <div className="gallery-caption">{photo.caption}</div>
            <button
              className="gallery-delete"
              onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
            >✕</button>
          </div>
        ))}
      </div>

      {preview && (
        <div className="lightbox" onClick={() => setPreview(null)}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setPreview(null)}>✕ Close</button>
            <img src={preview.src} alt={preview.caption} />
            <p className="lightbox-caption">{preview.caption}</p>
            <p className="lightbox-date">📅 {preview.date}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;
