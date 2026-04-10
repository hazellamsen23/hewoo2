import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  statusText: string;
  profilePic: string;
  aboutItems: string[];
  zodiac: string;
  bloodType: string;
  funFacts: string[];
  location: string;
  course: string;
  bio: string;
  customCSS: string;
  bgColor: string;
  textColor: string;
  linkColor: string;
  fontFamily: string;
  bgMusicUrl: string;
  bgMusicEnabled: boolean;
  bgMusicVolume: number;
  cursorEffect: string;
  marqueeText: string;
  glitterEnabled: boolean;
  siteTitle: string;
  controlPanelTitle: string;
  aboutTitle: string;
  navHomeLabel: string;
  navProfileLabel: string;
  navGalleryLabel: string;
  navBlogLabel: string;
  navGuestbookLabel: string;
  top8Label: string;
  top8Count: number;
  top8Friends: any[];
  playlist: any[];
  profileSong: { url: string; title: string; artist?: string; artwork?: string; startTime: number; endTime: number };
}

interface AppContextType {
  profile: UserProfile | null;
  viewedProfile: UserProfile | null;
  setViewedProfile: (p: UserProfile | null) => void;
  saveProfile: (patch: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
  profile: null,
  viewedProfile: null,
  setViewedProfile: () => {},
  saveProfile: async () => {},
  refreshProfile: async () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) { setProfile(null); return; }
    try {
      const p = await api.profile.get(user.id);
      setProfile(p);
    } catch {}
  }, [user]);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  const saveProfile = async (patch: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await api.profile.update(user.id, patch);
    setProfile(updated);
  };

  return (
    <AppContext.Provider value={{ profile, viewedProfile, setViewedProfile, saveProfile, refreshProfile }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
