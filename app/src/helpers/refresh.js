"use strict";
const db = require('../persistence');
const assert = require('assert');
const fetch = require('node-fetch');
const events = require('events');
const statusEmitter = new events.EventEmitter();
const itemEmitter = new events.EventEmitter();

itemEmitter.on('User Verified', (accessToken, userID) => {
   const limit = 50;
   const fetchURL = `https://api.spotify.com/v1/me/playlists?limit=${limit}`;
   getDataFromSpotify(accessToken, userID, fetchURL, db.storePlaylists, 'Playlists', (data) => {
      return data.items.map((item) => Object.assign({
         playlistID: item.id,
         name: item.name,
         numSongs: item.tracks.total,
         pictureURL: item.images[0].url,
      }));
   }, (playlists) => {
      return playlists.map((playlist) => [playlist.playlistID]);
   });
});

itemEmitter.on('Playlists Loaded', (accessToken, userID, playlistIDs) => {
   const limit = 50;
   for (const playlistID of playlistIDs) {
      const fetchURL = `https://api.spotify.com/v1/playlists/${playlistID}/tracks?limit=${limit}`;
      getDataFromSpotify(accessToken, userID, fetchURL, db.storeTracks, 'Tracks', (data) => {
         return data.items.map((item) => Object.assign({
            trackID: item.track.id,
            trackName: item.track.name,
            artistName: item.track.artists[0].name,
            albumName: item.track.album.name,
            length: item.track.duration_ms,
         }));
      }, (tracks) => {
         return tracks.map((track) => [track.trackID]);
      });
   }
});

itemEmitter.on('Tracks Loaded', (accessToken, userID, trackIDs) => {
   assert(trackIDs.length <= 100);
   const fetchURL = `https://api.spotify.com/v1/audio-features?ids=${trackIDs.join(',')}`
   getDataFromSpotify(accessToken, userID, fetchURL, db.storeAudioFeatures, 'Audio Features', (data) => {
      return data.audio_features.map((item) => Object.assign({
         trackID: item.id,
         danceability: item.danceability,
         acousticness: item.acousticness,
         energy: item.energy,
         loudness: item.loudness,
         mode: item.mode,
         tempo: item.tempo,
         valence: item.valence,
      }));
   }, (tracks) => {
      return tracks.map((track) => [track.trackID]);
   });
});

async function getDataFromSpotify(accessToken, userID, fetchURL, dbStoringFunction, itemType, unpacker, extractor) {
   while (fetchURL !== null && fetchURL !== undefined) {
      let timedOut = true;
      let response;
      while (timedOut) {
         response = await fetch(fetchURL, {
            method: 'GET',
            headers: {
               'Accept': 'application/json',
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${accessToken}`,
            }
         });
         if (response.status !== 429 && response.status !== 200) {
            console.log(`Response code from Spotify was: ${response.status}`);
         }
         if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, response.headers.get('Retry-After') * 1000));
         } else {
            timedOut = false;
         }
      }
      const data = await response.json();
      fetchURL = data.next;
      let unpackedItems = unpacker(data);
      if (itemType === 'Tracks') {
         const pretotal = unpackedItems.length;
         unpackedItems = unpackedItems.filter(({ trackID }) => trackID !== null); // drop tracks with null ID
         if (unpackedItems.length - pretotal > 0) {
            statusEmitter.emit('Log', userID, `Dropped ${unpackedItems - pretotal} tracks with null IDs`);
         }
      }
      dbStoringFunction(unpackedItems, userID).catch((error) => {
         statusEmitter.emit('Error', userID, `Error storing ${itemType} in database: ${error}`);
      });
      itemEmitter.emit(`${itemType} Loaded`, accessToken, userID, extractor(unpackedItems));
   }
}

async function refresh(userID, accessToken) {
   if (!(await db.userIDExists(userID))) {
      statusEmitter.emit('Error', userID, 'User does not exist');
      return;
   }
   if (accessToken !== await db.getToken(userID)) {
      statusEmitter.emit('Error', userID, 'Access token is invalid');
      return;
   }

   itemEmitter.emit('User Verified', accessToken, userID);
   statusEmitter.emit('Done', userID);
}

module.exports = {
   refresh,
   emitter: statusEmitter,
}
