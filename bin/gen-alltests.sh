#!/bin/bash

ME=`which $0`
DIR=`dirname $ME`
cd ${DIR}/../../recoil

OUT=alltests.js;

echo 'var _allTests = [' > $OUT 
find src/ -name "*_test.html" -and -not -name "*_manual_test.html" | sed  "s/^/  '/" | sed "s/$/',/" >> $OUT
echo '];' >> $OUT 
echo '' >> $OUT 

echo "if (typeof module !== 'undefined' && module.exports) {" >> $OUT
echo "  module.exports = _allTests;" >> $OUT
echo "}" >> $OUT
