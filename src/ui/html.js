/**
 * @fileoverview
 * these are lightweight helpers that should not be attached to the element more than once
 */

goog.provide('recoil.ui.HtmlHelper');

goog.require('goog.dom.classlist');

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
 * @param {!number} skip number of args to skip
 * @param {!string} elType type of element to create
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
 * @param {function(!recoil.frp.Behaviour<string>,(Object|Array<string>|string)=,...(Object|string|Array|NodeList)):!Element} func
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
    });
    helper.attach(innerHtmlB);
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
 * @param {!Node} parent
 * @param {!recoil.frp.Behaviour<string>} innerHtmlB
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
 * @param {!recoil.frp.Behaviour<!boolean>} showB
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
 * @param {!recoil.frp.Behaviour<!boolean>} showB
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
 * @param {!recoil.frp.Behaviour<!boolean>} showB
 * @param {(Object|Array<string>|string)=} opt_options
 * @param {...(Object|string|Array|NodeList)} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or NodeList,
 *     its elements will be added as childNodes instead.
 * @return {!Element}
 */
recoil.ui.HtmlHelper.prototype.appendShowDiv = function(parent, showB, opt_options, var_args) {
    return this.append_(this.createShowDiv, arguments);
};
