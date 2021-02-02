const net = require('net');
const cluster = require('cluster'); // clusters will be used for multi-threading
const CPUs = require('os').cpus().length; // number of CPU cores

const PORT = process.argv[2];

if (cluster.isMaster) {
  console.log(`Parent process is started ${process.pid}`);
  console.log(`x${CPUs} child processes being created.`);
  // fork child processes
  for (let i = 0; i < CPUs; i++) {
    cluster.fork();
  }
} else {
  // child process
  // create TCP socket
  const server = net.createServer().on('connection', (socket) => {
    console.log('A connection is established');

    socket.on('data', function (buffer) {
      console.log(`\n[${process.pid}] Data received from client:`);
      console.log(`============================\n${buffer.toString()}`);

      const request = buffer.toString();
      const [method, url, protocol] = request.split(/\r\n|\n|\r/)[0].split(' ');

      // print information
      console.log({ method, url, protocol });

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
          console.log(`\n[${process.pid}] Data sent to the client:`);
          console.log(`============================\n${responseObject}`);
        } else {
          console.log('Not a valid request');
          const responseObject = 'HTTP/1.1 400 Bad Request\n\n';
          socket.write(responseObject);
          console.log(`\n[${process.pid}] Data sent to the client:`);
          console.log(`============================\n${responseObject}`);
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
        const responseObject = 'HTTP/1.1 501 Not Implemented\n\n';
        socket.write(responseObject);
        console.log(`\n[${process.pid}] Data sent to the client:`);
        console.log(`============================\n${responseObject}`);
      } else {
        // not a valied HTTP method -> Bad Request” (400)
        console.log('Not a valid HTTP method!');
        const responseObject = 'HTTP/1.1 400 Bad Request\n\n';
        socket.write(responseObject);
        console.log(`\n[${process.pid}] Data sent to the client:`);
        console.log(`============================\n${responseObject}`);
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
