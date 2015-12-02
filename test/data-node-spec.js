// Require an assersion library
var expect    = require('chai').expect,
    DataNode  = require('../lib/data-node.js'),
    FakeGPS = require('../lib/fake-gps.js');

describe("DataNode", function() {

  // Parse in a file with plans
  var Parser = require('../lib/node-by-line.js');
  var fs = require('fs');
  var file = fs.createReadStream("test/sample_input/sample_4n.movements");
  var plans; 

  Parser.parse( file, function( pls ) { 
       // We are done parsing so run the tests 
       plans = pls;
       //run(); 
  });

  describe("Advertisments", function() { 
        
        var nodeA, nodeB;

        before( function() { 
            nodeA = new DataNode( { id: "A",
                                    gps: new FakeGPS( plans[0] )
                                  });
            nodeB = new DataNode( { id: "B",
                                    gps: new FakeGPS( plans[1] )
                                  });
        });
            
        it("NodeA should recieve a HIA from NodeB", function(done) {

            this.timeout(4000); 
            nodeA.messenger.once( "hia", function( msg, from ) { 
                //console.log( JSON.stringify( from ) );
                expect( from.id ).to.equal( "B" ); 
                done(); 
            });
        });


        it("NodeB should recieve a HIA from NodeA", function(done) {

            this.timeout(4000); 
            nodeB.messenger.once( "hia", function( msg, from ) { 
                //console.log( JSON.stringify( from ) );
                expect( from.id ).to.equal( "A" ); 
                done(); 
            });
        });


        after( function() { 
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
