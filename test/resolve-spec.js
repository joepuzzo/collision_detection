
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
        this.timeout(200000); 
        Resolver.resolve( file, 1, function( resolution ) { 
            //console.log(resolution);
            expect(resolution.originalPlans.length).to.equal(2);
            expect(resolution.resolutePlans.length).to.equal(2);
            expect(resolution.nodes.length).to.equal(2);
            for( p of resolution.resolutePlans ) {
                console.log("\t", p.toBonString() );
            }
            done();
      });

    });
  });
});


