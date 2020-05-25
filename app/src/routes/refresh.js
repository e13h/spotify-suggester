const db = require('../persistence');
const sync = require('../helpers/sync');

module.exports = async (req, res) => {
   const userID = req.params.userID;
   const accessToken = req.session.accessToken;
   if (!(await db.userIDExists(userID))) {
      res.send(`User "${userID}" does not exist`);
      return;
   }
   if (accessToken !== await db.getToken(userID)) {
      res.status(403).send('Access token is invalid');
      return;
   }

   const playlists = await sync.fetchPlaylists(accessToken);
   await db.storePlaylists(playlists).catch((error) => {
      return Promise.reject(new Error('Error storing playlists in database: ' + error));
   });

   let totalDropped = 0;
   for (const playlist of playlists.map((playlist) => [playlist.playlistID])) {
      let tracks = await sync.fetchTracks(accessToken, playlist);
      const totalIncludingNull = tracks.length;
      tracks = tracks.filter(({ trackID }) => trackID !== null); // drop tracks with null trackID
      totalDropped += (totalIncludingNull - tracks.length)

      await db.storeTracks(tracks).catch((error) => {
         return Promise.reject(new Error ('Error storing tracks in database: ' + error));
      });
      const userLibrary = tracks.map((track) => [userID, track.trackID, playlist]);
      await db.storeUserLibrary(userLibrary).catch((error) => {
         return Promise.reject(new Error('Error storing user library in database: ' + error));
      });
   }
   console.log(`Dropped ${totalDropped} tracks containing null IDs`);

   console.log(`Saved ${await db.getNumPlaylists(userID)} playlists and ${(await db.getNumTracks(userID)).unique} tracks.`);

   res.redirect(`${process.env.APPLICATION_URL}/user/${userID}`);
}
