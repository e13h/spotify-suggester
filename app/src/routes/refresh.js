'use strict';
import db from '../persistence/index.js';
import sync from '../helpers/sync.js';

export default async (req, res) => {
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

   let playlists = await sync.fetchPlaylists(accessToken);
   await db.storePlaylists(playlists, userID).catch((error) => {
      return Promise.reject(new Error('Error storing playlists in database: ' + error));
   });

   let totalDropped = 0;
   for (const playlist of playlists.map((playlist) => [playlist.playlistID])) {
      let tracks = await sync.fetchTracks(accessToken, playlist);
      const totalIncludingNull = tracks.length;
      tracks = tracks.filter(({ trackID }) => trackID !== null); // drop tracks with null trackID
      totalDropped += (totalIncludingNull - tracks.length)

      await db.storeTracks(tracks, userID).catch((error) => {
         return Promise.reject(new Error ('Error storing tracks in database: ' + error));
      });
      const userLibrary = tracks.map((track) => [userID, track.trackID, playlist]);
      await db.storeUserLibrary(userLibrary).catch((error) => {
         return Promise.reject(new Error('Error storing user library in database: ' + error));
      });
   }
   if (totalDropped > 0) {
   console.log(`Dropped ${totalDropped} tracks containing null IDs`);
   }
   
   const trackIDs = await db.getAllTrackIDs(userID);
   let start = 0;
   let end = Math.min(100, trackIDs.length);
   while (start !== end) {
      const audioFeatures = await sync.fetchAudioFeatures(accessToken, trackIDs.slice(start, end));
      db.storeAudioFeatures(audioFeatures, userID);
      start = end;
      end = Math.min(end + 100, trackIDs.length);
   }

   console.log(`Saved ${await db.getNumPlaylists(userID)} playlists and ${(await db.getNumTracks(userID)).unique} tracks.`);

   res.redirect(`${process.env.APPLICATION_URL}/user/${userID}`);
}
