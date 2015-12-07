/*-----------------------------Imports-------------------------------*/
var split = require('split'),                   // splits stream into lines of data 
    Transform = require('stream').Transform,    // Transformers are used to transform input
    util = require('util'),                     // util is node.js's util class
    Planner = require('./planner.js');


/*---------------------------Constantss-----------------------------*/
const LOG = false;

// We need to convert the bytes read in by the stream to be utf8
process.stdin.setEncoding("utf8");


/*------------------------------Input--------------------------------*/

/**
 * This Transformer object simply "transforms" the given input into
 * an output stream that contains arrays of floating point numbers.
 *
 * Note: I could have done more than just convert the input into arrays
 * in this transformer but I wanted to show off some of the core 
 * functionalities of this Class
 *
 * Note: I heavily commented this for learning purposes
 */

// Create a transformation stream 
// Note, the use of the utilities function to inherit from Transform
// By defualt JS does not allow the type of inheritance 
// ( Allows us to call superconstructor and stuff )
util.inherits( InputStream, Transform )

/**
 * Input Stream Constructor
 */
function InputStream() { 
    // Invoke Transforms constructor ( super )
    // Note object mode allows us to push objects onto a straeam
    // Normally you can only push buffers and strings
    Transform.call( this, {"objectMode": true} ); 

    // Initialize member variables for the input stream 
    this.curTrajs = []; 
}

/** 
 * Override the _transform function 
 *
 * The transform function is called for each line
 *
 * Arg1 is the data written to the stream
 * Arg2 is the stream encoding
 * Arg3 is a no argument callback the signals when done processing     
 */
InputStream.prototype._transform = function( line, encoding, processed ) { 

        // For debug only
        if( LOG ){ console.log("LINE: " + line) };        

        // TODO For some reason we get an extra line read in FIND OUT WHY!
        if( line === "" ){ 
            processed()
            return; 
        }
        
        // This is very simple because each node has its own line
        // Simply turn line into array of numbers
        this.curTrajs = line.split(" ").map( function(x) { return +x } );

        // By calling this.push we are pushing the trajectories array
        // onto the output stream of this transformer
        this.push( this.curTrajs )

        // Signal that we are done with this line
        processed();       
};


/*-----------------------Trajectory Stream-------------------------*/

// Create a transformation stream 
util.inherits( TrajectoryStream, Transform )

function TrajectoryStream() { 
    // Invoke Transforms constructor
    Transform.call( this, {"objectMode": true} ); 

    // Member variables for the trajectory stream 
    this.plans = [];        // Holds an array of plans
}

// The transform function is called for each trajectories array
TrajectoryStream.prototype._transform = function( trajectories, encoding, processed ) { 

        // For debug only
        if( LOG ){ console.log("TRAJECTORY: " + JSON.stringify( trajectories ) ) };        
       
        // Variables for loop, vel is initialized to zero incase only one trajectory
        var time, lat, lon, alt, next_lat, next_lon, dist, vel = 0;
        var tarray = [];

        // Take the trajectories array and turn them into Trajectory plans 
        for( var i = 0; i < trajectories.length; i++ ) { 

            // Pull the variables out from the trajectories
            time = trajectories[i];
            lat  = trajectories[++i];
            lon  = trajectories[++i];

            // This will return undefined if there is no next trajectory
            next_time = trajectories[i+1];
 
            // Check to see if we have a next trajectory 
            if( next_time ) {
                // Calculate velocity using time from now until the next
                // trajectory and the distance between the points
                next_lat = trajectories[i+2];
                next_lon = trajectories[i+3];
                dist = Math.sqrt( Math.pow( ( lat - next_lat ), 2 ) + Math.pow( ( lon - next_lon ), 2 ) );
                vel  = dist / ( next_time - time );
                alt = 50; //TODO
                // Now calculate the direction

            } 

            // If we dont have one then the velocity will remain the previous value

            // Push the new trajectory 
            tarray.push( Planner.makeTrajectory( lat, lon, alt, time, vel ) ); 
        } 

        // Create a new plan to store trajectories in
        var plan = Planner.makePlan( tarray );

        // Push on the new plan object to the output stream
        this.plans.push( plan )

        if( LOG ){ console.log(plan); }

        // Signal that we are done with this array
        processed();       
};


/*------------------------Call Parse Code--------------------------*/

function parse( inputStream, callback ) {

    

    // Take stdin | inputTransformer | trajectoryTransformer
    inputStream
        .pipe( split() )
        .pipe( new InputStream() )
        .pipe( new TrajectoryStream().on('finish', function() { 
            //console.log(this.plans);
            callback( this.plans ) 
         })); 

        //.on('finish', function(){ callback( trajectoryParser.plans ) } ); 
}

// Export the parse function
exports.parse = parse;

