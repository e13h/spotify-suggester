# Spotify Suggester
Spotify Suggester is a web app that suggests music to you based on the currently playing track.

[Here](https://github.com/BYUCS452S2020/spotify-suggestor/blob/master/pitch.md) is the project pitch.

See [below](#getting-started) to learn how to get the app up and running on your own computer.

## Team
* Evan Smith
* Madison Nelson

## Implementation Details
Frontend:
* HTML/CSS/Javascript (Vue)

Backend:
* Node (Javascript)
* MySQL
* Docker

Hosted locally (available on the internet using Serveo)

### Nature of Connections
1. Docker spins up server and database
1. Serveo exposes local port on the internet
1. User interactions with the app result in interprocess communication between database and server

# Getting Started
To host Spotify Suggester locally, follow this guide.
## Prerequisites
* [Docker](https://www.docker.com/products/docker-desktop) - for starting up the server and database processes with one command
   * As a side note, while docker makes it super easy to spin up these processes, Docker for Mac [has some issues](https://github.com/docker/for-mac/issues/3232) where it takes up a lot of resources in general, even when no containers are running. I recommend quitting Docker Desktop whenever it is not in use.

## Configure `.env` Environment File
Since there are passwords and other unique tokens required for the server to run, they are included in an environment file name `.env`. This file is not committed to the repository on purpose since including it would allow anyone to see them. The file `.env-default` contains the environment variables that are needed, but the values are replaced with default values.

To set up the environment, you **must**
1. Make a copy of the file `.env-default` and rename it to `.env`
1. Paste in the Client ID and Client Secret unique identifiers, found in your app on the [Spotify Dashboard](developer.spotify.com/dashboard).

Optionally, you may also change the application URL and/or the MySQL database credentials. While it is not required, it is not a good idea to leave the root password for the database as `secret`, but it will do just fine for development purposes.

## Start the Containers
To start up the database and the server, navigate to the `app` directory
```
cd app
```
and run the following command:
```
docker-compose up -d
```
The optional `-d` flag runs the containers in the background (detached).
If you want to see output from any of the containers when you run them detached, simply run the command `docker-compose logs -f`.

**Note**: it might take a while to get started the first time (since it has to download all the images for the first time), but since the images will be cached, it should take considerably less time to start next time.

The server will restart whenever it sees changes to any of the files in the `src` directory. You may have to refresh your browser to see changes. It may also take a moment for the server to restart. You can keep an eye on the status of the program by opening the logs with `docker-compose logs -f`. Once you see the message `Listening at http://localhost:3000` in the logs, it should be live on your browser.

## Open a Tunnel
To expose port 3000 (that the server is running on) to the internet, run the following command:
```
ssh -R spotifysuggester.serveo.net:80:localhost:3000 serveo.net
```
This creates an SSH tunnel to the server listening for traffic on port 3000 of your computer. This allows you to go to the website http://spotifysuggester.serveo.net from any internet-connected device and see the application run. Because of how Spotify redirects the user to authorize the use of its data, this internet connection is required (it won't work to just go to http://localhost:3000).

**Note**: while you could replace `spotifysuggester.serveo.net` in the above command with any subdomain of `serveo.net`, Spotify requires that each redirect domain be whitelisted in the app's settings on the [Spotify Developer Dashboard](developer.spotify.com/dashboard). **In other words, if you change it, Spotify won't give you any data.**

## Shutting Down
If you started the containers detached (using the command `docker-compose up -d`) then simply run the following command (from within the `app` directory) to stop the containers
```
docker-compose down
```
**Note**: if you started the containers in the foreground (without the `-d` flag), pressing `CTRL-C` will stop them.

**Note**: by default, `docker-compose down` doesn't delete or remove the volumes that are created when starting up the containers. This means that in between times you shut down and start up the containers, the database will remain the same. If you want to delete this volume to get a fresh start, simply add the `--volumes` flag to `docker-compose down`
```
docker-compose down --volumes
```
