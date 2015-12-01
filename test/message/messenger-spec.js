// Require an assersion library
var expect    = require('chai').expect,
    Messages = require('../../lib/message/messages.js'), 
    Messenger = require('../../lib/message/messenger.js');

describe("Messenger", function() {
      
  describe("mail()", function() { 

        // Create sender and reciver
        var sender = new Messenger( );
        var reciever = new Messenger( );

        // Create a hia messag 
        var hia = new Messages.HIA(2,3,4);
        // Create an envelope
        var envelope = new Messages.Envelope( true, "sender" );
        // Stuff the hia into the evelope
        envelope.stuff( hia );
            
        it("Sender should send evelope and reciever should recieve it", function(done) {
            
            reciever.on( "hia", function( msg ) { 
                //console.log( JSON.stringify( msg ) );
                expect( JSON.stringify( hia ) ).to.equal( '{"type":"hia","lat":2,"lon":3,"alt":4}' ); 
                done(); 
            });

            sender.mail( envelope );
        });

        after( function() { 
            sender.close();
            reciever.close(); 
        });

    });
});












/*try { 
    hia.validate( JSON.parse('{ "type": "hia", "lat": 7, "lon": 6, "alt": 1 }') );
    hia.validate( JSON.parse('{ "type": "hia", "lat": 7, "lon": 6, "alt": "hi" }') );
} catch( e ) { 
    console.log( e.message );
}

try { 
} catch( e ) { 
    console.log( e.message );
}


console.log(hia);*/
