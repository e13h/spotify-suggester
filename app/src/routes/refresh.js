const db = require('../persistence');
const fetch = require('node-fetch');

async function fetchPlaylists(userID) {
   const accessToken = await db.getToken(userID).catch((error) => {
      return Promise.reject(new Error('Error getting access token from database: ' + error));
   });

   let offset = 0;
   let limit = 50;
   let playlistAbbrev = [];
   let thisFetch = `https://api.spotify.com/v1/me/playlists?offset=${offset}&limit=${limit}`;

   while (thisFetch !== null) {
      const response = await fetch(thisFetch, {
         method: 'GET',
         headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
         }
      });

      const data = await response.json();
      thisFetch = data.next;
      
      for(const item of data.items) {
         playlistAbbrev.push({
            playlistID: item.id,
            userID: userID,
            name: item.name,
            numSongs: item.tracks.total,
            pictureURL: item.images[0].url,
         });
      }
   }

   await db.storePlaylists(playlistAbbrev).catch((error) => {
      return Promise.reject(new Error('Error storing playlists in database: ' + error));
   });

   return playlistAbbrev;
}

module.exports = {
   fetchPlaylists,
};
