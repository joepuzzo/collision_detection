// Require an assersion library
var DataNode  = require('./lib/data-node.js'),
    FakeGPS = require('./lib/fake-gps.js');

// Parse in a file with plans
var Parser = require('./lib/node-by-line.js');
var fs = require('fs');
var file = fs.createReadStream("test/sample_input/sample_4n.movements");



/*------------------------------Input--------------------------------*/
// Variables for argumentes
var config = {}
//var filename = process.argv[2];
var verbose = false;
var speed = 1;
var id;

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
        default: 
    }
});

// Validate arguments
if( !id ) { 
    console.log( "Usage node startup.js [--speed|-s] speed [-id] uid [--verbose|-v] ");
    return;
}


Parser.parse( file, function( pls ) { 
  start( pls );
});


function start( plans ) { 

  //console.log( plans[0].toBonString() );
  var node = new DataNode( { id: id,
                             gps: new FakeGPS( plans[0] )
                           } );

}

