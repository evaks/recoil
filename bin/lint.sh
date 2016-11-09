#!/bin/bash

EXE=`which $0`
DIR=`dirname $EXE`

cd $DIR/..

#find src -name "*.js" -and -not -name "*_test.js"

gjslint --disable 0110,0120 `find src -name "*.js" -and -not -name "*_test.js" `
#echo $DIR
#gjslint --disable 0110,0120 `ls *.js | grep -v _test.js`

if [ $? -ne 0 ]; then
    echo Error Occured in lint
    exit 2
fi

echo All good

