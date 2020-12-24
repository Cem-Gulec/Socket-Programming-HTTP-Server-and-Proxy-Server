const net = require('net');

const PORT = 7777;

const server = net.createServer().on('connection', (socket) => {
  console.log('A connection is established');

  socket.on('data', function (buffer) {
    console.log(`\n[${process.pid}] Data received from client:`);
    console.log(`============================\n${buffer.toString()}`);

    try {
      const request = buffer.toString();
      const [method, url, protocol] = request.split(/\r\n/g)[0].split(' ');
      const body = request.split(/\r\n/g).slice(1).join('\n');
      if (url.includes('http://')) {
        // print information
        // console.log({ method, url, protocol, body });

        const splitted = url.split('/');
        // console.log({ splitted });

        // get HTTP destination address, not works with https
        const [address, port] = splitted[2].split(':');
        const path = splitted.slice(3).join('/');
        // const port = address.split(':')[2];

        // console.log({ address, port: port || 80, path });

        // if the request is to localhost(our server)
        // and the requested size greater than 9999
        if (isLocal(address) && isGreaterThan99(path)) {
          // return Request-URI Too Long
          socket.write('HTTP/1.1 414 Request-URI Too Long\n\n');
          socket.end();
        }

        // create a client
        const client = new net.Socket();

        // if port is undefined use 80 instead, which is the default port and not available specially on the request
        // BONUS PART: HTTP requests to any external server is also being proxied
        client.connect(port || 80, address, (cc) => {
          console.log('Connected to destination server');

          // proxy server itself acting like a client to the destination server
          client.write(`${method} /${path} HTTP/1.1\n${body}`);
          console.log('HTTP message is seny to the destination server.');
        });

        // Reponse received from destination server
        client.on('data', (data) => {
          console.log(`Data received from server:`);
          console.log(`============================\n${buffer.toString()}`);

          socket.write(data);
          socket.end();

          client.destroy();
          console.log('client destroyed');
        });

        client.on('error', (err) => {
          if (err.code == 'ECONNREFUSED') {
            // Web Server is not running currently
            // return a “Not Found” error message with status code 404.
            socket.write('HTTP/1.1 404 Not Found\n\n');
            socket.end();
          } else {
            console.log(err);
          }
        });
      } else {
        // Some other protocol other than http, might be https etc.
        console.log('Not an HTTP request, skipping...');
      }
    } catch (error) {
      // some other errors
      console.error(error);
    }
    console.log('Socket closed.');
  });

  // When the client requests to end the TCP connection with the server,
  // the server ends the connection.
  socket.on('end', function () {
    console.log('Connection with the client is closed');
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

// Check whether the address belongs to localhost or external
function isLocal(address) {
  if (
    address.startsWith('192.168') ||
    address.includes('127.0.0.1') ||
    address.includes('localhost')
  ) {
    return true; // it's a local address
  }
  return false; // external address
}

// check the request path to find if it's a request with a higher size than 9999
function isGreaterThan99(size) {
  return parseInt(size) > 9999 ? true : false;
}
