import express from 'express';
import http from 'http';
import SocketIO from 'socket.io';
import client_io from 'socket.io-client';
import path from 'path';
import fetch from 'node-fetch';
import body_parser from 'body-parser';
import cookie_parser from 'cookie-parser';


// import response from 'spotify-suggester/response';

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);

const serverURL = 'https://3d8300aa7074.ngrok.io';
const socket = client_io(serverURL);
const applicationURL = 'http://localhost:3001';

console.log(path.resolve());
app.use(body_parser.urlencoded({ extended: true }));
app.use(cookie_parser());

app.get('/', (req, res) => {
   console.log(`Access token cookie: ${JSON.stringify(req.cookies.access_token)}`);
   console.log(`Signed Cookies: ${JSON.stringify(req.signedCookies)}`);
   // console.log(`Signed Cookies: ${req.signedCookies}`);
   res.sendFile(path.join(path.resolve(), '/src/index.html'));
   socket.on('create account result', (data) => {
      console.log(data);
      if (!data.error) {
         console.log(data.content.redirectURL);
      }
      res.redirect('http://www.google.com/')
   });
});

app.post('/', async (req, res) => {
   const requestData = {
      username: req.body.username,
      password: req.body.password,
      inquirer: applicationURL,
   }
   const response = await fetch(`${serverURL}/users`, {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: {
         'Accept': 'application/json',
         'Content-Type': 'application/json',
      }
   });
   const data = await response.json().catch((err) => {
      console.log(err);
      console.log(response);
   });
   if (data.error) {
      res.send(data.error);
      return;
   }
   res.redirect(data.content.redirectURL);
});

app.post('/signin', async (req, res) => {
   
   const response = await fetch(`${serverURL}/signin`, {
      method: 'POST',
      body: '',
      headers: {
         'Accept': 'application/json',
         'Content-Type': 'application/json',
      }
   });
   const data = await response.json().catch((err) => {
      console.log(err);
      console.log(response);
   });
   if (data.error) {
      res.send(data.error);
      return;
   }
   res.send(data.content);
});

io.on('connection', (client_socket) => {
   console.log('a user connected');
   // client_socket.on('create account', (data) => {
   //    socket.emit('create account', data);
   // });
   
});

socket.on('connect', () => {
   console.log('connected to server');
});


server.listen(3001, () => console.log('client listening on port 3001'));
