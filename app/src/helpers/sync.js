"use strict";
const db = require('../persistence');
const fetch = require('node-fetch');
const fs = require('fs');
const assert = require('assert');

async function fetchPlaylists(accessToken) {
   const limit = 50;
   const firstFetch = `https://api.spotify.com/v1/me/playlists?limit=${limit}`;

   const playlists = await getDataFromSpotify(accessToken, firstFetch, (data) => {
      return data.map((item) => Object.assign({
         playlistID: item.id,
         name: item.name,
         numSongs: item.tracks.total,
         pictureURL: item.images[0].url,
      }));
   });
   return playlists;
}

async function fetchTracks(accessToken, playlistID) {
   const limit = 50;
   let fetchURL = `https://api.spotify.com/v1/playlists/${playlistID}/tracks?limit=${limit}`;
   return await getDataFromSpotify(accessToken, fetchURL, (data) => {
      return data.map((item) => Object.assign({
         trackID: item.track.id,
         trackName: item.track.name,
         artistName: item.track.artists[0].name,
         albumName: item.track.album.name,
         length: item.track.duration_ms,
      }));
   });
}

async function fetchAudioFeatures(accessToken, trackIDs) {
   assert(trackIDs.length <= 100);
   const fetchURL = `https://api.spotify.com/v1/audio-features?ids=${trackIDs.join(',')}`
   const response = await fetch(fetchURL, {
      method: 'GET',
      headers: {
         'Accept': 'application/json',
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${accessToken}`,
      }
   });

   const data = await response.json();
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
}

async function getDataFromSpotify(accessToken, fetchURL, unpacker) {
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

async function testPlaylists(req, res) {
   console.log('running testPlaylists');
   // let playlists = fs.readFileSync('/app/src/test/testPlaylistData.json', 'utf8');
   let playlists = readFileSync('/app/src/test/smallPlaylistTest.json', 'utf8');
   playlists = await JSON.parse(playlists);

   await db.storePlaylists(playlists).then((result) => {
      console.log(result);
   }).catch((error) => {
      return Promise.reject(new Error('Error storing playlists in database: ' + error));
   });

   playlists = await db.getPlaylists(null).catch((error) => {
      res.status(500).send('Could not get playlists from database: ' + error);
      return;
   });
   let playlistNames = [];
   for (const {name: name, numSongs: count, playlistID: id} of playlists) {
      playlistNames.push(`${name} (${id}): ${count} songs`);
   }
   res.send(playlistNames);
}

async function testTracks(req, res) {
   console.log('running testTracks');
   let tracks = readFileSync('/app/src/test/smallTrackTest.json', 'utf8');
   tracks = await JSON.parse(tracks);

   await db.storeTracks(tracks).then((result) => {
      console.log(result);
   }).catch((error) => {
      return Promise.reject(new Error('Error storing playlists in database: ' + error));
   });
   res.send('done');
}

module.exports = {
   fetchPlaylists,
   fetchTracks,
   fetchAudioFeatures,
   testPlaylists,
   testTracks,
}
