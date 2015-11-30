/*-----------------------------Imports-------------------------------*/
var Messages = require('./messages.js'); // Include the messages file 
var Message  = Messages.Message;         // Convienence so we dont have
                                         // to type Messages.Message 
var checkType = Messages.checkType;      // Method for checking type


/*----------------------------Constants------------------------------*/
const LOG = false;


/*---------------------------MessangeTypes---------------------------*/


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
