// This file shows the basics to OO Progrraming in JS

/**
 * This is the Shoe constructor. 
 *
 * All functions is JS are objects. The only difference between calling a function
 * and creating a new object is the presence of the "new" keyword. 
 * 
 * Call the Shoe function: 
 * var shoe = Shoe( 1, "green", "myhouse" )
 * undefined // Shoe has no return so shoe var is undefined
 *
 * Create a new Shoe object: 
 * var shoe = new Shoe( 1, "green", "myhouse");
 * { size: 1, color: "green", loc: "myhouse " } 
 *
 */
function Shoe( size, color, loc ) { 
    this.size  = 9;
    this.color = color;
    this.loc   = loc || "store"; // This is an example of using defaut values
                                 // This makes loc an optional parameter!
}

/**
 * All JS objects inherit from there prototype. You should define all metheds in the
 * prototype. This will save memory becuase the method will only be stored once in mem. 
 */
Shoe.prototype.putOn = function() { 
    console.log("Shoe's on my " + this.color + " shoes!"); 
}
 
/**
 * Boot will extend shoe. Fist we define his constructor.
 */
function Boot( size, wproof ) { 

    // First we will call the super constructor
    // Note how I don't include the optional parameter 'loc'
    Shoe.call( this, size, "brown" ); 

    // Boot has his own member variables
    this.waterProof = wproof;
}

/*
 * In order to inherit from shoe, we set the boots.prototype equal
 * to a new instance of Shoes.prototype ( Esentially making boot a Shoe )
 * 
 * Note: you may be asking, why not just write the following:
 *
 * Boot.prototype = Shoe.prototype
 *
 * This is because if you want to add a new method, stomp(), to the
 * boot prototype, you would write the following: 
 * 
 * Boot.prototype.stomp = function(){...} 
 * 
 * The code above would add the function stomp() to the Shoe Prototype! You don't want this!
 * So, by creating a new instance of the shoes prototype you wont modify the Shoe!
 */
Boot.prototype = Object.create( Shoe.prototype );


/*--------------------- OK NOW LETS USE WHAT WE HAVE MADE!------------------------*/

// Create a new shoe and print it
var shoe = new Shoe( 10, "black" );
console.log(shoe);

// Create a new boot and print it 
boot = new Boot( 11, true );
console.log(boot);

// Look boot can call shoes put on method
boot.putOn();


/*-------------------------- Make avalable to public -----------------------------*/
/**
 * To allow others to access these objects, i.e Boot and Shoe, we have to export them.
 */
 module.exports.Shoe = Shoe;
 module.exports.Boot = Boot;

 /**
  * Now to use this class outside of this file you would write the following:
  * var Boot = require(./this_file_name.js).Boot;
  * var Shoe = require(./this_file_name.js).Shoe;
  * 
  * And you can create them like so: 
  * var myBoot = new Boot( 11, true );
  * var myShoe = new Shoe( 10, "black" );
  * 
  * Alternativly you could write the following:
  * var Shoes = require(./this_file_name.js);
  * 
  * And you can create them like so: 
  * var myBoot = new Shoes.Boot( 11, true );
  * var myShoe = new Shoes.Shoe( 10, "black" );
  */
