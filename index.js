const socket = require('net');
const cluster = require('cluster'); // clusters will be used for multi-threading
const CPUs = require('os').cpus().length; // number of CPU cores

const PORT = 8080;

if (cluster.isMaster) {
  console.log(`Parent process is started ${process.pid}`);
  console.log(`x${CPUs} child processes being created.`);
  // forst child processes
  for (let i = 0; i < CPUs; i++) {
    cluster.fork();
  }
} else {
  // child process
  // create TCP socket
  const server = socket.createServer().on('connection', (socket) => {
    console.log('A connection is established');

    socket.on('data', function (buffer) {
      console.log(`\n[${process.pid}] Data received from client:`);
      console.log(`============================\n${buffer.toString()}`);

      const request = buffer.toString();
      const [method, url, protocol] = request.split(/\r\n/g)[0].split(' ');

      // print information
      console.log({ method, url, protocol });

      // TODO: RFC2068'de hangi headerler zorunlu kontrol et!
      if (method == 'GET') {
        let size = url.length > 1 ? parseInt(url.substr(1)) : 0;
        if (size >= 100 && size <= 20000) {
          const responseObject =
            'HTTP/1.1 200 OK\n' +
            'Content-Type: text/html;charset=UTF-8\n' +
            `Content-Length: ${size}\n\n` +
            `<html><head></head><body>${'a'.repeat(size - 39)}</body></html>`;
          // 'a'.repeat(size);
          socket.write(responseObject);
        } else {
          console.log('Requested URI is not a number');
          socket.write('HTTP/1.1 400 Bad Request\n\n');
        }
      } else if (
        method == 'POST' ||
        method == 'PUT' ||
        method == 'DELETE' ||
        method == 'PATCH' ||
        method == 'OPTIONS' ||
        method == 'HEAD'
      ) {
        // not implemented
        console.log('HTTP method is not implemented!');
        socket.write('HTTP/1.1 501 Not Implemented\n\n');
      } else {
        // not a valied HTTP method -> Bad Request” (400)
        console.log('Not a valid HTTP method!');
        socket.write('HTTP/1.1 400 Bad Request\n\n');
      }
      socket.end();
    });

    // When the client requests to end the TCP connection with the server, the server
    // ends the connection.
    socket.on('end', function () {
      console.log('Closing connection with the client');
    });

    // Catch errors
    socket.on('error', function (err) {
      console.log(`Error: ${err}`);
    });
  });

  // start listening TCP socket on predefined PORT
  server.listen(PORT, () => {
    console.log(`Process ${process.pid} listening on port ${PORT}`);
  });
}
