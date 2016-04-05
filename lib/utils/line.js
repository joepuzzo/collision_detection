/*-----------------------------Imports-------------------------------*/
var Planner = require('../planner.js'), // Plans and Trajectories
    math    = require('mathjs');


/*----------------------------Constants------------------------------*/
const LOG = false;


/*-------------------CollisionIntersectionFunction-------------------*/
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

module.exports.checkLineIntersection = checkLineIntersection;


/*--------------------------SlopeFunction----------------------------*/

function slope( line ) {
    var x1 = line.startX,
        y1 = line.startY, 
        x2 = line.endX, 
        y2 = line.endY; 
    // Slope is undefined 
    if (x1 == x2) return false;
    // Otherwise return the slope 
    return (y1 - y2) / (x1 - x2);
}

module.exports.slope = slope;


/*-------------------------ParallelFunction---------------------------*/

function parallel( line1, line2 ) { 
    // If the slopes are equal or the they are both false 
    var s1 = slope( line1 );
        s2 = slope( line2 ); 
    return s1 === s2; 
}

module.exports.parallel = parallel;


/*--------------------------DistanceFunction----------------------------*/

function distance( x1, y1, x2, y2 ) { 
    return Math.sqrt( Math.pow( y2 - y1, 2 ) +  Math.pow( x2 - x1, 2 ) ); 
}

module.exports.distance = distance;

function distance3D( x1, y1, z1, x2, y2, z2  ) { 
    return Math.sqrt( Math.pow( y2 - y1, 2 ) +  Math.pow( x2 - x1, 2 ) + Math.pow( z2 - z1, 2 ) ); 
}

module.exports.distance3D = distance3D;


/*-----------------------ClosestDistanceFunction-------------------------*/
/*
 * This function was coppied from a stack overflow post, see link below:
 * http://stackoverflow.com/questions/2824478/shortest-distance-between-two-line-segments
 *
 * It takes two 3 dimentional lines and returns the closest distance the two closest points
 */
function closestDistanceBetweenLines(a0, a1, b0, b1, clampAll, clampA0, clampA1, clampB0, clampB1){
    //Given two lines defined by array pairs (a0,a1,b0,b1)
    //Return distance, the two closest points, and their average

    clampA0 = clampA0 || false;
    clampA1 = clampA1 || false;
    clampB0 = clampB0 || false;
    clampB1 = clampB1 || false;
    clampAll = clampAll || false;

    if(clampAll){
        clampA0 = true;
        clampA1 = true;
        clampB0 = true;
        clampB1 = true;
    }

    //Calculate denomitator
    var A = math.subtract(a1, a0);
    var B = math.subtract(b1, b0);
    var _A = math.divide(A, math.norm(A))
    var _B = math.divide(B, math.norm(B))
    var cross = math.cross(_A, _B);
    var denom = math.pow(math.norm(cross), 2);

    //If denominator is 0, lines are parallel: Calculate distance with a projection and evaluate clamp edge cases
    if (denom == 0){
        var d0 = math.dot(_A, math.subtract(b0, a0));
        var d = math.norm(math.subtract(math.add(math.multiply(d0, _A), a0), b0));

        //If clamping: the only time we'll get closest points will be when lines don't overlap at all. Find if segments overlap using dot products.
        if(clampA0 || clampA1 || clampB0 || clampB1){
            var d1 = math.dot(_A, math.subtract(b1, a0));

            //Is segment B before A?
            if(d0 <= 0 && 0 >= d1){
                if(clampA0 == true && clampB1 == true){
                    if(math.absolute(d0) < math.absolute(d1)){
                        return [b0, a0, math.norm(math.subtract(b0, a0))];                       
                    }
                    return [b1, a0, math.norm(math.subtract(b1, a0))];
                }
            }
            //Is segment B after A?
            else if(d0 >= math.norm(A) && math.norm(A) <= d1){
                if(clampA1 == true && clampB0 == true){
                    if(math.absolute(d0) < math.absolute(d1)){
                        return [b0, a1, math.norm(math.subtract(b0, a1))];
                    }
                    return [b1, a1, math.norm(math.subtract(b1,a1))];
                }
            }

        }

        //If clamping is off, or segments overlapped, we have infinite results, just return position.
        return [null, null, d];
    }

    //Lines criss-cross: Calculate the dereminent and return points
    var t = math.subtract(b0, a0);
    var det0 = math.det([t, _B, cross]);
    var det1 = math.det([t, _A, cross]);

    var t0 = math.divide(det0, denom);
    var t1 = math.divide(det1, denom);

    var pA = math.add(a0, math.multiply(_A, t0));
    var pB = math.add(b0, math.multiply(_B, t1));

    //Clamp results to line segments if needed
    if(clampA0 || clampA1 || clampB0 || clampB1){

        if(t0 < 0 && clampA0)
            pA = a0;
        else if(t0 > math.norm(A) && clampA1)
            pA = a1;

        if(t1 < 0 && clampB0)
            pB = b0;
        else if(t1 > math.norm(B) && clampB1)
            pB = b1;

    }

    var d = math.norm(math.subtract(pA, pB))

    return [pA, pB, d];
}


/*----------------------ClosestDistance2DFunction------------------------*/
/**
 * A convienence function to find the closest distance between two 2 
 * dimentional lines
 * 
 * @param line1 a 2D line
 * @param line2 a 2D line
 */
function closestDistance2D( line1, line2 ) { 
    var a0 = [ line1.startX, line1.startY, 0 ],
        a1 = [ line1.endX, line1.endY, 0 ],
        b0 = [ line2.startX, line2.startY, 0 ],
        b1 = [ line2.endX, line2.endY, 0 ]; 
     
    var result = closestDistanceBetweenLines(a0, a1, b0, b1, true);

    return { 
        p1: { x: result[0][0], y: result[0][1] },
        p2: { x: result[1][0], y: result[1][1] }, 
        d: result[2]
    }
}

module.exports.closestDistance2D = closestDistance2D;


/*----------------------ClosestDistance3DFunction------------------------*/
/**
 * A convienence function to find the closest distance between two 3 
 * dimentional lines
 * 
 * @param line1 a 3D line
 * @param line2 a 3D line
 */
function closestDistance3D( line1, line2 ) { 
    //console.log('\n');
    //console.log( line1, line2 ); 
    var a0 = [ line1.startX, line1.startY, line1.startZ ],
        a1 = [ line1.endX, line1.endY, line1.endZ ],
        b0 = [ line2.startX, line2.startY, line2.startZ ],
        b1 = [ line2.endX, line2.endY, line2.endZ ]; 

    //console.log( "A0:", a0 );
    //console.log( "A1:", a1 );
    //console.log( "B0:", b0 );
    //console.log( "B1:", b1 );

     
    var result = closestDistanceBetweenLines(a0, a1, b0, b1, true);
    return { 
        p1: { x: result[0][0], y: result[0][1], z: result[0][2] },
        p2: { x: result[1][0], y: result[1][1], z: result[1][2] }, 
        d: result[2]
    }
}

module.exports.closestDistance3D = closestDistance3D;

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

/**
 * Convienence constructor for line. You dont have to use this. Creating an 
 * object that has a startX starY startZ endX endY endZ will do just fine 
 */
function Line3D( x1, y1, z1, x2, y2, z2 ){
    this.startX = x1;
    this.startY = y1; 
    this.endX   = x2; 
    this.endY   = y2;
    this.startZ = z1;
    this.endZ   = z2;
}

module.exports.Line3D = Line3D;

