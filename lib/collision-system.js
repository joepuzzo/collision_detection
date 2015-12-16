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
const DSAFE = 200; 

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

    //TODO should work at varying altatudes ( After AI Project )
	if( myLocation.alt === message.alt ){    

	    var d = distance(myLocation.lat,myLocation.lon,message.lat,message.lon);

	    //console.log("MYPOS: ",myLocation);
	    //console.log("THEIRPOS: ",message);
	    console.log("DISTANCE ",d);

	    // Assume that collision avoidance with from is alreadhy
        // being taken care of if from is in cordlinks already
	    if( d <= DSAFE && !this.coordLinks.get(from.id) ) { 

            // Time to make new cord link!

            // If I have larger address, I send roll assign
            if( from.id < this.id ){

                console.log("NEW LINK CREATED");

                // randomly generate 0 or 1
                // 0 is "you are coordinator I am partner"
                // 1 is "you are partner I am coordinator"
                var roll = Math.random() < .5 ? 0 : 1;

                // Add a new cord link to the map
                this.coordLinks.set( from.id, new CoordLink( from, roll ) );

                // Create a new roll assignment message
                var rollAss = new CMessages.RollAssignment( roll );
                this.messenger.sendLocal( [rollAss], from );

                // If they are the partner i.e I am the coordinator
                if( roll === 1 ) {
                    // Send a plan request ( we are going to do the planning )
                    var planReq = new CMessages.PlanRequest( 3, 1 );
                    this.messenger.sendLocal([planReq],from);
                }
            }

	    } else if( d > DSAFE && this.coordLinks.get(from.id) ){
            // We are out of dsafe so its time to clean up our cordLink
		    this.cleanupCoordLink(from.id);
	    }
	    /*else if( d < DSAFE ) { 

		    // Already have a cordlink with them
		    var cordLink = this.coordLinks.get( from.id );

		    //If I am the coordinator, and ... I need to send another plan request
		    if( cordLink.amcoord === 1 ){
		        // Send a plan request for a new schedule 
                var planReq = new CMessages.PlanRequest( 3, ++cordLink.scheduleid );
                this.messenger.sendLocal([planReq],from);
		    }

            // Otherwise I dont have to do anything???
 	    }*/
    } else if( this.coordLinks.get(from.id) ){
        // Differetnt altitude so we can clean up!
	    this.cleanupCoordLink(from.id);
    }
    
}

/**
 * Handles the roll Assignment
 */
CollisionSystem.prototype.handleRollAssignment = function( message, from ) {
    
    // If we don't have a coord link with this guy
    if( !this.coordLinks.get(from.id) ){
        // Create a new cord link with this guy
        console.log("NEW LINK ESTABLISHED");
        this.coordLinks.set( from.id, new CoordLink( from, message.roll ) );
    }

    // If we have not yet recived a rollAss then we need set things up 
    if( !this.coordLinks.get(from.id).gotRollAss ) {

        //0 means I am the cordinator and need to request plan
    	if( message.roll === 0 ){
	        // Send plan request for the first plan
	        var planReq = new CMessages.PlanRequest( 3, 1 );
            this.messenger.sendLocal( [planReq], from );
    	} 

        // Set the state variable ( The role has been assigned )
	    this.coordLinks.get(from.id).gotRollAss = true; 
    }

}


/**
 * Handles a plan request
 */
CollisionSystem.prototype.handlePlanRequest = function( message, from ) {

    // Get a coordlink if we have one 
    var clink = this.coordLinks.get( from.id );

    console.log("HANDLING PLAN REQUEST FOR PLAN", message.scheduleid, "FROM",from.id);
    //console.log("CURRENT ID", clink.scheduleid );

    // If we have a clink with this guy and we have not already recieved this plan request
    if( clink && clink.scheduleid < message.scheduleid ){
        console.log("ORIGINAL PLAN REQUEST!");
        // Get the next segments to be send in the schedule
        var nextSegs = this.gps.getNextSegments();
        clink.partnerPlan = nextSegs;

        // Update the clinks scheduleid
        clink.scheduleid = message.scheduleid;
        clink.schedule   = undefined;

        // Send a plan response back 
        var planResp = new CMessages.PlanResponse( nextSegs, message.scheduleid );
        this.messenger.sendLocal( [planResp], from );
    }
}


CollisionSystem.prototype.handlePlanResponse = function( message, from ) {
    
  // Get a coordlink if we have one   
  var clink = this.coordLinks.get( from.id );

  console.log("HANDLING PLAN RESPONSE FOR PLAN", message.scheduleid, "FROM",from.id);
  //console.log("CURRENT ID", clink.scheduleid );

  // If we have a coord link with this guy and we have not already recieved this plan response
  if( this.coordLinks.get(from.id) && clink.scheduleid < message.scheduleid ){
    console.log("NEW PLAN RECIVED");

    // Update the schedule id
    clink.scheduleid = message.scheduleid;

    // Update the partner plan to the messages trajectories
	clink.partnerPlan = message.trajectories;
    
    // Make myself a new plan 
	var myPlan = Planner.makePlan( this.gps.getNextSegments() );
    
    // Make them a new plan
	var theirPlan = Planner.makePlan( clink.partnerPlan );

    // Check for collisions
	var collision = this.collisionDetector.isCollision( myPlan, theirPlan, this.gps.getExecutionTime() );
	var collisions = this.collisionDetector.checkCollision( myPlan, theirPlan );
	
	//This is where we build the schedule to send to our partner
	//The schedule needs to be a map from trajectory in their plan -> int
   /* schedule=0 is both move
	* schedule=1 is you stop
	* schedule=2 is i stop
	*/
	var schedule = new Map();

    // Initialize all of the plans to zero
	for( var traj of theirPlan.trajectories ){
	    schedule.set( Trajectory.stringify( traj ), 0 );
	}
    
	console.log("MYPLAN ",myPlan);
	console.log("THEIRPLAN ",theirPlan);
	console.log("COLLLLLLISION",collision);

    // If we have a collision 
	if(collision){

        // If they get to the col first 
	    if( collision.isect1.timeOfCol > collision.isect2.timeOfCol ) {

            // Loop throuh and mark all collisions with 2's
            for( var col of collisions ) {

                // I am goint to stop TODO
                schedule.set( Trajectory.stringify( col.trajectory2.trajectory ), 2 );

                // We are now waiting for our "partner" to give us permission on the marked trajectory
                // DONT WAIT ON THE SAME PERSON TWICE
                if( !(this.segPermissions.get( Trajectory.stringify( col.trajectory1.trajectory ) ).contains( from.id )) ) { 
                      this.segPermissions.get( Trajectory.stringify( col.trajectory1.trajectory ) ).push( from.id );
                }
            }

	    } else {

            // Loop through and set all cols to 1 
            for( var col of collisions ) {

                // I will get there first so they are going to stop 
                var dcol = this.collisionDetector.dcollide;
                
                // Set the schedule such that they are going to stop
                schedule.set( Trajectory.stringify( col.trajectory2.trajectory ), 1 );
                
                // For convienence
                var my = this;
                var permission = new CMessages.GrantPermission( Trajectory.stringify( col.trajectory2.trajectory ) );
                //var fr = from;

                // When we get out of the collision sphere let our parner know
                this.gps.when( col.isect1, col.trajectory1.trajectory, dcol, function(){ 
                    console.log("TO2:",from);
                    my.messenger.sendLocal( [permission], from );
                    //my.cleanupCoordLink(fr.id);
                });

            }
	    }
 	}

	//console.log("OMFG THE COLLISIONS ARE:",collisions);
	//console.log("GENERATED SCHEDULE",...schedule);
    
    // Send our awesome new schedule back! 
	var scheduleReply = new CMessages.ScheduleReply( [...schedule], collision, collisions, message.scheduleid  );
    this.messenger.sendLocal( [scheduleReply], from );	

  }

}

/**
 * A helper function for changing seg permissions
 */
CollisionSystem.prototype.removeFromSegPerm = function( granter, trajectory ){

    trajectory = trajectory || "all"; 
    // If all was passed in then just blow up the everyone you are waiting on
    if( trajectory === "all" ) {
        for( var seg of this.segPermissions ){
            var trajSeg   = seg[0];
            var waitingOn = seg[1];
            if( waitingOn.contains(granter) ){
                //forget about the fact you were waiting on them
                var ind = waitingOn.indexOf(granter);
                waitingOn.splice(ind,1);
                if( trajSeg == Trajectory.stringify( this.gps.curTrajectory ) ){
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
        return;
    }

    console.log("GRANTER:",granter);
    console.log( "ALWAYS STRING:", trajectory );

    // Get this permissions for the sent trajectory
    var waitingOn = this.segPermissions.get( trajectory );
    
    
    // If this permission array is waiting on the granter and 
    if( waitingOn.contains( granter ) ){
        
        // Take him out of the array
        var ind = waitingOn.indexOf( granter );
        waitingOn.splice(ind,1);

        // If we are in the current trajectory then we need to call unpause
        if( trajectory === Trajectory.stringify( this.gps.curTrajectory ) ){
            // we are removing permissions for current seg
            // if zero, WE ARE FREE to go
            if( waitingOn.length === 0 ){
                this.gps.unpause();
            }else{
                console.log("UGGGGGG REMOVED LINK AND NOW SEGPERM IS",waitingOn);
            }
        }
    }
}

CollisionSystem.prototype.handleGrantPermission = function( message, from ) {
    // If I am granted permission I need to remove from.id from
    // segPermissions for the trajectory I have been given permission for
    // console.log("BEFORE: ",this.segPermissions);
    this.removeFromSegPerm( from.id, message.trajectory );
    //this.cleanupCoordLink(from.id);
    //console.log("AFTER: ",this.segPermissions);
}

CollisionSystem.prototype.handleScheduleReply = function( message, from ) {

    /* schedule=0 is both move
     * schedule=1 is you stop
     * schedule=2 is i stop
     */
     
    var clink = this.coordLinks.get( from.id );

    // If we have a clink and no schedule
    if( clink && !clink.schedule ){

        // Create a new schedule
        var schedule = new Map( message.schedule );

        // Set the schedule 
        clink.schedule = schedule;
    
        // Get the collision from the schedule ( if any )
        var collision = message.collision; 
        var collisions = message.collisions;

        console.log("Recieved Schedule: ",schedule);

        // myPlan is a map from trajseg -> 0 || 1 || 2 
        for( var trajSeg of schedule ){
            //console.log("SCHEDULE ITERATOR: ",trajSeg);
            var mySeg = trajSeg[0];
            var act = trajSeg[1];
            //console.log("ACTION FOR TRAJ: ",act);

            // If the action is 1 
            if( act === 1 ){
                console.log("NEED TO UPDATE SEGPERM OF ",mySeg);
                console.log("MY SEGPERMS ARE: ",this.segPermissions);

                // Get the seg permissions for this trajectory and update it 
                // TODO WHY IS THIS NESSISARY
		        if( !this.segPermissions.get( mySeg ).contains( from.id ) ) { 
                    this.segPermissions.get( mySeg ).push( from.id );
                }

                // Special case for if we are already on the trajectory
                if( Trajectory.stringify( this.gps.curTrajectory ) === mySeg  ){
                    this.gps.pause();
                }

            }
            // We need to grant them permission
            else if(act==2){
                // Need to send grantpermission to from when I get past intersect point
                // within intersect segment
                // Note: if you are recieving a schedule then your'e collision2

                // Get the collision distance
                var dcol = this.collisionDetector.dcollide;

                // For callback
                var my = this;

                // Create new permission message
                var permission = new CMessages.GrantPermission( mySeg );

                // For callback
                //var fr = from;

                this.gps.when( collision.isect2, collision.trajectory2.trajectory, dcol, function(){
                    console.log("TO:",from);
                    my.messenger.sendLocal( [permission], from );
                    //my.cleanupCoordLink( fr.id );
                });
            }
        }
        console.log("HERE IS WHAT WE HAVE BEEN WAITING FOR!! A MODIFIED PLAN!!!!!");
        console.log( this.segPermissions );
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
     
    /*this.gps.on("PlanComplete",function(){
        // Itterate over all the coordlinks and remove them
        for( var clink of my.coordLinks ){

            // Grant permission to everyone waiting for me!
            var gp = new CMessages.GrantPermission();
            messenger.sendLocal( [gp], clink[1].linkPartner );

            // Clean up my partner
            my.cleanupCoordLink( clink[1].linkPartner.id );
        }
    });*/
 
    this.gps.on("TrajectoryChange", function(traj){

        console.log("CHANGED TRAJ TO",traj);

        // If the trajectory that we are about to execute 
        // has a non zero permissions length then pause
        var waitingOn = my.segPermissions.get( Trajectory.stringify(traj) );

        console.log( "WAITINGON FOR THIS SEG", waitingOn );

        // If we are waiting on this segment
        if( waitingOn.length > 0 ){
            // Pause the gps
            console.log("SHOULD PAUSE GPS NOW!!!!!!!!!!!!!!!!!!!!!!");
            my.gps.pause();
        }
 
        // Itterate over all the coordination links
        var link, planReq;
        for( var links of my.coordLinks ) { 
            
            // Get the c link out
            link = links[1];

            console.log("LINKS SCHEDULE:",link.schedule);
            //console.log("TRAJECTORYHASH:", Trajectory.stringify);

            // Check to see if this link contains the trajectory
            if( link.schedule && link.schedule.get( Trajectory.stringify( traj ) ) !== undefined ) {

                console.log("WE HAVE A SCHEDULE WITH THIS TRAJECTORY");
                
                // Update the schedule steps
                link.steps++;

                // If it does and it time to update, do so!
                // TODO 2 ?? 
                if( link.steps === 3 ){ 

                    console.log("UPDATING LINK");

                    // Reset the steps
                    link.steps = 0;

                    //If I am the coordinator I need to send another plan request
                    if( true /*link.amcoord === 1*/ ){
                        // Send a plan request for a new schedule 
                        planReq = new CMessages.PlanRequest( 3, link.scheduleid + 1 );
                        //planReq = new CMessages.PlanRequest( 3, link.scheduleid );
                        my.messenger.sendLocal( [planReq], link.linkPartner );
                    } else { 
                        // DO nothing??
                    }
                }
            }
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

    console.log("cleaningupcordlinkwith ",linkpartnerid);

    // Remove this link partner from all segments waiting on him
    this.removeFromSegPerm( linkpartnerid, "all" );
    // Remove this coordLink 
    this.coordLinks.delete( linkpartnerid );
}


/*------------------------CoordLink-----------------------------------*/
/*CoordLink constructor
 * @param linkPartner
 * @param amcoord
 */
function CoordLink(linkPartner,amcoord){
    var schedule;                   // my current schedule 
    var partnerPlan;                // don't let the name fool you, this is your plan if you are the parner
    this.linkPartner = linkPartner; // my link partner
    this.amcoord = amcoord;         // 0 if not, 1 if am
    this.scheduleid = 0;            // The id of the schedule we are working on
    this.gotSchedule = false;       // State variables
    this.gotPlanReq  = false;
    this.gotPlanResp = false;
    this.gotRollAss = false;
    this.steps = 0;                 // The steps into the schedule
}

/**
 * Swap rolls within coordlink for deadlock removal
 */
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
