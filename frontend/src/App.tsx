// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme';
import NavBar from './components/NavBar';
import AppRoutes from './routes';
import LoadingScreen from './components/LoadingScreen';
import './index.css';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <NavBar />
        <div style={{ padding: 16, backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
          <AppRoutes />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
