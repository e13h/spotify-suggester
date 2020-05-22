require('dotenv').config();
const express = require('express');
const app = express();

const db = require('./persistence');

const getUsers = require('./routes/getUsers');
const addUser = require('./routes/addUser');
const callback = require('./routes/callback');
const refresh = require('./routes/refresh');
const getPlaylists = require('./routes/getPlaylists');
const addToken = require('./routes/addToken');

const port = 3000;

app.use(require('body-parser').urlencoded({ extended: true }));
app.use(express.static(__dirname + '/static'));

app.get('/users', getUsers);
app.post('/users', addUser);
app.get('/callback', callback);
app.get('/user/:userID/playlists', getPlaylists);

db.init().then(() => {
   app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
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
