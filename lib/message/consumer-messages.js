/*-----------------Imports--------------------------*/
var Message = require('./messages.js').Message;

/*-----------------Constants------------------------*/
const LOG = false;

/*-----------------Message_Types--------------------*/


//*****************Drop_Off_Advertisement************//
/**
 * A solicitation for the recieving node.
 */
//***************************************************//

function DropOffAdvertisement() {
  Message.call(this, 'dropOffAdv');
}

module.exports.DropOffAdvertisement = DropOffAdvertisement;