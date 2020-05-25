const db = require('../persistence');
const fetch = require('node-fetch');
const fs = require('fs');

async function fetchPlaylists(accessToken) {
   const limit = 50;
   const firstFetch = `https://api.spotify.com/v1/me/playlists?limit=${limit}`;

   const playlists = await getDataFromSpotify(accessToken, firstFetch, (data) => {
      return data.map((item) => Object.assign({
         playlistID: item.id,
         name: item.name,
         numSongs: item.tracks.total,
         pictureURL: item.images[0].url,
      }));
   });
   return playlists;
}

async function fetchTracks(accessToken, playlistID) {
   const limit = 50;
   let fetchURL = `https://api.spotify.com/v1/playlists/${playlistID}/tracks?limit=${limit}`;
   return await getDataFromSpotify(accessToken, fetchURL, (data) => {
      return data.map((item) => Object.assign({
         trackID: item.track.id,
         trackName: item.track.name,
         artistName: item.track.artists[0].name,
         albumName: item.track.album.name,
         length: item.track.duration_ms,
         danceability: 0,
         acousticness: 0,
         energy: 0,
         loudness: 0,
         mode: 0,
         tempo: 0,
         valence: 0,
      }));
   });
}


async function getDataFromSpotify(accessToken, fetchURL, unpacker) {
   let itemsUnpacked = [];
   while (fetchURL !== null) {
      const response = await fetch(fetchURL, {
         method: 'GET',
         headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
         }
      });

      const data = await response.json();
      fetchURL = data.next;
      itemsUnpacked = itemsUnpacked.concat(unpacker(data.items));
   }
   return itemsUnpacked;
}

module.exports = {
   fetchPlaylists,
   fetchTracks,
}