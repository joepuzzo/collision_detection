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
 * CollisionSystem constructor
 *
 * @param messenger
 * @param gps
 * @param id
 * @param plan
 */
function CollisionSystem( messenger, gps, id, plan ) { 

    this.messenger = messenger;
    this.gps = gps;
    this.id = id;
    this.plan = plan;

    this.cord_links = new Map(); 
    //maps of trajectory segments to array of ids
    this.seg_permissions = new Map();
    // maps an id to a cord link
    this.waitingonme = new Map();
 
    //init seg_permissions so you're not waiting on anybody
    for( var traj of plan ) {
	    seg_permissions.set(traj,[]);
    }

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
    messenger.on('RollAssignment',this.handleRollAssignment);
    messenger.on('PlanRequest', this.handlePlanRequest);
    messenger.on('PlanResponse',this.handlePlanResponse);
    messenger.on('ScheduleReply',this.handleScheduleReply);
}


/*--------------------MessageHandlers---------------------*/

CollisionSystem.prototype.handleHIA = function( message, from ) { 

	var myLocation = gps.getLocation();

	//probably want some sort of buffer zone
	if(myLocation.alt==message.alt){    
	    var d = distance(myLocation.lat,myLocation.lon,message.lat,message.lon);
	    //assume that collision avoidance with from is already
	    //being taken care of if from is in cordlinks already
	    if(d<=DSAFE && this.cordLinks.get(from.id)==undefined){ //Need to create cord link
		//If I have larger address, I send roll assign
		if(from.id<this.id){
		    //randomly generate 0 or 1
		    //0 is "you are coordinator I am partner"
		    //1 is "you are partner I am coordinator"
		    var roll = Math.random() < .5 ? 0 : 1;
		    /*if(roll==0){
			    //this would make us wait until schedule recieved
			    //var curTraj = this.gps.curTrajectory;
			    //this.seg_permissions.get(curTraj).push(from.id);
		    }else{
			    //this would be to make them wait until schedule recieved
			    //this.waitingonme.push(from.id);
		    }*/

                    this.cordLinks.set(from.id,new CordLink(from,roll));

		    var rollAss = new RollAssignment(roll);
		    //TODO why is this global????
		    this.messenger.sendGlobal( [rollAss], from );
		    if(roll==1){
		        var planReq = new PlanReq();
		        this.messenger.sendGlobal([planReq],from);
		    }
		}

	    }else if(d>DSAFE){
		//if we are waiting on from then remove from all segments depending on them
		//maybe for sanity, we send them permission? but they should know due to the line above
		cleanupCordLink(from.id);
	    }else if(d<DSAFE){
		//already have a cordlink with them this shouldnt be examined because
		//the cord link would have been removed by this time

		/*var cordLink = this.cordLinks.get(from.id);
		//if I am the coordinator, I need to send plan request
		if(cordLink.amcoord==1){
		    
		}*/
 	    }
    }else if(this.cordLinks.get(from.id)!=undefined){
	cleanupCordLink(from.id);
    }
}

CollisionSystem.prototype.handleRollAssignment = function( message, from ) {
    this.cordLinks.set(from.id,new CordLink(fom,message.roll));
    //0 means I am the cordinator and need to request plan
    if(message.roll==0){
	//send plan request
	var planReq = new PlanReq();
        this.messenger.sendGlobal([planReq],from);
    }
}

CollisionSystem.prototype.handlePlanRequest = function( message, from ) {
    //create new response and send it
    var nextSegs = this.gps.getNextSegments();
    cordLinks.get(from.id).partnerPlan=nextSegs;
    var planResp = new PlanResponse(mextSegs);
    this.messenger.sendGlobal([planResp],from);
}

CollisionSystem.prototype.handlePlanResponse = function( message, from ) {
	//TODO Pass recieved plan off to collision checker
	//TODO build and send schedulereply
	
}

CollisionSystem.prototype.handleScheduleReply = function( message, from ) {
    /* schedule=0 is both move
     * schedule=1 is you stop
     * schedule=2 is i stop
     */
    var myPlan = cordLinks.get(from.id).partnerPlan; //if you got a schedule, you are the partner
    for(var trajSeg of myPlan){
	    var act = schedule.get(trajSeg);
	    if(act==1){
	        seg_permissions.get(trajSeg).push(from.id);
	    }
    }
}


/*------------------------CordLink-----------------------------------*/
/*CordLink constructor
 * @param linkPartner
 * @param amcoord
 */
function CordLink(linkPartner,amcoord){
    var schedule;
    var partnerPlan;//don't let the name fool you, this is your plan if you are the parner
    this.linkPartner = linkPartner;
    this.amcoord = amcoord;//0 if not, 1 if am
}

//********************************************************************
/*-------------------------HelperMethods-----------------------------*/
//*********************************************************************
function cleanupCordLink(linkpartnerid){
    //remove id from all segments waiting on linkpartnerid
    //remove cordlink
    for(var seg of seg_permissions){
	if(seg_permissions[seg].contains(linkpartnerid)){
	    //forget about the fact you were waiting on them
	    var ind = seg_permissions[seg].indexOf(linkpartnerid);
	    seg_permissions[seg].splice(index,1);
  	}
    }
    var index = this.cordLinks.indexOf(from.id);
    this.cordLinks.splice(index,1);
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
// TODO be careful when you do this. Now when you itterate for( i in yourarray )
// your iteration will include the contains function. Its fine for now. 
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


