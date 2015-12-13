
/*-------------------------Trajectory-------------------------*/

/**
 * Trajectory constructor
 * @param lat the latitude 
 * @param lon the longitude
 * @param time an optional time
 * @param velocity an optional velocity
 */
function Trajectory( lat, lon, alt, time, velocity ) { 
    this.lat  = lat; 
    this.lon  = lon;
    this.alt  = alt;
    this.time = time || 0;
    this.velocity = velocity || 0;
}

/**
 * Writes this trajectory out to the format used by bon motion
 * @return a string representation of the trajectory x y time
 */
Trajectory.prototype.toBonString = function(){
    return this.time + " " + this.lat + " " + this.lon + " ";
}

/**
 * Static function that hashes a trajectory
 * @param an object that has a lat lon and alt
 */
 Trajectory.stringify = function( t ) { 
     return [t.lat, t.lon, t.alt].toString();
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
        minDiff = Number.MAX_SAFE_INTEGER; 
    for( t of this.trajectories ){
        diff = Math.abs( t.time - time );
        if( diff < minDiff ) {
            minDiff = diff; 
            minT = t;
        }
    }
    return minT;
}

/**
 * This function will return a subset of the plan as a new plan object
 */
Plan.prototype.getSubset = function() { 
    return new Plan(/*TODO*/);
}

/*
 * This function will return the total wait time 
 */
Plan.prototype.getWaitTime = function() { 
    var wait_time = 0;
    var cur_t, next_t;
    var trajs = this.trajectories;
    // Loop throuch n - 1 trajectories
    for( var i = 0; i < trajs.length - 1; i++ ) {
        cur_t = trajs[i];
        next_t = trajs[i+1];
        // We have waited if we have not moved
        if( cur_t.lat === next_t.lat && cur_t.lon === next_t.lon ) {
            wait_time += next_t.time - cur_t.time;  
        }
    }
    return wait_time; 
}

/**
 * This function will return this plan as a bon motion string
 */
Plan.prototype.toBonString = function() { 
    // Itterate over all the trajectories and call to bon string
    var bonString = [];
    for( t of this.trajectories ) {
         bonString.push( t.toBonString() ); 
    } 
    return bonString.join("").trim();;
}


/*---------------------------Planner---------------------------*/
module.exports = { 

    // Builds a new plan given an array of trajectories
    makePlan: function( tarray ) { 
        return new Plan( tarray );
    },

    // Builds a trajectory given required parameters 
    makeTrajectory: function( lat, lon, alt, time, velocity ) { 
        return new Trajectory( lat, lon, alt, time || 0, velocity || 0 );
    }

}

module.exports.Trajectory = Trajectory; 
