const db = require('../persistence');
const fetch = require('node-fetch');

async function getDataFromSpotify(userID, fetchURL, unpacker) {
   const accessToken = await db.getToken(userID).catch((error) => {
      return Promise.reject(new Error('Error getting access token from database: ' + error));
   });

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

async function fetchPlaylists(userID) {
   const limit = 50;
   const firstFetch = `https://api.spotify.com/v1/me/playlists?limit=${limit}`;

   const playlists = await getDataFromSpotify(userID, firstFetch, (data) => {
      return data.map((item) => Object.assign({
         playlistID: item.id,
         userID: userID,
         name: item.name,
         numSongs: item.tracks.total,
         pictureURL: item.images[0].url,
      }));
   });

   await db.storePlaylists(playlists).catch((error) => {
      return Promise.reject(new Error('Error storing playlists in database: ' + error));
   });

   // get each track from each playlist
   // await fetchTracksFromPlaylists(userID, playlists.map((item) => { return item.playlistID }));

   return playlists;
}

async function fetchTracksFromPlaylists(userID, playlistIDs) {
   for (const playlistID of playlistIDs) {
      const limit = 50;
      let firstFetch = `https://api.spotify.com/v1/playlists/${playlistID}/tracks?limit=${limit}`;
      
      const tracks = await getDataFromSpotify(userID, firstFetch, (data) => {
         return data.map((item) => Object.assign({
            trackID: item.track.id,
            trackName: item.track.name,
            artistName: item.track.artists[0].name,
            albumName: item.track.album.name,
            length: item.track.duration_ms,
         }));
      });

      // do something with the tracks
   }
}

module.exports = {
   fetchPlaylists,
};
