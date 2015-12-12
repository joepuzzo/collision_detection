/*-----------------------------Imports-------------------------------*/
var Planner = require('./planner.js'); // Plans and Trajectories
var events       = require('events'),   // Used by event emitter
    EventEmitter = events.EventEmitter; // Fake GPS will extend
 


/*----------------------------Constants------------------------------*/
const LOG = false;
const seconds = 1000;

/*-----------------------------FakeGPS-------------------------------*/

/**
 * Fake GPS constructor
 * @param plan the plan to execute
 */
function FakeGPS( plan ) { 

    // Call superconstructor
    EventEmitter.call(this);

    this.plan = plan;
    this.startTime = new Date().getTime();
    this.curTrajectory = plan.trajectories[0]
    this.nextTrajectory = plan.trajectories[1] || this.curTrajectory;
    this.next = 2; 
    this.paused = false;
    this.pauseTime = 0; 
}

/**
 * Extend the EventEmitter class
 */
FakeGPS.prototype = new EventEmitter();

/**
 * This will return the next n segments
 */
FakeGPS.prototype.getNextSegments = function(numSegments){
     //3 should be a const in a file ideally
     var num = numSegments || 3;
     if(this.plan.trajectories.length < num ){
	    num = this.plan.trajectories.length;
     }
     var traj = [];
     for( var i = this.next - 2; i <  this.next - 2 + num; i++ ){
	    //console.log("PUSHING SEG");
	    traj.push(this.plan.trajectories[i]);
     }
     return traj;
}

/** 
 * This will return the lat lon and alt 
 * the data returned will be calculated from the current time and the plan
 */
FakeGPS.prototype.getLocation = function() { 

    // Get the time passed
    // If the gps has been paused then use the pause time
    var time = ( this.paused ? this.pauseTime : new Date().getTime() ) - this.startTime;

    // Turn it into seconds
    time = Math.round( time / seconds ); 

    // Check to see if we are past our next trajectory
    if( time >= this.nextTrajectory.time ) { 

        // If we are through with the plan then return the last location
        if( this.next >= this.plan.trajectories.length ) {
            return this.nextTrajectory; 
        }

        // If we are we have to update our trajectories
        this.curTrajectory = this.nextTrajectory;
        this.nextTrajectory = this.plan.trajectories[this.next++]
        this.emit( "TrajectoryChange", this.curTrajectory );
    } 

    // Get our current location based on the current trajectories and time
    var cur  = this.curTrajectory,
        next = this.nextTrajectory;

    var x1 = cur.lat,
        y1 = cur.lon, 
        x2 = next.lat, 
        y2 = next.lon;

    var d = Math.sqrt( Math.pow( (x2-x1), 2 ) + Math.pow( (y2 - y1), 2 ) ) // Distance
    var r = ( time - cur.time ) / ( next.time - cur.time )  // Segment ratio

    if( next.time - cur.time === 0 ) r = 1; 

    var x3 = r * x2 + (1 - r) * x1 // find point that divides the segment
    var y3 = r * y2 + (1 - r) * y1 // into the ratio (1-r):r

    //TODO calculate altitude

    return { 
        lat: x3,
        lon: y3,
        alt: 50.0
    }
}

/**
 * This will put the gps into a paused state
 */
FakeGPS.prototype.pause = function( ) { 

    // Sanity check 
    if( this.paused ) { 
        console.error("Cant pause! already paused!");
    }

    // Save the time we got paused
    this.pauseTime = new Date().getTime();
    // Set the paused state variable to true
    this.paused = true;
}

/**
 * This will put the gps into an unpaused state
 */
FakeGPS.prototype.unpause = function( ) { 
    
    // Sanity check 
    if( !this.paused ) { 
        console.error("Cant unpause! already unpaused!");
    }

    // Calculate the wait time
    var wait = ( ( new Date().getTime() ) - this.pauseTime ) / seconds;

    // Add time to every trajectory after the current one
    var trajs = this.plan.trajectories;
    for( var i = this.next - 1; i < trajs.length; i++ ) { 
        //Updat the time using the time waited
        trajs[i].time += wait;
    }
    
    this.paused = false;
}

module.exports = FakeGPS;


