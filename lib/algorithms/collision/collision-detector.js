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
     this.dcollide = config.dcollide || 10;
     this.timecollide = config.timecollide || 10; 
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

            // Create a new collision 
            collision  = {};
            
            // Get the next trajectories from plan2
            traj2 = plan[j];
            next2 = plan2[j+1];

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
            if ( this.altitudeCheck( seg1, seg2, collision ) && 
                 this.positionCheck( seg1, seg2, collision ) && 
                 this.timeCheck( seg1, seg2, collision ) ) {

                // If they all return true then we have a collision
                // add the collision to the collisions
                collisions.push( collision ); 
            }
        } 
    }

    return collisions;

}

/**
 * This function will take in two segments and determine if they are within
 * zcollide of one another
 */
CollisionDetector.prototype.altitudeCheck = function( seg1, seg2, collision ) { 
    // Add some data to the collison object 
    collision.zdiff = Math.abs( seg1.start.alt - seg2.start.alt )

    // True if we are to close
    // TODO I dont like this data ( put mor relevent data eventually )
    return collision.zdiff <= this.zcollide; 
}

/**
 * This function will take two segments and determine if they are within 
 * dcollide
 */
CollisionDetector.prototype.positionCheck = function( seg1, seg2, collision ) { 

    // TODO eventually have to convert lat longs to actual distance points
    var line1 = LineUtils.Line( seg1.start.lat, seg1.start.lon, seg1.end.lat, seg1.end.lon ),
        line2 = LineUtils.Line( seg2.start.lat, seg2.start.lon, seg2.end.lat, seg2.end.lon );

    // Check for intersections
    var result = LineUtils.checkLineIntersection( line1, line2 )

    // We have a few cases here
    
    /* 
     * Case1 there was an intersection 
     *   line1    line2
     *     \       /
     *      \     /     
     *       \   /  
     *        \ /
     *         * 
     *        / \
     *      end end
     */
    if( result.onLine1 && result.onLine2 ) {
        // Add the point of collision to the collision object
        collision.point1 = result.x
        collision.point2
        
        // We have a collision so return true
        return true; 
    }
    /* 
     * Case2 there was a "projected" intersection from line1 to line2
     *   line1    line2
     *     \         /
     *      \       /     
     *       \     /
     *       end  /
     *           * 
     *          /
     *        end
     */
    else if( result.onLine2 ) {
         
    }

    /* 
     * Case3 there was a "projected" intersection from line2 to line1
     *   line1    line2
     *     \         /
     *      \       /     
     *       \     /
     *        \  end
     *         *
     *          \
     *          end
     */
    else if( result.onLine2 ) {
         
    }
    
    /*
     * Case4 the lines are parallel
     *
     * ----------------------
     * 
     * ----------------------
     */
     else if( LineUtils.parallel( line1, line2 ) ) { 

     }

    /*
     * Case5 the there was a projected intersection
     *  line1 
     *    \
     *     \
     *      \
     *       \
     *        \
     */
    
    /* 
     * Case6 there is no intersection
     *   line1    line2
     *     /        \        
     *    /          \  
     *   /            \
     *  /              \
     * end             end 
     */
    else { 
        
    }

}

CollisionDetector.prototype.timeCheck = function( traj1, traj2, collision) { 

}

// Export the CollisionDetector
module.exports = CollisionDetector;



