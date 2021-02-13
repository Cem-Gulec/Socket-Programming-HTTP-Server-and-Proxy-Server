const fs = require('fs');

// check if the request cached or not : false | buffer
function retrieve(name) {
  let readStream = false;

  try {
    readStream = fs.readFileSync(`./cache/${name}`);
  } catch (error) {}

  return readStream;
}

// save to fs
function save({ name, stream }) {
  // Parse the HTTP response and jsut save the body into cache
  const splitted = stream.toString().split('\n');
  fs.writeFileSync(`./cache/${name}`, splitted[splitted.length - 1]);
}

module.exports.retrieve = retrieve;
module.exports.save = save;
