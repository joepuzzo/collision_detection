// Require an assersion library
var expect   = require('chai').expect,
    Detector = require('../../../lib/algorithms/collision/collision-detector.js'), 
    Planner   = require('../../../lib/planner.js'); // Plans and Trajectories

describe("CollisionDetector", function() {
      
  describe("positionCheck", function() { 

        var detector;
        var seg1, seg2, seg3, seg4, line1, line2; 
        var collision;

        // Define anything you need for the tests here
        before( function() { 
            detector = new Detector();
            seg1  =  { start: { lat: 10, lon: 10, alt: 50 } , end : { lat: 272, lon: 164, alt: 50 } }; 
            seg2  =  { start: { lat: 390, lon: 10, alt: 50 } , end: { lat: 178, lon: 191, alt: 50 } };
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

        it("should intersect on both lines at x = 235... y = 142...", function(done) {
            detector.positionCheck( seg1, seg2, collision );
            expect( collision.isect1.lat ).to.equal( 235.05757462220564 );
            expect( Math.round( collision.isect1.lon ) ).to.equal( 142 );
            expect( collision.isect1.lat ).to.equal( collision.isect2.lat );
            expect( Math.round( collision.isect1.lon ) ).to.equal( Math.round( collision.isect2.lon ) );
            done(); 
        });

        it("should intersect on line2 at x = 221... y = 153...", function(done) {
            line1  =  { start: { lat: 10, lon: 10, alt: 50 } , end : { lat: 172, lon: 159, alt: 50 } }; 
            line2  =  { start: { lat: 390, lon: 10, alt: 50 } , end : { lat: 178, lon: 191, alt: 50 } }; 
            detector.positionCheck( line1, line2, collision );
            expect( collision.isect1.lat ).to.equal( line1.end.lat );
            expect( collision.isect1.lon ).to.equal( line1.end.lon );
            expect( collision.isect2.lat ).to.equal( 192.93153833524875 );
            expect( collision.isect2.lon ).to.equal( 178.2518469873584 );
            done(); 
        });

        it("should intersect on line1 at x = 143... y = 132...", function(done) {
            line1  =  { start: { lat: 10, lon: 10, alt: 50 } , end : { lat: 172, lon: 159, alt: 50 } }; 
            line2  =  { start: { lat: 390, lon: 10, alt: 50 } , end : { lat: 165, lon: 122, alt: 50 } }; 
            detector.positionCheck( line1, line2, collision );
            expect( collision.isect1.lat ).to.equal( 143.4401672182547 );
            expect( collision.isect1.lon ).to.equal( 132.7320056513577 );
            expect( collision.isect2.lat ).to.equal( line2.end.lat );
            expect( collision.isect2.lon ).to.equal( line2.end.lon );
            done(); 
        });

        it("should return a projected intersection", function(done) {
            line1  =  { start: { lat: 10, lon: 10, alt: 50 } , end : { lat: 172, lon: 132, alt: 50 } }; 
            line2  =  { start: { lat: 390, lon: 10, alt: 50 } , end : { lat: 200, lon: 134, alt: 50 } }; 
            detector.positionCheck( line1, line2, collision );
            expect( collision.isect1.lat ).to.equal( line1.end.lat );
            expect( collision.isect1.lon ).to.equal( line1.end.lon );
            expect( collision.isect2.lat ).to.equal( line2.end.lat );
            expect( collision.isect2.lon ).to.equal( line2.end.lon );
            done(); 
        });
    });

    describe("timeCheck", function() { 

        var detector;
        var seg1, seg2, seg3, seg4, line1, line2; 
        var collision;

        // Define anything you need for the tests here
        before( function() { 
            detector = new Detector();
            seg1  =  { start: { lat: 10, lon: 10, alt: 50, time: 0 } , end : { lat: 272, lon: 164, alt: 50, time: 60 } }; 
            seg2  =  { start: { lat: 390, lon: 10, alt: 50, time: 0  } , end: { lat: 178, lon: 191, alt: 50, time: 90 } };
        });

        // Define anything you need to happen before each test here 
        beforeEach( function() {
            collision = { isect1: {}, isect2: {} };
        });

        it("should return true", function(done) {
            expect( detector.positionCheck( seg1, seg2, collision ) ).to.equal( true ); 
            expect( detector.timeCheck( seg1, seg2, collision ) ).to.equal( true ); 
            expect( collision.timediff ).to.equal( 9.587180666007804 ); 
            done(); 
        });

        it("should return false", function(done) {
            seg1.start.time = 100;
            seg1.end.time = 160;
            expect( detector.positionCheck( seg1, seg2, collision ) ).to.equal( true ); 
            expect( detector.timeCheck( seg1, seg2, collision ) ).to.equal( false ); 
            //expect( collision.timediff ).to.equal( ); 
            done(); 
        });


    });


    describe("checkCollision", function() { 

        var detector;
        var trajA1, trajA2, trajB1, trajB2, plan1, plan2; 
        var collision;

        // Define anything you need for the tests here
        before( function() { 
            detector = new Detector();
            trajA1 = { lat: 10,  lon: 10,  alt: 50, time: 0 };
            trajA2 = { lat: 272, lon: 164, alt: 50, time: 60 }; 
            trajB1 = { lat: 390, lon: 10,  alt: 50, time: 0  };
            trajB2 = { lat: 178, lon: 191, alt: 50, time: 90 };
            plan1 = Planner.makePlan( [ trajA1, trajA2 ] );
            plan2 = Planner.makePlan( [ trajB1, trajB2 ] );
        });

        // Define anything you need to happen before each test here 
        beforeEach( function() {
            collision = { isect1: {}, isect2: {} };
        });

        it("should return true", function(done) {
            expect( detector.checkCollision( plan1, plan2 ).length ).to.equal( 1 ); 
            done(); 
        });

        it("should return false", function(done) {
            trajA1.time = 100;
            trajA2.time = 160;
            expect( detector.checkCollision( plan1, plan2 ).length ).to.equal( 0 ); 
            done(); 
        });


    });


});

