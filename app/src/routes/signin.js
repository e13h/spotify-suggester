"use strict";
const db = require('../persistence');

module.exports = async (req, res) => {
   const username = req.body.username;
   const password = req.body.password;
   const userID = await db.getUserID(username, password);
   if (userID === null) {
      res.send('Invalid credentials');
      return;
   }
   req.session.accessToken = await(db.getToken(userID));
   res.redirect(`${process.env.APPLICATION_URL}/user/${userID}`);
};
