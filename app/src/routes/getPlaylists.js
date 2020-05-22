const db = require('../persistence');
const refresh = require('./refresh');

module.exports = async (req, res) => {
   await refresh.fetchPlaylists(req.params.userID).catch((error) => {
      res.status(500).send('Could not fetch playlists from Spotify: ' + error);
   });
   const playlists = await db.getPlaylists(req.params.userID).catch((error) => {
      res.status(500).send('Could not get playlists from database: ' + error);
   });
   let playlistNames = [];
   for (const {name: n} of playlists) {
      playlistNames.push(n);
   }
   res.send(playlistNames);
};
