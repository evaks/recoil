/**
 * @fileoverview
 * these are lightweight helpers that should not be attached to the element more than once
 */

goog.provide('recoil.ui.HtmlHelper');

goog.require('goog.dom.classlist');
goog.require('recoil.ui.WidgetHelper');

/**
 * @constructor
 * @param {!recoil.ui.WidgetScope} scope gui scope
 */
recoil.ui.HtmlHelper = function(scope) {
    this.scope_ = scope;
};

/**
 * @param {!Element} element
 * @param {!recoil.frp.Behaviour<string>} classesB
 * @return {!recoil.ui.WidgetHelper}
 */
recoil.ui.HtmlHelper.prototype.class = function(element, classesB) {
    var helper = new recoil.ui.WidgetHelper(this.scope_, element, null, function() {
        if (classesB.good()) {
            goog.dom.classlist.set(element, classesB.get());
        }
    });
    helper.attach(classesB);
    return helper;
};


/**
 * @private
 * @param {number} skip number of args to skip
 * @param {string} elType type of element to create
 * @param {!IArrayLike} args
 * @return {!Element}
 */
recoil.ui.HtmlHelper.prototype.createDom_ = function(skip, elType, args) {
    var funcArgs = [elType];
    for (var i = skip; i < args.length; i++) {
        funcArgs.push(args[i]);
    }
    return goog.dom.createDom.apply(null, funcArgs);
};

/**
 * helper function to create make an append function from a create function
 * @template T
 * @param {function(!recoil.frp.Behaviour<T>,(Object|Array<string>|string)=,...(Object|string|Array|NodeList)):!Element} func
 * @param {!IArrayLike} args
 * @return {!Element}
 * @private
 */
recoil.ui.HtmlHelper.prototype.append_ = function(func, args) {
    var funcArgs = [];
    for (var i = 1; i < args.length; i++) {
        funcArgs.push(args[i]);
    }
    var el = func.apply(this, funcArgs);
    goog.dom.append(args[0], el);
    return el;
};

/**
 * @param {!recoil.frp.Behaviour<string>} classesB
 * @param {(Object|Array<string>|string)=} opt_options
 * @param {...(Object|string|Array|NodeList)} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or NodeList,
 *     its elements will be added as childNodes instead.
 * @return {!Element}
 */
recoil.ui.HtmlHelper.prototype.createClassDiv = function(classesB, opt_options, var_args) {
    var div = this.createDom_(1, 'div', arguments);
    this.class(div, classesB);
    return div;
};

/**
 * @param {!Node} parent
 * @param {(Object|Array<string>|string)=} opt_options
 * @param {...(Object|string|Array|NodeList)} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or NodeList,
 *     its elements will be added as childNodes instead.
 * @return {!Element}
 */
recoil.ui.HtmlHelper.prototype.appendDiv = function(parent, opt_options, var_args) {
    var res = this.createDom_(1, 'div', arguments);
    goog.dom.append(parent, res);
    return res;
};
/**
 * @param {!Node} parent
 * @param {!recoil.frp.Behaviour<string>} classesB
 * @param {(Object|Array<string>|string)=} opt_options
 * @param {...(Object|string|Array|NodeList)} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or NodeList,
 *     its elements will be added as childNodes instead.
 * @return {!Element}
 */
recoil.ui.HtmlHelper.prototype.appendClassDiv = function(parent, classesB, opt_options, var_args) {
    return this.append_(this.createClassDiv, arguments);
};
/**
 * @param {!Element} element
 * @param {!recoil.frp.Behaviour<string>} innerHtmlB
 * @return {!recoil.ui.WidgetHelper}
 */
recoil.ui.HtmlHelper.prototype.innerHtml = function(element, innerHtmlB) {
    var helper = new recoil.ui.WidgetHelper(this.scope_, element, null, function() {
        if (innerHtmlB.good()) {
            element.innerHTML = innerHtmlB.get();
        }
        else if (innerHtmlB.metaGet().errors().length > 0) {
            element.innerHTML = innerHtmlB.metaGet().errors().join(',');
        }
    });
    helper.attach(innerHtmlB);
    return helper;
};

/**
 * @param {!Element} element
 * @param {!recoil.frp.Behaviour<string>} innerTextB
 * @return {!recoil.ui.WidgetHelper}
 */
recoil.ui.HtmlHelper.prototype.innerText = function(element, innerTextB) {
    var helper = new recoil.ui.WidgetHelper(this.scope_, element, null, function() {
        if (innerTextB.good()) {
            element.innerText = innerTextB.get();
        }
        else if (innerTextB.metaGet().errors().length > 0) {
            element.innerText = innerTextB.metaGet().errors().join(',');
        }
    });
    helper.attach(innerTextB);
    return helper;
};


/**
 * @param {!recoil.frp.Behaviour<string>} innerHtmlB
 * @param {(Object|Array<string>|string)=} opt_options
 * @param {...(Object|string|Array|NodeList)} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or NodeList,
 *     its elements will be added as childNodes instead.
 * @return {!Element}
 */
recoil.ui.HtmlHelper.prototype.createInnerHtmlDiv = function(innerHtmlB, opt_options, var_args) {
    var div = this.createDom_(1, 'div', arguments);
    this.innerHtml(div, innerHtmlB);
    return div;
};

/**
 * @param {string} type
 * @param {!recoil.frp.Behaviour<string>} innerHtmlB
 * @param {(Object|Array<string>|string)=} opt_options
 * @param {...(Object|string|Array|NodeList)} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or NodeList,
 *     its elements will be added as childNodes instead.
 * @return {!Element}
 */
recoil.ui.HtmlHelper.prototype.createInnerHtmlDom = function(type, innerHtmlB, opt_options, var_args) {
    var div = this.createDom_(2, type, arguments);
    this.innerHtml(div, innerHtmlB);
    return div;
};

/**
 * @param {!Node} parent
 * @param {!recoil.frp.Behaviour<?string>|!recoil.frp.Behaviour<string>} innerHtmlB
 * @param {(Object|Array<string>|string)=} opt_options
 * @param {...(Object|string|Array|NodeList)} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or NodeList,
 *     its elements will be added as childNodes instead.
 * @return {!Element}
 */
recoil.ui.HtmlHelper.prototype.appendInnerHtmlDiv = function(parent, innerHtmlB, opt_options, var_args) {
    return this.append_(this.createInnerHtmlDiv, arguments);
};


/**
 * sets the display to none/undefined depending on {@code showB}
 * @param {!Element} element
 * @param {!recoil.frp.Behaviour<boolean>} showB
 * @return {!recoil.ui.WidgetHelper}
 */
recoil.ui.HtmlHelper.prototype.show = function(element, showB) {
    var orig = element.style.display;
    orig = orig === 'none' ? undefined : orig;
    var helper = new recoil.ui.WidgetHelper(this.scope_, element, null, function() {
        var show = showB.good() && showB.get();
        element.style.display = show ? orig : 'none';
    });
    helper.attach(showB);

    return helper;
};

/**
 * sets the disabled field, I hav called it enabled because I don't like
 * negative logic in code
 * @param {!Element} element
 * @param {!recoil.frp.Behaviour<boolean>} enabledB
 * @return {!recoil.ui.WidgetHelper}
 */
recoil.ui.HtmlHelper.prototype.enabled = function(element, enabledB) {
    var orig = element.style.display;
    orig = orig === 'none' ? undefined : orig;
    var helper = new recoil.ui.WidgetHelper(this.scope_, element, null, function() {
        var disabled = !(enabledB.good() && enabledB.get());
        element.disabled = disabled;
    });
    helper.attach(enabledB);
    return helper;
};


/**
 * @param {!recoil.frp.Behaviour<boolean>} showB
 * @param {(Object|Array<string>|string)=} opt_options
 * @param {...(Object|string|Array|NodeList)} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or NodeList,
 *     its elements will be added as childNodes instead.
 * @return {!Element}
 */
recoil.ui.HtmlHelper.prototype.createShowDiv = function(showB, opt_options, var_args) {
    var div = this.createDom_(1, 'div', arguments);
    this.show(div, showB);
    return div;
};

/**
 * @param {!Node} parent
 * @param {!recoil.frp.Behaviour<boolean>} showB
 * @param {(Object|Array<string>|string)=} opt_options
 * @param {...(Object|string|Array|NodeList)} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or NodeList,
 *     its elements will be added as childNodes instead.
 * @return {!Element}
 */
recoil.ui.HtmlHelper.prototype.appendShowDiv = function(parent, showB, opt_options, var_args) {
    return this.append_(this.createShowDiv, arguments);
};


/**
 * like goog.dom.createDom except it will handle widget, children
 *
 * @param {string} tagName Tag to create.
 * @param {(Object|Array<string>|string)=} opt_attributes If object, then a map
 *     of name-value pairs for attributes. If a string, then this is the
 *     className of the new element. If an array, the elements will be joined
 *     together as the className of the new element.
 * @param {...(Object|string|Array|NodeList)} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or NodeList,
 *     its elements will be added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 */

recoil.ui.HtmlHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
    var parent = goog.dom.createDom(tagName, opt_attributes);
    function childHandler(child) {
        if (child) {
            if (child.getComponent) {
                var comp = child.getComponent();
                comp.render(parent);
            }
            else {
                parent.appendChild(
                goog.isString(child) ? goog.dom.createTextNode(child) : child);
            }
        }
    }
    for (var i = 2; i < arguments.length; i++) {
        var arg = arguments[i];
        if (goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
            // If the argument is a node list, not a real array, use a clone,
            // because forEach can't be used to mutate a NodeList.
            goog.array.forEach(
                goog.dom.isNodeList(arg) ? goog.array.toArray(arg) : arg,
                childHandler);
        } else {
            childHandler(arg);
        }
    }
    return parent;
};

/**
 * @param {!Element} element
 * @param {!recoil.frp.Behaviour<string>} callbackB
 */
recoil.ui.HtmlHelper.prototype.onClick = function(element, callbackB) {
    var helper = new recoil.ui.WidgetHelper(this.scope_, element, this, function(helper) {

    });
    var frp = this.scope_.getFrp();
    goog.events.listen(element, goog.events.EventType.CLICK, function(e) {

        frp.accessTrans(function() {
            if (callbackB.good()) {
                callbackB.set(e);
            }
        }, callbackB);
    });
    helper.attach(callbackB);

};
