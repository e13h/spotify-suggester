const db = require('../persistence');

module.exports = async (req, res) => {
   const userID = req.params.userID;
   const accessToken = req.session.accessToken;
   if (accessToken !== await db.getToken(userID)) {
      res.status(403).send('You do not have access');
      return;
   }
   
   const fetchURL = 'insert fetch API URL here';
   const response = await fetch(fetchURL, {
      method: 'GET',
      headers: {
         'Accept': 'application/json',
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${accessToken}`,
      }
   });
   const data = await response.json();
   res.send(`Current song: ${data.track.name}
   Current artist: ${data.track.artists[0].name}
   Current album: ${data.track.album.name}
   Current album artwork: ${data.track.url}`);
};