/*-----------------------------Imports-------------------------------*/
var Parser = require('../node-by-line.js'),
    fs = require('fs');

/*----------------------------Constants------------------------------*/

const LOG = false;
const sep = "---------------------------------------------------------"


/*------------------------------Input--------------------------------*/
// Variables for argumentes
var config = {}
var filename = process.argv[2];
var verbose = false;
var time = false;
var alt  = false;
var node;

// Process the arguments 
process.argv.forEach(function (val, index, array) {
    switch( val ) {
        case "--time":
            time = true;
            break;
        case "--alt":
            alt = true;
            break;
        case "-i": 
            node = array[index+1];
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
    console.log( "Usage node visualizer [path2file] [time]");
    return;
}

// Create a read stream
var readStream = fs.createReadStream( filename );

// This will wait until we know the readable stream is actually valid before piping
readStream.on('open', function () {
    // Pass the readStream to the parser and have the callback be the Validate function
    Parser.parse( readStream, function( plans ) { 
        // If the -i flag was provided then only output that plan
        if( node ) { 
            if( node >= plans.length ) {
                console.log( "U CRAZY! that node is not in the given file.");
            }
            else { 
                console.log( plans[node].toVisplot( { time: time, alt: alt } ) );
            }
        }
        else { 
            // Itterate over plans and print
            for( p of plans ) {
                console.log( p.toVisplot( { time: time, alt: alt } ) );
            }
        }
    });
});

// This catches any errors that happen while creating the readable stream (usually invalid names)
readStream.on('error', function(err) {
    console.error(err);
});

/*-----------------------VisplotFunction-----------------------------*/

