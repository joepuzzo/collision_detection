/*-----------------------------Imports-------------------------------*/
var Planner   = require('./planner.js'),            // Plans and Trajectories
    DaemonGPS = require('./daemon-gps.js'),         // Daemon GPS 
    Messenger = require('./message/messenger.js'),  // Messenger
    Messages  = require('./message/messages.js'),   // Messages
    CollisionSystem = require('./collision-system.js'); //Collision System

/*----------------------------Constants------------------------------*/
const LOG = false;


/*----------------------------DataNode-------------------------------*/

/**
 * Data nodes constructor
 *
 * @param a parameter object
 */
function DataNode( params, callback ) { 


    // Callback is optional
    callback = callback || function( p ) { console.log(params.id,"has completed his route"); }; 

    // A node is required to have a gps for locational data
    this.gps = params.gps || new DaemonGPS();

    // Register for complete message ( SPECIFIC FOR AI PROJECT )
    this.gps.once( "PlanComplete", function( aplan ) { callback( aplan, params.id ) } );

    // Register for complete message ( this will shut down the advertisments )
    var my = this;
    this.gps.once("PlanComplete", function(){ my.cleanup(); } ); 

    // Print log infor when done
    if( params.log ) {
        this.gps.once( "PlanComplete", function( p ) { 
            console.log(params.id,"has completed his route"); 
        });
    }

    // A node is required to have a messenger for communication
    this.messenger = params.messenger || new Messenger( params.id );
    // A map of neghboring nodes 
    this.neighbors = new Map();
    // A map of intervals 
    this.intervals = new Map();
    // A unique id
    this.id = params.id; 

    this.collisionSystem = new CollisionSystem(this.messenger,this.gps,this.id,params.log);

    // Register for all messages
    this.registerMessages();

    // Start advertising when the messenger is ready TODO how to ensure messenger is ready
    this.advertise( params.config || {} );
}


/*--------------AdvertismentInitialization---------------*/
DataNode.prototype.advertise = function( config ) {
    
    // For referencing ourselves
    var my = this;

    // Set the HIA interval
    var interval = setInterval(function () {
        var loc = my.gps.getLocation();
        my.messenger.sendLocal( [new Messages.HIA( loc.lat, loc.lon, loc.alt )] );     
    }, config.hia_interval || 1000 );

    this.intervals.set( "hia", interval ); 

    // Set the OMW interval
    /*interval = setInterval(function () {
        
    }, config.omw_interval || 1000 );

    this.intervals.set( "omw", interval );*/
}


/*--------------AdvertismentInitialization---------------*/
DataNode.prototype.cleanup = function() {
    // Itterate over all intervals and clear them
    for( var i of this.intervals ) { 
        clearInterval( i[1] ); 
    }
    // Now shut down the messenger
    var my = this;
    setTimeout(function () {
      my.messenger.close();
    }, 4000);
}


/*------------------HandlerRegistration------------------*/
/**
 * This function will register all listeners for events that the
 * messenger may emit. 
 */
DataNode.prototype.registerMessages = function() { 

    // For convienence
    var messenger = this.messenger;

    // Register for all default messenges
    var my = this;
    messenger.on('hia', function( msg, from ){ my.handleHIA(msg,from) } );
    messenger.on('omw', this.handleOMW );
    messenger.on('did', this.handleDID );
}


/*--------------------MessageHandlers---------------------*/

DataNode.prototype.handleHIA = function( message, from ) { 
    var myLocation = this.gps.getLocation();
    //console.log(myLocation);
}

DataNode.prototype.handleOMW = function( message, from ) { 
}

DataNode.prototype.handleDID = function( message, form ) { 
}



/*-------------------------ModuleExporsts-----------------------------*/

// Export the DataNode
module.exports = DataNode;


