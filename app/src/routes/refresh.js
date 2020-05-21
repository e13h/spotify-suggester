const db = require('../persistence');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
   const userID = req.params.userID;
   const accessToken = await db.getToken(userID);
   let offset = 0;
   
   fetch(`https://api.spotify.com/v1/me/playlists?offset=${offset}`, {
      method: 'GET',
      headers: {
         'Accept': 'application/json',
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${accessToken}`,
      }
   }).then(response => response.json()).then(data => {
      res.send(data);
   }).catch((error) => {
      console.error('Error: ', error);
      res.send('Error 404');
   });
};
