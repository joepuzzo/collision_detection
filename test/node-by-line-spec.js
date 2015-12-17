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
                var result = "0 580.3218279583083 497.44342454950043 30 563.8245595306364 516.6325156299712 60 540.2386533559924 487.0205028050389 90 505.5413579392984 467.31874129172115 120 512.0842226127156 492.420618585815 150 504.1087614347996 505.6734493193039 180 547.042400516524 508.90556520315397 210 575.4012565090593 519.0034696015897 240 569.6760145608362 501.62958575967673 270 560.9492768589312 475.1948827348223 300 523.4414991619277 481.6370830791988 330 560.6662924971387 506.7190138588651 360 555.6339566410672 474.53281986110346 390 555.1957305925959 511.6862703852831 420 543.9899223399349 523.2507454809885 450 539.4049141118237 508.7520622702958 480 562.0138937637279 482.72478735659223 510 540.8278298748171 509.77232676972267 540 522.3087399292447 483.65647178522397 570 524.2182587985503 463.64866284252685 600 547.9032440578325 461.0715475572969"
                expect( plans[0].toBonString() ).to.equal( result );
                done();
            });
        });


    });
});

