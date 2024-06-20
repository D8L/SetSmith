# SetSmith 🎶

A lightweight web application built for DJs to create and customize sets in Spotify.

## Getting Started

Follow these steps to set up the project on your local machine:

### Creating the Spotify Application

For SetSmith to function, you need to create a Spotify application through the developer dashboard.

1. Click on Create app.
2. Fill out the information.
3. Paste `http://127.0.0.1:5001/callback` for Redirect URI (you can change the port if you wish).
4. Navigate to the Settings of the app.
5. Save the Client ID and Client Secret for the next instructions.

### Running SetSmith with Docker

1. Clone the repository:

    ```sh
    git clone https://github.com/yourusername/SetSmith.git
    ```

2. Navigate to the project directory:

    ```sh
    cd SetSmith
    ```

3. Set the environment variables in the `docker-compose.yml` file with the information obtained from the Spotify developer dashboard:

    ```
        environment:
          - SPOTIPY_CLIENT_ID=<CLIENT_ID_FROM_EARLIER>
          - SPOTIPY_CLIENT_SECRET=<SECRET_ID_FROM_EARLIER>
          - SPOTIPY_REDIRECT_URI=http://127.0.0.1:5001/callback
    ```

4. Ensure you have Docker and Docker Compose installed on your machine.

5. Build and start the services using Docker Compose:

    ```sh
    docker-compose up --build
    ```

6. Open your browser and navigate to `http://127.0.0.1:3000` to access the SetSmith application.

### Built With

- Python
- Flask
- React
- NodeJS
- Spotify API
- Spotipy

## Authors

- D8L

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.
