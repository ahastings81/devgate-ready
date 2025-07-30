// frontend/src/components/LoadingScreen.tsx
import React from 'react';
import './LoadingScreen.css';
import logo from '../assets/devgate-loader.png';

const LoadingScreen: React.FC = () => {
  return (
    <div className="loader-container">
      <img src={logo} alt="Loading DevGate" className="loader-img" />
    </div>
  );
};

export default LoadingScreen;
