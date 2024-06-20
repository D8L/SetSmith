import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function FavoritesPlaylist() {
  const [limit, setLimit] = useState(20);
  const [range, setRange] = useState('medium_term');
  const [playlistName, setPlaylistName] = useState('');
  const [playlistVisibility, setPlaylistVisibility] = useState(1);
  const [message, setMessage] = useState('');
  const [creatingFavorites, setCreatingFavorites] = useState(false);
  const navigate = useNavigate();

  const handleFavoritesPlaylist = async () => {
    setCreatingFavorites(true);
    try {
      const response = await axios.post('http://localhost:5001/favorites-playlist', {
        limit,
        range,
        playlist_name: playlistName,
        playlist_visibility: playlistVisibility,
      }, { withCredentials: true });
      setMessage(response.data.status);
      navigate('/');
    } catch (error) {
      console.error(error);
      setMessage('An error occurred');
    } finally {
      setCreatingFavorites(false);
    }
  };

  return (
    <div className="container">
      <h2 className="my-4 text-center">Create Favorites Playlist</h2>
      <div className="mb-3">
        <label className="form-label">Number of Songs</label>
        <input
          type="number"
          className="form-control"
          placeholder="Number of Songs"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Time Range</label>
        <select className="form-select" value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="short_term">Short-term (4 weeks)</option>
          <option value="medium_term">Medium-term (6 months)</option>
          <option value="long_term">Long-term (lifetime)</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Playlist Name</label>
        <input
          type="text"
          className="form-control"
          placeholder="Playlist Name"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Playlist Visibility</label>
        <select className="form-select" value={playlistVisibility} onChange={(e) => setPlaylistVisibility(e.target.value)}>
          <option value={1}>Public</option>
          <option value={2}>Private</option>
        </select>
      </div>
      <button className="btn btn-primary" onClick={handleFavoritesPlaylist} disabled={creatingFavorites}>
        {creatingFavorites ? 'Creating Playlist...' : 'Create Favorites Playlist'}
      </button>
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}

export default FavoritesPlaylist;