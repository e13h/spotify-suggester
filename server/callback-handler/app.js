require('dotenv').config()
const http = require('http')
const https = require('https')
const url = require('url')
const events = require('events')
const eventEmitter = new events.EventEmitter()

var connectHandler = function connected(dest) {
   console.log(`connection to ${dest} successful`)
   dest = url.parse(dest, true)
   if (dest.search) {
      console.log(`search query: ${dest.search}`)
   } else if (dest.hash) {
      console.log(`hash: ${dest.hash}`)
   } else {
      console.log(`pathname: ${dest.pathname}`)
   }
}

eventEmitter.on('connection', connectHandler)

const port = 3000

http.createServer(function (request, response) {
   eventEmitter.emit('connection', request.url)

   response.writeHead(200, {'Content-Type': 'text/plain'})

   dest = url.parse(request.url, true)
   
   q = dest.query
   if (q.error) {
      return response.end(`Error: ${q.error}\n`)
   }
   eventEmitter.emit('auth-code-received', q.code)
   return response.end(`Access token: ${q.code}\n`)
}).listen(port)

console.log(`Server running at localhost:${port}`)

var getAuthToken = function (authorization_code) {
   const data = JSON.stringify({
      grant_type: 'authorization_code',
      code: `${authorization_code}`,
      redirect_uri: `${encodeURIComponent('http://music.evanphilipsmith.com/callback')}`
   })
   const clientIDSecret = Buffer.from(`*${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}*`).toString('base64')
   const options = {
      hostname: 'accounts.spotify.com',
      path: '/api/token',
      method: 'POST',
      headers: {
         'Authorization': `Basic ${clientIDSecret}`,
         'Content-Type': 'application/x-www-form-urlencoded',
         'Content-Length': data.length
      }
   }

   const request = https.request(options, response => {
      console.log(`status code: ${response.statusCode}`)
      let result = []
      response.on('data', (chunk) => {
         result.push(chunk)
      }).on('end', () => {
         result = JSON.parse(Buffer.concat(result).toString())
         eventEmitter.emit('auth-token-received', result)
      })
   })

   request.on('error', error => {
      console.error(error)
   })
   request.write(data)
   request.end()
}

eventEmitter.on('auth-code-received', getAuthToken)

var saveAuthToken = function (result) {
   console.log(`Access token: ${result.access_token.slice(0, 10)}...`)
   console.log(`Refresh token: ${result.refresh_token.slice(0, 10)}...`)
   console.log(`Expires in ${result.expires_in} seconds`)
   console.log(`Valid scopes: ${result.scope}`)

   // TODO save in database
}

eventEmitter.on('auth-token-received', saveAuthToken)