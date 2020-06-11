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

module.exports = {
   fetchPlaylists,
   fetchTracks,
   fetchAudioFeatures,
}