import React, { useRef } from 'react';
import { useLocation } from 'wouter';
import { useAppContext } from '../context/AppContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, navigate] = useLocation();
  const { profilePic, setProfilePic, settings } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePfpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePic(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const navLinks = [
    { label: settings.navHomeLabel,    path: '/' },
    { label: settings.navProfileLabel, path: '/profile' },
    { label: settings.navGalleryLabel, path: '/gallery' },
    { label: settings.navBlogLabel,    path: '/blog' },
  ];

  return (
    <div className="myspace-body">
      <div className="pink-header">
        <div className="header-content">
          <span className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            {settings.siteTitle}
          </span>
          <div className="header-nav">
            {navLinks.map(link => (
              <span
                key={link.path}
                className={`header-nav-link ${location === link.path ? 'active' : ''}`}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="main-container">
        <div className="left-column">
          <h2 className="name-title">{settings.displayName}</h2>

          <div className="box">
            <div className="pfp-wrapper" onClick={() => fileInputRef.current?.click()} title="Click to change profile picture">
              <img src={profilePic} alt="Profile" className="profile-pic" />
              <div className="pfp-overlay">📷 Change Photo</div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePfpChange} />
            <p className="status-text">
              "{settings.statusText}"<br />
              <span className="online">● ONLINE</span>
            </p>
          </div>

          <div className="box contact-box">
            <div className="box-header">{settings.controlPanelTitle}</div>
            <div className="contact-links">
              {navLinks.map(link => (
                <div
                  key={link.path}
                  className={`link ${location === link.path ? 'link-active' : ''}`}
                  onClick={() => navigate(link.path)}
                >
                  {link.label}
                </div>
              ))}
            </div>
          </div>

          <div className="box">
            <div className="box-header">{settings.aboutTitle}</div>
            <div className="about-content">
              {settings.aboutItems.map((item, i) => (
                <p key={i}>{item}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="right-column">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
