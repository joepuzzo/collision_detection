/*-----------------------------Imports-------------------------------*/
var Planner   = require('../../planner.js')     // Plans and Trajectories
    LineUtils = require('../../utils/line.js'); // Line utility functions

/*----------------------------Constants------------------------------*/
const LOG = false;


/*------------------------CollisionDetector--------------------------*/

/**
 * CollisionDetector Constructor
 * @param an optional config object 
 * TODO specify better defaults
 */
function CollisionDetector( config ) {
     config = config || {}; 
     this.dcollide = config.dcollide || 30;
     this.timecollide = config.timecollide || 30; 
     //console.log("DCOLLIDE: " + this.dcollide );
     //console.log("TCOLLIDE: " + this.timecollide );
}


/**
 * Checks for a collisions and returns a list of collision objects 
 * if there were no collisions detected, the list will be empty
 *
 * Usage/Example: 
 * var collisions =  MyCD.checkCollision( plan1, plan2 );
 * 
 * if( collisions.length !== 0 ) { 
 *      // Do stuff with the collisons 
 * }
 * 
 * @param plan1 a plan object
 * @param plan2 a plan object 
 * @return array of collisions
 */
CollisionDetector.prototype.checkCollision = function( plan1, plan2 ) {
    
    // This will store the results from each check
    var collisions = [];
    var collision;
    var traj1, traj2, next1, next2;

    // Do an n^2 comparison of the trajectories
    for( var i = 0; i < plan1.trajectories.length - 1; i++ ) { 
        // Get the next trajectories from plan1
        traj1 = plan1.trajectories[i];
        next1 = plan1.trajectories[i+1];

        for( var j = 0; j < plan2.trajectories.length - 1; j++ ) { 

            // Get the next trajectories from plan2
            traj2 = plan2.trajectories[j];
            next2 = plan2.trajectories[j+1];

            // Create a new collision 
            collision  = {
                trajectory1: { trajectory: traj1, index: i },
                trajectory2: { trajectory: traj2, index: j },
            };
            
            // Generate trajectory segments 
            seg1 = { 
                start: traj1, 
                end:   next1
            }; 
            seg2 = {
                start: traj2,
                end:   next2
            };

            // Perform altitude, position, and time checks
            if ( this.positionCheck( seg1, seg2, collision ) && 
                 this.timeCheck( seg1, seg2, collision ) ) {

                // If they all return true then we have a collision
                // add the collision to the collisions
                collisions.push( collision ); 
                //console.log("COLLISION");
            }
        } 
    }

    return collisions;
}


CollisionDetector.prototype.isCollision = function( plan1, plan2, now ) {
    
    // Call the check collison and get all collisons that will occur in this path
    var collisions = this.checkCollision( plan1, plan2 );

    // Sort the collisons by timediff
    // Assume time given is in seconds
    collisions = collisions.sort( function(a, b) {
	return ( a.isect1.timeOfCol - now ) - ( b.isect1.timeOfCol - now ); 
    });
    return collisions[0];
}


/*------------------------PosisionCheck--------------------------*/

/**
 * This function will take two segments and determine if they are within 
 * dcollide based on 
 */
CollisionDetector.prototype.positionCheck = function( seg1, seg2, collision ) { 

    // TODO eventually have to convert lat longs to actual distance points
    var line1 = new LineUtils.Line3D( seg1.start.lat, seg1.start.lon, seg1.start.alt, seg1.end.lat, seg1.end.lon, seg1.end.alt ),
        line2 = new LineUtils.Line3D( seg2.start.lat, seg2.start.lon, seg2.start.alt, seg2.end.lat, seg2.end.lon, seg2.end.alt );
    
    // Check for intersections
    // This will return an object that looks like the following
    // { 
    //  p1: { x: , y: , z: } line 1's closests point
    //  p2: { x: , y: , z: } line 2's closests point
    //  d: the distance between the two points
    // } 
    var result = LineUtils.closestDistance3D( line1, line2 );

    // If the result is within dcollide then we return true
    if( result.d <= this.dcollide ) { 
        // Add the data to the collision object
        collision.isect1 = { lat: result.p1.x, lon: result.p1.y, alt: result.p1.z };
        collision.isect2 = { lat: result.p2.x, lon: result.p2.y, alt: result.p2.z };
        collision.distance = result.d;
        // Return true! 
        return true;
    }
    return false;
}

CollisionDetector.prototype.timeCheck = function( seg1, seg2, collision ) { 

    // Get the expected time based on the segment

    // Calculate the distance from the start of the segment to the collison point
    var dc1 = LineUtils.distance( seg1.start.lat, seg1.start.lon, collision.isect1.lat, collision.isect1.lon ),
        dc2 = LineUtils.distance( seg2.start.lat, seg2.start.lon, collision.isect2.lat, collision.isect2.lon );

    // Calculate the distance of the segment
    var ds1 = LineUtils.distance( seg1.start.lat, seg1.start.lon, seg1.end.lat, seg1.end.lon ),
        ds2 = LineUtils.distance( seg2.start.lat, seg2.start.lon, seg2.end.lat, seg2.end.lon );

    // Use that distance to get the expected time of collision ( total time of segment * ratio )
    var t1 = seg1.start.time + ( ( seg1.end.time - seg1.start.time ) * ( dc1 / ds1 ) ),
        t2 = seg2.start.time + ( ( seg2.end.time - seg2.start.time ) * ( dc2 / ds2 ) ); 

    // See if the times are within timecollide
    if( Math.abs( t1 - t2 )  <= this.timecollide ) { 
        // Add time difference to collision
        collision.timediff = Math.abs( t1 - t2 );
        // Add the time until collison to each intersection
        collision.isect1.timeOfCol = t1;
        collision.isect2.timeOfCol = t2; 
        return true;
    }

    return false;

}

// Export the CollisionDetector
module.exports = CollisionDetector;



