'use strict';
import './config.js';
import express from 'express';
import session from 'express-session';
import http from 'http';
import SocketIO from 'socket.io';
import path from 'path';
import body_parser from 'body-parser';
import cookie_parser from 'cookie-parser';

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);

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
app.use(body_parser.json())
app.use(cookie_parser());
app.use(express.static(path.join(path.resolve(), '/src/static')));
app.use(session({ secret: "spotify secret! "}));

app.get('/users', getUsers);
app.post('/users', addUser);
app.get('/callback', callback);
app.get('/user/:userID/playlists', getPlaylists);
app.get('/user/:userID/refresh', refresh);
app.get('/user/:userID', profile);
app.post('/signin', signin);

io.on('connection', (socket) => {
   console.log('a client connected!');
   // console.log(socket.handshake);
   // console.log(socket.request.url);
   // socket.on('create account', async (data) => {
   //    const result = await addUserService(data.username, data.password);
   //    socket.emit('create account result', result);
   // });
})

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
