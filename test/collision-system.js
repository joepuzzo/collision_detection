// Require an assersion library
var expect   = require('chai').expect,
    CollisionSystem = require('../lib/collision-system.js'),
    DataNode  = require('../lib/data-node.js'),
    FakeGPS = require('../lib/fake-gps.js');

describe("CollisionSystem", function() {
      
  var Parser = require('../lib/node-by-line.js');
  var fs = require('fs');
  var file = fs.createReadStream("test/sample_input/sample_4n.movements");
  var plans;
  Parser.parse( file, function( pls ) {
     // We are done parsing so run the tests
     plans = pls;
     //run();
   });

    describe("RollAssignments", function() { 
        var nodeA, nodeB;

        before( function() {
	     
            nodeA = new DataNode( { id: "A",
                                    gps: new FakeGPS( plans[2] )
                                  });
            nodeB = new DataNode( { id: "B",
                                    gps: new FakeGPS( plans[3] )
                                  });
        });

        it("NodeA should recieve a HIA from NodeB", function(done) {

            this.timeout(4000);
            nodeA.collisionSystem.messenger.once( "hia", function( msg, from ) {
                expect( from.id ).to.equal( "B" );
                done();
            });
        });



        it("NodeA should recieve a RollAssignment from NodeB", function(done) {

            this.timeout(40000);
            nodeA.collisionSystem.messenger.once( "RollAssignment", function( msg, from ) {
                expect( from.id ).to.equal( "B" );
                done();
            });
        });

        /*it("NodeB should recieve a RollAssignment from NodeA", function(done) {

            this.timeout(4000);
            nodeB.collisionSystem.messenger.once( "RollAssignment", function( msg, from ) {
                expect( from.id ).to.equal( "A" );
                done();
            });
        });*/



        it("NodeB should recieve a HIA from NodeA", function(done) {

            this.timeout(4000);
            nodeB.collisionSystem.messenger.once( "hia", function( msg, from ) {
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
