// Require an assersion library
var DataNode  = require('./lib/data-node.js'),
    FakeGPS = require('./lib/fake-gps.js');

// Parse in a file with plans
var Parser = require('./lib/node-by-line.js');
var fs = require('fs');


/*------------------------------Input--------------------------------*/
// Variables for argumentes
var config = {}
//var filename = process.argv[2];
var verbose = false;
var speed = 1;
var id;
var fname;

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
        case "-id":
            id = array[index+1];
            break;
        case "-f": 
        case "--file": 
             fname = array[index+1];
        default: 
    }
});

// Validate arguments
if( !id || !fname ) { 
    console.log( "Usage node startup.js [--speed|-s] speed [-id] uid [-f|--file] filename [--verbose|-v] ");
    return;
}

// Create file stream 
var file = fs.createReadStream( fname );

// Parse the file into plan
Parser.parse( file, function( pls ) { 
  start( pls );
});

function start( plans ) { 

  //console.log( plans[0].toBonString() );
  var node = new DataNode( { id: id,
                             gps: new FakeGPS( plans[ id - 1 ] )
                           } );
}

