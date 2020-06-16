'use strict';
import './config.js';
import express from 'express';
import session from 'express-session';
import http from 'http';
import path from 'path';
import body_parser from 'body-parser';

const app = express();
const server = http.createServer(app);

import db from './persistence/index.js';

import addUserService from './service/addUser.js';

import getUsers from './routes/getUsers.js';
import addUser from './routes/addUser.js';
import signin from './routes/signin.js';
import callback from './routes/callback.js';
import refresh from './routes/refresh.js';
import getPlaylists from './routes/getPlaylists.js';
import profile from './routes/profile.js';

const PORT = parseInt(process.env.APPLICATION_PORT);

app.set('view engine', 'pug');
app.set('views', path.join(path.resolve(), '/src/views'));
app.use(body_parser.urlencoded({ extended: true }));
app.use(express.static(path.join(path.resolve(), '/src/static')));
app.use(session({ secret: "spotify secret! "}));

app.get('/users', getUsers);
app.post('/users', addUser);
app.get('/callback', callback);
app.get('/user/:userID/playlists', getPlaylists);
app.get('/user/:userID/refresh', refresh);
app.get('/user/:userID', profile);
app.post('/signin', signin);

db.init().then(() => {
   server.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));
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
