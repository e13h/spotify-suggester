const db = require('../persistence');
const fetch = require('node-fetch');

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
   res.send(`Current song: ${data.item.name}
   Current artist: ${data.item.artists[0].name}
   Current album: ${data.item.album.name}
   Current album artwork: ${data.item.album.images[0].url}`);
};
