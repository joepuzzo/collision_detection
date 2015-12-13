
var expect = require('chai').expect;

// Convinience function for sleeping
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

describe("FakeGPS", function() {

  describe("getLocation()", function() { 

    var Parser = require('../lib/node-by-line.js'),
        FakeGPS = require('../lib/fake-gps.js');
    var fs = require('fs');
    var file;

    beforeEach( function() {
        // Specify before logic here
    });

    
    it("should return the only trajectory in the plan", function(done) {
        this.timeout(12000); 
        file = fs.createReadStream("test/sample_input/single_trajectory.movements");
        Parser.parse( file, function( plans ) {
            // Make sure we parsed correctly 
            expect(plans.length).to.equal(1);
            // Get the plan out
            var plan = plans[0];
            // Create a new fake gps
            var gps = new FakeGPS( plan );
            // Get the location every second for about 60 seconds
            for( i = 0; i < 10; i++) { 
                console.log("\t%s", JSON.stringify( gps.getLocation() ) );
                sleep( 1000 );
            }
            done();
        });
    });

    it("should return trajectory one for 5 seconds then trajectory 2 for the rest", function(done) {
        this.timeout(12000); 
        file = fs.createReadStream("test/sample_input/double_trajectory.movements");
        Parser.parse( file, function( plans ) {
            // Make sure we parsed correctly 
            expect(plans.length).to.equal(1);
            // Get the plan out
            var plan = plans[0];
            // Create a new fake gps
            var gps = new FakeGPS( plan );
            // Get the location every second for about 60 seconds
            for( i = 0; i < 10; i++) { 
                console.log("\t%s", JSON.stringify( gps.getLocation() ) );
                sleep( 1000 );
            }
            done();
        });
    });


    it("should get a location between the first two trajetories", function(done) {
        this.timeout(24000); 
        file = fs.createReadStream("test/sample_input/tiny1.movements");
        Parser.parse( file, function( plans ) {
            // Make sure we parsed correctly 
            expect(plans.length).to.equal(1);
            // Get the plan out
            var plan = plans[0];
            // Create a new fake gps
            var gps = new FakeGPS( plan );
            // Get the location every second for about 60 seconds
            for( i = 0; i < 22; i++) { 
                console.log("\t%s", JSON.stringify( gps.getLocation() ) );
                sleep( 1000 );
            }
            done();
        });
    });

    it("should pause for 5 seconds, i.e return the same location for 5 seconds then continue on", function(done) {
        this.timeout(32000); 
        file = fs.createReadStream("test/sample_input/tiny1.movements");
        Parser.parse( file, function( plans ) {
            // Make sure we parsed correctly 
            expect(plans.length).to.equal(1);
            // Get the plan out
            var plan = plans[0];
            // Create a new fake gps
            var gps = new FakeGPS( plan );
            // Get the location every second for about 60 seconds
            for( i = 0; i < 30; i++) { 
                // If we have iterated 5 times pause the gps
                if( i === 5 ) { 
                    gps.pause();
                }
                // When we have itterated 5 more times unpause the gps
                if( i === 10 ) { 
                    gps.unpause(); 
                }
                console.log("\t%s", JSON.stringify( gps.getLocation() ) );
                sleep( 1000 );
            }
            console.log( "\t", gps.newPlan.toBonString() );
            done();
        });
    });

    it("should pause for '5' seconds and should have a speed up of times 2", function(done) {
        this.timeout(30000); 
        file = fs.createReadStream("test/sample_input/tiny1.movements");
        Parser.parse( file, function( plans ) {
            // Make sure we parsed correctly 
            expect(plans.length).to.equal(1);
            // Get the plan out
            var plan = plans[0];
            // Create a new fake gps
            var gps = new FakeGPS( plan, 3 );
            // Get the location every second for about 60 seconds
            for( i = 0; i < 22; i++) { 
                // If we have iterated 5 times pause the gps
                if( i === 5 ) { 
                    gps.pause();
                }
                // When we have itterated 5 more times unpause the gps
                if( i === 10 ) { 
                    gps.unpause(); 
                }
                console.log("\t%s", JSON.stringify( gps.getLocation() ) );
                sleep( 1000 / 3 );
            }
            done();
        });
    });

  });
});


