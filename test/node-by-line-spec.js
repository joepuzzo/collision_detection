// Require an assersion library
var expect = require('chai').expect;

describe("Parser", function() {
      
  describe("parse()", function() { 

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

        it("should print a valid bon string", function(done) {
            Parser.parse( file, function( plans ) { 
                var result = "497.44342454950043 580.3218279583083 0 516.6325156299712 563.8245595306364 30 487.0205028050389 540.2386533559924 60 467.31874129172115 505.5413579392984 90 492.420618585815 512.0842226127156 120 505.6734493193039 504.1087614347996 150 508.90556520315397 547.042400516524 180 519.0034696015897 575.4012565090593 210 501.62958575967673 569.6760145608362 240 475.1948827348223 560.9492768589312 270 481.6370830791988 523.4414991619277 300 506.7190138588651 560.6662924971387 330 474.53281986110346 555.6339566410672 360 511.6862703852831 555.1957305925959 390 523.2507454809885 543.9899223399349 420 508.7520622702958 539.4049141118237 450 482.72478735659223 562.0138937637279 480 509.77232676972267 540.8278298748171 510 483.65647178522397 522.3087399292447 540 463.64866284252685 524.2182587985503 570 461.0715475572969 547.9032440578325 600"
                expect( plans[0].toBonString() ).to.equal( result );
                done();
            });
        });


    });
});

