
var expect = require('chai').expect;

describe("Resolve", function() {

  describe("resolve()", function() { 
      var Resolver = require('../lib/resolve.js');
      var fs = require('fs');
      var file;

      beforeEach( function() {
        // Specify before logic here
        file = fs.createReadStream("test/sample_input/sample_4n.movements");
      });

      it("should create valid resolution ", function(done) {
        Resolver.resolve( file, function( resolution ) { 
            //console.log(resolution);
            expect(resolution.originalPlans.length).to.equal(4);
            //expect(resolution.resolutePlan.length).toEqual(4);
            expect(resolution.nodes.length).to.equal(4);
            done();
      });

    });
  });
});


