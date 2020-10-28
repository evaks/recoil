#!/bin/bash
MAJOR=`python --version |& sed 's/Python //g' | sed 's/\.[0-9][0-9]*//g'`
#java -jar compiler.jar --js shop.js --js icecream.js --js cone.js
if [ "$MAJOR" -gt 2 ] ; then
      if [ -z "$PYTHON2" ] ; then
      echo "Incorrect Python version, set PYTHON2 path to python executable"
      exit
      else
            PYTHON=$PYTHON2
      fi
else
    if [ -z "$PYTHON2" ] ; then
	PYTHON=python
    else
        PYTHON=$PYTHON2
    fi
fi

EXE=`which $0`
DIR=`dirname $EXE`
MYDIR=`readlink -f $DIR`
cd ${DIR}/../..

echo ${MYDIR}

function genDepends {
    ${PYTHON} closure-library/closure/bin/calcdeps.py -p closure-library -p recoil/src/  -o deps   > my-deps.js
}
genDepends

#generate the test cases

function genTests {
    cd recoil

    OUT=alltests.js;

    echo 'var _allTests = [' > $OUT 
    find src/ -name "*_test.html" -and -not -name "*_manual_test.html" | sed  "s/^/  '/" | sed "s/$/',/" >> $OUT
    echo '];' >> $OUT 
    echo '' >> $OUT 
    
    echo "if (typeof module !== 'undefined' && module.exports) {" >> $OUT
    echo "  module.exports = _allTests;" >> $OUT
    echo "}" >> $OUT
    cd ..
}

function lintFix {
    fixjsstyle --disable 0110,0120 `find recoil/src/ -name "*.js" -and -not -name "*_test.js" `  > /dev/null

    #on windows this adds cr
    which cygpath > /dev/null && find recoil/src/ -name "*.js" -and -not -name "*_test.js" -exec sed -i 's/\r//' {} \; 
}

genTests

gjslint --disable 0110,0120 `find recoil/src -name "*.js" -and -not -name "*_test.js" ` > /dev/null
if [ $? -ne 0 ]; then
    #we got an error try running lint fix on it first
    lintFix
    gjslint --disable 0110,0120 `find recoil/src -name "*.js" -and -not -name "*_test.js" `
    if [ $? -ne 0 ]; then
	echo Error Occured in Lint stopping compile
	exit 2
    fi
fi


#--jscomp_error=missingRequire
${PYTHON} closure-library/closure/bin/build/closurebuilder.py --root closure-library/ --root recoil/src/ --compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS" --compiler_flags="--warning_level=VERBOSE" \
    --compiler_flags="--jscomp_error=checkTypes --jscomp_error=missingReturn --jscomp_error=newCheckTypes --jscomp_error=strictModuleDepCheck --jscomp_error=accessControls" \
    -c ${MYDIR}/compiler.jar  --output_mode="compiled"  `grep -hr --include="*.js" --exclude="*_test.js" goog.provide  recoil/src  | sed 's/goog.provide('\'// | sed s/\'');.*$'// | sort|uniq | sed s/^/--namespace\ /` > /dev/null

#${PYTHON} closure-library/closure/bin/build/closurebuilder.py --root closure-library/ --root lib/ --compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS" --compiler_flags="--warning_level=VERBOSE --jscomp_error=checkTypes" -c compiler.jar  --output_mode="compiled"  `grep -hr --include="*.js" --exclude="*_test.js" goog.provide  lib  | sed 's/goog.provide('\'// | sed s/\'');'// | sort|uniq | sed s/^/--namespace\ /` > /dev/null

echo "Exit " $? 


