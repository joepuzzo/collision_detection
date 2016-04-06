/*-----------------Imports--------------------------*/
var Message = require('./messages.js').Message;

/*-----------------Constants------------------------*/
const LOG = false;

/*-----------------Message_Types--------------------*/


//*****************Drop_Off_Solicitation************//
/**
 * A solicitation for the recieving node.
 *
 * @param id
 *  - represents the recieving node's unique
 *  - identifier
 */
//**************************************************//

function DropOffSolicitation(id) {

  Message.call(this, 'dropOffSolicit');
  this.destinationId = id;

}

module.exports.DropOffSolicitation = DropOffSolicitation;



//*****************Drop_Off*************************//
/**
 * Designed to simulate a vendor delivery drop-off
 * packet.
 *
 * @param id
 *  - represents the recieving node's unique
 *  - identifier
 */
//**************************************************//

function DropOff(id) {

  Message.call(this, 'dropOff', { ack : true });
  this.destinationId = id;

}

module.exports.DropOff = DropOff;
