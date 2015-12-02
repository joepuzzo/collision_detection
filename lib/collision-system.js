/*-----------------------------Imports-------------------------------*/
var Planner   = require('./planner.js'),            // Plans and Trajectories
    DaemonGPS = require('./daemon-gps.js'),         // Daemon GPS 
    Messenger = require('./message/messenger.js');  // Messenger
    Messages  = require('./message/messages.js');   // Messages
    CMessages = require('./message/collision-messages.js');

/*----------------------------Constants------------------------------*/
const LOG = false;
const DSAFE =10; //10 meters

/*----------------------------CollisionSystem-------------------------------*/


/**
 * Data nodes constructor
 *
 * @param messenger
 */
function CollisionSystem( messenger, gps, myname ) { 

    this.messenger = messenger || new Messenger();
    this.gps = gps || new DaemonGPS();
    this.myname = myname;
    this.cordlinks = [];
    
    this.amwaitingon = [];
    this.waitingonme = [];

    // Register for all messages
    this.registerMessages();

}


/*------------------HandlerRegistration------------------*/

/**
 * This function will register all listeners for events that the
 * messenger may emit. 
 */
CollisionSystem.prototype.registerMessages = function() { 

    // For convienence
    var messenger = this.messenger;

    // Register for all default messenges
    messenger.on('hia', this.handleHIA );
}


/*--------------------MessageHandlers---------------------*/

CollisionSystem.prototype.handleHIA = function( message, from ) { 

	var myLocation = gps.getLocation();

	//probably want some sort of buffer zone
	if(myLocation.alt==message.alt){
	    
	    d = distance(myLocation.lat,myLocation.lon,message.lat,message.lon);
	    //assume that collision avoidance with from is already
	    //being taken care of if from is in cordlinks already
	    if(d<=DSAFE && !cordlinks.contains(from)){ //Need to create cord link
		//If I have larger address, I send roll assign
		if(from<myaddr){
		    //randomly generate 0 or 1
		    //0 is coordinator
		    //1 is partner
		    var roll = Math.random() < .5 ? 0 : 1;
		    if(roll==0){
			amwaitingon.push(from);
		    }else{
			waitingonme.push(from);
		    }
		    rollass = new RollAssignment(roll);
		    envelope = new Envelope(true,myaddr,rollass);
		    messenger.mail(envelope);
		}
		cordlinks.push(from);

	    }else if(d>DSAFE){
		
	    }
	}else if(cordlinks.contains(from)){
	    var index = cordlinks.indexOf(from);
	    cordlinks.splice(index,1);
	}
}

//distance returns how many meters between two lat lons
function distance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = 
     0.5 - Math.cos(dLat)/2 + 
     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
     (1 - Math.cos(dLon))/2;

  return R * 2 * Math.asin(Math.sqrt(a));
}

//array contains function
Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}


/*-------------------------ModuleExporsts-----------------------------*/

// Export the DataNode
module.exports = CollisionSystem;


