#!/bin/bash

DIR=`dirname $0`
SRC=`grep -nsrl --include='*.js' "goog.provide('$1')" $DIR/../src`

if [ "$SRC" == "" ]; then
    echo "class not found"
    exit
fi


FNAME=`basename -s .js $SRC` 
FULLFILE=`readlink -e $SRC`
DEPDIR=`readlink -e $DIR/../..`
FILEDIR=`dirname $FULLFILE`
TOCUT=`expr 1 + ${#DEPDIR}`

ROOT=`echo $FILEDIR | cut -c$TOCUT- | sed -e 's/\/[^/][^/]*/..\\\\\//g'`


if [ -e $FILEDIR/${FNAME}_test.html ]; then
    echo "test html already exists"
else
    cat $DIR/test.html.template | sed -e "s/{CLASS}/$1/g" | sed -e "s/{ROOT}/$ROOT/g" > $FILEDIR/${FNAME}_test.html
fi
if [ -e  $FILEDIR/${FNAME}_test.js ]; then
    echo "test .js already exists"
else
    cat $DIR/test.js.template | sed -e "s/{CLASS}/$1/g" | sed -e "s/{ROOT}/$ROOT/g" > $FILEDIR/${FNAME}_test.js
fi
