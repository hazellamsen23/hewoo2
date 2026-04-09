import React from 'react';
import { Switch, Route, Router as WouterRouter } from 'wouter';
import './App.css';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import Blog from './pages/Blog';
import ProfilePage from './pages/ProfilePage';

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return (
    <AppProvider>
      <WouterRouter base={base}>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/gallery" component={Gallery} />
            <Route path="/blog" component={Blog} />
            <Route path="/profile" component={ProfilePage} />
            <Route>
              <div className="box empty-state">
                <p>Page not found. 🌸</p>
              </div>
            </Route>
          </Switch>
        </Layout>
      </WouterRouter>
    </AppProvider>
  );
}

export default App;
