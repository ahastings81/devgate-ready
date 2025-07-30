// frontend/src/components/RequireAuth.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface RequireAuthProps {
  children: JSX.Element;
}

/**
 * Protects routes by checking for a JWT in localStorage.
 * If no token is found, redirects to /login (preserving location).
 */
const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const token = localStorage.getItem('devgate_token');
  const location = useLocation();

  if (!token) {
    // Redirect to /login, preserving the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;
