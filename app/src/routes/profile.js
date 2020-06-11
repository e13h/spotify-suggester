"use strict";
const db = require('../persistence');
const fetch = require('node-fetch');
const suggest = require('../helpers/suggest');

module.exports = async (req, res) => {
   const userID = req.params.userID;
   const accessToken = req.session.accessToken;
   if (accessToken !== await db.getToken(userID)) {
      res.status(403).send('You do not have access');
      return;
   }
   
   const fetchURL = 'https://api.spotify.com/v1/me/player/currently-playing';
   const response = await fetch(fetchURL, {
      method: 'GET',
      headers: {
         'Accept': 'application/json',
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${accessToken}`,
      }
   });
   const data = await response.json();

   res.render('profile', {
      userID: userID,
      user: await db.getUsername(userID),
      numPlaylists: await db.getNumPlaylists(userID),
      numTracks: (await db.getNumTracks(userID)).unique,
      trackName: data.item.name,
      artist: data.item.artists[0].name,
      album: data.item.album.name,
      artworkUrl: data.item.album.images[0].url,
      suggestions: await suggest.makeSuggestions(accessToken, data.item.id, userID),
   });
};
