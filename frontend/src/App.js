import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import CreateSet from './CreateSet';
import FavoritesPlaylist from './FavoritesPlaylist';
import SetDetails from './SetDetails';

function App() {
  return (
    <Router>
      <Main />
    </Router>
  );
}

function Main() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5001/check-auth', { withCredentials: true });
        setIsLoggedIn(response.data.isLoggedIn);
      } catch (error) {
        console.error('Error checking authentication', error);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (location.search.includes('login=success')) {
      setIsLoggedIn(true);
      navigate('/');
    }
  }, [location.search, navigate]);

  useEffect(() => {
    console.log('isLoggedIn state changed:', isLoggedIn);
  }, [isLoggedIn]);

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:5001/sign_out', { withCredentials: true });
      setIsLoggedIn(false);
      navigate('/');
    } catch (error) {
      console.error('Error during logout', error);
    }
  };

  return (
    <div className="container d-flex flex-column align-items-center">
      <h1 className="my-4 text-center">SetSmith</h1>
      {!isLoggedIn ? (
        <button className="btn btn-primary" onClick={() => window.location.href = 'http://localhost:5001/login'}>Login with Spotify</button>
      ) : (
        <div className="w-100">
          <nav className="nav nav-pills my-4 justify-content-center">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/create-set">Create Set</Link>
            <Link className="nav-link" to="/favorites-playlist">Favorites Playlist</Link>
            <button onClick={handleLogout} className="btn btn-danger ms-3">Logout</button>
          </nav>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-set" element={<CreateSet />} />
            <Route path="/favorites-playlist" element={<FavoritesPlaylist />} />
            <Route path="/set-details" element={<SetDetails />} />
          </Routes>
        </div>
      )}
    </div>
  );
}

function Home() {
  useEffect(() => {
    console.log('Home component rendered');
  }, []);

  return (
    <div className="text-center">
      <h2 className="my-4">Welcome to SetSmith</h2>
      <p>Select an action from the menu.</p>
    </div>
  );
}

export default App;
