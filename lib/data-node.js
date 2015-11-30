/*-----------------------------Imports-------------------------------*/
var Planner   = require('./planner.js'),            // Plans and Trajectories
    DaemonGPS = require('./daemon-gps.js'),         // Daemon GPS 
    Messenger = require('./message/messenger.js');  // Messenger


/*----------------------------Constants------------------------------*/
const LOG = false;


/*----------------------------DataNode-------------------------------*/

/**
 * Data nodes constructor
 *
 * @param a parameter object
 */
function DataNode( params ) { 

    // A node is required to have a gps for locational data
    this.gps = params.gps || new DaemonGPS();
    // A node is required to have a messenger for communication
    this.messenger = params.messenger || new Messenger();
    // A list of neghboring nodes 
    this.neighbors = [];

    // Register for all messages
    this.registerMessages();

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
    messenger.on('hia', this.handleHIA );
    messenger.on('omw', this.handleOMW );
    messenger.on('did', this.handleDID );
}


/*--------------------MessageHandlers---------------------*/

DataNode.prototype.handleHIA = function( message, from ) { 
}

DataNode.prototype.handleOMW = function( message, from ) { 
}

DataNode.prototype.handleDID = function( message, form ) { 
}



/*-------------------------ModuleExporsts-----------------------------*/

// Export the DataNode
module.exports = DataNode;


