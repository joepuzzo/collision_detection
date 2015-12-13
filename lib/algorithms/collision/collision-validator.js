/*-----------------------------Imports-------------------------------*/
var Parser = require('../../node-by-line.js'),
    CollisionDetector = require('./collision-detector.js'),
    fs = require('fs');

/*----------------------------Constants------------------------------*/
const LOG = false;
const sep = "---------------------------------------------------------"

/*------------------------ValidatorFunction--------------------------*/

/**
 * Validation function. 
 * This function will do an n choose k comparison over all the plans
 */
function Validate( plans, config, verbose ) {

    // Create a new Collision detector with the given config
    var detector = new CollisionDetector( config );

    // Print out the collision parameters
    console.log("DCOLLIDE: " + detector.dcollide );
    console.log("TCOLLIDE: " + detector.timecollide );


    // Array to store all collisions
    var collisions = [];

    // The total wait time
    var total_wait = 0;

    // Now lets do some hand shakes! :) 
    for( var i = 0; i < plans.length; i++ ) {

        // Update the wait time
        total_wait += plans[i].getWaitTime().time;
         
        for( var j = i; j < plans.length; j++ ) {
            // Only compare if we are different plans
            if( plans[i] !== plans[j] ) { 
                //console.log("HERE!");
                collisions.push( { plans: [i,j], collisions: detector.checkCollision( plans[i], plans[j] ) } );
                //console.log( detector.checkCollision( plans[i], plans[j] ) );
            }
        }
    }

    // Loop through all of the results and count number of collisions
    var num_col = 0;
    var plan1, plan2;
    if( verbose ) { console.log(sep); console.log("COLLISIONS:") }
    for( result of collisions ) { 

        // Update # of collisions
        num_col += result.collisions.length;

        // If we are in verbose mode print information!
        if( verbose ) { 
            //Print the information 
            plan1 = result.plans[0];
            plan2 = result.plans[1];
            console.log("Collisions between node", plan1, "and node", plan2 );
            console.log( result.collisions );
            var first = result.collisions.sort( function( a, b ) {
                return a.timediff - b.timediff;
            })[0];

            if( first ) console.log("FirstCollision:", first.trajectory1.index, first.trajectory2.index);

        }
    }

    // Print wait time for each plan if verbose
    if( verbose ) { 
        if( verbose ) { console.log(sep); console.log("WAIT TIMES:") }
        var wait;
        plans.forEach( function( p, index, array ) {  
            wait = p.getWaitTime();
            console.log("Node", index, "waited for a total of", wait.time, "seconds and stoped", wait.stops, "times" );
        });
    }

    if( verbose ) { console.log(sep); }
    console.log("%d collisions detected, total wait time = %d", num_col, total_wait );
}

// Variables for argumentes
var config = {}
var filename = process.argv[2];
var verbose = false;

// Process the arguments 
process.argv.forEach(function (val, index, array) {
    switch( val ) {
        case "--dcol":
            config.dcollide = array[index+1]
            break; 
        case "--tcol":
            config.timecollide = array[index+1];
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
    console.log( "Usage node collision-validator.js [path2file] [dcollide] [timecollide]");
    return;
}

// Create a read stream
var readStream = fs.createReadStream( filename );

// This will wait until we know the readable stream is actually valid before piping
readStream.on('open', function () {
    // Pass the readStream to the parser and have the callback be the Validate function
    Parser.parse( readStream, function( plans ) { Validate( plans, config, verbose ) } )
});

// This catches any errors that happen while creating the readable stream (usually invalid names)
readStream.on('error', function(err) {
    console.error(err);
});

