/*-----------------------------Imports-------------------------------*/
var Planner   = require('./planner.js'),            // Plans and Trajectories
    FakeGPS = require('./fake-gps.js'),         // Fake GPS 
    Messenger = require('./message/messenger.js'),  // Messenger
    Messages  = require('./message/messages.js'),   // Messages
    CMessages = require('./message/collision-messages.js'),
    CollisionDetector = require('./algorithms/collision/collision-detector.js'),
    Trajectory = require('./planner.js').Trajectory;
/*----------------------------Constants------------------------------*/
const LOG = false;
const DSAFE =50; //10 meters

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

    this.collisionDetector = new CollisionDetector();

    this.coordLinks = new Map(); 

    //maps trajectory segments to array of ids
    this.segPermissions = new Map();

    // maps an id to a cord link
    this.waitingonme = new Map();
 
    //init segPermissions so you're not waiting on anybody
    for(var traj of this.plan.trajectories){
	    this.segPermissions.set(Trajectory.stringify(traj),[]);
    }

    // Register for all messages
    this.registerMessages();

}

/*--------------------MessageHandlers---------------------*/

CollisionSystem.prototype.handleHIA = function( message, from ) { 
	
	var myLocation = this.gps.getLocation();	

	//probably want some sort of buffer zone
    //TODO should work at varying altatudes ( After AI Project )
	if(myLocation.alt==message.alt){    
	    var d = distance(myLocation.lat,myLocation.lon,message.lat,message.lon);
	    //console.log("MYPOS: ",myLocation);
	    //console.log("THEIRPOS: ",message);
	    console.log("DISTANCE ",d);
	    //assume that collision avoidance with from is already
	    //being taken care of if from is in cordlinks already
	    if(d<=DSAFE && this.coordLinks.get(from.id)===undefined){ //Need to create cord link
            //If I have larger address, I send roll assign
            //console.log("COLLISION POSSIBLE with..");
            //console.log(from.id);
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

                var rollAss = new CMessages.RollAssignment(roll);
                this.messenger.sendLocal( [rollAss], from );

                if(roll==1){// if THEY are the partner
                    var planReq = new CMessages.PlanRequest();
                    this.messenger.sendLocal([planReq],from);
                }
            }

	    }else if(d>DSAFE&&this.coordLinks.get(from.id)!==undefined){
		    //if we are waiting on from then remove from all segments depending on them
		    //maybe for sanity, we send them permission? but they should know due to the line above
		    this.cleanupCoordLink(from.id);
	    }
        //TODO SO NOTHING HAPPENS WHEN WE HAVE A CORD LINK AND D < DSAFE RIGHT? 
	    /*else if(d<DSAFE){
		    //already have a cordlink with them this shouldnt be examined because
		    //the cord link would have been removed by this time
		    //var cordLink = this.cordLinks.get(from.id);
		    //if I am the coordinator, I need to send plan request
		    //if(cordLink.amcoord==1){
		    
		    //}

 	    }*/
    } else if(this.coordLinks.get(from.id)!==undefined){
        // TODO JUST WANT TO BE CLEAR THAT THIS ELSE IF GOES WITH THE FIRST IF IN THIS FUNCTION
	    this.cleanupCoordLink(from.id);
    }
    
}

CollisionSystem.prototype.handleRollAssignment = function( message, from ) {
  
    if(this.coordLinks.get(from.id)===undefined){
        //console.log("SHOULD ADD COORDLINK AFTER GETTING ROLLASS");
        this.coordLinks.set(from.id,new CoordLink(from.id,message.roll));
    }
    if(!this.coordLinks.get(from.id).gotRollAss){
        //0 means I am the cordinator and need to request plan
    	if(message.roll==0){
	    //send plan request
	    var planReq = new CMessages.PlanRequest();
            this.messenger.sendLocal([planReq],from);
    	} 
	this.coordLinks.get(from.id).gotRollAss=true; 
    }
}

CollisionSystem.prototype.handlePlanRequest = function( message, from ) {
    //create new response and send it
    if(this.coordLinks.get(from.id)!== undefined && !this.coordLinks.get(from.id).gotPlanReq){
	this.coordLinks.get(from.id).gotPlanReq = true;
        var nextSegs = this.gps.getNextSegments();
        this.coordLinks.get(from.id).partnerPlan=nextSegs;
        var planResp = new CMessages.PlanResponse(nextSegs);
        this.coordLinks.get(from.id).partnerPlan = nextSegs;
        this.messenger.sendLocal([planResp],from);
    }
}

CollisionSystem.prototype.handlePlanResponse = function( message, from ) {


  if(this.coordLinks.get(from.id)!== undefined && !this.coordLinks.get(from.id).gotPlanResp){
	this.coordLinks.get(from.id).gotPlanResp = true;
	this.coordLinks.get(from.id).partnerPlan = message.trajectories;
	var myPlan = Planner.makePlan(this.gps.getNextSegments());
	var theirPlan = Planner.makePlan(this.coordLinks.get(from.id).partnerPlan);
	var collision = this.collisionDetector.isCollision(myPlan,theirPlan);
	

	//This is where we build the schedule to send to our partner
	//The schedule needs to be a map from trajectory in their plan -> int
	/* schedule=0 is both move
	* schedule=1 is you stop
	* schedule=2 is i stop
	*/
	var schedule = new Map();
	for(var traj of theirPlan.trajectories){
	    //console.log("THEIRTRAJSEG",traj);
	    schedule.set(traj,0);
	}
	console.log("MYPLAN ",myPlan);
	console.log("THEIRPLAN ",theirPlan);
	console.log("COLLLLLLISION",collision);

	if(collision){
	    //okay, there's a collision
	    //I will tell THEM to wait if I will reach the
	    //collision point first
	    //and will have myself wait otherwise
	    if(collision.isect1.timeOfCol>collision.isect2.timeOfCol){
	        //need to register with gps so that I get notified
	  	    schedule.set(collision.trajectory2.trajectory,2);
		    this.segPermissions.get(Trajectory.stringify(collision.trajectory1.trajectory)).push(from.id);
	    }else{
		var dcol = this.collisionDetector.dcollide;
		schedule.set(collision.trajectory2.trajectory,1);
		var my = this;
                var permission = new CMessages.GrantPermission();
		var fr = from;
                // When we get out of the collision sphere let our parner know
		this.gps.when(collision.isect1,collision.trajectory1.trajectory, dcol, function(){ 
                my.messenger.sendLocal([permission],fr);
		my.cleanupCoordLink(fr.id);
            });
	    }
 	}

	//console.log("OMFG THE COLLISIONS ARE:",collisions);
	//nsole.log("GENERATED SCHEDULE",...schedule);
    
    // Send our awesome new schedule back!
	var scheduleReply = new CMessages.ScheduleReply([...schedule],collision);
    this.messenger.sendLocal([scheduleReply],from);	
  }
}

/**
 * A helper function for changing seg permissions
 */
CollisionSystem.prototype.removeFromSegPerm = function(granter){
     for(var seg of this.segPermissions){
        var trajSeg   = seg[0];
        var waitingOn = seg[1];
        if( waitingOn.contains(granter)){
            //forget about the fact you were waiting on them
            var ind = waitingOn.indexOf(granter);
            waitingOn.splice(ind,1);
            if(trajSeg==Trajectory.stringify(this.gps.curTrajectory)){
                //we are removing permissions for current seg
                //if zero, WE ARE FREE to go
                if(waitingOn.length==0){
                    this.gps.unpause();
                }else{
                    console.log("UGGGGGG REMOVED LINK AND NOW SEGPERM IS",waitingOn);
                }
            }
        }
    }

}

CollisionSystem.prototype.handleGrantPermission = function( message, from ) {
    //If I am granted permission I need to remove from.id from
    //segPermissions for the trajectory I have been given permission for
    //console.log("BEFORE: ",this.segPermissions);
    //this.removeFromSegPerm(from.id);
    this.cleanupCoordLink(from.id);
    //console.log("AFTER: ",this.segPermissions);
}

CollisionSystem.prototype.handleScheduleReply = function( message, from ) {
    /* schedule=0 is both move
     * schedule=1 is you stop
     * schedule=2 is i stop
     */
    //var myPlan = this.coordLinks.get(from.id).partnerPlan; //if you got a schedule, you are the partner
 
    if(!this.coordLinks.get(from.id).gotSchedule){
        this.coordLinks.get(from.id).gotSchedule = true;
    var schedule = new Map(message.schedule);
    var collision = message.collision; 

    console.log("Recieved Schedule: ",schedule);
    //myPlan is a map from trajseg -> 0||1
    for(var trajSeg of schedule){
        //console.log("SCHEDULE ITERATOR: ",trajSeg);
        var act = trajSeg[1];
        var mySeg = trajSeg[0];
        //console.log("ACTION FOR TRAJ: ",act);
        if(act==1){
            //console.log("PARSING SCHEDULE OBJECT CORRECTLY!!!!!!");
            // TODO THIS IS FINE FOR NOW BUT THIS NEEDS TO CHANGE EVENTUALLY!
            this.segPermissions.get(Trajectory.stringify(trajSeg[0])).push(from.id);
            if(Trajectory.stringify(this.gps.curTrajectory)==Trajectory.stringify(trajSeg[0])){
                this.gps.pause();
            }
        }else if(act==2){
            //need to send grantpermission to from when I get past intersect point
            //within intersect segment
            //if you are recieving a plan then your'e collision2
            var dcol = this.collisionDetector.dcollide;
            var my = this;
            var permission = new CMessages.GrantPermission();
            var fr = from;
            this.gps.when(collision.isect2,collision.trajectory2.trajectory, dcol, function(){
                my.messenger.sendLocal([permission],fr);
		my.cleanupCoordLink(fr.id);
            });
        }
    }
    console.log("HERE IS WHAT WE HAVE BEEN WAITING FOR!! A MODIFIED PLAN!!!!!");
    console.log(this.segPermissions);
    }
}
//-------------------------------------------------------------------
/*----------------DEADLOCK DETECTION & RESOLUTION ------------------*/
//-------------------------------------------------------------------

CollisionSystem.prototype.handleDeadlockProbe = function( message, from ) {
	//if you recieve your own probe, there is a deadlock
	if(message.originator===this.messenger.id){
	    //send roll change to from to break the circle	
	    this.coordLinks.get(from.id).swapRolls();
	    //now am the  partner with this person
	    //need to tell them they are the coordinator
	    //this will prompt them to send us a plan request
	    //RollAssignment0 is THEY are coordinator
	     var rollAss = new CMessages.RollAssignment(0);
             this.messenger.sendLocal( [rollAss],from);
	}
	//else forward it on to all of the people you are waiting on(if any);
	var traj = this.gps.curTrajectory;
	//TODO might want to consider adding self to list of circle members
	if(this.segPermissions.get(Trajectory.stringify(traj)).length>0){ //send message to all people you are waiting on
	    var waitIds = this.segPermissions.get(Trajectory.stringify(traj)); 
	    for(var id of waitIds){
		var recip = this.coordLinks.get(id);
		this.messenger.sendLocal([message],recip);
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
     
    this.gps.on("PlanComplete",function(){
        for(var clink of my.coordLinks){
            var gp = new CMessages.GrantPermission();
            messenger.sendLocal([gp],clink.linkPartner);
            if(clink.linkPartner!==undefined){
                my.cleanupCoordLink(clink.linkPartner.id);
            }
        }
    });
 
    this.gps.on("TrajectoryChange", function(traj){
        //if the trajectory that we are about to execute 
        //has a non zero permissions length then pause
        console.log("CHANGED TRAJ TO",traj);
        //traj will be undefined at the end of the run
        var waitingOn = my.segPermissions.get( Trajectory.stringify(traj) );
        console.log("WAITINGON FOR THIS SEG",waitingOn);
        if(waitingOn.length>0){
            console.log("SHOULD PAUSE GPS NOW!!!!!!!!!!!!!!!!!!!!!!");
            my.gps.pause();
        }
    });

    // Register for all default messenges
    messenger.on('hia',function( msg, from ){ my.handleHIA(msg,from) } );
    messenger.on('RollAssignment',function( msg, from ){ my.handleRollAssignment(msg,from) } );
    messenger.on('PlanRequest', function( msg, from ){ my.handlePlanRequest(msg,from) } );
    messenger.on('PlanResponse',function( msg, from ){ my.handlePlanResponse(msg,from) } );
    messenger.on('ScheduleReply',function( msg, from ){ my.handleScheduleReply(msg,from) } );
    messenger.on('DeadlockProbe',function( msg, from ){ my.handleDeadlockprobe(msg,from) } );
    messenger.on('RollChange',function( msg, from ){ my.handleRollChange(msg,from) } );
    messenger.on('GrantPermission',function(msg,from){my.handleGrantPermission(msg,from)});

}

CollisionSystem.prototype.cleanupCoordLink = function(linkpartnerid){
    //remove id from all segments waiting on linkpartnerid
    //remove coordlink
    console.log("cleaningupcordlinkwith ",linkpartnerid);
    this.removeFromSegPerm(linkpartnerid);
    this.coordLinks.set(linkpartnerid,undefined);
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
    this.gotSchedule = false;
    this.gotPlanReq  = false;
    this.gotPlanResp = false;
    this.gotRollAss = false;
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

module.exports = CollisionSystem;
