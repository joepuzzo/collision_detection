/*-----------------------------Imports-------------------------------*/
var Planner = require('./planner.js'); // Plans and Trajectories
    //GPSD    = require('node-gpsd');  // GPSD module


/*----------------------------Constants------------------------------*/
const LOG = false;


/*-----------------------------DaemonGPS-------------------------------*/

/*
This class is bassed on the data that is given to us by a
standard gps daemon. The gps daemon protocol provides us with data
such as the following, an example of a TPV (Time Position Velocity) JSON object. 

{"class":"TPV","device":"/dev/pts/1",
    "time":"2005-06-08T10:34:48.283Z","ept":0.005,
    "lat":46.498293369,"lon":7.567411672,"alt":1343.127,
    "eph":36.000,"epv":32.321,
    "track":10.3788,"speed":0.091,"climb":-0.085,"mode":3}

In order to interact with a daemon, this class utalizes the node-gpsd npm
module. This class acts as a common interface for our node class and 
therefore is required to impliment specific functions.

*/


// Fake GPS constructor
function DaemonGPS() { 
}

// This will return the lat lon and alt  
DaemonGPS.prototype.getLocation = function(){ 
    /*return { 
        lat: somethingHere,
        lon: somethingHere,
        alt: somethingHere
    }*/
}

module.exports = DaemonGPS;


