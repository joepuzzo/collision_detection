/*-----------------------------Imports-------------------------------*/
var events       = require('events'),   // Used by event emitter
    EventEmitter = events.EventEmitter, // Messenger will extend 
    dgram        = require('dgram'),    // Used to create a udp socket
    Messages     = require('./Messages');

var Envelope     = Messages.Envelope; 

/*----------------------------Constants------------------------------*/
const LOG = false;


/*----------------------------Messenger------------------------------*/

/**
 * Messenger constructor
 * @param port the port that the messenger will use
 */ 
function Messenger( id, port ) { 
    // Call superconstructor
    EventEmitter.call(this);

    // Private variables 
    var port    = port || 8082;
    // Note, we need to set reuseAddr for testing purposes. 
    var server  = dgram.createSocket( { type: 'udp4', reuseAddr: true } );
    var messenger = this; 
    var multicast = '230.185.192.108';

    // Member variables
    this.port = port;
    this.server = server;
    this.multicast = multicast;  
    this.id = id;

    // Initialize the client
    server.on('listening', function () {
        var address = server.address();
        if(LOG){console.log('UDP Client listening on ' + address.address + ":" + address.port); }
        server.setBroadcast(true)
        server.setMulticastTTL(128); 
        server.addMembership(multicast);
    });
 
    // Every the client recieves a message have the messenger deliver the message
    server.on('message', function ( msg, remote ) {   
        if( LOG ) { console.log('Recieved message from: ' + remote.address + ' : ' + remote.port +' - ' + msg ); }
        messenger.deliver( JSON.parse(msg), remote ); 
    });

    // Bind the socket, this will cause a listening event to get emitted.
    server.bind( port );
} 

/**
 * Extend the EventEmitter class
 */
Messenger.prototype = new EventEmitter();


/*-------------------------Deliver-------------------------*/
/**
 * Delivers the message to all registered recipients
 * @param envelope the recived envelope
 * @param 
 */ 
Messenger.prototype.deliver = function( envelope, rinfo ) { 

    // TO-DO Perform validation here maybe??

    // Fill in the envelopes from information 
    envelope.from.port = rinfo.port;
    envelope.from.address = rinfo.address;

    // Check the to field and discard if we dont care about it
    if( ( !envelope.local && envelope.to.id !== this.id ) || envelope.from.id === this.id ) {
        return;
    }

    // Emit for every message
    for( mesg of envelope.payload ) {
        //TO-DO add evaluation code

        // Emit the message 
        this.emit( mesg.type, mesg, envelope.from );
    }
}


/*--------------------------Mail---------------------------*/
/**
 * Sends a given envelope based on the contents of the envelope.
 * @param envelope the envelope to send
 */
Messenger.prototype.mail = function( envelope ) { 

    // Stringify the envelope
    var data = JSON.stringify( envelope );
    
    // Use the server to send the envelope
    this.server.send( data, 0, data.length, envelope.to.port, envelope.to.address );
}


/*-----------------------SendLocal-------------------------*/

/**
 * Sends a local multicast envelope with the given payload
 * @param payload and array of messages.
 */
Messenger.prototype.sendLocal = function( payload ) {  
    
    // Temp reference to ourselves   
    var my  = this;

    var envelope = new Envelope( { 
        local: true, 
        from: { 
            id: my.id
        },
        to: { 
            id: "all", 
            port: my.port,
            address: my.multicast
        }, 
        payload: payload
    });

    this.mail( envelope );
}

/**
 * Sends a global unicast envelope with the given payload
 * @param payload and array of messages
 * @param recipient the recipient of the message in the form { id, port, address }
 */
Messenger.prototype.sendGlobal = function( payload, recipient ) {
    
    // Temp reference to ourselves
    var my = this;

    var envelope = new Envelope( { 
        local: false, 
        from: { 
            id: my.id
        },
        to: {
            id: recipient.id, 
            port: recipient.port || my.port, 
            address: recipient.address
        }, 
        payload: payload
    }); 

    this.mail( envelope );
}


/*--------------------------Close--------------------------*/
/**
 * Simple function for closing the messenger down
 */
Messenger.prototype.close = function() { 

    this.server.close(); 
}


/*Messenger.prototype.getAddress = function() { 
    return this.server.address();
}*/


// Export the messenger object
module.exports = Messenger;
