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


const url = `mongodb://${USER}:${PASSWORD}@${HOST}:${PORT}`;
const client = new MongoClient(url);

async function init() {
   console.log(`mongo port: ${PORT}`);
   await waitPort({ host: HOST, port: PORT, timeout: 15000 });
   client.connect((err, client) => {
      assert.equal(null, err);
      console.log('Connected successfully to the server!');
      const db = client.db(DB);
      
      db.collection('users').insertOne({a:1}, (err, result) => {
         assert.equal(null, err);
         assert.equal(1, result.insertedCount);
         client.close();
      });
   });
}

module.exports = {
   init,
}
