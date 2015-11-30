// Require an assersion library
var expect   = require('chai').expect,
    CollisionMessages = require('../../lib/message/collision-messages.js');

describe("CollisionMessages", function() {
      
  describe("BABE", function() { 

        // Define anything you need for the tests here
        var babe = new CollisionMessages.BABE(10,6,10);

        // Define anything you need to happen before each test here 
        beforeEach( function() {
            console.log( "EXAMPLE!");
        });

        it("should eqal the test message", function(done) {
            expect( JSON.stringify( babe ) ).to.equal( '{"type":"babe","ass":10,"boobs":6,"legs":10}' ); 
            done(); 
        });

        it("should throw an error due to incorrect type", function(done) {

            var f = function() { 
                CollisionMessages.BABE.validate( JSON.parse('{ "type": "babe", "ass": 10, "boobs": "wow", "legs": 10 }') ); 
            }
            expect( f ).to.throw(TypeError);
            done(); 

        });

        it("should throw an error due to missing data", function(done) {

            var f = function() { 
                Messages.HIA.validate( JSON.parse('{ "type": "babe", "ass": 10, "boobs": 6 }') );
            }
            expect( f ).to.throw(Error);
            done(); 

        });

    });

    /* YOUR TEST GOES HERE
    describe("MESSAGENAME", function() { 

    });
    */
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
