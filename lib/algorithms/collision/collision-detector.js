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
     this.zcollide = config.zcollide || 10; 
     this.dcollide = config.dcollide || 30;
     this.timecollide = config.timecollide || 15; 
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
        traj1 = plan[i];
        next1 = plan1[i+1];

        for( var j = 0; i < plan2.trajectories.length - 1; j++ ) { 

            // Get the next trajectories from plan2
            traj2 = plan[j];
            next2 = plan2[j+1];

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
            }
        } 
    }

    return collisions;

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
        // Return true! 
        return true;
    }
    return false;
}

CollisionDetector.prototype.timeCheck = function( traj1, traj2, collision) { 

}

// Export the CollisionDetector
module.exports = CollisionDetector;



