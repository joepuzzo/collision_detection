// Require an assersion library
var expect    = require('chai').expect,
    Messages = require('../../lib/message/messages.js'),
    Messenger = require('../../lib/message/messenger.js');

describe("Messenger", function() {

  describe("mail()", function() {

        // Variables for testing
        var sender, reciever, notreciever, hia;

        // Create sender and reciver
        beforeEach( function() {
            sender = new Messenger( "A" );
            reciever = new Messenger( "B" );
            notreciever = new Messenger( "C" );

            // Create a hia messag
            hia = new Messages.HIA(2,3,4);
        });

        afterEach( function(){
            sender.close();
            reciever.close();
            notreciever.close();
        });

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

        describe('--ack--', function() {

          var marco1, marco2;

          beforeEach( function() {
            marco1 = new Messages.MARCO();
            marco2 = new Messages.MARCO();
          });

          it ('should recieve an ack packet in response to marco', function(done) {
            sender.once( 'ack' + marco1.ack, function( msg, from ) {
                expect(from.id).to.equal('B');
                done();
            });


            sender.sendLocal([marco1], {id: 'B'});
           });

          it('should discern multiple ack packets', function(done) {
            var i = 0;
            sender.once('ack' + marco1.ack, function( msg, from ) {
              expect(from.id).to.equal('B');
              i++;
              if ( i === 2 ) done();
            });
            sender.once('ack' + marco2.ack, function( msg, from ) {
              expect(from.id).to.equal('C');
              i++;
              if ( i === 2 ) done();
            });


            sender.sendLocal([marco1], {id: 'B'});
            sender.sendLocal([marco2], {id: 'C'});
          });

          it('should be able to recieve multiple acks from same reciever', function(done) {
            var i = 0;
            sender.once('ack' + marco1.ack, function( msg, from ) {
              expect(from.id).to.equal('B');
              i++;
              if ( i === 2 ) done();
            });
            sender.once('ack' + marco2.ack, function( msg, from ) {
              expect(from.id).to.equal('B');
              i++;
              if ( i === 2 ) done();
            });


            sender.sendLocal([marco1], {id: 'B'});
            sender.sendLocal([marco2], {id: 'B'});
          });




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
