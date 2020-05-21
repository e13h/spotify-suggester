const db = require('../persistence');
const { v4: uuidv4 } = require('uuid');

const callback_uri = encodeURIComponent(`${process.env.APPLICATION_URL}/callback`);
const scopes = [
   'playlist-read-private'
]

module.exports = async (req, res) => {
   const user = {
      id: uuidv4(),
      username: req.body.username,
      password: req.body.password,
   };

   await db.storeUser(user).catch((error) => {
      res.send('Error storing user in database: ' + error);
   });
   res.redirect(`https://accounts.spotify.com/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${callback_uri}&scope=${scopes.join('%20')}&state=${user.id}`);
   
};
