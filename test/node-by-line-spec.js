// Require an assersion library
var expect = require('chai').expect;

describe("Parser", function() {
      
  describe("#parse()", function() { 

        var Parser = require('../lib/node-by-line.js');
        var fs = require('fs');
        var file;

        beforeEach( function() {
            // Specify before logic here
            file = fs.createReadStream("test/sample_input/sample_4n.movements");
        });

        it("should have a plan of length 4", function(done) {
            Parser.parse( file, function( plans ) { 
                expect(plans.length).to.equal(4);
                //console.log(plans);
                done();
            });
        });

        it("should match trajectory", function(done) {
            Parser.parse( file, function( plans ) { 
                //console.log(plans[0]);
                var expected = { 
                    lat: 540.2386533559924,
                    lon: 487.0205028050389,
                    time: 60,
                    velocity: 1.3300216021474496 
                };
                var actual = plans[0].trajectories[2];
                // Check to see if the trajectory matches  
                expect( actual.lat ).to.equal( expected.lat );
                expect( actual.lon ).to.equal( expected.lon );
                expect( actual.time ).to.equal( expected.time );
                expect( actual.velocity ).to.equal( expected.velocity );
                done();
            });
        });

    });
});

