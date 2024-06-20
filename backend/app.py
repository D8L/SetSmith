import os
import logging
from flask import Flask, session, request, redirect, jsonify
from flask_session import Session
from flask_cors import CORS
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from spotipy.cache_handler import FlaskSessionCacheHandler
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(64)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './.flask_session/'
Session(app)

CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

# Spotify API credentials
CLIENT_ID = os.getenv('SPOTIPY_CLIENT_ID')
CLIENT_SECRET = os.getenv('SPOTIPY_CLIENT_SECRET')
REDIRECT_URI = os.getenv('SPOTIPY_REDIRECT_URI')
SCOPE = 'user-library-read user-library-modify playlist-modify-private playlist-modify-public user-top-read'


def create_spotify_oauth():
    return SpotifyOAuth(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        scope=SCOPE,
        cache_handler=FlaskSessionCacheHandler(session),
        show_dialog=True
    )


@app.route('/')
def index():
    return "Welcome to SetSmith!"


@app.route('/login')
def login():
    sp_oauth = create_spotify_oauth()
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)


@app.route('/callback')
def callback():
    sp_oauth = create_spotify_oauth()
    code = request.args.get('code')
    token_info = sp_oauth.get_access_token(code)
    session['token_info'] = token_info
    return redirect('http://localhost:3000?login=success')


@app.route('/check-auth')
def check_auth():
    try:
        token_info = session.get('token_info', None)
        if token_info:
            return jsonify({'isLoggedIn': True})
        else:
            return jsonify({'isLoggedIn': False})
    except Exception as e:
        return jsonify({'isLoggedIn': False, 'error': str(e)}), 500


@app.route('/user-playlists')
def user_playlists():
    token_info = session.get('token_info', None)
    if not token_info:
        return redirect('/login')

    sp = spotipy.Spotify(auth=token_info['access_token'])
    playlists = sp.current_user_playlists()
    return jsonify(playlists)


@app.route('/sign_out')
def sign_out():
    session.pop('token_info', None)
    return redirect('/')


@app.route('/favorites-playlist', methods=['POST'])
def favorites_playlist():
    data = request.json
    limit = data.get('limit')
    range = data.get('range')
    playlist_name = data.get('playlist_name')
    playlist_visibility = data.get('playlist_visibility')

    token_info = session.get('token_info', None)
    if not token_info:
        return redirect('/login')

    sp = spotipy.Spotify(auth=token_info['access_token'])

    # Fetch user's top tracks
    top_tracks = sp.current_user_top_tracks(limit=limit, time_range=range)

    # Create new playlist
    playlist = sp.user_playlist_create(sp.me()['id'], playlist_name, (playlist_visibility == 1), False,
                                       description="Favorites Playlist")
    playlist_id = playlist['id']
    track_uris = [item['uri'] for item in top_tracks['items']]
    sp.playlist_add_items(playlist_id, track_uris)

    return jsonify({'status': 'Favorites playlist created successfully!', 'playlist_id': playlist_id})


@app.route('/create-set', methods=['POST'])
def create_set():
    data = request.json
    genres = data.get('genres')
    playlist_name = data.get('playlist_name')
    playlist_visibility = data.get('playlist_visibility')
    selected_playlist_id = data.get('selected_playlist_id')
    duration = data.get('duration')

    token_info = session.get('token_info', None)
    if not token_info:
        return redirect('/login')

    sp = spotipy.Spotify(auth=token_info['access_token'])

    # Fetch selected playlist tracks
    playlist_tracks = get_playlist_items(sp, selected_playlist_id)

    if genres:
        unique_tracks, songs_by_genre, artist_cache, artist_ids = process_playlist_data(playlist_tracks, sp)
        selected_tracks = []
        for genre in genres.split(','):
            if genre in songs_by_genre:
                selected_tracks.extend(songs_by_genre[genre])
    else:
        selected_tracks = [track['track']['uri'] for track in playlist_tracks]

    if duration:
        # Shuffle selected tracks to ensure randomness
        random.shuffle(selected_tracks)
        total_duration = 0
        final_tracks = []
        for track_uri in selected_tracks:
            track_info = sp.track(track_uri)
            track_duration = track_info['duration_ms'] // 1000  # Convert to seconds
            if total_duration + track_duration <= duration * 60:
                final_tracks.append(track_uri)
                total_duration += track_duration
            if total_duration >= (duration * 60) - 60:
                break
        selected_tracks = final_tracks

    # Create new playlist
    playlist = sp.user_playlist_create(sp.me()['id'], playlist_name, public=(playlist_visibility == 1))
    playlist_id = playlist['id']
    for i in range(0, len(selected_tracks), 100):
        sp.playlist_add_items(playlist_id, selected_tracks[i:i + 100])

    # Prepare set details for sharing
    set_details = []
    current_timestamp = 0
    for track_uri in selected_tracks:
        track_info = sp.track(track_uri)
        artist = track_info['artists'][0]['name']
        name = track_info['name']
        album_cover = track_info['album']['images'][0]['url']
        set_details.append({
            'artist': artist,
            'name': name,
            'timestamp': f"{current_timestamp // 60}:{current_timestamp % 60:02d}",
            'album_cover': album_cover
        })
        current_timestamp += track_info['duration_ms'] // 1000  # Convert to seconds

    return jsonify({'status': 'Playlist created successfully!', 'playlist_id': playlist_id, 'set_details': set_details})


def process_playlist_data(playlist_results, sp):
    unique_tracks = set()
    songs_by_genre = {}
    artist_cache = {}
    artist_ids = set()

    for track in playlist_results:
        track_uri = track['track']['uri']
        if track_uri not in unique_tracks:
            unique_tracks.add(track_uri)
            primary_artist = track['track']['artists'][0]
            artist_id = primary_artist['id']
            if artist_id is not None:
                artist_ids.add(artist_id)

    batch_size = 50
    artist_ids = list(artist_ids)  # convert to a list for batch processing

    for i in range(0, len(artist_ids), batch_size):
        batch_ids = artist_ids[i:i + batch_size]
        batch_artist_info = sp.artists(artists=batch_ids)

        for artist_info in batch_artist_info['artists']:
            artist_id = artist_info['id']
            artist_cache[artist_id] = artist_info

    for track in playlist_results:
        primary_artist = track['track']['artists'][0]
        artist_id = primary_artist['id']

        if artist_id in artist_cache:
            artist_info = artist_cache[artist_id]
            artist_genres = artist_info['genres']

            for genre in artist_genres:
                if genre not in songs_by_genre:
                    songs_by_genre[genre] = []
                songs_by_genre[genre].append(track['track']['uri'])

    return unique_tracks, songs_by_genre, artist_cache, artist_ids


def get_playlist_items(sp, playlist_id):
    playlist_results = []
    playlist_length = sp.playlist(playlist_id)['tracks']['total']
    for i in range(0, playlist_length, 100):
        playlist_batch = sp.playlist_items(playlist_id, limit=100, offset=i, market=None, additional_types=['track'])
        for item in playlist_batch['items']:
            playlist_results.append(item)
    return playlist_results


@app.route('/playlist-genres/<playlist_id>')
def playlist_genres(playlist_id):
    token_info = session.get('token_info', None)
    if not token_info:
        return redirect('/login')
    sp = spotipy.Spotify(auth=token_info['access_token'])
    playlist_tracks = get_playlist_items(sp, playlist_id)
    _, songs_by_genre, _, _ = process_playlist_data(playlist_tracks, sp)
    genres = sorted(songs_by_genre.keys())  # Alphabetize the genres
    return jsonify({'genres': genres})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
