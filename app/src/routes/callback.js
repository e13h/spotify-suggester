const db = require('../persistence');
const fetch = require('node-fetch');

const callback_uri = encodeURIComponent(`${process.env.APPLICATION_URL}/callback`);
const clientIDSecret = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');

module.exports = async (req, res) => {
   if (req.query.error) {
      res.send(`Error: ${req.query.error}`);
   }
   const auth_code = req.query.code;
   const userID = req.query.state;

   const data = `grant_type=authorization_code&code=${auth_code}&redirect_uri=${callback_uri}`;
   fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      body: data,
      headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
         'Authorization': `Basic ${clientIDSecret}`,
         'Accept': 'application/json',
         'Content-Length': data.length,
      }
   }).then(response => response.json()).then(data => {
      const token = {
         accessToken: data.access_token,
         userID: userID,
         refreshToken: data.refresh_token,
         expirationUTC: new Date(Date.now() + (data.expires_in * 1000)).toUTCString(),
      };
      Promise.resolve(db.storeToken(token)).then(() => {
         res.redirect(`${process.env.APPLICATION_URL}/user/${userID}/playlists`);
      }).catch((error) => {
         res.send('Error 404: ' + error);
      });
   }).catch((error) => {
      console.error('Error: ', error);
   });
};
