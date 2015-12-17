/*-----------------------------Imports-------------------------------*/
var Parser = require('./lib/node-by-line.js'),
    Resolver = require('./lib/resolve.js'),
    fs = require('fs');

/*----------------------------Constants------------------------------*/

const LOG = false;
const sep = "---------------------------------------------------------"


/*------------------------------Input--------------------------------*/
// Variables for argumentes
var config = {}
var filename = process.argv[2];
var verbose = false;
var speed = 1;

// Process the arguments 
process.argv.forEach(function (val, index, array) {
    switch( val ) {
        case "-s":
        case "--speed": 
            speed = array[index+1];
            break;
        case "-v":
        case "--verbose":
            verbose = true;
            break;
        default: 
    }
});

// Validate arguments
if( !filename ) { 
    console.log( "Usage node resolver.js [path2file] [--speed|-s] speed [--verbose|-v] ");
    return;
}

// Create a read stream
var readStream = fs.createReadStream( filename );

// This will wait until we know the readable stream is actually valid before piping
readStream.on('open', function () {
    // Pass the readStream to the resolver and let the "magic" happen!
    Resolver.resolve( readStream, speed, verbose, function( resolution ) { 
            for( p of resolution.resolutePlans ) {
                console.log(p.toBonString().trim());
            }
      }); 
});

// This catches any errors that happen while creating the readable stream (usually invalid names)
readStream.on('error', function(err) {
    console.error(err);
});

/*-----------------------VisplotFunction-----------------------------*/

