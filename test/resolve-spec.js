
var expect = require('chai').expect;

describe("Resolve", function() {

  describe("resolve()", function() { 
      var Resolver = require('../lib/resolve.js');
      var fs = require('fs');
      var file;

      beforeEach( function() {
        // Specify before logic here
        //file = fs.createReadStream("test/sample_input/sample_6n.movements");
        file = fs.createReadStream("test/sample_input/sample_10n.movements");
        //file = fs.createReadStream("test/sample_input/sample_2ntiny.movements");
        //file = fs.createReadStream("test/sample_input/sample_2n_2.movements");
        //file = fs.createReadStream("test/sample_input/simulation2015121510.movements");
      });

      it("should create valid resolution ", function(done) {
        this.timeout(500000); 
        Resolver.resolve( file, 3, function( resolution ) { 
            //console.log(resolution);
            //expect(resolution.originalPlans.length).to.equal(2);
            //expect(resolution.resolutePlans.length).to.equal(2);
            //expect(resolution.nodes.length).to.equal(2);
            for( p of resolution.resolutePlans ) {
                console.log("\t", p.toBonString() );
            }
            done();
      });

    });
  });
});


