/*-----------------------------Imports-------------------------------*/


/*----------------------------Constants------------------------------*/
const LOG = false;


/*---------------------------Node Object-----------------------------*/

/**
 * A simple node object
 */
function Node( uid ){ 
    // Unique identifier
    this.uid = uid; 
    // Map of cordination links
    this.links = new Map();
    // Used for itterating over links
    this.linksArray = []; 
    // How many people we are waiting on
    this.waiting = 0;
    // How many people are waiting on us
    this.waitingon = 0;
    // The time when we started waiting
    this.waitStart = 0;
}

/**
 * Returns the time we have been waiting
 * 0 if there is no wait;
 */
Node.prototype.waitTime = function() {
    if( waitStart ) { 
        return new Date().getTime() - this.waitStart;
    } 
    return 0; 
}

/**
 * Adds a link to the nodes links
 * and updates some data
 */
Node.prototype.addLink = function( nid, link ) { 
    // If we are the slave we need to perform some updates
    if( this.uid === link.slave.uid ) { 
        // Incriment the wating variable
        this.waiting++;
        // If we are waiting for the first time set the waitStart
        if( !this.waitStart ) { 
            this.waitStart = link.time;
        }
    } else { 
        // Otherwise we are the master 
        this.waitingon++; 
    }
    // Iither way we add the link
    this.links.set( nid, link );
    this.linksArray.push(link);
}


/*------------------------------CLink--------------------------------*/

function CLink( master, slave ) {
    this.master = master;
    this.slave  = slave; 
    this.time   =  new Date().getTime();
}

CLink.prototype.print = function() { 
    console.log( "%s -------------> %s", this.slave.uid, this.master.uid );
}

/*-------------------------Helper Functions---------------------------*/

/**
 * Helper for getting random number
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * A simple factorial function
 */
function fact(num)
{
    var rval=1;
    for (var i = 2; i <= num; i++)
        rval = rval * i;
    return rval;
}

// Convinience function for sleeping
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function linkUp( n1, n2 ) { 
    // If one is waiting and the other is moving then make the waiting
    // node wait for the movine one ( allowing the moving to continue )
    var clink; 
    if( n1.waiting === 0 && n2.waiting > 0 ) { 
        clink = new CLink( n1, n2 );
        n1.addLink( n2.uid, clink );
        n2.addLink( n1.uid, clink );
    } 
    else if( n2.waiting === 0 && n1.waiting > 0 ) { 
        clink = new CLink( n2, n1 );
        n1.addLink( n2.uid, clink );
        n2.addLink( n1.uid, clink );
    }
    // They are both moving waiting so randomly assign one to be the master 
    /*else if( n1.waiting === 0 && n2.waiting === 0 ) { 
        var r = getRandomInt(0,2); 
        clink = new CLink( r ? n1 : n2, r ? n2 : n1 );
        n1.addLink( n2.uid, clink );
        n2.addLink( n1.uid, clink ); 
    }*/
    // They are both stopped
    else { 
        // Whoever has more people waiting on them becomes the master
        var master, slave;
        if( n1.waitingon > n2.waitingon ) { 
            // n1 has more gravity so he wins! 
            master = n1;
            slave  = n2;
        } else { 
            master = n2;
            slave  = n1; 
        }
        clink = new CLink( master, slave );
        n1.addLink( n2.uid, clink );
        n2.addLink( n1.uid, clink );

    }
    /*else { 
        // Whoever has been waiting longer will get to go first
        var master, slave;
        if( n1.waitTime > n2.waitTime ) { 
            // n1 has been wating longer so he is the master
            master = n1;
            slave  = n2;
        } else { 
            master = n2;
            slave  = n1; 
        }
        clink = new CLink( master, slave );
        n1.addLink( n2.uid, clink );
        n2.addLink( n1.uid, clink );
    }*/
}

// Prints the state of the graph
function printGraph( vertacies ) { 

    console.log("\nGRAPH: "); 
    for( vert of vertacies ) {
        console.log("-------------------------------------------"); 
        console.log( "VERT: %s", vert.uid );
        vert.links.forEach( function( link, key, map ) {
            // Only print if we are the slave
            if( link.slave.uid === vert.uid ) { link.print(); }
            //link.print();
        });
    }
}


/**
 * Recursave function for finding deadlock loops
 */
function loop( vert, startid, path, paths ) { 

    // Base case, we have been here before 
    if( path.indexOf(" "+vert.uid+ " ") > -1 ) { 
        return;
    }

    // From this verticy try to do a loop from every link
    var link;
    for( l of vert.links ) { 
        link = l[1];
        // Only do this if we are the slave 
        // i.e vert --------------> link.master
        if( link.slave.uid === vert.uid ) { 
            // Base case - we have looped back to the start id 
            if( link.master.uid === startid ) { 
                if( vert.uid !== startid ) { 
                    paths.set(path+" "+vert.uid+" ", true);
                } 
            } else { 
                loop( link.master, startid, path+" "+vert.uid, paths );         
            }
        }
    }
}

function checkDeadlock( vertacies ) { 
    // Itterate over the vertacies
    paths = new Map(); 
    for( vert of vertacies ) {
        loop( vert, vert.uid, " ", paths );
    }
    return paths;
}


/*---------------------------Proof Function-----------------------------*/
/**
 * Given n nodes create every senario possible and see if a deadlock
 * ever occurs
 */
function proof( n ) { 
    // Initialize an array of n nodes
    nodes = [];
    var i; 
    for( i = 0; i < n; i++ ) { 
        nodes.push( new Node(i) );
    }
    
    var edges = ( nodes.length * ( nodes.length - 1 ) ) / 2; 
    //console.log("EDGES: " + edges);
    for( i = 0; i < edges; i++ ) {
        // Now randomly grab two nodes from the nodes array 
        // ensuring that 
        // 1. there does not already exist a coordination link between them
        // 2. they are not the same node 
        var i1, i2;
        do { 
            i1 = getRandomInt( 0, nodes.length );
            i2 = getRandomInt( 0, nodes.length );
        } while(  i1 === i2 || nodes[i1].links.has( nodes[i2].uid ) ); 

        //sleep( 100 );

        // Now create a new link between the two nodes
        var n1 = nodes[i1], 
            n2 = nodes[i2];

        linkUp( n1, n2 );
    }
    
    var paths = checkDeadlock( nodes );  

    return { 
        graph: nodes, 
        deadlocks: paths 
    }
}

var n = process.argv[2]
var loops = process.argv[3] || 1;
var verbose = process.argv[4];
var result; 
var deadlocks, graph;

if( !n ) { 
    console.log( "Usage node deadlock-proof.js [number of nodes] [number of tries] [-v for verbose]");
    return;
}

var edges = ( n * ( n - 1 ) ) / 2; 
console.log("EDGES: " + edges);

for( var i = 0; i < loops; i++ ){

    // Gather the results from the prover
    result = proof( n ); 
    deadlocks = result.deadlocks;
    graph = result.graph;

    // Only print if nessisary 
    if( deadlocks.size > 0 ) { 
        printGraph( graph );
        console.log("%d DEADLOCKS DETECTED!", deadlocks.size );
        console.log(deadlocks);
    } else if( verbose ) { 
        printGraph( graph );
        console.log("Graph contains no deadlocks"); 
    } 
}
