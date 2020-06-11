"use strict";
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const app = express();

const db = require('./persistence');

const getUsers = require('./routes/getUsers');
const addUser = require('./routes/addUser');
const signin = require('./routes/signin');
const callback = require('./routes/callback');
const refresh = require('./routes/refresh');
const getPlaylists = require('./routes/getPlaylists');
const profile = require('./routes/profile');

const PORT = parseInt(process.env.APPLICATION_PORT);

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(express.static(__dirname + '/static'));
app.use(session({ secret: "spotify secret! "}));

app.get('/users', getUsers);
app.post('/users', addUser);
app.get('/callback', callback);
app.get('/user/:userID/playlists', getPlaylists);
app.get('/user/:userID/refresh', refresh);
app.get('/user/:userID', profile);
app.post('/signin', signin);

db.init().then(() => {
   app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));
}).catch((err) => {
   console.log(err);
   process.exit(1);
});

const gracefulShutdown = () => {
   db.teardown()
       .catch(() => {})
       .then(() => process.exit());
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Sent by nodemon
