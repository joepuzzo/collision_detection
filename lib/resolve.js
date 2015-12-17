/*-----------------------------Imports-------------------------------*/
var Parser   = require('./node-by-line.js'),              
    Planner  = require('./planner.js'),
    DataNode = require('./data-node.js'),
    FakeGPS  = require('./fake-gps.js');


/*---------------------------Constantss-----------------------------*/
const LOG = false;


/*----------------------------Resolver------------------------------*/

/**
 * Resolver constructor
 * @param plans an array of plans, one for each node. 
 */
function Resolver( plans, speed, log ) {
    this.log = log;
    this.originalPlans = plans; 
    this.resolutePlans = [];
    this.nodes         = [];
    this.speed         = speed || 1;
}

/**
 * Starts up all the nodes. The nodes will perform resolution
 * on there own and when they terminate they will contain a
 * resolved plan.
 * @param callback a funcion to call when we are done performing the resolution
 */
Resolver.prototype.resolve = function( callback ) { 
    // Perform simulated resolution and give the resulting
    // plan back to the callback

    var resPlans = this.resolutePlans;
    var oriPlans = this.originalPlans;
    var me = this;
    var done = 0;

    // Create a function that each node should call when its done
    var finished = function( newPlan, id ) { 
        // Take the new plan and put it on to the resPlans array
        // NOTE: this only works because id is integer
        resPlans[id] = newPlan;
        done++;
        //resPlans.push( newPlan );
        // If we have all the plans then sort the array by id and
        // call the callback with ourselves
        if( done === oriPlans.length ) { 
            callback( me );
        }
    }

    // First we need to initalize the nodes
    this.initNodes( this.originalPlans, finished );
}

/**
 * Initializes an array of nodes given a plan
 * @param plans the array of plans
 */
Resolver.prototype.initNodes = function( plans, callback ) {
    
    // Check for valid plan
    if( !plans ) { throw "emptyPlan!"; };    
    
    // Loop through and create a node for every plan 
    var nnodes = plans.length;
    var my = this;
    for( i = 0; i < nnodes; i++ ) { 
        this.nodes.push( new DataNode( { 
                            gps: new FakeGPS( plans[i], this.speed ),
                            id: i,
                            log: my.log
        }, callback ) );
    }
}


/*----------------------------Exports-------------------------------*/

// This is the resolve function
exports.resolve = function( input, speed, log, callback ) { 

    // Parse the input into the original plans
    Parser.parse( input, function( plans ){

        // Once we have the plan create a new resolver
        var resolver = new Resolver( plans, speed, log );

        // Call the resolvers resolve function, passing in the callback
        resolver.resolve( callback );

    });
};


