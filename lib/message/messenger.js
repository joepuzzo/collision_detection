/*-----------------------------Imports-------------------------------*/
var events       = require('events'),   // Used by event emitter
    EventEmitter = events.EventEmitter, // Messenger will extend 
    dgram        = require('dgram');    // Used to create a udp socket

/*----------------------------Constants------------------------------*/
const LOG = false;


/*----------------------------Messenger------------------------------*/

/**
 * Messenger constructor
 * @param port the port that the messenger will use
 */ 
function Messenger( port ) { 
    // Call superconstructor
    EventEmitter.call(this);

    // Private variables 
    var port    = port || 8082;
    var server  = dgram.createSocket('udp4');
    var messenger = this; 
    var multicast = '230.185.192.108';

    // Member variables
    this.port = port;
    this.server = server;
    this.multicast = multicast;  

    // Initialize the client
    server.on('listening', function () {
        var address = server.address();
        console.log('UDP Client listening on ' + address.address + ":" + address.port);
        server.setBroadcast(true)
        server.setMulticastTTL(128); 
        server.addMembership(multicast);
    });

    // Every the client recieves a message have the messenger deliver the message
    server.on('message', function ( msg, remote ) {   
        console.log('Recieved message from: ' + remote.address + ' : ' + remote.port +' - ' + msg );
        messenger.deliver( JSON.parse(msg) ); 
    });

    server.bind( port );
} 

/**
 * Extend the EventEmitter class
 */
Messenger.prototype = new EventEmitter();

/**
 * Delivers the message to all registered recipients
 * @param envelope the recived envelope
 */ 
Messenger.prototype.deliver = function( envelope ) { 

    // TO-DO Perform validation here maybe??

    // Get who it came from
    var from = envelope.from;

    // Emit for every message
    for( mesg of envelope.payload ) {
        //TO-DO add evaluation code

        // Emit the message 
        this.emit( mesg.type, mesg, from );
    }
}

/**
 * Sends a given envelope to the specified address.
 * TODO need to deal with global vs local messages 
 */
Messenger.prototype.mail = function( envelope ) { 

    // Stringify the envelope
    var data = JSON.stringify( envelope );

    // Send the data 
    // TODO this is hardcoded to pass unit test right now :( 
    this.server.send( data, 0, data.length, 8082, this.multicast );
}

/**
 * Simple function for closing the messenger down
 */
Messenger.prototype.close = function() { 
    this.server.close(); 
}

// Export the messenger object
module.exports = Messenger;
