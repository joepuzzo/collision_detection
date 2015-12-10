/*-----------------------------Imports-------------------------------*/
var Planner = require('./planner.js'); // Plans and Trajectories


/*----------------------------Constants------------------------------*/
const LOG = false;
const seconds = 1000;

/*-----------------------------FakeGPS-------------------------------*/

/**
 * Fake GPS constructor
 * @param plan the plan to execute
 */
function FakeGPS( plan ) { 
    this.plan = plan;
    this.startTime = new Date().getTime();
    this.curTrajectory = plan.trajectories[0]
    this.nextTrajectory = plan.trajectories[1] || this.curTrajectory;
}

FakeGPS.prototype.getNextSegments = function(numSegments){
     //3 should be a const in a file ideally
     var num = numSegments || 3;
     if(this.plan.trajectories.length< num){
	num = this.plan.trajectories.length;
     }
     var traj = [];
     for(i=0;i<num;i++){
	console.log("PUSHING SEG");
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
    var time = new Date().getTime() - this.startTime;

    // Turn it into seconds
    time = Math.round( time / seconds ); 

    // Check to see if we are past our next trajectory
    if( time > this.nextTrajectory.time ) { 
        // If we are we have to update our trajectories
        this.curTrajectory = this.nextTrajectory;
        this.plan.getTrajectory( time );
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

    var x3 = r * x2 + (1 - r) * x1 // find point that divides the segment
    var y3 = r * y2 + (1 - r) * y1 // into the ratio (1-r):r

    //TODO calculate altitude

    return { 
        lat: x3,
        lon: y3,
        alt: 50.0
    }
}

module.exports = FakeGPS;


