const http = require('http')
const url = require('url')
const events = require('events')
const querystring = require('querystring')
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
   h = querystring.parse(dest.hash.slice(1))
   return response.end(`Access token: ${h.access_token}\n`)
}).listen(port)

console.log(`Server running at localhost:${port}`)