const db = require('../persistence');

module.exports = async (req, res) => {
   const userID = req.params.userID;
   const accessToken = req.session.accessToken;
   if (accessToken !== await db.getToken(userID)) {
      res.status(403).write('Access token is invalid');
   }
   const playlists = await db.getPlaylists(userID).catch((error) => {
      res.status(500).write('Could not get playlists from database: ' + error);
   });
   res.send(playlists.map(({ name }) => name));
};
