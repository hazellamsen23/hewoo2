import React, { useEffect, useCallback } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, useSearch } from "wouter";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useAppContext } from "./context/AppContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Gallery from "./pages/Gallery";
import Blog from "./pages/Blog";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import { api } from "./services/api";

function ViewModeWrapper({ children }: { children: React.ReactNode }) {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const viewUserId = params.get("view");
  const { setViewedProfile } = useAppContext();

  const loadViewedProfile = useCallback(async () => {
    if (!viewUserId) { setViewedProfile(null); return; }
    try {
      const p = await api.profile.get(viewUserId);
      setViewedProfile(p);
    } catch { setViewedProfile(null); }
  }, [viewUserId, setViewedProfile]);

  useEffect(() => { loadViewedProfile(); }, [loadViewedProfile]);

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const { profile, viewedProfile } = useAppContext();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#fff0f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🌸</div>
          <p style={{ color: "#cc0066", fontFamily: "Tahoma, sans-serif" }}>Loading your space...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <WouterRouter base={base}>
      <ViewModeWrapper>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/gallery" component={Gallery} />
            <Route path="/blog" component={Blog} />
            <Route>
              <div className="box empty-state">
                <p>Page not found. 🌸</p>
              </div>
            </Route>
          </Switch>
        </Layout>
      </ViewModeWrapper>
    </WouterRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
