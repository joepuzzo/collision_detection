
/*-------------------------Trajectory-------------------------*/

/**
 * Trajectory constructor
 * @param lat the latitude 
 * @param lon the longitude
 * @param time an optional time
 * @param velocity an optional velocity
 */
function Trajectory( lat, lon, time, velocity ) { 
    this.lat  = lat; 
    this.lon  = lon;
    this.time = time || 0;
    this.velocity = velocity || 0;
}

/**
 * Writes this trajectory out to the format used by bon motion
 * @return a string representation of the trajectory x y time
 */
Trajectory.prototype.toBonString = function(){
    return this.lon + " " + this.lat + " " + this.time + " ";
}


/*----------------------------Plan----------------------------*/

/**
 * Plan Constructor
 * @param tarray an optional array of trajectories, defaults to []
 */
function Plan( tarray ) {
    this.trajectories = tarray || [];
}

/**
 * Returns a trajectory given a time
 * @param time the current flight time
 * @return the closest trajectory to the given time
 */
Plan.prototype.getTrajectory = function( time ) { 
    var diff, minT,
        minDiff = Number.MAX_SAFE_INTEGER; ; 
    for( t of this.trajectories ){
        diff = Math.abs( t.time - time );
        if( diff < minDiff ) {
            minDiff = diff; 
            minT = t;
        }
    }
    return minT;
}



/*---------------------------Planner---------------------------*/
module.exports = { 

    // Builds a new plan given an array of trajectories
    makePlan: function( tarray ) { 
        return new Plan( tarray );
    },

    // Builds a trajectory given required parameters 
    makeTrajectory: function( lat, lon, time, velocity ) { 
        return new Trajectory( lat, lon, time || 0, velocity || 0 );
    }

}
