const http = require('http');
const finalhandler = require('finalhandler');
const serveStatic = require('serve-static');

const serve = serveStatic('.');

const server = http.createServer((req, res) => {
  serve(req, res, finalhandler(req, res));
});

server.listen(3000);
