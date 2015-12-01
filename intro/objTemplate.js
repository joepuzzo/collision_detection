// This file can be used as a template for new files

/**
 * The Shoe constructor. 
 */
function Shoe( size, color, loc ) { 
    this.size  = 9;
    this.color = color;
    this.loc   = loc || "store"; 
}

/**
 * Puts the shoes on and prints the color 
 */
Shoe.prototype.putOn = function() { 
    console.log("Shoe's on my " + this.color + " shoes!"); 
}
 
/**
 * Boot will extend shoe. Fist we define his constructor.
 */
function Boot( size, wproof ) { 

    // Call the super constructor
    Shoe.call( this, size, "brown" ); 

    // Boot's member variables  
    this.waterProof = wproof;
}

/**
 * Extend Shoe
 */
Boot.prototype = Object.create( Shoe.prototype );


// Export Boot and Shoe
module.exports.Boot = Boot;
module.exports.Shoe = Shoe;

