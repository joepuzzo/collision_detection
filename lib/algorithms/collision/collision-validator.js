/*-----------------------------Imports-------------------------------*/
var Parser = require('../../node-by-line.js'),
    CollisionDetector = require('./collision-detector.js'),
    fs = require('fs');

/*----------------------------Constants------------------------------*/
const LOG = false;


/*------------------------ValidatorFunction--------------------------*/

/**
 * Validation function. 
 * This function will do an n choose k comparison over all the plans
 */
function Validate( plans, config ) {

    // Create a new Collision detector with the given config
    var detector = new CollisionDetector( config );

    // Array to store all collisions
    var collisions = [];

    // Now lets do some hand shakes! :) 
    for( var i = 0; i < plans.length; i++ ) { 
        for( var j = i; j < plans.length; j++ ) {
            // Only compare if we are different plans
            if( plans[i] !== plans[j] ) { 
                //console.log("HERE!");
                collisions = collisions.concat( detector.checkCollision( plans[i], plans[j] ) );
                //console.log( detector.checkCollision( plans[i], plans[j] ) );
            }
        }
    }

    console.log( collisions );
}

// Process arguments
var config = {}
var filename = process.argv[2];
config.dcollide = process.argv[3];
config.timecollide = process.argv[4];

// Validate arguments
if( !filename ) { 
    console.log( "Usage node collision-validator.js [path2file] [dcollide] [timecollide]");
    return;
}

// Create a read stream
var readStream = fs.createReadStream( filename );

// This will wait until we know the readable stream is actually valid before piping
readStream.on('open', function () {
    // Pass the readStream to the parser and have the callback be the Validate function
    Parser.parse( readStream, function( plans ) { Validate( plans, config ) } )
});

// This catches any errors that happen while creating the readable stream (usually invalid names)
readStream.on('error', function(err) {
    console.error(err);
});

