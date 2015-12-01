/*-----------------------------Imports-------------------------------*/
var Messages = require('./messages.js'); // Include the messages file 
var Message  = Messages.Message;         // Convienence so we dont have
                                         // to type Messages.Message 
var checkType = Messages.checkType;      // Method for checking type


/*----------------------------Constants------------------------------*/
const LOG = false;


/*---------------------------MessangeTypes---------------------------*/

/*------PlanRequest-----------------------------*/
/**
 * The PlanRequest constructor
 * @param sender	address of sender of request
 * @param recipient	address of recipient of request
 * @param segments	amount of segments requested
 */
function PlanRequest(segments){
    
    Message.call(this,"PlanRequest");

    this.segments = segments || 3;//<-should put that 3 in a config file   
}

/*------PlanResponse----------------------------*/
/*
 * The PlanResponse constructor
 * @param trajectories	array of trajectory objects
 */
function PlanResponse(trajectories){
    
    Message.call(this,"PlanResponse");

    this.trajectories = trajectories;
}

/*------ScheduleReply---------------------------*/
/*
 * The ScheduleReply constructor
 * @params schedule
 * schedule=0 is both move
 * schedule=1 is you stop
 * schedule=2 is i stop
 */
function ScheduleReply(schedule){

    Message.call(this,"ScheduleReply");

    this.schedule = schedule;
}

/*------GrantPermission-------------------------*/
/*  
 */
function GrantPermission(){
    
    Message.call(this,"GrantPermission");
}                                                  

//--DeadLock Message Types--

/*------DeadlockProbe----------------------------*/
/*
 * @params originator
 * if you are the originator then there is a cycle
 */
function DeadlockProbe(originator){
    
    Message.call(this,"DeadlockProbe");

    this.originator = originator;
}


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



/*--------------------------BABE--------------------------*/

/**
 * The babe constructor
 * @param ass   a rating from 1-10
 * @param boobs a rating from 1-10
 * @param legs  a rating from 1-10
 */
function BABE( ass, boobs, legs ) {

    // Call super constructor
    Message.call( this, "babe" ); 

    // Set variables 
    this.ass    = ass; 
    this.boobs  = boobs; 
    this.legs   = legs; 
}

/**
 * Extend Message
 */
BABE.prototype = Object.create( Message.prototype ); 

/**
 * Override the validate function to perform specific checks
 * Note: this is is static function ( there is no .prototype )
 * Note: you really dont have to ovveride this. Its just an example
 */
BABE.validate = function( message ) { 

    // Call super to validate keys
    Message.validate( new BABE(), message )

    // ass should be number
    checkType( 'ass', message.lat, 'number' );

    // boobs should be number
    checkType( 'boobs', message.lon, 'number' );

    // legs should be number
    checkType( 'legs', message.alt, 'number' );

}

// Export this message
module.exports.BABE = BABE;


/*--------------------------MATTSMOM------------------------*/
