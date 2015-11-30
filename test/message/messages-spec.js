// Require an assersion library
var expect   = require('chai').expect,
    Messages = require('../../lib/message/messages.js');

describe("Message", function() {
      
  describe("#hia", function() { 

        var hia;
            
        beforeEach( function() {
            hia = new Messages.HIA(2,3,4);
        });

        it("should eqal the test message", function(done) {
            expect( JSON.stringify( hia) ).to.equal( '{"type":"hia","lat":2,"lon":3,"alt":4}' ); 
            done(); 
        });

        it("should throw an error due to incorrect type", function(done) {

            var f = function() { 
                Messages.HIA.validate( JSON.parse('{ "type": "hia", "lat": 7, "lon": 6, "alt": "hi" }') ); 
            }
            expect( f ).to.throw(TypeError);
            done(); 

        });

        it("should throw an error due to missing data", function(done) {

            var f = function() { 
                Messages.HIA.validate( JSON.parse('{ "type": "hia", "lat": 7, "lon": 6 }') );
            }
            expect( f ).to.throw(Error);
            done(); 

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
