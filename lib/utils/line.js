/*-----------------------------Imports-------------------------------*/
var Planner = require('../planner.js'); // Plans and Trajectories


/*----------------------------Constants------------------------------*/
const LOG = false;


/*--------------------CollisionDetectionFunction---------------------*/
/**
 * This function was taken from http://jsfiddle.net/justin_c_rounds/Gd2S2/ 
 * 
 * Our version is located here http://jsfiddle.net/0e6tc79h/ use that gui for testing!
 * 
 * while there exists many  implimentations of line intersection this version
 * will give an intersection assuming infinate lines. This is uesful becuase 
 * we may want to know weather two lines are close to intersecting. 
 * See example:
 *                /
 *     \         /
 *      \       /     
 *       \     /
 *        \ 
 *         *
 *          \
 * @param line1 a line object
 * @param line2 a line object
 * 
 * @return an object that containes data about the intersection point 
 *   Its initialized to the following and will return this result if no intersection is found
 *   The 
 *   {
 *       x: null,
 *       y: null,
 *       onLine1: false,
 *       onLine2: false
 *   };
 */
function checkLineIntersection( line1, line2 ) {


    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite)
    // and booleans for whether line segment 1 or line segment 2 contain the point
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onLine1: false,
        onLine2: false
    };
    denominator = ((line2.endY - line2.startY) * (line1.endX - line1.startX)) - ((line2.endX - line2.startX) * (line1.endY - line1.startY));
    if (denominator == 0) {
        return result;
    }
    a = line1.startY - line2.startY;
    b = line1.startX - line2.startX;
    numerator1 = ((line2.endX - line2.startX) * a) - ((line2.endY - line2.startY) * b);
    numerator2 = ((line1.endX - line1.startX) * a) - ((line1.endY - line1.startY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1.startX + (a * (line1.endX - line1.startX));
    result.y = line1.startY + (a * (line1.endY - line1.startX));
    /*
        // it is worth noting that this should be the same as:
        x = line2StartX + (b * (line2EndX - line2StartX));
        y = line2StartX + (b * (line2EndY - line2StartY));
        */
    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) {
        result.onLine1 = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) {
        result.onLine2 = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
};

function slope( x1, y1, x2, y2 ) {
    var x1 = line.startX,
        y1 = line.startY, 
        x2 = line.endX, 
        y2 = line.endY; 
    // Slope is undefined 
    if (x1 == x2) return false;
    // Otherwise return the slope 
    return (y1 - y2) / (x1 - x2);
}

function parallel( line1, line2 ) { 
    // If the slopes are equal or the they are both false 
    var s1 = slope( line1 );
        s2 = slope( line2 ); 
    return s1 === s2; 
}


/**
 * Convienence constructor for line. You dont have to use this. Creating an 
 * object that has a startX starY endX endY will do just fine 
 */
function Line( x1, y1, x2, y2 ){
    this.startX = x1;
    this.startY = y1; 
    this.endX   = x2; 
    this.endY   = y2;
}

module.exports.Line = Line;
module.exports.checkLineIntersection = checkLineIntersection;
