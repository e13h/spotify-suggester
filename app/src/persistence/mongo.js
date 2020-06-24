"use strict";
const MongoClient = require('mongodb').MongoClient;
const waitPort = require('wait-port');
const assert = require('assert');

const {
   MONGO_HOST: HOST,
   MONGO_USER: USER,
   MONGO_PASSWORD: PASSWORD,
   MONGO_DB: DB,
} = process.env;
const PORT = parseInt(process.env.MONGO_PORT);

let db;
let mongo_client;

async function init() {
   await waitPort({ host: HOST, port: PORT, timeout: 15000 });
   const url = `mongodb://${USER}:${PASSWORD}@${HOST}:${PORT}`;
   const client = new MongoClient(url);
   client.connect((err, client) => {
      mongo_client = client;
      assert.equal(null, err);
      console.log('Connected successfully to the server!');
      db = client.db(DB);
   });
}

async function teardown(cleanup=false) {
   if (cleanup) {
      await db.dropDatabase();
   }
   return mongo_client.close();
}

async function usernameExists(username) {
   const query = { username: username };
   const result = await db.collection('UserData').findOne(query, { projection: { username: 1 }});
   return result === null ? false : true;
}

async function getUsername(userID) {
   const query = { _id: userID };
   const result = await db.collection('UserData').findOne(query, { projection: { username: 1 }});
   return result === null ? null : result.username;
}

async function userIDExists(userID) {
   const query = { _id: userID };
   const result = await db.collection('UserData').findOne(query, { projection: { _id: 1 }});
   return result === null ? false : true;
}

async function getUserID(username, password) {
   const query = {
      $and: [
         { username: username },
         { password: password } 
      ]
   };
   const result = await db.collection('UserData').findOne(query, { projection: { _id: 1 }});
   return result === null ? null : result._id;
}

async function getUsers() {
   return db.collection('UserData').find({}, { projection: { _id: 0, username: 1 }}).toArray();
}

async function getToken(userID) {
   const query = { _id: userID };
   const result = await db.collection('Token').findOne(query, { projection: { accessToken: 1 }});
   return result === null ? null : result.accessToken;
}

async function getNumPlaylists(userID) {
   const result = await db.collection('UserData').aggregate([
      { $match: { _id: userID }},
      { $project: {
         _id: 0,
         numPlaylists: {
            $size: {
               $ifNull: [
                  { $objectToArray: "$playlists" },
                  [],
               ]
            }
         },
      }}
   ]).toArray();
   return result[0].numPlaylists;
}

async function getNumTracks(userID) {
   const result = await db.collection('UserData').aggregate([
      { $match: { _id: userID }},
      { $project: {
         _id: 0,
         unique: {
            $size: {
               $ifNull: [
                  { $objectToArray: "$library" },
                  [],
               ]
            }
         }
      }}
   ]).toArray();
   return result[0];
}

async function getAllTrackIDs(userID) {
   const query = { _id: userID };
   const mapFunc = function () {
      for (const key in this.library) {
         emit(key, null);
      }
   };
   const reduceFunc = function() {};
   const options = { out: { inline: 1 }, query: query };
   const result = await db.collection('UserData').mapReduce(mapFunc, reduceFunc, options);
   return result.map(({_id}) => _id);
}

async function getSuggestedTracks(sourceAudioFeatures, userID, trackID) {
   const query = { _id: userID };
   const options = { projection: { _id: 0, library: 1 }};
   const result = await db.collection('UserData').findOne(query, options);
   if (result.library === undefined) {
      return [];
   }
   const computeError = function(a, b) {
      return Math.pow(Math.abs(a - b), 2);
   };
   let scores = {}
   for (const track of Object.values(result.library)) {
      if (track.trackID === trackID) {
         continue;
      }
      const features = track.audioFeatures;
      if (features === undefined) {
         continue;
      }
      const errors = {
         danceability: computeError(features.danceability, sourceAudioFeatures.danceability),
         acousticness: computeError(features.acousticness, sourceAudioFeatures.acousticness),
         energy: computeError(features.energy, sourceAudioFeatures.energy),
         loudness: computeError(features.loudness, sourceAudioFeatures.loudness),
         mode: computeError(features.mode, sourceAudioFeatures.mode),
         tempo: computeError(features.tempo, sourceAudioFeatures.tempo),
         valence: computeError(features.valence, sourceAudioFeatures.valence),
      };
      scores[track.trackID] = Object.values(errors).reduce((a, b) => { return a + b; }, 0);
   }
   const limit = 5;
   const suggestions = Object.entries(scores).sort((a, b) => {
      return a[1] - b[1];
   }).slice(0, limit).map((value) =>  {
      return value[0]
   });
   return await _getTrackInfo(suggestions, userID);
}

async function _getTrackInfo(trackIDs, userID) {
   if (trackIDs.length === 0) {
      return [];
   }
   let query = { _id: userID };
   let options = { projection: {}};
   for (const id of trackIDs) {
      options.projection[`library.${id}`] = 1;
   }
   const result = await db.collection('UserData').findOne(query, options);
   return Object.values(result.library).map(({trackName, artistName}) => `${trackName} by ${artistName}`);
}

async function storeUser(item) {
   const user = {
      _id: item.id,
      username: item.username,
      password: item.password,
   };
   return db.collection('UserData').insertOne(user);
}

async function storeToken(item) {
   const token = {
      _id: item.userID,
      accessToken: item.accessToken,
      expirationUTC: item.expirationUTC,
      refreshToken: item.refreshToken,
   };
   return db.collection('Token').insertOne(token);
}

async function storePlaylists(items, userID) {
   const query = { _id: userID };
   let update = { $set: {} };
   for (const item of items) {
      update['$set'][`playlists.${item.playlistID}`] = item;
   }
   return db.collection('UserData').findOneAndUpdate(query, update);
}

async function storeTracks(items, userID) {
   const query = { _id: userID };
   let update = { $set: {} };
   for (const item of items) {
      update['$set'][`library.${item.trackID}`] = item;
   }
   return db.collection('UserData').findOneAndUpdate(query, update);
}

async function storeAudioFeatures(items, userID) {
   const query = { _id: userID };
   let update = { $set: {} };
   for (const item of items) {
      update['$set'][`library.${item.trackID}.audioFeatures`] = item;
   }
   return db.collection('UserData').findOneAndUpdate(query, update);
}

module.exports = {
   init,
   teardown,
   usernameExists,
   getUsername,
   userIDExists,
   getUserID,
   getUsers,
   getToken,
   getNumPlaylists,
   getNumTracks,
   getAllTrackIDs,
   getSuggestedTracks,
   storeUser,
   storeToken,
   storePlaylists,
   storeTracks,
   storeAudioFeatures,
};
