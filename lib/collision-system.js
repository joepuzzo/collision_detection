/*-----------------------------Imports-------------------------------*/
var Planner   = require('./planner.js'),            // Plans and Trajectories
    FakeGPS = require('./fake-gps.js'),         // Fake GPS 
    Messenger = require('./message/messenger.js'),  // Messenger
    Messages  = require('./message/messages.js'),   // Messages
    CMessages = require('./message/collision-messages.js'),
    CollisionDetector = require('./algorithms/collision/collision-detector.js'),
    Trajectory = require('./planner.js').Trajectory;
/*----------------------------Constants------------------------------*/
var   LOG = false;
const DEBUG = false;
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
function CollisionSystem( messenger, gps, id, log ) {
     
    LOG = log; 
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
	    if(LOG) console.log("DISTANCE from",this.id , "to", from.id, d );

	    // Assume that collision avoidance with from is alreadhy
        // being taken care of if from is in cordlinks already
	    if( d <= DSAFE && !this.coordLinks.get(from.id) ) { 

            // Time to make new cord link!

            // If I have larger address, I send roll assign
            if( from.id < this.id ){

                if(DEBUG) console.log(this.id,"NEW LINK CREATED WITH", from.id);

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
   
    if(DEBUG) console.log(this.id,"RECIEVED ROLL ASSIGNMENT FROM",from.id);
    
    // If we don't have a coord link with this guy
    if( !this.coordLinks.get(from.id) ){
        // Create a new cord link with this guy
        if(DEBUG) console.log(this.id,"NEW LINK ESTABLISHED WITH", from.id);
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

    if(DEBUG) console.log(this.id,"HANDLING PLAN REQUEST FOR PLAN", message.scheduleid, "FROM",from.id);
    //console.log("CURRENT ID", clink.scheduleid );

    // If we have a clink with this guy and we have not already recieved this plan request
    if( clink && clink.scheduleid < message.scheduleid ){

        if(DEBUG) console.log(this.id,"ORIGINAL PLAN REQUEST!");

        // Get the next segments to be send in the schedule
        var nextSegs = this.gps.getNextSegments();
        clink.partnerPlan = nextSegs;

        // Update the clinks scheduleid
        clink.scheduleid = message.scheduleid;
        // A new schedule will be built so reset
        clink.schedule   = undefined;
        // An update has occured so we can reset the steps
        clink.setps      = 0;

        // TODO do I need to do some cleanup here maybe? 

        // Send a plan response back 
        var planResp = new CMessages.PlanResponse( nextSegs, message.scheduleid );
        this.messenger.sendLocal( [planResp], from );
    }
}


CollisionSystem.prototype.handlePlanResponse = function( message, from ) {
    
  // Get a coordlink if we have one   
  var clink = this.coordLinks.get( from.id );

  if(DEBUG) console.log(this.id,"HANDLING PLAN RESPONSE FOR PLAN", message.scheduleid, "FROM",from.id);

  // If we have a coord link with this guy and we have not already recieved this plan response
  if( this.coordLinks.get(from.id) && clink.scheduleid < message.scheduleid ){
    if(DEBUG) console.log(this.id,"NEW PLAN RECIVED");

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
	* schedule=1 is I the owner of the schedule can not move and am waiting on my partner
	* schedule=2 is I the owner of the schedule can move but parner cant and is waiting on me
	*/
	var their_schedule = new Map();
	var my_schedule = new Map();

    // Initialize all of the plans to zero
	for( var traj of theirPlan.trajectories ){
	    their_schedule.set( Trajectory.stringify( traj ), 0 );
	}
    for( var traj of myPlan.trajectories ){
	    my_schedule.set( Trajectory.stringify( traj ), 0 );
	}

    
	if(DEBUG) {
        console.log(this.id,"MYPLAN ",myPlan);
	    console.log(this.id,"THEIRPLAN",from.id, theirPlan);
	    console.log(this.id,"COLLLLLLISION",collision);
    }

    // If we have a collision 
	if(collision){

        // If they get to the collision first
	    if( collision.isect1.timeOfCol > collision.isect2.timeOfCol ) {

            // Loop throuh and mark 2 for their schedue, i.e I will wait for them 
            // and mark 1 for my scedule because I can not move 
            for( var col of collisions ) {

                
                // Let the parner know that we are waiting for permission for trajectory1
                their_schedule.set( Trajectory.stringify( col.trajectory1.trajectory ), 2 );
                // We are waiting for permission for trajectory1 from our partner
                my_schedule.set( Trajectory.stringify( col.trajectory1.trajectory ), 1 );

                // Special case for if we are already on the trajectory
                if( Trajectory.stringify( this.gps.curTrajectory ) === Trajectory.stringify( col.trajectory1.trajectory ) ){
                    this.gps.pause();
                }

                // We are now waiting for our "partner" to give us permission on the marked trajectory
                // DONT WAIT ON THE SAME PERSON TWICE
                if( !(this.segPermissions.get( Trajectory.stringify( col.trajectory1.trajectory ) ).contains( from.id )) ) { 
                      this.segPermissions.get( Trajectory.stringify( col.trajectory1.trajectory ) ).push( from.id );
                }
            }

	    } else {

            // Loop throuh and mark 1 for their schedue, i.e they will wait on us
            // and mark 2 for my scedule because I can move  
            for( var col of collisions ) {

                // I will get there first so they are going to stop 
                var dcol = this.collisionDetector.dcollide;
                
                // Let the parner know they are not allowed to move on col.trajectory2
                their_schedule.set( Trajectory.stringify( col.trajectory2.trajectory ), 1 );
                // We have a guy that is waiting for permission for col.trajectory2
                my_schedule.set( Trajectory.stringify( col.trajectory2.trajectory ), 2 );
                
                // For convienence
                var my = this;
                var permission = new CMessages.GrantPermission( Trajectory.stringify( col.trajectory2.trajectory ) );

                // When we get out of the collision sphere let our parner know
                this.gps.when( col.isect1, col.trajectory1.trajectory, dcol, function(){ 
                    if( DEBUG ) console.log("TO2:",from);
                    my.messenger.sendLocal( [permission], from );
                    //my.cleanupCoordLink(fr.id);
                });

            }
	    }
 	}

    // Send their awesome new schedule back! 
	var scheduleReply = new CMessages.ScheduleReply( [...their_schedule], collision, collisions, message.scheduleid  );
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
                        if( DEBUG ) console.log("UGGGGGG REMOVED LINK AND NOW SEGPERM IS",waitingOn);
                    }
                }
            }
        }
        return;
    }

    if( DEBUG ) {
        console.log("GRANTER:",granter);
        console.log( "ALWAYS STRING:", trajectory );
    }

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
                if(DEBUG) console.log("UGGGGGG REMOVED LINK AND NOW SEGPERM IS",waitingOn);
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

        if(DEBUG) console.log(this.id,"Recieved Schedule from:",from.id, schedule);

        // myPlan is a map from trajseg -> 0 || 1 || 2 
        for( var trajSeg of schedule ){
            //console.log("SCHEDULE ITERATOR: ",trajSeg);
            var mySeg = trajSeg[0];
            var act = trajSeg[1];
            //console.log("ACTION FOR TRAJ: ",act);

            // If the action is 1 
            if( act === 1 ){

                if(DEBUG){
                    console.log(this.id,"NEED TO UPDATE SEGPERM OF ",mySeg);
                    console.log(this.id,"MY SEGPERMS ARE: ",this.segPermissions);
                }

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
                    if(DEBUG) console.log("TO:",from);
                    my.messenger.sendLocal( [permission], from );
                    //my.cleanupCoordLink( fr.id );
                });
            }
        }
        if(DEBUG){
            console.log(this.id,"HERE IS WHAT WE HAVE BEEN WAITING FOR!! A MODIFIED PLAN!!!!!");
            console.log( this.segPermissions );
        }
    }
}


CollisionSystem.prototype.handleLinkUpdate = function( message, from ) {
    
    // Get the clink 
    var clink = this.coordLinks.get( from.id );

    // If we have a clink and and have not already recieved this link update
    if( clink && clink.scheduleid < message.scheduleid ){

        //TODO maybe update schedule id here???

        // If I am the coordinator I need to send another plan request
        if( clink.amcoord === 1 ){
            // Send a plan request for a new schedule 
            planReq = new CMessages.PlanRequest( 3, clink.scheduleid + 1 );
            //planReq = new CMessages.PlanRequest( 3, link.scheduleid );
            my.messenger.sendLocal( [planReq], clink.linkPartner );
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
        // Itterate over all the coordlinks and remove them
        for( var clink of my.coordLinks ){
           
           
           var gp = new CMessages.GrantPermission( );
           messenger.sendLocal( [gp], clink[1].linkPartner );

            
            //Itterate over all the trajectories in their plan
            /*if( clink[1].schedule !== undefined ){
                for( var traj of clink[1].schedule ) { 

                    // If this trajectory is a partner waiting on me
                    if( traj[1] === 2 ) { 

                        // Grant permission to everyone waiting for me!
                        var gp = new CMessages.GrantPermission( traj[0] );
                        messenger.sendLocal( [gp], clink[1].linkPartner );
                    }

                }
            }*/
            // Clean up my partner
            my.cleanupCoordLink( clink[1].linkPartner.id );
        }
    });
 
    this.gps.on("TrajectoryChange", function(traj){

        if(DEBUG) console.log("CHANGED TRAJ TO",traj);

        // If the trajectory that we are about to execute 
        // has a non zero permissions length then pause
        var waitingOn = my.segPermissions.get( Trajectory.stringify(traj) );

        if(DEBUG) console.log( "WAITINGON FOR THIS SEG", waitingOn );

        // If we are waiting on this segment
        if( waitingOn.length > 0 ){
            // Pause the gps
            if(DEBUG) console.log("SHOULD PAUSE GPS NOW!!!!!!!!!!!!!!!!!!!!!!");
            my.gps.pause();
        }

        /* Its time to see if we need to renegotiate plans */
 
        // Itterate over all the coordination links
        var link, planReq, linkup;
        for( var links of my.coordLinks ) { 
            
            // Get the c link out
            link = links[1];

            if(DEBUG)console.log("LINKS SCHEDULE:",link.schedule);

            // Check to see if this link contains the trajectory 
            if( link.schedule && link.schedule.get( Trajectory.stringify( traj ) ) !== undefined ) {

                if(DEBUG)console.log("WE HAVE A SCHEDULE WITH THIS TRAJECTORY");
                
                // Update the schedule steps
                link.steps++;

                // If it does and it time to update, do so!
                // TODO 2 ?? 
                if( link.steps === 3 ){ 

                    if(DEBUG)console.log(my.id, "UPDATING LINK");

                    // Reset the steps
                    link.steps = 0;

                    // If I am the coordinator I need to send another plan request
                    if( link.amcoord === 1 ){
                        // Send a plan request for a new schedule 
                        planReq = new CMessages.PlanRequest( 3, link.scheduleid + 1 );
                        //planReq = new CMessages.PlanRequest( 3, link.scheduleid );
                        my.messenger.sendLocal( [planReq], link.linkPartner );
                    } 
                    // Otherwise I am the partner, I need to send a link update
                    else { 
                        linkup = new CMessages.LinkUpdate( link.scheduleid + 1 );
                        my.messenger.sendLocal( [linkup], link.linkPartner );
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
    messenger.on('LinkUpdate',function(msg,from){my.handleLinkUpdate(msg,from)});

}

CollisionSystem.prototype.cleanupCoordLink = function(linkpartnerid){

    if(DEBUG)console.log("cleaningupcordlinkwith ",linkpartnerid);

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
    var schedule;                  // my current schedule 
    var partnerPlan;               // don't let the name fool you, this is your plan if you are the parner
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
