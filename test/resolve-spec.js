
var expect = require('chai').expect;

describe("Resolve", function() {

  describe("resolve()", function() { 
      var Resolver = require('../lib/resolve.js');
      var fs = require('fs');
      var file;

      beforeEach( function() {
        // Specify before logic here
        file = fs.createReadStream("test/sample_input/sample_2ntiny.movements");
      });

      it("should create valid resolution ", function(done) {
        this.timeout(130000); 
        Resolver.resolve( file, function( resolution ) { 
            //console.log(resolution);
            expect(resolution.originalPlans.length).to.equal(2);
            expect(resolution.resolutePlan.length).toEqual(2);
            expect(resolution.nodes.length).to.equal(2);
            for( p of resolution.resolutePlan ) {
                console.log("\t", p.toBonString() );
            }
            done();
      });

    });
  });
});


