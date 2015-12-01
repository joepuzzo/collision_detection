
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
        file = fs.createReadStream("test/sample_input/tiny1.movements");
    });

    it("should get a location between the first two trajetories", function(done) {
        Parser.parse( file, function( plans ) {
            // Make sure we parsed correctly 
            expect(plans.length).to.equal(1);
            // Get the plan out
            var plan = plans[0];
            // Create a new fake gps
            var gps = new FakeGPS( plan );
            // Get the location every second for about 60 seconds
            for( i = 0; i < 60; i++) { 
                console.log("\t%s", JSON.stringify( gps.getLocation() ) );
                sleep( 20 );
            }
            done();
        });
    });

  });
});


