goog.provide('recoil.structs.Cache');

goog.require('goog.structs.AvlTree');
goog.require('recoil.util.Sequence');

/**
 * @template T
 * @param {number} size
 * @param {function(T,T):number} comparator 
 * @constructor
 */
recoil.structs.Cache = function (size, comparator) {
    this.values_ = new goog.structs.AvlTree(function (x, y) {
	return comparator(x.val,y.val);
    });
    this.lastUsed_ = new goog.structs.AvlTree(function (x, y) {
	return x.pos.compare(y.pos);
    });
    this.seq_ = new recoil.util.Sequence();
    this.size_ = size;
};

recoil.structs.Cache.prototype.get = function (toFind) {
    var val = this.values_.findFirst({val: toFind});

    if (val === null) {
	return null;
    }
    var pos = this.lastUsed_.remove({pos : val.pos});
    val.pos = this.seq_.nextLong();
    this.lastUsed_.add(val);
    return val.val;
};

recoil.structs.Cache.prototype.put = function (val) {
    var found = this.values_.findFirst({val: val});
    
    if (found === null) {
	// remove items that will not fit
	while (this.values_.getCount() >= this.size_) {
	    var next = this.lastUsed_.getMinimum();
	    this.lastUsed_.remove(next);
	    this.values_.remove(next);
	}

	found = {val : val , pos  : this.seq_.nextLong() };
	this.lastUsed_.add(found);
	this.values_.add(found);
	return;
    }
    this.lastUsed_.remove({pos : found.pos});
    found.pos = this.seq_.nextLong();
    this.lastUsed_.add(found);

};
