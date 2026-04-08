import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

interface ProfileData {
  name: string;
  tagline: string;
  location: string;
  course: string;
  petName: string;
  hobby: string;
  drink: string;
  bio: string;
}

const ProfilePage: React.FC = () => {
  const { profilePic, setProfilePic } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem('hazel_profile_v1');
    return saved ? JSON.parse(saved) : {
      name: 'Hazel',
      tagline: 'Accounting by day, Photography by night',
      location: 'Philippines',
      course: 'BSA Student',
      petName: 'Bobo',
      hobby: 'Amateur photographer',
      drink: 'Coffee addict',
      bio: 'Just a girl trying to document every beautiful moment life throws her way. 🌸'
    };
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileData>(profile);
  const [saved, setSaved] = useState(false);

  const handlePfpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfilePic(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    setProfile(draft);
    localStorage.setItem('hazel_profile_v1', JSON.stringify(draft));
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  return (
    <>
      <div className="box">
        <div className="box-header">👤 My Profile</div>
        <div className="profile-page-content">
          <div className="profile-pic-section">
            <div className="profile-page-pfp-wrapper" onClick={() => fileInputRef.current?.click()} title="Click to change photo">
              <img src={profilePic} alt="Profile" className="profile-page-pfp" />
              <div className="pfp-overlay">📷 Change Photo</div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePfpChange} />
            <button className="change-pfp-btn" onClick={() => fileInputRef.current?.click()}>
              📁 Upload from Gallery
            </button>
          </div>

          <div className="profile-info-section">
            {!editing ? (
              <>
                <h2 className="profile-page-name">{profile.name}</h2>
                <p className="profile-page-tagline">"{profile.tagline}"</p>
                <div className="profile-detail-grid">
                  <div className="profile-detail"><strong>📍 Location:</strong> {profile.location}</div>
                  <div className="profile-detail"><strong>🎓 Course:</strong> {profile.course}</div>
                  <div className="profile-detail"><strong>🐱 Pet:</strong> {profile.petName}</div>
                  <div className="profile-detail"><strong>📷 Hobby:</strong> {profile.hobby}</div>
                  <div className="profile-detail"><strong>☕ Drink:</strong> {profile.drink}</div>
                </div>
                <div className="profile-bio-box">
                  <div className="box-header" style={{ fontSize: '11px' }}>About Me</div>
                  <p style={{ padding: '10px', margin: 0, fontSize: '12px', lineHeight: 1.6 }}>{profile.bio}</p>
                </div>
                <button className="edit-profile-btn" onClick={() => { setEditing(true); setDraft(profile); }}>
                  ✏️ Edit Profile
                </button>
                {saved && <span className="saved-msg">✅ Saved!</span>}
              </>
            ) : (
              <div className="edit-form">
                <label>Display Name</label>
                <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
                <label>Tagline / Status</label>
                <input value={draft.tagline} onChange={e => setDraft({ ...draft, tagline: e.target.value })} />
                <label>Location</label>
                <input value={draft.location} onChange={e => setDraft({ ...draft, location: e.target.value })} />
                <label>Course / Occupation</label>
                <input value={draft.course} onChange={e => setDraft({ ...draft, course: e.target.value })} />
                <label>Pet's Name</label>
                <input value={draft.petName} onChange={e => setDraft({ ...draft, petName: e.target.value })} />
                <label>Hobby</label>
                <input value={draft.hobby} onChange={e => setDraft({ ...draft, hobby: e.target.value })} />
                <label>Favourite Drink</label>
                <input value={draft.drink} onChange={e => setDraft({ ...draft, drink: e.target.value })} />
                <label>Bio</label>
                <textarea value={draft.bio} onChange={e => setDraft({ ...draft, bio: e.target.value })} rows={3} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSave} style={{ flex: 1 }}>💾 Save Profile</button>
                  <button onClick={handleCancel} className="cancel-btn">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
