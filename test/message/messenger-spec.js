// Require an assersion library
var expect    = require('chai').expect,
    Messages = require('../../lib/message/messages.js'), 
    Messenger = require('../../lib/message/messenger.js');

describe("Messenger", function() {
      
  describe("mail()", function() { 

        // Variables for testing
        var sender, reciever, notreciever; 

        // Create sender and reciver
        beforeEach( function() { 
            sender = new Messenger( "A" );
            reciever = new Messenger( "B" );
            notreciever = new Messenger( "C" );
        });

        afterEach( function(){
            sender.close();
            reciever.close(); 
            notreciever.close();
        });

        // Create a hia messag 
        var hia = new Messages.HIA(2,3,4);

        this.timeout(5000); 
            
        it("Sender should send evelope and reciever should recieve it", function(done) {
            
            reciever.once( "hia", function( msg, from ) { 
                expect( JSON.stringify( msg ) ).to.equal( '{"type":"hia","ack":false,"lat":2,"lon":3,"alt":4}' ); 
                done();
            });

            sender.sendLocal( [hia] );
        });

        it("A should send evelope and B should revieve it", function(done) {

            reciever.once( "hia", function( msg, from ) {
                expect( JSON.stringify( msg ) ).to.equal( '{"type":"hia","ack":false,"lat":2,"lon":3,"alt":4}' );
            });
		
	        notreciever.once( "hia", function( msg, from ) {
                expect( JSON.stringify( msg ) ).to.not.equal( '{"type":"hia","ack":false,lat":2,"lon":3,"alt":4}' );
            });
		
            sender.sendLocal( [hia], {id: "B"} );

            setTimeout(function(){ done(); }, 2000);
        });

        it("A should send evelope and both B and C should revieve it", function(done) {

            reciever.once( "hia", function( msg, from ) {
                expect( JSON.stringify( msg ) ).to.equal( '{"type":"hia","ack":false,"lat":2,"lon":3,"alt":4}' );
            });
		
	        notreciever.once( "hia", function( msg, from ) {
                expect( JSON.stringify( msg ) ).to.equal( '{"type":"hia","ack":false,"lat":2,"lon":3,"alt":4}' );
            });

            sender.once( "hia", function( msg, from ) {
                expect( JSON.stringify( msg ) ).to.not.equal( '{"type":"hia","ack":false,"lat":2,"lon":3,"alt":4}' );
            });
		
            sender.sendLocal( [hia] );
 
            setTimeout(function(){ done(); }, 2000);
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
