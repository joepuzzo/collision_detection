// Require an assersion library
var expect   = require('chai').expect,
    LineUtils = require('../../lib/utils/line.js');

describe("LineUtils", function() {
      
    describe("Line3D", function() { 

        // Define anything you need for the tests here
        before( function() { 
            var line1, line2;
        });

        // Define anything you need to happen before each test here 
        beforeEach( function() {
        });

        it("should work on same x same z", function(done) {
            // Create a line
            var d = LineUtils.distance3D( 50, 50, 50, 50, 100, 50 );
            expect( d ).to.equal( 50 );
            done();
        });

        it("should work on same y same z", function(done) {
            // Create a line
            var d = LineUtils.distance3D( 50, 50, 50, 100, 50, 50 );
            expect( d ).to.equal( 50 );
            done();
        });

    });


});

