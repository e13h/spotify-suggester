"use strict";
const refresher = require('../helpers/refresh');
const refreshEventEmitter = refresher.eventEmitter;

module.exports = async (req, res) => {
   const userID = req.params.userID;
   const accessToken = req.session.accessToken;
   refresher.refresh(userID, accessToken);
   refreshEventEmitter.on('Error', (userID, msg) => {
      console.log(`Refresh error [${userID}]: ${msg}`);
   });
   refreshEventEmitter.on('Done', (userID) => {
      console.log(`Refresh is complete: ${userID}`);
   });
   refreshEventEmitter.on('Log', (userID, msg) => {
      console.log(`Refresh log [${userID}]: ${msg}`);
   });
   
   res.redirect(`${process.env.APPLICATION_URL}/user/${userID}`);
}
