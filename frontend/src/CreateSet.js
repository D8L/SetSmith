import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Circles } from 'react-loader-spinner';
import { useNavigate } from 'react-router-dom';

function CreateSet() {
  const [genres, setGenres] = useState([]);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistVisibility, setPlaylistVisibility] = useState(1);
  const [message, setMessage] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [useGenres, setUseGenres] = useState(false);
  const [duration, setDuration] = useState('');
  const [setDetails, setSetDetails] = useState(null);
  const [creatingSet, setCreatingSet] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await axios.get('http://localhost:5001/user-playlists', { withCredentials: true });
        setPlaylists(response.data.items);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching playlists', error);
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  useEffect(() => {
    if (selectedPlaylist) {
      const fetchGenres = async () => {
        setLoadingGenres(true);
        try {
          const response = await axios.get(`http://localhost:5001/playlist-genres/${selectedPlaylist}`, { withCredentials: true });
          setAvailableGenres(response.data.genres.sort());
          setLoadingGenres(false);
        } catch (error) {
          console.error('Error fetching genres', error);
          setLoadingGenres(false);
        }
      };
      fetchGenres();
    }
  }, [selectedPlaylist]);

  const handleCreateSet = async () => {
    setCreatingSet(true);
    try {
      const response = await axios.post('http://localhost:5001/create-set', {
        genres: useGenres ? genres.join(',') : null,
        playlist_name: playlistName,
        playlist_visibility: playlistVisibility,
        selected_playlist_id: selectedPlaylist,
        duration: duration ? parseInt(duration, 10) : null
      }, { withCredentials: true });
      setSetDetails(response.data.set_details);
      setMessage(response.data.status);
      navigate('/set-details', { state: { setDetails: response.data.set_details } });
    } catch (error) {
      console.error(error);
      setMessage('An error occurred');
    } finally {
      setCreatingSet(false);
    }
  };

  const toggleGenre = (genre) => {
    setGenres((prev) => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };

  const handleInputChange = (e) => {
    const inputGenres = e.target.value.split(',').map(g => g.trim());
    setGenres(inputGenres);
  };

  if (loading) {
    return <p>Loading playlists...</p>;
  }

  return (
    <div>
      <h2>Create Set</h2>
      <select onChange={(e) => setSelectedPlaylist(e.target.value)} value={selectedPlaylist}>
        <option value="">Select a Playlist</option>
        {playlists.map((playlist, index) => (
          <option key={index} value={playlist.id}>{playlist.name}</option>
        ))}
      </select>
      <div>
        <input
          type="checkbox"
          checked={useGenres}
          onChange={() => setUseGenres(!useGenres)}
        />
        <label> Use Genres</label>
      </div>
      {useGenres && (
        <div>
          <h3>Available Genres</h3>
          {loadingGenres ? (
            <div className="spinner">
              <Circles
                height="80"
                width="80"
                color="#4fa94d"
                ariaLabel="circles-loading"
                visible={true}
              />
              <p>Loading genres...</p>
            </div>
          ) : (
            <div className="genres-container">
              {availableGenres.map((genre, index) => (
                <button
                  key={index}
                  className={genres.includes(genre) ? 'genre selected' : 'genre'}
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <input
        type="number"
        placeholder="Duration (in minutes)"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
      />
      <input
        type="text"
        placeholder="Playlist Name"
        value={playlistName}
        onChange={(e) => setPlaylistName(e.target.value)}
      />
      <select value={playlistVisibility} onChange={(e) => setPlaylistVisibility(e.target.value)}>
        <option value={1}>Public</option>
        <option value={2}>Private</option>
      </select>
      <button onClick={handleCreateSet} disabled={creatingSet}>
        {creatingSet ? 'Creating Set...' : 'Create Set'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default CreateSet;
