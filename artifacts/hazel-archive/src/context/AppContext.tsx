import React, { createContext, useContext, useState } from 'react';

export interface SiteSettings {
  siteTitle: string;
  displayName: string;
  statusText: string;
  controlPanelTitle: string;
  aboutTitle: string;
  navHomeLabel: string;
  navProfileLabel: string;
  navGalleryLabel: string;
  navBlogLabel: string;
  aboutItems: string[];
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: 'hazelshey',
  displayName: 'Hazel',
  statusText: 'Accounting by day, Photography by night',
  controlPanelTitle: 'Control Panel',
  aboutTitle: 'About Me',
  navHomeLabel: '🏠 Home',
  navProfileLabel: '👤 My Profile',
  navGalleryLabel: '📸 Photo Gallery',
  navBlogLabel: '📝 Blog',
  aboutItems: [
    '📍 Philippines',
    '🎓 BSA Student',
    '🐱 Cat mom to Bobo',
    '📷 Amateur photographer',
    '☕ Coffee addict',
  ],
};

interface AppContextType {
  profilePic: string;
  setProfilePic: (url: string) => void;
  settings: SiteSettings;
  saveSettings: (s: SiteSettings) => void;
}

const AppContext = createContext<AppContextType>({
  profilePic: '',
  setProfilePic: () => {},
  settings: DEFAULT_SETTINGS,
  saveSettings: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profilePic, setProfilePicState] = useState<string>(() => {
    return localStorage.getItem('hazel_pfp_v1') ||
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop';
  });

  const [settings, setSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('hazel_settings_v1');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const setProfilePic = (url: string) => {
    setProfilePicState(url);
    localStorage.setItem('hazel_pfp_v1', url);
  };

  const saveSettings = (s: SiteSettings) => {
    setSettings(s);
    localStorage.setItem('hazel_settings_v1', JSON.stringify(s));
  };

  return (
    <AppContext.Provider value={{ profilePic, setProfilePic, settings, saveSettings }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
