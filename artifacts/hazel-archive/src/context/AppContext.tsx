import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  profilePic: string;
  setProfilePic: (url: string) => void;
}

const AppContext = createContext<AppContextType>({
  profilePic: '',
  setProfilePic: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profilePic, setProfilePicState] = useState<string>(() => {
    return localStorage.getItem('hazel_pfp_v1') || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop';
  });

  const setProfilePic = (url: string) => {
    setProfilePicState(url);
    localStorage.setItem('hazel_pfp_v1', url);
  };

  return (
    <AppContext.Provider value={{ profilePic, setProfilePic }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
