goog.provide('recoil.frp');
goog.provide('recoil.frp.BStatus');
goog.provide('recoil.frp.Behaviour');
goog.provide('recoil.frp.EStatus');
goog.provide('recoil.frp.Frp');
goog.provide('recoil.frp.TransactionManager');

goog.require('goog.array');
goog.require('goog.math.Long');
goog.require('recoil.exception.InvalidState');
goog.require('recoil.exception.LoopDetected');
goog.require('recoil.exception.NoAccessors');
goog.require('recoil.exception.NotAttached');
goog.require('recoil.exception.NotInTransaction');
goog.require('recoil.frp.Debugger');

import {UniquePriorityQueue} from "../structs/uniquepriorityqueue";
goog.require('recoil.util');


type BehaviourList = NonNullable<Array<NonNullable<Behaviour>>>;
interface ProviderInfo = {
	provider: NonNullable<Behaviour>;
	force: boolean;
}

type ProviderInfoList = NonNullable<Array<NonNullable<ProviderInfo>>>;



class TraverseDirection {
	readonly comparator_: comparator (x: Behaviour, y: Behaviour) => number;
	constructor(name: string,
				calc: (behaviour: NonNullable<Behaviour>,
					   providers: BehaviourList,
					   dependents: BehaviourList,
					   nextItr: ProviderInfoList) => void,
				comparator:(x: Behaviour, y: Behaviour) => number) {
		this.calc_ = calc;
		this.comparator_ = comparator_;
	}
	calculate(behaviour: NonNullable<Behaviour>,
			  providers: BehaviourList,
			  dependents: BehaviourList,
			  nextItr: ProviderInfoList) : BehaviourList
	{
		return this.calc_(behaviour, providers, dependents, nextItr);		
	}
	
	heapComparator() {
		return me.comparator_;
	}
	
	
}



export class Frp {
	transactionManager_: TransactionManager;
	constructor() {
		this.transactionManager_ = new TransactionManager();
	}

	tm() {
		return this.transactionManager_;
	}
	/**
	 * mark the behaviour that it is being used it will now recieve update notifications
	 */
	attach(behaviour: NonNullable<Behaviour>) {
		this.transactionManager_.attach(behaviour);
	}

	/**
	 * mark the behaviour that it is no longer being used it will not recieve update notifications
	 *
	 */
	detach(behaviour: NonNullable<Behaviour>) {
		this.transactionManager_.detach(behaviour);
	};
	
	static compareSeq_(a: BehaviourId, b: BehaviourId) {
		var len = a.length > b.length ? b.length : a.length;
		
		for (var i = 0; i < len; i++) {
			let res = a[i] - b[i];
			
			if (res !== 0) {
				return res;
			}
		}

		if (a.length > b.length) {
			return -1;
		}
		if (a.length < b.length) {
			return 1;
		}
		return 0;
	}


	/**
	 * sets the debugger interface for the frp engin
	 * @param {recoil.frp.Debugger} dbugger
	 */
	setDebugger(dbugger : Debugger) {
		this.transactionManager_.debugger_ = dbugger;
	};
	/**
	 * @param {function(boolean)} cb called with true if started false if ended
	 */
	addTransactionWatcher(cb: (started: boolean) => void) {
		this.transactionManager_.watchers_.push(cb);
	};
	
	/**
	 * @param {function(boolean)} cb called with true if started false if ended
	 */
	removeTransactionWatcher = function(cb: (started: boolean) => void) {
		goog.array.removeIf(this.transactionManager_.watchers_, function(v) { return v === cb; });
	};

	/**
	 * for debugging, if the debugger has paused the execution this resumes
	 * it
	 */
	resume() {
		this.transactionManager_.resume();
	};
	/**
	 * @template T

	 */
	createB<T>(initial:T): NonNullable<Behaviour<T>> {
		var metaInitial = new recoil.frp.BStatus(initial);
		var newB = new recoil.frp.Behaviour(this, metaInitial, undefined, undefined, this.transactionManager_.nextIndex(), []);
		return newB.setName('createB');
	}
	/**
	 * helper function to create a behaviour that is not ready
	 * @template T
	 * @return {!recoil.frp.Behaviour<T>}
	 */

	recoil.frp.Frp.prototype.createNotReadyB = function() {
		var metaInitial = recoil.frp.BStatus.notReady();
		return new recoil.frp.Behaviour(this, metaInitial, undefined, undefined, this.transactionManager_.nextIndex(), []);
	}
	
	/**
	 * create a generator event set this value to send values up the tree
	 */
	createE<T>(): NonNullable<Behaviour<T>> {
		var metaInitial = EStatus.notReady(true);
		return new Behaviour(this, metaInitial, undefined, undefined, this.transactionManager_.nextIndex(), []);
	}
	/**
	 * @param {!recoil.frp.BStatus<T>} initial
	 * @return {!recoil.frp.Behaviour<T>}
	 */
	createMetaB<T>(initial: NonNullable<BStatus<T>>) : NonNullable<Behaviour<T>> {
		return new Behaviour(this, initial, undefined, undefined, this.transactionManager_.nextIndex(), []);
	}

	createConstB<T>(initial) : NonNullable<Behaviour<T>> {
		var metaInitial = new BStatus(initial);
		return new Behaviour(this, metaInitial, () => metaInitial, Frp.nullInvFunc_, this.transactionManager_.nextIndex(), []);
	};
	
	/**
	 * allows access to behaviours and also puts the callback in a transaction
	 * Warning: DO NOT USE When you just need access to a behaviour, since you will not
	 * receive updates from the behaviour.
	 * It should only  be used when an event external to the frp system needs to update the
	 * behaviours.
	 * E.g: a user clicks on an element and you want to set a value based on the behaviour.
	 *
	 * @param {function():(?|undefined)} callback
	 * @param {...recoil.frp.Behaviour} var_behaviours
	 * @return {?}
	 */

	accessTrans<T>(callback: () => T, ...behaviours : Behaviour) {
		let res = undefined;
		var func = function(...innerArgs) {
			try {
				for (var i = 1; i < behaviours.length; i++) {
					behaviours[i].accessors_++;
				}
				res = callback.apply(null, innerArgs);
			} finally {
				for (i = 1; i < behaviours.length; i++) {
					behaviours[i].accessors_--;
				}
			}
			return res;
		};
		return this.transactionManager_.doTrans(func);
	}

	/**
	 * like access Trans however creates a function to this usefull
	 * for things like putting it in a callback
	 *
	 * @return {function(...)}
	 */
	
	accessTransFunc<T>(callback: (...args) => T, ...var_behaviours) :  (...args) => T {
		let me = this;
		return function(...curArgs) {
			// this is so we can get the arguments into the inner function
			let cargs = [function() {
				callback.apply(me, curArgs);
			}].concat(var_behaviours);
			return me.accessTrans.apply(me, cargs);
		};
	};

	static access(callback: () => void, ...var_behaviours: Behaviour) {
		for (let i = 0; i < var_behaviours.length; i++) {
			if (!(var_behaviours[i] instanceof recoil.frp.Behaviour)) {
				throw 'All arguments must be a behaviour';
			}
		}
		try {
			for (let i = 0; i < var_behaviours.length; i++) {
				var_behaviours[i].accessors_++;
			}
			callback();
		} finally {
			for (let i = 0; i < var_behaviours.length; i++) {
				var_behaviours[i].accessors_--;
			}
		}
	}

	/**
	 * just access but convience function left for backwards compatablity 
	 */
	
	static accessList(callback: () => void, behaviours) {
		access(...behaviours);
	}

	/**
	 * converts a behaviour that has a behaviour as its value, into a behaviour with the value of the inner behaviour
	 * e.g. Behaviour<Behaviour<1>> -> Behaviour<1>
	 * this is useful when you don't know what the inner behaviour is until some other behaviour(s) are updated
	 * @template T
	 * @param {!recoil.frp.Behaviour<!recoil.frp.Behaviour<T>>} Bb
	 * @return {T}
	 */
	switchB<T>(Bb: NonNullable<Behaviour<NonNullable<Behaviour<T>>>>): NonNullable<Behaviour<T>> {
		let me = this;
		// the function is important here it lets us access behaviour we are setting
		var res1 = this.metaLiftBI(function () {
			let switchB = this;
			let metaBb : Status<NonNullable<Behaviour<T>> = Bb.metaGet();
			var res = BStatus(null);
			res.merge(metaBb);
			var b = null;
			me.transactionManager_.nestIds(Bb, () => {
				if (metaBb.value_ === null || !metaBb.good()) {
					me.transactionManager_.updateProviders_(switchB, Bb);
				} else {
					me.transactionManager_.updateProviders_(switchB, Bb, /** @type {recoil.frp.Behaviour} */ (metaBb.get()));
					res.merge(metaBb);
				}
				b = metaBb.value_;
			});
			
			if (b !== null && b !== undefined) {
				Frp.access(function() {
					res.merge(b.metaGet());
					res.set(b.get());
				}, b);
				return res;
			}
			return res;
		}, function(val) {
			var metaBb = Bb.metaGet();
			
			if (metaBb.value_ instanceof Behaviour) {
				metaBb.value_.metaSet(val);
			}
			
		}, Bb).setName('switchB');
		res1.isSwitch = true;
		return res1;
	}

	
	/**
	 * calls function, arguments and return value should contain meta information
	 */
	metaLiftB<T>(func: (...) => T, ...var_args: NonNullable<Behaviour>): NonNullable<Behaviour<T>> {
		return this.metaLiftBI(func, undefined, ...var_args);
	}

	/**
	 * similar to liftB however will be notified if object is changed back
	 * to itself
	 *
	 * @template T
	 * @param {function(...) : T} func
	 * @param {...} var_args
	 * @return {!recoil.frp.Behaviour<T>}
	 */
	observeB<T>(func (...) => T, ...var_args : NonNullable<Behaviour>) : NonNullable<Behaviour<T>>  {
		let res = this.metaLiftBI(func, undefined, ...var_args);
		res.notifyReset_ = true;
		return res;
	};

	/**
	 * calls function, arguments and return value should contain meta information
	 *
	 * @template T
	 * @param {function(...) : T} func
	 * @param {function(T,...)} invFunc
	 * @param {...} var_args
	 * @return {!recoil.frp.Behaviour<T>}
	 */
	metaLiftBI<T>(func: (...args) => T,
				  invFunc: (T, ...) => void,
				  ...providers: NonNullable<Behaviour>) : NonNullable<Behaviour<T>>  {
		if (!(func instanceof Function)) {
			throw 'func must be function';
		}
		if (invFunc != undefined && !(invFunc instanceof Function)) {
			throw 'invFunc arg must be function';
		}
		if (providers.length == 0) {
			throw 'you must have at least 1 provider';
		}
		return new Behaviour(
			this, BStatus.notReady(), func, invFunc,
			this.transactionManager_.nextIndex(), providers).nameFunc(func, invFunc).setName('metaLiftBI');
	}
	
	/**
	 * calls function, arguments and return value should contain meta information
	 *
	 */
	metaLiftEI<T>(func :(...args) => T, invFunc: (T, ...) => void, ...providers: NonNullable<Behaviour>): NonNullable<Behaviour<T>> {
		return new recoil.frp.Behaviour(this, EStatus.notReady(false), func, invFunc, this.transactionManager_.nextIndex(), providers);
	}

	/**

	 * @param {...number|Object|recoil.frp.Behaviour} var_args
	 * @return {!recoil.frp.Behaviour<RT>}
	 */
	
	liftB<RT>(func: (...args) => T, ...args : NonNullable<Behaviour>) : NonNullable<Behaviour<RT>> {

		return this.liftBI(func, undefined, ...args);
	}


	liftE<RT>(func: (...args) => T, ...args : NonNullable<Behaviour>) : NonNullable<Behaviour<RT>> {
		
		return this.liftEI(func, undefined, ...args);
	}


	private static nullFunc_() : any{
		return null;
	}

	/**
	 * @private
	 */
	static nullInvFunc_() {
	};


	
	/**
	 *
	 * Creates callback, this is basically a behaviour with only an inverse
	 * the calculate function always returns true
	 */
	createCallback(func: (...any),
				   ...var_dependants: NonNullable<Behaviour>): NonNullable<Behaviour> {
		recoil.util.notNull(arguments);
		
		let inv = function(value) {
			return func.apply(this, arguments);
		};

		var b = this.liftBI(Frp.nullFunc_, inv, ...var_dependants);
		b.type = 'callback';
		return b;
	}


	/**
	 *
	 * Creates callback, this is basically a behaviour with only an inverse
	 * the calculate function always returns true, this differs from createCallback in that
	 * the providers don't have to be good for it to be good
	 */
	createGoodCallback(
		func: (...any), ...var_dependants: Behaviour): NonNullable<Behaviour> {
		recoil.util.notNull(arguments);
			
		let b = this.metaLiftBI(
			() => new recoil.frp.BStatus(null),
			function(value) {return func.apply(this, arguments);},
			...var_dependants);
			b.type = 'callback';
		return b;
	}
		
	/**
	 * takes input behaviours and makes a new behaviour
	 * @template RT
	 * @param {function(...) : RT} func
	 * @param {function(RT,...)} invFunc
	 * @param {...number|Object} var_args
	 * @return {!recoil.frp.Behaviour<RT>}
	 */

recoil.frp.Frp.prototype.liftBI = function(func, invFunc, var_args) {
    return recoil.util.invokeParamsAndArray(this.liftBI_, this, this.metaLiftBI, function() {
        return new recoil.frp.BStatus(null);
    }, arguments);
};

/**
 * like liftBI except returns a Status, this is useful for calculation
 * errors, inputs are still guaranteed to be good
 * @template RT
 * @param {function(...) : recoil.frp.Status<RT>} func
 * @param {function(RT, ...)} invFunc
 * @param {...!recoil.frp.Behaviour} var_args
 * @return {!recoil.frp.Behaviour<RT>}
 */
recoil.frp.Frp.prototype.statusLiftBI = function(func, invFunc, var_args) {
    return recoil.util.invokeParamsAndArray(this.liftBI_, this, this.metaLiftBI, null, arguments);

};

/**
 * takes input behaviours and makes a new behaviour that stores an event
 * @template RT
 * @param {function(...) : RT} func
 * @param {function(RT,...)} invFunc
 * @param {...number|Object} var_args
 * @return {!recoil.frp.Behaviour<RT>}
 */

recoil.frp.Frp.prototype.liftEI = function(func, invFunc, var_args) {
    return recoil.util.invokeParamsAndArray(this.liftBI_, this, this.metaLiftEI, function() {
        return new EStatus(false);
    }, arguments);
};


/**
 * creates an event from a behaviour
 * @template RT
 * @param {!recoil.frp.Behaviour<RT>} valB
 * @return {!recoil.frp.Behaviour<RT>}
 */
recoil.frp.Frp.prototype.changesE = function(valB) {
    return this.liftE(function(val) {
        return [val];
    }, valB);
};

/**
 * @param {IArrayLike} args
 * @param {!recoil.frp.Status=} opt_result
 * @return {!recoil.frp.Status}
 */

recoil.frp.Frp.prototype.mergeErrors = function(args, opt_result) {
    var metaResult = opt_result || new recoil.frp.BStatus(null);
    var metaResultB = null;

    for (var i = 0; i < args.length; i++) {
        var metaArgVal = args[i];
        metaResult.merge(metaArgVal);

        if (metaArgVal instanceof recoil.frp.BStatus) {
            if (metaResultB === null) {
                metaResultB = new recoil.frp.BStatus(null);
            }
            metaResultB.merge(metaArgVal);
        }
    }
    return metaResult;

};
/**
 * func will fire if all dependant behaviours are good or
 * or there is 1 ready event
 * @template RT
 * @private
 * @param {function(function(...) : RT, function(RT, ...), ...) : !recoil.frp.Behaviour<RT>} liftFunc function to call
 * ever event or behaviour
 * @param {function() : recoil.frp.Status<RT>} statusFactory function to create an empty status
 * @param {function(...) : RT} func
 * @param {function(RT,...)} invFunc
 * @param {...number|Object} var_args
 * @return {!recoil.frp.Behaviour<RT>}
 */

recoil.frp.Frp.prototype.liftBI_ = function(liftFunc, statusFactory, func, invFunc, var_args) {
    var outerArgs = arguments;
    var wrappedFunc = function() {
        var args = [];
        var metaResult = statusFactory === null ? new recoil.frp.BStatus(null) : statusFactory();
        var metaResultB = null; // the result of all the behaviours
        var eventReady = false;

        for (var i = 4; i < outerArgs.length; i++) {
            var metaArg = outerArgs[i];
            var metaArgVal = metaArg.metaGet();
            metaResult.merge(metaArgVal);

            if (metaArgVal instanceof recoil.frp.BStatus) {
                if (metaResultB === null) {
                    metaResultB = new recoil.frp.BStatus(null);
                }
                metaResultB.merge(metaArgVal);
            }
            else {
                eventReady = eventReady || metaArgVal.ready();
            }
            args.push(metaArg.get());
        }

        // fires if all provider behaviours a good
        // or we have an event that is ready, note this means


        if ((metaResultB !== null && metaResultB.good()) || eventReady) {
            try {
            var result = func.apply(this, args);
                if (statusFactory === null) {
                    // if status factory null then we expect the result a status object
                    metaResult = result;
                }
                else {
                    metaResult.set_(result);
                }
            }
            catch (error) {
                metaResult.addError(error);
            }
        }
        return metaResult;
    };

    var wrappedFuncInv = undefined;
    if (invFunc !== undefined) {
        wrappedFuncInv = function(val) {
            var args = [val.get()];

            for (var i = 4; i < outerArgs.length; i++) {
                args.push(outerArgs[i]);
            }
            invFunc.apply(this, args);
        };
    }
    var newArgs = [wrappedFunc, wrappedFuncInv];
    for (var i = 4; i < outerArgs.length; i++) {
        newArgs.push(outerArgs[i]);
    }

    return liftFunc.apply(this, newArgs).nameFunc(func, invFunc);
	
};

	// xxxx
}


/**
 * an base interface EStatus (Event Status) and BStatus (Behaviour Status)
 *
 */
export interface Status<InType,OutType> {
	errors(): !Array<any>;
	ready(): boolean;
	get(): OutType;
	set(value: NonNullable<Status<InType>>);
	private set_(value: InType);
	addError(error: any);
}



/**
 * provides the status of the event, e.g. is it ready, or an error has occured
 * events are cleared every pass off of the transaction, up or down
 * events are different than behaviours the contain a queue of values
 * @template T
 * @implements {recoil.frp.Status}
 * @param {boolean} generator if true this is only clears after up event
 * @param {Array<T>=} opt_values
 * @constructor
 *
 */


export class EStatus<Type> implements Status<Type,Array<Type>> {
	private errors_: NonNullable<Array>;
	private values_: Array<Type>;
	private generator_: boolean;
	constructor(generator: boolean, opt_values:  = []) {
		this.generator_ = generator;
		this.errors_ = [];
		this.values_ = opt_values;
	}
	/**
	 */
	errors(): NonNullable<Array> {
		return this.errors_;
	}

	/**
	 * events always good
	 * @return {boolean}
	 */
	good() : boolean {
		return true;
	};

	/**
	 * creates a not ready event
	 * if  generator is true this is only clears after up event
	 */
	static notReady(generator: boolean): NonNullable<EStatus> {
		return new EStatus(generator);
	}

	addError(error: any) {
		this.errors_.push(error);
	}

	
	ready(): boolean {
		return true;
	}


	get() : Array<Type>  {
		return this.values_;
	};

	addValue (value : Type) : EStatus<Type> {
		let values = [...this.values_];
		values.push(value);
		return new EStatus<Type>(this.generator_, values);

	};
	
	set(value:Type): EStatus<T> {
		
		this.values_.push(value);
		return this;
	}

};







/**
 * @param {?} value
 * @private
 */
recoil.frp.EStatus.prototype.set_ = function(value) {
    for (var i = 0; i < value.length; i++) {
        this.values_.push(value[i]);
    }
};

/**
 * combine this error and another to get a result
 *
 * @param {!recoil.frp.Status} other
 */
recoil.frp.EStatus.prototype.merge = function(other) {
    this.errors_ = goog.array.concat(this.errors_, other.errors());
};
/**
 * @private
 * @param {!recoil.frp.TraverseDirection} dir
 */
recoil.frp.EStatus.prototype.clear_ = function(dir) {
    if (dir === Direction_.UP || !this.generator_) {
        this.errors_ = [];
        this.values_ = [];
    }
};
/**
 *
 * provides the status of the behaviour, e.g. is it ready, or an error occured
 */
export class BStatus<T> implements Status<T,T> {
	private errors_: Array<any>;
	private ready_: boolean;
	private value: T;
	
	constructor(initial : T | undefined) {
		this.errors_ = [];
		/** @type {boolean}
			@private*/
		this.ready_ = true;
		this.value_ = initial;
		
	};


	static notReady<T>() : BStatus<T> {
		let res = new BStatus<T>(undefined);
		res.ready_ = false;
		return res;
	}

	static errors(errors: Array<any>) {
		let res = new BStatus(undefined);
		res.ready_ = true;
		res.errors_ = errors;
		return res;
	}


	/**
	 * combine this error and another to get a result
	 *
	 */
	merge(other : Status) {
		if (!other || !other.errors) {
			console.log('merging with non error');
		}
		if (!(other.errors instanceof Function)) {
			console.log('merging with non-status');
		}
		this.errors_ = this.errors_.concat(other.errors());
		this.ready_ = this.ready_ && ((other instanceof EStatus) || other.ready());
	};
	
	/**
	 * set the value of the status
	 */
	set(val : T) : Status<T> {
		this.value_ = val;
		return this;
	};
	

	private set_(val : T | undefined) {
		this.value_ = val;
	};

	/**
	 * @return {T}
	 */
	get() : T {
		return this.value_;
	};

	ready(): boolean {
		return this.ready_;
	}

	good() {
		return this.ready_ && this.errors_.length === 0;
	}
	
	/**
	 * @return  {!Array<*>} current errors
	 */
	errors() {
		return this.errors_;
	}
	addError(error: any) {
		this.errors_.push(error);
	}
}
private class Direction_ {

	/**
	 * Up is from providers to behaviour
	 *
	 * @final
	 */
	static const UP = new TraverseDirection(
		'up',
		function(behaviour : NonNullable<Behaviour>, providers: BehaviourList, dependents: BehaviourList, nextItr : ProviderInfoList) : BehaviourList {
			var oldVal = behaviour.val_;
			let getDirty = Direction_.getDirtyDown;
			
			var params = [];
			// TODO put a loop around this so we get all events, take care if we clear the events
        // other behaviours may not get the events so we have to probably queue them unless
			// we consider an event as always a seqenence of events, then the lift just has to deal
			// with them this may allow more power to the function, alternatively events could just have
			// a sequence associated with them you only get one at a time, but this could be delt with
			// outside the engine xxx
			providers.forEach(function(b) {
				params.push(b.metaGet());
			});
			var oldDirty = getDirty(behaviour.providers_);
			var newVal;
			
			if (behaviour.dirtyDown_) {
				// do nothing here calulationg here is pointless since we need to recalc anyway
				// but ensure we calculate it next phase,
				
				// we have to temporaryily set value back
				newVal = behaviour.val_;
				nextItr.push({behaviour: behaviour, force: true});
				
				if (behaviour.dirtyUp_) {
					return [];
				}
			}
			else {
				newVal = behaviour.calc_.apply(behaviour, params);
				if (!newVal) {
					console.log('ERROR newVal should be status');
					behaviour.calc_.apply(behaviour, params);
				}
			}
			
			let newDirty = getDirty(behaviour.providers_);
			for (let prov of newDirty) {
				if (!oldDirty.has(prov)) {
					nextItr.push({behaviour: prov, force: false});
				}
			}
			var res = [];
			if (behaviour.dirtyUp_ && recoil.util.isEqual(behaviour.dirtyUpOldValue_, newVal)) {
				if (behaviour.dirtyUpOldValue_ === undefined) {
					console.error('SETTING UNDEFINED 2');
				}
				if (dependents) {
					for (var i = 0; i < dependents.length; i++) {
						var d = dependents[i];
						if (d.notifyReset_) {
							res.push(d);
						}
					}
				}
				
				behaviour.val_ = behaviour.dirtyUpOldValue_;
			} else if (behaviour.dirtyUp_ || !recoil.util.isEqual(oldVal, newVal)) {
				if (newVal === undefined) {
					console.error('SETTING UNDEFINED 2');
				}
				behaviour.val_ = newVal;
				res = dependents;
			}
			behaviour.dirtyUpOldValue_ = null;
			behaviour.dirtyUp_ = false;
			return res;
		}, function(a, b) {
			if (b == undefined || a == undefined) {
				console.log('undefined');
			}
			return Frp.compareSeq_(a.seq_, b.seq_);
		});

	/**
	 * Down is from behaviour to providers
	 *
	 * @final
	 */
	static const DOWN = new TraverseDirection(
    'down',
		(behaviour:NonNullable<Behaviour>, providers:BehaviourList, dependants:BehaviourList, nextItr: ProviderInfoList): BehaviourList => {
			
			var getDirty = Direction_.getDirtyDown;
			var changedDirty = [];
			if (behaviour.dirtyDown_) {
				let oldDirty = getDirty(behaviour.providers_);
				let args = [behaviour.val_];
				for (var i = 0; i < behaviour.providers_.length; i++) {
					args.push(behaviour.providers_[i]);
				}
				try {
					behaviour.inv_.apply(behaviour, args);
				}
				catch (e) {
					console.error('error setting', e);
				}
				let newDirty = getDirty(behaviour.providers_);
				
				
				for (let prov of newDirty) {
					if (!oldDirty.has(prov)) {
						changedDirty.push(prov);
					}
					
				}
				behaviour.dirtyDown_ = false;
			}
			
			return changedDirty;
		}, (a, b) => {
			return compareSeq_(b.seq_, a.seq_);
			
		});

	/**
	 * a function to get dirty down providers, this is useful inorder to see what values have been set
	 * in a callback
	 */
	static getDirtyDown(dependants: NonNullable<Array<NonNullable<Behaviour>>>) : Set<Behaviour> {
		var res = new Set();
		for (var i = 0; i < dependants.length; i++) {
			if (dependants[i].dirtyDown_) {
				res.add(dependants[i]);
			}
		}
		return res;
	}
}	

/**
 *
 * @constructor
 * @template T
 */
export class Behaviour<T> {
	private frp_: Frp;
	private notifyReset_: boolean;
	private seq_: BehaviourId;
	
	constructor(
		frp:Frp,
		value:NonNullable<Status<T>>,
		calc: (...) => T = undefined,
		inverse:(T) => void = undefined,
		sequence: BehaviourId,
		providers: Array<Behaviour>) {
		

		this.notifyReset_ = false; // notify any dependants if this changes back to the value it was after a set
		
		let  myValue = value;
		
		if (value === undefined) {
			console.log('SETTING UNDEFINED 3');
		}
		
		this.val_ = value;
		this.calc_ = calc || function() {
			return myValue;
		};
		if (!(this.calc_ instanceof Function)) {
			throw new Error('calc not function');
		}
		
		this.inv_ = inverse || function(newVal) {
			myValue = newVal;
		};
		
		if (!(this.inv_ instanceof Function)) {
			throw new Error('inverse not function');
		}
		
		// we have called set on this behaviour and we need to recalculate
		// all our dependants (maybe)
		this.dirtyUp_ = false;
		// this is value that was calculated before we set the new value
		this.dirtyUpOldValue_ = null;
		// we have set the value via metaSet and we need to inverse calculate
		this.dirtyDown_ = false;
		this.refs_ = {};
		this.seq_ = sequence;
		/**
		 * @type {string}
		 * @private
		 */
		this.origSeq_ = this.seq_;
		this.accessors_ = 0;
		if (providers) {
			providers.forEach(function(p) {
				if (! (p instanceof Behaviour)) {
					throw new Error('provider not a behaviour');
				}
			});
		}
		this.refListeners_ = [];
		this.providers_ = providers || [];

		//    this.quickLoopCheck_();
		//    this.checkProvidersBefore_();
		
	}

	/**
	 * the resulting behaviour will ignore all set
	 */
	noInverseB() : Behaviour<T> {
		return this.frp_.liftB(v => v, this);
	};

	/**
	 * used for debugger gets the dependants of this behaviour
	 */
	getDependants() : Array<NonNullable<Behaviour>> {
		return this.frp_.tm().dependancyMap_.get(this.seq_);
	}
	
	/**
	 * allows naming of behaviours for debugging
	 */
	setName(name: string): NonNullable<Behaviour<T>> {
		this.name_ = name;
		return this;
	}
	

	/**
	 * allows naming of behaviours for debugging
	 */
	getName(): string {
		return this.name_;
	}


	/**
	 * for debugging this keeps track of the original functions
	 * @template T
	 */
	nameFunc(calc: (...) => T, inv: (T) => void ): Behaviour<T> {
		this.srcCalc_ = calc;
		this.srcInv_ = inv;
		return this;
	}
	good() : boolean {
		return this.metaGet().good();
	};
	
	/**
	 *  this is unique cannot be cloned
	 */
	clone(): Behaviour<T> {
		return this;
	}
	loopCheck(path : Set<NonNullable<Behaviour>>) {
		if (path.has(this) !== undefined) {
			throw new recoil.exception.LoopDetected();
		}
		path = new Set(path);
		path.add(this);
		
		for (var i = 0; i < this.providers_.length; i++) {
			this.providers_[i].loopCheck(path);
		}
		
	}

	/**
	 * utility function to ensures all our providers are before us
	 * this is not called but may be useful for debugging purposes in the future
	 */
	private checkProvidersBefore_ () {
		let comp = Direction_.UP.heapComparator();
		for (let i = 0; i < this.providers_.length; i++) {
			var prov = this.providers_[i];
			if (comp(this, prov) <= 0) {
				throw new Error('provider not before');
			}
		}
	};
	/**
	 * loopCheck is a bit slow when it comes to large amounts of
	 * items this is a quicker version that assumes all the providers
	 * do not have any loops so the only loop that can be introduced must point to source
	 */
	private quickLoopCheck_() {
		var stack = [];
		var seen : Set<Behaviour> = new Set();
		
		for (var i = 0; i < this.providers_.length; i++) {
			stack.push(this.providers_[i]);
		}
		
		while (stack.length > 0) {
			var cur = stack.pop();
			if (cur === this) {
				throw new recoil.exception.LoopDetected();
			}
			if (seen.has(cur.seq)) {
				continue;
			}
			seen.add(cur);
			for (i = 0; i < cur.providers_.length; i++) {
				stack.push(cur.providers_[i]);
			}
		}


	}
	
	/**
	 * deprecated this since we can just use a map behaviours now
	 */
	getUniqId() : string {
		return this.origSeq_.join('.');
	};


	/**
	 * a utility function to print out an frp node when it changes
	 * @template T
	 */
	debug(name:string) : NonNullable<Behaviour<T>> {
		let behaviour = this;
		
		let getDebug = (metaV) => {
			if (metaV.good()) {
				var val = metaV.get();
				if (val && val.toDebugObj) {
					return val.toDebugObj();
				}
				else {
					return val;
				}
			}
			return metaV;
		};
		
		return behaviour.frp().metaLiftBI(
			function():T {
				if (behaviour.metaGet().good()) {
                    console.log(name, 'calc', getDebug(behaviour.metaGet()));
				}
				else {
					console.log(name, 'calc (not good)', behaviour.metaGet());
				}
				return behaviour.metaGet();
			},
			function(val: T) {
				console.log(name, 'inv', getDebug(val));
				
				behaviour.metaSet(val);
			}, behaviour).setName(name + 'metaLiftBI');
	}
	
	/**
	 * return the associated frp engine
	 */
	frp(): Frp {
		return this.frp_;
	}
	/**
	 * this adds a listener when the that behaviours come in and out of use
	 * it calls the callback with true when it goes into use and false when it stops being used
	 *
	 */
	refListen(callback: (hasListeners: boolean) => void) {
		this.refListeners_.push(callback);
	}

	private getTm_ = function() {
		return this.frp_.transactionManager_;
	};
	/**
	 * @private
	 * @param {boolean} hasRef
	 */
	private fireRefListeners_(hasRef) {
		var tm = this.getTm_();
		if (tm && tm.todoRefs_) {
			var myTodo = tm.todoRefs_.get(this)
			if (myTodo) {
				myTodo.end = hasRef;
			}
			else {
				tm.todoRefs_.set(this) {b: this, start: hasRef, end: hasRef};
			}
			return;
		}
    // since we can't get rid of a
		var len = this.refListeners_.length;
		for (var l = 0; l < this.refListeners_.length; l++) {
			// only fire if hasRef === this.hasRef()
			// if we commiting a transaction then we should really schedule this
			// do this by putting it in a map and firing at the end if  hasRef === this.hasRef()
			// also stop this from being re-entrant
			this.refListeners_[l](hasRef);
		}
		if (len !== this.refListeners_.length) {
			console.error('ref length changed');
		}

	}
	
	/**
	 * increases the reference count
	 * @return {boolean} true if count was zero
	 *
	 */
	private addRefs_(
		manager: TransactionManager, dependant: Behaviour,
		added:Map<BehaviourId, BehaviourId>>): boolean {
		if (dependant) {
			manager.addProvidersToDependancyMap_(dependant, this);
		}
		

		var hadRefs = this.hasRefs();
		manager.watching_++;
		
		var curRefs = this.refs_[manager.id_];
		
		if (curRefs === undefined) {
			added.set(this.seq_, this);
			this.refs_[manager.id_] = {
				manager: manager,
				count: 1
			};
			for (var i = 0; i < this.providers_.length; i++) {
				this.providers_[i].addRefs_(manager, this, added);
			}
			if (!hadRefs) {
				this.fireRefListeners_(true);
			}
			return true;
		} else {
			this.refs_[manager.id_].count++;
			if (!hadRefs) {
				this.fireRefListeners_(true);
			}
			
			return false;
		}
	}

	/**
	 * decreases the reference count
	 * @return true if count was zero
	 */
	private removeRefs_(
		manager:TransactionManager, dependant:Behaviour,
		removed: Map<BehaviourId, Behaviour>) : boolean {
		
		if (dependant) {
			manager.removeProvidersFromDependancyMap_(dependant, this);
		}
		var curRefs = this.refs_[manager.id_];
		manager.watching_--;

		if (curRefs === undefined || curRefs.count < 1) {
			goog.asserts.assert(false, 'Behaviour ' + this.origSeq_ + ' removing reference when not referenced');
        return false;
		} else if (curRefs.count === 1) {
			delete this.refs_[manager.id_];
			removed.set(this.seq_, this);
			for (var i = 0; i < this.providers_.length; i++) {
				this.providers_[i].removeRefs_(manager, this, removed);
			}
			
			if (!this.hasRefs()) {
				this.fireRefListeners_(false);
			}
			return true;
		} else {
			this.refs_[manager.id_].count--;
			return false;
		}
	}
	
	/**
	 * increases the reference count
	 *
	 * @param  opt_count this can add more than 1 used internally
	 * @return {boolean} true if count was zero
	 *
	 */
	addRef(manager : TransactionManager, opt_count = undefined: number) : boolean {
		var count = opt_count === undefined ? 1 : opt_count;
		var hadRefs = this.hasRefs();
		manager.watching_ += count;
		var curRefs = this.refs_[manager.id_];
		if (curRefs === undefined) {
			this.refs_[manager.id_] = {
				manager: manager,
				count: count
			};
			if (!hadRefs) {
				this.fireRefListeners_(true);
			}
			return true;
		} else {
			this.refs_[manager.id_].count += count;
			if (!hadRefs) {
				this.fireRefListeners_(true);
			}
			
			return false;
		}
	}

	/**
	 * @return {boolean}
	 *
	 */
	hasRefs() : boolean {
		for (var prop in this.refs_) {
			if (this.refs_.hasOwnProperty(prop)) {
				return true;
			}
		}
		return false;
	};
	
	/**
	 * gets the reference count for the transaction manager
	 *
	 */
	getRefs(manager: TransactionManager) : number {
		
		var curRefs = this.refs_[manager.id_];
		if (curRefs === undefined) {
			return 0;
		}
		return curRefs.count;
	}
	
	/**
	 * gets the reference count for the transaction manager
	 *
	 */
	private forEachManager_(callback: (tm: TransactionManager) => void) {

		for (var idx in this.refs_) {
			callback(this.refs_[idx].manager);
		}
	}
	unsafeMetaGet() : Status<T> {
		return this.val_;
	}
	
	/**
	 * @return {T}
	 */
	get() :T {
		var meta = this.metaGet();
		if (meta instanceof BStatus) {
			return meta.get();
		}
		if (meta instanceof EStatus) {
			return meta.get();
		}
		return null;
	};

	metaGet() : Status<T> {
		var hasTm = this.hasRefs();
		var hasProviders = this.providers_.length > 0;
		
		if (!hasTm && hasProviders) {
			// if it has providers then it is not ok to set it with no
			// transaction manager attached
			throw new recoil.exception.NotAttached();
		}

		if (this.accessors_ === 0) {
        // if providers are feeding into me then it is NOT ok just to set the value
			var acc = new recoil.exception.NoAccessors();
			
			throw acc;
		}
		
		return this.val_;
	}

	metaSet(value: Status<T>) {
		var hasTm = this.hasRefs();
		var hasProviders = this.providers_.length > 0;
		
		if (!value) {
			throw new Error('value must be of type status');
		}
		if (!hasTm && hasProviders) {
			// if it has providers then it is not ok to set it with no
			// transaction manager attached
			throw new recoil.exception.NotAttached();
		}
		
		if (hasProviders && this.accessors_ === 0) {
			// if providers are feeding into me then it is NOT ok just to set the value
			var acc = new recoil.exception.NoAccessors();
			
			throw acc;
		}
		
		if (hasTm) {
			var hasTransaction = false;
			this.forEachManager_(function(manager) {
				hasTransaction = hasTransaction || manager.level_ > 0;
			});
			
			if (!hasTransaction) {
				throw new recoil.exception.NotInTransaction();
				
			}
			
		}
		var me = this;
		
		if (!recoil.util.isEqual(value, me.val_)) {
			if (hasTm) {
				if (!me.dirtyUp_) {
					me.dirtyUp_ = true;
					me.dirtyUpOldValue_ = me.val_;
				}
				
				me.dirtyDown_ = true;
				if (value === undefined) {
					console.error('SETTING UNDEFINED');
				}
				me.val_ = value;
				me.forEachManager_(function(manager) {
					manager.addPending_(Direction_.UP, me);
					manager.addPending_(Direction_.DOWN, me);
				});
				
			}
			else {
				// we don't have a transaction we are simple
				// and nobody is listening so just set my value
				// and calculate down
				if (value === undefined) {
					console.error('SETTING UNDEFINED');
				}
				me.val_ = value;
				if (value instanceof BStatus) {
					// events don't do this they get cleared anyway
					// so if you are not in a transaction leave it
					me.inv_(value);
				}
			}
			
		}
		
	}
	/**
	 * used to debug setting
	 */
	debugSet(v: boolean) : Behaviour<T> {
		this.debugSet_ = v;
		return this;
	}
	
	set(value : T) {
		if (this.debugSet_) {
			console.log('setting', value);
		}
		if (this.val_ instanceof EStatus) {
			this.metaSet(this.val_.addValue(value));
		}
		else {
			this.metaSet(new BStatus(value));
		}
	}
}
					   


type BehaviourId = NonNullable<Array<NonNullable<BigInt>>>;
type TodoInfo = {
	b: NonNullable<BehaviourId>;
	start: boolean;
	end: boolean;
}
/**
 * @constructor
 * @param {recoil.frp.Frp} frp
 * s
 */
class TransactionManager {
	private frp_: Frp;
	private providers_: BehaviourList;
	private level_: number;
	private watching_: number;
	private watchers_ : NonNullable<Array<(boolean) => void>>;
	private dependancyMap_: Map<BehaviourId, BehaviourList>;
	private curIndexPrefix_: Array<Array<BigInt>>;
	private curIndexLock_: number;
	private todoRefs_: Map<NonNullable<Behaviour>, TodoInfo>;
	
	constructor(frp : Frp) {
		this.providers_ = [];
		this.level_ = 0;
		this.watching_ = 0;
		this.watchers_ = [];
		this.pending_ = [new recoil.structs.UniquePriorityQueue(recoil.frp.Frp.Direction_.UP.heapComparator()),
						 new recoil.structs.UniquePriorityQueue(recoil.frp.Frp.Direction_.DOWN.heapComparator())];
		this.dependancyMap_ = new Map();
		/**
		 * @private
		 * @type {!recoil.util.Sequence}
		 */
		this.curIndex_ = new recoil.util.Sequence();
		this.curIndexPrefix_ = [[]];
		/**
		 * @type {number}
		 * @private
		 */
		this.curIndexLock_ = 0;
		this.id_ = recoil.frp.TransactionManager.nextId_.next();
		this.frp_ = frp;
	}
	

	/**
	 * used by debugger, returns all pending behaviours in the up direction
	 *
	 */
	getPendingUp (): BehaviourList {
		return this.getPending_(recoil.frp.Frp.Direction_.UP).asArray();
	};
	
	/**
	 * used by debugger, returns all pending behaviours in the down direction
	 *
	 */
	
	getPendingDown(): BehaviourList {
		return this.getPending_(recoil.frp.Frp.Direction_.DOWN).asArray();
	}
	
	/**
	 * for debug purposes returns the number of items we are watching
	 */
	watching() : number {
		return this.watching_;
	}

	/**
	 * @type {!recoil.util.Sequence}
	 * @private
	 */
	private static nextId_ = new recoil.util.Sequence();
	

	/**
	 * this makes all ids generated sub ids of the current one I think this is wrong really we need it to be children of the
	 * behaviour that depends on it TODO
	 *
	 * behaviour the parent behaviour all generated sequences will be less than this
	 */
	nestIds(behaviour:Behaviour<NonNullable<Behaviour>>, callback: () => void) {
		try {
			this.curIndexPrefix_.push(behaviour.seq_);
			callback();
		} finally {
			this.curIndexPrefix_.pop();
		}
	}
	
	/**
	 * stops new ids from being created, this will stop new behaviours from being created in inappropriate places such as
	 * inverse functions
	 *
	 */
	private lockIds_(callback: () => void) {
		try {
			this.curIndexLock_++;
			callback();
		} finally {
			this.curIndexLock_--;
		}
	}
	
	/**
	 * resumes the transaction after it has been paused by the debugger
	 */
	resume() {
		if (this.debugState_) {
			this.debugPaused_ = false;
			var pending = this.debugState_.pendingTrans;
			this.debugState_.pendingTrans = [];
			if (this.transDone_()) {
				this.level_--;
				this.notifyWatchers_(false);
				for (var i = 0; i < pending.length; i++) {
					this.doTrans(pending[i]);
				}
			}
			else {
				for (i = 0; i < pending.length; i++) {
					pending[i]();
				}
			}
		}
	}

	/**
	 * notify the transaction watcher if a transaction is about to start

	 */
	private notifyWatchers_ = function(start: boolean) {
		if (this.level_ === 0) {
			try {
				this.watchers_.forEach(function(cb) { cb(start);});
        }
			catch (e) {
				console.error(e);
			}
		}
	}

	/**
	 * to a transaction nothing should fire until we exit out the top level
	 *
	 * @param {function()} callback
	 * @return {?}
	 */
	
	doTrans<ReturnType>(callback: () => ReturnType) {

		if (this.debugState_) {
			this.debugState_.pendingTrans.push(callback);
			return undefined;
		}
		this.notifyWatchers_(true);
		this.level_++;
		ReturnType res = undefined;
		
		try {
			res = callback();
		} finally {
			var decrement = true;
			try {
				if (this.level_ === 1) {
					decrement = this.transDone_();
				}
			} finally {
				if (decrement) {
					this.level_--;
					this.notifyWatchers_(false);
				}
			}
		}
		return res;
	}

	/**
	 * returns true if we should continue
	 * finishes of the transaction if it at level 1, it performas behaviour tree traversal
	 */
	private transDone_() : boolean {
		let seen = true;
		while (seen) {
			seen = false;
			this.todoRefs_ = this.debugState_ ? this.debugState_.todoRefs_ : new Map();
			var todo;
			try {
                this.propagateAll_();
			}
			finally {
				if (this.debugState_) {
					this.debugState_.todo = this.todoRefs_;
					this.todoRefs_ = undefined;
					return false;
				}
                todo = this.todoRefs_;
				this.todoRefs_ = undefined;
			}
			for (let [k, ref] of todo) {
				seen = true;
				if (ref.start === ref.end) {
                    try {
                        ref.b.fireRefListeners_(ref.start);
                    }
					catch (e) {
						console.error(e);
					}
				}
			}
        }
		return true;
		
	}

	/**
	 * make an array of all providers of behaviour
	 *
	 * @template T
	 * @return {Object<string, recoil.frp.Behaviour> }
	 */
	visit(behaviour: NonNullable<Behaviour>, opt_stopSwitch: boolean = false) : Map<BehaviourId, Behaviour> {
		
		let toDo = [{
			b: behaviour,
			path: {}
		}];
		let visited = new Map();
		
		while (toDo.length > 0) {
			var cur = toDo.pop();
			if (cur.b === null) {
				console.log('behaviour is: ', cur.b);
			}
			
			if (visited.has(cur.b.seq_)) {
				continue;
			}
			visited.set(cur.b.seq_, cur.b);
			
			for (var prov = 0; prov < cur.b.providers_.length; prov++) {
				var provObj = cur.b.providers_[prov];
				// loop check seems to take a long time we shouldn't need it since
				// the constructor of the behaviour checks anyway
				//            if (cur.path[provObj.seqStr_] !== undefined) {
				//                throw new recoil.exception.LoopDetected();
				//            }
				
				//            var newPath = goog.object.clone(cur.path);
				//          newPath[provObj.seqStr_] = provObj;
				toDo.push({
					b: provObj
					//            path: newPath
				});
			}
			
		}
		return visited;

	}

	/**
	 * generates the next index for behaviours
	 */
	nextIndex() : BehaviourId {
		var res = [...this.curIndexPrefix_[this.curIndexPrefix_.length - 1]];
		res.push(this.curIndex_.nextLong());
		return res;
	};
	private getPending_ (direction : TraverseDirection) : UniquePriorityQueue {
		return this.pending_[recoil.frp.Frp.Direction_.UP === direction ? 0 : 1];
	};


	private addPending_(direction: TraverseDirection, behaviour: NonNullable<Behaviour>, opt_propogate = false : boolean) {
		this.getPending_(direction).push(behaviour);
		if (this.level_ === 0 && opt_propogate) {
			this.propagateAll_();
		}
	};
	
	/**
	 * propagate the changes through the FRP tree, until no more changes
	 *
	 */
	private propagateAll_() {
		let pendingDown = this.getPending_(Direction_.DOWN);
		let pendingUp = this.getPending_(Direction_.UP);
		let wasUp = false;
		let wasDown = false;
	
	
		while ((!pendingUp.isEmpty() || !pendingDown.isEmpty() || this.debugState_) && !this.debugPaused_) {
			if ((!pendingDown.isEmpty() && !wasDown && !this.debugState_) || (this.debugState_ && this.debugState_.dir === Direction_.DOWN)) {
				this.propagate_(Direction_.DOWN);
				wasUp = false;
				wasDown = true;
				continue;
			}
			
			if ((!pendingUp.isEmpty() && !wasUp && !this.debugState_) || (this.debugState_ && this.debugState_.dir === Direction_.UP)) {
				this.propagate_(Direction_.UP);
				wasUp = true;
				wasDown = false;
				continue;
			}
			wasUp = false;
			wasDown = false;
		}
	}
	
	/**
	 * propagate the changes through the FRP tree, the direction is if it is going up or down
	 *
	 */
	private propagate_ = function(dir : TraverseDirection) {
		let pendingHeap = this.getPending_(dir);
		let nextPending = this.debugState_ ? this.debugState_.nextPending : new recoil.structs.UniquePriorityQueue(dir.heapComparator());
		let visited = this.debugState_ ? this.debugState_.visited : new Set();
		
		let cur = this.debugState_ ? this.debugState_.cur : pendingHeap.pop();
		let prev = null;
		let me = this;
		let heapComparator = dir.heapComparator();
		while (cur !== undefined) {
			// calculate changed something
			let deps;
			let getDeps;
			let nextItr = [];
			let args;
			
			if (this.debugState_) {
				getDeps = this.debugState_.getDeps;
				nextItr = this.debugState_.nextItr;
				args = this.debugState_.args;
				delete this.debugState_;
				this.debugPaused_ = false;
				this.debugState_ = null;
				
			}
			else {
				let accessFunc = function() {
					if (dir === recoil.frp.Frp.Direction_.UP) {
						me.nestIds(cur, function() {
							deps = dir.calculate(cur, cur.providers_, me.dependancyMap_.get(cur.seq_), nextItr);
						});
					} else {
						me.lockIds_(function() {
							deps = dir.calculate(cur, cur.providers_, me.dependancyMap_.get(cur.seq_), nextItr);
						});
						
					}
				};
				
				args = [accessFunc, cur];
				for (let i = 0; i < cur.providers_.length; i++) {
					args.push(cur.providers_[i]);
				}
				if (this.debugger_ && !this.debugger_.preVisit(cur, dir === recoil.frp.Frp.Direction_.UP)) {
					this.debugPaused_ = true;
					this.debugState_ = {
						args: args,
						visited: visited,
						dir: dir,
						cur: cur,
						nextItr: nextItr,
						nextPending: nextPending,
						// we need this because the deps comes from a different function invocation
						getDeps: function() {return deps;},
						
						pendingTrans: []
                    };
					return;
				}
				getDeps = null;
				
			}
			try {
				recoil.frp.Frp.access.apply(this, args);
				if (getDeps) {
					deps = getDeps();
				}
			}
			finally {
				if (this.debugger_) {
					this.debugger_.postVisit(cur);
				}
			}
			let delayed = false;
			for (i = 0; i < nextItr.length && !delayed; i++) {
				delayed = nextItr[i].force && nextItr[i].behaviour === cur;
			}
			if (!delayed) {
				visited.add(cur);
			}
			let d;
			for (d = 0; deps && d < deps.length; d++) {
				pendingHeap.push(deps[d]);
			}
			
			for (d = 0; d < nextItr.length; d++) {
				let it = nextItr[d];
				let next = pendingHeap.remove(it.behaviour);
				if (next) {
                nextPending.push(next);
				}
				else if (it.force) {
					nextPending.push(it.behaviour);
				}
			}
			prev = cur;
			cur = pendingHeap.pop();
		}
		// put this on for later
		cur = nextPending.pop();
		while (cur !== undefined) {
			pendingHeap.push(cur);
			cur = nextPending.pop();
		}
		this.clearEvents_(dir, visited);
	};
	/**
	 * clear all event data after a pass
	 */
	private clearEvents_(dir: TraverseDirection, visited: Set<NonNullable<Behaviour>>) {
		for (let b of visited) {
			let meta = b.unsafeMetaGet();
			if (meta instanceof EStatus) {
				meta.clear_(dir);
			}
		}
    }

	/**
	 * helper function to add the inverse mapping provider to list of dependants
	 *
	 * @template T
	 * @private
	 * @param {!recoil.frp.Behaviour<T>} b
	 * @param {!recoil.frp.Behaviour<T>=} opt_provider
	 */
	private addProvidersToDependancyMap_ (
		b: NonNullable<Behaviour>,
		opt_provider: Behaviour = undefined) {
		let me = this;
		let doAdd = function(prov) {
			let deps = me.dependancyMap_.get(prov.seq_);
			if (deps === undefined) {
				deps = [b];
				me.dependancyMap_.set(prov.seq_, deps);
			} else {
				if (goog.array.indexOf(deps, b) === -1) {
					deps.push(b);
				}
			}
		};

		if (opt_provider) {
			doAdd(opt_provider);
		}
		else {
			b.providers_.forEach(doAdd);
		}
	};

	/**
	 * helper function to remove the inverse mapping provider to list of dependants
	 */
	removeProvidersFromDependancyMap_(b: Behaviour, opt_provider:Behaviour = null) {
		const doRemove = (prov)  => {
			let deps = this.dependancyMap_.get(prov.seq_);
			if (deps !== undefined) {
				// TODO what about the same provider twice? i think it ok
				// because we always use visited so we only ever count
				// each child once
				for (let i = 0; i < deps.length; i++) {
					if (deps[i] === b) {
						deps.splice(i,1);
						break;
					}
				}
				if (deps.length === 0) {
					delete this.dependancyMap_.delete(prov.seq_);
				}
			}
		};
		if (opt_provider) {
			doRemove(opt_provider);
		}
		else {
			b.providers_.forEach(doRemove);
		}
		
	}
	
	/**
	 * mark the behaviour that it is being used it will now recieve update notifications
	 *
	 */
	attach(behaviour: NonNullable<Behaviour>) {
		if (! (behaviour instanceof Behaviour)) {
			throw 'you can only attach to a behaviour';
		}
		// if this is a keyed behaviour that is not already in the attached
		// behaviours and there already exists a behaviour TODO what if we attached
		// but not at the top level
		
		let newStuff = this.getPending_(recoil.frp.Frp.Direction_.UP);
		this.doTrans(() => {
			let added : Map<BehaviourId,Behaviour> = new Map();
			behaviour.addRefs_(this, null, added);
			for (let [id, b] of added) {
				newStuff.push(b);
			}
		});
		
	};


	/**
	 * update the dependaniece of the behaviour
	 *
	 * @private
	 * @param {!recoil.frp.Behaviour} dependant
	 * @param {...recoil.frp.Behaviour} var_providers
	 */
	private updateProviders_(dependant, var_providers) {
		var count = dependant.getRefs(this);
		var oldProviders = goog.array.clone(dependant.providers_);
		dependant.providers_ = goog.array.clone(arguments);
		dependant.providers_.shift();
		dependant.providers_.forEach(function(v) {
			if (!(v instanceof recoil.frp.Behaviour)) {
				throw new Error('provider not a behaviour in switch for ' + dependant.origSeq_);
			}
		});
		/** @type {recoil.frp.Behaviour} */
		var b;
		
		var me = this;
		var oldProvMap = {};
		var newProvMap = {};
		
		let removed : Map<BehaviourId, Behaviour> = new Map();
		let added: Map<BehaviourId, Behaviour> = new Map();
		
		if (dependant.hasRefs()) {
			for (var i = 0; i < oldProviders.length; i++) {
				oldProvMap[oldProviders[i].seqStr_] = oldProviders[i];
			}
			
			for (i = 0; i < dependant.providers_.length; i++) {
				newProvMap[dependant.providers_[i].seqStr_] = dependant.providers_[i];
			}
			
			
			for (var seq in oldProvMap) {
				if (!newProvMap[seq]) {
					// xxx
					oldProvMap[seq].removeRefs_(this, dependant, removed);
					
				}
			}
			for (seq in newProvMap) {
				if (!oldProvMap[seq]) {
					newProvMap[seq].addRefs_(this, dependant, added);
				}
			}
		}
		
		
		for (let [idx, rem] of removed) {
			let add = added.get(idx);
			if (!added.has(rem)) {
				me.removePending_(rem);
			}
		}
		
		let pending = this.getPending_(recoil.frp.Frp.Direction_.UP);
		for (let [idx, add] of added) {
		rem = removed.get(idx);
			if (!rem) {
				pending.push(add);
			}
		}
		
		
		// if the providers have changed then we need to recalculate the dependant
		// even just the order
		
		if (oldProviders.length !== dependant.providers_.length) {
			pending.push(dependant);
		
		} else {
			for (var i = 0; i < oldProviders.length; i++) {
				if (oldProviders[i] !== dependant.providers_[i]) {
					pending.push(dependant);
					break;
				}
			}
		}
		
		this.ensureProvidersBefore_(dependant, new Set());
		// dependant.checkProvidersBefore_();
		dependant.quickLoopCheck_();
	}
	
	/**
	 * make sure that all providers and providers of those providers have a lower
	 * sequence number than b, this will also re-queue and update the dependancy map
	 * of all providers that have changed
	 *
	 **/
	private ensureProvidersBefore_(b: NonNullable<Behaviour>, visited:Set<BehaviourId>) {
		let  curSeq = b.seq_;
		if (visited.has(b.seq_)) {
			return;
		}
		
		visited.add(b.seq_);
		
		for (var i = 0; i < b.providers_.length; i++) {
			var p = b.providers_[i];
			
			if (compareSeq_(b.seq_, p.seq_) < 0) {
				// not consistent renumber the provider
				visited.add(p.seq_);
				this.changeSequence_(b, p);
				this.ensureProvidersBefore_(p, visited);
			}
		}
	}

	/**
	 * changes the sequence number provider to be less than the sequence number of b
	 * @private
	 * @param {recoil.frp.Behaviour} b
	 * @param {recoil.frp.Behaviour} provider
	 */
	private changeSequence_(b: Behaviour, provider: NonNullable<Provider>) {
		let newSeq;
		this.nestIds(b, () => {
			newSeq = this.nextIndex();
		});
		
		var oldSeq = provider.seq_;
		
		var up = this.getPending_(recoil.frp.Frp.Direction_.UP);
		var down = this.getPending_(recoil.frp.Frp.Direction_.DOWN);
		
		// remove this provider if it has pending changes because they will be out of order
		
		var hadUp = up.remove(provider);
		var hadDown = down.remove(provider);
		
		// change the provider
		provider.seq_ = newSeq;

		// update the dependancy map
		var oldEntry = this.dependancyMap_.get(oldSeq);
		if (oldEntry) {
			this.dependancyMap_.delete(oldSeq);
			this.dependancyMap_.set(provider.seq_, oldEntry);
		}

    // put pending changes back with new sequence number
		if (hadUp) {
			up.push(provider);
		}
		if (hadDown) {
			down.push(provider);
		}
	}
	
	removePending_(behaviour: Behaviour) {
		var up = this.getPending_(Direction_.UP);
		var down = this.getPending_(Direction_.DOWN);
		
		up.remove(behaviour);
		down.remove(behaviour);
	};
	
	/**
	 * mark the behaviour that it is no longer being used it will no longer recieve update notifications
	 *
	 */
	detach(behaviour: NonNullable<Behaviour>) {
		this.doTrans(()  => {
			var removed = {};
			behaviour.removeRefs_(this, null, removed);
			
			for (var idx in removed) {
				// this may not account for 2 thing in the tree pointing to the
				// same thing
				var b = removed[idx];
				b.dirtyDown_ = false;
				this.removePending_(b);
			}
		});
		//    console.log('Detach Watching = ', this.watching_);
	}
}
