/*-----------------------------Imports-------------------------------*/


/*----------------------------Constants------------------------------*/
const LOG = false;


/*---------------------------CustomErrors----------------------------*/

/**
 * Error will be thrown when there are properties missing in a message
 * or envelope.
 * @param message an optional error message
 */
function UndefinedPropertyError( message ) {
    this.name = "UndefinedPropertyError";
    this.message = (message || "");
}

UndefinedPropertyError.prototype = Error.prototype;

module.exports.UdefinedPropertyError = UndefinedPropertyError;


/*-----------------------------Envelope------------------------------*/

/**
 * Envelope Constructor
 * @param local boolean value, true if it contains local data
 * @param from  the id info object of the sender
 * @param to    the id info object of the reciever
 * @param payload an optional parameter that can set the payload
 */
function Envelope( params ) {
    //console.log( "PARAMS", params.local ); 
    this.local   = params.local;
    this.date    = new Date();
    this.from    = params.from;
    this.to      = params.to; 
    this.payload = params.payload || []; 
}

/**
 * Static method that performs basic validation on an envelope
 * @param envelope the envelope to be checked
 * @throws Error if an invalid envelope is passed 
 */
Envelope.validate = function( envelope ) { 
    // TODO 
}

/**
 * Adds a messege to the envelope. 
 * @param message the message to "stuff" in the evelope.
 */
Envelope.prototype.stuff = function( message ) { 
    this.payload.push( message );
}

module.exports.Envelope = Envelope;


/*-----------------------------Message-------------------------------*/

/**
 * Message constructor
 * @param type the type of meesage
 */
function Message(type) { 
    this.type = type;
}

/**
 * Static method that perfroms basic message validation
 * @param type 
 * @throws UndefinedPropertyError if there is a missing property
 */
Message.validate = function( type, message ) {
    // Itterate through all of our properties and make
    // sure the message contains them
    var properties = Object.keys(type);
    for( p of properties ) { 
        if(LOG) { console.log(p); }
        if( message[p] === undefined ){ 
            throw new UndefinedPropertyError( type.type + ' is missing ' + p );
        }
    }
}

module.exports.Message = Message;


/*--------------------------HelperMethods----------------------------*/

/**
 * Helper function for cheking the type 
 * @throws TypeError if there is an invalid field
 */
function checkType( key, value, expected ){ 
    if( ( typeof value ) !== expected ) { 
        throw new TypeError( key +  " is of type " + typeof value + ", expected " + expected + "." );
    }
}

module.exports.checkType = checkType;


/*---------------------------MessangeTypes---------------------------*/


/*--------------------------HIA--------------------------*/

function HIA( lat, lon, alt ) {

    // Call super constructor
    Message.call( this, "hia" ); 

    // Set variables 
    this.lat  = lat; 
    this.lon  = lon; 
    this.alt  = alt; 
}

HIA.prototype = Object.create( Message.prototype ); 

// Ovveride the validate function to perform specific checks
HIA.validate = function( message ) { 

    // Call super to validate keys
    Message.validate( new HIA(), message )

    // lat should be number between x and y 
    checkType( 'lat', message.lat, 'number' );

    // lon should be number between x and y 
    checkType( 'lon', message.lon, 'number' );

    // lon should be number between x and y 
    checkType( 'alt', message.alt, 'number' );

}

// Export this message
module.exports.HIA = HIA;


/*--------------------------OMW--------------------------*/
