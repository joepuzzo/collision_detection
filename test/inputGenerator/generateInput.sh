#!/bin/bash

FNAME=simulation$(date +%Y%m%d)
MOV=".movements"
BMEXT=".movements.gz"
VISEXT=".visplot"

i=$1
FNAME=$FNAME$i
./bm -f "$FNAME" RandomWalk -x 1000 -y 1000 -n $i -d 600 -t 100
#cp test3.movements ../../collision_detection/test/sample_input/
gunzip $FNAME$BMEXT
GRAPHSTRING="splot "
d=0
let till=i-1

while [ $d -lt $till ]
do
    #~/730/final/bonnmotion-3.0.0/bin/bm Visplot  -f "$FNAME" -i $d
    node ~/730/final/collision_detection/lib/utils/visualizer.js "/home/csu/mdo399/730/final/collision_detection/test/inputGenerator/$FNAME$MOV" -i $d --time > "Plan$d"
    GRAPHSTRING=$GRAPHSTRING" \"Plan$d\" with lines, "
    let d=d+1	
done

`echo "$GRAPHSTRING" | gnuplot -persist`


#node ../../lib/algorithms/collision/collision-validator.js  ../test/sample_input/test3.movements

