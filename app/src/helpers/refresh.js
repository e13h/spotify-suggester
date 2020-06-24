"use strict";
const db = require('../persistence');
const sync = require('../helpers/sync');
const eventEmitter = new (require('events')).EventEmitter();

async function refresh(userID, accessToken) {
   if (!(await db.userIDExists(userID))) {
      eventEmitter.emit('Error', userID, 'User does not exist');
      return;
   }
   if (accessToken !== await db.getToken(userID)) {
      eventEmitter.emit('Error', userID, 'Access token is invalid');
      return;
   }

   let playlists = await sync.fetchPlaylists(accessToken);
   await db.storePlaylists(playlists, userID).catch((error) => {
      eventEmitter.emit('Error', userID, 'Error storing playlists in database: ' + error);
      return;
   });
   eventEmitter.emit('Log', userID, 'stored playlists in db');

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

   eventEmitter.emit('Done', userID);
}

module.exports = {
   refresh,
   eventEmitter,
}
