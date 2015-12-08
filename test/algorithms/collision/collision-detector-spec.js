// Require an assersion library
var expect   = require('chai').expect,
    Detector = require('../../../lib/algorithms/collision/collision-detector.js');

describe("CollisionDetector", function() {
      
  describe("positionCheck", function() { 

        var detector;
        var seg1, seg2, seg3, seg4; 
        var collision;

        // Define anything you need for the tests here
        before( function() { 
            detector = new Detector();
            seg1  =  { start: { lat: 10, lon: 10 } , end : { lat: 272, lon: 164 } }; 
            seg2  =  { start: { lat: 390, lon: 10 } , end: { lat: 178, lon: 191 } };
            //var seg2  =  { startX: 272, startY: 164, endX: 160, endY: 240 }; 
            //var line3 =  { startX: 178, startY: 191, endX: 300, endY: 240 }; 
        });

        // Define anything you need to happen before each test here 
        beforeEach( function() {
            collision = { isect1: {}, isect2: {} };
        });

        it("should return true", function(done) {
            expect( detector.positionCheck( seg1, seg2, collision ) ).to.equal( true ); 
            done(); 
        });

        it("should intersect at x = 235... y = 142...", function(done) {
            detector.positionCheck( seg1, seg2, collision );
            expect( collision.isect1.lat ).to.equal( 235.05757462220558 );
            expect( collision.isect1.lon ).to.equal( 142.2857499687773  );
            expect( collision.isect1.lat ).to.equal( collision.isect2.lat );
            expect( collision.isect1.lon ).to.equal( collision.isect2.lon );
            done(); 
        });

    });

});

