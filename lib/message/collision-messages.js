/*-----------------------------Imports-------------------------------*/
var Messages = require('./messages.js'); // Include the messages file 
var Message  = Messages.Message;         // Convienence so we dont have
                                         // to type Messages.Message 
var checkType = Messages.checkType;      // Method for checking type


/*----------------------------Constants------------------------------*/
const LOG = false;


/*---------------------------MessangeTypes---------------------------*/

/*------RollAssignment--------------------------*/
/**
 * @param roll
 * 0= coordinator
 * 1= partner
 */
function RollAssignment(roll){
    
    Message.call(this,"RollAssignment");
    //0 is cordinator
    //1 is partner
    this.roll = roll;	
}

RollAssignment.prototype = Object.create( Message.prototype);

module.exports.RollAssignment = RollAssignment;

/*------PlanRequest-----------------------------*/
/**
 * The PlanRequest constructor
 * @param segments	amount of segments requested
 */
function PlanRequest(segments, id){
    
    Message.call(this,"PlanRequest");

    this.segments = segments || 3; // <-should put that 3 in a config file   
    this.scheduleid  = id;            // The nth plan request that has been sent
}

PlanRequest.prototype = Object.create( Message.prototype ); 

module.exports.PlanRequest = PlanRequest;

/*------PlanResponse----------------------------*/
/*
 * The PlanResponse constructor
 * @param trajectories	array of trajectory objects
 */
function PlanResponse(trajectories, id){
    
    Message.call(this,"PlanResponse");

    this.trajectories = trajectories;
    this.scheduleid = id;
}

PlanResponse.prototype = Object.create( Message.prototype ); 

module.exports.PlanResponse = PlanResponse;

/*------LinkUpdate----------------------------*/
/*
 * The LinkUpdate constructor
 * @param id the scheduleid
 */
function LinkUpdate( id ){

    Message.call(this,"LinkUpdate");
    this.scheduleid = id;

}

LinkUpdate.prototype = Object.create( Message.prototype ); 

module.exports.LinkUpdate = LinkUpdate;

/*------ScheduleReply---------------------------*/
/*
 * The ScheduleReply constructor
 * @params schedule
 * schedule=0 is both move
 * schedule=1 is you stop
 * schedule=2 is i stop
 *
 *  schedule is an array of these int values in an order
 *  corresponding to the plan it was made for
 */
function ScheduleReply( schedule, collision, collisions, id ){

    Message.call(this,"ScheduleReply");

    this.collision = collision;    // The collision
    this.collisions = collisions; // All of the collisions
    this.schedule = schedule;     // The schedule
    this.scheduleid = id;         // An integer representing what schedule this is
}

ScheduleReply.prototype = Object.create( Message.prototype ); 

module.exports.ScheduleReply = ScheduleReply; 

/*------GrantPermission-------------------------*/
/*   
 *
 *
 */
function GrantPermission( trajectory ){
    
    Message.call(this,"GrantPermission");

    this.trajectory = trajectory;

}            

GrantPermission.prototype = Object.create( Message.prototype ); 

module.exports.GrantPermission = GrantPermission;

//--DeadLock Message Types--

/*------DeadlockProbe----------------------------*/
/*
 * @params originator
 * if you are the originator then there is a cycle
 * this is sent from waiter to permissionholder
 */
function DeadlockProbe(originator){
    
    Message.call(this,"DeadlockProbe");

    this.originator = originator;
}

DeadlockProbe.prototype = Object.create( Message.prototype ); 

module.exports.DeadlockProbe = DeadlockProbe; 

/*----RollChange------------------------------------*/
/*To determine an edge whose direction can be changed
 * and to actually change the direction, a change message is
 * sent around the circle. When a robot receives a change
 * message, it asks the coordinator of its outgoing edge,
 * which belongs to the circle, to change the direction of the
 * edge. If the coordinator is able to change the direction, the
 * deadlock resolution was successful and is therefore termi-
 * nated, i.e. the change message is discarded. If the change
 * message travels around the whole circle, no edge direction
 * could be changed and the second step of the deadlock res-
 * olution*/

/*
 * @params originator
 * if you are the originator then deadlock resolution failed
 */
function RollChange(originator){

    Message.call(this,"RollChange");

    this.originator = originator;
}

RollChange.prototype = Object.create( Message.prototype ); 

module.exports.RollChange = RollChange;

