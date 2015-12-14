/*-----------------------------Imports-------------------------------*/
var Planner = require('./planner.js'); // Plans and Trajectories
var events       = require('events'),   // Used by event emitter
    EventEmitter = events.EventEmitter, // Fake GPS will extend
    LineUtils = require('./utils/line.js');
 


/*----------------------------Constants------------------------------*/
const LOG = false;
const seconds = 1000;

/*-----------------------------FakeGPS-------------------------------*/

/**
 * Fake GPS constructor
 * @param plan the plan to execute
 */
function FakeGPS( plan, speed ) { 

    // Call superconstructor
    EventEmitter.call(this);

    if( speed ) speed -= 1;

    this.speed = speed || 0;
    this.plan = plan;
    this.newPlan = Planner.makePlan(); 
    this.startTime = new Date().getTime();
    this.curTrajectory = plan.trajectories[0]
    this.nextTrajectory = plan.trajectories[1] || this.curTrajectory;
    this.next = 2; 
    this.paused = false;
    this.pauseTime = 0; 
    this.totalPauseTime = 0;;

    this.newPlan.trajectories.push( this.curTrajectory );
}

/**
 * Extend the EventEmitter class
 */
FakeGPS.prototype = new EventEmitter();

/**
 * This will return the next n segments
 */
/*FakeGPS.prototype.getNextSegments = function(numSegments){
     //3 should be a const in a file ideally
     var num = numSegments || 3;
     // If what is left is smaller than 3 then just return what is left
     if( this.plan.trajectories.length - this.next - 2 < num ){
	    num = this.plan.trajectories.length - this.next - 2;
     }
     var traj = [];
     for( var i = this.next - 2; i <  this.next - 2 + num; i++ ){
	    //console.log("PUSHING SEG");
	    traj.push(this.plan.trajectories[i]);
     }
     return traj;
}*/

/**
 * This will return the next n segments
 */
FakeGPS.prototype.getNextSegments = function(numSegments){
     //3 should be a const in a file ideally
     var num = numSegments || 4;
     var traj = this.plan.trajectories.slice( this.next - 2, this.next - 2 + num );
     return traj;
}


FakeGPS.prototype.getTime = function() { 
    // Add extra seconds if we have a speed up
    var now = new Date().getTime();
    // How many seconds have passed since the start  
    var time_offset = ( now - this.startTime ) / seconds;
    // Use the offset we just calculated to determine what time we are "at"
    return  now + time_offset * ( 1000 * this.speed );
}

FakeGPS.prototype.getExecutionTime = function() { 
    // Add extra seconds if we have a speed up
    var now = new Date().getTime();
    // How many seconds have passed since the start  
    return ( now - this.startTime ) / seconds;
}


/** 
 * This will return the lat lon and alt 
 * the data returned will be calculated from the current time and the plan
 */
FakeGPS.prototype.getLocation = function() { 

    // Get the time passed
    // If the gps has been paused then use the pause time
    var time = ( this.paused ? this.pauseTime : this.getTime() ) - this.startTime;

    // Turn it into seconds
    //time = Math.round( time / seconds ); 
    time = time / seconds; 

    // If we are through with the plan then return the last location
    if( this.next > this.plan.trajectories.length ) {
        this.curTrajectory.alt = 0; 
        return this.curTrajectory; 
    }

    // Check to see if we are past our next trajectory
    if( time >= this.nextTrajectory.time ) { 
        
        // Add the next trajectory to the plan before update
        this.newPlan.trajectories.push( this.nextTrajectory );

        // If we are we have to update our trajectories
        this.curTrajectory = this.nextTrajectory;
        this.nextTrajectory = this.plan.trajectories[this.next++];

        // Special case for last trajectory
        // Our next will be null here
        if( this.next > this.plan.trajectories.length ) {
            this.newPlan.trajectories.push( this.curTrajectory );
            this.emit("PlanComplete", this.newPlan );
            //this.emit( "TrajectoryChange", this.curTrajectory );
            return this.curTrajectory;
        }

        // Emit a trajectory change 
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
        return;
    }

    // Save the time we got paused
    this.pauseTime = this.getTime();

    // Set the paused state variable to true
    this.paused = true;

    // Get the current location
    var loc = this.getLocation(); 

    // Write out a new trajectory to newPlan
    this.newPlan.trajectories.push( Planner.makeTrajectory( loc.lat, loc.lon, loc.alt, ( this.pauseTime - this.startTime ) / 1000 ) );
}

/**
 * This will put the gps into an unpaused state
 */
FakeGPS.prototype.unpause = function( ) { 
    
    // Sanity check 
    if( !this.paused ) { 
        console.error("Cant unpause! already unpaused!");
        return;
    }

    var curTime = this.getTime();

    // Calculate the wait time
    var wait = ( curTime - this.pauseTime ) / seconds;

    // Get the current location
    var loc = this.getLocation(); 

    // Write out a new trajectory to newPlan
    this.newPlan.trajectories.push( Planner.makeTrajectory( loc.lat, loc.lon, loc.alt, ( curTime - this.startTime ) / 1000 ) );

    // Upate the total pause time
    this.totalPauseTime += wait;

    // Add time to every trajectory after the current one
    var trajs = this.plan.trajectories;
    for( var i = this.next - 1; i < trajs.length; i++ ) { 
        //Updat the time using the time waited
        trajs[i].time += wait;
    }
    
    this.paused = false;
}


/*------------------RegisterForPointUpdate-------------------*/

/**
 * This function will add another callback for point updates
 */
FakeGPS.prototype.when = function( point, line, dsafe, callback ) {
    
    // For referencing ourselves
    var my = this;

    // Constantly check to see if we have gone past the given point 
    setInterval( function () {
            
        // I cheated hahaaha you have to love JS!!
        this.inout = this.inout || false;

        // Get the gps location
        var loc = my.getLocation();
        // Check the distance between the current point and the point given
        var d = LineUtils.distance3D( point.lat, point.lon, point.alt, loc.lat, loc.lon, loc.alt );
        
        // If we are within the sphere && the inout is false then set inout to true
        if( d < dsafe && !this.inout ) { 
            this.inout = true; 
        }

        // If the point is outside the sphere and we have already entered the sphere then we are safe!!!
        if( d >= dsafe && this.inout ) {
            // Call the callback 
            callback();
            // Stop this interval
            clearInterval(this);
        }
    }, 500 );

}


module.exports = FakeGPS;


