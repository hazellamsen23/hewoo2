import React, { useState, useRef } from 'react';
import { useAppContext, SiteSettings } from '../context/AppContext';

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
  const { profilePic, setProfilePic, settings, saveSettings } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Profile data ── */
  const [profile, setProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem('hazel_profile_v1');
    return saved ? JSON.parse(saved) : {
      name: settings.displayName,
      tagline: settings.statusText,
      location: 'Philippines',
      course: 'BSA Student',
      petName: 'Bobo',
      hobby: 'Amateur photographer',
      drink: 'Coffee addict',
      bio: 'Just a girl trying to document every beautiful moment life throws her way. 🌸'
    };
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftProfile, setDraftProfile] = useState<ProfileData>(profile);
  const [profileSaved, setProfileSaved] = useState(false);

  /* ── Site settings ── */
  const [editingSettings, setEditingSettings] = useState(false);
  const [draftSettings, setDraftSettings] = useState<SiteSettings>(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  /* ── PFP ── */
  const handlePfpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePic(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* ── Profile save / cancel ── */
  const handleProfileSave = () => {
    setProfile(draftProfile);
    localStorage.setItem('hazel_profile_v1', JSON.stringify(draftProfile));
    saveSettings({ ...settings, displayName: draftProfile.name, statusText: draftProfile.tagline });
    setEditingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  /* ── Settings helpers ── */
  const updateAboutItem = (i: number, val: string) => {
    const items = [...draftSettings.aboutItems];
    items[i] = val;
    setDraftSettings({ ...draftSettings, aboutItems: items });
  };
  const addAboutItem = () =>
    setDraftSettings({ ...draftSettings, aboutItems: [...draftSettings.aboutItems, ''] });
  const removeAboutItem = (i: number) =>
    setDraftSettings({ ...draftSettings, aboutItems: draftSettings.aboutItems.filter((_, idx) => idx !== i) });

  const handleSettingsSave = () => {
    saveSettings(draftSettings);
    setEditingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  return (
    <>
      {/* ── PROFILE CARD ── */}
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
            {!editingProfile ? (
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
                <button className="edit-profile-btn" onClick={() => { setEditingProfile(true); setDraftProfile(profile); }}>
                  ✏️ Edit Profile
                </button>
                {profileSaved && <span className="saved-msg">✅ Saved!</span>}
              </>
            ) : (
              <div className="edit-form">
                <label>Display Name</label>
                <input value={draftProfile.name} onChange={e => setDraftProfile({ ...draftProfile, name: e.target.value })} />
                <label>Tagline / Status</label>
                <input value={draftProfile.tagline} onChange={e => setDraftProfile({ ...draftProfile, tagline: e.target.value })} />
                <label>Location</label>
                <input value={draftProfile.location} onChange={e => setDraftProfile({ ...draftProfile, location: e.target.value })} />
                <label>Course / Occupation</label>
                <input value={draftProfile.course} onChange={e => setDraftProfile({ ...draftProfile, course: e.target.value })} />
                <label>Pet's Name</label>
                <input value={draftProfile.petName} onChange={e => setDraftProfile({ ...draftProfile, petName: e.target.value })} />
                <label>Hobby</label>
                <input value={draftProfile.hobby} onChange={e => setDraftProfile({ ...draftProfile, hobby: e.target.value })} />
                <label>Favourite Drink</label>
                <input value={draftProfile.drink} onChange={e => setDraftProfile({ ...draftProfile, drink: e.target.value })} />
                <label>Bio</label>
                <textarea value={draftProfile.bio} onChange={e => setDraftProfile({ ...draftProfile, bio: e.target.value })} rows={3} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleProfileSave} style={{ flex: 1 }}>💾 Save Profile</button>
                  <button onClick={() => setEditingProfile(false)} className="cancel-btn">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SITE SETTINGS CARD ── */}
      <div className="box">
        <div className="box-header">⚙️ Site Settings — Edit Everything</div>
        <div style={{ padding: '14px' }}>
          {!editingSettings ? (
            <>
              <div className="settings-preview-grid">
                <div className="settings-row"><span className="settings-label">Site Title</span><span className="settings-value">{settings.siteTitle}</span></div>
                <div className="settings-row"><span className="settings-label">Your Name</span><span className="settings-value">{settings.displayName}</span></div>
                <div className="settings-row"><span className="settings-label">Status Text</span><span className="settings-value">{settings.statusText}</span></div>
                <div className="settings-row"><span className="settings-label">Sidebar Panel Title</span><span className="settings-value">{settings.controlPanelTitle}</span></div>
                <div className="settings-row"><span className="settings-label">About Section Title</span><span className="settings-value">{settings.aboutTitle}</span></div>
                <div className="settings-row"><span className="settings-label">Home Nav Label</span><span className="settings-value">{settings.navHomeLabel}</span></div>
                <div className="settings-row"><span className="settings-label">Profile Nav Label</span><span className="settings-value">{settings.navProfileLabel}</span></div>
                <div className="settings-row"><span className="settings-label">Gallery Nav Label</span><span className="settings-value">{settings.navGalleryLabel}</span></div>
                <div className="settings-row"><span className="settings-label">Blog Nav Label</span><span className="settings-value">{settings.navBlogLabel}</span></div>
                <div className="settings-row" style={{ alignItems: 'flex-start' }}>
                  <span className="settings-label">About Me Items</span>
                  <span className="settings-value">{settings.aboutItems.join(' · ')}</span>
                </div>
              </div>
              <button className="edit-profile-btn" style={{ marginTop: '12px' }} onClick={() => { setEditingSettings(true); setDraftSettings({ ...settings }); }}>
                ✏️ Edit Site Settings
              </button>
              {settingsSaved && <span className="saved-msg">✅ Saved!</span>}
            </>
          ) : (
            <div className="edit-form">
              <label>Site Title (the logo in the header)</label>
              <input value={draftSettings.siteTitle} onChange={e => setDraftSettings({ ...draftSettings, siteTitle: e.target.value })} />

              <label>Your Name (sidebar heading)</label>
              <input value={draftSettings.displayName} onChange={e => setDraftSettings({ ...draftSettings, displayName: e.target.value })} />

              <label>Status Text</label>
              <input value={draftSettings.statusText} onChange={e => setDraftSettings({ ...draftSettings, statusText: e.target.value })} />

              <label>Sidebar Panel Title (e.g. "Control Panel")</label>
              <input value={draftSettings.controlPanelTitle} onChange={e => setDraftSettings({ ...draftSettings, controlPanelTitle: e.target.value })} />

              <label>About Section Title (e.g. "About Me")</label>
              <input value={draftSettings.aboutTitle} onChange={e => setDraftSettings({ ...draftSettings, aboutTitle: e.target.value })} />

              <div className="settings-nav-grid">
                <div>
                  <label>Home Tab Label</label>
                  <input value={draftSettings.navHomeLabel} onChange={e => setDraftSettings({ ...draftSettings, navHomeLabel: e.target.value })} />
                </div>
                <div>
                  <label>Profile Tab Label</label>
                  <input value={draftSettings.navProfileLabel} onChange={e => setDraftSettings({ ...draftSettings, navProfileLabel: e.target.value })} />
                </div>
                <div>
                  <label>Gallery Tab Label</label>
                  <input value={draftSettings.navGalleryLabel} onChange={e => setDraftSettings({ ...draftSettings, navGalleryLabel: e.target.value })} />
                </div>
                <div>
                  <label>Blog Tab Label</label>
                  <input value={draftSettings.navBlogLabel} onChange={e => setDraftSettings({ ...draftSettings, navBlogLabel: e.target.value })} />
                </div>
              </div>

              <label>About Me Items (sidebar bullets)</label>
              <div className="about-items-editor">
                {draftSettings.aboutItems.map((item, i) => (
                  <div key={i} className="about-item-row">
                    <input
                      value={item}
                      onChange={e => updateAboutItem(i, e.target.value)}
                      placeholder={`Item ${i + 1}`}
                    />
                    <button
                      type="button"
                      className="remove-item-btn"
                      onClick={() => removeAboutItem(i)}
                      title="Remove"
                    >✕</button>
                  </div>
                ))}
                <button type="button" className="add-item-btn" onClick={addAboutItem}>
                  + Add Item
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={handleSettingsSave} style={{ flex: 1 }}>💾 Save Settings</button>
                <button onClick={() => setEditingSettings(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
