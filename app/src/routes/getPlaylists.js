const db = require('../persistence');

module.exports = async (req, res) => {
   const playlists = await db.getPlaylists().catch((error) => {
      res.send('Error getting playlists from database: ' + error);
   });
   res.send(playlists);
};
