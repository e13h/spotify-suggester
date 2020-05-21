const db = require('../persistence');

module.exports = async (req, res) => {
   const playlists = await db.getPlaylists();
   res.send(playlists);
};
