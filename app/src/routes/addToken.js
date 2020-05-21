const db = require('../persistence');

module.exports = async (req, res) => {
   const token = {
      accessToken: req.body.access_token,
      userID: req.body.userID,
      refreshToken: req.body.refresh_token,
      expirationUTC: new Date(Date.now() + (req.body.expires_in * 1000)).toUTCString(),
   };
   
   await db.storeToken(token).catch((error) => {
      res.send('Error storing token in database: ' + error);
   });
   res.send('Token stored');
};
