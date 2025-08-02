// frontend/src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme';
import NavBar from './components/NavBar';
import AppRoutes from './routes';
import LoadingScreen from './components/LoadingScreen';
import './index.css';

const App: React.FC = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // show loader for a brief moment
    document.body.classList.add('loading');
    const timer = setTimeout(() => {
      setLoaded(true);
      document.body.classList.remove('loading');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <NavBar />
        <div style={{ padding: 16, backgroundColor: 'var(--bg)', minHeight: 'calc(100vh - 56px)' }}>
          <AppRoutes />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
