/*-----------------------------Imports-------------------------------*/
var Planner   = require('./planner.js'),            // Plans and Trajectories
    FakeGPS = require('./fake-gps.js'),         // Fake GPS 
    Messenger = require('./message/messenger.js'),  // Messenger
    Messages  = require('./message/messages.js'),   // Messages
    CMessages = require('./message/collision-messages.js');

/*----------------------------Constants------------------------------*/
const LOG = false;
const DSAFE =200; //10 meters

/*----------------------------CollisionSystem-------------------------------*/


/**
 * CollisionSystem constructor
 *
 * @param messenger
 * @param gps
 * @param id
 * @param plan
 */
function CollisionSystem( messenger, gps, id) { 

    this.messenger = messenger;
    this.gps = gps;
    this.id = id;
    this.plan = this.gps.plan;

    this.coordLinks = new Map(); 
    //maps o trajectory segments to array of ids
    this.segPermissions = new Map();
    // maps an id to a cord link
    this.waitingonme = new Map();
 
    //init segPermissions so you're not waiting on anybody
    for(var traj of this.plan.trajectories){
	this.segPermissions.set(traj,[]);
    }

    // Register for all messages
    this.registerMessages();

}

/*--------------------MessageHandlers---------------------*/

CollisionSystem.prototype.handleHIA = function( message, from ) { 
	
	var myLocation = this.gps.getLocation();	

	//probably want some sort of buffer zone
	if(myLocation.alt==message.alt){    
	    var d = distance(myLocation.lat,myLocation.lon,message.lat,message.lon);
	    //assume that collision avoidance with from is already
	    //being taken care of if from is in cordlinks already
	    if(d<=DSAFE && this.coordLinks.get(from.id)===undefined){ //Need to create cord link
		//If I have larger address, I send roll assign
		console.log("COLLISION POSSIBLE");
		console.log(from);
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

                    this.coordLinks.set(from.id,new CoordLink(from,roll));

		    console.log("ADDED TO COORDLINKS");
		    console.log(this.coordLinks.get(from.id));

		    var rollAss = new CMessages.RollAssignment(roll);
		    this.messenger.sendLocal( [rollAss]);

		    console.log("SHOULD HAVE SENT ROLLASS");
		    console.log(this.id);
		    if(roll==1){// if THEY are the partner
		        var planReq = new CMessages.PlanRequest();
		        this.messenger.sendLocal([planReq]);
		    }
		}

	    }else if(d>DSAFE){
		    //if we are waiting on from then remove from all segments depending on them
		    //maybe for sanity, we send them permission? but they should know due to the line above
		    this.cleanupCoordLink(from.id);
	    }else if(d<DSAFE){
		    //already have a cordlink with them this shouldnt be examined because
		    //the cord link would have been removed by this time

		    /*var cordLink = this.cordLinks.get(from.id);
		    //if I am the coordinator, I need to send plan request
		    if(cordLink.amcoord==1){
		    
		    }*/
 	    }
    }else if(this.coordLinks.get(from.id)!=undefined){
	    this.cleanupCoordLink(from.id);
    }
    
}

CollisionSystem.prototype.handleRollAssignment = function( message, from ) {
 
    console.log("FUCK YEAH!! GOT THE ROLL-ASSIGNMENT");
    if(this.coordLinks.get(from.id)===undefined){
        console.log("SHOULD ADD COORDLINK AFTER GETTING ROLLASS");
        this.coordLinks.set(from.id,new CoordLink(from.id,message.roll));
    }
    //0 means I am the cordinator and need to request plan
    if(message.roll==0){
	//send plan request
	var planReq = new CMessages.PlanRequest();
        this.messenger.sendLocal([planReq]);
    }
}

CollisionSystem.prototype.handlePlanRequest = function( message, from ) {
    //create new response and send it
    var nextSegs = this.gps.getNextSegments();
    coordLinks.get(from.id).partnerPlan=nextSegs;
    var planResp = new CMessages.PlanResponse(mextSegs);
    this.messenger.sendLocal([planResp]);
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
    var myPlan = coordLinks.get(from.id).partnerPlan; //if you got a schedule, you are the partner
    //myPlan is a map from trajseg -> 0||1
    for(var trajSeg of myPlan){
	    var act = schedule.get(trajSeg);
	    if(act==1){
	        segPermissions.get(trajSeg).push(from.id);
	    }
    }
}
//-------------------------------------------------------------------
/*----------------DEADLOCK DETECTION & RESOLUTION ------------------*/
//-------------------------------------------------------------------

CollisionSystem.prototype.handleDeadlockProbe = function( message, from ) {
	//if you recieve your own probe, there is a deadlock
	if(message.originator===this.messenger.id){
	    //send roll change to from to break the circle	
	    coordLinks.get(from.id).swapRolls();
	    //now am the  partner with this person
	    //need to tell them they are the coordinator
	    //this will prompt them to send us a plan request
	    //RollAssignment0 is THEY are coordinator
	     var rollAss = new CMessages.RollAssignment(0);
             this.messenger.sendLocal( [rollAss]);
	}
	//else forward it on to all of the people you are waiting on(if any);
	var traj = this.gps.curTrajectory;
	//TODO might want to consider adding self to list of circle members
	if(segPermissions.get(traj).length>0){
	    //send message to all people you are waiting on
	    var waitIds = segPermissions.get(traj);
	    for(var id of waitIds){
		    var recip = coordLinks.get(id);
		    this.messenger.sendLocal([message]);
	    }
	}
}

//I don't think this is neccessary, you can just send a roll assignment
//and it will follow the motions there on out
CollisionSystem.prototype.handleRollChange = function( message, from ) {

}


/*------------------HandlerRegistration------------------*/

/**
 * This function will register all listeners for events that the
 * messenger may emit. 
 */
CollisionSystem.prototype.registerMessages = function() { 

    // For convienence
    var messenger = this.messenger;
    var my = this;

    // Register for all default messenges
    messenger.on('hia',function( msg, from ){ my.handleHIA(msg,from) } );
    messenger.on('RollAssignment',function( msg, from ){ my.handleRollAssignment(msg,from) } );
    messenger.on('PlanRequest', function( msg, from ){ my.handlePlanRequest(msg,from) } );
    messenger.on('PlanResponse',function( msg, from ){ my.handlePlanResponse(msg,from) } );
    messenger.on('ScheduleReply',function( msg, from ){ my.handleScheduleReply(msg,from) } );
    messenger.on('DeadlockProbe',function( msg, from ){ my.handleDeadlockprobe(msg,from) } );
    messenger.on('RollChange',function( msg, from ){ my.handleRollChange(msg,from) } );

}

CollisionSystem.prototype.cleanupCoordLink = function(linkpartnerid){
    //remove id from all segments waiting on linkpartnerid
    //remove coordlink
    for(var seg of this.segPermissions){
	    if( seg.contains(linkpartnerid)){
	        //forget about the fact you were waiting on them
	        var ind = this.segPermissions[seg].indexOf(linkpartnerid);
	        seg.splice(index,1);
  	    }
    }
    delete this.coordLinks[linkpartnerid];
}


/*------------------------CoordLink-----------------------------------*/
/*CoordLink constructor
 * @param linkPartner
 * @param amcoord
 */
function CoordLink(linkPartner,amcoord){
    var schedule;
    var partnerPlan;//don't let the name fool you, this is your plan if you are the parner
    this.linkPartner = linkPartner;
    this.amcoord = amcoord;//0 if not, 1 if am
}

//swap rolls within coordlink for deadlock removal
CoordLink.prototype.swapRolls=function(){
    if(this.amcoord==0){
	    this.amcoord=1;
    }else if(this.amcoord==1){
	    this.amcoord=0;
    }
    
}

//********************************************************************
/*-------------------------HelperMethods-----------------------------*/
//*********************************************************************

//TODO there is a utilities file line.js that already contains functions such as this
function distance(lat1, lon1, lat2, lon2) {
    var sqr1 = Math.pow((lat1-lat2),2);
    var sqr2 = Math.pow((lon1-lon2),2);
    return Math.sqrt(sqr1+sqr2);
}

/*distance returns how many meters between two lat lons
function distance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = 
     0.5 - Math.cos(dLat)/2 + 
     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
     (1 - Math.cos(dLon))/2;

  return R * 2 * Math.asin(Math.sqrt(a));
}*/



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

module.exports = CollisionSystem;
