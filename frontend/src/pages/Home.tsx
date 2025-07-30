import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => (
  <div>
    <h1>Welcome to DevGate!</h1>
    <Link to="/login">Log in</Link>
  </div>
);

export default Home;
