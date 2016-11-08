#!/bin/bash

EXE=`which $0`
DIR=`dirname $EXE`

fixjsstyle --disable 0110,0120 `find $DIR/../static/html/lib -name "*.js" -and -not -name "*_test.js" `
#echo $DIR
#gjslint --disable 0110,0120 `ls *.js | grep -v _test.js`
