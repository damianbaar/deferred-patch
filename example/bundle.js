(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var h = require('virtual-dom/h')
  , diff = require('virtual-dom/diff')
  , patch = require('virtual-dom/patch')
  , createElement = require('virtual-dom/create-element')

var defferedPatch = require('../index')

var patches
  , tree = h('span')
  , rootNode = createElement(tree)

document.body.appendChild(rootNode)

var busy = false

var update = function(newtree) {
    if(busy) return false

    patches = diff(tree, newtree)

    busy = true

    var a = patch(rootNode, patches, { patch: defferedPatch })

    a.then(function(d) {
      console.log('### render', d)
      rootNode = d
      busy = false
    })

    tree = newtree
  }

var Velocity = require('velocity-animate')

var onEnter = function(delay) {
  return function(node, props) {
    console.log('onEnter', props, node)
    return new Promise(function(ok, err) {
      node.style.opacity = 0
      ok()
      Velocity(node, 
        { opacity: 1, backgroundColor: props.color, width: props.data }
      // , { complete: ok }
      )
    })
  }
}

var onUpdate = function(delay) {
  return function(node, props) {
    console.log('onUpdate', node, props)
    debugger
    return new Promise(function(ok, err) {
      ok()
      Velocity(node, 
        { backgroundColor: props.new.color, width: props.new.data }
      // , { complete: ok }
      )
    })
  }
}

var onExit = function(delay) {
  return function(node) {
    //temp workaroudn
    if(!document.contains(node)) return Promise.resolve()
    console.log('onExit', node)
    return new Promise(function(ok, err) {
      // ok()
      Velocity(node, 
        { opacity: 0, color: '#FF0000', width: 0 }
      , { complete: ok }
      )
    })
  }
  }


var lifecycle = function(custom) {
  return Object.assign(custom || {}, {    
      onEnter: onEnter(100)
    , onUpdate: onUpdate(100)
    , onExit: onExit(100)
  })
}

var c = 0

function run() {
  var root = h('span', lifecycle())
    , kids = []

  for (var i = 0; i < 5;i ++) {
     var color = '#' + Math.floor(Math.random()*16777215).toString(16)
     kids.push(h('div.bar', lifecycle({key:i, data: 50 + 50*i*Math.random(), color: color}), ['Bar'+i]))
  }

  if (c % 2 == 0)
    kids.push(h('div.bar', lifecycle({data: 100 + 50*Math.random(), color: '#FF0000'}), ['Bar'+i]))

  redraw = h('button', {key:'redraw', 'onclick': function() { run(c++) }}, ['redraw'])

  root.children = [h('div.container', kids), redraw]
  update(root)
}

run(c++)

},{"../index":2,"velocity-animate":9,"virtual-dom/create-element":10,"virtual-dom/diff":11,"virtual-dom/h":12,"virtual-dom/patch":13}],2:[function(require,module,exports){
module.exports = require('./vdom/patch')

},{"./vdom/patch":38}],3:[function(require,module,exports){
/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
module.exports = (function split(undef) {

  var nativeSplit = String.prototype.split,
    compliantExecNpcg = /()??/.exec("")[1] === undef,
    // NPCG: nonparticipating capturing group
    self;

  self = function(str, separator, limit) {
    // If `separator` is not a regex, use `nativeSplit`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
      return nativeSplit.call(str, separator, limit);
    }
    var output = [],
      flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
      (separator.sticky ? "y" : ""),
      // Firefox 3+
      lastLastIndex = 0,
      // Make `global` and avoid `lastIndex` issues by working with a copy
      separator = new RegExp(separator.source, flags + "g"),
      separator2, match, lastIndex, lastLength;
    str += ""; // Type-convert
    if (!compliantExecNpcg) {
      // Doesn't need flags gy, but they don't hurt
      separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
    }
    /* Values for `limit`, per the spec:
     * If undefined: 4294967295 // Math.pow(2, 32) - 1
     * If 0, Infinity, or NaN: 0
     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
     * If other: Type-convert, then use the above rules
     */
    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
    limit >>> 0; // ToUint32(limit)
    while (match = separator.exec(str)) {
      // `separator.lastIndex` is not reliable cross-browser
      lastIndex = match.index + match[0].length;
      if (lastIndex > lastLastIndex) {
        output.push(str.slice(lastLastIndex, match.index));
        // Fix browsers whose `exec` methods don't consistently return `undefined` for
        // nonparticipating capturing groups
        if (!compliantExecNpcg && match.length > 1) {
          match[0].replace(separator2, function() {
            for (var i = 1; i < arguments.length - 2; i++) {
              if (arguments[i] === undef) {
                match[i] = undef;
              }
            }
          });
        }
        if (match.length > 1 && match.index < str.length) {
          Array.prototype.push.apply(output, match.slice(1));
        }
        lastLength = match[0].length;
        lastLastIndex = lastIndex;
        if (output.length >= limit) {
          break;
        }
      }
      if (separator.lastIndex === match.index) {
        separator.lastIndex++; // Avoid an infinite loop
      }
    }
    if (lastLastIndex === str.length) {
      if (lastLength || !separator.test("")) {
        output.push("");
      }
    } else {
      output.push(str.slice(lastLastIndex));
    }
    return output.length > limit ? output.slice(0, limit) : output;
  };

  return self;
})();

},{}],4:[function(require,module,exports){
'use strict';

var OneVersionConstraint = require('individual/one-version');

var MY_VERSION = '7';
OneVersionConstraint('ev-store', MY_VERSION);

var hashKey = '__EV_STORE_KEY@' + MY_VERSION;

module.exports = EvStore;

function EvStore(elem) {
    var hash = elem[hashKey];

    if (!hash) {
        hash = elem[hashKey] = {};
    }

    return hash;
}

},{"individual/one-version":7}],5:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"min-document":39}],6:[function(require,module,exports){
(function (global){
'use strict';

/*global window, global*/

var root = typeof window !== 'undefined' ?
    window : typeof global !== 'undefined' ?
    global : {};

module.exports = Individual;

function Individual(key, value) {
    if (key in root) {
        return root[key];
    }

    root[key] = value;

    return value;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],7:[function(require,module,exports){
'use strict';

var Individual = require('./index.js');

module.exports = OneVersion;

function OneVersion(moduleName, version, defaultValue) {
    var key = '__INDIVIDUAL_ONE_VERSION_' + moduleName;
    var enforceKey = key + '_ENFORCE_SINGLETON';

    var versionValue = Individual(enforceKey, version);

    if (versionValue !== version) {
        throw new Error('Can only have one copy of ' +
            moduleName + '.\n' +
            'You already have version ' + versionValue +
            ' installed.\n' +
            'This means you cannot install version ' + version);
    }

    return Individual(key, defaultValue);
}

},{"./index.js":6}],8:[function(require,module,exports){
"use strict";

module.exports = function isObject(x) {
	return typeof x === "object" && x !== null;
};

},{}],9:[function(require,module,exports){
/*! VelocityJS.org (1.2.3). (C) 2014 Julian Shapiro. MIT @license: en.wikipedia.org/wiki/MIT_License */

/*************************
   Velocity jQuery Shim
*************************/

/*! VelocityJS.org jQuery Shim (1.0.1). (C) 2014 The jQuery Foundation. MIT @license: en.wikipedia.org/wiki/MIT_License. */

/* This file contains the jQuery functions that Velocity relies on, thereby removing Velocity's dependency on a full copy of jQuery, and allowing it to work in any environment. */
/* These shimmed functions are only used if jQuery isn't present. If both this shim and jQuery are loaded, Velocity defaults to jQuery proper. */
/* Browser support: Using this shim instead of jQuery proper removes support for IE8. */

;(function (window) {
    /***************
         Setup
    ***************/

    /* If jQuery is already loaded, there's no point in loading this shim. */
    if (window.jQuery) {
        return;
    }

    /* jQuery base. */
    var $ = function (selector, context) {
        return new $.fn.init(selector, context);
    };

    /********************
       Private Methods
    ********************/

    /* jQuery */
    $.isWindow = function (obj) {
        /* jshint eqeqeq: false */
        return obj != null && obj == obj.window;
    };

    /* jQuery */
    $.type = function (obj) {
        if (obj == null) {
            return obj + "";
        }

        return typeof obj === "object" || typeof obj === "function" ?
            class2type[toString.call(obj)] || "object" :
            typeof obj;
    };

    /* jQuery */
    $.isArray = Array.isArray || function (obj) {
        return $.type(obj) === "array";
    };

    /* jQuery */
    function isArraylike (obj) {
        var length = obj.length,
            type = $.type(obj);

        if (type === "function" || $.isWindow(obj)) {
            return false;
        }

        if (obj.nodeType === 1 && length) {
            return true;
        }

        return type === "array" || length === 0 || typeof length === "number" && length > 0 && (length - 1) in obj;
    }

    /***************
       $ Methods
    ***************/

    /* jQuery: Support removed for IE<9. */
    $.isPlainObject = function (obj) {
        var key;

        if (!obj || $.type(obj) !== "object" || obj.nodeType || $.isWindow(obj)) {
            return false;
        }

        try {
            if (obj.constructor &&
                !hasOwn.call(obj, "constructor") &&
                !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                return false;
            }
        } catch (e) {
            return false;
        }

        for (key in obj) {}

        return key === undefined || hasOwn.call(obj, key);
    };

    /* jQuery */
    $.each = function(obj, callback, args) {
        var value,
            i = 0,
            length = obj.length,
            isArray = isArraylike(obj);

        if (args) {
            if (isArray) {
                for (; i < length; i++) {
                    value = callback.apply(obj[i], args);

                    if (value === false) {
                        break;
                    }
                }
            } else {
                for (i in obj) {
                    value = callback.apply(obj[i], args);

                    if (value === false) {
                        break;
                    }
                }
            }

        } else {
            if (isArray) {
                for (; i < length; i++) {
                    value = callback.call(obj[i], i, obj[i]);

                    if (value === false) {
                        break;
                    }
                }
            } else {
                for (i in obj) {
                    value = callback.call(obj[i], i, obj[i]);

                    if (value === false) {
                        break;
                    }
                }
            }
        }

        return obj;
    };

    /* Custom */
    $.data = function (node, key, value) {
        /* $.getData() */
        if (value === undefined) {
            var id = node[$.expando],
                store = id && cache[id];

            if (key === undefined) {
                return store;
            } else if (store) {
                if (key in store) {
                    return store[key];
                }
            }
        /* $.setData() */
        } else if (key !== undefined) {
            var id = node[$.expando] || (node[$.expando] = ++$.uuid);

            cache[id] = cache[id] || {};
            cache[id][key] = value;

            return value;
        }
    };

    /* Custom */
    $.removeData = function (node, keys) {
        var id = node[$.expando],
            store = id && cache[id];

        if (store) {
            $.each(keys, function(_, key) {
                delete store[key];
            });
        }
    };

    /* jQuery */
    $.extend = function () {
        var src, copyIsArray, copy, name, options, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        if (typeof target === "boolean") {
            deep = target;

            target = arguments[i] || {};
            i++;
        }

        if (typeof target !== "object" && $.type(target) !== "function") {
            target = {};
        }

        if (i === length) {
            target = this;
            i--;
        }

        for (; i < length; i++) {
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    if (target === copy) {
                        continue;
                    }

                    if (deep && copy && ($.isPlainObject(copy) || (copyIsArray = $.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && $.isArray(src) ? src : [];

                        } else {
                            clone = src && $.isPlainObject(src) ? src : {};
                        }

                        target[name] = $.extend(deep, clone, copy);

                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        return target;
    };

    /* jQuery 1.4.3 */
    $.queue = function (elem, type, data) {
        function $makeArray (arr, results) {
            var ret = results || [];

            if (arr != null) {
                if (isArraylike(Object(arr))) {
                    /* $.merge */
                    (function(first, second) {
                        var len = +second.length,
                            j = 0,
                            i = first.length;

                        while (j < len) {
                            first[i++] = second[j++];
                        }

                        if (len !== len) {
                            while (second[j] !== undefined) {
                                first[i++] = second[j++];
                            }
                        }

                        first.length = i;

                        return first;
                    })(ret, typeof arr === "string" ? [arr] : arr);
                } else {
                    [].push.call(ret, arr);
                }
            }

            return ret;
        }

        if (!elem) {
            return;
        }

        type = (type || "fx") + "queue";

        var q = $.data(elem, type);

        if (!data) {
            return q || [];
        }

        if (!q || $.isArray(data)) {
            q = $.data(elem, type, $makeArray(data));
        } else {
            q.push(data);
        }

        return q;
    };

    /* jQuery 1.4.3 */
    $.dequeue = function (elems, type) {
        /* Custom: Embed element iteration. */
        $.each(elems.nodeType ? [ elems ] : elems, function(i, elem) {
            type = type || "fx";

            var queue = $.queue(elem, type),
                fn = queue.shift();

            if (fn === "inprogress") {
                fn = queue.shift();
            }

            if (fn) {
                if (type === "fx") {
                    queue.unshift("inprogress");
                }

                fn.call(elem, function() {
                    $.dequeue(elem, type);
                });
            }
        });
    };

    /******************
       $.fn Methods
    ******************/

    /* jQuery */
    $.fn = $.prototype = {
        init: function (selector) {
            /* Just return the element wrapped inside an array; don't proceed with the actual jQuery node wrapping process. */
            if (selector.nodeType) {
                this[0] = selector;

                return this;
            } else {
                throw new Error("Not a DOM node.");
            }
        },

        offset: function () {
            /* jQuery altered code: Dropped disconnected DOM node checking. */
            var box = this[0].getBoundingClientRect ? this[0].getBoundingClientRect() : { top: 0, left: 0 };

            return {
                top: box.top + (window.pageYOffset || document.scrollTop  || 0)  - (document.clientTop  || 0),
                left: box.left + (window.pageXOffset || document.scrollLeft  || 0) - (document.clientLeft || 0)
            };
        },

        position: function () {
            /* jQuery */
            function offsetParent() {
                var offsetParent = this.offsetParent || document;

                while (offsetParent && (!offsetParent.nodeType.toLowerCase === "html" && offsetParent.style.position === "static")) {
                    offsetParent = offsetParent.offsetParent;
                }

                return offsetParent || document;
            }

            /* Zepto */
            var elem = this[0],
                offsetParent = offsetParent.apply(elem),
                offset = this.offset(),
                parentOffset = /^(?:body|html)$/i.test(offsetParent.nodeName) ? { top: 0, left: 0 } : $(offsetParent).offset()

            offset.top -= parseFloat(elem.style.marginTop) || 0;
            offset.left -= parseFloat(elem.style.marginLeft) || 0;

            if (offsetParent.style) {
                parentOffset.top += parseFloat(offsetParent.style.borderTopWidth) || 0
                parentOffset.left += parseFloat(offsetParent.style.borderLeftWidth) || 0
            }

            return {
                top: offset.top - parentOffset.top,
                left: offset.left - parentOffset.left
            };
        }
    };

    /**********************
       Private Variables
    **********************/

    /* For $.data() */
    var cache = {};
    $.expando = "velocity" + (new Date().getTime());
    $.uuid = 0;

    /* For $.queue() */
    var class2type = {},
        hasOwn = class2type.hasOwnProperty,
        toString = class2type.toString;

    var types = "Boolean Number String Function Array Date RegExp Object Error".split(" ");
    for (var i = 0; i < types.length; i++) {
        class2type["[object " + types[i] + "]"] = types[i].toLowerCase();
    }

    /* Makes $(node) possible, without having to call init. */
    $.fn.init.prototype = $.fn;

    /* Globalize Velocity onto the window, and assign its Utilities property. */
    window.Velocity = { Utilities: $ };
})(window);

/******************
    Velocity.js
******************/

;(function (factory) {
    /* CommonJS module. */
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = factory();
    /* AMD module. */
    } else if (typeof define === "function" && define.amd) {
        define(factory);
    /* Browser globals. */
    } else {
        factory();
    }
}(function() {
return function (global, window, document, undefined) {

    /***************
        Summary
    ***************/

    /*
    - CSS: CSS stack that works independently from the rest of Velocity.
    - animate(): Core animation method that iterates over the targeted elements and queues the incoming call onto each element individually.
      - Pre-Queueing: Prepare the element for animation by instantiating its data cache and processing the call's options.
      - Queueing: The logic that runs once the call has reached its point of execution in the element's $.queue() stack.
                  Most logic is placed here to avoid risking it becoming stale (if the element's properties have changed).
      - Pushing: Consolidation of the tween data followed by its push onto the global in-progress calls container.
    - tick(): The single requestAnimationFrame loop responsible for tweening all in-progress calls.
    - completeCall(): Handles the cleanup process for each Velocity call.
    */

    /*********************
       Helper Functions
    *********************/

    /* IE detection. Gist: https://gist.github.com/julianshapiro/9098609 */
    var IE = (function() {
        if (document.documentMode) {
            return document.documentMode;
        } else {
            for (var i = 7; i > 4; i--) {
                var div = document.createElement("div");

                div.innerHTML = "<!--[if IE " + i + "]><span></span><![endif]-->";

                if (div.getElementsByTagName("span").length) {
                    div = null;

                    return i;
                }
            }
        }

        return undefined;
    })();

    /* rAF shim. Gist: https://gist.github.com/julianshapiro/9497513 */
    var rAFShim = (function() {
        var timeLast = 0;

        return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
            var timeCurrent = (new Date()).getTime(),
                timeDelta;

            /* Dynamically set delay on a per-tick basis to match 60fps. */
            /* Technique by Erik Moller. MIT license: https://gist.github.com/paulirish/1579671 */
            timeDelta = Math.max(0, 16 - (timeCurrent - timeLast));
            timeLast = timeCurrent + timeDelta;

            return setTimeout(function() { callback(timeCurrent + timeDelta); }, timeDelta);
        };
    })();

    /* Array compacting. Copyright Lo-Dash. MIT License: https://github.com/lodash/lodash/blob/master/LICENSE.txt */
    function compactSparseArray (array) {
        var index = -1,
            length = array ? array.length : 0,
            result = [];

        while (++index < length) {
            var value = array[index];

            if (value) {
                result.push(value);
            }
        }

        return result;
    }

    function sanitizeElements (elements) {
        /* Unwrap jQuery/Zepto objects. */
        if (Type.isWrapped(elements)) {
            elements = [].slice.call(elements);
        /* Wrap a single element in an array so that $.each() can iterate with the element instead of its node's children. */
        } else if (Type.isNode(elements)) {
            elements = [ elements ];
        }

        return elements;
    }

    var Type = {
        isString: function (variable) {
            return (typeof variable === "string");
        },
        isArray: Array.isArray || function (variable) {
            return Object.prototype.toString.call(variable) === "[object Array]";
        },
        isFunction: function (variable) {
            return Object.prototype.toString.call(variable) === "[object Function]";
        },
        isNode: function (variable) {
            return variable && variable.nodeType;
        },
        /* Copyright Martin Bohm. MIT License: https://gist.github.com/Tomalak/818a78a226a0738eaade */
        isNodeList: function (variable) {
            return typeof variable === "object" &&
                /^\[object (HTMLCollection|NodeList|Object)\]$/.test(Object.prototype.toString.call(variable)) &&
                variable.length !== undefined &&
                (variable.length === 0 || (typeof variable[0] === "object" && variable[0].nodeType > 0));
        },
        /* Determine if variable is a wrapped jQuery or Zepto element. */
        isWrapped: function (variable) {
            return variable && (variable.jquery || (window.Zepto && window.Zepto.zepto.isZ(variable)));
        },
        isSVG: function (variable) {
            return window.SVGElement && (variable instanceof window.SVGElement);
        },
        isEmptyObject: function (variable) {
            for (var name in variable) {
                return false;
            }

            return true;
        }
    };

    /*****************
       Dependencies
    *****************/

    var $,
        isJQuery = false;

    if (global.fn && global.fn.jquery) {
        $ = global;
        isJQuery = true;
    } else {
        $ = window.Velocity.Utilities;
    }

    if (IE <= 8 && !isJQuery) {
        throw new Error("Velocity: IE8 and below require jQuery to be loaded before Velocity.");
    } else if (IE <= 7) {
        /* Revert to jQuery's $.animate(), and lose Velocity's extra features. */
        jQuery.fn.velocity = jQuery.fn.animate;

        /* Now that $.fn.velocity is aliased, abort this Velocity declaration. */
        return;
    }

    /*****************
        Constants
    *****************/

    var DURATION_DEFAULT = 400,
        EASING_DEFAULT = "swing";

    /*************
        State
    *************/

    var Velocity = {
        /* Container for page-wide Velocity state data. */
        State: {
            /* Detect mobile devices to determine if mobileHA should be turned on. */
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            /* The mobileHA option's behavior changes on older Android devices (Gingerbread, versions 2.3.3-2.3.7). */
            isAndroid: /Android/i.test(navigator.userAgent),
            isGingerbread: /Android 2\.3\.[3-7]/i.test(navigator.userAgent),
            isChrome: window.chrome,
            isFirefox: /Firefox/i.test(navigator.userAgent),
            /* Create a cached element for re-use when checking for CSS property prefixes. */
            prefixElement: document.createElement("div"),
            /* Cache every prefix match to avoid repeating lookups. */
            prefixMatches: {},
            /* Cache the anchor used for animating window scrolling. */
            scrollAnchor: null,
            /* Cache the browser-specific property names associated with the scroll anchor. */
            scrollPropertyLeft: null,
            scrollPropertyTop: null,
            /* Keep track of whether our RAF tick is running. */
            isTicking: false,
            /* Container for every in-progress call to Velocity. */
            calls: []
        },
        /* Velocity's custom CSS stack. Made global for unit testing. */
        CSS: { /* Defined below. */ },
        /* A shim of the jQuery utility functions used by Velocity -- provided by Velocity's optional jQuery shim. */
        Utilities: $,
        /* Container for the user's custom animation redirects that are referenced by name in place of the properties map argument. */
        Redirects: { /* Manually registered by the user. */ },
        Easings: { /* Defined below. */ },
        /* Attempt to use ES6 Promises by default. Users can override this with a third-party promises library. */
        Promise: window.Promise,
        /* Velocity option defaults, which can be overriden by the user. */
        defaults: {
            queue: "",
            duration: DURATION_DEFAULT,
            easing: EASING_DEFAULT,
            begin: undefined,
            complete: undefined,
            progress: undefined,
            display: undefined,
            visibility: undefined,
            loop: false,
            delay: false,
            mobileHA: true,
            /* Advanced: Set to false to prevent property values from being cached between consecutive Velocity-initiated chain calls. */
            _cacheValues: true
        },
        /* A design goal of Velocity is to cache data wherever possible in order to avoid DOM requerying. Accordingly, each element has a data cache. */
        init: function (element) {
            $.data(element, "velocity", {
                /* Store whether this is an SVG element, since its properties are retrieved and updated differently than standard HTML elements. */
                isSVG: Type.isSVG(element),
                /* Keep track of whether the element is currently being animated by Velocity.
                   This is used to ensure that property values are not transferred between non-consecutive (stale) calls. */
                isAnimating: false,
                /* A reference to the element's live computedStyle object. Learn more here: https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle */
                computedStyle: null,
                /* Tween data is cached for each animation on the element so that data can be passed across calls --
                   in particular, end values are used as subsequent start values in consecutive Velocity calls. */
                tweensContainer: null,
                /* The full root property values of each CSS hook being animated on this element are cached so that:
                   1) Concurrently-animating hooks sharing the same root can have their root values' merged into one while tweening.
                   2) Post-hook-injection root values can be transferred over to consecutively chained Velocity calls as starting root values. */
                rootPropertyValueCache: {},
                /* A cache for transform updates, which must be manually flushed via CSS.flushTransformCache(). */
                transformCache: {}
            });
        },
        /* A parallel to jQuery's $.css(), used for getting/setting Velocity's hooked CSS properties. */
        hook: null, /* Defined below. */
        /* Velocity-wide animation time remapping for testing purposes. */
        mock: false,
        version: { major: 1, minor: 2, patch: 2 },
        /* Set to 1 or 2 (most verbose) to output debug info to console. */
        debug: false
    };

    /* Retrieve the appropriate scroll anchor and property name for the browser: https://developer.mozilla.org/en-US/docs/Web/API/Window.scrollY */
    if (window.pageYOffset !== undefined) {
        Velocity.State.scrollAnchor = window;
        Velocity.State.scrollPropertyLeft = "pageXOffset";
        Velocity.State.scrollPropertyTop = "pageYOffset";
    } else {
        Velocity.State.scrollAnchor = document.documentElement || document.body.parentNode || document.body;
        Velocity.State.scrollPropertyLeft = "scrollLeft";
        Velocity.State.scrollPropertyTop = "scrollTop";
    }

    /* Shorthand alias for jQuery's $.data() utility. */
    function Data (element) {
        /* Hardcode a reference to the plugin name. */
        var response = $.data(element, "velocity");

        /* jQuery <=1.4.2 returns null instead of undefined when no match is found. We normalize this behavior. */
        return response === null ? undefined : response;
    };

    /**************
        Easing
    **************/

    /* Step easing generator. */
    function generateStep (steps) {
        return function (p) {
            return Math.round(p * steps) * (1 / steps);
        };
    }

    /* Bezier curve function generator. Copyright Gaetan Renaudeau. MIT License: http://en.wikipedia.org/wiki/MIT_License */
    function generateBezier (mX1, mY1, mX2, mY2) {
        var NEWTON_ITERATIONS = 4,
            NEWTON_MIN_SLOPE = 0.001,
            SUBDIVISION_PRECISION = 0.0000001,
            SUBDIVISION_MAX_ITERATIONS = 10,
            kSplineTableSize = 11,
            kSampleStepSize = 1.0 / (kSplineTableSize - 1.0),
            float32ArraySupported = "Float32Array" in window;

        /* Must contain four arguments. */
        if (arguments.length !== 4) {
            return false;
        }

        /* Arguments must be numbers. */
        for (var i = 0; i < 4; ++i) {
            if (typeof arguments[i] !== "number" || isNaN(arguments[i]) || !isFinite(arguments[i])) {
                return false;
            }
        }

        /* X values must be in the [0, 1] range. */
        mX1 = Math.min(mX1, 1);
        mX2 = Math.min(mX2, 1);
        mX1 = Math.max(mX1, 0);
        mX2 = Math.max(mX2, 0);

        var mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);

        function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
        function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
        function C (aA1)      { return 3.0 * aA1; }

        function calcBezier (aT, aA1, aA2) {
            return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
        }

        function getSlope (aT, aA1, aA2) {
            return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
        }

        function newtonRaphsonIterate (aX, aGuessT) {
            for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
                var currentSlope = getSlope(aGuessT, mX1, mX2);

                if (currentSlope === 0.0) return aGuessT;

                var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
                aGuessT -= currentX / currentSlope;
            }

            return aGuessT;
        }

        function calcSampleValues () {
            for (var i = 0; i < kSplineTableSize; ++i) {
                mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
            }
        }

        function binarySubdivide (aX, aA, aB) {
            var currentX, currentT, i = 0;

            do {
                currentT = aA + (aB - aA) / 2.0;
                currentX = calcBezier(currentT, mX1, mX2) - aX;
                if (currentX > 0.0) {
                  aB = currentT;
                } else {
                  aA = currentT;
                }
            } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);

            return currentT;
        }

        function getTForX (aX) {
            var intervalStart = 0.0,
                currentSample = 1,
                lastSample = kSplineTableSize - 1;

            for (; currentSample != lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
                intervalStart += kSampleStepSize;
            }

            --currentSample;

            var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample+1] - mSampleValues[currentSample]),
                guessForT = intervalStart + dist * kSampleStepSize,
                initialSlope = getSlope(guessForT, mX1, mX2);

            if (initialSlope >= NEWTON_MIN_SLOPE) {
                return newtonRaphsonIterate(aX, guessForT);
            } else if (initialSlope == 0.0) {
                return guessForT;
            } else {
                return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize);
            }
        }

        var _precomputed = false;

        function precompute() {
            _precomputed = true;
            if (mX1 != mY1 || mX2 != mY2) calcSampleValues();
        }

        var f = function (aX) {
            if (!_precomputed) precompute();
            if (mX1 === mY1 && mX2 === mY2) return aX;
            if (aX === 0) return 0;
            if (aX === 1) return 1;

            return calcBezier(getTForX(aX), mY1, mY2);
        };

        f.getControlPoints = function() { return [{ x: mX1, y: mY1 }, { x: mX2, y: mY2 }]; };

        var str = "generateBezier(" + [mX1, mY1, mX2, mY2] + ")";
        f.toString = function () { return str; };

        return f;
    }

    /* Runge-Kutta spring physics function generator. Adapted from Framer.js, copyright Koen Bok. MIT License: http://en.wikipedia.org/wiki/MIT_License */
    /* Given a tension, friction, and duration, a simulation at 60FPS will first run without a defined duration in order to calculate the full path. A second pass
       then adjusts the time delta -- using the relation between actual time and duration -- to calculate the path for the duration-constrained animation. */
    var generateSpringRK4 = (function () {
        function springAccelerationForState (state) {
            return (-state.tension * state.x) - (state.friction * state.v);
        }

        function springEvaluateStateWithDerivative (initialState, dt, derivative) {
            var state = {
                x: initialState.x + derivative.dx * dt,
                v: initialState.v + derivative.dv * dt,
                tension: initialState.tension,
                friction: initialState.friction
            };

            return { dx: state.v, dv: springAccelerationForState(state) };
        }

        function springIntegrateState (state, dt) {
            var a = {
                    dx: state.v,
                    dv: springAccelerationForState(state)
                },
                b = springEvaluateStateWithDerivative(state, dt * 0.5, a),
                c = springEvaluateStateWithDerivative(state, dt * 0.5, b),
                d = springEvaluateStateWithDerivative(state, dt, c),
                dxdt = 1.0 / 6.0 * (a.dx + 2.0 * (b.dx + c.dx) + d.dx),
                dvdt = 1.0 / 6.0 * (a.dv + 2.0 * (b.dv + c.dv) + d.dv);

            state.x = state.x + dxdt * dt;
            state.v = state.v + dvdt * dt;

            return state;
        }

        return function springRK4Factory (tension, friction, duration) {

            var initState = {
                    x: -1,
                    v: 0,
                    tension: null,
                    friction: null
                },
                path = [0],
                time_lapsed = 0,
                tolerance = 1 / 10000,
                DT = 16 / 1000,
                have_duration, dt, last_state;

            tension = parseFloat(tension) || 500;
            friction = parseFloat(friction) || 20;
            duration = duration || null;

            initState.tension = tension;
            initState.friction = friction;

            have_duration = duration !== null;

            /* Calculate the actual time it takes for this animation to complete with the provided conditions. */
            if (have_duration) {
                /* Run the simulation without a duration. */
                time_lapsed = springRK4Factory(tension, friction);
                /* Compute the adjusted time delta. */
                dt = time_lapsed / duration * DT;
            } else {
                dt = DT;
            }

            while (true) {
                /* Next/step function .*/
                last_state = springIntegrateState(last_state || initState, dt);
                /* Store the position. */
                path.push(1 + last_state.x);
                time_lapsed += 16;
                /* If the change threshold is reached, break. */
                if (!(Math.abs(last_state.x) > tolerance && Math.abs(last_state.v) > tolerance)) {
                    break;
                }
            }

            /* If duration is not defined, return the actual time required for completing this animation. Otherwise, return a closure that holds the
               computed path and returns a snapshot of the position according to a given percentComplete. */
            return !have_duration ? time_lapsed : function(percentComplete) { return path[ (percentComplete * (path.length - 1)) | 0 ]; };
        };
    }());

    /* jQuery easings. */
    Velocity.Easings = {
        linear: function(p) { return p; },
        swing: function(p) { return 0.5 - Math.cos( p * Math.PI ) / 2 },
        /* Bonus "spring" easing, which is a less exaggerated version of easeInOutElastic. */
        spring: function(p) { return 1 - (Math.cos(p * 4.5 * Math.PI) * Math.exp(-p * 6)); }
    };

    /* CSS3 and Robert Penner easings. */
    $.each(
        [
            [ "ease", [ 0.25, 0.1, 0.25, 1.0 ] ],
            [ "ease-in", [ 0.42, 0.0, 1.00, 1.0 ] ],
            [ "ease-out", [ 0.00, 0.0, 0.58, 1.0 ] ],
            [ "ease-in-out", [ 0.42, 0.0, 0.58, 1.0 ] ],
            [ "easeInSine", [ 0.47, 0, 0.745, 0.715 ] ],
            [ "easeOutSine", [ 0.39, 0.575, 0.565, 1 ] ],
            [ "easeInOutSine", [ 0.445, 0.05, 0.55, 0.95 ] ],
            [ "easeInQuad", [ 0.55, 0.085, 0.68, 0.53 ] ],
            [ "easeOutQuad", [ 0.25, 0.46, 0.45, 0.94 ] ],
            [ "easeInOutQuad", [ 0.455, 0.03, 0.515, 0.955 ] ],
            [ "easeInCubic", [ 0.55, 0.055, 0.675, 0.19 ] ],
            [ "easeOutCubic", [ 0.215, 0.61, 0.355, 1 ] ],
            [ "easeInOutCubic", [ 0.645, 0.045, 0.355, 1 ] ],
            [ "easeInQuart", [ 0.895, 0.03, 0.685, 0.22 ] ],
            [ "easeOutQuart", [ 0.165, 0.84, 0.44, 1 ] ],
            [ "easeInOutQuart", [ 0.77, 0, 0.175, 1 ] ],
            [ "easeInQuint", [ 0.755, 0.05, 0.855, 0.06 ] ],
            [ "easeOutQuint", [ 0.23, 1, 0.32, 1 ] ],
            [ "easeInOutQuint", [ 0.86, 0, 0.07, 1 ] ],
            [ "easeInExpo", [ 0.95, 0.05, 0.795, 0.035 ] ],
            [ "easeOutExpo", [ 0.19, 1, 0.22, 1 ] ],
            [ "easeInOutExpo", [ 1, 0, 0, 1 ] ],
            [ "easeInCirc", [ 0.6, 0.04, 0.98, 0.335 ] ],
            [ "easeOutCirc", [ 0.075, 0.82, 0.165, 1 ] ],
            [ "easeInOutCirc", [ 0.785, 0.135, 0.15, 0.86 ] ]
        ], function(i, easingArray) {
            Velocity.Easings[easingArray[0]] = generateBezier.apply(null, easingArray[1]);
        });

    /* Determine the appropriate easing type given an easing input. */
    function getEasing(value, duration) {
        var easing = value;

        /* The easing option can either be a string that references a pre-registered easing,
           or it can be a two-/four-item array of integers to be converted into a bezier/spring function. */
        if (Type.isString(value)) {
            /* Ensure that the easing has been assigned to jQuery's Velocity.Easings object. */
            if (!Velocity.Easings[value]) {
                easing = false;
            }
        } else if (Type.isArray(value) && value.length === 1) {
            easing = generateStep.apply(null, value);
        } else if (Type.isArray(value) && value.length === 2) {
            /* springRK4 must be passed the animation's duration. */
            /* Note: If the springRK4 array contains non-numbers, generateSpringRK4() returns an easing
               function generated with default tension and friction values. */
            easing = generateSpringRK4.apply(null, value.concat([ duration ]));
        } else if (Type.isArray(value) && value.length === 4) {
            /* Note: If the bezier array contains non-numbers, generateBezier() returns false. */
            easing = generateBezier.apply(null, value);
        } else {
            easing = false;
        }

        /* Revert to the Velocity-wide default easing type, or fall back to "swing" (which is also jQuery's default)
           if the Velocity-wide default has been incorrectly modified. */
        if (easing === false) {
            if (Velocity.Easings[Velocity.defaults.easing]) {
                easing = Velocity.defaults.easing;
            } else {
                easing = EASING_DEFAULT;
            }
        }

        return easing;
    }

    /*****************
        CSS Stack
    *****************/

    /* The CSS object is a highly condensed and performant CSS stack that fully replaces jQuery's.
       It handles the validation, getting, and setting of both standard CSS properties and CSS property hooks. */
    /* Note: A "CSS" shorthand is aliased so that our code is easier to read. */
    var CSS = Velocity.CSS = {

        /*************
            RegEx
        *************/

        RegEx: {
            isHex: /^#([A-f\d]{3}){1,2}$/i,
            /* Unwrap a property value's surrounding text, e.g. "rgba(4, 3, 2, 1)" ==> "4, 3, 2, 1" and "rect(4px 3px 2px 1px)" ==> "4px 3px 2px 1px". */
            valueUnwrap: /^[A-z]+\((.*)\)$/i,
            wrappedValueAlreadyExtracted: /[0-9.]+ [0-9.]+ [0-9.]+( [0-9.]+)?/,
            /* Split a multi-value property into an array of subvalues, e.g. "rgba(4, 3, 2, 1) 4px 3px 2px 1px" ==> [ "rgba(4, 3, 2, 1)", "4px", "3px", "2px", "1px" ]. */
            valueSplit: /([A-z]+\(.+\))|(([A-z0-9#-.]+?)(?=\s|$))/ig
        },

        /************
            Lists
        ************/

        Lists: {
            colors: [ "fill", "stroke", "stopColor", "color", "backgroundColor", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor" ],
            transformsBase: [ "translateX", "translateY", "scale", "scaleX", "scaleY", "skewX", "skewY", "rotateZ" ],
            transforms3D: [ "transformPerspective", "translateZ", "scaleZ", "rotateX", "rotateY" ]
        },

        /************
            Hooks
        ************/

        /* Hooks allow a subproperty (e.g. "boxShadowBlur") of a compound-value CSS property
           (e.g. "boxShadow: X Y Blur Spread Color") to be animated as if it were a discrete property. */
        /* Note: Beyond enabling fine-grained property animation, hooking is necessary since Velocity only
           tweens properties with single numeric values; unlike CSS transitions, Velocity does not interpolate compound-values. */
        Hooks: {
            /********************
                Registration
            ********************/

            /* Templates are a concise way of indicating which subproperties must be individually registered for each compound-value CSS property. */
            /* Each template consists of the compound-value's base name, its constituent subproperty names, and those subproperties' default values. */
            templates: {
                "textShadow": [ "Color X Y Blur", "black 0px 0px 0px" ],
                "boxShadow": [ "Color X Y Blur Spread", "black 0px 0px 0px 0px" ],
                "clip": [ "Top Right Bottom Left", "0px 0px 0px 0px" ],
                "backgroundPosition": [ "X Y", "0% 0%" ],
                "transformOrigin": [ "X Y Z", "50% 50% 0px" ],
                "perspectiveOrigin": [ "X Y", "50% 50%" ]
            },

            /* A "registered" hook is one that has been converted from its template form into a live,
               tweenable property. It contains data to associate it with its root property. */
            registered: {
                /* Note: A registered hook looks like this ==> textShadowBlur: [ "textShadow", 3 ],
                   which consists of the subproperty's name, the associated root property's name,
                   and the subproperty's position in the root's value. */
            },
            /* Convert the templates into individual hooks then append them to the registered object above. */
            register: function () {
                /* Color hooks registration: Colors are defaulted to white -- as opposed to black -- since colors that are
                   currently set to "transparent" default to their respective template below when color-animated,
                   and white is typically a closer match to transparent than black is. An exception is made for text ("color"),
                   which is almost always set closer to black than white. */
                for (var i = 0; i < CSS.Lists.colors.length; i++) {
                    var rgbComponents = (CSS.Lists.colors[i] === "color") ? "0 0 0 1" : "255 255 255 1";
                    CSS.Hooks.templates[CSS.Lists.colors[i]] = [ "Red Green Blue Alpha", rgbComponents ];
                }

                var rootProperty,
                    hookTemplate,
                    hookNames;

                /* In IE, color values inside compound-value properties are positioned at the end the value instead of at the beginning.
                   Thus, we re-arrange the templates accordingly. */
                if (IE) {
                    for (rootProperty in CSS.Hooks.templates) {
                        hookTemplate = CSS.Hooks.templates[rootProperty];
                        hookNames = hookTemplate[0].split(" ");

                        var defaultValues = hookTemplate[1].match(CSS.RegEx.valueSplit);

                        if (hookNames[0] === "Color") {
                            /* Reposition both the hook's name and its default value to the end of their respective strings. */
                            hookNames.push(hookNames.shift());
                            defaultValues.push(defaultValues.shift());

                            /* Replace the existing template for the hook's root property. */
                            CSS.Hooks.templates[rootProperty] = [ hookNames.join(" "), defaultValues.join(" ") ];
                        }
                    }
                }

                /* Hook registration. */
                for (rootProperty in CSS.Hooks.templates) {
                    hookTemplate = CSS.Hooks.templates[rootProperty];
                    hookNames = hookTemplate[0].split(" ");

                    for (var i in hookNames) {
                        var fullHookName = rootProperty + hookNames[i],
                            hookPosition = i;

                        /* For each hook, register its full name (e.g. textShadowBlur) with its root property (e.g. textShadow)
                           and the hook's position in its template's default value string. */
                        CSS.Hooks.registered[fullHookName] = [ rootProperty, hookPosition ];
                    }
                }
            },

            /*****************************
               Injection and Extraction
            *****************************/

            /* Look up the root property associated with the hook (e.g. return "textShadow" for "textShadowBlur"). */
            /* Since a hook cannot be set directly (the browser won't recognize it), style updating for hooks is routed through the hook's root property. */
            getRoot: function (property) {
                var hookData = CSS.Hooks.registered[property];

                if (hookData) {
                    return hookData[0];
                } else {
                    /* If there was no hook match, return the property name untouched. */
                    return property;
                }
            },
            /* Convert any rootPropertyValue, null or otherwise, into a space-delimited list of hook values so that
               the targeted hook can be injected or extracted at its standard position. */
            cleanRootPropertyValue: function(rootProperty, rootPropertyValue) {
                /* If the rootPropertyValue is wrapped with "rgb()", "clip()", etc., remove the wrapping to normalize the value before manipulation. */
                if (CSS.RegEx.valueUnwrap.test(rootPropertyValue)) {
                    rootPropertyValue = rootPropertyValue.match(CSS.RegEx.valueUnwrap)[1];
                }

                /* If rootPropertyValue is a CSS null-value (from which there's inherently no hook value to extract),
                   default to the root's default value as defined in CSS.Hooks.templates. */
                /* Note: CSS null-values include "none", "auto", and "transparent". They must be converted into their
                   zero-values (e.g. textShadow: "none" ==> textShadow: "0px 0px 0px black") for hook manipulation to proceed. */
                if (CSS.Values.isCSSNullValue(rootPropertyValue)) {
                    rootPropertyValue = CSS.Hooks.templates[rootProperty][1];
                }

                return rootPropertyValue;
            },
            /* Extracted the hook's value from its root property's value. This is used to get the starting value of an animating hook. */
            extractValue: function (fullHookName, rootPropertyValue) {
                var hookData = CSS.Hooks.registered[fullHookName];

                if (hookData) {
                    var hookRoot = hookData[0],
                        hookPosition = hookData[1];

                    rootPropertyValue = CSS.Hooks.cleanRootPropertyValue(hookRoot, rootPropertyValue);

                    /* Split rootPropertyValue into its constituent hook values then grab the desired hook at its standard position. */
                    return rootPropertyValue.toString().match(CSS.RegEx.valueSplit)[hookPosition];
                } else {
                    /* If the provided fullHookName isn't a registered hook, return the rootPropertyValue that was passed in. */
                    return rootPropertyValue;
                }
            },
            /* Inject the hook's value into its root property's value. This is used to piece back together the root property
               once Velocity has updated one of its individually hooked values through tweening. */
            injectValue: function (fullHookName, hookValue, rootPropertyValue) {
                var hookData = CSS.Hooks.registered[fullHookName];

                if (hookData) {
                    var hookRoot = hookData[0],
                        hookPosition = hookData[1],
                        rootPropertyValueParts,
                        rootPropertyValueUpdated;

                    rootPropertyValue = CSS.Hooks.cleanRootPropertyValue(hookRoot, rootPropertyValue);

                    /* Split rootPropertyValue into its individual hook values, replace the targeted value with hookValue,
                       then reconstruct the rootPropertyValue string. */
                    rootPropertyValueParts = rootPropertyValue.toString().match(CSS.RegEx.valueSplit);
                    rootPropertyValueParts[hookPosition] = hookValue;
                    rootPropertyValueUpdated = rootPropertyValueParts.join(" ");

                    return rootPropertyValueUpdated;
                } else {
                    /* If the provided fullHookName isn't a registered hook, return the rootPropertyValue that was passed in. */
                    return rootPropertyValue;
                }
            }
        },

        /*******************
           Normalizations
        *******************/

        /* Normalizations standardize CSS property manipulation by pollyfilling browser-specific implementations (e.g. opacity)
           and reformatting special properties (e.g. clip, rgba) to look like standard ones. */
        Normalizations: {
            /* Normalizations are passed a normalization target (either the property's name, its extracted value, or its injected value),
               the targeted element (which may need to be queried), and the targeted property value. */
            registered: {
                clip: function (type, element, propertyValue) {
                    switch (type) {
                        case "name":
                            return "clip";
                        /* Clip needs to be unwrapped and stripped of its commas during extraction. */
                        case "extract":
                            var extracted;

                            /* If Velocity also extracted this value, skip extraction. */
                            if (CSS.RegEx.wrappedValueAlreadyExtracted.test(propertyValue)) {
                                extracted = propertyValue;
                            } else {
                                /* Remove the "rect()" wrapper. */
                                extracted = propertyValue.toString().match(CSS.RegEx.valueUnwrap);

                                /* Strip off commas. */
                                extracted = extracted ? extracted[1].replace(/,(\s+)?/g, " ") : propertyValue;
                            }

                            return extracted;
                        /* Clip needs to be re-wrapped during injection. */
                        case "inject":
                            return "rect(" + propertyValue + ")";
                    }
                },

                blur: function(type, element, propertyValue) {
                    switch (type) {
                        case "name":
                            return Velocity.State.isFirefox ? "filter" : "-webkit-filter";
                        case "extract":
                            var extracted = parseFloat(propertyValue);

                            /* If extracted is NaN, meaning the value isn't already extracted. */
                            if (!(extracted || extracted === 0)) {
                                var blurComponent = propertyValue.toString().match(/blur\(([0-9]+[A-z]+)\)/i);

                                /* If the filter string had a blur component, return just the blur value and unit type. */
                                if (blurComponent) {
                                    extracted = blurComponent[1];
                                /* If the component doesn't exist, default blur to 0. */
                                } else {
                                    extracted = 0;
                                }
                            }

                            return extracted;
                        /* Blur needs to be re-wrapped during injection. */
                        case "inject":
                            /* For the blur effect to be fully de-applied, it needs to be set to "none" instead of 0. */
                            if (!parseFloat(propertyValue)) {
                                return "none";
                            } else {
                                return "blur(" + propertyValue + ")";
                            }
                    }
                },

                /* <=IE8 do not support the standard opacity property. They use filter:alpha(opacity=INT) instead. */
                opacity: function (type, element, propertyValue) {
                    if (IE <= 8) {
                        switch (type) {
                            case "name":
                                return "filter";
                            case "extract":
                                /* <=IE8 return a "filter" value of "alpha(opacity=\d{1,3})".
                                   Extract the value and convert it to a decimal value to match the standard CSS opacity property's formatting. */
                                var extracted = propertyValue.toString().match(/alpha\(opacity=(.*)\)/i);

                                if (extracted) {
                                    /* Convert to decimal value. */
                                    propertyValue = extracted[1] / 100;
                                } else {
                                    /* When extracting opacity, default to 1 since a null value means opacity hasn't been set. */
                                    propertyValue = 1;
                                }

                                return propertyValue;
                            case "inject":
                                /* Opacified elements are required to have their zoom property set to a non-zero value. */
                                element.style.zoom = 1;

                                /* Setting the filter property on elements with certain font property combinations can result in a
                                   highly unappealing ultra-bolding effect. There's no way to remedy this throughout a tween, but dropping the
                                   value altogether (when opacity hits 1) at leasts ensures that the glitch is gone post-tweening. */
                                if (parseFloat(propertyValue) >= 1) {
                                    return "";
                                } else {
                                  /* As per the filter property's spec, convert the decimal value to a whole number and wrap the value. */
                                  return "alpha(opacity=" + parseInt(parseFloat(propertyValue) * 100, 10) + ")";
                                }
                        }
                    /* With all other browsers, normalization is not required; return the same values that were passed in. */
                    } else {
                        switch (type) {
                            case "name":
                                return "opacity";
                            case "extract":
                                return propertyValue;
                            case "inject":
                                return propertyValue;
                        }
                    }
                }
            },

            /*****************************
                Batched Registrations
            *****************************/

            /* Note: Batched normalizations extend the CSS.Normalizations.registered object. */
            register: function () {

                /*****************
                    Transforms
                *****************/

                /* Transforms are the subproperties contained by the CSS "transform" property. Transforms must undergo normalization
                   so that they can be referenced in a properties map by their individual names. */
                /* Note: When transforms are "set", they are actually assigned to a per-element transformCache. When all transform
                   setting is complete complete, CSS.flushTransformCache() must be manually called to flush the values to the DOM.
                   Transform setting is batched in this way to improve performance: the transform style only needs to be updated
                   once when multiple transform subproperties are being animated simultaneously. */
                /* Note: IE9 and Android Gingerbread have support for 2D -- but not 3D -- transforms. Since animating unsupported
                   transform properties results in the browser ignoring the *entire* transform string, we prevent these 3D values
                   from being normalized for these browsers so that tweening skips these properties altogether
                   (since it will ignore them as being unsupported by the browser.) */
                if (!(IE <= 9) && !Velocity.State.isGingerbread) {
                    /* Note: Since the standalone CSS "perspective" property and the CSS transform "perspective" subproperty
                    share the same name, the latter is given a unique token within Velocity: "transformPerspective". */
                    CSS.Lists.transformsBase = CSS.Lists.transformsBase.concat(CSS.Lists.transforms3D);
                }

                for (var i = 0; i < CSS.Lists.transformsBase.length; i++) {
                    /* Wrap the dynamically generated normalization function in a new scope so that transformName's value is
                    paired with its respective function. (Otherwise, all functions would take the final for loop's transformName.) */
                    (function() {
                        var transformName = CSS.Lists.transformsBase[i];

                        CSS.Normalizations.registered[transformName] = function (type, element, propertyValue) {
                            switch (type) {
                                /* The normalized property name is the parent "transform" property -- the property that is actually set in CSS. */
                                case "name":
                                    return "transform";
                                /* Transform values are cached onto a per-element transformCache object. */
                                case "extract":
                                    /* If this transform has yet to be assigned a value, return its null value. */
                                    if (Data(element) === undefined || Data(element).transformCache[transformName] === undefined) {
                                        /* Scale CSS.Lists.transformsBase default to 1 whereas all other transform properties default to 0. */
                                        return /^scale/i.test(transformName) ? 1 : 0;
                                    /* When transform values are set, they are wrapped in parentheses as per the CSS spec.
                                       Thus, when extracting their values (for tween calculations), we strip off the parentheses. */
                                    } else {
                                        return Data(element).transformCache[transformName].replace(/[()]/g, "");
                                    }
                                case "inject":
                                    var invalid = false;

                                    /* If an individual transform property contains an unsupported unit type, the browser ignores the *entire* transform property.
                                       Thus, protect users from themselves by skipping setting for transform values supplied with invalid unit types. */
                                    /* Switch on the base transform type; ignore the axis by removing the last letter from the transform's name. */
                                    switch (transformName.substr(0, transformName.length - 1)) {
                                        /* Whitelist unit types for each transform. */
                                        case "translate":
                                            invalid = !/(%|px|em|rem|vw|vh|\d)$/i.test(propertyValue);
                                            break;
                                        /* Since an axis-free "scale" property is supported as well, a little hack is used here to detect it by chopping off its last letter. */
                                        case "scal":
                                        case "scale":
                                            /* Chrome on Android has a bug in which scaled elements blur if their initial scale
                                               value is below 1 (which can happen with forcefeeding). Thus, we detect a yet-unset scale property
                                               and ensure that its first value is always 1. More info: http://stackoverflow.com/questions/10417890/css3-animations-with-transform-causes-blurred-elements-on-webkit/10417962#10417962 */
                                            if (Velocity.State.isAndroid && Data(element).transformCache[transformName] === undefined && propertyValue < 1) {
                                                propertyValue = 1;
                                            }

                                            invalid = !/(\d)$/i.test(propertyValue);
                                            break;
                                        case "skew":
                                            invalid = !/(deg|\d)$/i.test(propertyValue);
                                            break;
                                        case "rotate":
                                            invalid = !/(deg|\d)$/i.test(propertyValue);
                                            break;
                                    }

                                    if (!invalid) {
                                        /* As per the CSS spec, wrap the value in parentheses. */
                                        Data(element).transformCache[transformName] = "(" + propertyValue + ")";
                                    }

                                    /* Although the value is set on the transformCache object, return the newly-updated value for the calling code to process as normal. */
                                    return Data(element).transformCache[transformName];
                            }
                        };
                    })();
                }

                /*************
                    Colors
                *************/

                /* Since Velocity only animates a single numeric value per property, color animation is achieved by hooking the individual RGBA components of CSS color properties.
                   Accordingly, color values must be normalized (e.g. "#ff0000", "red", and "rgb(255, 0, 0)" ==> "255 0 0 1") so that their components can be injected/extracted by CSS.Hooks logic. */
                for (var i = 0; i < CSS.Lists.colors.length; i++) {
                    /* Wrap the dynamically generated normalization function in a new scope so that colorName's value is paired with its respective function.
                       (Otherwise, all functions would take the final for loop's colorName.) */
                    (function () {
                        var colorName = CSS.Lists.colors[i];

                        /* Note: In IE<=8, which support rgb but not rgba, color properties are reverted to rgb by stripping off the alpha component. */
                        CSS.Normalizations.registered[colorName] = function(type, element, propertyValue) {
                            switch (type) {
                                case "name":
                                    return colorName;
                                /* Convert all color values into the rgb format. (Old IE can return hex values and color names instead of rgb/rgba.) */
                                case "extract":
                                    var extracted;

                                    /* If the color is already in its hookable form (e.g. "255 255 255 1") due to having been previously extracted, skip extraction. */
                                    if (CSS.RegEx.wrappedValueAlreadyExtracted.test(propertyValue)) {
                                        extracted = propertyValue;
                                    } else {
                                        var converted,
                                            colorNames = {
                                                black: "rgb(0, 0, 0)",
                                                blue: "rgb(0, 0, 255)",
                                                gray: "rgb(128, 128, 128)",
                                                green: "rgb(0, 128, 0)",
                                                red: "rgb(255, 0, 0)",
                                                white: "rgb(255, 255, 255)"
                                            };

                                        /* Convert color names to rgb. */
                                        if (/^[A-z]+$/i.test(propertyValue)) {
                                            if (colorNames[propertyValue] !== undefined) {
                                                converted = colorNames[propertyValue]
                                            } else {
                                                /* If an unmatched color name is provided, default to black. */
                                                converted = colorNames.black;
                                            }
                                        /* Convert hex values to rgb. */
                                        } else if (CSS.RegEx.isHex.test(propertyValue)) {
                                            converted = "rgb(" + CSS.Values.hexToRgb(propertyValue).join(" ") + ")";
                                        /* If the provided color doesn't match any of the accepted color formats, default to black. */
                                        } else if (!(/^rgba?\(/i.test(propertyValue))) {
                                            converted = colorNames.black;
                                        }

                                        /* Remove the surrounding "rgb/rgba()" string then replace commas with spaces and strip
                                           repeated spaces (in case the value included spaces to begin with). */
                                        extracted = (converted || propertyValue).toString().match(CSS.RegEx.valueUnwrap)[1].replace(/,(\s+)?/g, " ");
                                    }

                                    /* So long as this isn't <=IE8, add a fourth (alpha) component if it's missing and default it to 1 (visible). */
                                    if (!(IE <= 8) && extracted.split(" ").length === 3) {
                                        extracted += " 1";
                                    }

                                    return extracted;
                                case "inject":
                                    /* If this is IE<=8 and an alpha component exists, strip it off. */
                                    if (IE <= 8) {
                                        if (propertyValue.split(" ").length === 4) {
                                            propertyValue = propertyValue.split(/\s+/).slice(0, 3).join(" ");
                                        }
                                    /* Otherwise, add a fourth (alpha) component if it's missing and default it to 1 (visible). */
                                    } else if (propertyValue.split(" ").length === 3) {
                                        propertyValue += " 1";
                                    }

                                    /* Re-insert the browser-appropriate wrapper("rgb/rgba()"), insert commas, and strip off decimal units
                                       on all values but the fourth (R, G, and B only accept whole numbers). */
                                    return (IE <= 8 ? "rgb" : "rgba") + "(" + propertyValue.replace(/\s+/g, ",").replace(/\.(\d)+(?=,)/g, "") + ")";
                            }
                        };
                    })();
                }
            }
        },

        /************************
           CSS Property Names
        ************************/

        Names: {
            /* Camelcase a property name into its JavaScript notation (e.g. "background-color" ==> "backgroundColor").
               Camelcasing is used to normalize property names between and across calls. */
            camelCase: function (property) {
                return property.replace(/-(\w)/g, function (match, subMatch) {
                    return subMatch.toUpperCase();
                });
            },

            /* For SVG elements, some properties (namely, dimensional ones) are GET/SET via the element's HTML attributes (instead of via CSS styles). */
            SVGAttribute: function (property) {
                var SVGAttributes = "width|height|x|y|cx|cy|r|rx|ry|x1|x2|y1|y2";

                /* Certain browsers require an SVG transform to be applied as an attribute. (Otherwise, application via CSS is preferable due to 3D support.) */
                if (IE || (Velocity.State.isAndroid && !Velocity.State.isChrome)) {
                    SVGAttributes += "|transform";
                }

                return new RegExp("^(" + SVGAttributes + ")$", "i").test(property);
            },

            /* Determine whether a property should be set with a vendor prefix. */
            /* If a prefixed version of the property exists, return it. Otherwise, return the original property name.
               If the property is not at all supported by the browser, return a false flag. */
            prefixCheck: function (property) {
                /* If this property has already been checked, return the cached value. */
                if (Velocity.State.prefixMatches[property]) {
                    return [ Velocity.State.prefixMatches[property], true ];
                } else {
                    var vendors = [ "", "Webkit", "Moz", "ms", "O" ];

                    for (var i = 0, vendorsLength = vendors.length; i < vendorsLength; i++) {
                        var propertyPrefixed;

                        if (i === 0) {
                            propertyPrefixed = property;
                        } else {
                            /* Capitalize the first letter of the property to conform to JavaScript vendor prefix notation (e.g. webkitFilter). */
                            propertyPrefixed = vendors[i] + property.replace(/^\w/, function(match) { return match.toUpperCase(); });
                        }

                        /* Check if the browser supports this property as prefixed. */
                        if (Type.isString(Velocity.State.prefixElement.style[propertyPrefixed])) {
                            /* Cache the match. */
                            Velocity.State.prefixMatches[property] = propertyPrefixed;

                            return [ propertyPrefixed, true ];
                        }
                    }

                    /* If the browser doesn't support this property in any form, include a false flag so that the caller can decide how to proceed. */
                    return [ property, false ];
                }
            }
        },

        /************************
           CSS Property Values
        ************************/

        Values: {
            /* Hex to RGB conversion. Copyright Tim Down: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb */
            hexToRgb: function (hex) {
                var shortformRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
                    longformRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,
                    rgbParts;

                hex = hex.replace(shortformRegex, function (m, r, g, b) {
                    return r + r + g + g + b + b;
                });

                rgbParts = longformRegex.exec(hex);

                return rgbParts ? [ parseInt(rgbParts[1], 16), parseInt(rgbParts[2], 16), parseInt(rgbParts[3], 16) ] : [ 0, 0, 0 ];
            },

            isCSSNullValue: function (value) {
                /* The browser defaults CSS values that have not been set to either 0 or one of several possible null-value strings.
                   Thus, we check for both falsiness and these special strings. */
                /* Null-value checking is performed to default the special strings to 0 (for the sake of tweening) or their hook
                   templates as defined as CSS.Hooks (for the sake of hook injection/extraction). */
                /* Note: Chrome returns "rgba(0, 0, 0, 0)" for an undefined color whereas IE returns "transparent". */
                return (value == 0 || /^(none|auto|transparent|(rgba\(0, ?0, ?0, ?0\)))$/i.test(value));
            },

            /* Retrieve a property's default unit type. Used for assigning a unit type when one is not supplied by the user. */
            getUnitType: function (property) {
                if (/^(rotate|skew)/i.test(property)) {
                    return "deg";
                } else if (/(^(scale|scaleX|scaleY|scaleZ|alpha|flexGrow|flexHeight|zIndex|fontWeight)$)|((opacity|red|green|blue|alpha)$)/i.test(property)) {
                    /* The above properties are unitless. */
                    return "";
                } else {
                    /* Default to px for all other properties. */
                    return "px";
                }
            },

            /* HTML elements default to an associated display type when they're not set to display:none. */
            /* Note: This function is used for correctly setting the non-"none" display value in certain Velocity redirects, such as fadeIn/Out. */
            getDisplayType: function (element) {
                var tagName = element && element.tagName.toString().toLowerCase();

                if (/^(b|big|i|small|tt|abbr|acronym|cite|code|dfn|em|kbd|strong|samp|var|a|bdo|br|img|map|object|q|script|span|sub|sup|button|input|label|select|textarea)$/i.test(tagName)) {
                    return "inline";
                } else if (/^(li)$/i.test(tagName)) {
                    return "list-item";
                } else if (/^(tr)$/i.test(tagName)) {
                    return "table-row";
                } else if (/^(table)$/i.test(tagName)) {
                    return "table";
                } else if (/^(tbody)$/i.test(tagName)) {
                    return "table-row-group";
                /* Default to "block" when no match is found. */
                } else {
                    return "block";
                }
            },

            /* The class add/remove functions are used to temporarily apply a "velocity-animating" class to elements while they're animating. */
            addClass: function (element, className) {
                if (element.classList) {
                    element.classList.add(className);
                } else {
                    element.className += (element.className.length ? " " : "") + className;
                }
            },

            removeClass: function (element, className) {
                if (element.classList) {
                    element.classList.remove(className);
                } else {
                    element.className = element.className.toString().replace(new RegExp("(^|\\s)" + className.split(" ").join("|") + "(\\s|$)", "gi"), " ");
                }
            }
        },

        /****************************
           Style Getting & Setting
        ****************************/

        /* The singular getPropertyValue, which routes the logic for all normalizations, hooks, and standard CSS properties. */
        getPropertyValue: function (element, property, rootPropertyValue, forceStyleLookup) {
            /* Get an element's computed property value. */
            /* Note: Retrieving the value of a CSS property cannot simply be performed by checking an element's
               style attribute (which only reflects user-defined values). Instead, the browser must be queried for a property's
               *computed* value. You can read more about getComputedStyle here: https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle */
            function computePropertyValue (element, property) {
                /* When box-sizing isn't set to border-box, height and width style values are incorrectly computed when an
                   element's scrollbars are visible (which expands the element's dimensions). Thus, we defer to the more accurate
                   offsetHeight/Width property, which includes the total dimensions for interior, border, padding, and scrollbar.
                   We subtract border and padding to get the sum of interior + scrollbar. */
                var computedValue = 0;

                /* IE<=8 doesn't support window.getComputedStyle, thus we defer to jQuery, which has an extensive array
                   of hacks to accurately retrieve IE8 property values. Re-implementing that logic here is not worth bloating the
                   codebase for a dying browser. The performance repercussions of using jQuery here are minimal since
                   Velocity is optimized to rarely (and sometimes never) query the DOM. Further, the $.css() codepath isn't that slow. */
                if (IE <= 8) {
                    computedValue = $.css(element, property); /* GET */
                /* All other browsers support getComputedStyle. The returned live object reference is cached onto its
                   associated element so that it does not need to be refetched upon every GET. */
                } else {
                    /* Browsers do not return height and width values for elements that are set to display:"none". Thus, we temporarily
                       toggle display to the element type's default value. */
                    var toggleDisplay = false;

                    if (/^(width|height)$/.test(property) && CSS.getPropertyValue(element, "display") === 0) {
                        toggleDisplay = true;
                        CSS.setPropertyValue(element, "display", CSS.Values.getDisplayType(element));
                    }

                    function revertDisplay () {
                        if (toggleDisplay) {
                            CSS.setPropertyValue(element, "display", "none");
                        }
                    }

                    if (!forceStyleLookup) {
                        if (property === "height" && CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() !== "border-box") {
                            var contentBoxHeight = element.offsetHeight - (parseFloat(CSS.getPropertyValue(element, "borderTopWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "borderBottomWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingTop")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingBottom")) || 0);
                            revertDisplay();

                            return contentBoxHeight;
                        } else if (property === "width" && CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() !== "border-box") {
                            var contentBoxWidth = element.offsetWidth - (parseFloat(CSS.getPropertyValue(element, "borderLeftWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "borderRightWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingLeft")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingRight")) || 0);
                            revertDisplay();

                            return contentBoxWidth;
                        }
                    }

                    var computedStyle;

                    /* For elements that Velocity hasn't been called on directly (e.g. when Velocity queries the DOM on behalf
                       of a parent of an element its animating), perform a direct getComputedStyle lookup since the object isn't cached. */
                    if (Data(element) === undefined) {
                        computedStyle = window.getComputedStyle(element, null); /* GET */
                    /* If the computedStyle object has yet to be cached, do so now. */
                    } else if (!Data(element).computedStyle) {
                        computedStyle = Data(element).computedStyle = window.getComputedStyle(element, null); /* GET */
                    /* If computedStyle is cached, use it. */
                    } else {
                        computedStyle = Data(element).computedStyle;
                    }

                    /* IE and Firefox do not return a value for the generic borderColor -- they only return individual values for each border side's color.
                       Also, in all browsers, when border colors aren't all the same, a compound value is returned that Velocity isn't setup to parse.
                       So, as a polyfill for querying individual border side colors, we just return the top border's color and animate all borders from that value. */
                    if (property === "borderColor") {
                        property = "borderTopColor";
                    }

                    /* IE9 has a bug in which the "filter" property must be accessed from computedStyle using the getPropertyValue method
                       instead of a direct property lookup. The getPropertyValue method is slower than a direct lookup, which is why we avoid it by default. */
                    if (IE === 9 && property === "filter") {
                        computedValue = computedStyle.getPropertyValue(property); /* GET */
                    } else {
                        computedValue = computedStyle[property];
                    }

                    /* Fall back to the property's style value (if defined) when computedValue returns nothing,
                       which can happen when the element hasn't been painted. */
                    if (computedValue === "" || computedValue === null) {
                        computedValue = element.style[property];
                    }

                    revertDisplay();
                }

                /* For top, right, bottom, and left (TRBL) values that are set to "auto" on elements of "fixed" or "absolute" position,
                   defer to jQuery for converting "auto" to a numeric value. (For elements with a "static" or "relative" position, "auto" has the same
                   effect as being set to 0, so no conversion is necessary.) */
                /* An example of why numeric conversion is necessary: When an element with "position:absolute" has an untouched "left"
                   property, which reverts to "auto", left's value is 0 relative to its parent element, but is often non-zero relative
                   to its *containing* (not parent) element, which is the nearest "position:relative" ancestor or the viewport (and always the viewport in the case of "position:fixed"). */
                if (computedValue === "auto" && /^(top|right|bottom|left)$/i.test(property)) {
                    var position = computePropertyValue(element, "position"); /* GET */

                    /* For absolute positioning, jQuery's $.position() only returns values for top and left;
                       right and bottom will have their "auto" value reverted to 0. */
                    /* Note: A jQuery object must be created here since jQuery doesn't have a low-level alias for $.position().
                       Not a big deal since we're currently in a GET batch anyway. */
                    if (position === "fixed" || (position === "absolute" && /top|left/i.test(property))) {
                        /* Note: jQuery strips the pixel unit from its returned values; we re-add it here to conform with computePropertyValue's behavior. */
                        computedValue = $(element).position()[property] + "px"; /* GET */
                    }
                }

                return computedValue;
            }

            var propertyValue;

            /* If this is a hooked property (e.g. "clipLeft" instead of the root property of "clip"),
               extract the hook's value from a normalized rootPropertyValue using CSS.Hooks.extractValue(). */
            if (CSS.Hooks.registered[property]) {
                var hook = property,
                    hookRoot = CSS.Hooks.getRoot(hook);

                /* If a cached rootPropertyValue wasn't passed in (which Velocity always attempts to do in order to avoid requerying the DOM),
                   query the DOM for the root property's value. */
                if (rootPropertyValue === undefined) {
                    /* Since the browser is now being directly queried, use the official post-prefixing property name for this lookup. */
                    rootPropertyValue = CSS.getPropertyValue(element, CSS.Names.prefixCheck(hookRoot)[0]); /* GET */
                }

                /* If this root has a normalization registered, peform the associated normalization extraction. */
                if (CSS.Normalizations.registered[hookRoot]) {
                    rootPropertyValue = CSS.Normalizations.registered[hookRoot]("extract", element, rootPropertyValue);
                }

                /* Extract the hook's value. */
                propertyValue = CSS.Hooks.extractValue(hook, rootPropertyValue);

            /* If this is a normalized property (e.g. "opacity" becomes "filter" in <=IE8) or "translateX" becomes "transform"),
               normalize the property's name and value, and handle the special case of transforms. */
            /* Note: Normalizing a property is mutually exclusive from hooking a property since hook-extracted values are strictly
               numerical and therefore do not require normalization extraction. */
            } else if (CSS.Normalizations.registered[property]) {
                var normalizedPropertyName,
                    normalizedPropertyValue;

                normalizedPropertyName = CSS.Normalizations.registered[property]("name", element);

                /* Transform values are calculated via normalization extraction (see below), which checks against the element's transformCache.
                   At no point do transform GETs ever actually query the DOM; initial stylesheet values are never processed.
                   This is because parsing 3D transform matrices is not always accurate and would bloat our codebase;
                   thus, normalization extraction defaults initial transform values to their zero-values (e.g. 1 for scaleX and 0 for translateX). */
                if (normalizedPropertyName !== "transform") {
                    normalizedPropertyValue = computePropertyValue(element, CSS.Names.prefixCheck(normalizedPropertyName)[0]); /* GET */

                    /* If the value is a CSS null-value and this property has a hook template, use that zero-value template so that hooks can be extracted from it. */
                    if (CSS.Values.isCSSNullValue(normalizedPropertyValue) && CSS.Hooks.templates[property]) {
                        normalizedPropertyValue = CSS.Hooks.templates[property][1];
                    }
                }

                propertyValue = CSS.Normalizations.registered[property]("extract", element, normalizedPropertyValue);
            }

            /* If a (numeric) value wasn't produced via hook extraction or normalization, query the DOM. */
            if (!/^[\d-]/.test(propertyValue)) {
                /* For SVG elements, dimensional properties (which SVGAttribute() detects) are tweened via
                   their HTML attribute values instead of their CSS style values. */
                if (Data(element) && Data(element).isSVG && CSS.Names.SVGAttribute(property)) {
                    /* Since the height/width attribute values must be set manually, they don't reflect computed values.
                       Thus, we use use getBBox() to ensure we always get values for elements with undefined height/width attributes. */
                    if (/^(height|width)$/i.test(property)) {
                        /* Firefox throws an error if .getBBox() is called on an SVG that isn't attached to the DOM. */
                        try {
                            propertyValue = element.getBBox()[property];
                        } catch (error) {
                            propertyValue = 0;
                        }
                    /* Otherwise, access the attribute value directly. */
                    } else {
                        propertyValue = element.getAttribute(property);
                    }
                } else {
                    propertyValue = computePropertyValue(element, CSS.Names.prefixCheck(property)[0]); /* GET */
                }
            }

            /* Since property lookups are for animation purposes (which entails computing the numeric delta between start and end values),
               convert CSS null-values to an integer of value 0. */
            if (CSS.Values.isCSSNullValue(propertyValue)) {
                propertyValue = 0;
            }

            if (Velocity.debug >= 2) console.log("Get " + property + ": " + propertyValue);

            return propertyValue;
        },

        /* The singular setPropertyValue, which routes the logic for all normalizations, hooks, and standard CSS properties. */
        setPropertyValue: function(element, property, propertyValue, rootPropertyValue, scrollData) {
            var propertyName = property;

            /* In order to be subjected to call options and element queueing, scroll animation is routed through Velocity as if it were a standard CSS property. */
            if (property === "scroll") {
                /* If a container option is present, scroll the container instead of the browser window. */
                if (scrollData.container) {
                    scrollData.container["scroll" + scrollData.direction] = propertyValue;
                /* Otherwise, Velocity defaults to scrolling the browser window. */
                } else {
                    if (scrollData.direction === "Left") {
                        window.scrollTo(propertyValue, scrollData.alternateValue);
                    } else {
                        window.scrollTo(scrollData.alternateValue, propertyValue);
                    }
                }
            } else {
                /* Transforms (translateX, rotateZ, etc.) are applied to a per-element transformCache object, which is manually flushed via flushTransformCache().
                   Thus, for now, we merely cache transforms being SET. */
                if (CSS.Normalizations.registered[property] && CSS.Normalizations.registered[property]("name", element) === "transform") {
                    /* Perform a normalization injection. */
                    /* Note: The normalization logic handles the transformCache updating. */
                    CSS.Normalizations.registered[property]("inject", element, propertyValue);

                    propertyName = "transform";
                    propertyValue = Data(element).transformCache[property];
                } else {
                    /* Inject hooks. */
                    if (CSS.Hooks.registered[property]) {
                        var hookName = property,
                            hookRoot = CSS.Hooks.getRoot(property);

                        /* If a cached rootPropertyValue was not provided, query the DOM for the hookRoot's current value. */
                        rootPropertyValue = rootPropertyValue || CSS.getPropertyValue(element, hookRoot); /* GET */

                        propertyValue = CSS.Hooks.injectValue(hookName, propertyValue, rootPropertyValue);
                        property = hookRoot;
                    }

                    /* Normalize names and values. */
                    if (CSS.Normalizations.registered[property]) {
                        propertyValue = CSS.Normalizations.registered[property]("inject", element, propertyValue);
                        property = CSS.Normalizations.registered[property]("name", element);
                    }

                    /* Assign the appropriate vendor prefix before performing an official style update. */
                    propertyName = CSS.Names.prefixCheck(property)[0];

                    /* A try/catch is used for IE<=8, which throws an error when "invalid" CSS values are set, e.g. a negative width.
                       Try/catch is avoided for other browsers since it incurs a performance overhead. */
                    if (IE <= 8) {
                        try {
                            element.style[propertyName] = propertyValue;
                        } catch (error) { if (Velocity.debug) console.log("Browser does not support [" + propertyValue + "] for [" + propertyName + "]"); }
                    /* SVG elements have their dimensional properties (width, height, x, y, cx, etc.) applied directly as attributes instead of as styles. */
                    /* Note: IE8 does not support SVG elements, so it's okay that we skip it for SVG animation. */
                    } else if (Data(element) && Data(element).isSVG && CSS.Names.SVGAttribute(property)) {
                        /* Note: For SVG attributes, vendor-prefixed property names are never used. */
                        /* Note: Not all CSS properties can be animated via attributes, but the browser won't throw an error for unsupported properties. */
                        element.setAttribute(property, propertyValue);
                    } else {
                        element.style[propertyName] = propertyValue;
                    }

                    if (Velocity.debug >= 2) console.log("Set " + property + " (" + propertyName + "): " + propertyValue);
                }
            }

            /* Return the normalized property name and value in case the caller wants to know how these values were modified before being applied to the DOM. */
            return [ propertyName, propertyValue ];
        },

        /* To increase performance by batching transform updates into a single SET, transforms are not directly applied to an element until flushTransformCache() is called. */
        /* Note: Velocity applies transform properties in the same order that they are chronogically introduced to the element's CSS styles. */
        flushTransformCache: function(element) {
            var transformString = "";

            /* Certain browsers require that SVG transforms be applied as an attribute. However, the SVG transform attribute takes a modified version of CSS's transform string
               (units are dropped and, except for skewX/Y, subproperties are merged into their master property -- e.g. scaleX and scaleY are merged into scale(X Y). */
            if ((IE || (Velocity.State.isAndroid && !Velocity.State.isChrome)) && Data(element).isSVG) {
                /* Since transform values are stored in their parentheses-wrapped form, we use a helper function to strip out their numeric values.
                   Further, SVG transform properties only take unitless (representing pixels) values, so it's okay that parseFloat() strips the unit suffixed to the float value. */
                function getTransformFloat (transformProperty) {
                    return parseFloat(CSS.getPropertyValue(element, transformProperty));
                }

                /* Create an object to organize all the transforms that we'll apply to the SVG element. To keep the logic simple,
                   we process *all* transform properties -- even those that may not be explicitly applied (since they default to their zero-values anyway). */
                var SVGTransforms = {
                    translate: [ getTransformFloat("translateX"), getTransformFloat("translateY") ],
                    skewX: [ getTransformFloat("skewX") ], skewY: [ getTransformFloat("skewY") ],
                    /* If the scale property is set (non-1), use that value for the scaleX and scaleY values
                       (this behavior mimics the result of animating all these properties at once on HTML elements). */
                    scale: getTransformFloat("scale") !== 1 ? [ getTransformFloat("scale"), getTransformFloat("scale") ] : [ getTransformFloat("scaleX"), getTransformFloat("scaleY") ],
                    /* Note: SVG's rotate transform takes three values: rotation degrees followed by the X and Y values
                       defining the rotation's origin point. We ignore the origin values (default them to 0). */
                    rotate: [ getTransformFloat("rotateZ"), 0, 0 ]
                };

                /* Iterate through the transform properties in the user-defined property map order.
                   (This mimics the behavior of non-SVG transform animation.) */
                $.each(Data(element).transformCache, function(transformName) {
                    /* Except for with skewX/Y, revert the axis-specific transform subproperties to their axis-free master
                       properties so that they match up with SVG's accepted transform properties. */
                    if (/^translate/i.test(transformName)) {
                        transformName = "translate";
                    } else if (/^scale/i.test(transformName)) {
                        transformName = "scale";
                    } else if (/^rotate/i.test(transformName)) {
                        transformName = "rotate";
                    }

                    /* Check that we haven't yet deleted the property from the SVGTransforms container. */
                    if (SVGTransforms[transformName]) {
                        /* Append the transform property in the SVG-supported transform format. As per the spec, surround the space-delimited values in parentheses. */
                        transformString += transformName + "(" + SVGTransforms[transformName].join(" ") + ")" + " ";

                        /* After processing an SVG transform property, delete it from the SVGTransforms container so we don't
                           re-insert the same master property if we encounter another one of its axis-specific properties. */
                        delete SVGTransforms[transformName];
                    }
                });
            } else {
                var transformValue,
                    perspective;

                /* Transform properties are stored as members of the transformCache object. Concatenate all the members into a string. */
                $.each(Data(element).transformCache, function(transformName) {
                    transformValue = Data(element).transformCache[transformName];

                    /* Transform's perspective subproperty must be set first in order to take effect. Store it temporarily. */
                    if (transformName === "transformPerspective") {
                        perspective = transformValue;
                        return true;
                    }

                    /* IE9 only supports one rotation type, rotateZ, which it refers to as "rotate". */
                    if (IE === 9 && transformName === "rotateZ") {
                        transformName = "rotate";
                    }

                    transformString += transformName + transformValue + " ";
                });

                /* If present, set the perspective subproperty first. */
                if (perspective) {
                    transformString = "perspective" + perspective + " " + transformString;
                }
            }

            CSS.setPropertyValue(element, "transform", transformString);
        }
    };

    /* Register hooks and normalizations. */
    CSS.Hooks.register();
    CSS.Normalizations.register();

    /* Allow hook setting in the same fashion as jQuery's $.css(). */
    Velocity.hook = function (elements, arg2, arg3) {
        var value = undefined;

        elements = sanitizeElements(elements);

        $.each(elements, function(i, element) {
            /* Initialize Velocity's per-element data cache if this element hasn't previously been animated. */
            if (Data(element) === undefined) {
                Velocity.init(element);
            }

            /* Get property value. If an element set was passed in, only return the value for the first element. */
            if (arg3 === undefined) {
                if (value === undefined) {
                    value = Velocity.CSS.getPropertyValue(element, arg2);
                }
            /* Set property value. */
            } else {
                /* sPV returns an array of the normalized propertyName/propertyValue pair used to update the DOM. */
                var adjustedSet = Velocity.CSS.setPropertyValue(element, arg2, arg3);

                /* Transform properties don't automatically set. They have to be flushed to the DOM. */
                if (adjustedSet[0] === "transform") {
                    Velocity.CSS.flushTransformCache(element);
                }

                value = adjustedSet;
            }
        });

        return value;
    };

    /*****************
        Animation
    *****************/

    var animate = function() {

        /******************
            Call Chain
        ******************/

        /* Logic for determining what to return to the call stack when exiting out of Velocity. */
        function getChain () {
            /* If we are using the utility function, attempt to return this call's promise. If no promise library was detected,
               default to null instead of returning the targeted elements so that utility function's return value is standardized. */
            if (isUtility) {
                return promiseData.promise || null;
            /* Otherwise, if we're using $.fn, return the jQuery-/Zepto-wrapped element set. */
            } else {
                return elementsWrapped;
            }
        }

        /*************************
           Arguments Assignment
        *************************/

        /* To allow for expressive CoffeeScript code, Velocity supports an alternative syntax in which "elements" (or "e"), "properties" (or "p"), and "options" (or "o")
           objects are defined on a container object that's passed in as Velocity's sole argument. */
        /* Note: Some browsers automatically populate arguments with a "properties" object. We detect it by checking for its default "names" property. */
        var syntacticSugar = (arguments[0] && (arguments[0].p || (($.isPlainObject(arguments[0].properties) && !arguments[0].properties.names) || Type.isString(arguments[0].properties)))),
            /* Whether Velocity was called via the utility function (as opposed to on a jQuery/Zepto object). */
            isUtility,
            /* When Velocity is called via the utility function ($.Velocity()/Velocity()), elements are explicitly
               passed in as the first parameter. Thus, argument positioning varies. We normalize them here. */
            elementsWrapped,
            argumentIndex;

        var elements,
            propertiesMap,
            options;

        /* Detect jQuery/Zepto elements being animated via the $.fn method. */
        if (Type.isWrapped(this)) {
            isUtility = false;

            argumentIndex = 0;
            elements = this;
            elementsWrapped = this;
        /* Otherwise, raw elements are being animated via the utility function. */
        } else {
            isUtility = true;

            argumentIndex = 1;
            elements = syntacticSugar ? (arguments[0].elements || arguments[0].e) : arguments[0];
        }

        elements = sanitizeElements(elements);

        if (!elements) {
            return;
        }

        if (syntacticSugar) {
            propertiesMap = arguments[0].properties || arguments[0].p;
            options = arguments[0].options || arguments[0].o;
        } else {
            propertiesMap = arguments[argumentIndex];
            options = arguments[argumentIndex + 1];
        }

        /* The length of the element set (in the form of a nodeList or an array of elements) is defaulted to 1 in case a
           single raw DOM element is passed in (which doesn't contain a length property). */
        var elementsLength = elements.length,
            elementsIndex = 0;

        /***************************
            Argument Overloading
        ***************************/

        /* Support is included for jQuery's argument overloading: $.animate(propertyMap [, duration] [, easing] [, complete]).
           Overloading is detected by checking for the absence of an object being passed into options. */
        /* Note: The stop and finish actions do not accept animation options, and are therefore excluded from this check. */
        if (!/^(stop|finish|finishAll)$/i.test(propertiesMap) && !$.isPlainObject(options)) {
            /* The utility function shifts all arguments one position to the right, so we adjust for that offset. */
            var startingArgumentPosition = argumentIndex + 1;

            options = {};

            /* Iterate through all options arguments */
            for (var i = startingArgumentPosition; i < arguments.length; i++) {
                /* Treat a number as a duration. Parse it out. */
                /* Note: The following RegEx will return true if passed an array with a number as its first item.
                   Thus, arrays are skipped from this check. */
                if (!Type.isArray(arguments[i]) && (/^(fast|normal|slow)$/i.test(arguments[i]) || /^\d/.test(arguments[i]))) {
                    options.duration = arguments[i];
                /* Treat strings and arrays as easings. */
                } else if (Type.isString(arguments[i]) || Type.isArray(arguments[i])) {
                    options.easing = arguments[i];
                /* Treat a function as a complete callback. */
                } else if (Type.isFunction(arguments[i])) {
                    options.complete = arguments[i];
                }
            }
        }

        /***************
            Promises
        ***************/

        var promiseData = {
                promise: null,
                resolver: null,
                rejecter: null
            };

        /* If this call was made via the utility function (which is the default method of invocation when jQuery/Zepto are not being used), and if
           promise support was detected, create a promise object for this call and store references to its resolver and rejecter methods. The resolve
           method is used when a call completes naturally or is prematurely stopped by the user. In both cases, completeCall() handles the associated
           call cleanup and promise resolving logic. The reject method is used when an invalid set of arguments is passed into a Velocity call. */
        /* Note: Velocity employs a call-based queueing architecture, which means that stopping an animating element actually stops the full call that
           triggered it -- not that one element exclusively. Similarly, there is one promise per call, and all elements targeted by a Velocity call are
           grouped together for the purposes of resolving and rejecting a promise. */
        if (isUtility && Velocity.Promise) {
            promiseData.promise = new Velocity.Promise(function (resolve, reject) {
                promiseData.resolver = resolve;
                promiseData.rejecter = reject;
            });
        }

        /*********************
           Action Detection
        *********************/

        /* Velocity's behavior is categorized into "actions": Elements can either be specially scrolled into view,
           or they can be started, stopped, or reversed. If a literal or referenced properties map is passed in as Velocity's
           first argument, the associated action is "start". Alternatively, "scroll", "reverse", or "stop" can be passed in instead of a properties map. */
        var action;

        switch (propertiesMap) {
            case "scroll":
                action = "scroll";
                break;

            case "reverse":
                action = "reverse";
                break;

            case "finish":
            case "finishAll":
            case "stop":
                /*******************
                    Action: Stop
                *******************/

                /* Clear the currently-active delay on each targeted element. */
                $.each(elements, function(i, element) {
                    if (Data(element) && Data(element).delayTimer) {
                        /* Stop the timer from triggering its cached next() function. */
                        clearTimeout(Data(element).delayTimer.setTimeout);

                        /* Manually call the next() function so that the subsequent queue items can progress. */
                        if (Data(element).delayTimer.next) {
                            Data(element).delayTimer.next();
                        }

                        delete Data(element).delayTimer;
                    }

                    /* If we want to finish everything in the queue, we have to iterate through it
                       and call each function. This will make them active calls below, which will
                       cause them to be applied via the duration setting. */
                    if (propertiesMap === "finishAll" && (options === true || Type.isString(options))) {
                        /* Iterate through the items in the element's queue. */
                        $.each($.queue(element, Type.isString(options) ? options : ""), function(_, item) {
                            /* The queue array can contain an "inprogress" string, which we skip. */
                            if (Type.isFunction(item)) {
                                item();
                            }
                        });

                        /* Clearing the $.queue() array is achieved by resetting it to []. */
                        $.queue(element, Type.isString(options) ? options : "", []);
                    }
                });

                var callsToStop = [];

                /* When the stop action is triggered, the elements' currently active call is immediately stopped. The active call might have
                   been applied to multiple elements, in which case all of the call's elements will be stopped. When an element
                   is stopped, the next item in its animation queue is immediately triggered. */
                /* An additional argument may be passed in to clear an element's remaining queued calls. Either true (which defaults to the "fx" queue)
                   or a custom queue string can be passed in. */
                /* Note: The stop command runs prior to Velocity's Queueing phase since its behavior is intended to take effect *immediately*,
                   regardless of the element's current queue state. */

                /* Iterate through every active call. */
                $.each(Velocity.State.calls, function(i, activeCall) {
                    /* Inactive calls are set to false by the logic inside completeCall(). Skip them. */
                    if (activeCall) {
                        /* Iterate through the active call's targeted elements. */
                        $.each(activeCall[1], function(k, activeElement) {
                            /* If true was passed in as a secondary argument, clear absolutely all calls on this element. Otherwise, only
                               clear calls associated with the relevant queue. */
                            /* Call stopping logic works as follows:
                               - options === true --> stop current default queue calls (and queue:false calls), including remaining queued ones.
                               - options === undefined --> stop current queue:"" call and all queue:false calls.
                               - options === false --> stop only queue:false calls.
                               - options === "custom" --> stop current queue:"custom" call, including remaining queued ones (there is no functionality to only clear the currently-running queue:"custom" call). */
                            var queueName = (options === undefined) ? "" : options;

                            if (queueName !== true && (activeCall[2].queue !== queueName) && !(options === undefined && activeCall[2].queue === false)) {
                                return true;
                            }

                            /* Iterate through the calls targeted by the stop command. */
                            $.each(elements, function(l, element) {
                                /* Check that this call was applied to the target element. */
                                if (element === activeElement) {
                                    /* Optionally clear the remaining queued calls. If we're doing "finishAll" this won't find anything,
                                       due to the queue-clearing above. */
                                    if (options === true || Type.isString(options)) {
                                        /* Iterate through the items in the element's queue. */
                                        $.each($.queue(element, Type.isString(options) ? options : ""), function(_, item) {
                                            /* The queue array can contain an "inprogress" string, which we skip. */
                                            if (Type.isFunction(item)) {
                                                /* Pass the item's callback a flag indicating that we want to abort from the queue call.
                                                   (Specifically, the queue will resolve the call's associated promise then abort.)  */
                                                item(null, true);
                                            }
                                        });

                                        /* Clearing the $.queue() array is achieved by resetting it to []. */
                                        $.queue(element, Type.isString(options) ? options : "", []);
                                    }

                                    if (propertiesMap === "stop") {
                                        /* Since "reverse" uses cached start values (the previous call's endValues), these values must be
                                           changed to reflect the final value that the elements were actually tweened to. */
                                        /* Note: If only queue:false animations are currently running on an element, it won't have a tweensContainer
                                           object. Also, queue:false animations can't be reversed. */
                                        if (Data(element) && Data(element).tweensContainer && queueName !== false) {
                                            $.each(Data(element).tweensContainer, function(m, activeTween) {
                                                activeTween.endValue = activeTween.currentValue;
                                            });
                                        }

                                        callsToStop.push(i);
                                    } else if (propertiesMap === "finish" || propertiesMap === "finishAll") {
                                        /* To get active tweens to finish immediately, we forcefully shorten their durations to 1ms so that
                                        they finish upon the next rAf tick then proceed with normal call completion logic. */
                                        activeCall[2].duration = 1;
                                    }
                                }
                            });
                        });
                    }
                });

                /* Prematurely call completeCall() on each matched active call. Pass an additional flag for "stop" to indicate
                   that the complete callback and display:none setting should be skipped since we're completing prematurely. */
                if (propertiesMap === "stop") {
                    $.each(callsToStop, function(i, j) {
                        completeCall(j, true);
                    });

                    if (promiseData.promise) {
                        /* Immediately resolve the promise associated with this stop call since stop runs synchronously. */
                        promiseData.resolver(elements);
                    }
                }

                /* Since we're stopping, and not proceeding with queueing, exit out of Velocity. */
                return getChain();

            default:
                /* Treat a non-empty plain object as a literal properties map. */
                if ($.isPlainObject(propertiesMap) && !Type.isEmptyObject(propertiesMap)) {
                    action = "start";

                /****************
                    Redirects
                ****************/

                /* Check if a string matches a registered redirect (see Redirects above). */
                } else if (Type.isString(propertiesMap) && Velocity.Redirects[propertiesMap]) {
                    var opts = $.extend({}, options),
                        durationOriginal = opts.duration,
                        delayOriginal = opts.delay || 0;

                    /* If the backwards option was passed in, reverse the element set so that elements animate from the last to the first. */
                    if (opts.backwards === true) {
                        elements = $.extend(true, [], elements).reverse();
                    }

                    /* Individually trigger the redirect for each element in the set to prevent users from having to handle iteration logic in their redirect. */
                    $.each(elements, function(elementIndex, element) {
                        /* If the stagger option was passed in, successively delay each element by the stagger value (in ms). Retain the original delay value. */
                        if (parseFloat(opts.stagger)) {
                            opts.delay = delayOriginal + (parseFloat(opts.stagger) * elementIndex);
                        } else if (Type.isFunction(opts.stagger)) {
                            opts.delay = delayOriginal + opts.stagger.call(element, elementIndex, elementsLength);
                        }

                        /* If the drag option was passed in, successively increase/decrease (depending on the presense of opts.backwards)
                           the duration of each element's animation, using floors to prevent producing very short durations. */
                        if (opts.drag) {
                            /* Default the duration of UI pack effects (callouts and transitions) to 1000ms instead of the usual default duration of 400ms. */
                            opts.duration = parseFloat(durationOriginal) || (/^(callout|transition)/.test(propertiesMap) ? 1000 : DURATION_DEFAULT);

                            /* For each element, take the greater duration of: A) animation completion percentage relative to the original duration,
                               B) 75% of the original duration, or C) a 200ms fallback (in case duration is already set to a low value).
                               The end result is a baseline of 75% of the redirect's duration that increases/decreases as the end of the element set is approached. */
                            opts.duration = Math.max(opts.duration * (opts.backwards ? 1 - elementIndex/elementsLength : (elementIndex + 1) / elementsLength), opts.duration * 0.75, 200);
                        }

                        /* Pass in the call's opts object so that the redirect can optionally extend it. It defaults to an empty object instead of null to
                           reduce the opts checking logic required inside the redirect. */
                        Velocity.Redirects[propertiesMap].call(element, element, opts || {}, elementIndex, elementsLength, elements, promiseData.promise ? promiseData : undefined);
                    });

                    /* Since the animation logic resides within the redirect's own code, abort the remainder of this call.
                       (The performance overhead up to this point is virtually non-existant.) */
                    /* Note: The jQuery call chain is kept intact by returning the complete element set. */
                    return getChain();
                } else {
                    var abortError = "Velocity: First argument (" + propertiesMap + ") was not a property map, a known action, or a registered redirect. Aborting.";

                    if (promiseData.promise) {
                        promiseData.rejecter(new Error(abortError));
                    } else {
                        console.log(abortError);
                    }

                    return getChain();
                }
        }

        /**************************
            Call-Wide Variables
        **************************/

        /* A container for CSS unit conversion ratios (e.g. %, rem, and em ==> px) that is used to cache ratios across all elements
           being animated in a single Velocity call. Calculating unit ratios necessitates DOM querying and updating, and is therefore
           avoided (via caching) wherever possible. This container is call-wide instead of page-wide to avoid the risk of using stale
           conversion metrics across Velocity animations that are not immediately consecutively chained. */
        var callUnitConversionData = {
                lastParent: null,
                lastPosition: null,
                lastFontSize: null,
                lastPercentToPxWidth: null,
                lastPercentToPxHeight: null,
                lastEmToPx: null,
                remToPx: null,
                vwToPx: null,
                vhToPx: null
            };

        /* A container for all the ensuing tween data and metadata associated with this call. This container gets pushed to the page-wide
           Velocity.State.calls array that is processed during animation ticking. */
        var call = [];

        /************************
           Element Processing
        ************************/

        /* Element processing consists of three parts -- data processing that cannot go stale and data processing that *can* go stale (i.e. third-party style modifications):
           1) Pre-Queueing: Element-wide variables, including the element's data storage, are instantiated. Call options are prepared. If triggered, the Stop action is executed.
           2) Queueing: The logic that runs once this call has reached its point of execution in the element's $.queue() stack. Most logic is placed here to avoid risking it becoming stale.
           3) Pushing: Consolidation of the tween data followed by its push onto the global in-progress calls container.
        */

        function processElement () {

            /*************************
               Part I: Pre-Queueing
            *************************/

            /***************************
               Element-Wide Variables
            ***************************/

            var element = this,
                /* The runtime opts object is the extension of the current call's options and Velocity's page-wide option defaults. */
                opts = $.extend({}, Velocity.defaults, options),
                /* A container for the processed data associated with each property in the propertyMap.
                   (Each property in the map produces its own "tween".) */
                tweensContainer = {},
                elementUnitConversionData;

            /******************
               Element Init
            ******************/

            if (Data(element) === undefined) {
                Velocity.init(element);
            }

            /******************
               Option: Delay
            ******************/

            /* Since queue:false doesn't respect the item's existing queue, we avoid injecting its delay here (it's set later on). */
            /* Note: Velocity rolls its own delay function since jQuery doesn't have a utility alias for $.fn.delay()
               (and thus requires jQuery element creation, which we avoid since its overhead includes DOM querying). */
            if (parseFloat(opts.delay) && opts.queue !== false) {
                $.queue(element, opts.queue, function(next) {
                    /* This is a flag used to indicate to the upcoming completeCall() function that this queue entry was initiated by Velocity. See completeCall() for further details. */
                    Velocity.velocityQueueEntryFlag = true;

                    /* The ensuing queue item (which is assigned to the "next" argument that $.queue() automatically passes in) will be triggered after a setTimeout delay.
                       The setTimeout is stored so that it can be subjected to clearTimeout() if this animation is prematurely stopped via Velocity's "stop" command. */
                    Data(element).delayTimer = {
                        setTimeout: setTimeout(next, parseFloat(opts.delay)),
                        next: next
                    };
                });
            }

            /*********************
               Option: Duration
            *********************/

            /* Support for jQuery's named durations. */
            switch (opts.duration.toString().toLowerCase()) {
                case "fast":
                    opts.duration = 200;
                    break;

                case "normal":
                    opts.duration = DURATION_DEFAULT;
                    break;

                case "slow":
                    opts.duration = 600;
                    break;

                default:
                    /* Remove the potential "ms" suffix and default to 1 if the user is attempting to set a duration of 0 (in order to produce an immediate style change). */
                    opts.duration = parseFloat(opts.duration) || 1;
            }

            /************************
               Global Option: Mock
            ************************/

            if (Velocity.mock !== false) {
                /* In mock mode, all animations are forced to 1ms so that they occur immediately upon the next rAF tick.
                   Alternatively, a multiplier can be passed in to time remap all delays and durations. */
                if (Velocity.mock === true) {
                    opts.duration = opts.delay = 1;
                } else {
                    opts.duration *= parseFloat(Velocity.mock) || 1;
                    opts.delay *= parseFloat(Velocity.mock) || 1;
                }
            }

            /*******************
               Option: Easing
            *******************/

            opts.easing = getEasing(opts.easing, opts.duration);

            /**********************
               Option: Callbacks
            **********************/

            /* Callbacks must functions. Otherwise, default to null. */
            if (opts.begin && !Type.isFunction(opts.begin)) {
                opts.begin = null;
            }

            if (opts.progress && !Type.isFunction(opts.progress)) {
                opts.progress = null;
            }

            if (opts.complete && !Type.isFunction(opts.complete)) {
                opts.complete = null;
            }

            /*********************************
               Option: Display & Visibility
            *********************************/

            /* Refer to Velocity's documentation (VelocityJS.org/#displayAndVisibility) for a description of the display and visibility options' behavior. */
            /* Note: We strictly check for undefined instead of falsiness because display accepts an empty string value. */
            if (opts.display !== undefined && opts.display !== null) {
                opts.display = opts.display.toString().toLowerCase();

                /* Users can pass in a special "auto" value to instruct Velocity to set the element to its default display value. */
                if (opts.display === "auto") {
                    opts.display = Velocity.CSS.Values.getDisplayType(element);
                }
            }

            if (opts.visibility !== undefined && opts.visibility !== null) {
                opts.visibility = opts.visibility.toString().toLowerCase();
            }

            /**********************
               Option: mobileHA
            **********************/

            /* When set to true, and if this is a mobile device, mobileHA automatically enables hardware acceleration (via a null transform hack)
               on animating elements. HA is removed from the element at the completion of its animation. */
            /* Note: Android Gingerbread doesn't support HA. If a null transform hack (mobileHA) is in fact set, it will prevent other tranform subproperties from taking effect. */
            /* Note: You can read more about the use of mobileHA in Velocity's documentation: VelocityJS.org/#mobileHA. */
            opts.mobileHA = (opts.mobileHA && Velocity.State.isMobile && !Velocity.State.isGingerbread);

            /***********************
               Part II: Queueing
            ***********************/

            /* When a set of elements is targeted by a Velocity call, the set is broken up and each element has the current Velocity call individually queued onto it.
               In this way, each element's existing queue is respected; some elements may already be animating and accordingly should not have this current Velocity call triggered immediately. */
            /* In each queue, tween data is processed for each animating property then pushed onto the call-wide calls array. When the last element in the set has had its tweens processed,
               the call array is pushed to Velocity.State.calls for live processing by the requestAnimationFrame tick. */
            function buildQueue (next) {

                /*******************
                   Option: Begin
                *******************/

                /* The begin callback is fired once per call -- not once per elemenet -- and is passed the full raw DOM element set as both its context and its first argument. */
                if (opts.begin && elementsIndex === 0) {
                    /* We throw callbacks in a setTimeout so that thrown errors don't halt the execution of Velocity itself. */
                    try {
                        opts.begin.call(elements, elements);
                    } catch (error) {
                        setTimeout(function() { throw error; }, 1);
                    }
                }

                /*****************************************
                   Tween Data Construction (for Scroll)
                *****************************************/

                /* Note: In order to be subjected to chaining and animation options, scroll's tweening is routed through Velocity as if it were a standard CSS property animation. */
                if (action === "scroll") {
                    /* The scroll action uniquely takes an optional "offset" option -- specified in pixels -- that offsets the targeted scroll position. */
                    var scrollDirection = (/^x$/i.test(opts.axis) ? "Left" : "Top"),
                        scrollOffset = parseFloat(opts.offset) || 0,
                        scrollPositionCurrent,
                        scrollPositionCurrentAlternate,
                        scrollPositionEnd;

                    /* Scroll also uniquely takes an optional "container" option, which indicates the parent element that should be scrolled --
                       as opposed to the browser window itself. This is useful for scrolling toward an element that's inside an overflowing parent element. */
                    if (opts.container) {
                        /* Ensure that either a jQuery object or a raw DOM element was passed in. */
                        if (Type.isWrapped(opts.container) || Type.isNode(opts.container)) {
                            /* Extract the raw DOM element from the jQuery wrapper. */
                            opts.container = opts.container[0] || opts.container;
                            /* Note: Unlike other properties in Velocity, the browser's scroll position is never cached since it so frequently changes
                               (due to the user's natural interaction with the page). */
                            scrollPositionCurrent = opts.container["scroll" + scrollDirection]; /* GET */

                            /* $.position() values are relative to the container's currently viewable area (without taking into account the container's true dimensions
                               -- say, for example, if the container was not overflowing). Thus, the scroll end value is the sum of the child element's position *and*
                               the scroll container's current scroll position. */
                            scrollPositionEnd = (scrollPositionCurrent + $(element).position()[scrollDirection.toLowerCase()]) + scrollOffset; /* GET */
                        /* If a value other than a jQuery object or a raw DOM element was passed in, default to null so that this option is ignored. */
                        } else {
                            opts.container = null;
                        }
                    } else {
                        /* If the window itself is being scrolled -- not a containing element -- perform a live scroll position lookup using
                           the appropriate cached property names (which differ based on browser type). */
                        scrollPositionCurrent = Velocity.State.scrollAnchor[Velocity.State["scrollProperty" + scrollDirection]]; /* GET */
                        /* When scrolling the browser window, cache the alternate axis's current value since window.scrollTo() doesn't let us change only one value at a time. */
                        scrollPositionCurrentAlternate = Velocity.State.scrollAnchor[Velocity.State["scrollProperty" + (scrollDirection === "Left" ? "Top" : "Left")]]; /* GET */

                        /* Unlike $.position(), $.offset() values are relative to the browser window's true dimensions -- not merely its currently viewable area --
                           and therefore end values do not need to be compounded onto current values. */
                        scrollPositionEnd = $(element).offset()[scrollDirection.toLowerCase()] + scrollOffset; /* GET */
                    }

                    /* Since there's only one format that scroll's associated tweensContainer can take, we create it manually. */
                    tweensContainer = {
                        scroll: {
                            rootPropertyValue: false,
                            startValue: scrollPositionCurrent,
                            currentValue: scrollPositionCurrent,
                            endValue: scrollPositionEnd,
                            unitType: "",
                            easing: opts.easing,
                            scrollData: {
                                container: opts.container,
                                direction: scrollDirection,
                                alternateValue: scrollPositionCurrentAlternate
                            }
                        },
                        element: element
                    };

                    if (Velocity.debug) console.log("tweensContainer (scroll): ", tweensContainer.scroll, element);

                /******************************************
                   Tween Data Construction (for Reverse)
                ******************************************/

                /* Reverse acts like a "start" action in that a property map is animated toward. The only difference is
                   that the property map used for reverse is the inverse of the map used in the previous call. Thus, we manipulate
                   the previous call to construct our new map: use the previous map's end values as our new map's start values. Copy over all other data. */
                /* Note: Reverse can be directly called via the "reverse" parameter, or it can be indirectly triggered via the loop option. (Loops are composed of multiple reverses.) */
                /* Note: Reverse calls do not need to be consecutively chained onto a currently-animating element in order to operate on cached values;
                   there is no harm to reverse being called on a potentially stale data cache since reverse's behavior is simply defined
                   as reverting to the element's values as they were prior to the previous *Velocity* call. */
                } else if (action === "reverse") {
                    /* Abort if there is no prior animation data to reverse to. */
                    if (!Data(element).tweensContainer) {
                        /* Dequeue the element so that this queue entry releases itself immediately, allowing subsequent queue entries to run. */
                        $.dequeue(element, opts.queue);

                        return;
                    } else {
                        /*********************
                           Options Parsing
                        *********************/

                        /* If the element was hidden via the display option in the previous call,
                           revert display to "auto" prior to reversal so that the element is visible again. */
                        if (Data(element).opts.display === "none") {
                            Data(element).opts.display = "auto";
                        }

                        if (Data(element).opts.visibility === "hidden") {
                            Data(element).opts.visibility = "visible";
                        }

                        /* If the loop option was set in the previous call, disable it so that "reverse" calls aren't recursively generated.
                           Further, remove the previous call's callback options; typically, users do not want these to be refired. */
                        Data(element).opts.loop = false;
                        Data(element).opts.begin = null;
                        Data(element).opts.complete = null;

                        /* Since we're extending an opts object that has already been extended with the defaults options object,
                           we remove non-explicitly-defined properties that are auto-assigned values. */
                        if (!options.easing) {
                            delete opts.easing;
                        }

                        if (!options.duration) {
                            delete opts.duration;
                        }

                        /* The opts object used for reversal is an extension of the options object optionally passed into this
                           reverse call plus the options used in the previous Velocity call. */
                        opts = $.extend({}, Data(element).opts, opts);

                        /*************************************
                           Tweens Container Reconstruction
                        *************************************/

                        /* Create a deepy copy (indicated via the true flag) of the previous call's tweensContainer. */
                        var lastTweensContainer = $.extend(true, {}, Data(element).tweensContainer);

                        /* Manipulate the previous tweensContainer by replacing its end values and currentValues with its start values. */
                        for (var lastTween in lastTweensContainer) {
                            /* In addition to tween data, tweensContainers contain an element property that we ignore here. */
                            if (lastTween !== "element") {
                                var lastStartValue = lastTweensContainer[lastTween].startValue;

                                lastTweensContainer[lastTween].startValue = lastTweensContainer[lastTween].currentValue = lastTweensContainer[lastTween].endValue;
                                lastTweensContainer[lastTween].endValue = lastStartValue;

                                /* Easing is the only option that embeds into the individual tween data (since it can be defined on a per-property basis).
                                   Accordingly, every property's easing value must be updated when an options object is passed in with a reverse call.
                                   The side effect of this extensibility is that all per-property easing values are forcefully reset to the new value. */
                                if (!Type.isEmptyObject(options)) {
                                    lastTweensContainer[lastTween].easing = opts.easing;
                                }

                                if (Velocity.debug) console.log("reverse tweensContainer (" + lastTween + "): " + JSON.stringify(lastTweensContainer[lastTween]), element);
                            }
                        }

                        tweensContainer = lastTweensContainer;
                    }

                /*****************************************
                   Tween Data Construction (for Start)
                *****************************************/

                } else if (action === "start") {

                    /*************************
                        Value Transferring
                    *************************/

                    /* If this queue entry follows a previous Velocity-initiated queue entry *and* if this entry was created
                       while the element was in the process of being animated by Velocity, then this current call is safe to use
                       the end values from the prior call as its start values. Velocity attempts to perform this value transfer
                       process whenever possible in order to avoid requerying the DOM. */
                    /* If values aren't transferred from a prior call and start values were not forcefed by the user (more on this below),
                       then the DOM is queried for the element's current values as a last resort. */
                    /* Note: Conversely, animation reversal (and looping) *always* perform inter-call value transfers; they never requery the DOM. */
                    var lastTweensContainer;

                    /* The per-element isAnimating flag is used to indicate whether it's safe (i.e. the data isn't stale)
                       to transfer over end values to use as start values. If it's set to true and there is a previous
                       Velocity call to pull values from, do so. */
                    if (Data(element).tweensContainer && Data(element).isAnimating === true) {
                        lastTweensContainer = Data(element).tweensContainer;
                    }

                    /***************************
                       Tween Data Calculation
                    ***************************/

                    /* This function parses property data and defaults endValue, easing, and startValue as appropriate. */
                    /* Property map values can either take the form of 1) a single value representing the end value,
                       or 2) an array in the form of [ endValue, [, easing] [, startValue] ].
                       The optional third parameter is a forcefed startValue to be used instead of querying the DOM for
                       the element's current value. Read Velocity's docmentation to learn more about forcefeeding: VelocityJS.org/#forcefeeding */
                    function parsePropertyValue (valueData, skipResolvingEasing) {
                        var endValue = undefined,
                            easing = undefined,
                            startValue = undefined;

                        /* Handle the array format, which can be structured as one of three potential overloads:
                           A) [ endValue, easing, startValue ], B) [ endValue, easing ], or C) [ endValue, startValue ] */
                        if (Type.isArray(valueData)) {
                            /* endValue is always the first item in the array. Don't bother validating endValue's value now
                               since the ensuing property cycling logic does that. */
                            endValue = valueData[0];

                            /* Two-item array format: If the second item is a number, function, or hex string, treat it as a
                               start value since easings can only be non-hex strings or arrays. */
                            if ((!Type.isArray(valueData[1]) && /^[\d-]/.test(valueData[1])) || Type.isFunction(valueData[1]) || CSS.RegEx.isHex.test(valueData[1])) {
                                startValue = valueData[1];
                            /* Two or three-item array: If the second item is a non-hex string or an array, treat it as an easing. */
                            } else if ((Type.isString(valueData[1]) && !CSS.RegEx.isHex.test(valueData[1])) || Type.isArray(valueData[1])) {
                                easing = skipResolvingEasing ? valueData[1] : getEasing(valueData[1], opts.duration);

                                /* Don't bother validating startValue's value now since the ensuing property cycling logic inherently does that. */
                                if (valueData[2] !== undefined) {
                                    startValue = valueData[2];
                                }
                            }
                        /* Handle the single-value format. */
                        } else {
                            endValue = valueData;
                        }

                        /* Default to the call's easing if a per-property easing type was not defined. */
                        if (!skipResolvingEasing) {
                            easing = easing || opts.easing;
                        }

                        /* If functions were passed in as values, pass the function the current element as its context,
                           plus the element's index and the element set's size as arguments. Then, assign the returned value. */
                        if (Type.isFunction(endValue)) {
                            endValue = endValue.call(element, elementsIndex, elementsLength);
                        }

                        if (Type.isFunction(startValue)) {
                            startValue = startValue.call(element, elementsIndex, elementsLength);
                        }

                        /* Allow startValue to be left as undefined to indicate to the ensuing code that its value was not forcefed. */
                        return [ endValue || 0, easing, startValue ];
                    }

                    /* Cycle through each property in the map, looking for shorthand color properties (e.g. "color" as opposed to "colorRed"). Inject the corresponding
                       colorRed, colorGreen, and colorBlue RGB component tweens into the propertiesMap (which Velocity understands) and remove the shorthand property. */
                    $.each(propertiesMap, function(property, value) {
                        /* Find shorthand color properties that have been passed a hex string. */
                        if (RegExp("^" + CSS.Lists.colors.join("$|^") + "$").test(property)) {
                            /* Parse the value data for each shorthand. */
                            var valueData = parsePropertyValue(value, true),
                                endValue = valueData[0],
                                easing = valueData[1],
                                startValue = valueData[2];

                            if (CSS.RegEx.isHex.test(endValue)) {
                                /* Convert the hex strings into their RGB component arrays. */
                                var colorComponents = [ "Red", "Green", "Blue" ],
                                    endValueRGB = CSS.Values.hexToRgb(endValue),
                                    startValueRGB = startValue ? CSS.Values.hexToRgb(startValue) : undefined;

                                /* Inject the RGB component tweens into propertiesMap. */
                                for (var i = 0; i < colorComponents.length; i++) {
                                    var dataArray = [ endValueRGB[i] ];

                                    if (easing) {
                                        dataArray.push(easing);
                                    }

                                    if (startValueRGB !== undefined) {
                                        dataArray.push(startValueRGB[i]);
                                    }

                                    propertiesMap[property + colorComponents[i]] = dataArray;
                                }

                                /* Remove the intermediary shorthand property entry now that we've processed it. */
                                delete propertiesMap[property];
                            }
                        }
                    });

                    /* Create a tween out of each property, and append its associated data to tweensContainer. */
                    for (var property in propertiesMap) {

                        /**************************
                           Start Value Sourcing
                        **************************/

                        /* Parse out endValue, easing, and startValue from the property's data. */
                        var valueData = parsePropertyValue(propertiesMap[property]),
                            endValue = valueData[0],
                            easing = valueData[1],
                            startValue = valueData[2];

                        /* Now that the original property name's format has been used for the parsePropertyValue() lookup above,
                           we force the property to its camelCase styling to normalize it for manipulation. */
                        property = CSS.Names.camelCase(property);

                        /* In case this property is a hook, there are circumstances where we will intend to work on the hook's root property and not the hooked subproperty. */
                        var rootProperty = CSS.Hooks.getRoot(property),
                            rootPropertyValue = false;

                        /* Other than for the dummy tween property, properties that are not supported by the browser (and do not have an associated normalization) will
                           inherently produce no style changes when set, so they are skipped in order to decrease animation tick overhead.
                           Property support is determined via prefixCheck(), which returns a false flag when no supported is detected. */
                        /* Note: Since SVG elements have some of their properties directly applied as HTML attributes,
                           there is no way to check for their explicit browser support, and so we skip skip this check for them. */
                        if (!Data(element).isSVG && rootProperty !== "tween" && CSS.Names.prefixCheck(rootProperty)[1] === false && CSS.Normalizations.registered[rootProperty] === undefined) {
                            if (Velocity.debug) console.log("Skipping [" + rootProperty + "] due to a lack of browser support.");

                            continue;
                        }

                        /* If the display option is being set to a non-"none" (e.g. "block") and opacity (filter on IE<=8) is being
                           animated to an endValue of non-zero, the user's intention is to fade in from invisible, thus we forcefeed opacity
                           a startValue of 0 if its startValue hasn't already been sourced by value transferring or prior forcefeeding. */
                        if (((opts.display !== undefined && opts.display !== null && opts.display !== "none") || (opts.visibility !== undefined && opts.visibility !== "hidden")) && /opacity|filter/.test(property) && !startValue && endValue !== 0) {
                            startValue = 0;
                        }

                        /* If values have been transferred from the previous Velocity call, extract the endValue and rootPropertyValue
                           for all of the current call's properties that were *also* animated in the previous call. */
                        /* Note: Value transferring can optionally be disabled by the user via the _cacheValues option. */
                        if (opts._cacheValues && lastTweensContainer && lastTweensContainer[property]) {
                            if (startValue === undefined) {
                                startValue = lastTweensContainer[property].endValue + lastTweensContainer[property].unitType;
                            }

                            /* The previous call's rootPropertyValue is extracted from the element's data cache since that's the
                               instance of rootPropertyValue that gets freshly updated by the tweening process, whereas the rootPropertyValue
                               attached to the incoming lastTweensContainer is equal to the root property's value prior to any tweening. */
                            rootPropertyValue = Data(element).rootPropertyValueCache[rootProperty];
                        /* If values were not transferred from a previous Velocity call, query the DOM as needed. */
                        } else {
                            /* Handle hooked properties. */
                            if (CSS.Hooks.registered[property]) {
                               if (startValue === undefined) {
                                    rootPropertyValue = CSS.getPropertyValue(element, rootProperty); /* GET */
                                    /* Note: The following getPropertyValue() call does not actually trigger a DOM query;
                                       getPropertyValue() will extract the hook from rootPropertyValue. */
                                    startValue = CSS.getPropertyValue(element, property, rootPropertyValue);
                                /* If startValue is already defined via forcefeeding, do not query the DOM for the root property's value;
                                   just grab rootProperty's zero-value template from CSS.Hooks. This overwrites the element's actual
                                   root property value (if one is set), but this is acceptable since the primary reason users forcefeed is
                                   to avoid DOM queries, and thus we likewise avoid querying the DOM for the root property's value. */
                                } else {
                                    /* Grab this hook's zero-value template, e.g. "0px 0px 0px black". */
                                    rootPropertyValue = CSS.Hooks.templates[rootProperty][1];
                                }
                            /* Handle non-hooked properties that haven't already been defined via forcefeeding. */
                            } else if (startValue === undefined) {
                                startValue = CSS.getPropertyValue(element, property); /* GET */
                            }
                        }

                        /**************************
                           Value Data Extraction
                        **************************/

                        var separatedValue,
                            endValueUnitType,
                            startValueUnitType,
                            operator = false;

                        /* Separates a property value into its numeric value and its unit type. */
                        function separateValue (property, value) {
                            var unitType,
                                numericValue;

                            numericValue = (value || "0")
                                .toString()
                                .toLowerCase()
                                /* Match the unit type at the end of the value. */
                                .replace(/[%A-z]+$/, function(match) {
                                    /* Grab the unit type. */
                                    unitType = match;

                                    /* Strip the unit type off of value. */
                                    return "";
                                });

                            /* If no unit type was supplied, assign one that is appropriate for this property (e.g. "deg" for rotateZ or "px" for width). */
                            if (!unitType) {
                                unitType = CSS.Values.getUnitType(property);
                            }

                            return [ numericValue, unitType ];
                        }

                        /* Separate startValue. */
                        separatedValue = separateValue(property, startValue);
                        startValue = separatedValue[0];
                        startValueUnitType = separatedValue[1];

                        /* Separate endValue, and extract a value operator (e.g. "+=", "-=") if one exists. */
                        separatedValue = separateValue(property, endValue);
                        endValue = separatedValue[0].replace(/^([+-\/*])=/, function(match, subMatch) {
                            operator = subMatch;

                            /* Strip the operator off of the value. */
                            return "";
                        });
                        endValueUnitType = separatedValue[1];

                        /* Parse float values from endValue and startValue. Default to 0 if NaN is returned. */
                        startValue = parseFloat(startValue) || 0;
                        endValue = parseFloat(endValue) || 0;

                        /***************************************
                           Property-Specific Value Conversion
                        ***************************************/

                        /* Custom support for properties that don't actually accept the % unit type, but where pollyfilling is trivial and relatively foolproof. */
                        if (endValueUnitType === "%") {
                            /* A %-value fontSize/lineHeight is relative to the parent's fontSize (as opposed to the parent's dimensions),
                               which is identical to the em unit's behavior, so we piggyback off of that. */
                            if (/^(fontSize|lineHeight)$/.test(property)) {
                                /* Convert % into an em decimal value. */
                                endValue = endValue / 100;
                                endValueUnitType = "em";
                            /* For scaleX and scaleY, convert the value into its decimal format and strip off the unit type. */
                            } else if (/^scale/.test(property)) {
                                endValue = endValue / 100;
                                endValueUnitType = "";
                            /* For RGB components, take the defined percentage of 255 and strip off the unit type. */
                            } else if (/(Red|Green|Blue)$/i.test(property)) {
                                endValue = (endValue / 100) * 255;
                                endValueUnitType = "";
                            }
                        }

                        /***************************
                           Unit Ratio Calculation
                        ***************************/

                        /* When queried, the browser returns (most) CSS property values in pixels. Therefore, if an endValue with a unit type of
                           %, em, or rem is animated toward, startValue must be converted from pixels into the same unit type as endValue in order
                           for value manipulation logic (increment/decrement) to proceed. Further, if the startValue was forcefed or transferred
                           from a previous call, startValue may also not be in pixels. Unit conversion logic therefore consists of two steps:
                           1) Calculating the ratio of %/em/rem/vh/vw relative to pixels
                           2) Converting startValue into the same unit of measurement as endValue based on these ratios. */
                        /* Unit conversion ratios are calculated by inserting a sibling node next to the target node, copying over its position property,
                           setting values with the target unit type then comparing the returned pixel value. */
                        /* Note: Even if only one of these unit types is being animated, all unit ratios are calculated at once since the overhead
                           of batching the SETs and GETs together upfront outweights the potential overhead
                           of layout thrashing caused by re-querying for uncalculated ratios for subsequently-processed properties. */
                        /* Todo: Shift this logic into the calls' first tick instance so that it's synced with RAF. */
                        function calculateUnitRatios () {

                            /************************
                                Same Ratio Checks
                            ************************/

                            /* The properties below are used to determine whether the element differs sufficiently from this call's
                               previously iterated element to also differ in its unit conversion ratios. If the properties match up with those
                               of the prior element, the prior element's conversion ratios are used. Like most optimizations in Velocity,
                               this is done to minimize DOM querying. */
                            var sameRatioIndicators = {
                                    myParent: element.parentNode || document.body, /* GET */
                                    position: CSS.getPropertyValue(element, "position"), /* GET */
                                    fontSize: CSS.getPropertyValue(element, "fontSize") /* GET */
                                },
                                /* Determine if the same % ratio can be used. % is based on the element's position value and its parent's width and height dimensions. */
                                samePercentRatio = ((sameRatioIndicators.position === callUnitConversionData.lastPosition) && (sameRatioIndicators.myParent === callUnitConversionData.lastParent)),
                                /* Determine if the same em ratio can be used. em is relative to the element's fontSize. */
                                sameEmRatio = (sameRatioIndicators.fontSize === callUnitConversionData.lastFontSize);

                            /* Store these ratio indicators call-wide for the next element to compare against. */
                            callUnitConversionData.lastParent = sameRatioIndicators.myParent;
                            callUnitConversionData.lastPosition = sameRatioIndicators.position;
                            callUnitConversionData.lastFontSize = sameRatioIndicators.fontSize;

                            /***************************
                               Element-Specific Units
                            ***************************/

                            /* Note: IE8 rounds to the nearest pixel when returning CSS values, thus we perform conversions using a measurement
                               of 100 (instead of 1) to give our ratios a precision of at least 2 decimal values. */
                            var measurement = 100,
                                unitRatios = {};

                            if (!sameEmRatio || !samePercentRatio) {
                                var dummy = Data(element).isSVG ? document.createElementNS("http://www.w3.org/2000/svg", "rect") : document.createElement("div");

                                Velocity.init(dummy);
                                sameRatioIndicators.myParent.appendChild(dummy);

                                /* To accurately and consistently calculate conversion ratios, the element's cascaded overflow and box-sizing are stripped.
                                   Similarly, since width/height can be artificially constrained by their min-/max- equivalents, these are controlled for as well. */
                                /* Note: Overflow must be also be controlled for per-axis since the overflow property overwrites its per-axis values. */
                                $.each([ "overflow", "overflowX", "overflowY" ], function(i, property) {
                                    Velocity.CSS.setPropertyValue(dummy, property, "hidden");
                                });
                                Velocity.CSS.setPropertyValue(dummy, "position", sameRatioIndicators.position);
                                Velocity.CSS.setPropertyValue(dummy, "fontSize", sameRatioIndicators.fontSize);
                                Velocity.CSS.setPropertyValue(dummy, "boxSizing", "content-box");

                                /* width and height act as our proxy properties for measuring the horizontal and vertical % ratios. */
                                $.each([ "minWidth", "maxWidth", "width", "minHeight", "maxHeight", "height" ], function(i, property) {
                                    Velocity.CSS.setPropertyValue(dummy, property, measurement + "%");
                                });
                                /* paddingLeft arbitrarily acts as our proxy property for the em ratio. */
                                Velocity.CSS.setPropertyValue(dummy, "paddingLeft", measurement + "em");

                                /* Divide the returned value by the measurement to get the ratio between 1% and 1px. Default to 1 since working with 0 can produce Infinite. */
                                unitRatios.percentToPxWidth = callUnitConversionData.lastPercentToPxWidth = (parseFloat(CSS.getPropertyValue(dummy, "width", null, true)) || 1) / measurement; /* GET */
                                unitRatios.percentToPxHeight = callUnitConversionData.lastPercentToPxHeight = (parseFloat(CSS.getPropertyValue(dummy, "height", null, true)) || 1) / measurement; /* GET */
                                unitRatios.emToPx = callUnitConversionData.lastEmToPx = (parseFloat(CSS.getPropertyValue(dummy, "paddingLeft")) || 1) / measurement; /* GET */

                                sameRatioIndicators.myParent.removeChild(dummy);
                            } else {
                                unitRatios.emToPx = callUnitConversionData.lastEmToPx;
                                unitRatios.percentToPxWidth = callUnitConversionData.lastPercentToPxWidth;
                                unitRatios.percentToPxHeight = callUnitConversionData.lastPercentToPxHeight;
                            }

                            /***************************
                               Element-Agnostic Units
                            ***************************/

                            /* Whereas % and em ratios are determined on a per-element basis, the rem unit only needs to be checked
                               once per call since it's exclusively dependant upon document.body's fontSize. If this is the first time
                               that calculateUnitRatios() is being run during this call, remToPx will still be set to its default value of null,
                               so we calculate it now. */
                            if (callUnitConversionData.remToPx === null) {
                                /* Default to browsers' default fontSize of 16px in the case of 0. */
                                callUnitConversionData.remToPx = parseFloat(CSS.getPropertyValue(document.body, "fontSize")) || 16; /* GET */
                            }

                            /* Similarly, viewport units are %-relative to the window's inner dimensions. */
                            if (callUnitConversionData.vwToPx === null) {
                                callUnitConversionData.vwToPx = parseFloat(window.innerWidth) / 100; /* GET */
                                callUnitConversionData.vhToPx = parseFloat(window.innerHeight) / 100; /* GET */
                            }

                            unitRatios.remToPx = callUnitConversionData.remToPx;
                            unitRatios.vwToPx = callUnitConversionData.vwToPx;
                            unitRatios.vhToPx = callUnitConversionData.vhToPx;

                            if (Velocity.debug >= 1) console.log("Unit ratios: " + JSON.stringify(unitRatios), element);

                            return unitRatios;
                        }

                        /********************
                           Unit Conversion
                        ********************/

                        /* The * and / operators, which are not passed in with an associated unit, inherently use startValue's unit. Skip value and unit conversion. */
                        if (/[\/*]/.test(operator)) {
                            endValueUnitType = startValueUnitType;
                        /* If startValue and endValue differ in unit type, convert startValue into the same unit type as endValue so that if endValueUnitType
                           is a relative unit (%, em, rem), the values set during tweening will continue to be accurately relative even if the metrics they depend
                           on are dynamically changing during the course of the animation. Conversely, if we always normalized into px and used px for setting values, the px ratio
                           would become stale if the original unit being animated toward was relative and the underlying metrics change during the animation. */
                        /* Since 0 is 0 in any unit type, no conversion is necessary when startValue is 0 -- we just start at 0 with endValueUnitType. */
                        } else if ((startValueUnitType !== endValueUnitType) && startValue !== 0) {
                            /* Unit conversion is also skipped when endValue is 0, but *startValueUnitType* must be used for tween values to remain accurate. */
                            /* Note: Skipping unit conversion here means that if endValueUnitType was originally a relative unit, the animation won't relatively
                               match the underlying metrics if they change, but this is acceptable since we're animating toward invisibility instead of toward visibility,
                               which remains past the point of the animation's completion. */
                            if (endValue === 0) {
                                endValueUnitType = startValueUnitType;
                            } else {
                                /* By this point, we cannot avoid unit conversion (it's undesirable since it causes layout thrashing).
                                   If we haven't already, we trigger calculateUnitRatios(), which runs once per element per call. */
                                elementUnitConversionData = elementUnitConversionData || calculateUnitRatios();

                                /* The following RegEx matches CSS properties that have their % values measured relative to the x-axis. */
                                /* Note: W3C spec mandates that all of margin and padding's properties (even top and bottom) are %-relative to the *width* of the parent element. */
                                var axis = (/margin|padding|left|right|width|text|word|letter/i.test(property) || /X$/.test(property) || property === "x") ? "x" : "y";

                                /* In order to avoid generating n^2 bespoke conversion functions, unit conversion is a two-step process:
                                   1) Convert startValue into pixels. 2) Convert this new pixel value into endValue's unit type. */
                                switch (startValueUnitType) {
                                    case "%":
                                        /* Note: translateX and translateY are the only properties that are %-relative to an element's own dimensions -- not its parent's dimensions.
                                           Velocity does not include a special conversion process to account for this behavior. Therefore, animating translateX/Y from a % value
                                           to a non-% value will produce an incorrect start value. Fortunately, this sort of cross-unit conversion is rarely done by users in practice. */
                                        startValue *= (axis === "x" ? elementUnitConversionData.percentToPxWidth : elementUnitConversionData.percentToPxHeight);
                                        break;

                                    case "px":
                                        /* px acts as our midpoint in the unit conversion process; do nothing. */
                                        break;

                                    default:
                                        startValue *= elementUnitConversionData[startValueUnitType + "ToPx"];
                                }

                                /* Invert the px ratios to convert into to the target unit. */
                                switch (endValueUnitType) {
                                    case "%":
                                        startValue *= 1 / (axis === "x" ? elementUnitConversionData.percentToPxWidth : elementUnitConversionData.percentToPxHeight);
                                        break;

                                    case "px":
                                        /* startValue is already in px, do nothing; we're done. */
                                        break;

                                    default:
                                        startValue *= 1 / elementUnitConversionData[endValueUnitType + "ToPx"];
                                }
                            }
                        }

                        /*********************
                           Relative Values
                        *********************/

                        /* Operator logic must be performed last since it requires unit-normalized start and end values. */
                        /* Note: Relative *percent values* do not behave how most people think; while one would expect "+=50%"
                           to increase the property 1.5x its current value, it in fact increases the percent units in absolute terms:
                           50 points is added on top of the current % value. */
                        switch (operator) {
                            case "+":
                                endValue = startValue + endValue;
                                break;

                            case "-":
                                endValue = startValue - endValue;
                                break;

                            case "*":
                                endValue = startValue * endValue;
                                break;

                            case "/":
                                endValue = startValue / endValue;
                                break;
                        }

                        /**************************
                           tweensContainer Push
                        **************************/

                        /* Construct the per-property tween object, and push it to the element's tweensContainer. */
                        tweensContainer[property] = {
                            rootPropertyValue: rootPropertyValue,
                            startValue: startValue,
                            currentValue: startValue,
                            endValue: endValue,
                            unitType: endValueUnitType,
                            easing: easing
                        };

                        if (Velocity.debug) console.log("tweensContainer (" + property + "): " + JSON.stringify(tweensContainer[property]), element);
                    }

                    /* Along with its property data, store a reference to the element itself onto tweensContainer. */
                    tweensContainer.element = element;
                }

                /*****************
                    Call Push
                *****************/

                /* Note: tweensContainer can be empty if all of the properties in this call's property map were skipped due to not
                   being supported by the browser. The element property is used for checking that the tweensContainer has been appended to. */
                if (tweensContainer.element) {
                    /* Apply the "velocity-animating" indicator class. */
                    CSS.Values.addClass(element, "velocity-animating");

                    /* The call array houses the tweensContainers for each element being animated in the current call. */
                    call.push(tweensContainer);

                    /* Store the tweensContainer and options if we're working on the default effects queue, so that they can be used by the reverse command. */
                    if (opts.queue === "") {
                        Data(element).tweensContainer = tweensContainer;
                        Data(element).opts = opts;
                    }

                    /* Switch on the element's animating flag. */
                    Data(element).isAnimating = true;

                    /* Once the final element in this call's element set has been processed, push the call array onto
                       Velocity.State.calls for the animation tick to immediately begin processing. */
                    if (elementsIndex === elementsLength - 1) {
                        /* Add the current call plus its associated metadata (the element set and the call's options) onto the global call container.
                           Anything on this call container is subjected to tick() processing. */
                        Velocity.State.calls.push([ call, elements, opts, null, promiseData.resolver ]);

                        /* If the animation tick isn't running, start it. (Velocity shuts it off when there are no active calls to process.) */
                        if (Velocity.State.isTicking === false) {
                            Velocity.State.isTicking = true;

                            /* Start the tick loop. */
                            tick();
                        }
                    } else {
                        elementsIndex++;
                    }
                }
            }

            /* When the queue option is set to false, the call skips the element's queue and fires immediately. */
            if (opts.queue === false) {
                /* Since this buildQueue call doesn't respect the element's existing queue (which is where a delay option would have been appended),
                   we manually inject the delay property here with an explicit setTimeout. */
                if (opts.delay) {
                    setTimeout(buildQueue, opts.delay);
                } else {
                    buildQueue();
                }
            /* Otherwise, the call undergoes element queueing as normal. */
            /* Note: To interoperate with jQuery, Velocity uses jQuery's own $.queue() stack for queuing logic. */
            } else {
                $.queue(element, opts.queue, function(next, clearQueue) {
                    /* If the clearQueue flag was passed in by the stop command, resolve this call's promise. (Promises can only be resolved once,
                       so it's fine if this is repeatedly triggered for each element in the associated call.) */
                    if (clearQueue === true) {
                        if (promiseData.promise) {
                            promiseData.resolver(elements);
                        }

                        /* Do not continue with animation queueing. */
                        return true;
                    }

                    /* This flag indicates to the upcoming completeCall() function that this queue entry was initiated by Velocity.
                       See completeCall() for further details. */
                    Velocity.velocityQueueEntryFlag = true;

                    buildQueue(next);
                });
            }

            /*********************
                Auto-Dequeuing
            *********************/

            /* As per jQuery's $.queue() behavior, to fire the first non-custom-queue entry on an element, the element
               must be dequeued if its queue stack consists *solely* of the current call. (This can be determined by checking
               for the "inprogress" item that jQuery prepends to active queue stack arrays.) Regardless, whenever the element's
               queue is further appended with additional items -- including $.delay()'s or even $.animate() calls, the queue's
               first entry is automatically fired. This behavior contrasts that of custom queues, which never auto-fire. */
            /* Note: When an element set is being subjected to a non-parallel Velocity call, the animation will not begin until
               each one of the elements in the set has reached the end of its individually pre-existing queue chain. */
            /* Note: Unfortunately, most people don't fully grasp jQuery's powerful, yet quirky, $.queue() function.
               Lean more here: http://stackoverflow.com/questions/1058158/can-somebody-explain-jquery-queue-to-me */
            if ((opts.queue === "" || opts.queue === "fx") && $.queue(element)[0] !== "inprogress") {
                $.dequeue(element);
            }
        }

        /**************************
           Element Set Iteration
        **************************/

        /* If the "nodeType" property exists on the elements variable, we're animating a single element.
           Place it in an array so that $.each() can iterate over it. */
        $.each(elements, function(i, element) {
            /* Ensure each element in a set has a nodeType (is a real element) to avoid throwing errors. */
            if (Type.isNode(element)) {
                processElement.call(element);
            }
        });

        /******************
           Option: Loop
        ******************/

        /* The loop option accepts an integer indicating how many times the element should loop between the values in the
           current call's properties map and the element's property values prior to this call. */
        /* Note: The loop option's logic is performed here -- after element processing -- because the current call needs
           to undergo its queue insertion prior to the loop option generating its series of constituent "reverse" calls,
           which chain after the current call. Two reverse calls (two "alternations") constitute one loop. */
        var opts = $.extend({}, Velocity.defaults, options),
            reverseCallsCount;

        opts.loop = parseInt(opts.loop);
        reverseCallsCount = (opts.loop * 2) - 1;

        if (opts.loop) {
            /* Double the loop count to convert it into its appropriate number of "reverse" calls.
               Subtract 1 from the resulting value since the current call is included in the total alternation count. */
            for (var x = 0; x < reverseCallsCount; x++) {
                /* Since the logic for the reverse action occurs inside Queueing and therefore this call's options object
                   isn't parsed until then as well, the current call's delay option must be explicitly passed into the reverse
                   call so that the delay logic that occurs inside *Pre-Queueing* can process it. */
                var reverseOptions = {
                    delay: opts.delay,
                    progress: opts.progress
                };

                /* If a complete callback was passed into this call, transfer it to the loop redirect's final "reverse" call
                   so that it's triggered when the entire redirect is complete (and not when the very first animation is complete). */
                if (x === reverseCallsCount - 1) {
                    reverseOptions.display = opts.display;
                    reverseOptions.visibility = opts.visibility;
                    reverseOptions.complete = opts.complete;
                }

                animate(elements, "reverse", reverseOptions);
            }
        }

        /***************
            Chaining
        ***************/

        /* Return the elements back to the call chain, with wrapped elements taking precedence in case Velocity was called via the $.fn. extension. */
        return getChain();
    };

    /* Turn Velocity into the animation function, extended with the pre-existing Velocity object. */
    Velocity = $.extend(animate, Velocity);
    /* For legacy support, also expose the literal animate method. */
    Velocity.animate = animate;

    /**************
        Timing
    **************/

    /* Ticker function. */
    var ticker = window.requestAnimationFrame || rAFShim;

    /* Inactive browser tabs pause rAF, which results in all active animations immediately sprinting to their completion states when the tab refocuses.
       To get around this, we dynamically switch rAF to setTimeout (which the browser *doesn't* pause) when the tab loses focus. We skip this for mobile
       devices to avoid wasting battery power on inactive tabs. */
    /* Note: Tab focus detection doesn't work on older versions of IE, but that's okay since they don't support rAF to begin with. */
    if (!Velocity.State.isMobile && document.hidden !== undefined) {
        document.addEventListener("visibilitychange", function() {
            /* Reassign the rAF function (which the global tick() function uses) based on the tab's focus state. */
            if (document.hidden) {
                ticker = function(callback) {
                    /* The tick function needs a truthy first argument in order to pass its internal timestamp check. */
                    return setTimeout(function() { callback(true) }, 16);
                };

                /* The rAF loop has been paused by the browser, so we manually restart the tick. */
                tick();
            } else {
                ticker = window.requestAnimationFrame || rAFShim;
            }
        });
    }

    /************
        Tick
    ************/

    /* Note: All calls to Velocity are pushed to the Velocity.State.calls array, which is fully iterated through upon each tick. */
    function tick (timestamp) {
        /* An empty timestamp argument indicates that this is the first tick occurence since ticking was turned on.
           We leverage this metadata to fully ignore the first tick pass since RAF's initial pass is fired whenever
           the browser's next tick sync time occurs, which results in the first elements subjected to Velocity
           calls being animated out of sync with any elements animated immediately thereafter. In short, we ignore
           the first RAF tick pass so that elements being immediately consecutively animated -- instead of simultaneously animated
           by the same Velocity call -- are properly batched into the same initial RAF tick and consequently remain in sync thereafter. */
        if (timestamp) {
            /* We ignore RAF's high resolution timestamp since it can be significantly offset when the browser is
               under high stress; we opt for choppiness over allowing the browser to drop huge chunks of frames. */
            var timeCurrent = (new Date).getTime();

            /********************
               Call Iteration
            ********************/

            var callsLength = Velocity.State.calls.length;

            /* To speed up iterating over this array, it is compacted (falsey items -- calls that have completed -- are removed)
               when its length has ballooned to a point that can impact tick performance. This only becomes necessary when animation
               has been continuous with many elements over a long period of time; whenever all active calls are completed, completeCall() clears Velocity.State.calls. */
            if (callsLength > 10000) {
                Velocity.State.calls = compactSparseArray(Velocity.State.calls);
            }

            /* Iterate through each active call. */
            for (var i = 0; i < callsLength; i++) {
                /* When a Velocity call is completed, its Velocity.State.calls entry is set to false. Continue on to the next call. */
                if (!Velocity.State.calls[i]) {
                    continue;
                }

                /************************
                   Call-Wide Variables
                ************************/

                var callContainer = Velocity.State.calls[i],
                    call = callContainer[0],
                    opts = callContainer[2],
                    timeStart = callContainer[3],
                    firstTick = !!timeStart,
                    tweenDummyValue = null;

                /* If timeStart is undefined, then this is the first time that this call has been processed by tick().
                   We assign timeStart now so that its value is as close to the real animation start time as possible.
                   (Conversely, had timeStart been defined when this call was added to Velocity.State.calls, the delay
                   between that time and now would cause the first few frames of the tween to be skipped since
                   percentComplete is calculated relative to timeStart.) */
                /* Further, subtract 16ms (the approximate resolution of RAF) from the current time value so that the
                   first tick iteration isn't wasted by animating at 0% tween completion, which would produce the
                   same style value as the element's current value. */
                if (!timeStart) {
                    timeStart = Velocity.State.calls[i][3] = timeCurrent - 16;
                }

                /* The tween's completion percentage is relative to the tween's start time, not the tween's start value
                   (which would result in unpredictable tween durations since JavaScript's timers are not particularly accurate).
                   Accordingly, we ensure that percentComplete does not exceed 1. */
                var percentComplete = Math.min((timeCurrent - timeStart) / opts.duration, 1);

                /**********************
                   Element Iteration
                **********************/

                /* For every call, iterate through each of the elements in its set. */
                for (var j = 0, callLength = call.length; j < callLength; j++) {
                    var tweensContainer = call[j],
                        element = tweensContainer.element;

                    /* Check to see if this element has been deleted midway through the animation by checking for the
                       continued existence of its data cache. If it's gone, skip animating this element. */
                    if (!Data(element)) {
                        continue;
                    }

                    var transformPropertyExists = false;

                    /**********************************
                       Display & Visibility Toggling
                    **********************************/

                    /* If the display option is set to non-"none", set it upfront so that the element can become visible before tweening begins.
                       (Otherwise, display's "none" value is set in completeCall() once the animation has completed.) */
                    if (opts.display !== undefined && opts.display !== null && opts.display !== "none") {
                        if (opts.display === "flex") {
                            var flexValues = [ "-webkit-box", "-moz-box", "-ms-flexbox", "-webkit-flex" ];

                            $.each(flexValues, function(i, flexValue) {
                                CSS.setPropertyValue(element, "display", flexValue);
                            });
                        }

                        CSS.setPropertyValue(element, "display", opts.display);
                    }

                    /* Same goes with the visibility option, but its "none" equivalent is "hidden". */
                    if (opts.visibility !== undefined && opts.visibility !== "hidden") {
                        CSS.setPropertyValue(element, "visibility", opts.visibility);
                    }

                    /************************
                       Property Iteration
                    ************************/

                    /* For every element, iterate through each property. */
                    for (var property in tweensContainer) {
                        /* Note: In addition to property tween data, tweensContainer contains a reference to its associated element. */
                        if (property !== "element") {
                            var tween = tweensContainer[property],
                                currentValue,
                                /* Easing can either be a pre-genereated function or a string that references a pre-registered easing
                                   on the Velocity.Easings object. In either case, return the appropriate easing *function*. */
                                easing = Type.isString(tween.easing) ? Velocity.Easings[tween.easing] : tween.easing;

                            /******************************
                               Current Value Calculation
                            ******************************/

                            /* If this is the last tick pass (if we've reached 100% completion for this tween),
                               ensure that currentValue is explicitly set to its target endValue so that it's not subjected to any rounding. */
                            if (percentComplete === 1) {
                                currentValue = tween.endValue;
                            /* Otherwise, calculate currentValue based on the current delta from startValue. */
                            } else {
                                var tweenDelta = tween.endValue - tween.startValue;
                                currentValue = tween.startValue + (tweenDelta * easing(percentComplete, opts, tweenDelta));

                                /* If no value change is occurring, don't proceed with DOM updating. */
                                if (!firstTick && (currentValue === tween.currentValue)) {
                                    continue;
                                }
                            }

                            tween.currentValue = currentValue;

                            /* If we're tweening a fake 'tween' property in order to log transition values, update the one-per-call variable so that
                               it can be passed into the progress callback. */
                            if (property === "tween") {
                                tweenDummyValue = currentValue;
                            } else {
                                /******************
                                   Hooks: Part I
                                ******************/

                                /* For hooked properties, the newly-updated rootPropertyValueCache is cached onto the element so that it can be used
                                   for subsequent hooks in this call that are associated with the same root property. If we didn't cache the updated
                                   rootPropertyValue, each subsequent update to the root property in this tick pass would reset the previous hook's
                                   updates to rootPropertyValue prior to injection. A nice performance byproduct of rootPropertyValue caching is that
                                   subsequently chained animations using the same hookRoot but a different hook can use this cached rootPropertyValue. */
                                if (CSS.Hooks.registered[property]) {
                                    var hookRoot = CSS.Hooks.getRoot(property),
                                        rootPropertyValueCache = Data(element).rootPropertyValueCache[hookRoot];

                                    if (rootPropertyValueCache) {
                                        tween.rootPropertyValue = rootPropertyValueCache;
                                    }
                                }

                                /*****************
                                    DOM Update
                                *****************/

                                /* setPropertyValue() returns an array of the property name and property value post any normalization that may have been performed. */
                                /* Note: To solve an IE<=8 positioning bug, the unit type is dropped when setting a property value of 0. */
                                var adjustedSetData = CSS.setPropertyValue(element, /* SET */
                                                                           property,
                                                                           tween.currentValue + (parseFloat(currentValue) === 0 ? "" : tween.unitType),
                                                                           tween.rootPropertyValue,
                                                                           tween.scrollData);

                                /*******************
                                   Hooks: Part II
                                *******************/

                                /* Now that we have the hook's updated rootPropertyValue (the post-processed value provided by adjustedSetData), cache it onto the element. */
                                if (CSS.Hooks.registered[property]) {
                                    /* Since adjustedSetData contains normalized data ready for DOM updating, the rootPropertyValue needs to be re-extracted from its normalized form. ?? */
                                    if (CSS.Normalizations.registered[hookRoot]) {
                                        Data(element).rootPropertyValueCache[hookRoot] = CSS.Normalizations.registered[hookRoot]("extract", null, adjustedSetData[1]);
                                    } else {
                                        Data(element).rootPropertyValueCache[hookRoot] = adjustedSetData[1];
                                    }
                                }

                                /***************
                                   Transforms
                                ***************/

                                /* Flag whether a transform property is being animated so that flushTransformCache() can be triggered once this tick pass is complete. */
                                if (adjustedSetData[0] === "transform") {
                                    transformPropertyExists = true;
                                }

                            }
                        }
                    }

                    /****************
                        mobileHA
                    ****************/

                    /* If mobileHA is enabled, set the translate3d transform to null to force hardware acceleration.
                       It's safe to override this property since Velocity doesn't actually support its animation (hooks are used in its place). */
                    if (opts.mobileHA) {
                        /* Don't set the null transform hack if we've already done so. */
                        if (Data(element).transformCache.translate3d === undefined) {
                            /* All entries on the transformCache object are later concatenated into a single transform string via flushTransformCache(). */
                            Data(element).transformCache.translate3d = "(0px, 0px, 0px)";

                            transformPropertyExists = true;
                        }
                    }

                    if (transformPropertyExists) {
                        CSS.flushTransformCache(element);
                    }
                }

                /* The non-"none" display value is only applied to an element once -- when its associated call is first ticked through.
                   Accordingly, it's set to false so that it isn't re-processed by this call in the next tick. */
                if (opts.display !== undefined && opts.display !== "none") {
                    Velocity.State.calls[i][2].display = false;
                }
                if (opts.visibility !== undefined && opts.visibility !== "hidden") {
                    Velocity.State.calls[i][2].visibility = false;
                }

                /* Pass the elements and the timing data (percentComplete, msRemaining, timeStart, tweenDummyValue) into the progress callback. */
                if (opts.progress) {
                    opts.progress.call(callContainer[1],
                                       callContainer[1],
                                       percentComplete,
                                       Math.max(0, (timeStart + opts.duration) - timeCurrent),
                                       timeStart,
                                       tweenDummyValue);
                }

                /* If this call has finished tweening, pass its index to completeCall() to handle call cleanup. */
                if (percentComplete === 1) {
                    completeCall(i);
                }
            }
        }

        /* Note: completeCall() sets the isTicking flag to false when the last call on Velocity.State.calls has completed. */
        if (Velocity.State.isTicking) {
            ticker(tick);
        }
    }

    /**********************
        Call Completion
    **********************/

    /* Note: Unlike tick(), which processes all active calls at once, call completion is handled on a per-call basis. */
    function completeCall (callIndex, isStopped) {
        /* Ensure the call exists. */
        if (!Velocity.State.calls[callIndex]) {
            return false;
        }

        /* Pull the metadata from the call. */
        var call = Velocity.State.calls[callIndex][0],
            elements = Velocity.State.calls[callIndex][1],
            opts = Velocity.State.calls[callIndex][2],
            resolver = Velocity.State.calls[callIndex][4];

        var remainingCallsExist = false;

        /*************************
           Element Finalization
        *************************/

        for (var i = 0, callLength = call.length; i < callLength; i++) {
            var element = call[i].element;

            /* If the user set display to "none" (intending to hide the element), set it now that the animation has completed. */
            /* Note: display:none isn't set when calls are manually stopped (via Velocity("stop"). */
            /* Note: Display gets ignored with "reverse" calls and infinite loops, since this behavior would be undesirable. */
            if (!isStopped && !opts.loop) {
                if (opts.display === "none") {
                    CSS.setPropertyValue(element, "display", opts.display);
                }

                if (opts.visibility === "hidden") {
                    CSS.setPropertyValue(element, "visibility", opts.visibility);
                }
            }

            /* If the element's queue is empty (if only the "inprogress" item is left at position 0) or if its queue is about to run
               a non-Velocity-initiated entry, turn off the isAnimating flag. A non-Velocity-initiatied queue entry's logic might alter
               an element's CSS values and thereby cause Velocity's cached value data to go stale. To detect if a queue entry was initiated by Velocity,
               we check for the existence of our special Velocity.queueEntryFlag declaration, which minifiers won't rename since the flag
               is assigned to jQuery's global $ object and thus exists out of Velocity's own scope. */
            if (opts.loop !== true && ($.queue(element)[1] === undefined || !/\.velocityQueueEntryFlag/i.test($.queue(element)[1]))) {
                /* The element may have been deleted. Ensure that its data cache still exists before acting on it. */
                if (Data(element)) {
                    Data(element).isAnimating = false;
                    /* Clear the element's rootPropertyValueCache, which will become stale. */
                    Data(element).rootPropertyValueCache = {};

                    var transformHAPropertyExists = false;
                    /* If any 3D transform subproperty is at its default value (regardless of unit type), remove it. */
                    $.each(CSS.Lists.transforms3D, function(i, transformName) {
                        var defaultValue = /^scale/.test(transformName) ? 1 : 0,
                            currentValue = Data(element).transformCache[transformName];

                        if (Data(element).transformCache[transformName] !== undefined && new RegExp("^\\(" + defaultValue + "[^.]").test(currentValue)) {
                            transformHAPropertyExists = true;

                            delete Data(element).transformCache[transformName];
                        }
                    });

                    /* Mobile devices have hardware acceleration removed at the end of the animation in order to avoid hogging the GPU's memory. */
                    if (opts.mobileHA) {
                        transformHAPropertyExists = true;
                        delete Data(element).transformCache.translate3d;
                    }

                    /* Flush the subproperty removals to the DOM. */
                    if (transformHAPropertyExists) {
                        CSS.flushTransformCache(element);
                    }

                    /* Remove the "velocity-animating" indicator class. */
                    CSS.Values.removeClass(element, "velocity-animating");
                }
            }

            /*********************
               Option: Complete
            *********************/

            /* Complete is fired once per call (not once per element) and is passed the full raw DOM element set as both its context and its first argument. */
            /* Note: Callbacks aren't fired when calls are manually stopped (via Velocity("stop"). */
            if (!isStopped && opts.complete && !opts.loop && (i === callLength - 1)) {
                /* We throw callbacks in a setTimeout so that thrown errors don't halt the execution of Velocity itself. */
                try {
                    opts.complete.call(elements, elements);
                } catch (error) {
                    setTimeout(function() { throw error; }, 1);
                }
            }

            /**********************
               Promise Resolving
            **********************/

            /* Note: Infinite loops don't return promises. */
            if (resolver && opts.loop !== true) {
                resolver(elements);
            }

            /****************************
               Option: Loop (Infinite)
            ****************************/

            if (Data(element) && opts.loop === true && !isStopped) {
                /* If a rotateX/Y/Z property is being animated to 360 deg with loop:true, swap tween start/end values to enable
                   continuous iterative rotation looping. (Otherise, the element would just rotate back and forth.) */
                $.each(Data(element).tweensContainer, function(propertyName, tweenContainer) {
                    if (/^rotate/.test(propertyName) && parseFloat(tweenContainer.endValue) === 360) {
                        tweenContainer.endValue = 0;
                        tweenContainer.startValue = 360;
                    }

                    if (/^backgroundPosition/.test(propertyName) && parseFloat(tweenContainer.endValue) === 100 && tweenContainer.unitType === "%") {
                        tweenContainer.endValue = 0;
                        tweenContainer.startValue = 100;
                    }
                });

                Velocity(element, "reverse", { loop: true, delay: opts.delay });
            }

            /***************
               Dequeueing
            ***************/

            /* Fire the next call in the queue so long as this call's queue wasn't set to false (to trigger a parallel animation),
               which would have already caused the next call to fire. Note: Even if the end of the animation queue has been reached,
               $.dequeue() must still be called in order to completely clear jQuery's animation queue. */
            if (opts.queue !== false) {
                $.dequeue(element, opts.queue);
            }
        }

        /************************
           Calls Array Cleanup
        ************************/

        /* Since this call is complete, set it to false so that the rAF tick skips it. This array is later compacted via compactSparseArray().
          (For performance reasons, the call is set to false instead of being deleted from the array: http://www.html5rocks.com/en/tutorials/speed/v8/) */
        Velocity.State.calls[callIndex] = false;

        /* Iterate through the calls array to determine if this was the final in-progress animation.
           If so, set a flag to end ticking and clear the calls array. */
        for (var j = 0, callsLength = Velocity.State.calls.length; j < callsLength; j++) {
            if (Velocity.State.calls[j] !== false) {
                remainingCallsExist = true;

                break;
            }
        }

        if (remainingCallsExist === false) {
            /* tick() will detect this flag upon its next iteration and subsequently turn itself off. */
            Velocity.State.isTicking = false;

            /* Clear the calls array so that its length is reset. */
            delete Velocity.State.calls;
            Velocity.State.calls = [];
        }
    }

    /******************
        Frameworks
    ******************/

    /* Both jQuery and Zepto allow their $.fn object to be extended to allow wrapped elements to be subjected to plugin calls.
       If either framework is loaded, register a "velocity" extension pointing to Velocity's core animate() method.  Velocity
       also registers itself onto a global container (window.jQuery || window.Zepto || window) so that certain features are
       accessible beyond just a per-element scope. This master object contains an .animate() method, which is later assigned to $.fn
       (if jQuery or Zepto are present). Accordingly, Velocity can both act on wrapped DOM elements and stand alone for targeting raw DOM elements. */
    global.Velocity = Velocity;

    if (global !== window) {
        /* Assign the element function to Velocity's core animate() method. */
        global.fn.velocity = animate;
        /* Assign the object function's defaults to Velocity's global defaults object. */
        global.fn.velocity.defaults = Velocity.defaults;
    }

    /***********************
       Packaged Redirects
    ***********************/

    /* slideUp, slideDown */
    $.each([ "Down", "Up" ], function(i, direction) {
        Velocity.Redirects["slide" + direction] = function (element, options, elementsIndex, elementsSize, elements, promiseData) {
            var opts = $.extend({}, options),
                begin = opts.begin,
                complete = opts.complete,
                computedValues = { height: "", marginTop: "", marginBottom: "", paddingTop: "", paddingBottom: "" },
                inlineValues = {};

            if (opts.display === undefined) {
                /* Show the element before slideDown begins and hide the element after slideUp completes. */
                /* Note: Inline elements cannot have dimensions animated, so they're reverted to inline-block. */
                opts.display = (direction === "Down" ? (Velocity.CSS.Values.getDisplayType(element) === "inline" ? "inline-block" : "block") : "none");
            }

            opts.begin = function() {
                /* If the user passed in a begin callback, fire it now. */
                begin && begin.call(elements, elements);

                /* Cache the elements' original vertical dimensional property values so that we can animate back to them. */
                for (var property in computedValues) {
                    inlineValues[property] = element.style[property];

                    /* For slideDown, use forcefeeding to animate all vertical properties from 0. For slideUp,
                       use forcefeeding to start from computed values and animate down to 0. */
                    var propertyValue = Velocity.CSS.getPropertyValue(element, property);
                    computedValues[property] = (direction === "Down") ? [ propertyValue, 0 ] : [ 0, propertyValue ];
                }

                /* Force vertical overflow content to clip so that sliding works as expected. */
                inlineValues.overflow = element.style.overflow;
                element.style.overflow = "hidden";
            }

            opts.complete = function() {
                /* Reset element to its pre-slide inline values once its slide animation is complete. */
                for (var property in inlineValues) {
                    element.style[property] = inlineValues[property];
                }

                /* If the user passed in a complete callback, fire it now. */
                complete && complete.call(elements, elements);
                promiseData && promiseData.resolver(elements);
            };

            Velocity(element, computedValues, opts);
        };
    });

    /* fadeIn, fadeOut */
    $.each([ "In", "Out" ], function(i, direction) {
        Velocity.Redirects["fade" + direction] = function (element, options, elementsIndex, elementsSize, elements, promiseData) {
            var opts = $.extend({}, options),
                propertiesMap = { opacity: (direction === "In") ? 1 : 0 },
                originalComplete = opts.complete;

            /* Since redirects are triggered individually for each element in the animated set, avoid repeatedly triggering
               callbacks by firing them only when the final element has been reached. */
            if (elementsIndex !== elementsSize - 1) {
                opts.complete = opts.begin = null;
            } else {
                opts.complete = function() {
                    if (originalComplete) {
                        originalComplete.call(elements, elements);
                    }

                    promiseData && promiseData.resolver(elements);
                }
            }

            /* If a display was passed in, use it. Otherwise, default to "none" for fadeOut or the element-specific default for fadeIn. */
            /* Note: We allow users to pass in "null" to skip display setting altogether. */
            if (opts.display === undefined) {
                opts.display = (direction === "In" ? "auto" : "none");
            }

            Velocity(this, propertiesMap, opts);
        };
    });

    return Velocity;
}((window.jQuery || window.Zepto || window), window, document);
}));

/******************
   Known Issues
******************/

/* The CSS spec mandates that the translateX/Y/Z transforms are %-relative to the element itself -- not its parent.
Velocity, however, doesn't make this distinction. Thus, converting to or from the % unit with these subproperties
will produce an inaccurate conversion value. The same issue exists with the cx/cy attributes of SVG circles and ellipses. */
},{}],10:[function(require,module,exports){
var createElement = require("./vdom/create-element.js")

module.exports = createElement

},{"./vdom/create-element.js":15}],11:[function(require,module,exports){
var diff = require("./vtree/diff.js")

module.exports = diff

},{"./vtree/diff.js":35}],12:[function(require,module,exports){
var h = require("./virtual-hyperscript/index.js")

module.exports = h

},{"./virtual-hyperscript/index.js":22}],13:[function(require,module,exports){
var patch = require("./vdom/patch.js")

module.exports = patch

},{"./vdom/patch.js":18}],14:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook.js")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, propName, propValue, previous);
        } else if (isHook(propValue)) {
            removeProperty(node, propName, propValue, previous)
            if (propValue.hook) {
                propValue.hook(node,
                    propName,
                    previous ? previous[propName] : undefined)
            }
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, propName, propValue, previous) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        } else if (previousValue.unhook) {
            previousValue.unhook(node, propName, propValue)
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

},{"../vnode/is-vhook.js":26,"is-object":8}],15:[function(require,module,exports){
var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("../vnode/is-vnode.js")
var isVText = require("../vnode/is-vtext.js")
var isWidget = require("../vnode/is-widget.js")
var handleThunk = require("../vnode/handle-thunk.js")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"../vnode/handle-thunk.js":24,"../vnode/is-vnode.js":27,"../vnode/is-vtext.js":28,"../vnode/is-widget.js":29,"./apply-properties":14,"global/document":5}],16:[function(require,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],17:[function(require,module,exports){
var applyProperties = require("./apply-properties")

var isWidget = require("../vnode/is-widget.js")
var VPatch = require("../vnode/vpatch.js")

var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch
console.log(type, patch)
    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = renderOptions.render(vText, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = renderOptions.render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes
    var keyMap = {}
    var node
    var remove
    var insert

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }
        domNode.removeChild(node)
    }

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

},{"../vnode/is-widget.js":29,"../vnode/vpatch.js":32,"./apply-properties":14,"./update-widget":19}],18:[function(require,module,exports){
var document = require("global/document")
var isArray = require("x-is-array")

var render = require("./create-element")
var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches, renderOptions) {
    renderOptions = renderOptions || {}
    renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch
        ? renderOptions.patch
        : patchRecursive
    renderOptions.render = renderOptions.render || render

    return renderOptions.patch(rootNode, patches, renderOptions)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./create-element":15,"./dom-index":16,"./patch-op":17,"global/document":5,"x-is-array":36}],19:[function(require,module,exports){
var isWidget = require("../vnode/is-widget.js")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"../vnode/is-widget.js":29}],20:[function(require,module,exports){
'use strict';

var EvStore = require('ev-store');

module.exports = EvHook;

function EvHook(value) {
    if (!(this instanceof EvHook)) {
        return new EvHook(value);
    }

    this.value = value;
}

EvHook.prototype.hook = function (node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = this.value;
};

EvHook.prototype.unhook = function(node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = undefined;
};

},{"ev-store":4}],21:[function(require,module,exports){
'use strict';

module.exports = SoftSetHook;

function SoftSetHook(value) {
    if (!(this instanceof SoftSetHook)) {
        return new SoftSetHook(value);
    }

    this.value = value;
}

SoftSetHook.prototype.hook = function (node, propertyName) {
    if (node[propertyName] !== this.value) {
        node[propertyName] = this.value;
    }
};

},{}],22:[function(require,module,exports){
'use strict';

var isArray = require('x-is-array');

var VNode = require('../vnode/vnode.js');
var VText = require('../vnode/vtext.js');
var isVNode = require('../vnode/is-vnode');
var isVText = require('../vnode/is-vtext');
var isWidget = require('../vnode/is-widget');
var isHook = require('../vnode/is-vhook');
var isVThunk = require('../vnode/is-thunk');

var parseTag = require('./parse-tag.js');
var softSetHook = require('./hooks/soft-set-hook.js');
var evHook = require('./hooks/ev-hook.js');

module.exports = h;

function h(tagName, properties, children) {
    var childNodes = [];
    var tag, props, key, namespace;

    if (!children && isChildren(properties)) {
        children = properties;
        props = {};
    }

    props = props || properties || {};
    tag = parseTag(tagName, props);

    // support keys
    if (props.hasOwnProperty('key')) {
        key = props.key;
        props.key = undefined;
    }

    // support namespace
    if (props.hasOwnProperty('namespace')) {
        namespace = props.namespace;
        props.namespace = undefined;
    }

    // fix cursor bug
    if (tag === 'INPUT' &&
        !namespace &&
        props.hasOwnProperty('value') &&
        props.value !== undefined &&
        !isHook(props.value)
    ) {
        props.value = softSetHook(props.value);
    }

    transformProperties(props);

    if (children !== undefined && children !== null) {
        addChild(children, childNodes, tag, props);
    }


    return new VNode(tag, props, childNodes, key, namespace);
}

function addChild(c, childNodes, tag, props) {
    if (typeof c === 'string') {
        childNodes.push(new VText(c));
    } else if (typeof c === 'number') {
        childNodes.push(new VText(String(c)));
    } else if (isChild(c)) {
        childNodes.push(c);
    } else if (isArray(c)) {
        for (var i = 0; i < c.length; i++) {
            addChild(c[i], childNodes, tag, props);
        }
    } else if (c === null || c === undefined) {
        return;
    } else {
        throw UnexpectedVirtualElement({
            foreignObject: c,
            parentVnode: {
                tagName: tag,
                properties: props
            }
        });
    }
}

function transformProperties(props) {
    for (var propName in props) {
        if (props.hasOwnProperty(propName)) {
            var value = props[propName];

            if (isHook(value)) {
                continue;
            }

            if (propName.substr(0, 3) === 'ev-') {
                // add ev-foo support
                props[propName] = evHook(value);
            }
        }
    }
}

function isChild(x) {
    return isVNode(x) || isVText(x) || isWidget(x) || isVThunk(x);
}

function isChildren(x) {
    return typeof x === 'string' || isArray(x) || isChild(x);
}

function UnexpectedVirtualElement(data) {
    var err = new Error();

    err.type = 'virtual-hyperscript.unexpected.virtual-element';
    err.message = 'Unexpected virtual child passed to h().\n' +
        'Expected a VNode / Vthunk / VWidget / string but:\n' +
        'got:\n' +
        errorString(data.foreignObject) +
        '.\n' +
        'The parent vnode is:\n' +
        errorString(data.parentVnode)
        '\n' +
        'Suggested fix: change your `h(..., [ ... ])` callsite.';
    err.foreignObject = data.foreignObject;
    err.parentVnode = data.parentVnode;

    return err;
}

function errorString(obj) {
    try {
        return JSON.stringify(obj, null, '    ');
    } catch (e) {
        return String(obj);
    }
}

},{"../vnode/is-thunk":25,"../vnode/is-vhook":26,"../vnode/is-vnode":27,"../vnode/is-vtext":28,"../vnode/is-widget":29,"../vnode/vnode.js":31,"../vnode/vtext.js":33,"./hooks/ev-hook.js":20,"./hooks/soft-set-hook.js":21,"./parse-tag.js":23,"x-is-array":36}],23:[function(require,module,exports){
'use strict';

var split = require('browser-split');

var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
var notClassId = /^\.|#/;

module.exports = parseTag;

function parseTag(tag, props) {
    if (!tag) {
        return 'DIV';
    }

    var noId = !(props.hasOwnProperty('id'));

    var tagParts = split(tag, classIdSplit);
    var tagName = null;

    if (notClassId.test(tagParts[1])) {
        tagName = 'DIV';
    }

    var classes, part, type, i;

    for (i = 0; i < tagParts.length; i++) {
        part = tagParts[i];

        if (!part) {
            continue;
        }

        type = part.charAt(0);

        if (!tagName) {
            tagName = part;
        } else if (type === '.') {
            classes = classes || [];
            classes.push(part.substring(1, part.length));
        } else if (type === '#' && noId) {
            props.id = part.substring(1, part.length);
        }
    }

    if (classes) {
        if (props.className) {
            classes.push(props.className);
        }

        props.className = classes.join(' ');
    }

    return props.namespace ? tagName : tagName.toUpperCase();
}

},{"browser-split":3}],24:[function(require,module,exports){
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

},{"./is-thunk":25,"./is-vnode":27,"./is-vtext":28,"./is-widget":29}],25:[function(require,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],26:[function(require,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook &&
      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
}

},{}],27:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":30}],28:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":30}],29:[function(require,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],30:[function(require,module,exports){
module.exports = "2"

},{}],31:[function(require,module,exports){
var version = require("./version")
var isVNode = require("./is-vnode")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")
var isVHook = require("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var hasThunks = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property) && property.unhook) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!hasThunks && child.hasThunks) {
                hasThunks = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        } else if (!hasThunks && isThunk(child)) {
            hasThunks = true;
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hasThunks = hasThunks
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

},{"./is-thunk":25,"./is-vhook":26,"./is-vnode":27,"./is-widget":29,"./version":30}],32:[function(require,module,exports){
var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":30}],33:[function(require,module,exports){
var version = require("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":30}],34:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook")

module.exports = diffProps

function diffProps(a, b) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (aValue === bValue) {
            continue
        } else if (isObject(aValue) && isObject(bValue)) {
            if (getPrototype(bValue) !== getPrototype(aValue)) {
                diff = diff || {}
                diff[aKey] = bValue
            } else if (isHook(bValue)) {
                 diff = diff || {}
                 diff[aKey] = bValue
            } else {
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) {
                    diff = diff || {}
                    diff[aKey] = objectDiff
                }
            }
        } else {
            diff = diff || {}
            diff[aKey] = bValue
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}

},{"../vnode/is-vhook":26,"is-object":8}],35:[function(require,module,exports){
var isArray = require("x-is-array")

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        return
    }

    var apply = patch[index]
    var applyClear = false

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget(a)) {
            clearState(a, patch, index)
            apply = patch[index]
        }

        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
                apply = diffChildren(a, b, patch, apply, index)
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                applyClear = true
            }
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            applyClear = true
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            applyClear = true
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        if (!isWidget(a)) {
            applyClear = true
        }

        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
    }

    if (apply) {
        patch[index] = apply
    }

    if (applyClear) {
        clearState(a, patch, index)
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var orderedSet = reorder(aChildren, b.children)
    var bChildren = orderedSet.children

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (orderedSet.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(
            VPatch.ORDER,
            a,
            orderedSet.moves
        ))
    }

    return apply
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index)
    destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(VPatch.REMOVE, vNode, null)
            )
        }
    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b)
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true
        }
    }

    return false
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(
                    VPatch.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            )
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                unhook(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

function undefinedKeys(obj) {
    var result = {}

    for (var key in obj) {
        result[key] = undefined
    }

    return result
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {
    // O(M) time, O(M) memory
    var bChildIndex = keyIndex(bChildren)
    var bKeys = bChildIndex.keys
    var bFree = bChildIndex.free

    if (bFree.length === bChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(N) time, O(N) memory
    var aChildIndex = keyIndex(aChildren)
    var aKeys = aChildIndex.keys
    var aFree = aChildIndex.free

    if (aFree.length === aChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(MAX(N, M)) memory
    var newChildren = []

    var freeIndex = 0
    var freeCount = bFree.length
    var deletedItems = 0

    // Iterate through a and match a node in b
    // O(N) time,
    for (var i = 0 ; i < aChildren.length; i++) {
        var aItem = aChildren[i]
        var itemIndex

        if (aItem.key) {
            if (bKeys.hasOwnProperty(aItem.key)) {
                // Match up the old keys
                itemIndex = bKeys[aItem.key]
                newChildren.push(bChildren[itemIndex])

            } else {
                // Remove old keyed items
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        } else {
            // Match the item in a with the next free item in b
            if (freeIndex < freeCount) {
                itemIndex = bFree[freeIndex++]
                newChildren.push(bChildren[itemIndex])
            } else {
                // There are no free items in b to match with
                // the free items in a, so the extra free nodes
                // are deleted.
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        }
    }

    var lastFreeIndex = freeIndex >= bFree.length ?
        bChildren.length :
        bFree[freeIndex]

    // Iterate through b and append any new keys
    // O(M) time
    for (var j = 0; j < bChildren.length; j++) {
        var newItem = bChildren[j]

        if (newItem.key) {
            if (!aKeys.hasOwnProperty(newItem.key)) {
                // Add any new keyed items
                // We are adding new items to the end and then sorting them
                // in place. In future we should insert new items in place.
                newChildren.push(newItem)
            }
        } else if (j >= lastFreeIndex) {
            // Add any leftover non-keyed items
            newChildren.push(newItem)
        }
    }

    var simulate = newChildren.slice()
    var simulateIndex = 0
    var removes = []
    var inserts = []
    var simulateItem

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]
        simulateItem = simulate[simulateIndex]

        // remove items
        while (simulateItem === null && simulate.length) {
            removes.push(remove(simulate, simulateIndex, null))
            simulateItem = simulate[simulateIndex]
        }

        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) {
                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) {
                        removes.push(remove(simulate, simulateIndex, simulateItem.key))
                        simulateItem = simulate[simulateIndex]
                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k})
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k})
                    }
                }
                else {
                    inserts.push({key: wantedItem.key, to: k})
                }
                k++
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key))
            }
        }
        else {
            simulateIndex++
            k++
        }
    }

    // remove all the remaining nodes from simulate
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex]
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    if (removes.length === deletedItems && !inserts.length) {
        return {
            children: newChildren,
            moves: null
        }
    }

    return {
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }
}

function remove(arr, index, key) {
    arr.splice(index, 1)

    return {
        from: index,
        key: key
    }
}

function keyIndex(children) {
    var keys = {}
    var free = []
    var length = children.length

    for (var i = 0; i < length; i++) {
        var child = children[i]

        if (child.key) {
            keys[child.key] = i
        } else {
            free.push(i)
        }
    }

    return {
        keys: keys,     // A hash of key name to index
        free: free      // An array of unkeyed item indices
    }
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"../vnode/handle-thunk":24,"../vnode/is-thunk":25,"../vnode/is-vnode":27,"../vnode/is-vtext":28,"../vnode/is-widget":29,"../vnode/vpatch":32,"./diff-props":34,"x-is-array":36}],36:[function(require,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}],37:[function(require,module,exports){
var applyProperties = require("virtual-dom/vdom/apply-properties")
var isArray = require("x-is-array")

var isWidget = require("virtual-dom/vnode/is-widget")
var VPatch = require("virtual-dom/vnode/vpatch")

var updateWidget = require("virtual-dom/vdom/update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
          return Promise
              .all(removeOp(vNode, domNode))
              .then(function() {
                return removeNode(domNode, vNode)
              })
        case VPatch.INSERT:
                return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
          return Promise
              .all(updateOp(patch, domNode.parentNode))
              .then(function() {
                return stringPatch(domNode, vNode, patch, renderOptions)
              })
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            return reorderChildren(domNode, patch, vNode)
        case VPatch.PROPS:
          var removeInternals = function(obj) {
            ['onEnter', 'onUpdate', 'onExit', 'key']
              .forEach(function(d) { delete obj[d] })

            return obj
          }

          patch = removeInternals(patch)

          if (!Object.keys(patch).length) return Promise.resolve(domNode)

          return Promise
              .all(updateOp(vNode, domNode, {old: patch, new: removeInternals(vNode.properties)}))
              .then(function() {
                applyProperties(domNode, patch, vNode.properties)
                return domNode
              })
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

//haha stoped to understand what it is doing, rewrite it!
var getChildsOps = function(vNode, domNode, method, props, deep) {
  var ops = []

  var getChildren = function(node, tree) {
    if (!tree) return

    var domNode

    (node.children || []).forEach(function(child, idx) {
      domNode = tree.children[idx]
      if(child.properties && child.properties[method] && domNode) {
        //sometimes there are two updates, first one related to tag.class is not relevant, so skipping it
        var skip = Object.keys(props || {}).length == 1 && (props || {}).className;
        ops.push(child.properties[method](domNode, skip ? (child.properties || props) : (props || child.properties)))
      } else if(domNode && domNode[method]) {
        ops.push(domNode[method](domNode, props || child.properties))
      }
      deep && getChildren(child, domNode);
    })
  }

  var start = getChildren({ children: isArray(vNode) ? vNode : [vNode] }
                         ,{ children: isArray(domNode) ? domNode : [domNode] })
  return ops.reverse()
}

var removeOp = function(node, domNode, props, deep) { return getChildsOps(node, domNode, 'onExit', props, deep) }
  , insertOp = function(node, domNode, props, deep) { return getChildsOps(node, domNode, 'onEnter', props, deep) }
  , updateOp = function(node, domNode, props, deep) { return getChildsOps(node, domNode, 'onUpdate', props, deep) }
function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
  var newNode = renderOptions.render(vNode, renderOptions)

  if (parentNode) parentNode.appendChild(newNode)

  return Promise
    .all(insertOp(vNode, newNode, vNode.properties || vNode, true))
    .then(function() {
      return parentNode
    })
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = renderOptions.render(vText, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = renderOptions.render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}


function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode

    return Promise
      .all(removeOp(leftVNode, domNode))
      .then(function() {
        var newNode = renderOptions.render(vNode, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }

        return newNode
      })
}

function reorderChildren(domNode, moves, vnode) {
    var childNodes = domNode.childNodes
      , node
      , remove

    var toRemove = []

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (!remove.key) toRemove.push(node)
    }
    //TO CONSIDER: hook for reordering
    return Promise
      .all(removeOp(vnode, toRemove))
      .then(function() {
        var keyMap = {}
        var insert
        for (var i = 0; i < moves.removes.length; i++) {
            remove = moves.removes[i]
            node = childNodes[remove.from]
            if (remove.key) {
                keyMap[remove.key] = node
            }
            domNode.removeChild(node)
        }

        var length = childNodes.length
        for (var j = 0; j < moves.inserts.length; j++) {
            insert = moves.inserts[j]
            node = keyMap[insert.key]
            domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
        }

        return domNode
      })
}

},{"virtual-dom/vdom/apply-properties":14,"virtual-dom/vdom/update-widget":19,"virtual-dom/vnode/is-widget":29,"virtual-dom/vnode/vpatch":32,"x-is-array":36}],38:[function(require,module,exports){
var isArray = require("x-is-array")

var render = require("virtual-dom/vdom/create-element")
var domIndex = require("virtual-dom/vdom/dom-index")
var patchOp = require("./patch-op")

module.exports = defferedPatch

var opNo = 0

function defferedPatch(rootNode, patches, renderOptions) {
    console.log('--------> operation no', opNo++)

    var indices = patchIndices(patches)

    if (indices.length === 0) { return Promise.resolve(rootNode) }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    var __p = []

    indices.forEach(function(d) {
      var idx = d
        , patch = patches[idx]

      if (!isArray(patch)) patch = [patch]
      
      patch.forEach(function(d) {
        __p.push({idx: idx, patch: d})
      }) 
    })

    var operations = __p.map(function(d) {
      return function(__rootNode) {
        return function(ok) {
          var __c = applyPatch(index[d.idx], d.patch, renderOptions)
          if(__c && __c.then) {
            __c.then(function(node) {
              ok(__rootNode)
            })
          }else{
          ok(__rootNode)
          }
        }
      }
    })
    
    return new Promise(function(ok, err) {
      var p = Promise.resolve(rootNode)
        , z = 0

      var takeNext = function(p) {
        p.then(function(node) {
          if( z == operations.length ) return ok(node)
          if (rootNode === node) rootNode = node
          takeNext(new Promise(operations[z](node)))
          z++
        })
      }

      takeNext(p)
    }).then(function(dom) {
      return dom
    })
}

function applyPatch(domNode, patchList, renderOptions) {
  if (!domNode) return rootNode
  return patchOp(patchList, domNode, renderOptions)
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./patch-op":37,"virtual-dom/vdom/create-element":15,"virtual-dom/vdom/dom-index":16,"x-is-array":36}],39:[function(require,module,exports){

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlL2luZGV4LmpzIiwiaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1zcGxpdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9ldi1zdG9yZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9nbG9iYWwvZG9jdW1lbnQuanMiLCJub2RlX21vZHVsZXMvaW5kaXZpZHVhbC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pbmRpdmlkdWFsL29uZS12ZXJzaW9uLmpzIiwibm9kZV9tb2R1bGVzL2lzLW9iamVjdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy92ZWxvY2l0eS1hbmltYXRlL3ZlbG9jaXR5LmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL2NyZWF0ZS1lbGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL2RpZmYuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vaC5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS9wYXRjaC5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92ZG9tL2FwcGx5LXByb3BlcnRpZXMuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdmRvbS9jcmVhdGUtZWxlbWVudC5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92ZG9tL2RvbS1pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92ZG9tL3BhdGNoLW9wLmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL3Zkb20vcGF0Y2guanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdmRvbS91cGRhdGUtd2lkZ2V0LmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL3ZpcnR1YWwtaHlwZXJzY3JpcHQvaG9va3MvZXYtaG9vay5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92aXJ0dWFsLWh5cGVyc2NyaXB0L2hvb2tzL3NvZnQtc2V0LWhvb2suanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdmlydHVhbC1oeXBlcnNjcmlwdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92aXJ0dWFsLWh5cGVyc2NyaXB0L3BhcnNlLXRhZy5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92bm9kZS9oYW5kbGUtdGh1bmsuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdm5vZGUvaXMtdGh1bmsuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdm5vZGUvaXMtdmhvb2suanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdm5vZGUvaXMtdm5vZGUuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdm5vZGUvaXMtdnRleHQuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdm5vZGUvaXMtd2lkZ2V0LmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL3Zub2RlL3ZlcnNpb24uanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdm5vZGUvdm5vZGUuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdm5vZGUvdnBhdGNoLmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL3Zub2RlL3Z0ZXh0LmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL3Z0cmVlL2RpZmYtcHJvcHMuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdnRyZWUvZGlmZi5qcyIsIm5vZGVfbW9kdWxlcy94LWlzLWFycmF5L2luZGV4LmpzIiwidmRvbS9wYXRjaC1vcC5qcyIsInZkb20vcGF0Y2guanMiLCIuLi8uLi8uLi8uLi8uLi8uLi8uLi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN3lIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaCA9IHJlcXVpcmUoJ3ZpcnR1YWwtZG9tL2gnKVxuICAsIGRpZmYgPSByZXF1aXJlKCd2aXJ0dWFsLWRvbS9kaWZmJylcbiAgLCBwYXRjaCA9IHJlcXVpcmUoJ3ZpcnR1YWwtZG9tL3BhdGNoJylcbiAgLCBjcmVhdGVFbGVtZW50ID0gcmVxdWlyZSgndmlydHVhbC1kb20vY3JlYXRlLWVsZW1lbnQnKVxuXG52YXIgZGVmZmVyZWRQYXRjaCA9IHJlcXVpcmUoJy4uL2luZGV4JylcblxudmFyIHBhdGNoZXNcbiAgLCB0cmVlID0gaCgnc3BhbicpXG4gICwgcm9vdE5vZGUgPSBjcmVhdGVFbGVtZW50KHRyZWUpXG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocm9vdE5vZGUpXG5cbnZhciBidXN5ID0gZmFsc2VcblxudmFyIHVwZGF0ZSA9IGZ1bmN0aW9uKG5ld3RyZWUpIHtcbiAgICBpZihidXN5KSByZXR1cm4gZmFsc2VcblxuICAgIHBhdGNoZXMgPSBkaWZmKHRyZWUsIG5ld3RyZWUpXG5cbiAgICBidXN5ID0gdHJ1ZVxuXG4gICAgdmFyIGEgPSBwYXRjaChyb290Tm9kZSwgcGF0Y2hlcywgeyBwYXRjaDogZGVmZmVyZWRQYXRjaCB9KVxuXG4gICAgYS50aGVuKGZ1bmN0aW9uKGQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCcjIyMgcmVuZGVyJywgZClcbiAgICAgIHJvb3ROb2RlID0gZFxuICAgICAgYnVzeSA9IGZhbHNlXG4gICAgfSlcblxuICAgIHRyZWUgPSBuZXd0cmVlXG4gIH1cblxudmFyIFZlbG9jaXR5ID0gcmVxdWlyZSgndmVsb2NpdHktYW5pbWF0ZScpXG5cbnZhciBvbkVudGVyID0gZnVuY3Rpb24oZGVsYXkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUsIHByb3BzKSB7XG4gICAgY29uc29sZS5sb2coJ29uRW50ZXInLCBwcm9wcywgbm9kZSlcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ob2ssIGVycikge1xuICAgICAgbm9kZS5zdHlsZS5vcGFjaXR5ID0gMFxuICAgICAgb2soKVxuICAgICAgVmVsb2NpdHkobm9kZSwgXG4gICAgICAgIHsgb3BhY2l0eTogMSwgYmFja2dyb3VuZENvbG9yOiBwcm9wcy5jb2xvciwgd2lkdGg6IHByb3BzLmRhdGEgfVxuICAgICAgLy8gLCB7IGNvbXBsZXRlOiBvayB9XG4gICAgICApXG4gICAgfSlcbiAgfVxufVxuXG52YXIgb25VcGRhdGUgPSBmdW5jdGlvbihkZWxheSkge1xuICByZXR1cm4gZnVuY3Rpb24obm9kZSwgcHJvcHMpIHtcbiAgICBjb25zb2xlLmxvZygnb25VcGRhdGUnLCBub2RlLCBwcm9wcylcbiAgICBkZWJ1Z2dlclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihvaywgZXJyKSB7XG4gICAgICBvaygpXG4gICAgICBWZWxvY2l0eShub2RlLCBcbiAgICAgICAgeyBiYWNrZ3JvdW5kQ29sb3I6IHByb3BzLm5ldy5jb2xvciwgd2lkdGg6IHByb3BzLm5ldy5kYXRhIH1cbiAgICAgIC8vICwgeyBjb21wbGV0ZTogb2sgfVxuICAgICAgKVxuICAgIH0pXG4gIH1cbn1cblxudmFyIG9uRXhpdCA9IGZ1bmN0aW9uKGRlbGF5KSB7XG4gIHJldHVybiBmdW5jdGlvbihub2RlKSB7XG4gICAgLy90ZW1wIHdvcmthcm91ZG5cbiAgICBpZighZG9jdW1lbnQuY29udGFpbnMobm9kZSkpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIGNvbnNvbGUubG9nKCdvbkV4aXQnLCBub2RlKVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihvaywgZXJyKSB7XG4gICAgICAvLyBvaygpXG4gICAgICBWZWxvY2l0eShub2RlLCBcbiAgICAgICAgeyBvcGFjaXR5OiAwLCBjb2xvcjogJyNGRjAwMDAnLCB3aWR0aDogMCB9XG4gICAgICAsIHsgY29tcGxldGU6IG9rIH1cbiAgICAgIClcbiAgICB9KVxuICB9XG4gIH1cblxuXG52YXIgbGlmZWN5Y2xlID0gZnVuY3Rpb24oY3VzdG9tKSB7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKGN1c3RvbSB8fCB7fSwgeyAgICBcbiAgICAgIG9uRW50ZXI6IG9uRW50ZXIoMTAwKVxuICAgICwgb25VcGRhdGU6IG9uVXBkYXRlKDEwMClcbiAgICAsIG9uRXhpdDogb25FeGl0KDEwMClcbiAgfSlcbn1cblxudmFyIGMgPSAwXG5cbmZ1bmN0aW9uIHJ1bigpIHtcbiAgdmFyIHJvb3QgPSBoKCdzcGFuJywgbGlmZWN5Y2xlKCkpXG4gICAgLCBraWRzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IDU7aSArKykge1xuICAgICB2YXIgY29sb3IgPSAnIycgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMTY3NzcyMTUpLnRvU3RyaW5nKDE2KVxuICAgICBraWRzLnB1c2goaCgnZGl2LmJhcicsIGxpZmVjeWNsZSh7a2V5OmksIGRhdGE6IDUwICsgNTAqaSpNYXRoLnJhbmRvbSgpLCBjb2xvcjogY29sb3J9KSwgWydCYXInK2ldKSlcbiAgfVxuXG4gIGlmIChjICUgMiA9PSAwKVxuICAgIGtpZHMucHVzaChoKCdkaXYuYmFyJywgbGlmZWN5Y2xlKHtkYXRhOiAxMDAgKyA1MCpNYXRoLnJhbmRvbSgpLCBjb2xvcjogJyNGRjAwMDAnfSksIFsnQmFyJytpXSkpXG5cbiAgcmVkcmF3ID0gaCgnYnV0dG9uJywge2tleToncmVkcmF3JywgJ29uY2xpY2snOiBmdW5jdGlvbigpIHsgcnVuKGMrKykgfX0sIFsncmVkcmF3J10pXG5cbiAgcm9vdC5jaGlsZHJlbiA9IFtoKCdkaXYuY29udGFpbmVyJywga2lkcyksIHJlZHJhd11cbiAgdXBkYXRlKHJvb3QpXG59XG5cbnJ1bihjKyspXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vdmRvbS9wYXRjaCcpXG4iLCIvKiFcbiAqIENyb3NzLUJyb3dzZXIgU3BsaXQgMS4xLjFcbiAqIENvcHlyaWdodCAyMDA3LTIwMTIgU3RldmVuIExldml0aGFuIDxzdGV2ZW5sZXZpdGhhbi5jb20+XG4gKiBBdmFpbGFibGUgdW5kZXIgdGhlIE1JVCBMaWNlbnNlXG4gKiBFQ01BU2NyaXB0IGNvbXBsaWFudCwgdW5pZm9ybSBjcm9zcy1icm93c2VyIHNwbGl0IG1ldGhvZFxuICovXG5cbi8qKlxuICogU3BsaXRzIGEgc3RyaW5nIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncyB1c2luZyBhIHJlZ2V4IG9yIHN0cmluZyBzZXBhcmF0b3IuIE1hdGNoZXMgb2YgdGhlXG4gKiBzZXBhcmF0b3IgYXJlIG5vdCBpbmNsdWRlZCBpbiB0aGUgcmVzdWx0IGFycmF5LiBIb3dldmVyLCBpZiBgc2VwYXJhdG9yYCBpcyBhIHJlZ2V4IHRoYXQgY29udGFpbnNcbiAqIGNhcHR1cmluZyBncm91cHMsIGJhY2tyZWZlcmVuY2VzIGFyZSBzcGxpY2VkIGludG8gdGhlIHJlc3VsdCBlYWNoIHRpbWUgYHNlcGFyYXRvcmAgaXMgbWF0Y2hlZC5cbiAqIEZpeGVzIGJyb3dzZXIgYnVncyBjb21wYXJlZCB0byB0aGUgbmF0aXZlIGBTdHJpbmcucHJvdG90eXBlLnNwbGl0YCBhbmQgY2FuIGJlIHVzZWQgcmVsaWFibHlcbiAqIGNyb3NzLWJyb3dzZXIuXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIFN0cmluZyB0byBzcGxpdC5cbiAqIEBwYXJhbSB7UmVnRXhwfFN0cmluZ30gc2VwYXJhdG9yIFJlZ2V4IG9yIHN0cmluZyB0byB1c2UgZm9yIHNlcGFyYXRpbmcgdGhlIHN0cmluZy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBbbGltaXRdIE1heGltdW0gbnVtYmVyIG9mIGl0ZW1zIHRvIGluY2x1ZGUgaW4gdGhlIHJlc3VsdCBhcnJheS5cbiAqIEByZXR1cm5zIHtBcnJheX0gQXJyYXkgb2Ygc3Vic3RyaW5ncy5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gQmFzaWMgdXNlXG4gKiBzcGxpdCgnYSBiIGMgZCcsICcgJyk7XG4gKiAvLyAtPiBbJ2EnLCAnYicsICdjJywgJ2QnXVxuICpcbiAqIC8vIFdpdGggbGltaXRcbiAqIHNwbGl0KCdhIGIgYyBkJywgJyAnLCAyKTtcbiAqIC8vIC0+IFsnYScsICdiJ11cbiAqXG4gKiAvLyBCYWNrcmVmZXJlbmNlcyBpbiByZXN1bHQgYXJyYXlcbiAqIHNwbGl0KCcuLndvcmQxIHdvcmQyLi4nLCAvKFthLXpdKykoXFxkKykvaSk7XG4gKiAvLyAtPiBbJy4uJywgJ3dvcmQnLCAnMScsICcgJywgJ3dvcmQnLCAnMicsICcuLiddXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIHNwbGl0KHVuZGVmKSB7XG5cbiAgdmFyIG5hdGl2ZVNwbGl0ID0gU3RyaW5nLnByb3RvdHlwZS5zcGxpdCxcbiAgICBjb21wbGlhbnRFeGVjTnBjZyA9IC8oKT8/Ly5leGVjKFwiXCIpWzFdID09PSB1bmRlZixcbiAgICAvLyBOUENHOiBub25wYXJ0aWNpcGF0aW5nIGNhcHR1cmluZyBncm91cFxuICAgIHNlbGY7XG5cbiAgc2VsZiA9IGZ1bmN0aW9uKHN0ciwgc2VwYXJhdG9yLCBsaW1pdCkge1xuICAgIC8vIElmIGBzZXBhcmF0b3JgIGlzIG5vdCBhIHJlZ2V4LCB1c2UgYG5hdGl2ZVNwbGl0YFxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc2VwYXJhdG9yKSAhPT0gXCJbb2JqZWN0IFJlZ0V4cF1cIikge1xuICAgICAgcmV0dXJuIG5hdGl2ZVNwbGl0LmNhbGwoc3RyLCBzZXBhcmF0b3IsIGxpbWl0KTtcbiAgICB9XG4gICAgdmFyIG91dHB1dCA9IFtdLFxuICAgICAgZmxhZ3MgPSAoc2VwYXJhdG9yLmlnbm9yZUNhc2UgPyBcImlcIiA6IFwiXCIpICsgKHNlcGFyYXRvci5tdWx0aWxpbmUgPyBcIm1cIiA6IFwiXCIpICsgKHNlcGFyYXRvci5leHRlbmRlZCA/IFwieFwiIDogXCJcIikgKyAvLyBQcm9wb3NlZCBmb3IgRVM2XG4gICAgICAoc2VwYXJhdG9yLnN0aWNreSA/IFwieVwiIDogXCJcIiksXG4gICAgICAvLyBGaXJlZm94IDMrXG4gICAgICBsYXN0TGFzdEluZGV4ID0gMCxcbiAgICAgIC8vIE1ha2UgYGdsb2JhbGAgYW5kIGF2b2lkIGBsYXN0SW5kZXhgIGlzc3VlcyBieSB3b3JraW5nIHdpdGggYSBjb3B5XG4gICAgICBzZXBhcmF0b3IgPSBuZXcgUmVnRXhwKHNlcGFyYXRvci5zb3VyY2UsIGZsYWdzICsgXCJnXCIpLFxuICAgICAgc2VwYXJhdG9yMiwgbWF0Y2gsIGxhc3RJbmRleCwgbGFzdExlbmd0aDtcbiAgICBzdHIgKz0gXCJcIjsgLy8gVHlwZS1jb252ZXJ0XG4gICAgaWYgKCFjb21wbGlhbnRFeGVjTnBjZykge1xuICAgICAgLy8gRG9lc24ndCBuZWVkIGZsYWdzIGd5LCBidXQgdGhleSBkb24ndCBodXJ0XG4gICAgICBzZXBhcmF0b3IyID0gbmV3IFJlZ0V4cChcIl5cIiArIHNlcGFyYXRvci5zb3VyY2UgKyBcIiQoPyFcXFxccylcIiwgZmxhZ3MpO1xuICAgIH1cbiAgICAvKiBWYWx1ZXMgZm9yIGBsaW1pdGAsIHBlciB0aGUgc3BlYzpcbiAgICAgKiBJZiB1bmRlZmluZWQ6IDQyOTQ5NjcyOTUgLy8gTWF0aC5wb3coMiwgMzIpIC0gMVxuICAgICAqIElmIDAsIEluZmluaXR5LCBvciBOYU46IDBcbiAgICAgKiBJZiBwb3NpdGl2ZSBudW1iZXI6IGxpbWl0ID0gTWF0aC5mbG9vcihsaW1pdCk7IGlmIChsaW1pdCA+IDQyOTQ5NjcyOTUpIGxpbWl0IC09IDQyOTQ5NjcyOTY7XG4gICAgICogSWYgbmVnYXRpdmUgbnVtYmVyOiA0Mjk0OTY3Mjk2IC0gTWF0aC5mbG9vcihNYXRoLmFicyhsaW1pdCkpXG4gICAgICogSWYgb3RoZXI6IFR5cGUtY29udmVydCwgdGhlbiB1c2UgdGhlIGFib3ZlIHJ1bGVzXG4gICAgICovXG4gICAgbGltaXQgPSBsaW1pdCA9PT0gdW5kZWYgPyAtMSA+Pj4gMCA6IC8vIE1hdGgucG93KDIsIDMyKSAtIDFcbiAgICBsaW1pdCA+Pj4gMDsgLy8gVG9VaW50MzIobGltaXQpXG4gICAgd2hpbGUgKG1hdGNoID0gc2VwYXJhdG9yLmV4ZWMoc3RyKSkge1xuICAgICAgLy8gYHNlcGFyYXRvci5sYXN0SW5kZXhgIGlzIG5vdCByZWxpYWJsZSBjcm9zcy1icm93c2VyXG4gICAgICBsYXN0SW5kZXggPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgIGlmIChsYXN0SW5kZXggPiBsYXN0TGFzdEluZGV4KSB7XG4gICAgICAgIG91dHB1dC5wdXNoKHN0ci5zbGljZShsYXN0TGFzdEluZGV4LCBtYXRjaC5pbmRleCkpO1xuICAgICAgICAvLyBGaXggYnJvd3NlcnMgd2hvc2UgYGV4ZWNgIG1ldGhvZHMgZG9uJ3QgY29uc2lzdGVudGx5IHJldHVybiBgdW5kZWZpbmVkYCBmb3JcbiAgICAgICAgLy8gbm9ucGFydGljaXBhdGluZyBjYXB0dXJpbmcgZ3JvdXBzXG4gICAgICAgIGlmICghY29tcGxpYW50RXhlY05wY2cgJiYgbWF0Y2gubGVuZ3RoID4gMSkge1xuICAgICAgICAgIG1hdGNoWzBdLnJlcGxhY2Uoc2VwYXJhdG9yMiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGggLSAyOyBpKyspIHtcbiAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1tpXSA9PT0gdW5kZWYpIHtcbiAgICAgICAgICAgICAgICBtYXRjaFtpXSA9IHVuZGVmO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoLmxlbmd0aCA+IDEgJiYgbWF0Y2guaW5kZXggPCBzdHIubGVuZ3RoKSB7XG4gICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkob3V0cHV0LCBtYXRjaC5zbGljZSgxKSk7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdExlbmd0aCA9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgbGFzdExhc3RJbmRleCA9IGxhc3RJbmRleDtcbiAgICAgICAgaWYgKG91dHB1dC5sZW5ndGggPj0gbGltaXQpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHNlcGFyYXRvci5sYXN0SW5kZXggPT09IG1hdGNoLmluZGV4KSB7XG4gICAgICAgIHNlcGFyYXRvci5sYXN0SW5kZXgrKzsgLy8gQXZvaWQgYW4gaW5maW5pdGUgbG9vcFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAobGFzdExhc3RJbmRleCA9PT0gc3RyLmxlbmd0aCkge1xuICAgICAgaWYgKGxhc3RMZW5ndGggfHwgIXNlcGFyYXRvci50ZXN0KFwiXCIpKSB7XG4gICAgICAgIG91dHB1dC5wdXNoKFwiXCIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaChzdHIuc2xpY2UobGFzdExhc3RJbmRleCkpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0Lmxlbmd0aCA+IGxpbWl0ID8gb3V0cHV0LnNsaWNlKDAsIGxpbWl0KSA6IG91dHB1dDtcbiAgfTtcblxuICByZXR1cm4gc2VsZjtcbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBPbmVWZXJzaW9uQ29uc3RyYWludCA9IHJlcXVpcmUoJ2luZGl2aWR1YWwvb25lLXZlcnNpb24nKTtcblxudmFyIE1ZX1ZFUlNJT04gPSAnNyc7XG5PbmVWZXJzaW9uQ29uc3RyYWludCgnZXYtc3RvcmUnLCBNWV9WRVJTSU9OKTtcblxudmFyIGhhc2hLZXkgPSAnX19FVl9TVE9SRV9LRVlAJyArIE1ZX1ZFUlNJT047XG5cbm1vZHVsZS5leHBvcnRzID0gRXZTdG9yZTtcblxuZnVuY3Rpb24gRXZTdG9yZShlbGVtKSB7XG4gICAgdmFyIGhhc2ggPSBlbGVtW2hhc2hLZXldO1xuXG4gICAgaWYgKCFoYXNoKSB7XG4gICAgICAgIGhhc2ggPSBlbGVtW2hhc2hLZXldID0ge307XG4gICAgfVxuXG4gICAgcmV0dXJuIGhhc2g7XG59XG4iLCJ2YXIgdG9wTGV2ZWwgPSB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6XG4gICAgdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB7fVxudmFyIG1pbkRvYyA9IHJlcXVpcmUoJ21pbi1kb2N1bWVudCcpO1xuXG5pZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZG9jdW1lbnQ7XG59IGVsc2Uge1xuICAgIHZhciBkb2NjeSA9IHRvcExldmVsWydfX0dMT0JBTF9ET0NVTUVOVF9DQUNIRUA0J107XG5cbiAgICBpZiAoIWRvY2N5KSB7XG4gICAgICAgIGRvY2N5ID0gdG9wTGV2ZWxbJ19fR0xPQkFMX0RPQ1VNRU5UX0NBQ0hFQDQnXSA9IG1pbkRvYztcbiAgICB9XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGRvY2N5O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKmdsb2JhbCB3aW5kb3csIGdsb2JhbCovXG5cbnZhciByb290ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgP1xuICAgIHdpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID9cbiAgICBnbG9iYWwgOiB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbmRpdmlkdWFsO1xuXG5mdW5jdGlvbiBJbmRpdmlkdWFsKGtleSwgdmFsdWUpIHtcbiAgICBpZiAoa2V5IGluIHJvb3QpIHtcbiAgICAgICAgcmV0dXJuIHJvb3Rba2V5XTtcbiAgICB9XG5cbiAgICByb290W2tleV0gPSB2YWx1ZTtcblxuICAgIHJldHVybiB2YWx1ZTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEluZGl2aWR1YWwgPSByZXF1aXJlKCcuL2luZGV4LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gT25lVmVyc2lvbjtcblxuZnVuY3Rpb24gT25lVmVyc2lvbihtb2R1bGVOYW1lLCB2ZXJzaW9uLCBkZWZhdWx0VmFsdWUpIHtcbiAgICB2YXIga2V5ID0gJ19fSU5ESVZJRFVBTF9PTkVfVkVSU0lPTl8nICsgbW9kdWxlTmFtZTtcbiAgICB2YXIgZW5mb3JjZUtleSA9IGtleSArICdfRU5GT1JDRV9TSU5HTEVUT04nO1xuXG4gICAgdmFyIHZlcnNpb25WYWx1ZSA9IEluZGl2aWR1YWwoZW5mb3JjZUtleSwgdmVyc2lvbik7XG5cbiAgICBpZiAodmVyc2lvblZhbHVlICE9PSB2ZXJzaW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG9ubHkgaGF2ZSBvbmUgY29weSBvZiAnICtcbiAgICAgICAgICAgIG1vZHVsZU5hbWUgKyAnLlxcbicgK1xuICAgICAgICAgICAgJ1lvdSBhbHJlYWR5IGhhdmUgdmVyc2lvbiAnICsgdmVyc2lvblZhbHVlICtcbiAgICAgICAgICAgICcgaW5zdGFsbGVkLlxcbicgK1xuICAgICAgICAgICAgJ1RoaXMgbWVhbnMgeW91IGNhbm5vdCBpbnN0YWxsIHZlcnNpb24gJyArIHZlcnNpb24pO1xuICAgIH1cblxuICAgIHJldHVybiBJbmRpdmlkdWFsKGtleSwgZGVmYXVsdFZhbHVlKTtcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzT2JqZWN0KHgpIHtcblx0cmV0dXJuIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIHggIT09IG51bGw7XG59O1xuIiwiLyohIFZlbG9jaXR5SlMub3JnICgxLjIuMykuIChDKSAyMDE0IEp1bGlhbiBTaGFwaXJvLiBNSVQgQGxpY2Vuc2U6IGVuLndpa2lwZWRpYS5vcmcvd2lraS9NSVRfTGljZW5zZSAqL1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgVmVsb2NpdHkgalF1ZXJ5IFNoaW1cbioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8qISBWZWxvY2l0eUpTLm9yZyBqUXVlcnkgU2hpbSAoMS4wLjEpLiAoQykgMjAxNCBUaGUgalF1ZXJ5IEZvdW5kYXRpb24uIE1JVCBAbGljZW5zZTogZW4ud2lraXBlZGlhLm9yZy93aWtpL01JVF9MaWNlbnNlLiAqL1xuXG4vKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGpRdWVyeSBmdW5jdGlvbnMgdGhhdCBWZWxvY2l0eSByZWxpZXMgb24sIHRoZXJlYnkgcmVtb3ZpbmcgVmVsb2NpdHkncyBkZXBlbmRlbmN5IG9uIGEgZnVsbCBjb3B5IG9mIGpRdWVyeSwgYW5kIGFsbG93aW5nIGl0IHRvIHdvcmsgaW4gYW55IGVudmlyb25tZW50LiAqL1xuLyogVGhlc2Ugc2hpbW1lZCBmdW5jdGlvbnMgYXJlIG9ubHkgdXNlZCBpZiBqUXVlcnkgaXNuJ3QgcHJlc2VudC4gSWYgYm90aCB0aGlzIHNoaW0gYW5kIGpRdWVyeSBhcmUgbG9hZGVkLCBWZWxvY2l0eSBkZWZhdWx0cyB0byBqUXVlcnkgcHJvcGVyLiAqL1xuLyogQnJvd3NlciBzdXBwb3J0OiBVc2luZyB0aGlzIHNoaW0gaW5zdGVhZCBvZiBqUXVlcnkgcHJvcGVyIHJlbW92ZXMgc3VwcG9ydCBmb3IgSUU4LiAqL1xuXG47KGZ1bmN0aW9uICh3aW5kb3cpIHtcbiAgICAvKioqKioqKioqKioqKioqXG4gICAgICAgICBTZXR1cFxuICAgICoqKioqKioqKioqKioqKi9cblxuICAgIC8qIElmIGpRdWVyeSBpcyBhbHJlYWR5IGxvYWRlZCwgdGhlcmUncyBubyBwb2ludCBpbiBsb2FkaW5nIHRoaXMgc2hpbS4gKi9cbiAgICBpZiAod2luZG93LmpRdWVyeSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLyogalF1ZXJ5IGJhc2UuICovXG4gICAgdmFyICQgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyAkLmZuLmluaXQoc2VsZWN0b3IsIGNvbnRleHQpO1xuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKipcbiAgICAgICBQcml2YXRlIE1ldGhvZHNcbiAgICAqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8qIGpRdWVyeSAqL1xuICAgICQuaXNXaW5kb3cgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIC8qIGpzaGludCBlcWVxZXE6IGZhbHNlICovXG4gICAgICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiBvYmogPT0gb2JqLndpbmRvdztcbiAgICB9O1xuXG4gICAgLyogalF1ZXJ5ICovXG4gICAgJC50eXBlID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICBpZiAob2JqID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmogKyBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIG9iaiA9PT0gXCJmdW5jdGlvblwiID9cbiAgICAgICAgICAgIGNsYXNzMnR5cGVbdG9TdHJpbmcuY2FsbChvYmopXSB8fCBcIm9iamVjdFwiIDpcbiAgICAgICAgICAgIHR5cGVvZiBvYmo7XG4gICAgfTtcblxuICAgIC8qIGpRdWVyeSAqL1xuICAgICQuaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gJC50eXBlKG9iaikgPT09IFwiYXJyYXlcIjtcbiAgICB9O1xuXG4gICAgLyogalF1ZXJ5ICovXG4gICAgZnVuY3Rpb24gaXNBcnJheWxpa2UgKG9iaikge1xuICAgICAgICB2YXIgbGVuZ3RoID0gb2JqLmxlbmd0aCxcbiAgICAgICAgICAgIHR5cGUgPSAkLnR5cGUob2JqKTtcblxuICAgICAgICBpZiAodHlwZSA9PT0gXCJmdW5jdGlvblwiIHx8ICQuaXNXaW5kb3cob2JqKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9iai5ub2RlVHlwZSA9PT0gMSAmJiBsZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHR5cGUgPT09IFwiYXJyYXlcIiB8fCBsZW5ndGggPT09IDAgfHwgdHlwZW9mIGxlbmd0aCA9PT0gXCJudW1iZXJcIiAmJiBsZW5ndGggPiAwICYmIChsZW5ndGggLSAxKSBpbiBvYmo7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKlxuICAgICAgICQgTWV0aG9kc1xuICAgICoqKioqKioqKioqKioqKi9cblxuICAgIC8qIGpRdWVyeTogU3VwcG9ydCByZW1vdmVkIGZvciBJRTw5LiAqL1xuICAgICQuaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICBpZiAoIW9iaiB8fCAkLnR5cGUob2JqKSAhPT0gXCJvYmplY3RcIiB8fCBvYmoubm9kZVR5cGUgfHwgJC5pc1dpbmRvdyhvYmopKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKG9iai5jb25zdHJ1Y3RvciAmJlxuICAgICAgICAgICAgICAgICFoYXNPd24uY2FsbChvYmosIFwiY29uc3RydWN0b3JcIikgJiZcbiAgICAgICAgICAgICAgICAhaGFzT3duLmNhbGwob2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSwgXCJpc1Byb3RvdHlwZU9mXCIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHt9XG5cbiAgICAgICAgcmV0dXJuIGtleSA9PT0gdW5kZWZpbmVkIHx8IGhhc093bi5jYWxsKG9iaiwga2V5KTtcbiAgICB9O1xuXG4gICAgLyogalF1ZXJ5ICovXG4gICAgJC5lYWNoID0gZnVuY3Rpb24ob2JqLCBjYWxsYmFjaywgYXJncykge1xuICAgICAgICB2YXIgdmFsdWUsXG4gICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgIGxlbmd0aCA9IG9iai5sZW5ndGgsXG4gICAgICAgICAgICBpc0FycmF5ID0gaXNBcnJheWxpa2Uob2JqKTtcblxuICAgICAgICBpZiAoYXJncykge1xuICAgICAgICAgICAgaWYgKGlzQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suYXBwbHkob2JqW2ldLCBhcmdzKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChpIGluIG9iaikge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrLmFwcGx5KG9ialtpXSwgYXJncyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpc0FycmF5KSB7XG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrLmNhbGwob2JqW2ldLCBpLCBvYmpbaV0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suY2FsbChvYmpbaV0sIGksIG9ialtpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH07XG5cbiAgICAvKiBDdXN0b20gKi9cbiAgICAkLmRhdGEgPSBmdW5jdGlvbiAobm9kZSwga2V5LCB2YWx1ZSkge1xuICAgICAgICAvKiAkLmdldERhdGEoKSAqL1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFyIGlkID0gbm9kZVskLmV4cGFuZG9dLFxuICAgICAgICAgICAgICAgIHN0b3JlID0gaWQgJiYgY2FjaGVbaWRdO1xuXG4gICAgICAgICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0b3JlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSBpbiBzdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmVba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIC8qICQuc2V0RGF0YSgpICovXG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZhciBpZCA9IG5vZGVbJC5leHBhbmRvXSB8fCAobm9kZVskLmV4cGFuZG9dID0gKyskLnV1aWQpO1xuXG4gICAgICAgICAgICBjYWNoZVtpZF0gPSBjYWNoZVtpZF0gfHwge307XG4gICAgICAgICAgICBjYWNoZVtpZF1ba2V5XSA9IHZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyogQ3VzdG9tICovXG4gICAgJC5yZW1vdmVEYXRhID0gZnVuY3Rpb24gKG5vZGUsIGtleXMpIHtcbiAgICAgICAgdmFyIGlkID0gbm9kZVskLmV4cGFuZG9dLFxuICAgICAgICAgICAgc3RvcmUgPSBpZCAmJiBjYWNoZVtpZF07XG5cbiAgICAgICAgaWYgKHN0b3JlKSB7XG4gICAgICAgICAgICAkLmVhY2goa2V5cywgZnVuY3Rpb24oXywga2V5KSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHN0b3JlW2tleV07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKiBqUXVlcnkgKi9cbiAgICAkLmV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNyYywgY29weUlzQXJyYXksIGNvcHksIG5hbWUsIG9wdGlvbnMsIGNsb25lLFxuICAgICAgICAgICAgdGFyZ2V0ID0gYXJndW1lbnRzWzBdIHx8IHt9LFxuICAgICAgICAgICAgaSA9IDEsXG4gICAgICAgICAgICBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoLFxuICAgICAgICAgICAgZGVlcCA9IGZhbHNlO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgZGVlcCA9IHRhcmdldDtcblxuICAgICAgICAgICAgdGFyZ2V0ID0gYXJndW1lbnRzW2ldIHx8IHt9O1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgIT09IFwib2JqZWN0XCIgJiYgJC50eXBlKHRhcmdldCkgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGFyZ2V0ID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB0aGlzO1xuICAgICAgICAgICAgaS0tO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKChvcHRpb25zID0gYXJndW1lbnRzW2ldKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgc3JjID0gdGFyZ2V0W25hbWVdO1xuICAgICAgICAgICAgICAgICAgICBjb3B5ID0gb3B0aW9uc1tuYW1lXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0ID09PSBjb3B5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWVwICYmIGNvcHkgJiYgKCQuaXNQbGFpbk9iamVjdChjb3B5KSB8fCAoY29weUlzQXJyYXkgPSAkLmlzQXJyYXkoY29weSkpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvcHlJc0FycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29weUlzQXJyYXkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZSA9IHNyYyAmJiAkLmlzQXJyYXkoc3JjKSA/IHNyYyA6IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lID0gc3JjICYmICQuaXNQbGFpbk9iamVjdChzcmMpID8gc3JjIDoge307XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9ICQuZXh0ZW5kKGRlZXAsIGNsb25lLCBjb3B5KTtcblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvcHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdID0gY29weTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfTtcblxuICAgIC8qIGpRdWVyeSAxLjQuMyAqL1xuICAgICQucXVldWUgPSBmdW5jdGlvbiAoZWxlbSwgdHlwZSwgZGF0YSkge1xuICAgICAgICBmdW5jdGlvbiAkbWFrZUFycmF5IChhcnIsIHJlc3VsdHMpIHtcbiAgICAgICAgICAgIHZhciByZXQgPSByZXN1bHRzIHx8IFtdO1xuXG4gICAgICAgICAgICBpZiAoYXJyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNBcnJheWxpa2UoT2JqZWN0KGFycikpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qICQubWVyZ2UgKi9cbiAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uKGZpcnN0LCBzZWNvbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZW4gPSArc2Vjb25kLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpID0gZmlyc3QubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaiA8IGxlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0W2krK10gPSBzZWNvbmRbaisrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxlbiAhPT0gbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHNlY29uZFtqXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0W2krK10gPSBzZWNvbmRbaisrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0Lmxlbmd0aCA9IGk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmaXJzdDtcbiAgICAgICAgICAgICAgICAgICAgfSkocmV0LCB0eXBlb2YgYXJyID09PSBcInN0cmluZ1wiID8gW2Fycl0gOiBhcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFtdLnB1c2guY2FsbChyZXQsIGFycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFlbGVtKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0eXBlID0gKHR5cGUgfHwgXCJmeFwiKSArIFwicXVldWVcIjtcblxuICAgICAgICB2YXIgcSA9ICQuZGF0YShlbGVtLCB0eXBlKTtcblxuICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBxIHx8IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFxIHx8ICQuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgcSA9ICQuZGF0YShlbGVtLCB0eXBlLCAkbWFrZUFycmF5KGRhdGEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucHVzaChkYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBxO1xuICAgIH07XG5cbiAgICAvKiBqUXVlcnkgMS40LjMgKi9cbiAgICAkLmRlcXVldWUgPSBmdW5jdGlvbiAoZWxlbXMsIHR5cGUpIHtcbiAgICAgICAgLyogQ3VzdG9tOiBFbWJlZCBlbGVtZW50IGl0ZXJhdGlvbi4gKi9cbiAgICAgICAgJC5lYWNoKGVsZW1zLm5vZGVUeXBlID8gWyBlbGVtcyBdIDogZWxlbXMsIGZ1bmN0aW9uKGksIGVsZW0pIHtcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlIHx8IFwiZnhcIjtcblxuICAgICAgICAgICAgdmFyIHF1ZXVlID0gJC5xdWV1ZShlbGVtLCB0eXBlKSxcbiAgICAgICAgICAgICAgICBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG5cbiAgICAgICAgICAgIGlmIChmbiA9PT0gXCJpbnByb2dyZXNzXCIpIHtcbiAgICAgICAgICAgICAgICBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmbikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSBcImZ4XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcXVldWUudW5zaGlmdChcImlucHJvZ3Jlc3NcIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm4uY2FsbChlbGVtLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5kZXF1ZXVlKGVsZW0sIHR5cGUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKlxuICAgICAgICQuZm4gTWV0aG9kc1xuICAgICoqKioqKioqKioqKioqKioqKi9cblxuICAgIC8qIGpRdWVyeSAqL1xuICAgICQuZm4gPSAkLnByb3RvdHlwZSA9IHtcbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgICAgICAvKiBKdXN0IHJldHVybiB0aGUgZWxlbWVudCB3cmFwcGVkIGluc2lkZSBhbiBhcnJheTsgZG9uJ3QgcHJvY2VlZCB3aXRoIHRoZSBhY3R1YWwgalF1ZXJ5IG5vZGUgd3JhcHBpbmcgcHJvY2Vzcy4gKi9cbiAgICAgICAgICAgIGlmIChzZWxlY3Rvci5ub2RlVHlwZSkge1xuICAgICAgICAgICAgICAgIHRoaXNbMF0gPSBzZWxlY3RvcjtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgYSBET00gbm9kZS5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb2Zmc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvKiBqUXVlcnkgYWx0ZXJlZCBjb2RlOiBEcm9wcGVkIGRpc2Nvbm5lY3RlZCBET00gbm9kZSBjaGVja2luZy4gKi9cbiAgICAgICAgICAgIHZhciBib3ggPSB0aGlzWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCA/IHRoaXNbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiB7IHRvcDogMCwgbGVmdDogMCB9O1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRvcDogYm94LnRvcCArICh3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuc2Nyb2xsVG9wICB8fCAwKSAgLSAoZG9jdW1lbnQuY2xpZW50VG9wICB8fCAwKSxcbiAgICAgICAgICAgICAgICBsZWZ0OiBib3gubGVmdCArICh3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jdW1lbnQuc2Nyb2xsTGVmdCAgfHwgMCkgLSAoZG9jdW1lbnQuY2xpZW50TGVmdCB8fCAwKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBwb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLyogalF1ZXJ5ICovXG4gICAgICAgICAgICBmdW5jdGlvbiBvZmZzZXRQYXJlbnQoKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IHRoaXMub2Zmc2V0UGFyZW50IHx8IGRvY3VtZW50O1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKG9mZnNldFBhcmVudCAmJiAoIW9mZnNldFBhcmVudC5ub2RlVHlwZS50b0xvd2VyQ2FzZSA9PT0gXCJodG1sXCIgJiYgb2Zmc2V0UGFyZW50LnN0eWxlLnBvc2l0aW9uID09PSBcInN0YXRpY1wiKSkge1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQgPSBvZmZzZXRQYXJlbnQub2Zmc2V0UGFyZW50O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBvZmZzZXRQYXJlbnQgfHwgZG9jdW1lbnQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIFplcHRvICovXG4gICAgICAgICAgICB2YXIgZWxlbSA9IHRoaXNbMF0sXG4gICAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50LmFwcGx5KGVsZW0pLFxuICAgICAgICAgICAgICAgIG9mZnNldCA9IHRoaXMub2Zmc2V0KCksXG4gICAgICAgICAgICAgICAgcGFyZW50T2Zmc2V0ID0gL14oPzpib2R5fGh0bWwpJC9pLnRlc3Qob2Zmc2V0UGFyZW50Lm5vZGVOYW1lKSA/IHsgdG9wOiAwLCBsZWZ0OiAwIH0gOiAkKG9mZnNldFBhcmVudCkub2Zmc2V0KClcblxuICAgICAgICAgICAgb2Zmc2V0LnRvcCAtPSBwYXJzZUZsb2F0KGVsZW0uc3R5bGUubWFyZ2luVG9wKSB8fCAwO1xuICAgICAgICAgICAgb2Zmc2V0LmxlZnQgLT0gcGFyc2VGbG9hdChlbGVtLnN0eWxlLm1hcmdpbkxlZnQpIHx8IDA7XG5cbiAgICAgICAgICAgIGlmIChvZmZzZXRQYXJlbnQuc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRPZmZzZXQudG9wICs9IHBhcnNlRmxvYXQob2Zmc2V0UGFyZW50LnN0eWxlLmJvcmRlclRvcFdpZHRoKSB8fCAwXG4gICAgICAgICAgICAgICAgcGFyZW50T2Zmc2V0LmxlZnQgKz0gcGFyc2VGbG9hdChvZmZzZXRQYXJlbnQuc3R5bGUuYm9yZGVyTGVmdFdpZHRoKSB8fCAwXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wIC0gcGFyZW50T2Zmc2V0LnRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdCAtIHBhcmVudE9mZnNldC5sZWZ0XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgUHJpdmF0ZSBWYXJpYWJsZXNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLyogRm9yICQuZGF0YSgpICovXG4gICAgdmFyIGNhY2hlID0ge307XG4gICAgJC5leHBhbmRvID0gXCJ2ZWxvY2l0eVwiICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcbiAgICAkLnV1aWQgPSAwO1xuXG4gICAgLyogRm9yICQucXVldWUoKSAqL1xuICAgIHZhciBjbGFzczJ0eXBlID0ge30sXG4gICAgICAgIGhhc093biA9IGNsYXNzMnR5cGUuaGFzT3duUHJvcGVydHksXG4gICAgICAgIHRvU3RyaW5nID0gY2xhc3MydHlwZS50b1N0cmluZztcblxuICAgIHZhciB0eXBlcyA9IFwiQm9vbGVhbiBOdW1iZXIgU3RyaW5nIEZ1bmN0aW9uIEFycmF5IERhdGUgUmVnRXhwIE9iamVjdCBFcnJvclwiLnNwbGl0KFwiIFwiKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNsYXNzMnR5cGVbXCJbb2JqZWN0IFwiICsgdHlwZXNbaV0gKyBcIl1cIl0gPSB0eXBlc1tpXS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIC8qIE1ha2VzICQobm9kZSkgcG9zc2libGUsIHdpdGhvdXQgaGF2aW5nIHRvIGNhbGwgaW5pdC4gKi9cbiAgICAkLmZuLmluaXQucHJvdG90eXBlID0gJC5mbjtcblxuICAgIC8qIEdsb2JhbGl6ZSBWZWxvY2l0eSBvbnRvIHRoZSB3aW5kb3csIGFuZCBhc3NpZ24gaXRzIFV0aWxpdGllcyBwcm9wZXJ0eS4gKi9cbiAgICB3aW5kb3cuVmVsb2NpdHkgPSB7IFV0aWxpdGllczogJCB9O1xufSkod2luZG93KTtcblxuLyoqKioqKioqKioqKioqKioqKlxuICAgIFZlbG9jaXR5LmpzXG4qKioqKioqKioqKioqKioqKiovXG5cbjsoZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICAvKiBDb21tb25KUyBtb2R1bGUuICovXG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICAgIC8qIEFNRCBtb2R1bGUuICovXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoZmFjdG9yeSk7XG4gICAgLyogQnJvd3NlciBnbG9iYWxzLiAqL1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoKTtcbiAgICB9XG59KGZ1bmN0aW9uKCkge1xucmV0dXJuIGZ1bmN0aW9uIChnbG9iYWwsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuXG4gICAgLyoqKioqKioqKioqKioqKlxuICAgICAgICBTdW1tYXJ5XG4gICAgKioqKioqKioqKioqKioqL1xuXG4gICAgLypcbiAgICAtIENTUzogQ1NTIHN0YWNrIHRoYXQgd29ya3MgaW5kZXBlbmRlbnRseSBmcm9tIHRoZSByZXN0IG9mIFZlbG9jaXR5LlxuICAgIC0gYW5pbWF0ZSgpOiBDb3JlIGFuaW1hdGlvbiBtZXRob2QgdGhhdCBpdGVyYXRlcyBvdmVyIHRoZSB0YXJnZXRlZCBlbGVtZW50cyBhbmQgcXVldWVzIHRoZSBpbmNvbWluZyBjYWxsIG9udG8gZWFjaCBlbGVtZW50IGluZGl2aWR1YWxseS5cbiAgICAgIC0gUHJlLVF1ZXVlaW5nOiBQcmVwYXJlIHRoZSBlbGVtZW50IGZvciBhbmltYXRpb24gYnkgaW5zdGFudGlhdGluZyBpdHMgZGF0YSBjYWNoZSBhbmQgcHJvY2Vzc2luZyB0aGUgY2FsbCdzIG9wdGlvbnMuXG4gICAgICAtIFF1ZXVlaW5nOiBUaGUgbG9naWMgdGhhdCBydW5zIG9uY2UgdGhlIGNhbGwgaGFzIHJlYWNoZWQgaXRzIHBvaW50IG9mIGV4ZWN1dGlvbiBpbiB0aGUgZWxlbWVudCdzICQucXVldWUoKSBzdGFjay5cbiAgICAgICAgICAgICAgICAgIE1vc3QgbG9naWMgaXMgcGxhY2VkIGhlcmUgdG8gYXZvaWQgcmlza2luZyBpdCBiZWNvbWluZyBzdGFsZSAoaWYgdGhlIGVsZW1lbnQncyBwcm9wZXJ0aWVzIGhhdmUgY2hhbmdlZCkuXG4gICAgICAtIFB1c2hpbmc6IENvbnNvbGlkYXRpb24gb2YgdGhlIHR3ZWVuIGRhdGEgZm9sbG93ZWQgYnkgaXRzIHB1c2ggb250byB0aGUgZ2xvYmFsIGluLXByb2dyZXNzIGNhbGxzIGNvbnRhaW5lci5cbiAgICAtIHRpY2soKTogVGhlIHNpbmdsZSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgbG9vcCByZXNwb25zaWJsZSBmb3IgdHdlZW5pbmcgYWxsIGluLXByb2dyZXNzIGNhbGxzLlxuICAgIC0gY29tcGxldGVDYWxsKCk6IEhhbmRsZXMgdGhlIGNsZWFudXAgcHJvY2VzcyBmb3IgZWFjaCBWZWxvY2l0eSBjYWxsLlxuICAgICovXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgSGVscGVyIEZ1bmN0aW9uc1xuICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8qIElFIGRldGVjdGlvbi4gR2lzdDogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vanVsaWFuc2hhcGlyby85MDk4NjA5ICovXG4gICAgdmFyIElFID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoZG9jdW1lbnQuZG9jdW1lbnRNb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRNb2RlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDc7IGkgPiA0OyBpLS0pIHtcbiAgICAgICAgICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAgICAgICAgIGRpdi5pbm5lckhUTUwgPSBcIjwhLS1baWYgSUUgXCIgKyBpICsgXCJdPjxzcGFuPjwvc3Bhbj48IVtlbmRpZl0tLT5cIjtcblxuICAgICAgICAgICAgICAgIGlmIChkaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzcGFuXCIpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBkaXYgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSkoKTtcblxuICAgIC8qIHJBRiBzaGltLiBHaXN0OiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9qdWxpYW5zaGFwaXJvLzk0OTc1MTMgKi9cbiAgICB2YXIgckFGU2hpbSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRpbWVMYXN0ID0gMDtcblxuICAgICAgICByZXR1cm4gd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgdGltZUN1cnJlbnQgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpLFxuICAgICAgICAgICAgICAgIHRpbWVEZWx0YTtcblxuICAgICAgICAgICAgLyogRHluYW1pY2FsbHkgc2V0IGRlbGF5IG9uIGEgcGVyLXRpY2sgYmFzaXMgdG8gbWF0Y2ggNjBmcHMuICovXG4gICAgICAgICAgICAvKiBUZWNobmlxdWUgYnkgRXJpayBNb2xsZXIuIE1JVCBsaWNlbnNlOiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9wYXVsaXJpc2gvMTU3OTY3MSAqL1xuICAgICAgICAgICAgdGltZURlbHRhID0gTWF0aC5tYXgoMCwgMTYgLSAodGltZUN1cnJlbnQgLSB0aW1lTGFzdCkpO1xuICAgICAgICAgICAgdGltZUxhc3QgPSB0aW1lQ3VycmVudCArIHRpbWVEZWx0YTtcblxuICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKHRpbWVDdXJyZW50ICsgdGltZURlbHRhKTsgfSwgdGltZURlbHRhKTtcbiAgICAgICAgfTtcbiAgICB9KSgpO1xuXG4gICAgLyogQXJyYXkgY29tcGFjdGluZy4gQ29weXJpZ2h0IExvLURhc2guIE1JVCBMaWNlbnNlOiBodHRwczovL2dpdGh1Yi5jb20vbG9kYXNoL2xvZGFzaC9ibG9iL21hc3Rlci9MSUNFTlNFLnR4dCAqL1xuICAgIGZ1bmN0aW9uIGNvbXBhY3RTcGFyc2VBcnJheSAoYXJyYXkpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDAsXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNhbml0aXplRWxlbWVudHMgKGVsZW1lbnRzKSB7XG4gICAgICAgIC8qIFVud3JhcCBqUXVlcnkvWmVwdG8gb2JqZWN0cy4gKi9cbiAgICAgICAgaWYgKFR5cGUuaXNXcmFwcGVkKGVsZW1lbnRzKSkge1xuICAgICAgICAgICAgZWxlbWVudHMgPSBbXS5zbGljZS5jYWxsKGVsZW1lbnRzKTtcbiAgICAgICAgLyogV3JhcCBhIHNpbmdsZSBlbGVtZW50IGluIGFuIGFycmF5IHNvIHRoYXQgJC5lYWNoKCkgY2FuIGl0ZXJhdGUgd2l0aCB0aGUgZWxlbWVudCBpbnN0ZWFkIG9mIGl0cyBub2RlJ3MgY2hpbGRyZW4uICovXG4gICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc05vZGUoZWxlbWVudHMpKSB7XG4gICAgICAgICAgICBlbGVtZW50cyA9IFsgZWxlbWVudHMgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50cztcbiAgICB9XG5cbiAgICB2YXIgVHlwZSA9IHtcbiAgICAgICAgaXNTdHJpbmc6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuICh0eXBlb2YgdmFyaWFibGUgPT09IFwic3RyaW5nXCIpO1xuICAgICAgICB9LFxuICAgICAgICBpc0FycmF5OiBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YXJpYWJsZSkgPT09IFwiW29iamVjdCBBcnJheV1cIjtcbiAgICAgICAgfSxcbiAgICAgICAgaXNGdW5jdGlvbjogZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhcmlhYmxlKSA9PT0gXCJbb2JqZWN0IEZ1bmN0aW9uXVwiO1xuICAgICAgICB9LFxuICAgICAgICBpc05vZGU6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhcmlhYmxlICYmIHZhcmlhYmxlLm5vZGVUeXBlO1xuICAgICAgICB9LFxuICAgICAgICAvKiBDb3B5cmlnaHQgTWFydGluIEJvaG0uIE1JVCBMaWNlbnNlOiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9Ub21hbGFrLzgxOGE3OGEyMjZhMDczOGVhYWRlICovXG4gICAgICAgIGlzTm9kZUxpc3Q6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2YXJpYWJsZSA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICAgICAgICAgIC9eXFxbb2JqZWN0IChIVE1MQ29sbGVjdGlvbnxOb2RlTGlzdHxPYmplY3QpXFxdJC8udGVzdChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFyaWFibGUpKSAmJlxuICAgICAgICAgICAgICAgIHZhcmlhYmxlLmxlbmd0aCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgKHZhcmlhYmxlLmxlbmd0aCA9PT0gMCB8fCAodHlwZW9mIHZhcmlhYmxlWzBdID09PSBcIm9iamVjdFwiICYmIHZhcmlhYmxlWzBdLm5vZGVUeXBlID4gMCkpO1xuICAgICAgICB9LFxuICAgICAgICAvKiBEZXRlcm1pbmUgaWYgdmFyaWFibGUgaXMgYSB3cmFwcGVkIGpRdWVyeSBvciBaZXB0byBlbGVtZW50LiAqL1xuICAgICAgICBpc1dyYXBwZWQ6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhcmlhYmxlICYmICh2YXJpYWJsZS5qcXVlcnkgfHwgKHdpbmRvdy5aZXB0byAmJiB3aW5kb3cuWmVwdG8uemVwdG8uaXNaKHZhcmlhYmxlKSkpO1xuICAgICAgICB9LFxuICAgICAgICBpc1NWRzogZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93LlNWR0VsZW1lbnQgJiYgKHZhcmlhYmxlIGluc3RhbmNlb2Ygd2luZG93LlNWR0VsZW1lbnQpO1xuICAgICAgICB9LFxuICAgICAgICBpc0VtcHR5T2JqZWN0OiBmdW5jdGlvbiAodmFyaWFibGUpIHtcbiAgICAgICAgICAgIGZvciAodmFyIG5hbWUgaW4gdmFyaWFibGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKioqKioqKioqKioqKioqKlxuICAgICAgIERlcGVuZGVuY2llc1xuICAgICoqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyICQsXG4gICAgICAgIGlzSlF1ZXJ5ID0gZmFsc2U7XG5cbiAgICBpZiAoZ2xvYmFsLmZuICYmIGdsb2JhbC5mbi5qcXVlcnkpIHtcbiAgICAgICAgJCA9IGdsb2JhbDtcbiAgICAgICAgaXNKUXVlcnkgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICQgPSB3aW5kb3cuVmVsb2NpdHkuVXRpbGl0aWVzO1xuICAgIH1cblxuICAgIGlmIChJRSA8PSA4ICYmICFpc0pRdWVyeSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWZWxvY2l0eTogSUU4IGFuZCBiZWxvdyByZXF1aXJlIGpRdWVyeSB0byBiZSBsb2FkZWQgYmVmb3JlIFZlbG9jaXR5LlwiKTtcbiAgICB9IGVsc2UgaWYgKElFIDw9IDcpIHtcbiAgICAgICAgLyogUmV2ZXJ0IHRvIGpRdWVyeSdzICQuYW5pbWF0ZSgpLCBhbmQgbG9zZSBWZWxvY2l0eSdzIGV4dHJhIGZlYXR1cmVzLiAqL1xuICAgICAgICBqUXVlcnkuZm4udmVsb2NpdHkgPSBqUXVlcnkuZm4uYW5pbWF0ZTtcblxuICAgICAgICAvKiBOb3cgdGhhdCAkLmZuLnZlbG9jaXR5IGlzIGFsaWFzZWQsIGFib3J0IHRoaXMgVmVsb2NpdHkgZGVjbGFyYXRpb24uICovXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uc3RhbnRzXG4gICAgKioqKioqKioqKioqKioqKiovXG5cbiAgICB2YXIgRFVSQVRJT05fREVGQVVMVCA9IDQwMCxcbiAgICAgICAgRUFTSU5HX0RFRkFVTFQgPSBcInN3aW5nXCI7XG5cbiAgICAvKioqKioqKioqKioqKlxuICAgICAgICBTdGF0ZVxuICAgICoqKioqKioqKioqKiovXG5cbiAgICB2YXIgVmVsb2NpdHkgPSB7XG4gICAgICAgIC8qIENvbnRhaW5lciBmb3IgcGFnZS13aWRlIFZlbG9jaXR5IHN0YXRlIGRhdGEuICovXG4gICAgICAgIFN0YXRlOiB7XG4gICAgICAgICAgICAvKiBEZXRlY3QgbW9iaWxlIGRldmljZXMgdG8gZGV0ZXJtaW5lIGlmIG1vYmlsZUhBIHNob3VsZCBiZSB0dXJuZWQgb24uICovXG4gICAgICAgICAgICBpc01vYmlsZTogL0FuZHJvaWR8d2ViT1N8aVBob25lfGlQYWR8aVBvZHxCbGFja0JlcnJ5fElFTW9iaWxlfE9wZXJhIE1pbmkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLFxuICAgICAgICAgICAgLyogVGhlIG1vYmlsZUhBIG9wdGlvbidzIGJlaGF2aW9yIGNoYW5nZXMgb24gb2xkZXIgQW5kcm9pZCBkZXZpY2VzIChHaW5nZXJicmVhZCwgdmVyc2lvbnMgMi4zLjMtMi4zLjcpLiAqL1xuICAgICAgICAgICAgaXNBbmRyb2lkOiAvQW5kcm9pZC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCksXG4gICAgICAgICAgICBpc0dpbmdlcmJyZWFkOiAvQW5kcm9pZCAyXFwuM1xcLlszLTddL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSxcbiAgICAgICAgICAgIGlzQ2hyb21lOiB3aW5kb3cuY2hyb21lLFxuICAgICAgICAgICAgaXNGaXJlZm94OiAvRmlyZWZveC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCksXG4gICAgICAgICAgICAvKiBDcmVhdGUgYSBjYWNoZWQgZWxlbWVudCBmb3IgcmUtdXNlIHdoZW4gY2hlY2tpbmcgZm9yIENTUyBwcm9wZXJ0eSBwcmVmaXhlcy4gKi9cbiAgICAgICAgICAgIHByZWZpeEVsZW1lbnQ6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksXG4gICAgICAgICAgICAvKiBDYWNoZSBldmVyeSBwcmVmaXggbWF0Y2ggdG8gYXZvaWQgcmVwZWF0aW5nIGxvb2t1cHMuICovXG4gICAgICAgICAgICBwcmVmaXhNYXRjaGVzOiB7fSxcbiAgICAgICAgICAgIC8qIENhY2hlIHRoZSBhbmNob3IgdXNlZCBmb3IgYW5pbWF0aW5nIHdpbmRvdyBzY3JvbGxpbmcuICovXG4gICAgICAgICAgICBzY3JvbGxBbmNob3I6IG51bGwsXG4gICAgICAgICAgICAvKiBDYWNoZSB0aGUgYnJvd3Nlci1zcGVjaWZpYyBwcm9wZXJ0eSBuYW1lcyBhc3NvY2lhdGVkIHdpdGggdGhlIHNjcm9sbCBhbmNob3IuICovXG4gICAgICAgICAgICBzY3JvbGxQcm9wZXJ0eUxlZnQ6IG51bGwsXG4gICAgICAgICAgICBzY3JvbGxQcm9wZXJ0eVRvcDogbnVsbCxcbiAgICAgICAgICAgIC8qIEtlZXAgdHJhY2sgb2Ygd2hldGhlciBvdXIgUkFGIHRpY2sgaXMgcnVubmluZy4gKi9cbiAgICAgICAgICAgIGlzVGlja2luZzogZmFsc2UsXG4gICAgICAgICAgICAvKiBDb250YWluZXIgZm9yIGV2ZXJ5IGluLXByb2dyZXNzIGNhbGwgdG8gVmVsb2NpdHkuICovXG4gICAgICAgICAgICBjYWxsczogW11cbiAgICAgICAgfSxcbiAgICAgICAgLyogVmVsb2NpdHkncyBjdXN0b20gQ1NTIHN0YWNrLiBNYWRlIGdsb2JhbCBmb3IgdW5pdCB0ZXN0aW5nLiAqL1xuICAgICAgICBDU1M6IHsgLyogRGVmaW5lZCBiZWxvdy4gKi8gfSxcbiAgICAgICAgLyogQSBzaGltIG9mIHRoZSBqUXVlcnkgdXRpbGl0eSBmdW5jdGlvbnMgdXNlZCBieSBWZWxvY2l0eSAtLSBwcm92aWRlZCBieSBWZWxvY2l0eSdzIG9wdGlvbmFsIGpRdWVyeSBzaGltLiAqL1xuICAgICAgICBVdGlsaXRpZXM6ICQsXG4gICAgICAgIC8qIENvbnRhaW5lciBmb3IgdGhlIHVzZXIncyBjdXN0b20gYW5pbWF0aW9uIHJlZGlyZWN0cyB0aGF0IGFyZSByZWZlcmVuY2VkIGJ5IG5hbWUgaW4gcGxhY2Ugb2YgdGhlIHByb3BlcnRpZXMgbWFwIGFyZ3VtZW50LiAqL1xuICAgICAgICBSZWRpcmVjdHM6IHsgLyogTWFudWFsbHkgcmVnaXN0ZXJlZCBieSB0aGUgdXNlci4gKi8gfSxcbiAgICAgICAgRWFzaW5nczogeyAvKiBEZWZpbmVkIGJlbG93LiAqLyB9LFxuICAgICAgICAvKiBBdHRlbXB0IHRvIHVzZSBFUzYgUHJvbWlzZXMgYnkgZGVmYXVsdC4gVXNlcnMgY2FuIG92ZXJyaWRlIHRoaXMgd2l0aCBhIHRoaXJkLXBhcnR5IHByb21pc2VzIGxpYnJhcnkuICovXG4gICAgICAgIFByb21pc2U6IHdpbmRvdy5Qcm9taXNlLFxuICAgICAgICAvKiBWZWxvY2l0eSBvcHRpb24gZGVmYXVsdHMsIHdoaWNoIGNhbiBiZSBvdmVycmlkZW4gYnkgdGhlIHVzZXIuICovXG4gICAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgICAgICBxdWV1ZTogXCJcIixcbiAgICAgICAgICAgIGR1cmF0aW9uOiBEVVJBVElPTl9ERUZBVUxULFxuICAgICAgICAgICAgZWFzaW5nOiBFQVNJTkdfREVGQVVMVCxcbiAgICAgICAgICAgIGJlZ2luOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBjb21wbGV0ZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgcHJvZ3Jlc3M6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGRpc3BsYXk6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHZpc2liaWxpdHk6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGxvb3A6IGZhbHNlLFxuICAgICAgICAgICAgZGVsYXk6IGZhbHNlLFxuICAgICAgICAgICAgbW9iaWxlSEE6IHRydWUsXG4gICAgICAgICAgICAvKiBBZHZhbmNlZDogU2V0IHRvIGZhbHNlIHRvIHByZXZlbnQgcHJvcGVydHkgdmFsdWVzIGZyb20gYmVpbmcgY2FjaGVkIGJldHdlZW4gY29uc2VjdXRpdmUgVmVsb2NpdHktaW5pdGlhdGVkIGNoYWluIGNhbGxzLiAqL1xuICAgICAgICAgICAgX2NhY2hlVmFsdWVzOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIC8qIEEgZGVzaWduIGdvYWwgb2YgVmVsb2NpdHkgaXMgdG8gY2FjaGUgZGF0YSB3aGVyZXZlciBwb3NzaWJsZSBpbiBvcmRlciB0byBhdm9pZCBET00gcmVxdWVyeWluZy4gQWNjb3JkaW5nbHksIGVhY2ggZWxlbWVudCBoYXMgYSBkYXRhIGNhY2hlLiAqL1xuICAgICAgICBpbml0OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgJC5kYXRhKGVsZW1lbnQsIFwidmVsb2NpdHlcIiwge1xuICAgICAgICAgICAgICAgIC8qIFN0b3JlIHdoZXRoZXIgdGhpcyBpcyBhbiBTVkcgZWxlbWVudCwgc2luY2UgaXRzIHByb3BlcnRpZXMgYXJlIHJldHJpZXZlZCBhbmQgdXBkYXRlZCBkaWZmZXJlbnRseSB0aGFuIHN0YW5kYXJkIEhUTUwgZWxlbWVudHMuICovXG4gICAgICAgICAgICAgICAgaXNTVkc6IFR5cGUuaXNTVkcoZWxlbWVudCksXG4gICAgICAgICAgICAgICAgLyogS2VlcCB0cmFjayBvZiB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIGN1cnJlbnRseSBiZWluZyBhbmltYXRlZCBieSBWZWxvY2l0eS5cbiAgICAgICAgICAgICAgICAgICBUaGlzIGlzIHVzZWQgdG8gZW5zdXJlIHRoYXQgcHJvcGVydHkgdmFsdWVzIGFyZSBub3QgdHJhbnNmZXJyZWQgYmV0d2VlbiBub24tY29uc2VjdXRpdmUgKHN0YWxlKSBjYWxscy4gKi9cbiAgICAgICAgICAgICAgICBpc0FuaW1hdGluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgLyogQSByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnQncyBsaXZlIGNvbXB1dGVkU3R5bGUgb2JqZWN0LiBMZWFybiBtb3JlIGhlcmU6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvV2ViL0FQSS93aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAqL1xuICAgICAgICAgICAgICAgIGNvbXB1dGVkU3R5bGU6IG51bGwsXG4gICAgICAgICAgICAgICAgLyogVHdlZW4gZGF0YSBpcyBjYWNoZWQgZm9yIGVhY2ggYW5pbWF0aW9uIG9uIHRoZSBlbGVtZW50IHNvIHRoYXQgZGF0YSBjYW4gYmUgcGFzc2VkIGFjcm9zcyBjYWxscyAtLVxuICAgICAgICAgICAgICAgICAgIGluIHBhcnRpY3VsYXIsIGVuZCB2YWx1ZXMgYXJlIHVzZWQgYXMgc3Vic2VxdWVudCBzdGFydCB2YWx1ZXMgaW4gY29uc2VjdXRpdmUgVmVsb2NpdHkgY2FsbHMuICovXG4gICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyOiBudWxsLFxuICAgICAgICAgICAgICAgIC8qIFRoZSBmdWxsIHJvb3QgcHJvcGVydHkgdmFsdWVzIG9mIGVhY2ggQ1NTIGhvb2sgYmVpbmcgYW5pbWF0ZWQgb24gdGhpcyBlbGVtZW50IGFyZSBjYWNoZWQgc28gdGhhdDpcbiAgICAgICAgICAgICAgICAgICAxKSBDb25jdXJyZW50bHktYW5pbWF0aW5nIGhvb2tzIHNoYXJpbmcgdGhlIHNhbWUgcm9vdCBjYW4gaGF2ZSB0aGVpciByb290IHZhbHVlcycgbWVyZ2VkIGludG8gb25lIHdoaWxlIHR3ZWVuaW5nLlxuICAgICAgICAgICAgICAgICAgIDIpIFBvc3QtaG9vay1pbmplY3Rpb24gcm9vdCB2YWx1ZXMgY2FuIGJlIHRyYW5zZmVycmVkIG92ZXIgdG8gY29uc2VjdXRpdmVseSBjaGFpbmVkIFZlbG9jaXR5IGNhbGxzIGFzIHN0YXJ0aW5nIHJvb3QgdmFsdWVzLiAqL1xuICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGU6IHt9LFxuICAgICAgICAgICAgICAgIC8qIEEgY2FjaGUgZm9yIHRyYW5zZm9ybSB1cGRhdGVzLCB3aGljaCBtdXN0IGJlIG1hbnVhbGx5IGZsdXNoZWQgdmlhIENTUy5mbHVzaFRyYW5zZm9ybUNhY2hlKCkuICovXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtQ2FjaGU6IHt9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLyogQSBwYXJhbGxlbCB0byBqUXVlcnkncyAkLmNzcygpLCB1c2VkIGZvciBnZXR0aW5nL3NldHRpbmcgVmVsb2NpdHkncyBob29rZWQgQ1NTIHByb3BlcnRpZXMuICovXG4gICAgICAgIGhvb2s6IG51bGwsIC8qIERlZmluZWQgYmVsb3cuICovXG4gICAgICAgIC8qIFZlbG9jaXR5LXdpZGUgYW5pbWF0aW9uIHRpbWUgcmVtYXBwaW5nIGZvciB0ZXN0aW5nIHB1cnBvc2VzLiAqL1xuICAgICAgICBtb2NrOiBmYWxzZSxcbiAgICAgICAgdmVyc2lvbjogeyBtYWpvcjogMSwgbWlub3I6IDIsIHBhdGNoOiAyIH0sXG4gICAgICAgIC8qIFNldCB0byAxIG9yIDIgKG1vc3QgdmVyYm9zZSkgdG8gb3V0cHV0IGRlYnVnIGluZm8gdG8gY29uc29sZS4gKi9cbiAgICAgICAgZGVidWc6IGZhbHNlXG4gICAgfTtcblxuICAgIC8qIFJldHJpZXZlIHRoZSBhcHByb3ByaWF0ZSBzY3JvbGwgYW5jaG9yIGFuZCBwcm9wZXJ0eSBuYW1lIGZvciB0aGUgYnJvd3NlcjogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dpbmRvdy5zY3JvbGxZICovXG4gICAgaWYgKHdpbmRvdy5wYWdlWU9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIFZlbG9jaXR5LlN0YXRlLnNjcm9sbEFuY2hvciA9IHdpbmRvdztcbiAgICAgICAgVmVsb2NpdHkuU3RhdGUuc2Nyb2xsUHJvcGVydHlMZWZ0ID0gXCJwYWdlWE9mZnNldFwiO1xuICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxQcm9wZXJ0eVRvcCA9IFwicGFnZVlPZmZzZXRcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxBbmNob3IgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIFZlbG9jaXR5LlN0YXRlLnNjcm9sbFByb3BlcnR5TGVmdCA9IFwic2Nyb2xsTGVmdFwiO1xuICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxQcm9wZXJ0eVRvcCA9IFwic2Nyb2xsVG9wXCI7XG4gICAgfVxuXG4gICAgLyogU2hvcnRoYW5kIGFsaWFzIGZvciBqUXVlcnkncyAkLmRhdGEoKSB1dGlsaXR5LiAqL1xuICAgIGZ1bmN0aW9uIERhdGEgKGVsZW1lbnQpIHtcbiAgICAgICAgLyogSGFyZGNvZGUgYSByZWZlcmVuY2UgdG8gdGhlIHBsdWdpbiBuYW1lLiAqL1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSAkLmRhdGEoZWxlbWVudCwgXCJ2ZWxvY2l0eVwiKTtcblxuICAgICAgICAvKiBqUXVlcnkgPD0xLjQuMiByZXR1cm5zIG51bGwgaW5zdGVhZCBvZiB1bmRlZmluZWQgd2hlbiBubyBtYXRjaCBpcyBmb3VuZC4gV2Ugbm9ybWFsaXplIHRoaXMgYmVoYXZpb3IuICovXG4gICAgICAgIHJldHVybiByZXNwb25zZSA9PT0gbnVsbCA/IHVuZGVmaW5lZCA6IHJlc3BvbnNlO1xuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKipcbiAgICAgICAgRWFzaW5nXG4gICAgKioqKioqKioqKioqKiovXG5cbiAgICAvKiBTdGVwIGVhc2luZyBnZW5lcmF0b3IuICovXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVTdGVwIChzdGVwcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHApIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHAgKiBzdGVwcykgKiAoMSAvIHN0ZXBzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKiBCZXppZXIgY3VydmUgZnVuY3Rpb24gZ2VuZXJhdG9yLiBDb3B5cmlnaHQgR2FldGFuIFJlbmF1ZGVhdS4gTUlUIExpY2Vuc2U6IGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTUlUX0xpY2Vuc2UgKi9cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZUJlemllciAobVgxLCBtWTEsIG1YMiwgbVkyKSB7XG4gICAgICAgIHZhciBORVdUT05fSVRFUkFUSU9OUyA9IDQsXG4gICAgICAgICAgICBORVdUT05fTUlOX1NMT1BFID0gMC4wMDEsXG4gICAgICAgICAgICBTVUJESVZJU0lPTl9QUkVDSVNJT04gPSAwLjAwMDAwMDEsXG4gICAgICAgICAgICBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyA9IDEwLFxuICAgICAgICAgICAga1NwbGluZVRhYmxlU2l6ZSA9IDExLFxuICAgICAgICAgICAga1NhbXBsZVN0ZXBTaXplID0gMS4wIC8gKGtTcGxpbmVUYWJsZVNpemUgLSAxLjApLFxuICAgICAgICAgICAgZmxvYXQzMkFycmF5U3VwcG9ydGVkID0gXCJGbG9hdDMyQXJyYXlcIiBpbiB3aW5kb3c7XG5cbiAgICAgICAgLyogTXVzdCBjb250YWluIGZvdXIgYXJndW1lbnRzLiAqL1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAhPT0gNCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogQXJndW1lbnRzIG11c3QgYmUgbnVtYmVycy4gKi9cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyArK2kpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzW2ldICE9PSBcIm51bWJlclwiIHx8IGlzTmFOKGFyZ3VtZW50c1tpXSkgfHwgIWlzRmluaXRlKGFyZ3VtZW50c1tpXSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiBYIHZhbHVlcyBtdXN0IGJlIGluIHRoZSBbMCwgMV0gcmFuZ2UuICovXG4gICAgICAgIG1YMSA9IE1hdGgubWluKG1YMSwgMSk7XG4gICAgICAgIG1YMiA9IE1hdGgubWluKG1YMiwgMSk7XG4gICAgICAgIG1YMSA9IE1hdGgubWF4KG1YMSwgMCk7XG4gICAgICAgIG1YMiA9IE1hdGgubWF4KG1YMiwgMCk7XG5cbiAgICAgICAgdmFyIG1TYW1wbGVWYWx1ZXMgPSBmbG9hdDMyQXJyYXlTdXBwb3J0ZWQgPyBuZXcgRmxvYXQzMkFycmF5KGtTcGxpbmVUYWJsZVNpemUpIDogbmV3IEFycmF5KGtTcGxpbmVUYWJsZVNpemUpO1xuXG4gICAgICAgIGZ1bmN0aW9uIEEgKGFBMSwgYUEyKSB7IHJldHVybiAxLjAgLSAzLjAgKiBhQTIgKyAzLjAgKiBhQTE7IH1cbiAgICAgICAgZnVuY3Rpb24gQiAoYUExLCBhQTIpIHsgcmV0dXJuIDMuMCAqIGFBMiAtIDYuMCAqIGFBMTsgfVxuICAgICAgICBmdW5jdGlvbiBDIChhQTEpICAgICAgeyByZXR1cm4gMy4wICogYUExOyB9XG5cbiAgICAgICAgZnVuY3Rpb24gY2FsY0JlemllciAoYVQsIGFBMSwgYUEyKSB7XG4gICAgICAgICAgICByZXR1cm4gKChBKGFBMSwgYUEyKSphVCArIEIoYUExLCBhQTIpKSphVCArIEMoYUExKSkqYVQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRTbG9wZSAoYVQsIGFBMSwgYUEyKSB7XG4gICAgICAgICAgICByZXR1cm4gMy4wICogQShhQTEsIGFBMikqYVQqYVQgKyAyLjAgKiBCKGFBMSwgYUEyKSAqIGFUICsgQyhhQTEpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gbmV3dG9uUmFwaHNvbkl0ZXJhdGUgKGFYLCBhR3Vlc3NUKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE5FV1RPTl9JVEVSQVRJT05TOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFNsb3BlID0gZ2V0U2xvcGUoYUd1ZXNzVCwgbVgxLCBtWDIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRTbG9wZSA9PT0gMC4wKSByZXR1cm4gYUd1ZXNzVDtcblxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50WCA9IGNhbGNCZXppZXIoYUd1ZXNzVCwgbVgxLCBtWDIpIC0gYVg7XG4gICAgICAgICAgICAgICAgYUd1ZXNzVCAtPSBjdXJyZW50WCAvIGN1cnJlbnRTbG9wZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFHdWVzc1Q7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjYWxjU2FtcGxlVmFsdWVzICgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga1NwbGluZVRhYmxlU2l6ZTsgKytpKSB7XG4gICAgICAgICAgICAgICAgbVNhbXBsZVZhbHVlc1tpXSA9IGNhbGNCZXppZXIoaSAqIGtTYW1wbGVTdGVwU2l6ZSwgbVgxLCBtWDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYmluYXJ5U3ViZGl2aWRlIChhWCwgYUEsIGFCKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudFgsIGN1cnJlbnRULCBpID0gMDtcblxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRUID0gYUEgKyAoYUIgLSBhQSkgLyAyLjA7XG4gICAgICAgICAgICAgICAgY3VycmVudFggPSBjYWxjQmV6aWVyKGN1cnJlbnRULCBtWDEsIG1YMikgLSBhWDtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFggPiAwLjApIHtcbiAgICAgICAgICAgICAgICAgIGFCID0gY3VycmVudFQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGFBID0gY3VycmVudFQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB3aGlsZSAoTWF0aC5hYnMoY3VycmVudFgpID4gU1VCRElWSVNJT05fUFJFQ0lTSU9OICYmICsraSA8IFNVQkRJVklTSU9OX01BWF9JVEVSQVRJT05TKTtcblxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRUO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0VEZvclggKGFYKSB7XG4gICAgICAgICAgICB2YXIgaW50ZXJ2YWxTdGFydCA9IDAuMCxcbiAgICAgICAgICAgICAgICBjdXJyZW50U2FtcGxlID0gMSxcbiAgICAgICAgICAgICAgICBsYXN0U2FtcGxlID0ga1NwbGluZVRhYmxlU2l6ZSAtIDE7XG5cbiAgICAgICAgICAgIGZvciAoOyBjdXJyZW50U2FtcGxlICE9IGxhc3RTYW1wbGUgJiYgbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSA8PSBhWDsgKytjdXJyZW50U2FtcGxlKSB7XG4gICAgICAgICAgICAgICAgaW50ZXJ2YWxTdGFydCArPSBrU2FtcGxlU3RlcFNpemU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC0tY3VycmVudFNhbXBsZTtcblxuICAgICAgICAgICAgdmFyIGRpc3QgPSAoYVggLSBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKSAvIChtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGUrMV0gLSBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKSxcbiAgICAgICAgICAgICAgICBndWVzc0ZvclQgPSBpbnRlcnZhbFN0YXJ0ICsgZGlzdCAqIGtTYW1wbGVTdGVwU2l6ZSxcbiAgICAgICAgICAgICAgICBpbml0aWFsU2xvcGUgPSBnZXRTbG9wZShndWVzc0ZvclQsIG1YMSwgbVgyKTtcblxuICAgICAgICAgICAgaWYgKGluaXRpYWxTbG9wZSA+PSBORVdUT05fTUlOX1NMT1BFKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld3RvblJhcGhzb25JdGVyYXRlKGFYLCBndWVzc0ZvclQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpbml0aWFsU2xvcGUgPT0gMC4wKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGd1ZXNzRm9yVDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpbmFyeVN1YmRpdmlkZShhWCwgaW50ZXJ2YWxTdGFydCwgaW50ZXJ2YWxTdGFydCArIGtTYW1wbGVTdGVwU2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgX3ByZWNvbXB1dGVkID0gZmFsc2U7XG5cbiAgICAgICAgZnVuY3Rpb24gcHJlY29tcHV0ZSgpIHtcbiAgICAgICAgICAgIF9wcmVjb21wdXRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAobVgxICE9IG1ZMSB8fCBtWDIgIT0gbVkyKSBjYWxjU2FtcGxlVmFsdWVzKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChhWCkge1xuICAgICAgICAgICAgaWYgKCFfcHJlY29tcHV0ZWQpIHByZWNvbXB1dGUoKTtcbiAgICAgICAgICAgIGlmIChtWDEgPT09IG1ZMSAmJiBtWDIgPT09IG1ZMikgcmV0dXJuIGFYO1xuICAgICAgICAgICAgaWYgKGFYID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgIGlmIChhWCA9PT0gMSkgcmV0dXJuIDE7XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxjQmV6aWVyKGdldFRGb3JYKGFYKSwgbVkxLCBtWTIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGYuZ2V0Q29udHJvbFBvaW50cyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gW3sgeDogbVgxLCB5OiBtWTEgfSwgeyB4OiBtWDIsIHk6IG1ZMiB9XTsgfTtcblxuICAgICAgICB2YXIgc3RyID0gXCJnZW5lcmF0ZUJlemllcihcIiArIFttWDEsIG1ZMSwgbVgyLCBtWTJdICsgXCIpXCI7XG4gICAgICAgIGYudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBzdHI7IH07XG5cbiAgICAgICAgcmV0dXJuIGY7XG4gICAgfVxuXG4gICAgLyogUnVuZ2UtS3V0dGEgc3ByaW5nIHBoeXNpY3MgZnVuY3Rpb24gZ2VuZXJhdG9yLiBBZGFwdGVkIGZyb20gRnJhbWVyLmpzLCBjb3B5cmlnaHQgS29lbiBCb2suIE1JVCBMaWNlbnNlOiBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL01JVF9MaWNlbnNlICovXG4gICAgLyogR2l2ZW4gYSB0ZW5zaW9uLCBmcmljdGlvbiwgYW5kIGR1cmF0aW9uLCBhIHNpbXVsYXRpb24gYXQgNjBGUFMgd2lsbCBmaXJzdCBydW4gd2l0aG91dCBhIGRlZmluZWQgZHVyYXRpb24gaW4gb3JkZXIgdG8gY2FsY3VsYXRlIHRoZSBmdWxsIHBhdGguIEEgc2Vjb25kIHBhc3NcbiAgICAgICB0aGVuIGFkanVzdHMgdGhlIHRpbWUgZGVsdGEgLS0gdXNpbmcgdGhlIHJlbGF0aW9uIGJldHdlZW4gYWN0dWFsIHRpbWUgYW5kIGR1cmF0aW9uIC0tIHRvIGNhbGN1bGF0ZSB0aGUgcGF0aCBmb3IgdGhlIGR1cmF0aW9uLWNvbnN0cmFpbmVkIGFuaW1hdGlvbi4gKi9cbiAgICB2YXIgZ2VuZXJhdGVTcHJpbmdSSzQgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBzcHJpbmdBY2NlbGVyYXRpb25Gb3JTdGF0ZSAoc3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiAoLXN0YXRlLnRlbnNpb24gKiBzdGF0ZS54KSAtIChzdGF0ZS5mcmljdGlvbiAqIHN0YXRlLnYpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc3ByaW5nRXZhbHVhdGVTdGF0ZVdpdGhEZXJpdmF0aXZlIChpbml0aWFsU3RhdGUsIGR0LCBkZXJpdmF0aXZlKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSB7XG4gICAgICAgICAgICAgICAgeDogaW5pdGlhbFN0YXRlLnggKyBkZXJpdmF0aXZlLmR4ICogZHQsXG4gICAgICAgICAgICAgICAgdjogaW5pdGlhbFN0YXRlLnYgKyBkZXJpdmF0aXZlLmR2ICogZHQsXG4gICAgICAgICAgICAgICAgdGVuc2lvbjogaW5pdGlhbFN0YXRlLnRlbnNpb24sXG4gICAgICAgICAgICAgICAgZnJpY3Rpb246IGluaXRpYWxTdGF0ZS5mcmljdGlvblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIHsgZHg6IHN0YXRlLnYsIGR2OiBzcHJpbmdBY2NlbGVyYXRpb25Gb3JTdGF0ZShzdGF0ZSkgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNwcmluZ0ludGVncmF0ZVN0YXRlIChzdGF0ZSwgZHQpIHtcbiAgICAgICAgICAgIHZhciBhID0ge1xuICAgICAgICAgICAgICAgICAgICBkeDogc3RhdGUudixcbiAgICAgICAgICAgICAgICAgICAgZHY6IHNwcmluZ0FjY2VsZXJhdGlvbkZvclN0YXRlKHN0YXRlKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYiA9IHNwcmluZ0V2YWx1YXRlU3RhdGVXaXRoRGVyaXZhdGl2ZShzdGF0ZSwgZHQgKiAwLjUsIGEpLFxuICAgICAgICAgICAgICAgIGMgPSBzcHJpbmdFdmFsdWF0ZVN0YXRlV2l0aERlcml2YXRpdmUoc3RhdGUsIGR0ICogMC41LCBiKSxcbiAgICAgICAgICAgICAgICBkID0gc3ByaW5nRXZhbHVhdGVTdGF0ZVdpdGhEZXJpdmF0aXZlKHN0YXRlLCBkdCwgYyksXG4gICAgICAgICAgICAgICAgZHhkdCA9IDEuMCAvIDYuMCAqIChhLmR4ICsgMi4wICogKGIuZHggKyBjLmR4KSArIGQuZHgpLFxuICAgICAgICAgICAgICAgIGR2ZHQgPSAxLjAgLyA2LjAgKiAoYS5kdiArIDIuMCAqIChiLmR2ICsgYy5kdikgKyBkLmR2KTtcblxuICAgICAgICAgICAgc3RhdGUueCA9IHN0YXRlLnggKyBkeGR0ICogZHQ7XG4gICAgICAgICAgICBzdGF0ZS52ID0gc3RhdGUudiArIGR2ZHQgKiBkdDtcblxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHNwcmluZ1JLNEZhY3RvcnkgKHRlbnNpb24sIGZyaWN0aW9uLCBkdXJhdGlvbikge1xuXG4gICAgICAgICAgICB2YXIgaW5pdFN0YXRlID0ge1xuICAgICAgICAgICAgICAgICAgICB4OiAtMSxcbiAgICAgICAgICAgICAgICAgICAgdjogMCxcbiAgICAgICAgICAgICAgICAgICAgdGVuc2lvbjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgZnJpY3Rpb246IG51bGxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHBhdGggPSBbMF0sXG4gICAgICAgICAgICAgICAgdGltZV9sYXBzZWQgPSAwLFxuICAgICAgICAgICAgICAgIHRvbGVyYW5jZSA9IDEgLyAxMDAwMCxcbiAgICAgICAgICAgICAgICBEVCA9IDE2IC8gMTAwMCxcbiAgICAgICAgICAgICAgICBoYXZlX2R1cmF0aW9uLCBkdCwgbGFzdF9zdGF0ZTtcblxuICAgICAgICAgICAgdGVuc2lvbiA9IHBhcnNlRmxvYXQodGVuc2lvbikgfHwgNTAwO1xuICAgICAgICAgICAgZnJpY3Rpb24gPSBwYXJzZUZsb2F0KGZyaWN0aW9uKSB8fCAyMDtcbiAgICAgICAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24gfHwgbnVsbDtcblxuICAgICAgICAgICAgaW5pdFN0YXRlLnRlbnNpb24gPSB0ZW5zaW9uO1xuICAgICAgICAgICAgaW5pdFN0YXRlLmZyaWN0aW9uID0gZnJpY3Rpb247XG5cbiAgICAgICAgICAgIGhhdmVfZHVyYXRpb24gPSBkdXJhdGlvbiAhPT0gbnVsbDtcblxuICAgICAgICAgICAgLyogQ2FsY3VsYXRlIHRoZSBhY3R1YWwgdGltZSBpdCB0YWtlcyBmb3IgdGhpcyBhbmltYXRpb24gdG8gY29tcGxldGUgd2l0aCB0aGUgcHJvdmlkZWQgY29uZGl0aW9ucy4gKi9cbiAgICAgICAgICAgIGlmIChoYXZlX2R1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgLyogUnVuIHRoZSBzaW11bGF0aW9uIHdpdGhvdXQgYSBkdXJhdGlvbi4gKi9cbiAgICAgICAgICAgICAgICB0aW1lX2xhcHNlZCA9IHNwcmluZ1JLNEZhY3RvcnkodGVuc2lvbiwgZnJpY3Rpb24pO1xuICAgICAgICAgICAgICAgIC8qIENvbXB1dGUgdGhlIGFkanVzdGVkIHRpbWUgZGVsdGEuICovXG4gICAgICAgICAgICAgICAgZHQgPSB0aW1lX2xhcHNlZCAvIGR1cmF0aW9uICogRFQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGR0ID0gRFQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgICAgLyogTmV4dC9zdGVwIGZ1bmN0aW9uIC4qL1xuICAgICAgICAgICAgICAgIGxhc3Rfc3RhdGUgPSBzcHJpbmdJbnRlZ3JhdGVTdGF0ZShsYXN0X3N0YXRlIHx8IGluaXRTdGF0ZSwgZHQpO1xuICAgICAgICAgICAgICAgIC8qIFN0b3JlIHRoZSBwb3NpdGlvbi4gKi9cbiAgICAgICAgICAgICAgICBwYXRoLnB1c2goMSArIGxhc3Rfc3RhdGUueCk7XG4gICAgICAgICAgICAgICAgdGltZV9sYXBzZWQgKz0gMTY7XG4gICAgICAgICAgICAgICAgLyogSWYgdGhlIGNoYW5nZSB0aHJlc2hvbGQgaXMgcmVhY2hlZCwgYnJlYWsuICovXG4gICAgICAgICAgICAgICAgaWYgKCEoTWF0aC5hYnMobGFzdF9zdGF0ZS54KSA+IHRvbGVyYW5jZSAmJiBNYXRoLmFicyhsYXN0X3N0YXRlLnYpID4gdG9sZXJhbmNlKSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIElmIGR1cmF0aW9uIGlzIG5vdCBkZWZpbmVkLCByZXR1cm4gdGhlIGFjdHVhbCB0aW1lIHJlcXVpcmVkIGZvciBjb21wbGV0aW5nIHRoaXMgYW5pbWF0aW9uLiBPdGhlcndpc2UsIHJldHVybiBhIGNsb3N1cmUgdGhhdCBob2xkcyB0aGVcbiAgICAgICAgICAgICAgIGNvbXB1dGVkIHBhdGggYW5kIHJldHVybnMgYSBzbmFwc2hvdCBvZiB0aGUgcG9zaXRpb24gYWNjb3JkaW5nIHRvIGEgZ2l2ZW4gcGVyY2VudENvbXBsZXRlLiAqL1xuICAgICAgICAgICAgcmV0dXJuICFoYXZlX2R1cmF0aW9uID8gdGltZV9sYXBzZWQgOiBmdW5jdGlvbihwZXJjZW50Q29tcGxldGUpIHsgcmV0dXJuIHBhdGhbIChwZXJjZW50Q29tcGxldGUgKiAocGF0aC5sZW5ndGggLSAxKSkgfCAwIF07IH07XG4gICAgICAgIH07XG4gICAgfSgpKTtcblxuICAgIC8qIGpRdWVyeSBlYXNpbmdzLiAqL1xuICAgIFZlbG9jaXR5LkVhc2luZ3MgPSB7XG4gICAgICAgIGxpbmVhcjogZnVuY3Rpb24ocCkgeyByZXR1cm4gcDsgfSxcbiAgICAgICAgc3dpbmc6IGZ1bmN0aW9uKHApIHsgcmV0dXJuIDAuNSAtIE1hdGguY29zKCBwICogTWF0aC5QSSApIC8gMiB9LFxuICAgICAgICAvKiBCb251cyBcInNwcmluZ1wiIGVhc2luZywgd2hpY2ggaXMgYSBsZXNzIGV4YWdnZXJhdGVkIHZlcnNpb24gb2YgZWFzZUluT3V0RWxhc3RpYy4gKi9cbiAgICAgICAgc3ByaW5nOiBmdW5jdGlvbihwKSB7IHJldHVybiAxIC0gKE1hdGguY29zKHAgKiA0LjUgKiBNYXRoLlBJKSAqIE1hdGguZXhwKC1wICogNikpOyB9XG4gICAgfTtcblxuICAgIC8qIENTUzMgYW5kIFJvYmVydCBQZW5uZXIgZWFzaW5ncy4gKi9cbiAgICAkLmVhY2goXG4gICAgICAgIFtcbiAgICAgICAgICAgIFsgXCJlYXNlXCIsIFsgMC4yNSwgMC4xLCAwLjI1LCAxLjAgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2UtaW5cIiwgWyAwLjQyLCAwLjAsIDEuMDAsIDEuMCBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZS1vdXRcIiwgWyAwLjAwLCAwLjAsIDAuNTgsIDEuMCBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZS1pbi1vdXRcIiwgWyAwLjQyLCAwLjAsIDAuNTgsIDEuMCBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluU2luZVwiLCBbIDAuNDcsIDAsIDAuNzQ1LCAwLjcxNSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZU91dFNpbmVcIiwgWyAwLjM5LCAwLjU3NSwgMC41NjUsIDEgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJbk91dFNpbmVcIiwgWyAwLjQ0NSwgMC4wNSwgMC41NSwgMC45NSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluUXVhZFwiLCBbIDAuNTUsIDAuMDg1LCAwLjY4LCAwLjUzIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlT3V0UXVhZFwiLCBbIDAuMjUsIDAuNDYsIDAuNDUsIDAuOTQgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJbk91dFF1YWRcIiwgWyAwLjQ1NSwgMC4wMywgMC41MTUsIDAuOTU1IF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlSW5DdWJpY1wiLCBbIDAuNTUsIDAuMDU1LCAwLjY3NSwgMC4xOSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZU91dEN1YmljXCIsIFsgMC4yMTUsIDAuNjEsIDAuMzU1LCAxIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRDdWJpY1wiLCBbIDAuNjQ1LCAwLjA0NSwgMC4zNTUsIDEgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJblF1YXJ0XCIsIFsgMC44OTUsIDAuMDMsIDAuNjg1LCAwLjIyIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlT3V0UXVhcnRcIiwgWyAwLjE2NSwgMC44NCwgMC40NCwgMSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluT3V0UXVhcnRcIiwgWyAwLjc3LCAwLCAwLjE3NSwgMSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluUXVpbnRcIiwgWyAwLjc1NSwgMC4wNSwgMC44NTUsIDAuMDYgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VPdXRRdWludFwiLCBbIDAuMjMsIDEsIDAuMzIsIDEgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJbk91dFF1aW50XCIsIFsgMC44NiwgMCwgMC4wNywgMSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluRXhwb1wiLCBbIDAuOTUsIDAuMDUsIDAuNzk1LCAwLjAzNSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZU91dEV4cG9cIiwgWyAwLjE5LCAxLCAwLjIyLCAxIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRFeHBvXCIsIFsgMSwgMCwgMCwgMSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluQ2lyY1wiLCBbIDAuNiwgMC4wNCwgMC45OCwgMC4zMzUgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VPdXRDaXJjXCIsIFsgMC4wNzUsIDAuODIsIDAuMTY1LCAxIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRDaXJjXCIsIFsgMC43ODUsIDAuMTM1LCAwLjE1LCAwLjg2IF0gXVxuICAgICAgICBdLCBmdW5jdGlvbihpLCBlYXNpbmdBcnJheSkge1xuICAgICAgICAgICAgVmVsb2NpdHkuRWFzaW5nc1tlYXNpbmdBcnJheVswXV0gPSBnZW5lcmF0ZUJlemllci5hcHBseShudWxsLCBlYXNpbmdBcnJheVsxXSk7XG4gICAgICAgIH0pO1xuXG4gICAgLyogRGV0ZXJtaW5lIHRoZSBhcHByb3ByaWF0ZSBlYXNpbmcgdHlwZSBnaXZlbiBhbiBlYXNpbmcgaW5wdXQuICovXG4gICAgZnVuY3Rpb24gZ2V0RWFzaW5nKHZhbHVlLCBkdXJhdGlvbikge1xuICAgICAgICB2YXIgZWFzaW5nID0gdmFsdWU7XG5cbiAgICAgICAgLyogVGhlIGVhc2luZyBvcHRpb24gY2FuIGVpdGhlciBiZSBhIHN0cmluZyB0aGF0IHJlZmVyZW5jZXMgYSBwcmUtcmVnaXN0ZXJlZCBlYXNpbmcsXG4gICAgICAgICAgIG9yIGl0IGNhbiBiZSBhIHR3by0vZm91ci1pdGVtIGFycmF5IG9mIGludGVnZXJzIHRvIGJlIGNvbnZlcnRlZCBpbnRvIGEgYmV6aWVyL3NwcmluZyBmdW5jdGlvbi4gKi9cbiAgICAgICAgaWYgKFR5cGUuaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgICAgICAgICAvKiBFbnN1cmUgdGhhdCB0aGUgZWFzaW5nIGhhcyBiZWVuIGFzc2lnbmVkIHRvIGpRdWVyeSdzIFZlbG9jaXR5LkVhc2luZ3Mgb2JqZWN0LiAqL1xuICAgICAgICAgICAgaWYgKCFWZWxvY2l0eS5FYXNpbmdzW3ZhbHVlXSkge1xuICAgICAgICAgICAgICAgIGVhc2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBlYXNpbmcgPSBnZW5lcmF0ZVN0ZXAuYXBwbHkobnVsbCwgdmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAvKiBzcHJpbmdSSzQgbXVzdCBiZSBwYXNzZWQgdGhlIGFuaW1hdGlvbidzIGR1cmF0aW9uLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogSWYgdGhlIHNwcmluZ1JLNCBhcnJheSBjb250YWlucyBub24tbnVtYmVycywgZ2VuZXJhdGVTcHJpbmdSSzQoKSByZXR1cm5zIGFuIGVhc2luZ1xuICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2VuZXJhdGVkIHdpdGggZGVmYXVsdCB0ZW5zaW9uIGFuZCBmcmljdGlvbiB2YWx1ZXMuICovXG4gICAgICAgICAgICBlYXNpbmcgPSBnZW5lcmF0ZVNwcmluZ1JLNC5hcHBseShudWxsLCB2YWx1ZS5jb25jYXQoWyBkdXJhdGlvbiBdKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgIC8qIE5vdGU6IElmIHRoZSBiZXppZXIgYXJyYXkgY29udGFpbnMgbm9uLW51bWJlcnMsIGdlbmVyYXRlQmV6aWVyKCkgcmV0dXJucyBmYWxzZS4gKi9cbiAgICAgICAgICAgIGVhc2luZyA9IGdlbmVyYXRlQmV6aWVyLmFwcGx5KG51bGwsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVhc2luZyA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogUmV2ZXJ0IHRvIHRoZSBWZWxvY2l0eS13aWRlIGRlZmF1bHQgZWFzaW5nIHR5cGUsIG9yIGZhbGwgYmFjayB0byBcInN3aW5nXCIgKHdoaWNoIGlzIGFsc28galF1ZXJ5J3MgZGVmYXVsdClcbiAgICAgICAgICAgaWYgdGhlIFZlbG9jaXR5LXdpZGUgZGVmYXVsdCBoYXMgYmVlbiBpbmNvcnJlY3RseSBtb2RpZmllZC4gKi9cbiAgICAgICAgaWYgKGVhc2luZyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGlmIChWZWxvY2l0eS5FYXNpbmdzW1ZlbG9jaXR5LmRlZmF1bHRzLmVhc2luZ10pIHtcbiAgICAgICAgICAgICAgICBlYXNpbmcgPSBWZWxvY2l0eS5kZWZhdWx0cy5lYXNpbmc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVhc2luZyA9IEVBU0lOR19ERUZBVUxUO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVhc2luZztcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ1NTIFN0YWNrXG4gICAgKioqKioqKioqKioqKioqKiovXG5cbiAgICAvKiBUaGUgQ1NTIG9iamVjdCBpcyBhIGhpZ2hseSBjb25kZW5zZWQgYW5kIHBlcmZvcm1hbnQgQ1NTIHN0YWNrIHRoYXQgZnVsbHkgcmVwbGFjZXMgalF1ZXJ5J3MuXG4gICAgICAgSXQgaGFuZGxlcyB0aGUgdmFsaWRhdGlvbiwgZ2V0dGluZywgYW5kIHNldHRpbmcgb2YgYm90aCBzdGFuZGFyZCBDU1MgcHJvcGVydGllcyBhbmQgQ1NTIHByb3BlcnR5IGhvb2tzLiAqL1xuICAgIC8qIE5vdGU6IEEgXCJDU1NcIiBzaG9ydGhhbmQgaXMgYWxpYXNlZCBzbyB0aGF0IG91ciBjb2RlIGlzIGVhc2llciB0byByZWFkLiAqL1xuICAgIHZhciBDU1MgPSBWZWxvY2l0eS5DU1MgPSB7XG5cbiAgICAgICAgLyoqKioqKioqKioqKipcbiAgICAgICAgICAgIFJlZ0V4XG4gICAgICAgICoqKioqKioqKioqKiovXG5cbiAgICAgICAgUmVnRXg6IHtcbiAgICAgICAgICAgIGlzSGV4OiAvXiMoW0EtZlxcZF17M30pezEsMn0kL2ksXG4gICAgICAgICAgICAvKiBVbndyYXAgYSBwcm9wZXJ0eSB2YWx1ZSdzIHN1cnJvdW5kaW5nIHRleHQsIGUuZy4gXCJyZ2JhKDQsIDMsIDIsIDEpXCIgPT0+IFwiNCwgMywgMiwgMVwiIGFuZCBcInJlY3QoNHB4IDNweCAycHggMXB4KVwiID09PiBcIjRweCAzcHggMnB4IDFweFwiLiAqL1xuICAgICAgICAgICAgdmFsdWVVbndyYXA6IC9eW0Etel0rXFwoKC4qKVxcKSQvaSxcbiAgICAgICAgICAgIHdyYXBwZWRWYWx1ZUFscmVhZHlFeHRyYWN0ZWQ6IC9bMC05Ll0rIFswLTkuXSsgWzAtOS5dKyggWzAtOS5dKyk/LyxcbiAgICAgICAgICAgIC8qIFNwbGl0IGEgbXVsdGktdmFsdWUgcHJvcGVydHkgaW50byBhbiBhcnJheSBvZiBzdWJ2YWx1ZXMsIGUuZy4gXCJyZ2JhKDQsIDMsIDIsIDEpIDRweCAzcHggMnB4IDFweFwiID09PiBbIFwicmdiYSg0LCAzLCAyLCAxKVwiLCBcIjRweFwiLCBcIjNweFwiLCBcIjJweFwiLCBcIjFweFwiIF0uICovXG4gICAgICAgICAgICB2YWx1ZVNwbGl0OiAvKFtBLXpdK1xcKC4rXFwpKXwoKFtBLXowLTkjLS5dKz8pKD89XFxzfCQpKS9pZ1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKioqKioqKioqKipcbiAgICAgICAgICAgIExpc3RzXG4gICAgICAgICoqKioqKioqKioqKi9cblxuICAgICAgICBMaXN0czoge1xuICAgICAgICAgICAgY29sb3JzOiBbIFwiZmlsbFwiLCBcInN0cm9rZVwiLCBcInN0b3BDb2xvclwiLCBcImNvbG9yXCIsIFwiYmFja2dyb3VuZENvbG9yXCIsIFwiYm9yZGVyQ29sb3JcIiwgXCJib3JkZXJUb3BDb2xvclwiLCBcImJvcmRlclJpZ2h0Q29sb3JcIiwgXCJib3JkZXJCb3R0b21Db2xvclwiLCBcImJvcmRlckxlZnRDb2xvclwiLCBcIm91dGxpbmVDb2xvclwiIF0sXG4gICAgICAgICAgICB0cmFuc2Zvcm1zQmFzZTogWyBcInRyYW5zbGF0ZVhcIiwgXCJ0cmFuc2xhdGVZXCIsIFwic2NhbGVcIiwgXCJzY2FsZVhcIiwgXCJzY2FsZVlcIiwgXCJza2V3WFwiLCBcInNrZXdZXCIsIFwicm90YXRlWlwiIF0sXG4gICAgICAgICAgICB0cmFuc2Zvcm1zM0Q6IFsgXCJ0cmFuc2Zvcm1QZXJzcGVjdGl2ZVwiLCBcInRyYW5zbGF0ZVpcIiwgXCJzY2FsZVpcIiwgXCJyb3RhdGVYXCIsIFwicm90YXRlWVwiIF1cbiAgICAgICAgfSxcblxuICAgICAgICAvKioqKioqKioqKioqXG4gICAgICAgICAgICBIb29rc1xuICAgICAgICAqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogSG9va3MgYWxsb3cgYSBzdWJwcm9wZXJ0eSAoZS5nLiBcImJveFNoYWRvd0JsdXJcIikgb2YgYSBjb21wb3VuZC12YWx1ZSBDU1MgcHJvcGVydHlcbiAgICAgICAgICAgKGUuZy4gXCJib3hTaGFkb3c6IFggWSBCbHVyIFNwcmVhZCBDb2xvclwiKSB0byBiZSBhbmltYXRlZCBhcyBpZiBpdCB3ZXJlIGEgZGlzY3JldGUgcHJvcGVydHkuICovXG4gICAgICAgIC8qIE5vdGU6IEJleW9uZCBlbmFibGluZyBmaW5lLWdyYWluZWQgcHJvcGVydHkgYW5pbWF0aW9uLCBob29raW5nIGlzIG5lY2Vzc2FyeSBzaW5jZSBWZWxvY2l0eSBvbmx5XG4gICAgICAgICAgIHR3ZWVucyBwcm9wZXJ0aWVzIHdpdGggc2luZ2xlIG51bWVyaWMgdmFsdWVzOyB1bmxpa2UgQ1NTIHRyYW5zaXRpb25zLCBWZWxvY2l0eSBkb2VzIG5vdCBpbnRlcnBvbGF0ZSBjb21wb3VuZC12YWx1ZXMuICovXG4gICAgICAgIEhvb2tzOiB7XG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICBSZWdpc3RyYXRpb25cbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAvKiBUZW1wbGF0ZXMgYXJlIGEgY29uY2lzZSB3YXkgb2YgaW5kaWNhdGluZyB3aGljaCBzdWJwcm9wZXJ0aWVzIG11c3QgYmUgaW5kaXZpZHVhbGx5IHJlZ2lzdGVyZWQgZm9yIGVhY2ggY29tcG91bmQtdmFsdWUgQ1NTIHByb3BlcnR5LiAqL1xuICAgICAgICAgICAgLyogRWFjaCB0ZW1wbGF0ZSBjb25zaXN0cyBvZiB0aGUgY29tcG91bmQtdmFsdWUncyBiYXNlIG5hbWUsIGl0cyBjb25zdGl0dWVudCBzdWJwcm9wZXJ0eSBuYW1lcywgYW5kIHRob3NlIHN1YnByb3BlcnRpZXMnIGRlZmF1bHQgdmFsdWVzLiAqL1xuICAgICAgICAgICAgdGVtcGxhdGVzOiB7XG4gICAgICAgICAgICAgICAgXCJ0ZXh0U2hhZG93XCI6IFsgXCJDb2xvciBYIFkgQmx1clwiLCBcImJsYWNrIDBweCAwcHggMHB4XCIgXSxcbiAgICAgICAgICAgICAgICBcImJveFNoYWRvd1wiOiBbIFwiQ29sb3IgWCBZIEJsdXIgU3ByZWFkXCIsIFwiYmxhY2sgMHB4IDBweCAwcHggMHB4XCIgXSxcbiAgICAgICAgICAgICAgICBcImNsaXBcIjogWyBcIlRvcCBSaWdodCBCb3R0b20gTGVmdFwiLCBcIjBweCAwcHggMHB4IDBweFwiIF0sXG4gICAgICAgICAgICAgICAgXCJiYWNrZ3JvdW5kUG9zaXRpb25cIjogWyBcIlggWVwiLCBcIjAlIDAlXCIgXSxcbiAgICAgICAgICAgICAgICBcInRyYW5zZm9ybU9yaWdpblwiOiBbIFwiWCBZIFpcIiwgXCI1MCUgNTAlIDBweFwiIF0sXG4gICAgICAgICAgICAgICAgXCJwZXJzcGVjdGl2ZU9yaWdpblwiOiBbIFwiWCBZXCIsIFwiNTAlIDUwJVwiIF1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qIEEgXCJyZWdpc3RlcmVkXCIgaG9vayBpcyBvbmUgdGhhdCBoYXMgYmVlbiBjb252ZXJ0ZWQgZnJvbSBpdHMgdGVtcGxhdGUgZm9ybSBpbnRvIGEgbGl2ZSxcbiAgICAgICAgICAgICAgIHR3ZWVuYWJsZSBwcm9wZXJ0eS4gSXQgY29udGFpbnMgZGF0YSB0byBhc3NvY2lhdGUgaXQgd2l0aCBpdHMgcm9vdCBwcm9wZXJ0eS4gKi9cbiAgICAgICAgICAgIHJlZ2lzdGVyZWQ6IHtcbiAgICAgICAgICAgICAgICAvKiBOb3RlOiBBIHJlZ2lzdGVyZWQgaG9vayBsb29rcyBsaWtlIHRoaXMgPT0+IHRleHRTaGFkb3dCbHVyOiBbIFwidGV4dFNoYWRvd1wiLCAzIF0sXG4gICAgICAgICAgICAgICAgICAgd2hpY2ggY29uc2lzdHMgb2YgdGhlIHN1YnByb3BlcnR5J3MgbmFtZSwgdGhlIGFzc29jaWF0ZWQgcm9vdCBwcm9wZXJ0eSdzIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgYW5kIHRoZSBzdWJwcm9wZXJ0eSdzIHBvc2l0aW9uIGluIHRoZSByb290J3MgdmFsdWUuICovXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyogQ29udmVydCB0aGUgdGVtcGxhdGVzIGludG8gaW5kaXZpZHVhbCBob29rcyB0aGVuIGFwcGVuZCB0aGVtIHRvIHRoZSByZWdpc3RlcmVkIG9iamVjdCBhYm92ZS4gKi9cbiAgICAgICAgICAgIHJlZ2lzdGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLyogQ29sb3IgaG9va3MgcmVnaXN0cmF0aW9uOiBDb2xvcnMgYXJlIGRlZmF1bHRlZCB0byB3aGl0ZSAtLSBhcyBvcHBvc2VkIHRvIGJsYWNrIC0tIHNpbmNlIGNvbG9ycyB0aGF0IGFyZVxuICAgICAgICAgICAgICAgICAgIGN1cnJlbnRseSBzZXQgdG8gXCJ0cmFuc3BhcmVudFwiIGRlZmF1bHQgdG8gdGhlaXIgcmVzcGVjdGl2ZSB0ZW1wbGF0ZSBiZWxvdyB3aGVuIGNvbG9yLWFuaW1hdGVkLFxuICAgICAgICAgICAgICAgICAgIGFuZCB3aGl0ZSBpcyB0eXBpY2FsbHkgYSBjbG9zZXIgbWF0Y2ggdG8gdHJhbnNwYXJlbnQgdGhhbiBibGFjayBpcy4gQW4gZXhjZXB0aW9uIGlzIG1hZGUgZm9yIHRleHQgKFwiY29sb3JcIiksXG4gICAgICAgICAgICAgICAgICAgd2hpY2ggaXMgYWxtb3N0IGFsd2F5cyBzZXQgY2xvc2VyIHRvIGJsYWNrIHRoYW4gd2hpdGUuICovXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBDU1MuTGlzdHMuY29sb3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZ2JDb21wb25lbnRzID0gKENTUy5MaXN0cy5jb2xvcnNbaV0gPT09IFwiY29sb3JcIikgPyBcIjAgMCAwIDFcIiA6IFwiMjU1IDI1NSAyNTUgMVwiO1xuICAgICAgICAgICAgICAgICAgICBDU1MuSG9va3MudGVtcGxhdGVzW0NTUy5MaXN0cy5jb2xvcnNbaV1dID0gWyBcIlJlZCBHcmVlbiBCbHVlIEFscGhhXCIsIHJnYkNvbXBvbmVudHMgXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgcm9vdFByb3BlcnR5LFxuICAgICAgICAgICAgICAgICAgICBob29rVGVtcGxhdGUsXG4gICAgICAgICAgICAgICAgICAgIGhvb2tOYW1lcztcblxuICAgICAgICAgICAgICAgIC8qIEluIElFLCBjb2xvciB2YWx1ZXMgaW5zaWRlIGNvbXBvdW5kLXZhbHVlIHByb3BlcnRpZXMgYXJlIHBvc2l0aW9uZWQgYXQgdGhlIGVuZCB0aGUgdmFsdWUgaW5zdGVhZCBvZiBhdCB0aGUgYmVnaW5uaW5nLlxuICAgICAgICAgICAgICAgICAgIFRodXMsIHdlIHJlLWFycmFuZ2UgdGhlIHRlbXBsYXRlcyBhY2NvcmRpbmdseS4gKi9cbiAgICAgICAgICAgICAgICBpZiAoSUUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChyb290UHJvcGVydHkgaW4gQ1NTLkhvb2tzLnRlbXBsYXRlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaG9va1RlbXBsYXRlID0gQ1NTLkhvb2tzLnRlbXBsYXRlc1tyb290UHJvcGVydHldO1xuICAgICAgICAgICAgICAgICAgICAgICAgaG9va05hbWVzID0gaG9va1RlbXBsYXRlWzBdLnNwbGl0KFwiIFwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlZmF1bHRWYWx1ZXMgPSBob29rVGVtcGxhdGVbMV0ubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlU3BsaXQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaG9va05hbWVzWzBdID09PSBcIkNvbG9yXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBSZXBvc2l0aW9uIGJvdGggdGhlIGhvb2sncyBuYW1lIGFuZCBpdHMgZGVmYXVsdCB2YWx1ZSB0byB0aGUgZW5kIG9mIHRoZWlyIHJlc3BlY3RpdmUgc3RyaW5ncy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob29rTmFtZXMucHVzaChob29rTmFtZXMuc2hpZnQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlcy5wdXNoKGRlZmF1bHRWYWx1ZXMuc2hpZnQoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBSZXBsYWNlIHRoZSBleGlzdGluZyB0ZW1wbGF0ZSBmb3IgdGhlIGhvb2sncyByb290IHByb3BlcnR5LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XSA9IFsgaG9va05hbWVzLmpvaW4oXCIgXCIpLCBkZWZhdWx0VmFsdWVzLmpvaW4oXCIgXCIpIF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBIb29rIHJlZ2lzdHJhdGlvbi4gKi9cbiAgICAgICAgICAgICAgICBmb3IgKHJvb3RQcm9wZXJ0eSBpbiBDU1MuSG9va3MudGVtcGxhdGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGhvb2tUZW1wbGF0ZSA9IENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgaG9va05hbWVzID0gaG9va1RlbXBsYXRlWzBdLnNwbGl0KFwiIFwiKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIGhvb2tOYW1lcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZ1bGxIb29rTmFtZSA9IHJvb3RQcm9wZXJ0eSArIGhvb2tOYW1lc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob29rUG9zaXRpb24gPSBpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBGb3IgZWFjaCBob29rLCByZWdpc3RlciBpdHMgZnVsbCBuYW1lIChlLmcuIHRleHRTaGFkb3dCbHVyKSB3aXRoIGl0cyByb290IHByb3BlcnR5IChlLmcuIHRleHRTaGFkb3cpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBhbmQgdGhlIGhvb2sncyBwb3NpdGlvbiBpbiBpdHMgdGVtcGxhdGUncyBkZWZhdWx0IHZhbHVlIHN0cmluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIENTUy5Ib29rcy5yZWdpc3RlcmVkW2Z1bGxIb29rTmFtZV0gPSBbIHJvb3RQcm9wZXJ0eSwgaG9va1Bvc2l0aW9uIF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIEluamVjdGlvbiBhbmQgRXh0cmFjdGlvblxuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIExvb2sgdXAgdGhlIHJvb3QgcHJvcGVydHkgYXNzb2NpYXRlZCB3aXRoIHRoZSBob29rIChlLmcuIHJldHVybiBcInRleHRTaGFkb3dcIiBmb3IgXCJ0ZXh0U2hhZG93Qmx1clwiKS4gKi9cbiAgICAgICAgICAgIC8qIFNpbmNlIGEgaG9vayBjYW5ub3QgYmUgc2V0IGRpcmVjdGx5ICh0aGUgYnJvd3NlciB3b24ndCByZWNvZ25pemUgaXQpLCBzdHlsZSB1cGRhdGluZyBmb3IgaG9va3MgaXMgcm91dGVkIHRocm91Z2ggdGhlIGhvb2sncyByb290IHByb3BlcnR5LiAqL1xuICAgICAgICAgICAgZ2V0Um9vdDogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgdmFyIGhvb2tEYXRhID0gQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldO1xuXG4gICAgICAgICAgICAgICAgaWYgKGhvb2tEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBob29rRGF0YVswXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGVyZSB3YXMgbm8gaG9vayBtYXRjaCwgcmV0dXJuIHRoZSBwcm9wZXJ0eSBuYW1lIHVudG91Y2hlZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKiBDb252ZXJ0IGFueSByb290UHJvcGVydHlWYWx1ZSwgbnVsbCBvciBvdGhlcndpc2UsIGludG8gYSBzcGFjZS1kZWxpbWl0ZWQgbGlzdCBvZiBob29rIHZhbHVlcyBzbyB0aGF0XG4gICAgICAgICAgICAgICB0aGUgdGFyZ2V0ZWQgaG9vayBjYW4gYmUgaW5qZWN0ZWQgb3IgZXh0cmFjdGVkIGF0IGl0cyBzdGFuZGFyZCBwb3NpdGlvbi4gKi9cbiAgICAgICAgICAgIGNsZWFuUm9vdFByb3BlcnR5VmFsdWU6IGZ1bmN0aW9uKHJvb3RQcm9wZXJ0eSwgcm9vdFByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAvKiBJZiB0aGUgcm9vdFByb3BlcnR5VmFsdWUgaXMgd3JhcHBlZCB3aXRoIFwicmdiKClcIiwgXCJjbGlwKClcIiwgZXRjLiwgcmVtb3ZlIHRoZSB3cmFwcGluZyB0byBub3JtYWxpemUgdGhlIHZhbHVlIGJlZm9yZSBtYW5pcHVsYXRpb24uICovXG4gICAgICAgICAgICAgICAgaWYgKENTUy5SZWdFeC52YWx1ZVVud3JhcC50ZXN0KHJvb3RQcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IHJvb3RQcm9wZXJ0eVZhbHVlLm1hdGNoKENTUy5SZWdFeC52YWx1ZVVud3JhcClbMV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogSWYgcm9vdFByb3BlcnR5VmFsdWUgaXMgYSBDU1MgbnVsbC12YWx1ZSAoZnJvbSB3aGljaCB0aGVyZSdzIGluaGVyZW50bHkgbm8gaG9vayB2YWx1ZSB0byBleHRyYWN0KSxcbiAgICAgICAgICAgICAgICAgICBkZWZhdWx0IHRvIHRoZSByb290J3MgZGVmYXVsdCB2YWx1ZSBhcyBkZWZpbmVkIGluIENTUy5Ib29rcy50ZW1wbGF0ZXMuICovXG4gICAgICAgICAgICAgICAgLyogTm90ZTogQ1NTIG51bGwtdmFsdWVzIGluY2x1ZGUgXCJub25lXCIsIFwiYXV0b1wiLCBhbmQgXCJ0cmFuc3BhcmVudFwiLiBUaGV5IG11c3QgYmUgY29udmVydGVkIGludG8gdGhlaXJcbiAgICAgICAgICAgICAgICAgICB6ZXJvLXZhbHVlcyAoZS5nLiB0ZXh0U2hhZG93OiBcIm5vbmVcIiA9PT4gdGV4dFNoYWRvdzogXCIwcHggMHB4IDBweCBibGFja1wiKSBmb3IgaG9vayBtYW5pcHVsYXRpb24gdG8gcHJvY2VlZC4gKi9cbiAgICAgICAgICAgICAgICBpZiAoQ1NTLlZhbHVlcy5pc0NTU051bGxWYWx1ZShyb290UHJvcGVydHlWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBDU1MuSG9va3MudGVtcGxhdGVzW3Jvb3RQcm9wZXJ0eV1bMV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvb3RQcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qIEV4dHJhY3RlZCB0aGUgaG9vaydzIHZhbHVlIGZyb20gaXRzIHJvb3QgcHJvcGVydHkncyB2YWx1ZS4gVGhpcyBpcyB1c2VkIHRvIGdldCB0aGUgc3RhcnRpbmcgdmFsdWUgb2YgYW4gYW5pbWF0aW5nIGhvb2suICovXG4gICAgICAgICAgICBleHRyYWN0VmFsdWU6IGZ1bmN0aW9uIChmdWxsSG9va05hbWUsIHJvb3RQcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhvb2tEYXRhID0gQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbZnVsbEhvb2tOYW1lXTtcblxuICAgICAgICAgICAgICAgIGlmIChob29rRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaG9va1Jvb3QgPSBob29rRGF0YVswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tQb3NpdGlvbiA9IGhvb2tEYXRhWzFdO1xuXG4gICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLmNsZWFuUm9vdFByb3BlcnR5VmFsdWUoaG9va1Jvb3QsIHJvb3RQcm9wZXJ0eVZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBTcGxpdCByb290UHJvcGVydHlWYWx1ZSBpbnRvIGl0cyBjb25zdGl0dWVudCBob29rIHZhbHVlcyB0aGVuIGdyYWIgdGhlIGRlc2lyZWQgaG9vayBhdCBpdHMgc3RhbmRhcmQgcG9zaXRpb24uICovXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByb290UHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKENTUy5SZWdFeC52YWx1ZVNwbGl0KVtob29rUG9zaXRpb25dO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBwcm92aWRlZCBmdWxsSG9va05hbWUgaXNuJ3QgYSByZWdpc3RlcmVkIGhvb2ssIHJldHVybiB0aGUgcm9vdFByb3BlcnR5VmFsdWUgdGhhdCB3YXMgcGFzc2VkIGluLiAqL1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFByb3BlcnR5VmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qIEluamVjdCB0aGUgaG9vaydzIHZhbHVlIGludG8gaXRzIHJvb3QgcHJvcGVydHkncyB2YWx1ZS4gVGhpcyBpcyB1c2VkIHRvIHBpZWNlIGJhY2sgdG9nZXRoZXIgdGhlIHJvb3QgcHJvcGVydHlcbiAgICAgICAgICAgICAgIG9uY2UgVmVsb2NpdHkgaGFzIHVwZGF0ZWQgb25lIG9mIGl0cyBpbmRpdmlkdWFsbHkgaG9va2VkIHZhbHVlcyB0aHJvdWdoIHR3ZWVuaW5nLiAqL1xuICAgICAgICAgICAgaW5qZWN0VmFsdWU6IGZ1bmN0aW9uIChmdWxsSG9va05hbWUsIGhvb2tWYWx1ZSwgcm9vdFByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgaG9va0RhdGEgPSBDU1MuSG9va3MucmVnaXN0ZXJlZFtmdWxsSG9va05hbWVdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGhvb2tEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBob29rUm9vdCA9IGhvb2tEYXRhWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgaG9va1Bvc2l0aW9uID0gaG9va0RhdGFbMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZVBhcnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVVcGRhdGVkO1xuXG4gICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLmNsZWFuUm9vdFByb3BlcnR5VmFsdWUoaG9va1Jvb3QsIHJvb3RQcm9wZXJ0eVZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBTcGxpdCByb290UHJvcGVydHlWYWx1ZSBpbnRvIGl0cyBpbmRpdmlkdWFsIGhvb2sgdmFsdWVzLCByZXBsYWNlIHRoZSB0YXJnZXRlZCB2YWx1ZSB3aXRoIGhvb2tWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZWNvbnN0cnVjdCB0aGUgcm9vdFByb3BlcnR5VmFsdWUgc3RyaW5nLiAqL1xuICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZVBhcnRzID0gcm9vdFByb3BlcnR5VmFsdWUudG9TdHJpbmcoKS5tYXRjaChDU1MuUmVnRXgudmFsdWVTcGxpdCk7XG4gICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlUGFydHNbaG9va1Bvc2l0aW9uXSA9IGhvb2tWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVVcGRhdGVkID0gcm9vdFByb3BlcnR5VmFsdWVQYXJ0cy5qb2luKFwiIFwiKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFByb3BlcnR5VmFsdWVVcGRhdGVkO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBwcm92aWRlZCBmdWxsSG9va05hbWUgaXNuJ3QgYSByZWdpc3RlcmVkIGhvb2ssIHJldHVybiB0aGUgcm9vdFByb3BlcnR5VmFsdWUgdGhhdCB3YXMgcGFzc2VkIGluLiAqL1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFByb3BlcnR5VmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIE5vcm1hbGl6YXRpb25zXG4gICAgICAgICoqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogTm9ybWFsaXphdGlvbnMgc3RhbmRhcmRpemUgQ1NTIHByb3BlcnR5IG1hbmlwdWxhdGlvbiBieSBwb2xseWZpbGxpbmcgYnJvd3Nlci1zcGVjaWZpYyBpbXBsZW1lbnRhdGlvbnMgKGUuZy4gb3BhY2l0eSlcbiAgICAgICAgICAgYW5kIHJlZm9ybWF0dGluZyBzcGVjaWFsIHByb3BlcnRpZXMgKGUuZy4gY2xpcCwgcmdiYSkgdG8gbG9vayBsaWtlIHN0YW5kYXJkIG9uZXMuICovXG4gICAgICAgIE5vcm1hbGl6YXRpb25zOiB7XG4gICAgICAgICAgICAvKiBOb3JtYWxpemF0aW9ucyBhcmUgcGFzc2VkIGEgbm9ybWFsaXphdGlvbiB0YXJnZXQgKGVpdGhlciB0aGUgcHJvcGVydHkncyBuYW1lLCBpdHMgZXh0cmFjdGVkIHZhbHVlLCBvciBpdHMgaW5qZWN0ZWQgdmFsdWUpLFxuICAgICAgICAgICAgICAgdGhlIHRhcmdldGVkIGVsZW1lbnQgKHdoaWNoIG1heSBuZWVkIHRvIGJlIHF1ZXJpZWQpLCBhbmQgdGhlIHRhcmdldGVkIHByb3BlcnR5IHZhbHVlLiAqL1xuICAgICAgICAgICAgcmVnaXN0ZXJlZDoge1xuICAgICAgICAgICAgICAgIGNsaXA6IGZ1bmN0aW9uICh0eXBlLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJjbGlwXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBDbGlwIG5lZWRzIHRvIGJlIHVud3JhcHBlZCBhbmQgc3RyaXBwZWQgb2YgaXRzIGNvbW1hcyBkdXJpbmcgZXh0cmFjdGlvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4dHJhY3RlZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIFZlbG9jaXR5IGFsc28gZXh0cmFjdGVkIHRoaXMgdmFsdWUsIHNraXAgZXh0cmFjdGlvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLlJlZ0V4LndyYXBwZWRWYWx1ZUFscmVhZHlFeHRyYWN0ZWQudGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSBwcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFJlbW92ZSB0aGUgXCJyZWN0KClcIiB3cmFwcGVyLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSBwcm9wZXJ0eVZhbHVlLnRvU3RyaW5nKCkubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlVW53cmFwKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTdHJpcCBvZmYgY29tbWFzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSBleHRyYWN0ZWQgPyBleHRyYWN0ZWRbMV0ucmVwbGFjZSgvLChcXHMrKT8vZywgXCIgXCIpIDogcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXh0cmFjdGVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2xpcCBuZWVkcyB0byBiZSByZS13cmFwcGVkIGR1cmluZyBpbmplY3Rpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW5qZWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwicmVjdChcIiArIHByb3BlcnR5VmFsdWUgKyBcIilcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBibHVyOiBmdW5jdGlvbih0eXBlLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gVmVsb2NpdHkuU3RhdGUuaXNGaXJlZm94ID8gXCJmaWx0ZXJcIiA6IFwiLXdlYmtpdC1maWx0ZXJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4dHJhY3RlZCA9IHBhcnNlRmxvYXQocHJvcGVydHlWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBleHRyYWN0ZWQgaXMgTmFOLCBtZWFuaW5nIHRoZSB2YWx1ZSBpc24ndCBhbHJlYWR5IGV4dHJhY3RlZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShleHRyYWN0ZWQgfHwgZXh0cmFjdGVkID09PSAwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYmx1ckNvbXBvbmVudCA9IHByb3BlcnR5VmFsdWUudG9TdHJpbmcoKS5tYXRjaCgvYmx1clxcKChbMC05XStbQS16XSspXFwpL2kpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBmaWx0ZXIgc3RyaW5nIGhhZCBhIGJsdXIgY29tcG9uZW50LCByZXR1cm4ganVzdCB0aGUgYmx1ciB2YWx1ZSBhbmQgdW5pdCB0eXBlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmx1ckNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkID0gYmx1ckNvbXBvbmVudFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGNvbXBvbmVudCBkb2Vzbid0IGV4aXN0LCBkZWZhdWx0IGJsdXIgdG8gMC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXh0cmFjdGVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogQmx1ciBuZWVkcyB0byBiZSByZS13cmFwcGVkIGR1cmluZyBpbmplY3Rpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW5qZWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRm9yIHRoZSBibHVyIGVmZmVjdCB0byBiZSBmdWxseSBkZS1hcHBsaWVkLCBpdCBuZWVkcyB0byBiZSBzZXQgdG8gXCJub25lXCIgaW5zdGVhZCBvZiAwLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGFyc2VGbG9hdChwcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiYmx1cihcIiArIHByb3BlcnR5VmFsdWUgKyBcIilcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLyogPD1JRTggZG8gbm90IHN1cHBvcnQgdGhlIHN0YW5kYXJkIG9wYWNpdHkgcHJvcGVydHkuIFRoZXkgdXNlIGZpbHRlcjphbHBoYShvcGFjaXR5PUlOVCkgaW5zdGVhZC4gKi9cbiAgICAgICAgICAgICAgICBvcGFjaXR5OiBmdW5jdGlvbiAodHlwZSwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoSUUgPD0gOCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiZmlsdGVyXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV4dHJhY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogPD1JRTggcmV0dXJuIGEgXCJmaWx0ZXJcIiB2YWx1ZSBvZiBcImFscGhhKG9wYWNpdHk9XFxkezEsM30pXCIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEV4dHJhY3QgdGhlIHZhbHVlIGFuZCBjb252ZXJ0IGl0IHRvIGEgZGVjaW1hbCB2YWx1ZSB0byBtYXRjaCB0aGUgc3RhbmRhcmQgQ1NTIG9wYWNpdHkgcHJvcGVydHkncyBmb3JtYXR0aW5nLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXh0cmFjdGVkID0gcHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKC9hbHBoYVxcKG9wYWNpdHk9KC4qKVxcKS9pKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXh0cmFjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDb252ZXJ0IHRvIGRlY2ltYWwgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gZXh0cmFjdGVkWzFdIC8gMTAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogV2hlbiBleHRyYWN0aW5nIG9wYWNpdHksIGRlZmF1bHQgdG8gMSBzaW5jZSBhIG51bGwgdmFsdWUgbWVhbnMgb3BhY2l0eSBoYXNuJ3QgYmVlbiBzZXQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpbmplY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogT3BhY2lmaWVkIGVsZW1lbnRzIGFyZSByZXF1aXJlZCB0byBoYXZlIHRoZWlyIHpvb20gcHJvcGVydHkgc2V0IHRvIGEgbm9uLXplcm8gdmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuem9vbSA9IDE7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2V0dGluZyB0aGUgZmlsdGVyIHByb3BlcnR5IG9uIGVsZW1lbnRzIHdpdGggY2VydGFpbiBmb250IHByb3BlcnR5IGNvbWJpbmF0aW9ucyBjYW4gcmVzdWx0IGluIGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGx5IHVuYXBwZWFsaW5nIHVsdHJhLWJvbGRpbmcgZWZmZWN0LiBUaGVyZSdzIG5vIHdheSB0byByZW1lZHkgdGhpcyB0aHJvdWdob3V0IGEgdHdlZW4sIGJ1dCBkcm9wcGluZyB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgYWx0b2dldGhlciAod2hlbiBvcGFjaXR5IGhpdHMgMSkgYXQgbGVhc3RzIGVuc3VyZXMgdGhhdCB0aGUgZ2xpdGNoIGlzIGdvbmUgcG9zdC10d2VlbmluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQocHJvcGVydHlWYWx1ZSkgPj0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQXMgcGVyIHRoZSBmaWx0ZXIgcHJvcGVydHkncyBzcGVjLCBjb252ZXJ0IHRoZSBkZWNpbWFsIHZhbHVlIHRvIGEgd2hvbGUgbnVtYmVyIGFuZCB3cmFwIHRoZSB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJhbHBoYShvcGFjaXR5PVwiICsgcGFyc2VJbnQocGFyc2VGbG9hdChwcm9wZXJ0eVZhbHVlKSAqIDEwMCwgMTApICsgXCIpXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLyogV2l0aCBhbGwgb3RoZXIgYnJvd3NlcnMsIG5vcm1hbGl6YXRpb24gaXMgbm90IHJlcXVpcmVkOyByZXR1cm4gdGhlIHNhbWUgdmFsdWVzIHRoYXQgd2VyZSBwYXNzZWQgaW4uICovXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwibmFtZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJvcGFjaXR5XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV4dHJhY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgIEJhdGNoZWQgUmVnaXN0cmF0aW9uc1xuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIE5vdGU6IEJhdGNoZWQgbm9ybWFsaXphdGlvbnMgZXh0ZW5kIHRoZSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZCBvYmplY3QuICovXG4gICAgICAgICAgICByZWdpc3RlcjogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgIFRyYW5zZm9ybXNcbiAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgIC8qIFRyYW5zZm9ybXMgYXJlIHRoZSBzdWJwcm9wZXJ0aWVzIGNvbnRhaW5lZCBieSB0aGUgQ1NTIFwidHJhbnNmb3JtXCIgcHJvcGVydHkuIFRyYW5zZm9ybXMgbXVzdCB1bmRlcmdvIG5vcm1hbGl6YXRpb25cbiAgICAgICAgICAgICAgICAgICBzbyB0aGF0IHRoZXkgY2FuIGJlIHJlZmVyZW5jZWQgaW4gYSBwcm9wZXJ0aWVzIG1hcCBieSB0aGVpciBpbmRpdmlkdWFsIG5hbWVzLiAqL1xuICAgICAgICAgICAgICAgIC8qIE5vdGU6IFdoZW4gdHJhbnNmb3JtcyBhcmUgXCJzZXRcIiwgdGhleSBhcmUgYWN0dWFsbHkgYXNzaWduZWQgdG8gYSBwZXItZWxlbWVudCB0cmFuc2Zvcm1DYWNoZS4gV2hlbiBhbGwgdHJhbnNmb3JtXG4gICAgICAgICAgICAgICAgICAgc2V0dGluZyBpcyBjb21wbGV0ZSBjb21wbGV0ZSwgQ1NTLmZsdXNoVHJhbnNmb3JtQ2FjaGUoKSBtdXN0IGJlIG1hbnVhbGx5IGNhbGxlZCB0byBmbHVzaCB0aGUgdmFsdWVzIHRvIHRoZSBET00uXG4gICAgICAgICAgICAgICAgICAgVHJhbnNmb3JtIHNldHRpbmcgaXMgYmF0Y2hlZCBpbiB0aGlzIHdheSB0byBpbXByb3ZlIHBlcmZvcm1hbmNlOiB0aGUgdHJhbnNmb3JtIHN0eWxlIG9ubHkgbmVlZHMgdG8gYmUgdXBkYXRlZFxuICAgICAgICAgICAgICAgICAgIG9uY2Ugd2hlbiBtdWx0aXBsZSB0cmFuc2Zvcm0gc3VicHJvcGVydGllcyBhcmUgYmVpbmcgYW5pbWF0ZWQgc2ltdWx0YW5lb3VzbHkuICovXG4gICAgICAgICAgICAgICAgLyogTm90ZTogSUU5IGFuZCBBbmRyb2lkIEdpbmdlcmJyZWFkIGhhdmUgc3VwcG9ydCBmb3IgMkQgLS0gYnV0IG5vdCAzRCAtLSB0cmFuc2Zvcm1zLiBTaW5jZSBhbmltYXRpbmcgdW5zdXBwb3J0ZWRcbiAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gcHJvcGVydGllcyByZXN1bHRzIGluIHRoZSBicm93c2VyIGlnbm9yaW5nIHRoZSAqZW50aXJlKiB0cmFuc2Zvcm0gc3RyaW5nLCB3ZSBwcmV2ZW50IHRoZXNlIDNEIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgIGZyb20gYmVpbmcgbm9ybWFsaXplZCBmb3IgdGhlc2UgYnJvd3NlcnMgc28gdGhhdCB0d2VlbmluZyBza2lwcyB0aGVzZSBwcm9wZXJ0aWVzIGFsdG9nZXRoZXJcbiAgICAgICAgICAgICAgICAgICAoc2luY2UgaXQgd2lsbCBpZ25vcmUgdGhlbSBhcyBiZWluZyB1bnN1cHBvcnRlZCBieSB0aGUgYnJvd3Nlci4pICovXG4gICAgICAgICAgICAgICAgaWYgKCEoSUUgPD0gOSkgJiYgIVZlbG9jaXR5LlN0YXRlLmlzR2luZ2VyYnJlYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogU2luY2UgdGhlIHN0YW5kYWxvbmUgQ1NTIFwicGVyc3BlY3RpdmVcIiBwcm9wZXJ0eSBhbmQgdGhlIENTUyB0cmFuc2Zvcm0gXCJwZXJzcGVjdGl2ZVwiIHN1YnByb3BlcnR5XG4gICAgICAgICAgICAgICAgICAgIHNoYXJlIHRoZSBzYW1lIG5hbWUsIHRoZSBsYXR0ZXIgaXMgZ2l2ZW4gYSB1bmlxdWUgdG9rZW4gd2l0aGluIFZlbG9jaXR5OiBcInRyYW5zZm9ybVBlcnNwZWN0aXZlXCIuICovXG4gICAgICAgICAgICAgICAgICAgIENTUy5MaXN0cy50cmFuc2Zvcm1zQmFzZSA9IENTUy5MaXN0cy50cmFuc2Zvcm1zQmFzZS5jb25jYXQoQ1NTLkxpc3RzLnRyYW5zZm9ybXMzRCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgLyogV3JhcCB0aGUgZHluYW1pY2FsbHkgZ2VuZXJhdGVkIG5vcm1hbGl6YXRpb24gZnVuY3Rpb24gaW4gYSBuZXcgc2NvcGUgc28gdGhhdCB0cmFuc2Zvcm1OYW1lJ3MgdmFsdWUgaXNcbiAgICAgICAgICAgICAgICAgICAgcGFpcmVkIHdpdGggaXRzIHJlc3BlY3RpdmUgZnVuY3Rpb24uIChPdGhlcndpc2UsIGFsbCBmdW5jdGlvbnMgd291bGQgdGFrZSB0aGUgZmluYWwgZm9yIGxvb3AncyB0cmFuc2Zvcm1OYW1lLikgKi9cbiAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRyYW5zZm9ybU5hbWUgPSBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2VbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3RyYW5zZm9ybU5hbWVdID0gZnVuY3Rpb24gKHR5cGUsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIG5vcm1hbGl6ZWQgcHJvcGVydHkgbmFtZSBpcyB0aGUgcGFyZW50IFwidHJhbnNmb3JtXCIgcHJvcGVydHkgLS0gdGhlIHByb3BlcnR5IHRoYXQgaXMgYWN0dWFsbHkgc2V0IGluIENTUy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcInRyYW5zZm9ybVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm0gdmFsdWVzIGFyZSBjYWNoZWQgb250byBhIHBlci1lbGVtZW50IHRyYW5zZm9ybUNhY2hlIG9iamVjdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV4dHJhY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgdHJhbnNmb3JtIGhhcyB5ZXQgdG8gYmUgYXNzaWduZWQgYSB2YWx1ZSwgcmV0dXJuIGl0cyBudWxsIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCB8fCBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTY2FsZSBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2UgZGVmYXVsdCB0byAxIHdoZXJlYXMgYWxsIG90aGVyIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIGRlZmF1bHQgdG8gMC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gL15zY2FsZS9pLnRlc3QodHJhbnNmb3JtTmFtZSkgPyAxIDogMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFdoZW4gdHJhbnNmb3JtIHZhbHVlcyBhcmUgc2V0LCB0aGV5IGFyZSB3cmFwcGVkIGluIHBhcmVudGhlc2VzIGFzIHBlciB0aGUgQ1NTIHNwZWMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaHVzLCB3aGVuIGV4dHJhY3RpbmcgdGhlaXIgdmFsdWVzIChmb3IgdHdlZW4gY2FsY3VsYXRpb25zKSwgd2Ugc3RyaXAgb2ZmIHRoZSBwYXJlbnRoZXNlcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV0ucmVwbGFjZSgvWygpXS9nLCBcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGludmFsaWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgYW4gaW5kaXZpZHVhbCB0cmFuc2Zvcm0gcHJvcGVydHkgY29udGFpbnMgYW4gdW5zdXBwb3J0ZWQgdW5pdCB0eXBlLCB0aGUgYnJvd3NlciBpZ25vcmVzIHRoZSAqZW50aXJlKiB0cmFuc2Zvcm0gcHJvcGVydHkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaHVzLCBwcm90ZWN0IHVzZXJzIGZyb20gdGhlbXNlbHZlcyBieSBza2lwcGluZyBzZXR0aW5nIGZvciB0cmFuc2Zvcm0gdmFsdWVzIHN1cHBsaWVkIHdpdGggaW52YWxpZCB1bml0IHR5cGVzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU3dpdGNoIG9uIHRoZSBiYXNlIHRyYW5zZm9ybSB0eXBlOyBpZ25vcmUgdGhlIGF4aXMgYnkgcmVtb3ZpbmcgdGhlIGxhc3QgbGV0dGVyIGZyb20gdGhlIHRyYW5zZm9ybSdzIG5hbWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHRyYW5zZm9ybU5hbWUuc3Vic3RyKDAsIHRyYW5zZm9ybU5hbWUubGVuZ3RoIC0gMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBXaGl0ZWxpc3QgdW5pdCB0eXBlcyBmb3IgZWFjaCB0cmFuc2Zvcm0uICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInRyYW5zbGF0ZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZhbGlkID0gIS8oJXxweHxlbXxyZW18dnd8dmh8XFxkKSQvaS50ZXN0KHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSBhbiBheGlzLWZyZWUgXCJzY2FsZVwiIHByb3BlcnR5IGlzIHN1cHBvcnRlZCBhcyB3ZWxsLCBhIGxpdHRsZSBoYWNrIGlzIHVzZWQgaGVyZSB0byBkZXRlY3QgaXQgYnkgY2hvcHBpbmcgb2ZmIGl0cyBsYXN0IGxldHRlci4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwic2NhbFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzY2FsZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDaHJvbWUgb24gQW5kcm9pZCBoYXMgYSBidWcgaW4gd2hpY2ggc2NhbGVkIGVsZW1lbnRzIGJsdXIgaWYgdGhlaXIgaW5pdGlhbCBzY2FsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSBpcyBiZWxvdyAxICh3aGljaCBjYW4gaGFwcGVuIHdpdGggZm9yY2VmZWVkaW5nKS4gVGh1cywgd2UgZGV0ZWN0IGEgeWV0LXVuc2V0IHNjYWxlIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZCBlbnN1cmUgdGhhdCBpdHMgZmlyc3QgdmFsdWUgaXMgYWx3YXlzIDEuIE1vcmUgaW5mbzogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDQxNzg5MC9jc3MzLWFuaW1hdGlvbnMtd2l0aC10cmFuc2Zvcm0tY2F1c2VzLWJsdXJyZWQtZWxlbWVudHMtb24td2Via2l0LzEwNDE3OTYyIzEwNDE3OTYyICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5TdGF0ZS5pc0FuZHJvaWQgJiYgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXSA9PT0gdW5kZWZpbmVkICYmIHByb3BlcnR5VmFsdWUgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludmFsaWQgPSAhLyhcXGQpJC9pLnRlc3QocHJvcGVydHlWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJza2V3XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludmFsaWQgPSAhLyhkZWd8XFxkKSQvaS50ZXN0KHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicm90YXRlXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludmFsaWQgPSAhLyhkZWd8XFxkKSQvaS50ZXN0KHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpbnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQXMgcGVyIHRoZSBDU1Mgc3BlYywgd3JhcCB0aGUgdmFsdWUgaW4gcGFyZW50aGVzZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXSA9IFwiKFwiICsgcHJvcGVydHlWYWx1ZSArIFwiKVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBBbHRob3VnaCB0aGUgdmFsdWUgaXMgc2V0IG9uIHRoZSB0cmFuc2Zvcm1DYWNoZSBvYmplY3QsIHJldHVybiB0aGUgbmV3bHktdXBkYXRlZCB2YWx1ZSBmb3IgdGhlIGNhbGxpbmcgY29kZSB0byBwcm9jZXNzIGFzIG5vcm1hbC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgQ29sb3JzXG4gICAgICAgICAgICAgICAgKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgIC8qIFNpbmNlIFZlbG9jaXR5IG9ubHkgYW5pbWF0ZXMgYSBzaW5nbGUgbnVtZXJpYyB2YWx1ZSBwZXIgcHJvcGVydHksIGNvbG9yIGFuaW1hdGlvbiBpcyBhY2hpZXZlZCBieSBob29raW5nIHRoZSBpbmRpdmlkdWFsIFJHQkEgY29tcG9uZW50cyBvZiBDU1MgY29sb3IgcHJvcGVydGllcy5cbiAgICAgICAgICAgICAgICAgICBBY2NvcmRpbmdseSwgY29sb3IgdmFsdWVzIG11c3QgYmUgbm9ybWFsaXplZCAoZS5nLiBcIiNmZjAwMDBcIiwgXCJyZWRcIiwgYW5kIFwicmdiKDI1NSwgMCwgMClcIiA9PT4gXCIyNTUgMCAwIDFcIikgc28gdGhhdCB0aGVpciBjb21wb25lbnRzIGNhbiBiZSBpbmplY3RlZC9leHRyYWN0ZWQgYnkgQ1NTLkhvb2tzIGxvZ2ljLiAqL1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgQ1NTLkxpc3RzLmNvbG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAvKiBXcmFwIHRoZSBkeW5hbWljYWxseSBnZW5lcmF0ZWQgbm9ybWFsaXphdGlvbiBmdW5jdGlvbiBpbiBhIG5ldyBzY29wZSBzbyB0aGF0IGNvbG9yTmFtZSdzIHZhbHVlIGlzIHBhaXJlZCB3aXRoIGl0cyByZXNwZWN0aXZlIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAoT3RoZXJ3aXNlLCBhbGwgZnVuY3Rpb25zIHdvdWxkIHRha2UgdGhlIGZpbmFsIGZvciBsb29wJ3MgY29sb3JOYW1lLikgKi9cbiAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2xvck5hbWUgPSBDU1MuTGlzdHMuY29sb3JzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBJbiBJRTw9OCwgd2hpY2ggc3VwcG9ydCByZ2IgYnV0IG5vdCByZ2JhLCBjb2xvciBwcm9wZXJ0aWVzIGFyZSByZXZlcnRlZCB0byByZ2IgYnkgc3RyaXBwaW5nIG9mZiB0aGUgYWxwaGEgY29tcG9uZW50LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbY29sb3JOYW1lXSA9IGZ1bmN0aW9uKHR5cGUsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xvck5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnZlcnQgYWxsIGNvbG9yIHZhbHVlcyBpbnRvIHRoZSByZ2IgZm9ybWF0LiAoT2xkIElFIGNhbiByZXR1cm4gaGV4IHZhbHVlcyBhbmQgY29sb3IgbmFtZXMgaW5zdGVhZCBvZiByZ2IvcmdiYS4pICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXh0cmFjdGVkO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgY29sb3IgaXMgYWxyZWFkeSBpbiBpdHMgaG9va2FibGUgZm9ybSAoZS5nLiBcIjI1NSAyNTUgMjU1IDFcIikgZHVlIHRvIGhhdmluZyBiZWVuIHByZXZpb3VzbHkgZXh0cmFjdGVkLCBza2lwIGV4dHJhY3Rpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLlJlZ0V4LndyYXBwZWRWYWx1ZUFscmVhZHlFeHRyYWN0ZWQudGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCA9IHByb3BlcnR5VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb252ZXJ0ZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yTmFtZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBibGFjazogXCJyZ2IoMCwgMCwgMClcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsdWU6IFwicmdiKDAsIDAsIDI1NSlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYXk6IFwicmdiKDEyOCwgMTI4LCAxMjgpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmVlbjogXCJyZ2IoMCwgMTI4LCAwKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVkOiBcInJnYigyNTUsIDAsIDApXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZTogXCJyZ2IoMjU1LCAyNTUsIDI1NSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29udmVydCBjb2xvciBuYW1lcyB0byByZ2IuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9eW0Etel0rJC9pLnRlc3QocHJvcGVydHlWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbG9yTmFtZXNbcHJvcGVydHlWYWx1ZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydGVkID0gY29sb3JOYW1lc1twcm9wZXJ0eVZhbHVlXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgYW4gdW5tYXRjaGVkIGNvbG9yIG5hbWUgaXMgcHJvdmlkZWQsIGRlZmF1bHQgdG8gYmxhY2suICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZWQgPSBjb2xvck5hbWVzLmJsYWNrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29udmVydCBoZXggdmFsdWVzIHRvIHJnYi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKENTUy5SZWdFeC5pc0hleC50ZXN0KHByb3BlcnR5VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlZCA9IFwicmdiKFwiICsgQ1NTLlZhbHVlcy5oZXhUb1JnYihwcm9wZXJ0eVZhbHVlKS5qb2luKFwiIFwiKSArIFwiKVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBwcm92aWRlZCBjb2xvciBkb2Vzbid0IG1hdGNoIGFueSBvZiB0aGUgYWNjZXB0ZWQgY29sb3IgZm9ybWF0cywgZGVmYXVsdCB0byBibGFjay4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCEoL15yZ2JhP1xcKC9pLnRlc3QocHJvcGVydHlWYWx1ZSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlZCA9IGNvbG9yTmFtZXMuYmxhY2s7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUmVtb3ZlIHRoZSBzdXJyb3VuZGluZyBcInJnYi9yZ2JhKClcIiBzdHJpbmcgdGhlbiByZXBsYWNlIGNvbW1hcyB3aXRoIHNwYWNlcyBhbmQgc3RyaXBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXBlYXRlZCBzcGFjZXMgKGluIGNhc2UgdGhlIHZhbHVlIGluY2x1ZGVkIHNwYWNlcyB0byBiZWdpbiB3aXRoKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSAoY29udmVydGVkIHx8IHByb3BlcnR5VmFsdWUpLnRvU3RyaW5nKCkubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlVW53cmFwKVsxXS5yZXBsYWNlKC8sKFxccyspPy9nLCBcIiBcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNvIGxvbmcgYXMgdGhpcyBpc24ndCA8PUlFOCwgYWRkIGEgZm91cnRoIChhbHBoYSkgY29tcG9uZW50IGlmIGl0J3MgbWlzc2luZyBhbmQgZGVmYXVsdCBpdCB0byAxICh2aXNpYmxlKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKElFIDw9IDgpICYmIGV4dHJhY3RlZC5zcGxpdChcIiBcIikubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkICs9IFwiIDFcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4dHJhY3RlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhpcyBpcyBJRTw9OCBhbmQgYW4gYWxwaGEgY29tcG9uZW50IGV4aXN0cywgc3RyaXAgaXQgb2ZmLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKElFIDw9IDgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHlWYWx1ZS5zcGxpdChcIiBcIikubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBwcm9wZXJ0eVZhbHVlLnNwbGl0KC9cXHMrLykuc2xpY2UoMCwgMykuam9pbihcIiBcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogT3RoZXJ3aXNlLCBhZGQgYSBmb3VydGggKGFscGhhKSBjb21wb25lbnQgaWYgaXQncyBtaXNzaW5nIGFuZCBkZWZhdWx0IGl0IHRvIDEgKHZpc2libGUpLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eVZhbHVlLnNwbGl0KFwiIFwiKS5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlICs9IFwiIDFcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUmUtaW5zZXJ0IHRoZSBicm93c2VyLWFwcHJvcHJpYXRlIHdyYXBwZXIoXCJyZ2IvcmdiYSgpXCIpLCBpbnNlcnQgY29tbWFzLCBhbmQgc3RyaXAgb2ZmIGRlY2ltYWwgdW5pdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uIGFsbCB2YWx1ZXMgYnV0IHRoZSBmb3VydGggKFIsIEcsIGFuZCBCIG9ubHkgYWNjZXB0IHdob2xlIG51bWJlcnMpLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChJRSA8PSA4ID8gXCJyZ2JcIiA6IFwicmdiYVwiKSArIFwiKFwiICsgcHJvcGVydHlWYWx1ZS5yZXBsYWNlKC9cXHMrL2csIFwiLFwiKS5yZXBsYWNlKC9cXC4oXFxkKSsoPz0sKS9nLCBcIlwiKSArIFwiKVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgQ1NTIFByb3BlcnR5IE5hbWVzXG4gICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICBOYW1lczoge1xuICAgICAgICAgICAgLyogQ2FtZWxjYXNlIGEgcHJvcGVydHkgbmFtZSBpbnRvIGl0cyBKYXZhU2NyaXB0IG5vdGF0aW9uIChlLmcuIFwiYmFja2dyb3VuZC1jb2xvclwiID09PiBcImJhY2tncm91bmRDb2xvclwiKS5cbiAgICAgICAgICAgICAgIENhbWVsY2FzaW5nIGlzIHVzZWQgdG8gbm9ybWFsaXplIHByb3BlcnR5IG5hbWVzIGJldHdlZW4gYW5kIGFjcm9zcyBjYWxscy4gKi9cbiAgICAgICAgICAgIGNhbWVsQ2FzZTogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5LnJlcGxhY2UoLy0oXFx3KS9nLCBmdW5jdGlvbiAobWF0Y2gsIHN1Yk1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdWJNYXRjaC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyogRm9yIFNWRyBlbGVtZW50cywgc29tZSBwcm9wZXJ0aWVzIChuYW1lbHksIGRpbWVuc2lvbmFsIG9uZXMpIGFyZSBHRVQvU0VUIHZpYSB0aGUgZWxlbWVudCdzIEhUTUwgYXR0cmlidXRlcyAoaW5zdGVhZCBvZiB2aWEgQ1NTIHN0eWxlcykuICovXG4gICAgICAgICAgICBTVkdBdHRyaWJ1dGU6IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHZhciBTVkdBdHRyaWJ1dGVzID0gXCJ3aWR0aHxoZWlnaHR8eHx5fGN4fGN5fHJ8cnh8cnl8eDF8eDJ8eTF8eTJcIjtcblxuICAgICAgICAgICAgICAgIC8qIENlcnRhaW4gYnJvd3NlcnMgcmVxdWlyZSBhbiBTVkcgdHJhbnNmb3JtIHRvIGJlIGFwcGxpZWQgYXMgYW4gYXR0cmlidXRlLiAoT3RoZXJ3aXNlLCBhcHBsaWNhdGlvbiB2aWEgQ1NTIGlzIHByZWZlcmFibGUgZHVlIHRvIDNEIHN1cHBvcnQuKSAqL1xuICAgICAgICAgICAgICAgIGlmIChJRSB8fCAoVmVsb2NpdHkuU3RhdGUuaXNBbmRyb2lkICYmICFWZWxvY2l0eS5TdGF0ZS5pc0Nocm9tZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgU1ZHQXR0cmlidXRlcyArPSBcInx0cmFuc2Zvcm1cIjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChcIl4oXCIgKyBTVkdBdHRyaWJ1dGVzICsgXCIpJFwiLCBcImlcIikudGVzdChwcm9wZXJ0eSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKiBEZXRlcm1pbmUgd2hldGhlciBhIHByb3BlcnR5IHNob3VsZCBiZSBzZXQgd2l0aCBhIHZlbmRvciBwcmVmaXguICovXG4gICAgICAgICAgICAvKiBJZiBhIHByZWZpeGVkIHZlcnNpb24gb2YgdGhlIHByb3BlcnR5IGV4aXN0cywgcmV0dXJuIGl0LiBPdGhlcndpc2UsIHJldHVybiB0aGUgb3JpZ2luYWwgcHJvcGVydHkgbmFtZS5cbiAgICAgICAgICAgICAgIElmIHRoZSBwcm9wZXJ0eSBpcyBub3QgYXQgYWxsIHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlciwgcmV0dXJuIGEgZmFsc2UgZmxhZy4gKi9cbiAgICAgICAgICAgIHByZWZpeENoZWNrOiBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICAvKiBJZiB0aGlzIHByb3BlcnR5IGhhcyBhbHJlYWR5IGJlZW4gY2hlY2tlZCwgcmV0dXJuIHRoZSBjYWNoZWQgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LlN0YXRlLnByZWZpeE1hdGNoZXNbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbIFZlbG9jaXR5LlN0YXRlLnByZWZpeE1hdGNoZXNbcHJvcGVydHldLCB0cnVlIF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZlbmRvcnMgPSBbIFwiXCIsIFwiV2Via2l0XCIsIFwiTW96XCIsIFwibXNcIiwgXCJPXCIgXTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgdmVuZG9yc0xlbmd0aCA9IHZlbmRvcnMubGVuZ3RoOyBpIDwgdmVuZG9yc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHlQcmVmaXhlZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVByZWZpeGVkID0gcHJvcGVydHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENhcGl0YWxpemUgdGhlIGZpcnN0IGxldHRlciBvZiB0aGUgcHJvcGVydHkgdG8gY29uZm9ybSB0byBKYXZhU2NyaXB0IHZlbmRvciBwcmVmaXggbm90YXRpb24gKGUuZy4gd2Via2l0RmlsdGVyKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVByZWZpeGVkID0gdmVuZG9yc1tpXSArIHByb3BlcnR5LnJlcGxhY2UoL15cXHcvLCBmdW5jdGlvbihtYXRjaCkgeyByZXR1cm4gbWF0Y2gudG9VcHBlckNhc2UoKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIENoZWNrIGlmIHRoZSBicm93c2VyIHN1cHBvcnRzIHRoaXMgcHJvcGVydHkgYXMgcHJlZml4ZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc1N0cmluZyhWZWxvY2l0eS5TdGF0ZS5wcmVmaXhFbGVtZW50LnN0eWxlW3Byb3BlcnR5UHJlZml4ZWRdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENhY2hlIHRoZSBtYXRjaC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5wcmVmaXhNYXRjaGVzW3Byb3BlcnR5XSA9IHByb3BlcnR5UHJlZml4ZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWyBwcm9wZXJ0eVByZWZpeGVkLCB0cnVlIF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgYnJvd3NlciBkb2Vzbid0IHN1cHBvcnQgdGhpcyBwcm9wZXJ0eSBpbiBhbnkgZm9ybSwgaW5jbHVkZSBhIGZhbHNlIGZsYWcgc28gdGhhdCB0aGUgY2FsbGVyIGNhbiBkZWNpZGUgaG93IHRvIHByb2NlZWQuICovXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbIHByb3BlcnR5LCBmYWxzZSBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIENTUyBQcm9wZXJ0eSBWYWx1ZXNcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgIFZhbHVlczoge1xuICAgICAgICAgICAgLyogSGV4IHRvIFJHQiBjb252ZXJzaW9uLiBDb3B5cmlnaHQgVGltIERvd246IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTYyMzgzOC9yZ2ItdG8taGV4LWFuZC1oZXgtdG8tcmdiICovXG4gICAgICAgICAgICBoZXhUb1JnYjogZnVuY3Rpb24gKGhleCkge1xuICAgICAgICAgICAgICAgIHZhciBzaG9ydGZvcm1SZWdleCA9IC9eIz8oW2EtZlxcZF0pKFthLWZcXGRdKShbYS1mXFxkXSkkL2ksXG4gICAgICAgICAgICAgICAgICAgIGxvbmdmb3JtUmVnZXggPSAvXiM/KFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pJC9pLFxuICAgICAgICAgICAgICAgICAgICByZ2JQYXJ0cztcblxuICAgICAgICAgICAgICAgIGhleCA9IGhleC5yZXBsYWNlKHNob3J0Zm9ybVJlZ2V4LCBmdW5jdGlvbiAobSwgciwgZywgYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gciArIHIgKyBnICsgZyArIGIgKyBiO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmdiUGFydHMgPSBsb25nZm9ybVJlZ2V4LmV4ZWMoaGV4KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiByZ2JQYXJ0cyA/IFsgcGFyc2VJbnQocmdiUGFydHNbMV0sIDE2KSwgcGFyc2VJbnQocmdiUGFydHNbMl0sIDE2KSwgcGFyc2VJbnQocmdiUGFydHNbM10sIDE2KSBdIDogWyAwLCAwLCAwIF07XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBpc0NTU051bGxWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgLyogVGhlIGJyb3dzZXIgZGVmYXVsdHMgQ1NTIHZhbHVlcyB0aGF0IGhhdmUgbm90IGJlZW4gc2V0IHRvIGVpdGhlciAwIG9yIG9uZSBvZiBzZXZlcmFsIHBvc3NpYmxlIG51bGwtdmFsdWUgc3RyaW5ncy5cbiAgICAgICAgICAgICAgICAgICBUaHVzLCB3ZSBjaGVjayBmb3IgYm90aCBmYWxzaW5lc3MgYW5kIHRoZXNlIHNwZWNpYWwgc3RyaW5ncy4gKi9cbiAgICAgICAgICAgICAgICAvKiBOdWxsLXZhbHVlIGNoZWNraW5nIGlzIHBlcmZvcm1lZCB0byBkZWZhdWx0IHRoZSBzcGVjaWFsIHN0cmluZ3MgdG8gMCAoZm9yIHRoZSBzYWtlIG9mIHR3ZWVuaW5nKSBvciB0aGVpciBob29rXG4gICAgICAgICAgICAgICAgICAgdGVtcGxhdGVzIGFzIGRlZmluZWQgYXMgQ1NTLkhvb2tzIChmb3IgdGhlIHNha2Ugb2YgaG9vayBpbmplY3Rpb24vZXh0cmFjdGlvbikuICovXG4gICAgICAgICAgICAgICAgLyogTm90ZTogQ2hyb21lIHJldHVybnMgXCJyZ2JhKDAsIDAsIDAsIDApXCIgZm9yIGFuIHVuZGVmaW5lZCBjb2xvciB3aGVyZWFzIElFIHJldHVybnMgXCJ0cmFuc3BhcmVudFwiLiAqL1xuICAgICAgICAgICAgICAgIHJldHVybiAodmFsdWUgPT0gMCB8fCAvXihub25lfGF1dG98dHJhbnNwYXJlbnR8KHJnYmFcXCgwLCA/MCwgPzAsID8wXFwpKSkkL2kudGVzdCh2YWx1ZSkpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyogUmV0cmlldmUgYSBwcm9wZXJ0eSdzIGRlZmF1bHQgdW5pdCB0eXBlLiBVc2VkIGZvciBhc3NpZ25pbmcgYSB1bml0IHR5cGUgd2hlbiBvbmUgaXMgbm90IHN1cHBsaWVkIGJ5IHRoZSB1c2VyLiAqL1xuICAgICAgICAgICAgZ2V0VW5pdFR5cGU6IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIGlmICgvXihyb3RhdGV8c2tldykvaS50ZXN0KHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJkZWdcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC8oXihzY2FsZXxzY2FsZVh8c2NhbGVZfHNjYWxlWnxhbHBoYXxmbGV4R3Jvd3xmbGV4SGVpZ2h0fHpJbmRleHxmb250V2VpZ2h0KSQpfCgob3BhY2l0eXxyZWR8Z3JlZW58Ymx1ZXxhbHBoYSkkKS9pLnRlc3QocHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIFRoZSBhYm92ZSBwcm9wZXJ0aWVzIGFyZSB1bml0bGVzcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLyogRGVmYXVsdCB0byBweCBmb3IgYWxsIG90aGVyIHByb3BlcnRpZXMuICovXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcInB4XCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyogSFRNTCBlbGVtZW50cyBkZWZhdWx0IHRvIGFuIGFzc29jaWF0ZWQgZGlzcGxheSB0eXBlIHdoZW4gdGhleSdyZSBub3Qgc2V0IHRvIGRpc3BsYXk6bm9uZS4gKi9cbiAgICAgICAgICAgIC8qIE5vdGU6IFRoaXMgZnVuY3Rpb24gaXMgdXNlZCBmb3IgY29ycmVjdGx5IHNldHRpbmcgdGhlIG5vbi1cIm5vbmVcIiBkaXNwbGF5IHZhbHVlIGluIGNlcnRhaW4gVmVsb2NpdHkgcmVkaXJlY3RzLCBzdWNoIGFzIGZhZGVJbi9PdXQuICovXG4gICAgICAgICAgICBnZXREaXNwbGF5VHlwZTogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFnTmFtZSA9IGVsZW1lbnQgJiYgZWxlbWVudC50YWdOYW1lLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIGlmICgvXihifGJpZ3xpfHNtYWxsfHR0fGFiYnJ8YWNyb255bXxjaXRlfGNvZGV8ZGZufGVtfGtiZHxzdHJvbmd8c2FtcHx2YXJ8YXxiZG98YnJ8aW1nfG1hcHxvYmplY3R8cXxzY3JpcHR8c3BhbnxzdWJ8c3VwfGJ1dHRvbnxpbnB1dHxsYWJlbHxzZWxlY3R8dGV4dGFyZWEpJC9pLnRlc3QodGFnTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiaW5saW5lXCI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXihsaSkkL2kudGVzdCh0YWdOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJsaXN0LWl0ZW1cIjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9eKHRyKSQvaS50ZXN0KHRhZ05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcInRhYmxlLXJvd1wiO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoL14odGFibGUpJC9pLnRlc3QodGFnTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwidGFibGVcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9eKHRib2R5KSQvaS50ZXN0KHRhZ05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcInRhYmxlLXJvdy1ncm91cFwiO1xuICAgICAgICAgICAgICAgIC8qIERlZmF1bHQgdG8gXCJibG9ja1wiIHdoZW4gbm8gbWF0Y2ggaXMgZm91bmQuICovXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiYmxvY2tcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKiBUaGUgY2xhc3MgYWRkL3JlbW92ZSBmdW5jdGlvbnMgYXJlIHVzZWQgdG8gdGVtcG9yYXJpbHkgYXBwbHkgYSBcInZlbG9jaXR5LWFuaW1hdGluZ1wiIGNsYXNzIHRvIGVsZW1lbnRzIHdoaWxlIHRoZXkncmUgYW5pbWF0aW5nLiAqL1xuICAgICAgICAgICAgYWRkQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgKz0gKGVsZW1lbnQuY2xhc3NOYW1lLmxlbmd0aCA/IFwiIFwiIDogXCJcIikgKyBjbGFzc05hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBlbGVtZW50LmNsYXNzTmFtZS50b1N0cmluZygpLnJlcGxhY2UobmV3IFJlZ0V4cChcIihefFxcXFxzKVwiICsgY2xhc3NOYW1lLnNwbGl0KFwiIFwiKS5qb2luKFwifFwiKSArIFwiKFxcXFxzfCQpXCIsIFwiZ2lcIiksIFwiIFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgU3R5bGUgR2V0dGluZyAmIFNldHRpbmdcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAvKiBUaGUgc2luZ3VsYXIgZ2V0UHJvcGVydHlWYWx1ZSwgd2hpY2ggcm91dGVzIHRoZSBsb2dpYyBmb3IgYWxsIG5vcm1hbGl6YXRpb25zLCBob29rcywgYW5kIHN0YW5kYXJkIENTUyBwcm9wZXJ0aWVzLiAqL1xuICAgICAgICBnZXRQcm9wZXJ0eVZhbHVlOiBmdW5jdGlvbiAoZWxlbWVudCwgcHJvcGVydHksIHJvb3RQcm9wZXJ0eVZhbHVlLCBmb3JjZVN0eWxlTG9va3VwKSB7XG4gICAgICAgICAgICAvKiBHZXQgYW4gZWxlbWVudCdzIGNvbXB1dGVkIHByb3BlcnR5IHZhbHVlLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogUmV0cmlldmluZyB0aGUgdmFsdWUgb2YgYSBDU1MgcHJvcGVydHkgY2Fubm90IHNpbXBseSBiZSBwZXJmb3JtZWQgYnkgY2hlY2tpbmcgYW4gZWxlbWVudCdzXG4gICAgICAgICAgICAgICBzdHlsZSBhdHRyaWJ1dGUgKHdoaWNoIG9ubHkgcmVmbGVjdHMgdXNlci1kZWZpbmVkIHZhbHVlcykuIEluc3RlYWQsIHRoZSBicm93c2VyIG11c3QgYmUgcXVlcmllZCBmb3IgYSBwcm9wZXJ0eSdzXG4gICAgICAgICAgICAgICAqY29tcHV0ZWQqIHZhbHVlLiBZb3UgY2FuIHJlYWQgbW9yZSBhYm91dCBnZXRDb21wdXRlZFN0eWxlIGhlcmU6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvV2ViL0FQSS93aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gY29tcHV0ZVByb3BlcnR5VmFsdWUgKGVsZW1lbnQsIHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgLyogV2hlbiBib3gtc2l6aW5nIGlzbid0IHNldCB0byBib3JkZXItYm94LCBoZWlnaHQgYW5kIHdpZHRoIHN0eWxlIHZhbHVlcyBhcmUgaW5jb3JyZWN0bHkgY29tcHV0ZWQgd2hlbiBhblxuICAgICAgICAgICAgICAgICAgIGVsZW1lbnQncyBzY3JvbGxiYXJzIGFyZSB2aXNpYmxlICh3aGljaCBleHBhbmRzIHRoZSBlbGVtZW50J3MgZGltZW5zaW9ucykuIFRodXMsIHdlIGRlZmVyIHRvIHRoZSBtb3JlIGFjY3VyYXRlXG4gICAgICAgICAgICAgICAgICAgb2Zmc2V0SGVpZ2h0L1dpZHRoIHByb3BlcnR5LCB3aGljaCBpbmNsdWRlcyB0aGUgdG90YWwgZGltZW5zaW9ucyBmb3IgaW50ZXJpb3IsIGJvcmRlciwgcGFkZGluZywgYW5kIHNjcm9sbGJhci5cbiAgICAgICAgICAgICAgICAgICBXZSBzdWJ0cmFjdCBib3JkZXIgYW5kIHBhZGRpbmcgdG8gZ2V0IHRoZSBzdW0gb2YgaW50ZXJpb3IgKyBzY3JvbGxiYXIuICovXG4gICAgICAgICAgICAgICAgdmFyIGNvbXB1dGVkVmFsdWUgPSAwO1xuXG4gICAgICAgICAgICAgICAgLyogSUU8PTggZG9lc24ndCBzdXBwb3J0IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlLCB0aHVzIHdlIGRlZmVyIHRvIGpRdWVyeSwgd2hpY2ggaGFzIGFuIGV4dGVuc2l2ZSBhcnJheVxuICAgICAgICAgICAgICAgICAgIG9mIGhhY2tzIHRvIGFjY3VyYXRlbHkgcmV0cmlldmUgSUU4IHByb3BlcnR5IHZhbHVlcy4gUmUtaW1wbGVtZW50aW5nIHRoYXQgbG9naWMgaGVyZSBpcyBub3Qgd29ydGggYmxvYXRpbmcgdGhlXG4gICAgICAgICAgICAgICAgICAgY29kZWJhc2UgZm9yIGEgZHlpbmcgYnJvd3Nlci4gVGhlIHBlcmZvcm1hbmNlIHJlcGVyY3Vzc2lvbnMgb2YgdXNpbmcgalF1ZXJ5IGhlcmUgYXJlIG1pbmltYWwgc2luY2VcbiAgICAgICAgICAgICAgICAgICBWZWxvY2l0eSBpcyBvcHRpbWl6ZWQgdG8gcmFyZWx5IChhbmQgc29tZXRpbWVzIG5ldmVyKSBxdWVyeSB0aGUgRE9NLiBGdXJ0aGVyLCB0aGUgJC5jc3MoKSBjb2RlcGF0aCBpc24ndCB0aGF0IHNsb3cuICovXG4gICAgICAgICAgICAgICAgaWYgKElFIDw9IDgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9ICQuY3NzKGVsZW1lbnQsIHByb3BlcnR5KTsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgLyogQWxsIG90aGVyIGJyb3dzZXJzIHN1cHBvcnQgZ2V0Q29tcHV0ZWRTdHlsZS4gVGhlIHJldHVybmVkIGxpdmUgb2JqZWN0IHJlZmVyZW5jZSBpcyBjYWNoZWQgb250byBpdHNcbiAgICAgICAgICAgICAgICAgICBhc3NvY2lhdGVkIGVsZW1lbnQgc28gdGhhdCBpdCBkb2VzIG5vdCBuZWVkIHRvIGJlIHJlZmV0Y2hlZCB1cG9uIGV2ZXJ5IEdFVC4gKi9cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvKiBCcm93c2VycyBkbyBub3QgcmV0dXJuIGhlaWdodCBhbmQgd2lkdGggdmFsdWVzIGZvciBlbGVtZW50cyB0aGF0IGFyZSBzZXQgdG8gZGlzcGxheTpcIm5vbmVcIi4gVGh1cywgd2UgdGVtcG9yYXJpbHlcbiAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlIGRpc3BsYXkgdG8gdGhlIGVsZW1lbnQgdHlwZSdzIGRlZmF1bHQgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgIHZhciB0b2dnbGVEaXNwbGF5ID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKC9eKHdpZHRofGhlaWdodCkkLy50ZXN0KHByb3BlcnR5KSAmJiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIikgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZURpc3BsYXkgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJkaXNwbGF5XCIsIENTUy5WYWx1ZXMuZ2V0RGlzcGxheVR5cGUoZWxlbWVudCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gcmV2ZXJ0RGlzcGxheSAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodG9nZ2xlRGlzcGxheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZvcmNlU3R5bGVMb29rdXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSA9PT0gXCJoZWlnaHRcIiAmJiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJveFNpemluZ1wiKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgIT09IFwiYm9yZGVyLWJveFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRCb3hIZWlnaHQgPSBlbGVtZW50Lm9mZnNldEhlaWdodCAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiYm9yZGVyVG9wV2lkdGhcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJib3JkZXJCb3R0b21XaWR0aFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBhZGRpbmdUb3BcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwYWRkaW5nQm90dG9tXCIpKSB8fCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXZlcnREaXNwbGF5KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudEJveEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09IFwid2lkdGhcIiAmJiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJveFNpemluZ1wiKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgIT09IFwiYm9yZGVyLWJveFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRCb3hXaWR0aCA9IGVsZW1lbnQub2Zmc2V0V2lkdGggLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJvcmRlckxlZnRXaWR0aFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJvcmRlclJpZ2h0V2lkdGhcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwYWRkaW5nTGVmdFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBhZGRpbmdSaWdodFwiKSkgfHwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV2ZXJ0RGlzcGxheSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRCb3hXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIEZvciBlbGVtZW50cyB0aGF0IFZlbG9jaXR5IGhhc24ndCBiZWVuIGNhbGxlZCBvbiBkaXJlY3RseSAoZS5nLiB3aGVuIFZlbG9jaXR5IHF1ZXJpZXMgdGhlIERPTSBvbiBiZWhhbGZcbiAgICAgICAgICAgICAgICAgICAgICAgb2YgYSBwYXJlbnQgb2YgYW4gZWxlbWVudCBpdHMgYW5pbWF0aW5nKSwgcGVyZm9ybSBhIGRpcmVjdCBnZXRDb21wdXRlZFN0eWxlIGxvb2t1cCBzaW5jZSB0aGUgb2JqZWN0IGlzbid0IGNhY2hlZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQsIG51bGwpOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGNvbXB1dGVkU3R5bGUgb2JqZWN0IGhhcyB5ZXQgdG8gYmUgY2FjaGVkLCBkbyBzbyBub3cuICovXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIURhdGEoZWxlbWVudCkuY29tcHV0ZWRTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRTdHlsZSA9IERhdGEoZWxlbWVudCkuY29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQsIG51bGwpOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgLyogSWYgY29tcHV0ZWRTdHlsZSBpcyBjYWNoZWQsIHVzZSBpdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkU3R5bGUgPSBEYXRhKGVsZW1lbnQpLmNvbXB1dGVkU3R5bGU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBJRSBhbmQgRmlyZWZveCBkbyBub3QgcmV0dXJuIGEgdmFsdWUgZm9yIHRoZSBnZW5lcmljIGJvcmRlckNvbG9yIC0tIHRoZXkgb25seSByZXR1cm4gaW5kaXZpZHVhbCB2YWx1ZXMgZm9yIGVhY2ggYm9yZGVyIHNpZGUncyBjb2xvci5cbiAgICAgICAgICAgICAgICAgICAgICAgQWxzbywgaW4gYWxsIGJyb3dzZXJzLCB3aGVuIGJvcmRlciBjb2xvcnMgYXJlbid0IGFsbCB0aGUgc2FtZSwgYSBjb21wb3VuZCB2YWx1ZSBpcyByZXR1cm5lZCB0aGF0IFZlbG9jaXR5IGlzbid0IHNldHVwIHRvIHBhcnNlLlxuICAgICAgICAgICAgICAgICAgICAgICBTbywgYXMgYSBwb2x5ZmlsbCBmb3IgcXVlcnlpbmcgaW5kaXZpZHVhbCBib3JkZXIgc2lkZSBjb2xvcnMsIHdlIGp1c3QgcmV0dXJuIHRoZSB0b3AgYm9yZGVyJ3MgY29sb3IgYW5kIGFuaW1hdGUgYWxsIGJvcmRlcnMgZnJvbSB0aGF0IHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgPT09IFwiYm9yZGVyQ29sb3JcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkgPSBcImJvcmRlclRvcENvbG9yXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBJRTkgaGFzIGEgYnVnIGluIHdoaWNoIHRoZSBcImZpbHRlclwiIHByb3BlcnR5IG11c3QgYmUgYWNjZXNzZWQgZnJvbSBjb21wdXRlZFN0eWxlIHVzaW5nIHRoZSBnZXRQcm9wZXJ0eVZhbHVlIG1ldGhvZFxuICAgICAgICAgICAgICAgICAgICAgICBpbnN0ZWFkIG9mIGEgZGlyZWN0IHByb3BlcnR5IGxvb2t1cC4gVGhlIGdldFByb3BlcnR5VmFsdWUgbWV0aG9kIGlzIHNsb3dlciB0aGFuIGEgZGlyZWN0IGxvb2t1cCwgd2hpY2ggaXMgd2h5IHdlIGF2b2lkIGl0IGJ5IGRlZmF1bHQuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChJRSA9PT0gOSAmJiBwcm9wZXJ0eSA9PT0gXCJmaWx0ZXJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eSk7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9IGNvbXB1dGVkU3R5bGVbcHJvcGVydHldO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogRmFsbCBiYWNrIHRvIHRoZSBwcm9wZXJ0eSdzIHN0eWxlIHZhbHVlIChpZiBkZWZpbmVkKSB3aGVuIGNvbXB1dGVkVmFsdWUgcmV0dXJucyBub3RoaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICB3aGljaCBjYW4gaGFwcGVuIHdoZW4gdGhlIGVsZW1lbnQgaGFzbid0IGJlZW4gcGFpbnRlZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXB1dGVkVmFsdWUgPT09IFwiXCIgfHwgY29tcHV0ZWRWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9IGVsZW1lbnQuc3R5bGVbcHJvcGVydHldO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV2ZXJ0RGlzcGxheSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIEZvciB0b3AsIHJpZ2h0LCBib3R0b20sIGFuZCBsZWZ0IChUUkJMKSB2YWx1ZXMgdGhhdCBhcmUgc2V0IHRvIFwiYXV0b1wiIG9uIGVsZW1lbnRzIG9mIFwiZml4ZWRcIiBvciBcImFic29sdXRlXCIgcG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgZGVmZXIgdG8galF1ZXJ5IGZvciBjb252ZXJ0aW5nIFwiYXV0b1wiIHRvIGEgbnVtZXJpYyB2YWx1ZS4gKEZvciBlbGVtZW50cyB3aXRoIGEgXCJzdGF0aWNcIiBvciBcInJlbGF0aXZlXCIgcG9zaXRpb24sIFwiYXV0b1wiIGhhcyB0aGUgc2FtZVxuICAgICAgICAgICAgICAgICAgIGVmZmVjdCBhcyBiZWluZyBzZXQgdG8gMCwgc28gbm8gY29udmVyc2lvbiBpcyBuZWNlc3NhcnkuKSAqL1xuICAgICAgICAgICAgICAgIC8qIEFuIGV4YW1wbGUgb2Ygd2h5IG51bWVyaWMgY29udmVyc2lvbiBpcyBuZWNlc3Nhcnk6IFdoZW4gYW4gZWxlbWVudCB3aXRoIFwicG9zaXRpb246YWJzb2x1dGVcIiBoYXMgYW4gdW50b3VjaGVkIFwibGVmdFwiXG4gICAgICAgICAgICAgICAgICAgcHJvcGVydHksIHdoaWNoIHJldmVydHMgdG8gXCJhdXRvXCIsIGxlZnQncyB2YWx1ZSBpcyAwIHJlbGF0aXZlIHRvIGl0cyBwYXJlbnQgZWxlbWVudCwgYnV0IGlzIG9mdGVuIG5vbi16ZXJvIHJlbGF0aXZlXG4gICAgICAgICAgICAgICAgICAgdG8gaXRzICpjb250YWluaW5nKiAobm90IHBhcmVudCkgZWxlbWVudCwgd2hpY2ggaXMgdGhlIG5lYXJlc3QgXCJwb3NpdGlvbjpyZWxhdGl2ZVwiIGFuY2VzdG9yIG9yIHRoZSB2aWV3cG9ydCAoYW5kIGFsd2F5cyB0aGUgdmlld3BvcnQgaW4gdGhlIGNhc2Ugb2YgXCJwb3NpdGlvbjpmaXhlZFwiKS4gKi9cbiAgICAgICAgICAgICAgICBpZiAoY29tcHV0ZWRWYWx1ZSA9PT0gXCJhdXRvXCIgJiYgL14odG9wfHJpZ2h0fGJvdHRvbXxsZWZ0KSQvaS50ZXN0KHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zaXRpb24gPSBjb21wdXRlUHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBvc2l0aW9uXCIpOyAvKiBHRVQgKi9cblxuICAgICAgICAgICAgICAgICAgICAvKiBGb3IgYWJzb2x1dGUgcG9zaXRpb25pbmcsIGpRdWVyeSdzICQucG9zaXRpb24oKSBvbmx5IHJldHVybnMgdmFsdWVzIGZvciB0b3AgYW5kIGxlZnQ7XG4gICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0IGFuZCBib3R0b20gd2lsbCBoYXZlIHRoZWlyIFwiYXV0b1wiIHZhbHVlIHJldmVydGVkIHRvIDAuICovXG4gICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IEEgalF1ZXJ5IG9iamVjdCBtdXN0IGJlIGNyZWF0ZWQgaGVyZSBzaW5jZSBqUXVlcnkgZG9lc24ndCBoYXZlIGEgbG93LWxldmVsIGFsaWFzIGZvciAkLnBvc2l0aW9uKCkuXG4gICAgICAgICAgICAgICAgICAgICAgIE5vdCBhIGJpZyBkZWFsIHNpbmNlIHdlJ3JlIGN1cnJlbnRseSBpbiBhIEdFVCBiYXRjaCBhbnl3YXkuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PT0gXCJmaXhlZFwiIHx8IChwb3NpdGlvbiA9PT0gXCJhYnNvbHV0ZVwiICYmIC90b3B8bGVmdC9pLnRlc3QocHJvcGVydHkpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogalF1ZXJ5IHN0cmlwcyB0aGUgcGl4ZWwgdW5pdCBmcm9tIGl0cyByZXR1cm5lZCB2YWx1ZXM7IHdlIHJlLWFkZCBpdCBoZXJlIHRvIGNvbmZvcm0gd2l0aCBjb21wdXRlUHJvcGVydHlWYWx1ZSdzIGJlaGF2aW9yLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9ICQoZWxlbWVudCkucG9zaXRpb24oKVtwcm9wZXJ0eV0gKyBcInB4XCI7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbXB1dGVkVmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwcm9wZXJ0eVZhbHVlO1xuXG4gICAgICAgICAgICAvKiBJZiB0aGlzIGlzIGEgaG9va2VkIHByb3BlcnR5IChlLmcuIFwiY2xpcExlZnRcIiBpbnN0ZWFkIG9mIHRoZSByb290IHByb3BlcnR5IG9mIFwiY2xpcFwiKSxcbiAgICAgICAgICAgICAgIGV4dHJhY3QgdGhlIGhvb2sncyB2YWx1ZSBmcm9tIGEgbm9ybWFsaXplZCByb290UHJvcGVydHlWYWx1ZSB1c2luZyBDU1MuSG9va3MuZXh0cmFjdFZhbHVlKCkuICovXG4gICAgICAgICAgICBpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhvb2sgPSBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAgICAgaG9va1Jvb3QgPSBDU1MuSG9va3MuZ2V0Um9vdChob29rKTtcblxuICAgICAgICAgICAgICAgIC8qIElmIGEgY2FjaGVkIHJvb3RQcm9wZXJ0eVZhbHVlIHdhc24ndCBwYXNzZWQgaW4gKHdoaWNoIFZlbG9jaXR5IGFsd2F5cyBhdHRlbXB0cyB0byBkbyBpbiBvcmRlciB0byBhdm9pZCByZXF1ZXJ5aW5nIHRoZSBET00pLFxuICAgICAgICAgICAgICAgICAgIHF1ZXJ5IHRoZSBET00gZm9yIHRoZSByb290IHByb3BlcnR5J3MgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgaWYgKHJvb3RQcm9wZXJ0eVZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgdGhlIGJyb3dzZXIgaXMgbm93IGJlaW5nIGRpcmVjdGx5IHF1ZXJpZWQsIHVzZSB0aGUgb2ZmaWNpYWwgcG9zdC1wcmVmaXhpbmcgcHJvcGVydHkgbmFtZSBmb3IgdGhpcyBsb29rdXAuICovXG4gICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgQ1NTLk5hbWVzLnByZWZpeENoZWNrKGhvb2tSb290KVswXSk7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgcm9vdCBoYXMgYSBub3JtYWxpemF0aW9uIHJlZ2lzdGVyZWQsIHBlZm9ybSB0aGUgYXNzb2NpYXRlZCBub3JtYWxpemF0aW9uIGV4dHJhY3Rpb24uICovXG4gICAgICAgICAgICAgICAgaWYgKENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW2hvb2tSb290XSkge1xuICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW2hvb2tSb290XShcImV4dHJhY3RcIiwgZWxlbWVudCwgcm9vdFByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIEV4dHJhY3QgdGhlIGhvb2sncyB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLmV4dHJhY3RWYWx1ZShob29rLCByb290UHJvcGVydHlWYWx1ZSk7XG5cbiAgICAgICAgICAgIC8qIElmIHRoaXMgaXMgYSBub3JtYWxpemVkIHByb3BlcnR5IChlLmcuIFwib3BhY2l0eVwiIGJlY29tZXMgXCJmaWx0ZXJcIiBpbiA8PUlFOCkgb3IgXCJ0cmFuc2xhdGVYXCIgYmVjb21lcyBcInRyYW5zZm9ybVwiKSxcbiAgICAgICAgICAgICAgIG5vcm1hbGl6ZSB0aGUgcHJvcGVydHkncyBuYW1lIGFuZCB2YWx1ZSwgYW5kIGhhbmRsZSB0aGUgc3BlY2lhbCBjYXNlIG9mIHRyYW5zZm9ybXMuICovXG4gICAgICAgICAgICAvKiBOb3RlOiBOb3JtYWxpemluZyBhIHByb3BlcnR5IGlzIG11dHVhbGx5IGV4Y2x1c2l2ZSBmcm9tIGhvb2tpbmcgYSBwcm9wZXJ0eSBzaW5jZSBob29rLWV4dHJhY3RlZCB2YWx1ZXMgYXJlIHN0cmljdGx5XG4gICAgICAgICAgICAgICBudW1lcmljYWwgYW5kIHRoZXJlZm9yZSBkbyBub3QgcmVxdWlyZSBub3JtYWxpemF0aW9uIGV4dHJhY3Rpb24uICovXG4gICAgICAgICAgICB9IGVsc2UgaWYgKENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgICAgIHZhciBub3JtYWxpemVkUHJvcGVydHlOYW1lLFxuICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcGVydHlWYWx1ZTtcblxuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wZXJ0eU5hbWUgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJuYW1lXCIsIGVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtIHZhbHVlcyBhcmUgY2FsY3VsYXRlZCB2aWEgbm9ybWFsaXphdGlvbiBleHRyYWN0aW9uIChzZWUgYmVsb3cpLCB3aGljaCBjaGVja3MgYWdhaW5zdCB0aGUgZWxlbWVudCdzIHRyYW5zZm9ybUNhY2hlLlxuICAgICAgICAgICAgICAgICAgIEF0IG5vIHBvaW50IGRvIHRyYW5zZm9ybSBHRVRzIGV2ZXIgYWN0dWFsbHkgcXVlcnkgdGhlIERPTTsgaW5pdGlhbCBzdHlsZXNoZWV0IHZhbHVlcyBhcmUgbmV2ZXIgcHJvY2Vzc2VkLlxuICAgICAgICAgICAgICAgICAgIFRoaXMgaXMgYmVjYXVzZSBwYXJzaW5nIDNEIHRyYW5zZm9ybSBtYXRyaWNlcyBpcyBub3QgYWx3YXlzIGFjY3VyYXRlIGFuZCB3b3VsZCBibG9hdCBvdXIgY29kZWJhc2U7XG4gICAgICAgICAgICAgICAgICAgdGh1cywgbm9ybWFsaXphdGlvbiBleHRyYWN0aW9uIGRlZmF1bHRzIGluaXRpYWwgdHJhbnNmb3JtIHZhbHVlcyB0byB0aGVpciB6ZXJvLXZhbHVlcyAoZS5nLiAxIGZvciBzY2FsZVggYW5kIDAgZm9yIHRyYW5zbGF0ZVgpLiAqL1xuICAgICAgICAgICAgICAgIGlmIChub3JtYWxpemVkUHJvcGVydHlOYW1lICE9PSBcInRyYW5zZm9ybVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wZXJ0eVZhbHVlID0gY29tcHV0ZVByb3BlcnR5VmFsdWUoZWxlbWVudCwgQ1NTLk5hbWVzLnByZWZpeENoZWNrKG5vcm1hbGl6ZWRQcm9wZXJ0eU5hbWUpWzBdKTsgLyogR0VUICovXG5cbiAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIHZhbHVlIGlzIGEgQ1NTIG51bGwtdmFsdWUgYW5kIHRoaXMgcHJvcGVydHkgaGFzIGEgaG9vayB0ZW1wbGF0ZSwgdXNlIHRoYXQgemVyby12YWx1ZSB0ZW1wbGF0ZSBzbyB0aGF0IGhvb2tzIGNhbiBiZSBleHRyYWN0ZWQgZnJvbSBpdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5WYWx1ZXMuaXNDU1NOdWxsVmFsdWUobm9ybWFsaXplZFByb3BlcnR5VmFsdWUpICYmIENTUy5Ib29rcy50ZW1wbGF0ZXNbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy50ZW1wbGF0ZXNbcHJvcGVydHldWzFdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcImV4dHJhY3RcIiwgZWxlbWVudCwgbm9ybWFsaXplZFByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBJZiBhIChudW1lcmljKSB2YWx1ZSB3YXNuJ3QgcHJvZHVjZWQgdmlhIGhvb2sgZXh0cmFjdGlvbiBvciBub3JtYWxpemF0aW9uLCBxdWVyeSB0aGUgRE9NLiAqL1xuICAgICAgICAgICAgaWYgKCEvXltcXGQtXS8udGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgIC8qIEZvciBTVkcgZWxlbWVudHMsIGRpbWVuc2lvbmFsIHByb3BlcnRpZXMgKHdoaWNoIFNWR0F0dHJpYnV0ZSgpIGRldGVjdHMpIGFyZSB0d2VlbmVkIHZpYVxuICAgICAgICAgICAgICAgICAgIHRoZWlyIEhUTUwgYXR0cmlidXRlIHZhbHVlcyBpbnN0ZWFkIG9mIHRoZWlyIENTUyBzdHlsZSB2YWx1ZXMuICovXG4gICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgJiYgRGF0YShlbGVtZW50KS5pc1NWRyAmJiBDU1MuTmFtZXMuU1ZHQXR0cmlidXRlKHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGUgaGVpZ2h0L3dpZHRoIGF0dHJpYnV0ZSB2YWx1ZXMgbXVzdCBiZSBzZXQgbWFudWFsbHksIHRoZXkgZG9uJ3QgcmVmbGVjdCBjb21wdXRlZCB2YWx1ZXMuXG4gICAgICAgICAgICAgICAgICAgICAgIFRodXMsIHdlIHVzZSB1c2UgZ2V0QkJveCgpIHRvIGVuc3VyZSB3ZSBhbHdheXMgZ2V0IHZhbHVlcyBmb3IgZWxlbWVudHMgd2l0aCB1bmRlZmluZWQgaGVpZ2h0L3dpZHRoIGF0dHJpYnV0ZXMuICovXG4gICAgICAgICAgICAgICAgICAgIGlmICgvXihoZWlnaHR8d2lkdGgpJC9pLnRlc3QocHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBGaXJlZm94IHRocm93cyBhbiBlcnJvciBpZiAuZ2V0QkJveCgpIGlzIGNhbGxlZCBvbiBhbiBTVkcgdGhhdCBpc24ndCBhdHRhY2hlZCB0byB0aGUgRE9NLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gZWxlbWVudC5nZXRCQm94KClbcHJvcGVydHldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLyogT3RoZXJ3aXNlLCBhY2Nlc3MgdGhlIGF0dHJpYnV0ZSB2YWx1ZSBkaXJlY3RseS4gKi9cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShwcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gY29tcHV0ZVByb3BlcnR5VmFsdWUoZWxlbWVudCwgQ1NTLk5hbWVzLnByZWZpeENoZWNrKHByb3BlcnR5KVswXSk7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogU2luY2UgcHJvcGVydHkgbG9va3VwcyBhcmUgZm9yIGFuaW1hdGlvbiBwdXJwb3NlcyAod2hpY2ggZW50YWlscyBjb21wdXRpbmcgdGhlIG51bWVyaWMgZGVsdGEgYmV0d2VlbiBzdGFydCBhbmQgZW5kIHZhbHVlcyksXG4gICAgICAgICAgICAgICBjb252ZXJ0IENTUyBudWxsLXZhbHVlcyB0byBhbiBpbnRlZ2VyIG9mIHZhbHVlIDAuICovXG4gICAgICAgICAgICBpZiAoQ1NTLlZhbHVlcy5pc0NTU051bGxWYWx1ZShwcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoVmVsb2NpdHkuZGVidWcgPj0gMikgY29uc29sZS5sb2coXCJHZXQgXCIgKyBwcm9wZXJ0eSArIFwiOiBcIiArIHByb3BlcnR5VmFsdWUpO1xuXG4gICAgICAgICAgICByZXR1cm4gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiBUaGUgc2luZ3VsYXIgc2V0UHJvcGVydHlWYWx1ZSwgd2hpY2ggcm91dGVzIHRoZSBsb2dpYyBmb3IgYWxsIG5vcm1hbGl6YXRpb25zLCBob29rcywgYW5kIHN0YW5kYXJkIENTUyBwcm9wZXJ0aWVzLiAqL1xuICAgICAgICBzZXRQcm9wZXJ0eVZhbHVlOiBmdW5jdGlvbihlbGVtZW50LCBwcm9wZXJ0eSwgcHJvcGVydHlWYWx1ZSwgcm9vdFByb3BlcnR5VmFsdWUsIHNjcm9sbERhdGEpIHtcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0eU5hbWUgPSBwcm9wZXJ0eTtcblxuICAgICAgICAgICAgLyogSW4gb3JkZXIgdG8gYmUgc3ViamVjdGVkIHRvIGNhbGwgb3B0aW9ucyBhbmQgZWxlbWVudCBxdWV1ZWluZywgc2Nyb2xsIGFuaW1hdGlvbiBpcyByb3V0ZWQgdGhyb3VnaCBWZWxvY2l0eSBhcyBpZiBpdCB3ZXJlIGEgc3RhbmRhcmQgQ1NTIHByb3BlcnR5LiAqL1xuICAgICAgICAgICAgaWYgKHByb3BlcnR5ID09PSBcInNjcm9sbFwiKSB7XG4gICAgICAgICAgICAgICAgLyogSWYgYSBjb250YWluZXIgb3B0aW9uIGlzIHByZXNlbnQsIHNjcm9sbCB0aGUgY29udGFpbmVyIGluc3RlYWQgb2YgdGhlIGJyb3dzZXIgd2luZG93LiAqL1xuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxEYXRhLmNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICBzY3JvbGxEYXRhLmNvbnRhaW5lcltcInNjcm9sbFwiICsgc2Nyb2xsRGF0YS5kaXJlY3Rpb25dID0gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgICAgICAvKiBPdGhlcndpc2UsIFZlbG9jaXR5IGRlZmF1bHRzIHRvIHNjcm9sbGluZyB0aGUgYnJvd3NlciB3aW5kb3cuICovXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjcm9sbERhdGEuZGlyZWN0aW9uID09PSBcIkxlZnRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKHByb3BlcnR5VmFsdWUsIHNjcm9sbERhdGEuYWx0ZXJuYXRlVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKHNjcm9sbERhdGEuYWx0ZXJuYXRlVmFsdWUsIHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm1zICh0cmFuc2xhdGVYLCByb3RhdGVaLCBldGMuKSBhcmUgYXBwbGllZCB0byBhIHBlci1lbGVtZW50IHRyYW5zZm9ybUNhY2hlIG9iamVjdCwgd2hpY2ggaXMgbWFudWFsbHkgZmx1c2hlZCB2aWEgZmx1c2hUcmFuc2Zvcm1DYWNoZSgpLlxuICAgICAgICAgICAgICAgICAgIFRodXMsIGZvciBub3csIHdlIG1lcmVseSBjYWNoZSB0cmFuc2Zvcm1zIGJlaW5nIFNFVC4gKi9cbiAgICAgICAgICAgICAgICBpZiAoQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldICYmIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcIm5hbWVcIiwgZWxlbWVudCkgPT09IFwidHJhbnNmb3JtXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogUGVyZm9ybSBhIG5vcm1hbGl6YXRpb24gaW5qZWN0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBUaGUgbm9ybWFsaXphdGlvbiBsb2dpYyBoYW5kbGVzIHRoZSB0cmFuc2Zvcm1DYWNoZSB1cGRhdGluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKFwiaW5qZWN0XCIsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IFwidHJhbnNmb3JtXCI7XG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvKiBJbmplY3QgaG9va3MuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChDU1MuSG9va3MucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBob29rTmFtZSA9IHByb3BlcnR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tSb290ID0gQ1NTLkhvb2tzLmdldFJvb3QocHJvcGVydHkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBhIGNhY2hlZCByb290UHJvcGVydHlWYWx1ZSB3YXMgbm90IHByb3ZpZGVkLCBxdWVyeSB0aGUgRE9NIGZvciB0aGUgaG9va1Jvb3QncyBjdXJyZW50IHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSByb290UHJvcGVydHlWYWx1ZSB8fCBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBob29rUm9vdCk7IC8qIEdFVCAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLmluamVjdFZhbHVlKGhvb2tOYW1lLCBwcm9wZXJ0eVZhbHVlLCByb290UHJvcGVydHlWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IGhvb2tSb290O1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogTm9ybWFsaXplIG5hbWVzIGFuZCB2YWx1ZXMuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJpbmplY3RcIiwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcIm5hbWVcIiwgZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBBc3NpZ24gdGhlIGFwcHJvcHJpYXRlIHZlbmRvciBwcmVmaXggYmVmb3JlIHBlcmZvcm1pbmcgYW4gb2ZmaWNpYWwgc3R5bGUgdXBkYXRlLiAqL1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBDU1MuTmFtZXMucHJlZml4Q2hlY2socHJvcGVydHkpWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIEEgdHJ5L2NhdGNoIGlzIHVzZWQgZm9yIElFPD04LCB3aGljaCB0aHJvd3MgYW4gZXJyb3Igd2hlbiBcImludmFsaWRcIiBDU1MgdmFsdWVzIGFyZSBzZXQsIGUuZy4gYSBuZWdhdGl2ZSB3aWR0aC5cbiAgICAgICAgICAgICAgICAgICAgICAgVHJ5L2NhdGNoIGlzIGF2b2lkZWQgZm9yIG90aGVyIGJyb3dzZXJzIHNpbmNlIGl0IGluY3VycyBhIHBlcmZvcm1hbmNlIG92ZXJoZWFkLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoSUUgPD0gOCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlW3Byb3BlcnR5TmFtZV0gPSBwcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHsgaWYgKFZlbG9jaXR5LmRlYnVnKSBjb25zb2xlLmxvZyhcIkJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBbXCIgKyBwcm9wZXJ0eVZhbHVlICsgXCJdIGZvciBbXCIgKyBwcm9wZXJ0eU5hbWUgKyBcIl1cIik7IH1cbiAgICAgICAgICAgICAgICAgICAgLyogU1ZHIGVsZW1lbnRzIGhhdmUgdGhlaXIgZGltZW5zaW9uYWwgcHJvcGVydGllcyAod2lkdGgsIGhlaWdodCwgeCwgeSwgY3gsIGV0Yy4pIGFwcGxpZWQgZGlyZWN0bHkgYXMgYXR0cmlidXRlcyBpbnN0ZWFkIG9mIGFzIHN0eWxlcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogSUU4IGRvZXMgbm90IHN1cHBvcnQgU1ZHIGVsZW1lbnRzLCBzbyBpdCdzIG9rYXkgdGhhdCB3ZSBza2lwIGl0IGZvciBTVkcgYW5pbWF0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKERhdGEoZWxlbWVudCkgJiYgRGF0YShlbGVtZW50KS5pc1NWRyAmJiBDU1MuTmFtZXMuU1ZHQXR0cmlidXRlKHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogRm9yIFNWRyBhdHRyaWJ1dGVzLCB2ZW5kb3ItcHJlZml4ZWQgcHJvcGVydHkgbmFtZXMgYXJlIG5ldmVyIHVzZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBOb3QgYWxsIENTUyBwcm9wZXJ0aWVzIGNhbiBiZSBhbmltYXRlZCB2aWEgYXR0cmlidXRlcywgYnV0IHRoZSBicm93c2VyIHdvbid0IHRocm93IGFuIGVycm9yIGZvciB1bnN1cHBvcnRlZCBwcm9wZXJ0aWVzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUocHJvcGVydHksIHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZVtwcm9wZXJ0eU5hbWVdID0gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZyA+PSAyKSBjb25zb2xlLmxvZyhcIlNldCBcIiArIHByb3BlcnR5ICsgXCIgKFwiICsgcHJvcGVydHlOYW1lICsgXCIpOiBcIiArIHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogUmV0dXJuIHRoZSBub3JtYWxpemVkIHByb3BlcnR5IG5hbWUgYW5kIHZhbHVlIGluIGNhc2UgdGhlIGNhbGxlciB3YW50cyB0byBrbm93IGhvdyB0aGVzZSB2YWx1ZXMgd2VyZSBtb2RpZmllZCBiZWZvcmUgYmVpbmcgYXBwbGllZCB0byB0aGUgRE9NLiAqL1xuICAgICAgICAgICAgcmV0dXJuIFsgcHJvcGVydHlOYW1lLCBwcm9wZXJ0eVZhbHVlIF07XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyogVG8gaW5jcmVhc2UgcGVyZm9ybWFuY2UgYnkgYmF0Y2hpbmcgdHJhbnNmb3JtIHVwZGF0ZXMgaW50byBhIHNpbmdsZSBTRVQsIHRyYW5zZm9ybXMgYXJlIG5vdCBkaXJlY3RseSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQgdW50aWwgZmx1c2hUcmFuc2Zvcm1DYWNoZSgpIGlzIGNhbGxlZC4gKi9cbiAgICAgICAgLyogTm90ZTogVmVsb2NpdHkgYXBwbGllcyB0cmFuc2Zvcm0gcHJvcGVydGllcyBpbiB0aGUgc2FtZSBvcmRlciB0aGF0IHRoZXkgYXJlIGNocm9ub2dpY2FsbHkgaW50cm9kdWNlZCB0byB0aGUgZWxlbWVudCdzIENTUyBzdHlsZXMuICovXG4gICAgICAgIGZsdXNoVHJhbnNmb3JtQ2FjaGU6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1TdHJpbmcgPSBcIlwiO1xuXG4gICAgICAgICAgICAvKiBDZXJ0YWluIGJyb3dzZXJzIHJlcXVpcmUgdGhhdCBTVkcgdHJhbnNmb3JtcyBiZSBhcHBsaWVkIGFzIGFuIGF0dHJpYnV0ZS4gSG93ZXZlciwgdGhlIFNWRyB0cmFuc2Zvcm0gYXR0cmlidXRlIHRha2VzIGEgbW9kaWZpZWQgdmVyc2lvbiBvZiBDU1MncyB0cmFuc2Zvcm0gc3RyaW5nXG4gICAgICAgICAgICAgICAodW5pdHMgYXJlIGRyb3BwZWQgYW5kLCBleGNlcHQgZm9yIHNrZXdYL1ksIHN1YnByb3BlcnRpZXMgYXJlIG1lcmdlZCBpbnRvIHRoZWlyIG1hc3RlciBwcm9wZXJ0eSAtLSBlLmcuIHNjYWxlWCBhbmQgc2NhbGVZIGFyZSBtZXJnZWQgaW50byBzY2FsZShYIFkpLiAqL1xuICAgICAgICAgICAgaWYgKChJRSB8fCAoVmVsb2NpdHkuU3RhdGUuaXNBbmRyb2lkICYmICFWZWxvY2l0eS5TdGF0ZS5pc0Nocm9tZSkpICYmIERhdGEoZWxlbWVudCkuaXNTVkcpIHtcbiAgICAgICAgICAgICAgICAvKiBTaW5jZSB0cmFuc2Zvcm0gdmFsdWVzIGFyZSBzdG9yZWQgaW4gdGhlaXIgcGFyZW50aGVzZXMtd3JhcHBlZCBmb3JtLCB3ZSB1c2UgYSBoZWxwZXIgZnVuY3Rpb24gdG8gc3RyaXAgb3V0IHRoZWlyIG51bWVyaWMgdmFsdWVzLlxuICAgICAgICAgICAgICAgICAgIEZ1cnRoZXIsIFNWRyB0cmFuc2Zvcm0gcHJvcGVydGllcyBvbmx5IHRha2UgdW5pdGxlc3MgKHJlcHJlc2VudGluZyBwaXhlbHMpIHZhbHVlcywgc28gaXQncyBva2F5IHRoYXQgcGFyc2VGbG9hdCgpIHN0cmlwcyB0aGUgdW5pdCBzdWZmaXhlZCB0byB0aGUgZmxvYXQgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0VHJhbnNmb3JtRmxvYXQgKHRyYW5zZm9ybVByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIHRyYW5zZm9ybVByb3BlcnR5KSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogQ3JlYXRlIGFuIG9iamVjdCB0byBvcmdhbml6ZSBhbGwgdGhlIHRyYW5zZm9ybXMgdGhhdCB3ZSdsbCBhcHBseSB0byB0aGUgU1ZHIGVsZW1lbnQuIFRvIGtlZXAgdGhlIGxvZ2ljIHNpbXBsZSxcbiAgICAgICAgICAgICAgICAgICB3ZSBwcm9jZXNzICphbGwqIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIC0tIGV2ZW4gdGhvc2UgdGhhdCBtYXkgbm90IGJlIGV4cGxpY2l0bHkgYXBwbGllZCAoc2luY2UgdGhleSBkZWZhdWx0IHRvIHRoZWlyIHplcm8tdmFsdWVzIGFueXdheSkuICovXG4gICAgICAgICAgICAgICAgdmFyIFNWR1RyYW5zZm9ybXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0ZTogWyBnZXRUcmFuc2Zvcm1GbG9hdChcInRyYW5zbGF0ZVhcIiksIGdldFRyYW5zZm9ybUZsb2F0KFwidHJhbnNsYXRlWVwiKSBdLFxuICAgICAgICAgICAgICAgICAgICBza2V3WDogWyBnZXRUcmFuc2Zvcm1GbG9hdChcInNrZXdYXCIpIF0sIHNrZXdZOiBbIGdldFRyYW5zZm9ybUZsb2F0KFwic2tld1lcIikgXSxcbiAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIHNjYWxlIHByb3BlcnR5IGlzIHNldCAobm9uLTEpLCB1c2UgdGhhdCB2YWx1ZSBmb3IgdGhlIHNjYWxlWCBhbmQgc2NhbGVZIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICAodGhpcyBiZWhhdmlvciBtaW1pY3MgdGhlIHJlc3VsdCBvZiBhbmltYXRpbmcgYWxsIHRoZXNlIHByb3BlcnRpZXMgYXQgb25jZSBvbiBIVE1MIGVsZW1lbnRzKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgc2NhbGU6IGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVcIikgIT09IDEgPyBbIGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVcIiksIGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVcIikgXSA6IFsgZ2V0VHJhbnNmb3JtRmxvYXQoXCJzY2FsZVhcIiksIGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVZXCIpIF0sXG4gICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFNWRydzIHJvdGF0ZSB0cmFuc2Zvcm0gdGFrZXMgdGhyZWUgdmFsdWVzOiByb3RhdGlvbiBkZWdyZWVzIGZvbGxvd2VkIGJ5IHRoZSBYIGFuZCBZIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICBkZWZpbmluZyB0aGUgcm90YXRpb24ncyBvcmlnaW4gcG9pbnQuIFdlIGlnbm9yZSB0aGUgb3JpZ2luIHZhbHVlcyAoZGVmYXVsdCB0aGVtIHRvIDApLiAqL1xuICAgICAgICAgICAgICAgICAgICByb3RhdGU6IFsgZ2V0VHJhbnNmb3JtRmxvYXQoXCJyb3RhdGVaXCIpLCAwLCAwIF1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIHRoZSB0cmFuc2Zvcm0gcHJvcGVydGllcyBpbiB0aGUgdXNlci1kZWZpbmVkIHByb3BlcnR5IG1hcCBvcmRlci5cbiAgICAgICAgICAgICAgICAgICAoVGhpcyBtaW1pY3MgdGhlIGJlaGF2aW9yIG9mIG5vbi1TVkcgdHJhbnNmb3JtIGFuaW1hdGlvbi4pICovXG4gICAgICAgICAgICAgICAgJC5lYWNoKERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGUsIGZ1bmN0aW9uKHRyYW5zZm9ybU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogRXhjZXB0IGZvciB3aXRoIHNrZXdYL1ksIHJldmVydCB0aGUgYXhpcy1zcGVjaWZpYyB0cmFuc2Zvcm0gc3VicHJvcGVydGllcyB0byB0aGVpciBheGlzLWZyZWUgbWFzdGVyXG4gICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgc28gdGhhdCB0aGV5IG1hdGNoIHVwIHdpdGggU1ZHJ3MgYWNjZXB0ZWQgdHJhbnNmb3JtIHByb3BlcnRpZXMuICovXG4gICAgICAgICAgICAgICAgICAgIGlmICgvXnRyYW5zbGF0ZS9pLnRlc3QodHJhbnNmb3JtTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybU5hbWUgPSBcInRyYW5zbGF0ZVwiO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9ec2NhbGUvaS50ZXN0KHRyYW5zZm9ybU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1OYW1lID0gXCJzY2FsZVwiO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9ecm90YXRlL2kudGVzdCh0cmFuc2Zvcm1OYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtTmFtZSA9IFwicm90YXRlXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBDaGVjayB0aGF0IHdlIGhhdmVuJ3QgeWV0IGRlbGV0ZWQgdGhlIHByb3BlcnR5IGZyb20gdGhlIFNWR1RyYW5zZm9ybXMgY29udGFpbmVyLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoU1ZHVHJhbnNmb3Jtc1t0cmFuc2Zvcm1OYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogQXBwZW5kIHRoZSB0cmFuc2Zvcm0gcHJvcGVydHkgaW4gdGhlIFNWRy1zdXBwb3J0ZWQgdHJhbnNmb3JtIGZvcm1hdC4gQXMgcGVyIHRoZSBzcGVjLCBzdXJyb3VuZCB0aGUgc3BhY2UtZGVsaW1pdGVkIHZhbHVlcyBpbiBwYXJlbnRoZXNlcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVN0cmluZyArPSB0cmFuc2Zvcm1OYW1lICsgXCIoXCIgKyBTVkdUcmFuc2Zvcm1zW3RyYW5zZm9ybU5hbWVdLmpvaW4oXCIgXCIpICsgXCIpXCIgKyBcIiBcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogQWZ0ZXIgcHJvY2Vzc2luZyBhbiBTVkcgdHJhbnNmb3JtIHByb3BlcnR5LCBkZWxldGUgaXQgZnJvbSB0aGUgU1ZHVHJhbnNmb3JtcyBjb250YWluZXIgc28gd2UgZG9uJ3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlLWluc2VydCB0aGUgc2FtZSBtYXN0ZXIgcHJvcGVydHkgaWYgd2UgZW5jb3VudGVyIGFub3RoZXIgb25lIG9mIGl0cyBheGlzLXNwZWNpZmljIHByb3BlcnRpZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgU1ZHVHJhbnNmb3Jtc1t0cmFuc2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgdHJhbnNmb3JtVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIHBlcnNwZWN0aXZlO1xuXG4gICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtIHByb3BlcnRpZXMgYXJlIHN0b3JlZCBhcyBtZW1iZXJzIG9mIHRoZSB0cmFuc2Zvcm1DYWNoZSBvYmplY3QuIENvbmNhdGVuYXRlIGFsbCB0aGUgbWVtYmVycyBpbnRvIGEgc3RyaW5nLiAqL1xuICAgICAgICAgICAgICAgICQuZWFjaChEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlLCBmdW5jdGlvbih0cmFuc2Zvcm1OYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVZhbHVlID0gRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm0ncyBwZXJzcGVjdGl2ZSBzdWJwcm9wZXJ0eSBtdXN0IGJlIHNldCBmaXJzdCBpbiBvcmRlciB0byB0YWtlIGVmZmVjdC4gU3RvcmUgaXQgdGVtcG9yYXJpbHkuICovXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1OYW1lID09PSBcInRyYW5zZm9ybVBlcnNwZWN0aXZlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlcnNwZWN0aXZlID0gdHJhbnNmb3JtVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIElFOSBvbmx5IHN1cHBvcnRzIG9uZSByb3RhdGlvbiB0eXBlLCByb3RhdGVaLCB3aGljaCBpdCByZWZlcnMgdG8gYXMgXCJyb3RhdGVcIi4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKElFID09PSA5ICYmIHRyYW5zZm9ybU5hbWUgPT09IFwicm90YXRlWlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1OYW1lID0gXCJyb3RhdGVcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVN0cmluZyArPSB0cmFuc2Zvcm1OYW1lICsgdHJhbnNmb3JtVmFsdWUgKyBcIiBcIjtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8qIElmIHByZXNlbnQsIHNldCB0aGUgcGVyc3BlY3RpdmUgc3VicHJvcGVydHkgZmlyc3QuICovXG4gICAgICAgICAgICAgICAgaWYgKHBlcnNwZWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVN0cmluZyA9IFwicGVyc3BlY3RpdmVcIiArIHBlcnNwZWN0aXZlICsgXCIgXCIgKyB0cmFuc2Zvcm1TdHJpbmc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInRyYW5zZm9ybVwiLCB0cmFuc2Zvcm1TdHJpbmcpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qIFJlZ2lzdGVyIGhvb2tzIGFuZCBub3JtYWxpemF0aW9ucy4gKi9cbiAgICBDU1MuSG9va3MucmVnaXN0ZXIoKTtcbiAgICBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXIoKTtcblxuICAgIC8qIEFsbG93IGhvb2sgc2V0dGluZyBpbiB0aGUgc2FtZSBmYXNoaW9uIGFzIGpRdWVyeSdzICQuY3NzKCkuICovXG4gICAgVmVsb2NpdHkuaG9vayA9IGZ1bmN0aW9uIChlbGVtZW50cywgYXJnMiwgYXJnMykge1xuICAgICAgICB2YXIgdmFsdWUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgZWxlbWVudHMgPSBzYW5pdGl6ZUVsZW1lbnRzKGVsZW1lbnRzKTtcblxuICAgICAgICAkLmVhY2goZWxlbWVudHMsIGZ1bmN0aW9uKGksIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIC8qIEluaXRpYWxpemUgVmVsb2NpdHkncyBwZXItZWxlbWVudCBkYXRhIGNhY2hlIGlmIHRoaXMgZWxlbWVudCBoYXNuJ3QgcHJldmlvdXNseSBiZWVuIGFuaW1hdGVkLiAqL1xuICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIFZlbG9jaXR5LmluaXQoZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIEdldCBwcm9wZXJ0eSB2YWx1ZS4gSWYgYW4gZWxlbWVudCBzZXQgd2FzIHBhc3NlZCBpbiwgb25seSByZXR1cm4gdGhlIHZhbHVlIGZvciB0aGUgZmlyc3QgZWxlbWVudC4gKi9cbiAgICAgICAgICAgIGlmIChhcmczID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IFZlbG9jaXR5LkNTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIGFyZzIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIFNldCBwcm9wZXJ0eSB2YWx1ZS4gKi9cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLyogc1BWIHJldHVybnMgYW4gYXJyYXkgb2YgdGhlIG5vcm1hbGl6ZWQgcHJvcGVydHlOYW1lL3Byb3BlcnR5VmFsdWUgcGFpciB1c2VkIHRvIHVwZGF0ZSB0aGUgRE9NLiAqL1xuICAgICAgICAgICAgICAgIHZhciBhZGp1c3RlZFNldCA9IFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIGFyZzIsIGFyZzMpO1xuXG4gICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtIHByb3BlcnRpZXMgZG9uJ3QgYXV0b21hdGljYWxseSBzZXQuIFRoZXkgaGF2ZSB0byBiZSBmbHVzaGVkIHRvIHRoZSBET00uICovXG4gICAgICAgICAgICAgICAgaWYgKGFkanVzdGVkU2V0WzBdID09PSBcInRyYW5zZm9ybVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5mbHVzaFRyYW5zZm9ybUNhY2hlKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhbHVlID0gYWRqdXN0ZWRTZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqXG4gICAgICAgIEFuaW1hdGlvblxuICAgICoqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyIGFuaW1hdGUgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICBDYWxsIENoYWluXG4gICAgICAgICoqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAvKiBMb2dpYyBmb3IgZGV0ZXJtaW5pbmcgd2hhdCB0byByZXR1cm4gdG8gdGhlIGNhbGwgc3RhY2sgd2hlbiBleGl0aW5nIG91dCBvZiBWZWxvY2l0eS4gKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0Q2hhaW4gKCkge1xuICAgICAgICAgICAgLyogSWYgd2UgYXJlIHVzaW5nIHRoZSB1dGlsaXR5IGZ1bmN0aW9uLCBhdHRlbXB0IHRvIHJldHVybiB0aGlzIGNhbGwncyBwcm9taXNlLiBJZiBubyBwcm9taXNlIGxpYnJhcnkgd2FzIGRldGVjdGVkLFxuICAgICAgICAgICAgICAgZGVmYXVsdCB0byBudWxsIGluc3RlYWQgb2YgcmV0dXJuaW5nIHRoZSB0YXJnZXRlZCBlbGVtZW50cyBzbyB0aGF0IHV0aWxpdHkgZnVuY3Rpb24ncyByZXR1cm4gdmFsdWUgaXMgc3RhbmRhcmRpemVkLiAqL1xuICAgICAgICAgICAgaWYgKGlzVXRpbGl0eSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlRGF0YS5wcm9taXNlIHx8IG51bGw7XG4gICAgICAgICAgICAvKiBPdGhlcndpc2UsIGlmIHdlJ3JlIHVzaW5nICQuZm4sIHJldHVybiB0aGUgalF1ZXJ5LS9aZXB0by13cmFwcGVkIGVsZW1lbnQgc2V0LiAqL1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudHNXcmFwcGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgQXJndW1lbnRzIEFzc2lnbm1lbnRcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAvKiBUbyBhbGxvdyBmb3IgZXhwcmVzc2l2ZSBDb2ZmZWVTY3JpcHQgY29kZSwgVmVsb2NpdHkgc3VwcG9ydHMgYW4gYWx0ZXJuYXRpdmUgc3ludGF4IGluIHdoaWNoIFwiZWxlbWVudHNcIiAob3IgXCJlXCIpLCBcInByb3BlcnRpZXNcIiAob3IgXCJwXCIpLCBhbmQgXCJvcHRpb25zXCIgKG9yIFwib1wiKVxuICAgICAgICAgICBvYmplY3RzIGFyZSBkZWZpbmVkIG9uIGEgY29udGFpbmVyIG9iamVjdCB0aGF0J3MgcGFzc2VkIGluIGFzIFZlbG9jaXR5J3Mgc29sZSBhcmd1bWVudC4gKi9cbiAgICAgICAgLyogTm90ZTogU29tZSBicm93c2VycyBhdXRvbWF0aWNhbGx5IHBvcHVsYXRlIGFyZ3VtZW50cyB3aXRoIGEgXCJwcm9wZXJ0aWVzXCIgb2JqZWN0LiBXZSBkZXRlY3QgaXQgYnkgY2hlY2tpbmcgZm9yIGl0cyBkZWZhdWx0IFwibmFtZXNcIiBwcm9wZXJ0eS4gKi9cbiAgICAgICAgdmFyIHN5bnRhY3RpY1N1Z2FyID0gKGFyZ3VtZW50c1swXSAmJiAoYXJndW1lbnRzWzBdLnAgfHwgKCgkLmlzUGxhaW5PYmplY3QoYXJndW1lbnRzWzBdLnByb3BlcnRpZXMpICYmICFhcmd1bWVudHNbMF0ucHJvcGVydGllcy5uYW1lcykgfHwgVHlwZS5pc1N0cmluZyhhcmd1bWVudHNbMF0ucHJvcGVydGllcykpKSksXG4gICAgICAgICAgICAvKiBXaGV0aGVyIFZlbG9jaXR5IHdhcyBjYWxsZWQgdmlhIHRoZSB1dGlsaXR5IGZ1bmN0aW9uIChhcyBvcHBvc2VkIHRvIG9uIGEgalF1ZXJ5L1plcHRvIG9iamVjdCkuICovXG4gICAgICAgICAgICBpc1V0aWxpdHksXG4gICAgICAgICAgICAvKiBXaGVuIFZlbG9jaXR5IGlzIGNhbGxlZCB2aWEgdGhlIHV0aWxpdHkgZnVuY3Rpb24gKCQuVmVsb2NpdHkoKS9WZWxvY2l0eSgpKSwgZWxlbWVudHMgYXJlIGV4cGxpY2l0bHlcbiAgICAgICAgICAgICAgIHBhc3NlZCBpbiBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyLiBUaHVzLCBhcmd1bWVudCBwb3NpdGlvbmluZyB2YXJpZXMuIFdlIG5vcm1hbGl6ZSB0aGVtIGhlcmUuICovXG4gICAgICAgICAgICBlbGVtZW50c1dyYXBwZWQsXG4gICAgICAgICAgICBhcmd1bWVudEluZGV4O1xuXG4gICAgICAgIHZhciBlbGVtZW50cyxcbiAgICAgICAgICAgIHByb3BlcnRpZXNNYXAsXG4gICAgICAgICAgICBvcHRpb25zO1xuXG4gICAgICAgIC8qIERldGVjdCBqUXVlcnkvWmVwdG8gZWxlbWVudHMgYmVpbmcgYW5pbWF0ZWQgdmlhIHRoZSAkLmZuIG1ldGhvZC4gKi9cbiAgICAgICAgaWYgKFR5cGUuaXNXcmFwcGVkKHRoaXMpKSB7XG4gICAgICAgICAgICBpc1V0aWxpdHkgPSBmYWxzZTtcblxuICAgICAgICAgICAgYXJndW1lbnRJbmRleCA9IDA7XG4gICAgICAgICAgICBlbGVtZW50cyA9IHRoaXM7XG4gICAgICAgICAgICBlbGVtZW50c1dyYXBwZWQgPSB0aGlzO1xuICAgICAgICAvKiBPdGhlcndpc2UsIHJhdyBlbGVtZW50cyBhcmUgYmVpbmcgYW5pbWF0ZWQgdmlhIHRoZSB1dGlsaXR5IGZ1bmN0aW9uLiAqL1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaXNVdGlsaXR5ID0gdHJ1ZTtcblxuICAgICAgICAgICAgYXJndW1lbnRJbmRleCA9IDE7XG4gICAgICAgICAgICBlbGVtZW50cyA9IHN5bnRhY3RpY1N1Z2FyID8gKGFyZ3VtZW50c1swXS5lbGVtZW50cyB8fCBhcmd1bWVudHNbMF0uZSkgOiBhcmd1bWVudHNbMF07XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50cyA9IHNhbml0aXplRWxlbWVudHMoZWxlbWVudHMpO1xuXG4gICAgICAgIGlmICghZWxlbWVudHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzeW50YWN0aWNTdWdhcikge1xuICAgICAgICAgICAgcHJvcGVydGllc01hcCA9IGFyZ3VtZW50c1swXS5wcm9wZXJ0aWVzIHx8IGFyZ3VtZW50c1swXS5wO1xuICAgICAgICAgICAgb3B0aW9ucyA9IGFyZ3VtZW50c1swXS5vcHRpb25zIHx8IGFyZ3VtZW50c1swXS5vO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvcGVydGllc01hcCA9IGFyZ3VtZW50c1thcmd1bWVudEluZGV4XTtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbYXJndW1lbnRJbmRleCArIDFdO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogVGhlIGxlbmd0aCBvZiB0aGUgZWxlbWVudCBzZXQgKGluIHRoZSBmb3JtIG9mIGEgbm9kZUxpc3Qgb3IgYW4gYXJyYXkgb2YgZWxlbWVudHMpIGlzIGRlZmF1bHRlZCB0byAxIGluIGNhc2UgYVxuICAgICAgICAgICBzaW5nbGUgcmF3IERPTSBlbGVtZW50IGlzIHBhc3NlZCBpbiAod2hpY2ggZG9lc24ndCBjb250YWluIGEgbGVuZ3RoIHByb3BlcnR5KS4gKi9cbiAgICAgICAgdmFyIGVsZW1lbnRzTGVuZ3RoID0gZWxlbWVudHMubGVuZ3RoLFxuICAgICAgICAgICAgZWxlbWVudHNJbmRleCA9IDA7XG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgQXJndW1lbnQgT3ZlcmxvYWRpbmdcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgIC8qIFN1cHBvcnQgaXMgaW5jbHVkZWQgZm9yIGpRdWVyeSdzIGFyZ3VtZW50IG92ZXJsb2FkaW5nOiAkLmFuaW1hdGUocHJvcGVydHlNYXAgWywgZHVyYXRpb25dIFssIGVhc2luZ10gWywgY29tcGxldGVdKS5cbiAgICAgICAgICAgT3ZlcmxvYWRpbmcgaXMgZGV0ZWN0ZWQgYnkgY2hlY2tpbmcgZm9yIHRoZSBhYnNlbmNlIG9mIGFuIG9iamVjdCBiZWluZyBwYXNzZWQgaW50byBvcHRpb25zLiAqL1xuICAgICAgICAvKiBOb3RlOiBUaGUgc3RvcCBhbmQgZmluaXNoIGFjdGlvbnMgZG8gbm90IGFjY2VwdCBhbmltYXRpb24gb3B0aW9ucywgYW5kIGFyZSB0aGVyZWZvcmUgZXhjbHVkZWQgZnJvbSB0aGlzIGNoZWNrLiAqL1xuICAgICAgICBpZiAoIS9eKHN0b3B8ZmluaXNofGZpbmlzaEFsbCkkL2kudGVzdChwcm9wZXJ0aWVzTWFwKSAmJiAhJC5pc1BsYWluT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAvKiBUaGUgdXRpbGl0eSBmdW5jdGlvbiBzaGlmdHMgYWxsIGFyZ3VtZW50cyBvbmUgcG9zaXRpb24gdG8gdGhlIHJpZ2h0LCBzbyB3ZSBhZGp1c3QgZm9yIHRoYXQgb2Zmc2V0LiAqL1xuICAgICAgICAgICAgdmFyIHN0YXJ0aW5nQXJndW1lbnRQb3NpdGlvbiA9IGFyZ3VtZW50SW5kZXggKyAxO1xuXG4gICAgICAgICAgICBvcHRpb25zID0ge307XG5cbiAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCBhbGwgb3B0aW9ucyBhcmd1bWVudHMgKi9cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBzdGFydGluZ0FyZ3VtZW50UG9zaXRpb247IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvKiBUcmVhdCBhIG51bWJlciBhcyBhIGR1cmF0aW9uLiBQYXJzZSBpdCBvdXQuICovXG4gICAgICAgICAgICAgICAgLyogTm90ZTogVGhlIGZvbGxvd2luZyBSZWdFeCB3aWxsIHJldHVybiB0cnVlIGlmIHBhc3NlZCBhbiBhcnJheSB3aXRoIGEgbnVtYmVyIGFzIGl0cyBmaXJzdCBpdGVtLlxuICAgICAgICAgICAgICAgICAgIFRodXMsIGFycmF5cyBhcmUgc2tpcHBlZCBmcm9tIHRoaXMgY2hlY2suICovXG4gICAgICAgICAgICAgICAgaWYgKCFUeXBlLmlzQXJyYXkoYXJndW1lbnRzW2ldKSAmJiAoL14oZmFzdHxub3JtYWx8c2xvdykkL2kudGVzdChhcmd1bWVudHNbaV0pIHx8IC9eXFxkLy50ZXN0KGFyZ3VtZW50c1tpXSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZHVyYXRpb24gPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgICAgLyogVHJlYXQgc3RyaW5ncyBhbmQgYXJyYXlzIGFzIGVhc2luZ3MuICovXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChUeXBlLmlzU3RyaW5nKGFyZ3VtZW50c1tpXSkgfHwgVHlwZS5pc0FycmF5KGFyZ3VtZW50c1tpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5lYXNpbmcgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgICAgLyogVHJlYXQgYSBmdW5jdGlvbiBhcyBhIGNvbXBsZXRlIGNhbGxiYWNrLiAqL1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc0Z1bmN0aW9uKGFyZ3VtZW50c1tpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5jb21wbGV0ZSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKioqKioqKioqKioqKioqXG4gICAgICAgICAgICBQcm9taXNlc1xuICAgICAgICAqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgdmFyIHByb21pc2VEYXRhID0ge1xuICAgICAgICAgICAgICAgIHByb21pc2U6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVzb2x2ZXI6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVqZWN0ZXI6IG51bGxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgLyogSWYgdGhpcyBjYWxsIHdhcyBtYWRlIHZpYSB0aGUgdXRpbGl0eSBmdW5jdGlvbiAod2hpY2ggaXMgdGhlIGRlZmF1bHQgbWV0aG9kIG9mIGludm9jYXRpb24gd2hlbiBqUXVlcnkvWmVwdG8gYXJlIG5vdCBiZWluZyB1c2VkKSwgYW5kIGlmXG4gICAgICAgICAgIHByb21pc2Ugc3VwcG9ydCB3YXMgZGV0ZWN0ZWQsIGNyZWF0ZSBhIHByb21pc2Ugb2JqZWN0IGZvciB0aGlzIGNhbGwgYW5kIHN0b3JlIHJlZmVyZW5jZXMgdG8gaXRzIHJlc29sdmVyIGFuZCByZWplY3RlciBtZXRob2RzLiBUaGUgcmVzb2x2ZVxuICAgICAgICAgICBtZXRob2QgaXMgdXNlZCB3aGVuIGEgY2FsbCBjb21wbGV0ZXMgbmF0dXJhbGx5IG9yIGlzIHByZW1hdHVyZWx5IHN0b3BwZWQgYnkgdGhlIHVzZXIuIEluIGJvdGggY2FzZXMsIGNvbXBsZXRlQ2FsbCgpIGhhbmRsZXMgdGhlIGFzc29jaWF0ZWRcbiAgICAgICAgICAgY2FsbCBjbGVhbnVwIGFuZCBwcm9taXNlIHJlc29sdmluZyBsb2dpYy4gVGhlIHJlamVjdCBtZXRob2QgaXMgdXNlZCB3aGVuIGFuIGludmFsaWQgc2V0IG9mIGFyZ3VtZW50cyBpcyBwYXNzZWQgaW50byBhIFZlbG9jaXR5IGNhbGwuICovXG4gICAgICAgIC8qIE5vdGU6IFZlbG9jaXR5IGVtcGxveXMgYSBjYWxsLWJhc2VkIHF1ZXVlaW5nIGFyY2hpdGVjdHVyZSwgd2hpY2ggbWVhbnMgdGhhdCBzdG9wcGluZyBhbiBhbmltYXRpbmcgZWxlbWVudCBhY3R1YWxseSBzdG9wcyB0aGUgZnVsbCBjYWxsIHRoYXRcbiAgICAgICAgICAgdHJpZ2dlcmVkIGl0IC0tIG5vdCB0aGF0IG9uZSBlbGVtZW50IGV4Y2x1c2l2ZWx5LiBTaW1pbGFybHksIHRoZXJlIGlzIG9uZSBwcm9taXNlIHBlciBjYWxsLCBhbmQgYWxsIGVsZW1lbnRzIHRhcmdldGVkIGJ5IGEgVmVsb2NpdHkgY2FsbCBhcmVcbiAgICAgICAgICAgZ3JvdXBlZCB0b2dldGhlciBmb3IgdGhlIHB1cnBvc2VzIG9mIHJlc29sdmluZyBhbmQgcmVqZWN0aW5nIGEgcHJvbWlzZS4gKi9cbiAgICAgICAgaWYgKGlzVXRpbGl0eSAmJiBWZWxvY2l0eS5Qcm9taXNlKSB7XG4gICAgICAgICAgICBwcm9taXNlRGF0YS5wcm9taXNlID0gbmV3IFZlbG9jaXR5LlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIHByb21pc2VEYXRhLnJlc29sdmVyID0gcmVzb2x2ZTtcbiAgICAgICAgICAgICAgICBwcm9taXNlRGF0YS5yZWplY3RlciA9IHJlamVjdDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICBBY3Rpb24gRGV0ZWN0aW9uXG4gICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAvKiBWZWxvY2l0eSdzIGJlaGF2aW9yIGlzIGNhdGVnb3JpemVkIGludG8gXCJhY3Rpb25zXCI6IEVsZW1lbnRzIGNhbiBlaXRoZXIgYmUgc3BlY2lhbGx5IHNjcm9sbGVkIGludG8gdmlldyxcbiAgICAgICAgICAgb3IgdGhleSBjYW4gYmUgc3RhcnRlZCwgc3RvcHBlZCwgb3IgcmV2ZXJzZWQuIElmIGEgbGl0ZXJhbCBvciByZWZlcmVuY2VkIHByb3BlcnRpZXMgbWFwIGlzIHBhc3NlZCBpbiBhcyBWZWxvY2l0eSdzXG4gICAgICAgICAgIGZpcnN0IGFyZ3VtZW50LCB0aGUgYXNzb2NpYXRlZCBhY3Rpb24gaXMgXCJzdGFydFwiLiBBbHRlcm5hdGl2ZWx5LCBcInNjcm9sbFwiLCBcInJldmVyc2VcIiwgb3IgXCJzdG9wXCIgY2FuIGJlIHBhc3NlZCBpbiBpbnN0ZWFkIG9mIGEgcHJvcGVydGllcyBtYXAuICovXG4gICAgICAgIHZhciBhY3Rpb247XG5cbiAgICAgICAgc3dpdGNoIChwcm9wZXJ0aWVzTWFwKSB7XG4gICAgICAgICAgICBjYXNlIFwic2Nyb2xsXCI6XG4gICAgICAgICAgICAgICAgYWN0aW9uID0gXCJzY3JvbGxcIjtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBcInJldmVyc2VcIjpcbiAgICAgICAgICAgICAgICBhY3Rpb24gPSBcInJldmVyc2VcIjtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBcImZpbmlzaFwiOlxuICAgICAgICAgICAgY2FzZSBcImZpbmlzaEFsbFwiOlxuICAgICAgICAgICAgY2FzZSBcInN0b3BcIjpcbiAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFN0b3BcbiAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgLyogQ2xlYXIgdGhlIGN1cnJlbnRseS1hY3RpdmUgZGVsYXkgb24gZWFjaCB0YXJnZXRlZCBlbGVtZW50LiAqL1xuICAgICAgICAgICAgICAgICQuZWFjaChlbGVtZW50cywgZnVuY3Rpb24oaSwgZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSAmJiBEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0b3AgdGhlIHRpbWVyIGZyb20gdHJpZ2dlcmluZyBpdHMgY2FjaGVkIG5leHQoKSBmdW5jdGlvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIuc2V0VGltZW91dCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIE1hbnVhbGx5IGNhbGwgdGhlIG5leHQoKSBmdW5jdGlvbiBzbyB0aGF0IHRoZSBzdWJzZXF1ZW50IHF1ZXVlIGl0ZW1zIGNhbiBwcm9ncmVzcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIubmV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkuZGVsYXlUaW1lci5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBJZiB3ZSB3YW50IHRvIGZpbmlzaCBldmVyeXRoaW5nIGluIHRoZSBxdWV1ZSwgd2UgaGF2ZSB0byBpdGVyYXRlIHRocm91Z2ggaXRcbiAgICAgICAgICAgICAgICAgICAgICAgYW5kIGNhbGwgZWFjaCBmdW5jdGlvbi4gVGhpcyB3aWxsIG1ha2UgdGhlbSBhY3RpdmUgY2FsbHMgYmVsb3csIHdoaWNoIHdpbGxcbiAgICAgICAgICAgICAgICAgICAgICAgY2F1c2UgdGhlbSB0byBiZSBhcHBsaWVkIHZpYSB0aGUgZHVyYXRpb24gc2V0dGluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNNYXAgPT09IFwiZmluaXNoQWxsXCIgJiYgKG9wdGlvbnMgPT09IHRydWUgfHwgVHlwZS5pc1N0cmluZyhvcHRpb25zKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCB0aGUgaXRlbXMgaW4gdGhlIGVsZW1lbnQncyBxdWV1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaCgkLnF1ZXVlKGVsZW1lbnQsIFR5cGUuaXNTdHJpbmcob3B0aW9ucykgPyBvcHRpb25zIDogXCJcIiksIGZ1bmN0aW9uKF8sIGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgcXVldWUgYXJyYXkgY2FuIGNvbnRhaW4gYW4gXCJpbnByb2dyZXNzXCIgc3RyaW5nLCB3aGljaCB3ZSBza2lwLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChUeXBlLmlzRnVuY3Rpb24oaXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBDbGVhcmluZyB0aGUgJC5xdWV1ZSgpIGFycmF5IGlzIGFjaGlldmVkIGJ5IHJlc2V0dGluZyBpdCB0byBbXS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICQucXVldWUoZWxlbWVudCwgVHlwZS5pc1N0cmluZyhvcHRpb25zKSA/IG9wdGlvbnMgOiBcIlwiLCBbXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHZhciBjYWxsc1RvU3RvcCA9IFtdO1xuXG4gICAgICAgICAgICAgICAgLyogV2hlbiB0aGUgc3RvcCBhY3Rpb24gaXMgdHJpZ2dlcmVkLCB0aGUgZWxlbWVudHMnIGN1cnJlbnRseSBhY3RpdmUgY2FsbCBpcyBpbW1lZGlhdGVseSBzdG9wcGVkLiBUaGUgYWN0aXZlIGNhbGwgbWlnaHQgaGF2ZVxuICAgICAgICAgICAgICAgICAgIGJlZW4gYXBwbGllZCB0byBtdWx0aXBsZSBlbGVtZW50cywgaW4gd2hpY2ggY2FzZSBhbGwgb2YgdGhlIGNhbGwncyBlbGVtZW50cyB3aWxsIGJlIHN0b3BwZWQuIFdoZW4gYW4gZWxlbWVudFxuICAgICAgICAgICAgICAgICAgIGlzIHN0b3BwZWQsIHRoZSBuZXh0IGl0ZW0gaW4gaXRzIGFuaW1hdGlvbiBxdWV1ZSBpcyBpbW1lZGlhdGVseSB0cmlnZ2VyZWQuICovXG4gICAgICAgICAgICAgICAgLyogQW4gYWRkaXRpb25hbCBhcmd1bWVudCBtYXkgYmUgcGFzc2VkIGluIHRvIGNsZWFyIGFuIGVsZW1lbnQncyByZW1haW5pbmcgcXVldWVkIGNhbGxzLiBFaXRoZXIgdHJ1ZSAod2hpY2ggZGVmYXVsdHMgdG8gdGhlIFwiZnhcIiBxdWV1ZSlcbiAgICAgICAgICAgICAgICAgICBvciBhIGN1c3RvbSBxdWV1ZSBzdHJpbmcgY2FuIGJlIHBhc3NlZCBpbi4gKi9cbiAgICAgICAgICAgICAgICAvKiBOb3RlOiBUaGUgc3RvcCBjb21tYW5kIHJ1bnMgcHJpb3IgdG8gVmVsb2NpdHkncyBRdWV1ZWluZyBwaGFzZSBzaW5jZSBpdHMgYmVoYXZpb3IgaXMgaW50ZW5kZWQgdG8gdGFrZSBlZmZlY3QgKmltbWVkaWF0ZWx5KixcbiAgICAgICAgICAgICAgICAgICByZWdhcmRsZXNzIG9mIHRoZSBlbGVtZW50J3MgY3VycmVudCBxdWV1ZSBzdGF0ZS4gKi9cblxuICAgICAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCBldmVyeSBhY3RpdmUgY2FsbC4gKi9cbiAgICAgICAgICAgICAgICAkLmVhY2goVmVsb2NpdHkuU3RhdGUuY2FsbHMsIGZ1bmN0aW9uKGksIGFjdGl2ZUNhbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogSW5hY3RpdmUgY2FsbHMgYXJlIHNldCB0byBmYWxzZSBieSB0aGUgbG9naWMgaW5zaWRlIGNvbXBsZXRlQ2FsbCgpLiBTa2lwIHRoZW0uICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3RpdmVDYWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggdGhlIGFjdGl2ZSBjYWxsJ3MgdGFyZ2V0ZWQgZWxlbWVudHMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goYWN0aXZlQ2FsbFsxXSwgZnVuY3Rpb24oaywgYWN0aXZlRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRydWUgd2FzIHBhc3NlZCBpbiBhcyBhIHNlY29uZGFyeSBhcmd1bWVudCwgY2xlYXIgYWJzb2x1dGVseSBhbGwgY2FsbHMgb24gdGhpcyBlbGVtZW50LiBPdGhlcndpc2UsIG9ubHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhciBjYWxscyBhc3NvY2lhdGVkIHdpdGggdGhlIHJlbGV2YW50IHF1ZXVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENhbGwgc3RvcHBpbmcgbG9naWMgd29ya3MgYXMgZm9sbG93czpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIG9wdGlvbnMgPT09IHRydWUgLS0+IHN0b3AgY3VycmVudCBkZWZhdWx0IHF1ZXVlIGNhbGxzIChhbmQgcXVldWU6ZmFsc2UgY2FsbHMpLCBpbmNsdWRpbmcgcmVtYWluaW5nIHF1ZXVlZCBvbmVzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gb3B0aW9ucyA9PT0gdW5kZWZpbmVkIC0tPiBzdG9wIGN1cnJlbnQgcXVldWU6XCJcIiBjYWxsIGFuZCBhbGwgcXVldWU6ZmFsc2UgY2FsbHMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBvcHRpb25zID09PSBmYWxzZSAtLT4gc3RvcCBvbmx5IHF1ZXVlOmZhbHNlIGNhbGxzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gb3B0aW9ucyA9PT0gXCJjdXN0b21cIiAtLT4gc3RvcCBjdXJyZW50IHF1ZXVlOlwiY3VzdG9tXCIgY2FsbCwgaW5jbHVkaW5nIHJlbWFpbmluZyBxdWV1ZWQgb25lcyAodGhlcmUgaXMgbm8gZnVuY3Rpb25hbGl0eSB0byBvbmx5IGNsZWFyIHRoZSBjdXJyZW50bHktcnVubmluZyBxdWV1ZTpcImN1c3RvbVwiIGNhbGwpLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBxdWV1ZU5hbWUgPSAob3B0aW9ucyA9PT0gdW5kZWZpbmVkKSA/IFwiXCIgOiBvcHRpb25zO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXVlTmFtZSAhPT0gdHJ1ZSAmJiAoYWN0aXZlQ2FsbFsyXS5xdWV1ZSAhPT0gcXVldWVOYW1lKSAmJiAhKG9wdGlvbnMgPT09IHVuZGVmaW5lZCAmJiBhY3RpdmVDYWxsWzJdLnF1ZXVlID09PSBmYWxzZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIHRoZSBjYWxscyB0YXJnZXRlZCBieSB0aGUgc3RvcCBjb21tYW5kLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChlbGVtZW50cywgZnVuY3Rpb24obCwgZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDaGVjayB0aGF0IHRoaXMgY2FsbCB3YXMgYXBwbGllZCB0byB0aGUgdGFyZ2V0IGVsZW1lbnQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50ID09PSBhY3RpdmVFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBPcHRpb25hbGx5IGNsZWFyIHRoZSByZW1haW5pbmcgcXVldWVkIGNhbGxzLiBJZiB3ZSdyZSBkb2luZyBcImZpbmlzaEFsbFwiIHRoaXMgd29uJ3QgZmluZCBhbnl0aGluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1ZSB0byB0aGUgcXVldWUtY2xlYXJpbmcgYWJvdmUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucyA9PT0gdHJ1ZSB8fCBUeXBlLmlzU3RyaW5nKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIHRoZSBpdGVtcyBpbiB0aGUgZWxlbWVudCdzIHF1ZXVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaCgkLnF1ZXVlKGVsZW1lbnQsIFR5cGUuaXNTdHJpbmcob3B0aW9ucykgPyBvcHRpb25zIDogXCJcIiksIGZ1bmN0aW9uKF8sIGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIHF1ZXVlIGFycmF5IGNhbiBjb250YWluIGFuIFwiaW5wcm9ncmVzc1wiIHN0cmluZywgd2hpY2ggd2Ugc2tpcC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFR5cGUuaXNGdW5jdGlvbihpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUGFzcyB0aGUgaXRlbSdzIGNhbGxiYWNrIGEgZmxhZyBpbmRpY2F0aW5nIHRoYXQgd2Ugd2FudCB0byBhYm9ydCBmcm9tIHRoZSBxdWV1ZSBjYWxsLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKFNwZWNpZmljYWxseSwgdGhlIHF1ZXVlIHdpbGwgcmVzb2x2ZSB0aGUgY2FsbCdzIGFzc29jaWF0ZWQgcHJvbWlzZSB0aGVuIGFib3J0LikgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDbGVhcmluZyB0aGUgJC5xdWV1ZSgpIGFycmF5IGlzIGFjaGlldmVkIGJ5IHJlc2V0dGluZyBpdCB0byBbXS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLnF1ZXVlKGVsZW1lbnQsIFR5cGUuaXNTdHJpbmcob3B0aW9ucykgPyBvcHRpb25zIDogXCJcIiwgW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc01hcCA9PT0gXCJzdG9wXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSBcInJldmVyc2VcIiB1c2VzIGNhY2hlZCBzdGFydCB2YWx1ZXMgKHRoZSBwcmV2aW91cyBjYWxsJ3MgZW5kVmFsdWVzKSwgdGhlc2UgdmFsdWVzIG11c3QgYmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkIHRvIHJlZmxlY3QgdGhlIGZpbmFsIHZhbHVlIHRoYXQgdGhlIGVsZW1lbnRzIHdlcmUgYWN0dWFsbHkgdHdlZW5lZCB0by4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBJZiBvbmx5IHF1ZXVlOmZhbHNlIGFuaW1hdGlvbnMgYXJlIGN1cnJlbnRseSBydW5uaW5nIG9uIGFuIGVsZW1lbnQsIGl0IHdvbid0IGhhdmUgYSB0d2VlbnNDb250YWluZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuIEFsc28sIHF1ZXVlOmZhbHNlIGFuaW1hdGlvbnMgY2FuJ3QgYmUgcmV2ZXJzZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgJiYgRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIgJiYgcXVldWVOYW1lICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIsIGZ1bmN0aW9uKG0sIGFjdGl2ZVR3ZWVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVUd2Vlbi5lbmRWYWx1ZSA9IGFjdGl2ZVR3ZWVuLmN1cnJlbnRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbHNUb1N0b3AucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydGllc01hcCA9PT0gXCJmaW5pc2hcIiB8fCBwcm9wZXJ0aWVzTWFwID09PSBcImZpbmlzaEFsbFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVG8gZ2V0IGFjdGl2ZSB0d2VlbnMgdG8gZmluaXNoIGltbWVkaWF0ZWx5LCB3ZSBmb3JjZWZ1bGx5IHNob3J0ZW4gdGhlaXIgZHVyYXRpb25zIHRvIDFtcyBzbyB0aGF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhleSBmaW5pc2ggdXBvbiB0aGUgbmV4dCByQWYgdGljayB0aGVuIHByb2NlZWQgd2l0aCBub3JtYWwgY2FsbCBjb21wbGV0aW9uIGxvZ2ljLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZUNhbGxbMl0uZHVyYXRpb24gPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLyogUHJlbWF0dXJlbHkgY2FsbCBjb21wbGV0ZUNhbGwoKSBvbiBlYWNoIG1hdGNoZWQgYWN0aXZlIGNhbGwuIFBhc3MgYW4gYWRkaXRpb25hbCBmbGFnIGZvciBcInN0b3BcIiB0byBpbmRpY2F0ZVxuICAgICAgICAgICAgICAgICAgIHRoYXQgdGhlIGNvbXBsZXRlIGNhbGxiYWNrIGFuZCBkaXNwbGF5Om5vbmUgc2V0dGluZyBzaG91bGQgYmUgc2tpcHBlZCBzaW5jZSB3ZSdyZSBjb21wbGV0aW5nIHByZW1hdHVyZWx5LiAqL1xuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzTWFwID09PSBcInN0b3BcIikge1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2goY2FsbHNUb1N0b3AsIGZ1bmN0aW9uKGksIGopIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlQ2FsbChqLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb21pc2VEYXRhLnByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEltbWVkaWF0ZWx5IHJlc29sdmUgdGhlIHByb21pc2UgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc3RvcCBjYWxsIHNpbmNlIHN0b3AgcnVucyBzeW5jaHJvbm91c2x5LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZURhdGEucmVzb2x2ZXIoZWxlbWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogU2luY2Ugd2UncmUgc3RvcHBpbmcsIGFuZCBub3QgcHJvY2VlZGluZyB3aXRoIHF1ZXVlaW5nLCBleGl0IG91dCBvZiBWZWxvY2l0eS4gKi9cbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0Q2hhaW4oKTtcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvKiBUcmVhdCBhIG5vbi1lbXB0eSBwbGFpbiBvYmplY3QgYXMgYSBsaXRlcmFsIHByb3BlcnRpZXMgbWFwLiAqL1xuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QocHJvcGVydGllc01hcCkgJiYgIVR5cGUuaXNFbXB0eU9iamVjdChwcm9wZXJ0aWVzTWFwKSkge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBcInN0YXJ0XCI7XG5cbiAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICBSZWRpcmVjdHNcbiAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgLyogQ2hlY2sgaWYgYSBzdHJpbmcgbWF0Y2hlcyBhIHJlZ2lzdGVyZWQgcmVkaXJlY3QgKHNlZSBSZWRpcmVjdHMgYWJvdmUpLiAqL1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc1N0cmluZyhwcm9wZXJ0aWVzTWFwKSAmJiBWZWxvY2l0eS5SZWRpcmVjdHNbcHJvcGVydGllc01hcF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbk9yaWdpbmFsID0gb3B0cy5kdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGF5T3JpZ2luYWwgPSBvcHRzLmRlbGF5IHx8IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGJhY2t3YXJkcyBvcHRpb24gd2FzIHBhc3NlZCBpbiwgcmV2ZXJzZSB0aGUgZWxlbWVudCBzZXQgc28gdGhhdCBlbGVtZW50cyBhbmltYXRlIGZyb20gdGhlIGxhc3QgdG8gdGhlIGZpcnN0LiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5iYWNrd2FyZHMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzID0gJC5leHRlbmQodHJ1ZSwgW10sIGVsZW1lbnRzKS5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBJbmRpdmlkdWFsbHkgdHJpZ2dlciB0aGUgcmVkaXJlY3QgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgc2V0IHRvIHByZXZlbnQgdXNlcnMgZnJvbSBoYXZpbmcgdG8gaGFuZGxlIGl0ZXJhdGlvbiBsb2dpYyBpbiB0aGVpciByZWRpcmVjdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihlbGVtZW50SW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBzdGFnZ2VyIG9wdGlvbiB3YXMgcGFzc2VkIGluLCBzdWNjZXNzaXZlbHkgZGVsYXkgZWFjaCBlbGVtZW50IGJ5IHRoZSBzdGFnZ2VyIHZhbHVlIChpbiBtcykuIFJldGFpbiB0aGUgb3JpZ2luYWwgZGVsYXkgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VGbG9hdChvcHRzLnN0YWdnZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5kZWxheSA9IGRlbGF5T3JpZ2luYWwgKyAocGFyc2VGbG9hdChvcHRzLnN0YWdnZXIpICogZWxlbWVudEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc0Z1bmN0aW9uKG9wdHMuc3RhZ2dlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmRlbGF5ID0gZGVsYXlPcmlnaW5hbCArIG9wdHMuc3RhZ2dlci5jYWxsKGVsZW1lbnQsIGVsZW1lbnRJbmRleCwgZWxlbWVudHNMZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgZHJhZyBvcHRpb24gd2FzIHBhc3NlZCBpbiwgc3VjY2Vzc2l2ZWx5IGluY3JlYXNlL2RlY3JlYXNlIChkZXBlbmRpbmcgb24gdGhlIHByZXNlbnNlIG9mIG9wdHMuYmFja3dhcmRzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGR1cmF0aW9uIG9mIGVhY2ggZWxlbWVudCdzIGFuaW1hdGlvbiwgdXNpbmcgZmxvb3JzIHRvIHByZXZlbnQgcHJvZHVjaW5nIHZlcnkgc2hvcnQgZHVyYXRpb25zLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuZHJhZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIERlZmF1bHQgdGhlIGR1cmF0aW9uIG9mIFVJIHBhY2sgZWZmZWN0cyAoY2FsbG91dHMgYW5kIHRyYW5zaXRpb25zKSB0byAxMDAwbXMgaW5zdGVhZCBvZiB0aGUgdXN1YWwgZGVmYXVsdCBkdXJhdGlvbiBvZiA0MDBtcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gcGFyc2VGbG9hdChkdXJhdGlvbk9yaWdpbmFsKSB8fCAoL14oY2FsbG91dHx0cmFuc2l0aW9uKS8udGVzdChwcm9wZXJ0aWVzTWFwKSA/IDEwMDAgOiBEVVJBVElPTl9ERUZBVUxUKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZvciBlYWNoIGVsZW1lbnQsIHRha2UgdGhlIGdyZWF0ZXIgZHVyYXRpb24gb2Y6IEEpIGFuaW1hdGlvbiBjb21wbGV0aW9uIHBlcmNlbnRhZ2UgcmVsYXRpdmUgdG8gdGhlIG9yaWdpbmFsIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEIpIDc1JSBvZiB0aGUgb3JpZ2luYWwgZHVyYXRpb24sIG9yIEMpIGEgMjAwbXMgZmFsbGJhY2sgKGluIGNhc2UgZHVyYXRpb24gaXMgYWxyZWFkeSBzZXQgdG8gYSBsb3cgdmFsdWUpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBlbmQgcmVzdWx0IGlzIGEgYmFzZWxpbmUgb2YgNzUlIG9mIHRoZSByZWRpcmVjdCdzIGR1cmF0aW9uIHRoYXQgaW5jcmVhc2VzL2RlY3JlYXNlcyBhcyB0aGUgZW5kIG9mIHRoZSBlbGVtZW50IHNldCBpcyBhcHByb2FjaGVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gPSBNYXRoLm1heChvcHRzLmR1cmF0aW9uICogKG9wdHMuYmFja3dhcmRzID8gMSAtIGVsZW1lbnRJbmRleC9lbGVtZW50c0xlbmd0aCA6IChlbGVtZW50SW5kZXggKyAxKSAvIGVsZW1lbnRzTGVuZ3RoKSwgb3B0cy5kdXJhdGlvbiAqIDAuNzUsIDIwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFBhc3MgaW4gdGhlIGNhbGwncyBvcHRzIG9iamVjdCBzbyB0aGF0IHRoZSByZWRpcmVjdCBjYW4gb3B0aW9uYWxseSBleHRlbmQgaXQuIEl0IGRlZmF1bHRzIHRvIGFuIGVtcHR5IG9iamVjdCBpbnN0ZWFkIG9mIG51bGwgdG9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZHVjZSB0aGUgb3B0cyBjaGVja2luZyBsb2dpYyByZXF1aXJlZCBpbnNpZGUgdGhlIHJlZGlyZWN0LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuUmVkaXJlY3RzW3Byb3BlcnRpZXNNYXBdLmNhbGwoZWxlbWVudCwgZWxlbWVudCwgb3B0cyB8fCB7fSwgZWxlbWVudEluZGV4LCBlbGVtZW50c0xlbmd0aCwgZWxlbWVudHMsIHByb21pc2VEYXRhLnByb21pc2UgPyBwcm9taXNlRGF0YSA6IHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIHRoZSBhbmltYXRpb24gbG9naWMgcmVzaWRlcyB3aXRoaW4gdGhlIHJlZGlyZWN0J3Mgb3duIGNvZGUsIGFib3J0IHRoZSByZW1haW5kZXIgb2YgdGhpcyBjYWxsLlxuICAgICAgICAgICAgICAgICAgICAgICAoVGhlIHBlcmZvcm1hbmNlIG92ZXJoZWFkIHVwIHRvIHRoaXMgcG9pbnQgaXMgdmlydHVhbGx5IG5vbi1leGlzdGFudC4pICovXG4gICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFRoZSBqUXVlcnkgY2FsbCBjaGFpbiBpcyBrZXB0IGludGFjdCBieSByZXR1cm5pbmcgdGhlIGNvbXBsZXRlIGVsZW1lbnQgc2V0LiAqL1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0Q2hhaW4oKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYWJvcnRFcnJvciA9IFwiVmVsb2NpdHk6IEZpcnN0IGFyZ3VtZW50IChcIiArIHByb3BlcnRpZXNNYXAgKyBcIikgd2FzIG5vdCBhIHByb3BlcnR5IG1hcCwgYSBrbm93biBhY3Rpb24sIG9yIGEgcmVnaXN0ZXJlZCByZWRpcmVjdC4gQWJvcnRpbmcuXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb21pc2VEYXRhLnByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VEYXRhLnJlamVjdGVyKG5ldyBFcnJvcihhYm9ydEVycm9yKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhhYm9ydEVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXRDaGFpbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgQ2FsbC1XaWRlIFZhcmlhYmxlc1xuICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAvKiBBIGNvbnRhaW5lciBmb3IgQ1NTIHVuaXQgY29udmVyc2lvbiByYXRpb3MgKGUuZy4gJSwgcmVtLCBhbmQgZW0gPT0+IHB4KSB0aGF0IGlzIHVzZWQgdG8gY2FjaGUgcmF0aW9zIGFjcm9zcyBhbGwgZWxlbWVudHNcbiAgICAgICAgICAgYmVpbmcgYW5pbWF0ZWQgaW4gYSBzaW5nbGUgVmVsb2NpdHkgY2FsbC4gQ2FsY3VsYXRpbmcgdW5pdCByYXRpb3MgbmVjZXNzaXRhdGVzIERPTSBxdWVyeWluZyBhbmQgdXBkYXRpbmcsIGFuZCBpcyB0aGVyZWZvcmVcbiAgICAgICAgICAgYXZvaWRlZCAodmlhIGNhY2hpbmcpIHdoZXJldmVyIHBvc3NpYmxlLiBUaGlzIGNvbnRhaW5lciBpcyBjYWxsLXdpZGUgaW5zdGVhZCBvZiBwYWdlLXdpZGUgdG8gYXZvaWQgdGhlIHJpc2sgb2YgdXNpbmcgc3RhbGVcbiAgICAgICAgICAgY29udmVyc2lvbiBtZXRyaWNzIGFjcm9zcyBWZWxvY2l0eSBhbmltYXRpb25zIHRoYXQgYXJlIG5vdCBpbW1lZGlhdGVseSBjb25zZWN1dGl2ZWx5IGNoYWluZWQuICovXG4gICAgICAgIHZhciBjYWxsVW5pdENvbnZlcnNpb25EYXRhID0ge1xuICAgICAgICAgICAgICAgIGxhc3RQYXJlbnQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbGFzdFBvc2l0aW9uOiBudWxsLFxuICAgICAgICAgICAgICAgIGxhc3RGb250U2l6ZTogbnVsbCxcbiAgICAgICAgICAgICAgICBsYXN0UGVyY2VudFRvUHhXaWR0aDogbnVsbCxcbiAgICAgICAgICAgICAgICBsYXN0UGVyY2VudFRvUHhIZWlnaHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbGFzdEVtVG9QeDogbnVsbCxcbiAgICAgICAgICAgICAgICByZW1Ub1B4OiBudWxsLFxuICAgICAgICAgICAgICAgIHZ3VG9QeDogbnVsbCxcbiAgICAgICAgICAgICAgICB2aFRvUHg6IG51bGxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgLyogQSBjb250YWluZXIgZm9yIGFsbCB0aGUgZW5zdWluZyB0d2VlbiBkYXRhIGFuZCBtZXRhZGF0YSBhc3NvY2lhdGVkIHdpdGggdGhpcyBjYWxsLiBUaGlzIGNvbnRhaW5lciBnZXRzIHB1c2hlZCB0byB0aGUgcGFnZS13aWRlXG4gICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzIGFycmF5IHRoYXQgaXMgcHJvY2Vzc2VkIGR1cmluZyBhbmltYXRpb24gdGlja2luZy4gKi9cbiAgICAgICAgdmFyIGNhbGwgPSBbXTtcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIEVsZW1lbnQgUHJvY2Vzc2luZ1xuICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogRWxlbWVudCBwcm9jZXNzaW5nIGNvbnNpc3RzIG9mIHRocmVlIHBhcnRzIC0tIGRhdGEgcHJvY2Vzc2luZyB0aGF0IGNhbm5vdCBnbyBzdGFsZSBhbmQgZGF0YSBwcm9jZXNzaW5nIHRoYXQgKmNhbiogZ28gc3RhbGUgKGkuZS4gdGhpcmQtcGFydHkgc3R5bGUgbW9kaWZpY2F0aW9ucyk6XG4gICAgICAgICAgIDEpIFByZS1RdWV1ZWluZzogRWxlbWVudC13aWRlIHZhcmlhYmxlcywgaW5jbHVkaW5nIHRoZSBlbGVtZW50J3MgZGF0YSBzdG9yYWdlLCBhcmUgaW5zdGFudGlhdGVkLiBDYWxsIG9wdGlvbnMgYXJlIHByZXBhcmVkLiBJZiB0cmlnZ2VyZWQsIHRoZSBTdG9wIGFjdGlvbiBpcyBleGVjdXRlZC5cbiAgICAgICAgICAgMikgUXVldWVpbmc6IFRoZSBsb2dpYyB0aGF0IHJ1bnMgb25jZSB0aGlzIGNhbGwgaGFzIHJlYWNoZWQgaXRzIHBvaW50IG9mIGV4ZWN1dGlvbiBpbiB0aGUgZWxlbWVudCdzICQucXVldWUoKSBzdGFjay4gTW9zdCBsb2dpYyBpcyBwbGFjZWQgaGVyZSB0byBhdm9pZCByaXNraW5nIGl0IGJlY29taW5nIHN0YWxlLlxuICAgICAgICAgICAzKSBQdXNoaW5nOiBDb25zb2xpZGF0aW9uIG9mIHRoZSB0d2VlbiBkYXRhIGZvbGxvd2VkIGJ5IGl0cyBwdXNoIG9udG8gdGhlIGdsb2JhbCBpbi1wcm9ncmVzcyBjYWxscyBjb250YWluZXIuXG4gICAgICAgICovXG5cbiAgICAgICAgZnVuY3Rpb24gcHJvY2Vzc0VsZW1lbnQgKCkge1xuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgUGFydCBJOiBQcmUtUXVldWVpbmdcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIEVsZW1lbnQtV2lkZSBWYXJpYWJsZXNcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLFxuICAgICAgICAgICAgICAgIC8qIFRoZSBydW50aW1lIG9wdHMgb2JqZWN0IGlzIHRoZSBleHRlbnNpb24gb2YgdGhlIGN1cnJlbnQgY2FsbCdzIG9wdGlvbnMgYW5kIFZlbG9jaXR5J3MgcGFnZS13aWRlIG9wdGlvbiBkZWZhdWx0cy4gKi9cbiAgICAgICAgICAgICAgICBvcHRzID0gJC5leHRlbmQoe30sIFZlbG9jaXR5LmRlZmF1bHRzLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICAvKiBBIGNvbnRhaW5lciBmb3IgdGhlIHByb2Nlc3NlZCBkYXRhIGFzc29jaWF0ZWQgd2l0aCBlYWNoIHByb3BlcnR5IGluIHRoZSBwcm9wZXJ0eU1hcC5cbiAgICAgICAgICAgICAgICAgICAoRWFjaCBwcm9wZXJ0eSBpbiB0aGUgbWFwIHByb2R1Y2VzIGl0cyBvd24gXCJ0d2VlblwiLikgKi9cbiAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXIgPSB7fSxcbiAgICAgICAgICAgICAgICBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhO1xuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBFbGVtZW50IEluaXRcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIFZlbG9jaXR5LmluaXQoZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIE9wdGlvbjogRGVsYXlcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgLyogU2luY2UgcXVldWU6ZmFsc2UgZG9lc24ndCByZXNwZWN0IHRoZSBpdGVtJ3MgZXhpc3RpbmcgcXVldWUsIHdlIGF2b2lkIGluamVjdGluZyBpdHMgZGVsYXkgaGVyZSAoaXQncyBzZXQgbGF0ZXIgb24pLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogVmVsb2NpdHkgcm9sbHMgaXRzIG93biBkZWxheSBmdW5jdGlvbiBzaW5jZSBqUXVlcnkgZG9lc24ndCBoYXZlIGEgdXRpbGl0eSBhbGlhcyBmb3IgJC5mbi5kZWxheSgpXG4gICAgICAgICAgICAgICAoYW5kIHRodXMgcmVxdWlyZXMgalF1ZXJ5IGVsZW1lbnQgY3JlYXRpb24sIHdoaWNoIHdlIGF2b2lkIHNpbmNlIGl0cyBvdmVyaGVhZCBpbmNsdWRlcyBET00gcXVlcnlpbmcpLiAqL1xuICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQob3B0cy5kZWxheSkgJiYgb3B0cy5xdWV1ZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAkLnF1ZXVlKGVsZW1lbnQsIG9wdHMucXVldWUsIGZ1bmN0aW9uKG5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogVGhpcyBpcyBhIGZsYWcgdXNlZCB0byBpbmRpY2F0ZSB0byB0aGUgdXBjb21pbmcgY29tcGxldGVDYWxsKCkgZnVuY3Rpb24gdGhhdCB0aGlzIHF1ZXVlIGVudHJ5IHdhcyBpbml0aWF0ZWQgYnkgVmVsb2NpdHkuIFNlZSBjb21wbGV0ZUNhbGwoKSBmb3IgZnVydGhlciBkZXRhaWxzLiAqL1xuICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS52ZWxvY2l0eVF1ZXVlRW50cnlGbGFnID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBUaGUgZW5zdWluZyBxdWV1ZSBpdGVtICh3aGljaCBpcyBhc3NpZ25lZCB0byB0aGUgXCJuZXh0XCIgYXJndW1lbnQgdGhhdCAkLnF1ZXVlKCkgYXV0b21hdGljYWxseSBwYXNzZXMgaW4pIHdpbGwgYmUgdHJpZ2dlcmVkIGFmdGVyIGEgc2V0VGltZW91dCBkZWxheS5cbiAgICAgICAgICAgICAgICAgICAgICAgVGhlIHNldFRpbWVvdXQgaXMgc3RvcmVkIHNvIHRoYXQgaXQgY2FuIGJlIHN1YmplY3RlZCB0byBjbGVhclRpbWVvdXQoKSBpZiB0aGlzIGFuaW1hdGlvbiBpcyBwcmVtYXR1cmVseSBzdG9wcGVkIHZpYSBWZWxvY2l0eSdzIFwic3RvcFwiIGNvbW1hbmQuICovXG4gICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkuZGVsYXlUaW1lciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQ6IHNldFRpbWVvdXQobmV4dCwgcGFyc2VGbG9hdChvcHRzLmRlbGF5KSksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBuZXh0XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIE9wdGlvbjogRHVyYXRpb25cbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgLyogU3VwcG9ydCBmb3IgalF1ZXJ5J3MgbmFtZWQgZHVyYXRpb25zLiAqL1xuICAgICAgICAgICAgc3dpdGNoIChvcHRzLmR1cmF0aW9uLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJmYXN0XCI6XG4gICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gPSAyMDA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBcIm5vcm1hbFwiOlxuICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gRFVSQVRJT05fREVGQVVMVDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIFwic2xvd1wiOlxuICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gNjAwO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIC8qIFJlbW92ZSB0aGUgcG90ZW50aWFsIFwibXNcIiBzdWZmaXggYW5kIGRlZmF1bHQgdG8gMSBpZiB0aGUgdXNlciBpcyBhdHRlbXB0aW5nIHRvIHNldCBhIGR1cmF0aW9uIG9mIDAgKGluIG9yZGVyIHRvIHByb2R1Y2UgYW4gaW1tZWRpYXRlIHN0eWxlIGNoYW5nZSkuICovXG4gICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gPSBwYXJzZUZsb2F0KG9wdHMuZHVyYXRpb24pIHx8IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIEdsb2JhbCBPcHRpb246IE1vY2tcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgaWYgKFZlbG9jaXR5Lm1vY2sgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgLyogSW4gbW9jayBtb2RlLCBhbGwgYW5pbWF0aW9ucyBhcmUgZm9yY2VkIHRvIDFtcyBzbyB0aGF0IHRoZXkgb2NjdXIgaW1tZWRpYXRlbHkgdXBvbiB0aGUgbmV4dCByQUYgdGljay5cbiAgICAgICAgICAgICAgICAgICBBbHRlcm5hdGl2ZWx5LCBhIG11bHRpcGxpZXIgY2FuIGJlIHBhc3NlZCBpbiB0byB0aW1lIHJlbWFwIGFsbCBkZWxheXMgYW5kIGR1cmF0aW9ucy4gKi9cbiAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkubW9jayA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gb3B0cy5kZWxheSA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiAqPSBwYXJzZUZsb2F0KFZlbG9jaXR5Lm1vY2spIHx8IDE7XG4gICAgICAgICAgICAgICAgICAgIG9wdHMuZGVsYXkgKj0gcGFyc2VGbG9hdChWZWxvY2l0eS5tb2NrKSB8fCAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIE9wdGlvbjogRWFzaW5nXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICBvcHRzLmVhc2luZyA9IGdldEVhc2luZyhvcHRzLmVhc2luZywgb3B0cy5kdXJhdGlvbik7XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBPcHRpb246IENhbGxiYWNrc1xuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgLyogQ2FsbGJhY2tzIG11c3QgZnVuY3Rpb25zLiBPdGhlcndpc2UsIGRlZmF1bHQgdG8gbnVsbC4gKi9cbiAgICAgICAgICAgIGlmIChvcHRzLmJlZ2luICYmICFUeXBlLmlzRnVuY3Rpb24ob3B0cy5iZWdpbikpIHtcbiAgICAgICAgICAgICAgICBvcHRzLmJlZ2luID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9wdHMucHJvZ3Jlc3MgJiYgIVR5cGUuaXNGdW5jdGlvbihvcHRzLnByb2dyZXNzKSkge1xuICAgICAgICAgICAgICAgIG9wdHMucHJvZ3Jlc3MgPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3B0cy5jb21wbGV0ZSAmJiAhVHlwZS5pc0Z1bmN0aW9uKG9wdHMuY29tcGxldGUpKSB7XG4gICAgICAgICAgICAgICAgb3B0cy5jb21wbGV0ZSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIE9wdGlvbjogRGlzcGxheSAmIFZpc2liaWxpdHlcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgLyogUmVmZXIgdG8gVmVsb2NpdHkncyBkb2N1bWVudGF0aW9uIChWZWxvY2l0eUpTLm9yZy8jZGlzcGxheUFuZFZpc2liaWxpdHkpIGZvciBhIGRlc2NyaXB0aW9uIG9mIHRoZSBkaXNwbGF5IGFuZCB2aXNpYmlsaXR5IG9wdGlvbnMnIGJlaGF2aW9yLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogV2Ugc3RyaWN0bHkgY2hlY2sgZm9yIHVuZGVmaW5lZCBpbnN0ZWFkIG9mIGZhbHNpbmVzcyBiZWNhdXNlIGRpc3BsYXkgYWNjZXB0cyBhbiBlbXB0eSBzdHJpbmcgdmFsdWUuICovXG4gICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy5kaXNwbGF5ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb3B0cy5kaXNwbGF5ID0gb3B0cy5kaXNwbGF5LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIC8qIFVzZXJzIGNhbiBwYXNzIGluIGEgc3BlY2lhbCBcImF1dG9cIiB2YWx1ZSB0byBpbnN0cnVjdCBWZWxvY2l0eSB0byBzZXQgdGhlIGVsZW1lbnQgdG8gaXRzIGRlZmF1bHQgZGlzcGxheSB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ID09PSBcImF1dG9cIikge1xuICAgICAgICAgICAgICAgICAgICBvcHRzLmRpc3BsYXkgPSBWZWxvY2l0eS5DU1MuVmFsdWVzLmdldERpc3BsYXlUeXBlKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9wdHMudmlzaWJpbGl0eSAhPT0gdW5kZWZpbmVkICYmIG9wdHMudmlzaWJpbGl0eSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG9wdHMudmlzaWJpbGl0eSA9IG9wdHMudmlzaWJpbGl0eS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBPcHRpb246IG1vYmlsZUhBXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAvKiBXaGVuIHNldCB0byB0cnVlLCBhbmQgaWYgdGhpcyBpcyBhIG1vYmlsZSBkZXZpY2UsIG1vYmlsZUhBIGF1dG9tYXRpY2FsbHkgZW5hYmxlcyBoYXJkd2FyZSBhY2NlbGVyYXRpb24gKHZpYSBhIG51bGwgdHJhbnNmb3JtIGhhY2spXG4gICAgICAgICAgICAgICBvbiBhbmltYXRpbmcgZWxlbWVudHMuIEhBIGlzIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudCBhdCB0aGUgY29tcGxldGlvbiBvZiBpdHMgYW5pbWF0aW9uLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogQW5kcm9pZCBHaW5nZXJicmVhZCBkb2Vzbid0IHN1cHBvcnQgSEEuIElmIGEgbnVsbCB0cmFuc2Zvcm0gaGFjayAobW9iaWxlSEEpIGlzIGluIGZhY3Qgc2V0LCBpdCB3aWxsIHByZXZlbnQgb3RoZXIgdHJhbmZvcm0gc3VicHJvcGVydGllcyBmcm9tIHRha2luZyBlZmZlY3QuICovXG4gICAgICAgICAgICAvKiBOb3RlOiBZb3UgY2FuIHJlYWQgbW9yZSBhYm91dCB0aGUgdXNlIG9mIG1vYmlsZUhBIGluIFZlbG9jaXR5J3MgZG9jdW1lbnRhdGlvbjogVmVsb2NpdHlKUy5vcmcvI21vYmlsZUhBLiAqL1xuICAgICAgICAgICAgb3B0cy5tb2JpbGVIQSA9IChvcHRzLm1vYmlsZUhBICYmIFZlbG9jaXR5LlN0YXRlLmlzTW9iaWxlICYmICFWZWxvY2l0eS5TdGF0ZS5pc0dpbmdlcmJyZWFkKTtcblxuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBQYXJ0IElJOiBRdWV1ZWluZ1xuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIFdoZW4gYSBzZXQgb2YgZWxlbWVudHMgaXMgdGFyZ2V0ZWQgYnkgYSBWZWxvY2l0eSBjYWxsLCB0aGUgc2V0IGlzIGJyb2tlbiB1cCBhbmQgZWFjaCBlbGVtZW50IGhhcyB0aGUgY3VycmVudCBWZWxvY2l0eSBjYWxsIGluZGl2aWR1YWxseSBxdWV1ZWQgb250byBpdC5cbiAgICAgICAgICAgICAgIEluIHRoaXMgd2F5LCBlYWNoIGVsZW1lbnQncyBleGlzdGluZyBxdWV1ZSBpcyByZXNwZWN0ZWQ7IHNvbWUgZWxlbWVudHMgbWF5IGFscmVhZHkgYmUgYW5pbWF0aW5nIGFuZCBhY2NvcmRpbmdseSBzaG91bGQgbm90IGhhdmUgdGhpcyBjdXJyZW50IFZlbG9jaXR5IGNhbGwgdHJpZ2dlcmVkIGltbWVkaWF0ZWx5LiAqL1xuICAgICAgICAgICAgLyogSW4gZWFjaCBxdWV1ZSwgdHdlZW4gZGF0YSBpcyBwcm9jZXNzZWQgZm9yIGVhY2ggYW5pbWF0aW5nIHByb3BlcnR5IHRoZW4gcHVzaGVkIG9udG8gdGhlIGNhbGwtd2lkZSBjYWxscyBhcnJheS4gV2hlbiB0aGUgbGFzdCBlbGVtZW50IGluIHRoZSBzZXQgaGFzIGhhZCBpdHMgdHdlZW5zIHByb2Nlc3NlZCxcbiAgICAgICAgICAgICAgIHRoZSBjYWxsIGFycmF5IGlzIHB1c2hlZCB0byBWZWxvY2l0eS5TdGF0ZS5jYWxscyBmb3IgbGl2ZSBwcm9jZXNzaW5nIGJ5IHRoZSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgdGljay4gKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIGJ1aWxkUXVldWUgKG5leHQpIHtcblxuICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgT3B0aW9uOiBCZWdpblxuICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAvKiBUaGUgYmVnaW4gY2FsbGJhY2sgaXMgZmlyZWQgb25jZSBwZXIgY2FsbCAtLSBub3Qgb25jZSBwZXIgZWxlbWVuZXQgLS0gYW5kIGlzIHBhc3NlZCB0aGUgZnVsbCByYXcgRE9NIGVsZW1lbnQgc2V0IGFzIGJvdGggaXRzIGNvbnRleHQgYW5kIGl0cyBmaXJzdCBhcmd1bWVudC4gKi9cbiAgICAgICAgICAgICAgICBpZiAob3B0cy5iZWdpbiAmJiBlbGVtZW50c0luZGV4ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIFdlIHRocm93IGNhbGxiYWNrcyBpbiBhIHNldFRpbWVvdXQgc28gdGhhdCB0aHJvd24gZXJyb3JzIGRvbid0IGhhbHQgdGhlIGV4ZWN1dGlvbiBvZiBWZWxvY2l0eSBpdHNlbGYuICovXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmJlZ2luLmNhbGwoZWxlbWVudHMsIGVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRocm93IGVycm9yOyB9LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgIFR3ZWVuIERhdGEgQ29uc3RydWN0aW9uIChmb3IgU2Nyb2xsKVxuICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgLyogTm90ZTogSW4gb3JkZXIgdG8gYmUgc3ViamVjdGVkIHRvIGNoYWluaW5nIGFuZCBhbmltYXRpb24gb3B0aW9ucywgc2Nyb2xsJ3MgdHdlZW5pbmcgaXMgcm91dGVkIHRocm91Z2ggVmVsb2NpdHkgYXMgaWYgaXQgd2VyZSBhIHN0YW5kYXJkIENTUyBwcm9wZXJ0eSBhbmltYXRpb24uICovXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJzY3JvbGxcIikge1xuICAgICAgICAgICAgICAgICAgICAvKiBUaGUgc2Nyb2xsIGFjdGlvbiB1bmlxdWVseSB0YWtlcyBhbiBvcHRpb25hbCBcIm9mZnNldFwiIG9wdGlvbiAtLSBzcGVjaWZpZWQgaW4gcGl4ZWxzIC0tIHRoYXQgb2Zmc2V0cyB0aGUgdGFyZ2V0ZWQgc2Nyb2xsIHBvc2l0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsRGlyZWN0aW9uID0gKC9eeCQvaS50ZXN0KG9wdHMuYXhpcykgPyBcIkxlZnRcIiA6IFwiVG9wXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ID0gcGFyc2VGbG9hdChvcHRzLm9mZnNldCkgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uQ3VycmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uQ3VycmVudEFsdGVybmF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uRW5kO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIFNjcm9sbCBhbHNvIHVuaXF1ZWx5IHRha2VzIGFuIG9wdGlvbmFsIFwiY29udGFpbmVyXCIgb3B0aW9uLCB3aGljaCBpbmRpY2F0ZXMgdGhlIHBhcmVudCBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIHNjcm9sbGVkIC0tXG4gICAgICAgICAgICAgICAgICAgICAgIGFzIG9wcG9zZWQgdG8gdGhlIGJyb3dzZXIgd2luZG93IGl0c2VsZi4gVGhpcyBpcyB1c2VmdWwgZm9yIHNjcm9sbGluZyB0b3dhcmQgYW4gZWxlbWVudCB0aGF0J3MgaW5zaWRlIGFuIG92ZXJmbG93aW5nIHBhcmVudCBlbGVtZW50LiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5jb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEVuc3VyZSB0aGF0IGVpdGhlciBhIGpRdWVyeSBvYmplY3Qgb3IgYSByYXcgRE9NIGVsZW1lbnQgd2FzIHBhc3NlZCBpbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChUeXBlLmlzV3JhcHBlZChvcHRzLmNvbnRhaW5lcikgfHwgVHlwZS5pc05vZGUob3B0cy5jb250YWluZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRXh0cmFjdCB0aGUgcmF3IERPTSBlbGVtZW50IGZyb20gdGhlIGpRdWVyeSB3cmFwcGVyLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuY29udGFpbmVyID0gb3B0cy5jb250YWluZXJbMF0gfHwgb3B0cy5jb250YWluZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogVW5saWtlIG90aGVyIHByb3BlcnRpZXMgaW4gVmVsb2NpdHksIHRoZSBicm93c2VyJ3Mgc2Nyb2xsIHBvc2l0aW9uIGlzIG5ldmVyIGNhY2hlZCBzaW5jZSBpdCBzbyBmcmVxdWVudGx5IGNoYW5nZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZHVlIHRvIHRoZSB1c2VyJ3MgbmF0dXJhbCBpbnRlcmFjdGlvbiB3aXRoIHRoZSBwYWdlKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkN1cnJlbnQgPSBvcHRzLmNvbnRhaW5lcltcInNjcm9sbFwiICsgc2Nyb2xsRGlyZWN0aW9uXTsgLyogR0VUICovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAkLnBvc2l0aW9uKCkgdmFsdWVzIGFyZSByZWxhdGl2ZSB0byB0aGUgY29udGFpbmVyJ3MgY3VycmVudGx5IHZpZXdhYmxlIGFyZWEgKHdpdGhvdXQgdGFraW5nIGludG8gYWNjb3VudCB0aGUgY29udGFpbmVyJ3MgdHJ1ZSBkaW1lbnNpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0gc2F5LCBmb3IgZXhhbXBsZSwgaWYgdGhlIGNvbnRhaW5lciB3YXMgbm90IG92ZXJmbG93aW5nKS4gVGh1cywgdGhlIHNjcm9sbCBlbmQgdmFsdWUgaXMgdGhlIHN1bSBvZiB0aGUgY2hpbGQgZWxlbWVudCdzIHBvc2l0aW9uICphbmQqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHNjcm9sbCBjb250YWluZXIncyBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkVuZCA9IChzY3JvbGxQb3NpdGlvbkN1cnJlbnQgKyAkKGVsZW1lbnQpLnBvc2l0aW9uKClbc2Nyb2xsRGlyZWN0aW9uLnRvTG93ZXJDYXNlKCldKSArIHNjcm9sbE9mZnNldDsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBhIHZhbHVlIG90aGVyIHRoYW4gYSBqUXVlcnkgb2JqZWN0IG9yIGEgcmF3IERPTSBlbGVtZW50IHdhcyBwYXNzZWQgaW4sIGRlZmF1bHQgdG8gbnVsbCBzbyB0aGF0IHRoaXMgb3B0aW9uIGlzIGlnbm9yZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuY29udGFpbmVyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSB3aW5kb3cgaXRzZWxmIGlzIGJlaW5nIHNjcm9sbGVkIC0tIG5vdCBhIGNvbnRhaW5pbmcgZWxlbWVudCAtLSBwZXJmb3JtIGEgbGl2ZSBzY3JvbGwgcG9zaXRpb24gbG9va3VwIHVzaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgYXBwcm9wcmlhdGUgY2FjaGVkIHByb3BlcnR5IG5hbWVzICh3aGljaCBkaWZmZXIgYmFzZWQgb24gYnJvd3NlciB0eXBlKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uQ3VycmVudCA9IFZlbG9jaXR5LlN0YXRlLnNjcm9sbEFuY2hvcltWZWxvY2l0eS5TdGF0ZVtcInNjcm9sbFByb3BlcnR5XCIgKyBzY3JvbGxEaXJlY3Rpb25dXTsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBXaGVuIHNjcm9sbGluZyB0aGUgYnJvd3NlciB3aW5kb3csIGNhY2hlIHRoZSBhbHRlcm5hdGUgYXhpcydzIGN1cnJlbnQgdmFsdWUgc2luY2Ugd2luZG93LnNjcm9sbFRvKCkgZG9lc24ndCBsZXQgdXMgY2hhbmdlIG9ubHkgb25lIHZhbHVlIGF0IGEgdGltZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uQ3VycmVudEFsdGVybmF0ZSA9IFZlbG9jaXR5LlN0YXRlLnNjcm9sbEFuY2hvcltWZWxvY2l0eS5TdGF0ZVtcInNjcm9sbFByb3BlcnR5XCIgKyAoc2Nyb2xsRGlyZWN0aW9uID09PSBcIkxlZnRcIiA/IFwiVG9wXCIgOiBcIkxlZnRcIildXTsgLyogR0VUICovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFVubGlrZSAkLnBvc2l0aW9uKCksICQub2Zmc2V0KCkgdmFsdWVzIGFyZSByZWxhdGl2ZSB0byB0aGUgYnJvd3NlciB3aW5kb3cncyB0cnVlIGRpbWVuc2lvbnMgLS0gbm90IG1lcmVseSBpdHMgY3VycmVudGx5IHZpZXdhYmxlIGFyZWEgLS1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZCB0aGVyZWZvcmUgZW5kIHZhbHVlcyBkbyBub3QgbmVlZCB0byBiZSBjb21wb3VuZGVkIG9udG8gY3VycmVudCB2YWx1ZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkVuZCA9ICQoZWxlbWVudCkub2Zmc2V0KClbc2Nyb2xsRGlyZWN0aW9uLnRvTG93ZXJDYXNlKCldICsgc2Nyb2xsT2Zmc2V0OyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIHRoZXJlJ3Mgb25seSBvbmUgZm9ybWF0IHRoYXQgc2Nyb2xsJ3MgYXNzb2NpYXRlZCB0d2VlbnNDb250YWluZXIgY2FuIHRha2UsIHdlIGNyZWF0ZSBpdCBtYW51YWxseS4gKi9cbiAgICAgICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWU6IHNjcm9sbFBvc2l0aW9uQ3VycmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IHNjcm9sbFBvc2l0aW9uQ3VycmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZTogc2Nyb2xsUG9zaXRpb25FbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFR5cGU6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nOiBvcHRzLmVhc2luZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxEYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogb3B0cy5jb250YWluZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogc2Nyb2xsRGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHRlcm5hdGVWYWx1ZTogc2Nyb2xsUG9zaXRpb25DdXJyZW50QWx0ZXJuYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6IGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuZGVidWcpIGNvbnNvbGUubG9nKFwidHdlZW5zQ29udGFpbmVyIChzY3JvbGwpOiBcIiwgdHdlZW5zQ29udGFpbmVyLnNjcm9sbCwgZWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgVHdlZW4gRGF0YSBDb25zdHJ1Y3Rpb24gKGZvciBSZXZlcnNlKVxuICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgIC8qIFJldmVyc2UgYWN0cyBsaWtlIGEgXCJzdGFydFwiIGFjdGlvbiBpbiB0aGF0IGEgcHJvcGVydHkgbWFwIGlzIGFuaW1hdGVkIHRvd2FyZC4gVGhlIG9ubHkgZGlmZmVyZW5jZSBpc1xuICAgICAgICAgICAgICAgICAgIHRoYXQgdGhlIHByb3BlcnR5IG1hcCB1c2VkIGZvciByZXZlcnNlIGlzIHRoZSBpbnZlcnNlIG9mIHRoZSBtYXAgdXNlZCBpbiB0aGUgcHJldmlvdXMgY2FsbC4gVGh1cywgd2UgbWFuaXB1bGF0ZVxuICAgICAgICAgICAgICAgICAgIHRoZSBwcmV2aW91cyBjYWxsIHRvIGNvbnN0cnVjdCBvdXIgbmV3IG1hcDogdXNlIHRoZSBwcmV2aW91cyBtYXAncyBlbmQgdmFsdWVzIGFzIG91ciBuZXcgbWFwJ3Mgc3RhcnQgdmFsdWVzLiBDb3B5IG92ZXIgYWxsIG90aGVyIGRhdGEuICovXG4gICAgICAgICAgICAgICAgLyogTm90ZTogUmV2ZXJzZSBjYW4gYmUgZGlyZWN0bHkgY2FsbGVkIHZpYSB0aGUgXCJyZXZlcnNlXCIgcGFyYW1ldGVyLCBvciBpdCBjYW4gYmUgaW5kaXJlY3RseSB0cmlnZ2VyZWQgdmlhIHRoZSBsb29wIG9wdGlvbi4gKExvb3BzIGFyZSBjb21wb3NlZCBvZiBtdWx0aXBsZSByZXZlcnNlcy4pICovXG4gICAgICAgICAgICAgICAgLyogTm90ZTogUmV2ZXJzZSBjYWxscyBkbyBub3QgbmVlZCB0byBiZSBjb25zZWN1dGl2ZWx5IGNoYWluZWQgb250byBhIGN1cnJlbnRseS1hbmltYXRpbmcgZWxlbWVudCBpbiBvcmRlciB0byBvcGVyYXRlIG9uIGNhY2hlZCB2YWx1ZXM7XG4gICAgICAgICAgICAgICAgICAgdGhlcmUgaXMgbm8gaGFybSB0byByZXZlcnNlIGJlaW5nIGNhbGxlZCBvbiBhIHBvdGVudGlhbGx5IHN0YWxlIGRhdGEgY2FjaGUgc2luY2UgcmV2ZXJzZSdzIGJlaGF2aW9yIGlzIHNpbXBseSBkZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgYXMgcmV2ZXJ0aW5nIHRvIHRoZSBlbGVtZW50J3MgdmFsdWVzIGFzIHRoZXkgd2VyZSBwcmlvciB0byB0aGUgcHJldmlvdXMgKlZlbG9jaXR5KiBjYWxsLiAqL1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcInJldmVyc2VcIikge1xuICAgICAgICAgICAgICAgICAgICAvKiBBYm9ydCBpZiB0aGVyZSBpcyBubyBwcmlvciBhbmltYXRpb24gZGF0YSB0byByZXZlcnNlIHRvLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoIURhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBEZXF1ZXVlIHRoZSBlbGVtZW50IHNvIHRoYXQgdGhpcyBxdWV1ZSBlbnRyeSByZWxlYXNlcyBpdHNlbGYgaW1tZWRpYXRlbHksIGFsbG93aW5nIHN1YnNlcXVlbnQgcXVldWUgZW50cmllcyB0byBydW4uICovXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmRlcXVldWUoZWxlbWVudCwgb3B0cy5xdWV1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIE9wdGlvbnMgUGFyc2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgZWxlbWVudCB3YXMgaGlkZGVuIHZpYSB0aGUgZGlzcGxheSBvcHRpb24gaW4gdGhlIHByZXZpb3VzIGNhbGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICByZXZlcnQgZGlzcGxheSB0byBcImF1dG9cIiBwcmlvciB0byByZXZlcnNhbCBzbyB0aGF0IHRoZSBlbGVtZW50IGlzIHZpc2libGUgYWdhaW4uICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KS5vcHRzLmRpc3BsYXkgPT09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5vcHRzLmRpc3BsYXkgPSBcImF1dG9cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkub3B0cy52aXNpYmlsaXR5ID09PSBcImhpZGRlblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5vcHRzLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGxvb3Agb3B0aW9uIHdhcyBzZXQgaW4gdGhlIHByZXZpb3VzIGNhbGwsIGRpc2FibGUgaXQgc28gdGhhdCBcInJldmVyc2VcIiBjYWxscyBhcmVuJ3QgcmVjdXJzaXZlbHkgZ2VuZXJhdGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgRnVydGhlciwgcmVtb3ZlIHRoZSBwcmV2aW91cyBjYWxsJ3MgY2FsbGJhY2sgb3B0aW9uczsgdHlwaWNhbGx5LCB1c2VycyBkbyBub3Qgd2FudCB0aGVzZSB0byBiZSByZWZpcmVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5vcHRzLmxvb3AgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkub3B0cy5iZWdpbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLm9wdHMuY29tcGxldGUgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSB3ZSdyZSBleHRlbmRpbmcgYW4gb3B0cyBvYmplY3QgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIGV4dGVuZGVkIHdpdGggdGhlIGRlZmF1bHRzIG9wdGlvbnMgb2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgd2UgcmVtb3ZlIG5vbi1leHBsaWNpdGx5LWRlZmluZWQgcHJvcGVydGllcyB0aGF0IGFyZSBhdXRvLWFzc2lnbmVkIHZhbHVlcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5lYXNpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgb3B0cy5lYXNpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5kdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvcHRzLmR1cmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgb3B0cyBvYmplY3QgdXNlZCBmb3IgcmV2ZXJzYWwgaXMgYW4gZXh0ZW5zaW9uIG9mIHRoZSBvcHRpb25zIG9iamVjdCBvcHRpb25hbGx5IHBhc3NlZCBpbnRvIHRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldmVyc2UgY2FsbCBwbHVzIHRoZSBvcHRpb25zIHVzZWQgaW4gdGhlIHByZXZpb3VzIFZlbG9jaXR5IGNhbGwuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRzID0gJC5leHRlbmQoe30sIERhdGEoZWxlbWVudCkub3B0cywgb3B0cyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBUd2VlbnMgQ29udGFpbmVyIFJlY29uc3RydWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBDcmVhdGUgYSBkZWVweSBjb3B5IChpbmRpY2F0ZWQgdmlhIHRoZSB0cnVlIGZsYWcpIG9mIHRoZSBwcmV2aW91cyBjYWxsJ3MgdHdlZW5zQ29udGFpbmVyLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RUd2VlbnNDb250YWluZXIgPSAkLmV4dGVuZCh0cnVlLCB7fSwgRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBNYW5pcHVsYXRlIHRoZSBwcmV2aW91cyB0d2VlbnNDb250YWluZXIgYnkgcmVwbGFjaW5nIGl0cyBlbmQgdmFsdWVzIGFuZCBjdXJyZW50VmFsdWVzIHdpdGggaXRzIHN0YXJ0IHZhbHVlcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGxhc3RUd2VlbiBpbiBsYXN0VHdlZW5zQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSW4gYWRkaXRpb24gdG8gdHdlZW4gZGF0YSwgdHdlZW5zQ29udGFpbmVycyBjb250YWluIGFuIGVsZW1lbnQgcHJvcGVydHkgdGhhdCB3ZSBpZ25vcmUgaGVyZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdFR3ZWVuICE9PSBcImVsZW1lbnRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFN0YXJ0VmFsdWUgPSBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uc3RhcnRWYWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uc3RhcnRWYWx1ZSA9IGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXS5jdXJyZW50VmFsdWUgPSBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uZW5kVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXS5lbmRWYWx1ZSA9IGxhc3RTdGFydFZhbHVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEVhc2luZyBpcyB0aGUgb25seSBvcHRpb24gdGhhdCBlbWJlZHMgaW50byB0aGUgaW5kaXZpZHVhbCB0d2VlbiBkYXRhIChzaW5jZSBpdCBjYW4gYmUgZGVmaW5lZCBvbiBhIHBlci1wcm9wZXJ0eSBiYXNpcykuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFjY29yZGluZ2x5LCBldmVyeSBwcm9wZXJ0eSdzIGVhc2luZyB2YWx1ZSBtdXN0IGJlIHVwZGF0ZWQgd2hlbiBhbiBvcHRpb25zIG9iamVjdCBpcyBwYXNzZWQgaW4gd2l0aCBhIHJldmVyc2UgY2FsbC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIHNpZGUgZWZmZWN0IG9mIHRoaXMgZXh0ZW5zaWJpbGl0eSBpcyB0aGF0IGFsbCBwZXItcHJvcGVydHkgZWFzaW5nIHZhbHVlcyBhcmUgZm9yY2VmdWxseSByZXNldCB0byB0aGUgbmV3IHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIVR5cGUuaXNFbXB0eU9iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLmVhc2luZyA9IG9wdHMuZWFzaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnKSBjb25zb2xlLmxvZyhcInJldmVyc2UgdHdlZW5zQ29udGFpbmVyIChcIiArIGxhc3RUd2VlbiArIFwiKTogXCIgKyBKU09OLnN0cmluZ2lmeShsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0pLCBlbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuc0NvbnRhaW5lciA9IGxhc3RUd2VlbnNDb250YWluZXI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgIFR3ZWVuIERhdGEgQ29uc3RydWN0aW9uIChmb3IgU3RhcnQpXG4gICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJzdGFydFwiKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgIFZhbHVlIFRyYW5zZmVycmluZ1xuICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgcXVldWUgZW50cnkgZm9sbG93cyBhIHByZXZpb3VzIFZlbG9jaXR5LWluaXRpYXRlZCBxdWV1ZSBlbnRyeSAqYW5kKiBpZiB0aGlzIGVudHJ5IHdhcyBjcmVhdGVkXG4gICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIHRoZSBlbGVtZW50IHdhcyBpbiB0aGUgcHJvY2VzcyBvZiBiZWluZyBhbmltYXRlZCBieSBWZWxvY2l0eSwgdGhlbiB0aGlzIGN1cnJlbnQgY2FsbCBpcyBzYWZlIHRvIHVzZVxuICAgICAgICAgICAgICAgICAgICAgICB0aGUgZW5kIHZhbHVlcyBmcm9tIHRoZSBwcmlvciBjYWxsIGFzIGl0cyBzdGFydCB2YWx1ZXMuIFZlbG9jaXR5IGF0dGVtcHRzIHRvIHBlcmZvcm0gdGhpcyB2YWx1ZSB0cmFuc2ZlclxuICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzIHdoZW5ldmVyIHBvc3NpYmxlIGluIG9yZGVyIHRvIGF2b2lkIHJlcXVlcnlpbmcgdGhlIERPTS4gKi9cbiAgICAgICAgICAgICAgICAgICAgLyogSWYgdmFsdWVzIGFyZW4ndCB0cmFuc2ZlcnJlZCBmcm9tIGEgcHJpb3IgY2FsbCBhbmQgc3RhcnQgdmFsdWVzIHdlcmUgbm90IGZvcmNlZmVkIGJ5IHRoZSB1c2VyIChtb3JlIG9uIHRoaXMgYmVsb3cpLFxuICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHRoZSBET00gaXMgcXVlcmllZCBmb3IgdGhlIGVsZW1lbnQncyBjdXJyZW50IHZhbHVlcyBhcyBhIGxhc3QgcmVzb3J0LiAqL1xuICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBDb252ZXJzZWx5LCBhbmltYXRpb24gcmV2ZXJzYWwgKGFuZCBsb29waW5nKSAqYWx3YXlzKiBwZXJmb3JtIGludGVyLWNhbGwgdmFsdWUgdHJhbnNmZXJzOyB0aGV5IG5ldmVyIHJlcXVlcnkgdGhlIERPTS4gKi9cbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RUd2VlbnNDb250YWluZXI7XG5cbiAgICAgICAgICAgICAgICAgICAgLyogVGhlIHBlci1lbGVtZW50IGlzQW5pbWF0aW5nIGZsYWcgaXMgdXNlZCB0byBpbmRpY2F0ZSB3aGV0aGVyIGl0J3Mgc2FmZSAoaS5lLiB0aGUgZGF0YSBpc24ndCBzdGFsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgdG8gdHJhbnNmZXIgb3ZlciBlbmQgdmFsdWVzIHRvIHVzZSBhcyBzdGFydCB2YWx1ZXMuIElmIGl0J3Mgc2V0IHRvIHRydWUgYW5kIHRoZXJlIGlzIGEgcHJldmlvdXNcbiAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkgY2FsbCB0byBwdWxsIHZhbHVlcyBmcm9tLCBkbyBzby4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyICYmIERhdGEoZWxlbWVudCkuaXNBbmltYXRpbmcgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUd2VlbnNDb250YWluZXIgPSBEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgVHdlZW4gRGF0YSBDYWxjdWxhdGlvblxuICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAgICAgLyogVGhpcyBmdW5jdGlvbiBwYXJzZXMgcHJvcGVydHkgZGF0YSBhbmQgZGVmYXVsdHMgZW5kVmFsdWUsIGVhc2luZywgYW5kIHN0YXJ0VmFsdWUgYXMgYXBwcm9wcmlhdGUuICovXG4gICAgICAgICAgICAgICAgICAgIC8qIFByb3BlcnR5IG1hcCB2YWx1ZXMgY2FuIGVpdGhlciB0YWtlIHRoZSBmb3JtIG9mIDEpIGEgc2luZ2xlIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgZW5kIHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICBvciAyKSBhbiBhcnJheSBpbiB0aGUgZm9ybSBvZiBbIGVuZFZhbHVlLCBbLCBlYXNpbmddIFssIHN0YXJ0VmFsdWVdIF0uXG4gICAgICAgICAgICAgICAgICAgICAgIFRoZSBvcHRpb25hbCB0aGlyZCBwYXJhbWV0ZXIgaXMgYSBmb3JjZWZlZCBzdGFydFZhbHVlIHRvIGJlIHVzZWQgaW5zdGVhZCBvZiBxdWVyeWluZyB0aGUgRE9NIGZvclxuICAgICAgICAgICAgICAgICAgICAgICB0aGUgZWxlbWVudCdzIGN1cnJlbnQgdmFsdWUuIFJlYWQgVmVsb2NpdHkncyBkb2NtZW50YXRpb24gdG8gbGVhcm4gbW9yZSBhYm91dCBmb3JjZWZlZWRpbmc6IFZlbG9jaXR5SlMub3JnLyNmb3JjZWZlZWRpbmcgKi9cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gcGFyc2VQcm9wZXJ0eVZhbHVlICh2YWx1ZURhdGEsIHNraXBSZXNvbHZpbmdFYXNpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbmRWYWx1ZSA9IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSGFuZGxlIHRoZSBhcnJheSBmb3JtYXQsIHdoaWNoIGNhbiBiZSBzdHJ1Y3R1cmVkIGFzIG9uZSBvZiB0aHJlZSBwb3RlbnRpYWwgb3ZlcmxvYWRzOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgQSkgWyBlbmRWYWx1ZSwgZWFzaW5nLCBzdGFydFZhbHVlIF0sIEIpIFsgZW5kVmFsdWUsIGVhc2luZyBdLCBvciBDKSBbIGVuZFZhbHVlLCBzdGFydFZhbHVlIF0gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChUeXBlLmlzQXJyYXkodmFsdWVEYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGVuZFZhbHVlIGlzIGFsd2F5cyB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgYXJyYXkuIERvbid0IGJvdGhlciB2YWxpZGF0aW5nIGVuZFZhbHVlJ3MgdmFsdWUgbm93XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luY2UgdGhlIGVuc3VpbmcgcHJvcGVydHkgY3ljbGluZyBsb2dpYyBkb2VzIHRoYXQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSB2YWx1ZURhdGFbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUd28taXRlbSBhcnJheSBmb3JtYXQ6IElmIHRoZSBzZWNvbmQgaXRlbSBpcyBhIG51bWJlciwgZnVuY3Rpb24sIG9yIGhleCBzdHJpbmcsIHRyZWF0IGl0IGFzIGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydCB2YWx1ZSBzaW5jZSBlYXNpbmdzIGNhbiBvbmx5IGJlIG5vbi1oZXggc3RyaW5ncyBvciBhcnJheXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCghVHlwZS5pc0FycmF5KHZhbHVlRGF0YVsxXSkgJiYgL15bXFxkLV0vLnRlc3QodmFsdWVEYXRhWzFdKSkgfHwgVHlwZS5pc0Z1bmN0aW9uKHZhbHVlRGF0YVsxXSkgfHwgQ1NTLlJlZ0V4LmlzSGV4LnRlc3QodmFsdWVEYXRhWzFdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gdmFsdWVEYXRhWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFR3byBvciB0aHJlZS1pdGVtIGFycmF5OiBJZiB0aGUgc2Vjb25kIGl0ZW0gaXMgYSBub24taGV4IHN0cmluZyBvciBhbiBhcnJheSwgdHJlYXQgaXQgYXMgYW4gZWFzaW5nLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKFR5cGUuaXNTdHJpbmcodmFsdWVEYXRhWzFdKSAmJiAhQ1NTLlJlZ0V4LmlzSGV4LnRlc3QodmFsdWVEYXRhWzFdKSkgfHwgVHlwZS5pc0FycmF5KHZhbHVlRGF0YVsxXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gc2tpcFJlc29sdmluZ0Vhc2luZyA/IHZhbHVlRGF0YVsxXSA6IGdldEVhc2luZyh2YWx1ZURhdGFbMV0sIG9wdHMuZHVyYXRpb24pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIERvbid0IGJvdGhlciB2YWxpZGF0aW5nIHN0YXJ0VmFsdWUncyB2YWx1ZSBub3cgc2luY2UgdGhlIGVuc3VpbmcgcHJvcGVydHkgY3ljbGluZyBsb2dpYyBpbmhlcmVudGx5IGRvZXMgdGhhdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlRGF0YVsyXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gdmFsdWVEYXRhWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSGFuZGxlIHRoZSBzaW5nbGUtdmFsdWUgZm9ybWF0LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHZhbHVlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogRGVmYXVsdCB0byB0aGUgY2FsbCdzIGVhc2luZyBpZiBhIHBlci1wcm9wZXJ0eSBlYXNpbmcgdHlwZSB3YXMgbm90IGRlZmluZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNraXBSZXNvbHZpbmdFYXNpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSBlYXNpbmcgfHwgb3B0cy5lYXNpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIGZ1bmN0aW9ucyB3ZXJlIHBhc3NlZCBpbiBhcyB2YWx1ZXMsIHBhc3MgdGhlIGZ1bmN0aW9uIHRoZSBjdXJyZW50IGVsZW1lbnQgYXMgaXRzIGNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVzIHRoZSBlbGVtZW50J3MgaW5kZXggYW5kIHRoZSBlbGVtZW50IHNldCdzIHNpemUgYXMgYXJndW1lbnRzLiBUaGVuLCBhc3NpZ24gdGhlIHJldHVybmVkIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFR5cGUuaXNGdW5jdGlvbihlbmRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IGVuZFZhbHVlLmNhbGwoZWxlbWVudCwgZWxlbWVudHNJbmRleCwgZWxlbWVudHNMZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc0Z1bmN0aW9uKHN0YXJ0VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHN0YXJ0VmFsdWUuY2FsbChlbGVtZW50LCBlbGVtZW50c0luZGV4LCBlbGVtZW50c0xlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFsbG93IHN0YXJ0VmFsdWUgdG8gYmUgbGVmdCBhcyB1bmRlZmluZWQgdG8gaW5kaWNhdGUgdG8gdGhlIGVuc3VpbmcgY29kZSB0aGF0IGl0cyB2YWx1ZSB3YXMgbm90IGZvcmNlZmVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgZW5kVmFsdWUgfHwgMCwgZWFzaW5nLCBzdGFydFZhbHVlIF07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBDeWNsZSB0aHJvdWdoIGVhY2ggcHJvcGVydHkgaW4gdGhlIG1hcCwgbG9va2luZyBmb3Igc2hvcnRoYW5kIGNvbG9yIHByb3BlcnRpZXMgKGUuZy4gXCJjb2xvclwiIGFzIG9wcG9zZWQgdG8gXCJjb2xvclJlZFwiKS4gSW5qZWN0IHRoZSBjb3JyZXNwb25kaW5nXG4gICAgICAgICAgICAgICAgICAgICAgIGNvbG9yUmVkLCBjb2xvckdyZWVuLCBhbmQgY29sb3JCbHVlIFJHQiBjb21wb25lbnQgdHdlZW5zIGludG8gdGhlIHByb3BlcnRpZXNNYXAgKHdoaWNoIFZlbG9jaXR5IHVuZGVyc3RhbmRzKSBhbmQgcmVtb3ZlIHRoZSBzaG9ydGhhbmQgcHJvcGVydHkuICovXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChwcm9wZXJ0aWVzTWFwLCBmdW5jdGlvbihwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZpbmQgc2hvcnRoYW5kIGNvbG9yIHByb3BlcnRpZXMgdGhhdCBoYXZlIGJlZW4gcGFzc2VkIGEgaGV4IHN0cmluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChSZWdFeHAoXCJeXCIgKyBDU1MuTGlzdHMuY29sb3JzLmpvaW4oXCIkfF5cIikgKyBcIiRcIikudGVzdChwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBQYXJzZSB0aGUgdmFsdWUgZGF0YSBmb3IgZWFjaCBzaG9ydGhhbmQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlRGF0YSA9IHBhcnNlUHJvcGVydHlWYWx1ZSh2YWx1ZSwgdHJ1ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gdmFsdWVEYXRhWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSB2YWx1ZURhdGFbMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSB2YWx1ZURhdGFbMl07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLlJlZ0V4LmlzSGV4LnRlc3QoZW5kVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnZlcnQgdGhlIGhleCBzdHJpbmdzIGludG8gdGhlaXIgUkdCIGNvbXBvbmVudCBhcnJheXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2xvckNvbXBvbmVudHMgPSBbIFwiUmVkXCIsIFwiR3JlZW5cIiwgXCJCbHVlXCIgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlUkdCID0gQ1NTLlZhbHVlcy5oZXhUb1JnYihlbmRWYWx1ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlUkdCID0gc3RhcnRWYWx1ZSA/IENTUy5WYWx1ZXMuaGV4VG9SZ2Ioc3RhcnRWYWx1ZSkgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSW5qZWN0IHRoZSBSR0IgY29tcG9uZW50IHR3ZWVucyBpbnRvIHByb3BlcnRpZXNNYXAuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sb3JDb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YUFycmF5ID0gWyBlbmRWYWx1ZVJHQltpXSBdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWFzaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YUFycmF5LnB1c2goZWFzaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0VmFsdWVSR0IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFBcnJheS5wdXNoKHN0YXJ0VmFsdWVSR0JbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzTWFwW3Byb3BlcnR5ICsgY29sb3JDb21wb25lbnRzW2ldXSA9IGRhdGFBcnJheTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFJlbW92ZSB0aGUgaW50ZXJtZWRpYXJ5IHNob3J0aGFuZCBwcm9wZXJ0eSBlbnRyeSBub3cgdGhhdCB3ZSd2ZSBwcm9jZXNzZWQgaXQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBwcm9wZXJ0aWVzTWFwW3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIENyZWF0ZSBhIHR3ZWVuIG91dCBvZiBlYWNoIHByb3BlcnR5LCBhbmQgYXBwZW5kIGl0cyBhc3NvY2lhdGVkIGRhdGEgdG8gdHdlZW5zQ29udGFpbmVyLiAqL1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBwcm9wZXJ0aWVzTWFwKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RhcnQgVmFsdWUgU291cmNpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBQYXJzZSBvdXQgZW5kVmFsdWUsIGVhc2luZywgYW5kIHN0YXJ0VmFsdWUgZnJvbSB0aGUgcHJvcGVydHkncyBkYXRhLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlRGF0YSA9IHBhcnNlUHJvcGVydHlWYWx1ZShwcm9wZXJ0aWVzTWFwW3Byb3BlcnR5XSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSB2YWx1ZURhdGFbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gdmFsdWVEYXRhWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSB2YWx1ZURhdGFbMl07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdyB0aGF0IHRoZSBvcmlnaW5hbCBwcm9wZXJ0eSBuYW1lJ3MgZm9ybWF0IGhhcyBiZWVuIHVzZWQgZm9yIHRoZSBwYXJzZVByb3BlcnR5VmFsdWUoKSBsb29rdXAgYWJvdmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB3ZSBmb3JjZSB0aGUgcHJvcGVydHkgdG8gaXRzIGNhbWVsQ2FzZSBzdHlsaW5nIHRvIG5vcm1hbGl6ZSBpdCBmb3IgbWFuaXB1bGF0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkgPSBDU1MuTmFtZXMuY2FtZWxDYXNlKHByb3BlcnR5KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSW4gY2FzZSB0aGlzIHByb3BlcnR5IGlzIGEgaG9vaywgdGhlcmUgYXJlIGNpcmN1bXN0YW5jZXMgd2hlcmUgd2Ugd2lsbCBpbnRlbmQgdG8gd29yayBvbiB0aGUgaG9vaydzIHJvb3QgcHJvcGVydHkgYW5kIG5vdCB0aGUgaG9va2VkIHN1YnByb3BlcnR5LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvb3RQcm9wZXJ0eSA9IENTUy5Ib29rcy5nZXRSb290KHByb3BlcnR5KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBPdGhlciB0aGFuIGZvciB0aGUgZHVtbXkgdHdlZW4gcHJvcGVydHksIHByb3BlcnRpZXMgdGhhdCBhcmUgbm90IHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlciAoYW5kIGRvIG5vdCBoYXZlIGFuIGFzc29jaWF0ZWQgbm9ybWFsaXphdGlvbikgd2lsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5oZXJlbnRseSBwcm9kdWNlIG5vIHN0eWxlIGNoYW5nZXMgd2hlbiBzZXQsIHNvIHRoZXkgYXJlIHNraXBwZWQgaW4gb3JkZXIgdG8gZGVjcmVhc2UgYW5pbWF0aW9uIHRpY2sgb3ZlcmhlYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9wZXJ0eSBzdXBwb3J0IGlzIGRldGVybWluZWQgdmlhIHByZWZpeENoZWNrKCksIHdoaWNoIHJldHVybnMgYSBmYWxzZSBmbGFnIHdoZW4gbm8gc3VwcG9ydGVkIGlzIGRldGVjdGVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogU2luY2UgU1ZHIGVsZW1lbnRzIGhhdmUgc29tZSBvZiB0aGVpciBwcm9wZXJ0aWVzIGRpcmVjdGx5IGFwcGxpZWQgYXMgSFRNTCBhdHRyaWJ1dGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlcmUgaXMgbm8gd2F5IHRvIGNoZWNrIGZvciB0aGVpciBleHBsaWNpdCBicm93c2VyIHN1cHBvcnQsIGFuZCBzbyB3ZSBza2lwIHNraXAgdGhpcyBjaGVjayBmb3IgdGhlbS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghRGF0YShlbGVtZW50KS5pc1NWRyAmJiByb290UHJvcGVydHkgIT09IFwidHdlZW5cIiAmJiBDU1MuTmFtZXMucHJlZml4Q2hlY2socm9vdFByb3BlcnR5KVsxXSA9PT0gZmFsc2UgJiYgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcm9vdFByb3BlcnR5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnKSBjb25zb2xlLmxvZyhcIlNraXBwaW5nIFtcIiArIHJvb3RQcm9wZXJ0eSArIFwiXSBkdWUgdG8gYSBsYWNrIG9mIGJyb3dzZXIgc3VwcG9ydC5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGRpc3BsYXkgb3B0aW9uIGlzIGJlaW5nIHNldCB0byBhIG5vbi1cIm5vbmVcIiAoZS5nLiBcImJsb2NrXCIpIGFuZCBvcGFjaXR5IChmaWx0ZXIgb24gSUU8PTgpIGlzIGJlaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRlZCB0byBhbiBlbmRWYWx1ZSBvZiBub24temVybywgdGhlIHVzZXIncyBpbnRlbnRpb24gaXMgdG8gZmFkZSBpbiBmcm9tIGludmlzaWJsZSwgdGh1cyB3ZSBmb3JjZWZlZWQgb3BhY2l0eVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYSBzdGFydFZhbHVlIG9mIDAgaWYgaXRzIHN0YXJ0VmFsdWUgaGFzbid0IGFscmVhZHkgYmVlbiBzb3VyY2VkIGJ5IHZhbHVlIHRyYW5zZmVycmluZyBvciBwcmlvciBmb3JjZWZlZWRpbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKChvcHRzLmRpc3BsYXkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLmRpc3BsYXkgIT09IG51bGwgJiYgb3B0cy5kaXNwbGF5ICE9PSBcIm5vbmVcIikgfHwgKG9wdHMudmlzaWJpbGl0eSAhPT0gdW5kZWZpbmVkICYmIG9wdHMudmlzaWJpbGl0eSAhPT0gXCJoaWRkZW5cIikpICYmIC9vcGFjaXR5fGZpbHRlci8udGVzdChwcm9wZXJ0eSkgJiYgIXN0YXJ0VmFsdWUgJiYgZW5kVmFsdWUgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdmFsdWVzIGhhdmUgYmVlbiB0cmFuc2ZlcnJlZCBmcm9tIHRoZSBwcmV2aW91cyBWZWxvY2l0eSBjYWxsLCBleHRyYWN0IHRoZSBlbmRWYWx1ZSBhbmQgcm9vdFByb3BlcnR5VmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBhbGwgb2YgdGhlIGN1cnJlbnQgY2FsbCdzIHByb3BlcnRpZXMgdGhhdCB3ZXJlICphbHNvKiBhbmltYXRlZCBpbiB0aGUgcHJldmlvdXMgY2FsbC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFZhbHVlIHRyYW5zZmVycmluZyBjYW4gb3B0aW9uYWxseSBiZSBkaXNhYmxlZCBieSB0aGUgdXNlciB2aWEgdGhlIF9jYWNoZVZhbHVlcyBvcHRpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5fY2FjaGVWYWx1ZXMgJiYgbGFzdFR3ZWVuc0NvbnRhaW5lciAmJiBsYXN0VHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFydFZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IGxhc3RUd2VlbnNDb250YWluZXJbcHJvcGVydHldLmVuZFZhbHVlICsgbGFzdFR3ZWVuc0NvbnRhaW5lcltwcm9wZXJ0eV0udW5pdFR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIHByZXZpb3VzIGNhbGwncyByb290UHJvcGVydHlWYWx1ZSBpcyBleHRyYWN0ZWQgZnJvbSB0aGUgZWxlbWVudCdzIGRhdGEgY2FjaGUgc2luY2UgdGhhdCdzIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlIG9mIHJvb3RQcm9wZXJ0eVZhbHVlIHRoYXQgZ2V0cyBmcmVzaGx5IHVwZGF0ZWQgYnkgdGhlIHR3ZWVuaW5nIHByb2Nlc3MsIHdoZXJlYXMgdGhlIHJvb3RQcm9wZXJ0eVZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0YWNoZWQgdG8gdGhlIGluY29taW5nIGxhc3RUd2VlbnNDb250YWluZXIgaXMgZXF1YWwgdG8gdGhlIHJvb3QgcHJvcGVydHkncyB2YWx1ZSBwcmlvciB0byBhbnkgdHdlZW5pbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBEYXRhKGVsZW1lbnQpLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGVbcm9vdFByb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHZhbHVlcyB3ZXJlIG5vdCB0cmFuc2ZlcnJlZCBmcm9tIGEgcHJldmlvdXMgVmVsb2NpdHkgY2FsbCwgcXVlcnkgdGhlIERPTSBhcyBuZWVkZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEhhbmRsZSBob29rZWQgcHJvcGVydGllcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0VmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCByb290UHJvcGVydHkpOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFRoZSBmb2xsb3dpbmcgZ2V0UHJvcGVydHlWYWx1ZSgpIGNhbGwgZG9lcyBub3QgYWN0dWFsbHkgdHJpZ2dlciBhIERPTSBxdWVyeTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldFByb3BlcnR5VmFsdWUoKSB3aWxsIGV4dHJhY3QgdGhlIGhvb2sgZnJvbSByb290UHJvcGVydHlWYWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBwcm9wZXJ0eSwgcm9vdFByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBzdGFydFZhbHVlIGlzIGFscmVhZHkgZGVmaW5lZCB2aWEgZm9yY2VmZWVkaW5nLCBkbyBub3QgcXVlcnkgdGhlIERPTSBmb3IgdGhlIHJvb3QgcHJvcGVydHkncyB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganVzdCBncmFiIHJvb3RQcm9wZXJ0eSdzIHplcm8tdmFsdWUgdGVtcGxhdGUgZnJvbSBDU1MuSG9va3MuIFRoaXMgb3ZlcndyaXRlcyB0aGUgZWxlbWVudCdzIGFjdHVhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290IHByb3BlcnR5IHZhbHVlIChpZiBvbmUgaXMgc2V0KSwgYnV0IHRoaXMgaXMgYWNjZXB0YWJsZSBzaW5jZSB0aGUgcHJpbWFyeSByZWFzb24gdXNlcnMgZm9yY2VmZWVkIGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvIGF2b2lkIERPTSBxdWVyaWVzLCBhbmQgdGh1cyB3ZSBsaWtld2lzZSBhdm9pZCBxdWVyeWluZyB0aGUgRE9NIGZvciB0aGUgcm9vdCBwcm9wZXJ0eSdzIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogR3JhYiB0aGlzIGhvb2sncyB6ZXJvLXZhbHVlIHRlbXBsYXRlLCBlLmcuIFwiMHB4IDBweCAwcHggYmxhY2tcIi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLnRlbXBsYXRlc1tyb290UHJvcGVydHldWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSGFuZGxlIG5vbi1ob29rZWQgcHJvcGVydGllcyB0aGF0IGhhdmVuJ3QgYWxyZWFkeSBiZWVuIGRlZmluZWQgdmlhIGZvcmNlZmVlZGluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXJ0VmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgcHJvcGVydHkpOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgVmFsdWUgRGF0YSBFeHRyYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlcGFyYXRlZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZVVuaXRUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNlcGFyYXRlcyBhIHByb3BlcnR5IHZhbHVlIGludG8gaXRzIG51bWVyaWMgdmFsdWUgYW5kIGl0cyB1bml0IHR5cGUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBzZXBhcmF0ZVZhbHVlIChwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdW5pdFR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyaWNWYWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyaWNWYWx1ZSA9ICh2YWx1ZSB8fCBcIjBcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTWF0Y2ggdGhlIHVuaXQgdHlwZSBhdCB0aGUgZW5kIG9mIHRoZSB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1slQS16XSskLywgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEdyYWIgdGhlIHVuaXQgdHlwZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRUeXBlID0gbWF0Y2g7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0cmlwIHRoZSB1bml0IHR5cGUgb2ZmIG9mIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgbm8gdW5pdCB0eXBlIHdhcyBzdXBwbGllZCwgYXNzaWduIG9uZSB0aGF0IGlzIGFwcHJvcHJpYXRlIGZvciB0aGlzIHByb3BlcnR5IChlLmcuIFwiZGVnXCIgZm9yIHJvdGF0ZVogb3IgXCJweFwiIGZvciB3aWR0aCkuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF1bml0VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0VHlwZSA9IENTUy5WYWx1ZXMuZ2V0VW5pdFR5cGUocHJvcGVydHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbIG51bWVyaWNWYWx1ZSwgdW5pdFR5cGUgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogU2VwYXJhdGUgc3RhcnRWYWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcGFyYXRlZFZhbHVlID0gc2VwYXJhdGVWYWx1ZShwcm9wZXJ0eSwgc3RhcnRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gc2VwYXJhdGVkVmFsdWVbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlVW5pdFR5cGUgPSBzZXBhcmF0ZWRWYWx1ZVsxXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogU2VwYXJhdGUgZW5kVmFsdWUsIGFuZCBleHRyYWN0IGEgdmFsdWUgb3BlcmF0b3IgKGUuZy4gXCIrPVwiLCBcIi09XCIpIGlmIG9uZSBleGlzdHMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXBhcmF0ZWRWYWx1ZSA9IHNlcGFyYXRlVmFsdWUocHJvcGVydHksIGVuZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc2VwYXJhdGVkVmFsdWVbMF0ucmVwbGFjZSgvXihbKy1cXC8qXSk9LywgZnVuY3Rpb24obWF0Y2gsIHN1Yk1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSBzdWJNYXRjaDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0cmlwIHRoZSBvcGVyYXRvciBvZmYgb2YgdGhlIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlID0gc2VwYXJhdGVkVmFsdWVbMV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFBhcnNlIGZsb2F0IHZhbHVlcyBmcm9tIGVuZFZhbHVlIGFuZCBzdGFydFZhbHVlLiBEZWZhdWx0IHRvIDAgaWYgTmFOIGlzIHJldHVybmVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHBhcnNlRmxvYXQoc3RhcnRWYWx1ZSkgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gcGFyc2VGbG9hdChlbmRWYWx1ZSkgfHwgMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJvcGVydHktU3BlY2lmaWMgVmFsdWUgQ29udmVyc2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBDdXN0b20gc3VwcG9ydCBmb3IgcHJvcGVydGllcyB0aGF0IGRvbid0IGFjdHVhbGx5IGFjY2VwdCB0aGUgJSB1bml0IHR5cGUsIGJ1dCB3aGVyZSBwb2xseWZpbGxpbmcgaXMgdHJpdmlhbCBhbmQgcmVsYXRpdmVseSBmb29scHJvb2YuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW5kVmFsdWVVbml0VHlwZSA9PT0gXCIlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBBICUtdmFsdWUgZm9udFNpemUvbGluZUhlaWdodCBpcyByZWxhdGl2ZSB0byB0aGUgcGFyZW50J3MgZm9udFNpemUgKGFzIG9wcG9zZWQgdG8gdGhlIHBhcmVudCdzIGRpbWVuc2lvbnMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWNoIGlzIGlkZW50aWNhbCB0byB0aGUgZW0gdW5pdCdzIGJlaGF2aW9yLCBzbyB3ZSBwaWdneWJhY2sgb2ZmIG9mIHRoYXQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9eKGZvbnRTaXplfGxpbmVIZWlnaHQpJC8udGVzdChwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29udmVydCAlIGludG8gYW4gZW0gZGVjaW1hbCB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSBlbmRWYWx1ZSAvIDEwMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWVVbml0VHlwZSA9IFwiZW1cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBGb3Igc2NhbGVYIGFuZCBzY2FsZVksIGNvbnZlcnQgdGhlIHZhbHVlIGludG8gaXRzIGRlY2ltYWwgZm9ybWF0IGFuZCBzdHJpcCBvZmYgdGhlIHVuaXQgdHlwZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9ec2NhbGUvLnRlc3QocHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gZW5kVmFsdWUgLyAxMDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZvciBSR0IgY29tcG9uZW50cywgdGFrZSB0aGUgZGVmaW5lZCBwZXJjZW50YWdlIG9mIDI1NSBhbmQgc3RyaXAgb2ZmIHRoZSB1bml0IHR5cGUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvKFJlZHxHcmVlbnxCbHVlKSQvaS50ZXN0KHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IChlbmRWYWx1ZSAvIDEwMCkgKiAyNTU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgVW5pdCBSYXRpbyBDYWxjdWxhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBXaGVuIHF1ZXJpZWQsIHRoZSBicm93c2VyIHJldHVybnMgKG1vc3QpIENTUyBwcm9wZXJ0eSB2YWx1ZXMgaW4gcGl4ZWxzLiBUaGVyZWZvcmUsIGlmIGFuIGVuZFZhbHVlIHdpdGggYSB1bml0IHR5cGUgb2ZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICUsIGVtLCBvciByZW0gaXMgYW5pbWF0ZWQgdG93YXJkLCBzdGFydFZhbHVlIG11c3QgYmUgY29udmVydGVkIGZyb20gcGl4ZWxzIGludG8gdGhlIHNhbWUgdW5pdCB0eXBlIGFzIGVuZFZhbHVlIGluIG9yZGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgdmFsdWUgbWFuaXB1bGF0aW9uIGxvZ2ljIChpbmNyZW1lbnQvZGVjcmVtZW50KSB0byBwcm9jZWVkLiBGdXJ0aGVyLCBpZiB0aGUgc3RhcnRWYWx1ZSB3YXMgZm9yY2VmZWQgb3IgdHJhbnNmZXJyZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb20gYSBwcmV2aW91cyBjYWxsLCBzdGFydFZhbHVlIG1heSBhbHNvIG5vdCBiZSBpbiBwaXhlbHMuIFVuaXQgY29udmVyc2lvbiBsb2dpYyB0aGVyZWZvcmUgY29uc2lzdHMgb2YgdHdvIHN0ZXBzOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgMSkgQ2FsY3VsYXRpbmcgdGhlIHJhdGlvIG9mICUvZW0vcmVtL3ZoL3Z3IHJlbGF0aXZlIHRvIHBpeGVsc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgMikgQ29udmVydGluZyBzdGFydFZhbHVlIGludG8gdGhlIHNhbWUgdW5pdCBvZiBtZWFzdXJlbWVudCBhcyBlbmRWYWx1ZSBiYXNlZCBvbiB0aGVzZSByYXRpb3MuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBVbml0IGNvbnZlcnNpb24gcmF0aW9zIGFyZSBjYWxjdWxhdGVkIGJ5IGluc2VydGluZyBhIHNpYmxpbmcgbm9kZSBuZXh0IHRvIHRoZSB0YXJnZXQgbm9kZSwgY29weWluZyBvdmVyIGl0cyBwb3NpdGlvbiBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldHRpbmcgdmFsdWVzIHdpdGggdGhlIHRhcmdldCB1bml0IHR5cGUgdGhlbiBjb21wYXJpbmcgdGhlIHJldHVybmVkIHBpeGVsIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogRXZlbiBpZiBvbmx5IG9uZSBvZiB0aGVzZSB1bml0IHR5cGVzIGlzIGJlaW5nIGFuaW1hdGVkLCBhbGwgdW5pdCByYXRpb3MgYXJlIGNhbGN1bGF0ZWQgYXQgb25jZSBzaW5jZSB0aGUgb3ZlcmhlYWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mIGJhdGNoaW5nIHRoZSBTRVRzIGFuZCBHRVRzIHRvZ2V0aGVyIHVwZnJvbnQgb3V0d2VpZ2h0cyB0aGUgcG90ZW50aWFsIG92ZXJoZWFkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBvZiBsYXlvdXQgdGhyYXNoaW5nIGNhdXNlZCBieSByZS1xdWVyeWluZyBmb3IgdW5jYWxjdWxhdGVkIHJhdGlvcyBmb3Igc3Vic2VxdWVudGx5LXByb2Nlc3NlZCBwcm9wZXJ0aWVzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogVG9kbzogU2hpZnQgdGhpcyBsb2dpYyBpbnRvIHRoZSBjYWxscycgZmlyc3QgdGljayBpbnN0YW5jZSBzbyB0aGF0IGl0J3Mgc3luY2VkIHdpdGggUkFGLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gY2FsY3VsYXRlVW5pdFJhdGlvcyAoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNhbWUgUmF0aW8gQ2hlY2tzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIHByb3BlcnRpZXMgYmVsb3cgYXJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGVsZW1lbnQgZGlmZmVycyBzdWZmaWNpZW50bHkgZnJvbSB0aGlzIGNhbGwnc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzbHkgaXRlcmF0ZWQgZWxlbWVudCB0byBhbHNvIGRpZmZlciBpbiBpdHMgdW5pdCBjb252ZXJzaW9uIHJhdGlvcy4gSWYgdGhlIHByb3BlcnRpZXMgbWF0Y2ggdXAgd2l0aCB0aG9zZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mIHRoZSBwcmlvciBlbGVtZW50LCB0aGUgcHJpb3IgZWxlbWVudCdzIGNvbnZlcnNpb24gcmF0aW9zIGFyZSB1c2VkLiBMaWtlIG1vc3Qgb3B0aW1pemF0aW9ucyBpbiBWZWxvY2l0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzIGlzIGRvbmUgdG8gbWluaW1pemUgRE9NIHF1ZXJ5aW5nLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzYW1lUmF0aW9JbmRpY2F0b3JzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXlQYXJlbnQ6IGVsZW1lbnQucGFyZW50Tm9kZSB8fCBkb2N1bWVudC5ib2R5LCAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBvc2l0aW9uXCIpLCAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImZvbnRTaXplXCIpIC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEZXRlcm1pbmUgaWYgdGhlIHNhbWUgJSByYXRpbyBjYW4gYmUgdXNlZC4gJSBpcyBiYXNlZCBvbiB0aGUgZWxlbWVudCdzIHBvc2l0aW9uIHZhbHVlIGFuZCBpdHMgcGFyZW50J3Mgd2lkdGggYW5kIGhlaWdodCBkaW1lbnNpb25zLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW1lUGVyY2VudFJhdGlvID0gKChzYW1lUmF0aW9JbmRpY2F0b3JzLnBvc2l0aW9uID09PSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQb3NpdGlvbikgJiYgKHNhbWVSYXRpb0luZGljYXRvcnMubXlQYXJlbnQgPT09IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBhcmVudCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEZXRlcm1pbmUgaWYgdGhlIHNhbWUgZW0gcmF0aW8gY2FuIGJlIHVzZWQuIGVtIGlzIHJlbGF0aXZlIHRvIHRoZSBlbGVtZW50J3MgZm9udFNpemUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbWVFbVJhdGlvID0gKHNhbWVSYXRpb0luZGljYXRvcnMuZm9udFNpemUgPT09IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdEZvbnRTaXplKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0b3JlIHRoZXNlIHJhdGlvIGluZGljYXRvcnMgY2FsbC13aWRlIGZvciB0aGUgbmV4dCBlbGVtZW50IHRvIGNvbXBhcmUgYWdhaW5zdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQYXJlbnQgPSBzYW1lUmF0aW9JbmRpY2F0b3JzLm15UGFyZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBvc2l0aW9uID0gc2FtZVJhdGlvSW5kaWNhdG9ycy5wb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RGb250U2l6ZSA9IHNhbWVSYXRpb0luZGljYXRvcnMuZm9udFNpemU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRWxlbWVudC1TcGVjaWZpYyBVbml0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IElFOCByb3VuZHMgdG8gdGhlIG5lYXJlc3QgcGl4ZWwgd2hlbiByZXR1cm5pbmcgQ1NTIHZhbHVlcywgdGh1cyB3ZSBwZXJmb3JtIGNvbnZlcnNpb25zIHVzaW5nIGEgbWVhc3VyZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZiAxMDAgKGluc3RlYWQgb2YgMSkgdG8gZ2l2ZSBvdXIgcmF0aW9zIGEgcHJlY2lzaW9uIG9mIGF0IGxlYXN0IDIgZGVjaW1hbCB2YWx1ZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1lYXN1cmVtZW50ID0gMTAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNhbWVFbVJhdGlvIHx8ICFzYW1lUGVyY2VudFJhdGlvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkdW1teSA9IERhdGEoZWxlbWVudCkuaXNTVkcgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInJlY3RcIikgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LmluaXQoZHVtbXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW1lUmF0aW9JbmRpY2F0b3JzLm15UGFyZW50LmFwcGVuZENoaWxkKGR1bW15KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUbyBhY2N1cmF0ZWx5IGFuZCBjb25zaXN0ZW50bHkgY2FsY3VsYXRlIGNvbnZlcnNpb24gcmF0aW9zLCB0aGUgZWxlbWVudCdzIGNhc2NhZGVkIG92ZXJmbG93IGFuZCBib3gtc2l6aW5nIGFyZSBzdHJpcHBlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2ltaWxhcmx5LCBzaW5jZSB3aWR0aC9oZWlnaHQgY2FuIGJlIGFydGlmaWNpYWxseSBjb25zdHJhaW5lZCBieSB0aGVpciBtaW4tL21heC0gZXF1aXZhbGVudHMsIHRoZXNlIGFyZSBjb250cm9sbGVkIGZvciBhcyB3ZWxsLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBPdmVyZmxvdyBtdXN0IGJlIGFsc28gYmUgY29udHJvbGxlZCBmb3IgcGVyLWF4aXMgc2luY2UgdGhlIG92ZXJmbG93IHByb3BlcnR5IG92ZXJ3cml0ZXMgaXRzIHBlci1heGlzIHZhbHVlcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKFsgXCJvdmVyZmxvd1wiLCBcIm92ZXJmbG93WFwiLCBcIm92ZXJmbG93WVwiIF0sIGZ1bmN0aW9uKGksIHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgcHJvcGVydHksIFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIFwicG9zaXRpb25cIiwgc2FtZVJhdGlvSW5kaWNhdG9ycy5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcImZvbnRTaXplXCIsIHNhbWVSYXRpb0luZGljYXRvcnMuZm9udFNpemUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJib3hTaXppbmdcIiwgXCJjb250ZW50LWJveFwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiB3aWR0aCBhbmQgaGVpZ2h0IGFjdCBhcyBvdXIgcHJveHkgcHJvcGVydGllcyBmb3IgbWVhc3VyaW5nIHRoZSBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCAlIHJhdGlvcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKFsgXCJtaW5XaWR0aFwiLCBcIm1heFdpZHRoXCIsIFwid2lkdGhcIiwgXCJtaW5IZWlnaHRcIiwgXCJtYXhIZWlnaHRcIiwgXCJoZWlnaHRcIiBdLCBmdW5jdGlvbihpLCBwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIHByb3BlcnR5LCBtZWFzdXJlbWVudCArIFwiJVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHBhZGRpbmdMZWZ0IGFyYml0cmFyaWx5IGFjdHMgYXMgb3VyIHByb3h5IHByb3BlcnR5IGZvciB0aGUgZW0gcmF0aW8uICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcInBhZGRpbmdMZWZ0XCIsIG1lYXN1cmVtZW50ICsgXCJlbVwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEaXZpZGUgdGhlIHJldHVybmVkIHZhbHVlIGJ5IHRoZSBtZWFzdXJlbWVudCB0byBnZXQgdGhlIHJhdGlvIGJldHdlZW4gMSUgYW5kIDFweC4gRGVmYXVsdCB0byAxIHNpbmNlIHdvcmtpbmcgd2l0aCAwIGNhbiBwcm9kdWNlIEluZmluaXRlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnBlcmNlbnRUb1B4V2lkdGggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQZXJjZW50VG9QeFdpZHRoID0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZHVtbXksIFwid2lkdGhcIiwgbnVsbCwgdHJ1ZSkpIHx8IDEpIC8gbWVhc3VyZW1lbnQ7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnBlcmNlbnRUb1B4SGVpZ2h0ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGVyY2VudFRvUHhIZWlnaHQgPSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJoZWlnaHRcIiwgbnVsbCwgdHJ1ZSkpIHx8IDEpIC8gbWVhc3VyZW1lbnQ7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLmVtVG9QeCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdEVtVG9QeCA9IChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcInBhZGRpbmdMZWZ0XCIpKSB8fCAxKSAvIG1lYXN1cmVtZW50OyAvKiBHRVQgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW1lUmF0aW9JbmRpY2F0b3JzLm15UGFyZW50LnJlbW92ZUNoaWxkKGR1bW15KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLmVtVG9QeCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdEVtVG9QeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5wZXJjZW50VG9QeFdpZHRoID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGVyY2VudFRvUHhXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5wZXJjZW50VG9QeEhlaWdodCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBlcmNlbnRUb1B4SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFbGVtZW50LUFnbm9zdGljIFVuaXRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogV2hlcmVhcyAlIGFuZCBlbSByYXRpb3MgYXJlIGRldGVybWluZWQgb24gYSBwZXItZWxlbWVudCBiYXNpcywgdGhlIHJlbSB1bml0IG9ubHkgbmVlZHMgdG8gYmUgY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uY2UgcGVyIGNhbGwgc2luY2UgaXQncyBleGNsdXNpdmVseSBkZXBlbmRhbnQgdXBvbiBkb2N1bWVudC5ib2R5J3MgZm9udFNpemUuIElmIHRoaXMgaXMgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0IGNhbGN1bGF0ZVVuaXRSYXRpb3MoKSBpcyBiZWluZyBydW4gZHVyaW5nIHRoaXMgY2FsbCwgcmVtVG9QeCB3aWxsIHN0aWxsIGJlIHNldCB0byBpdHMgZGVmYXVsdCB2YWx1ZSBvZiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvIHdlIGNhbGN1bGF0ZSBpdCBub3cuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxVbml0Q29udmVyc2lvbkRhdGEucmVtVG9QeCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEZWZhdWx0IHRvIGJyb3dzZXJzJyBkZWZhdWx0IGZvbnRTaXplIG9mIDE2cHggaW4gdGhlIGNhc2Ugb2YgMC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5yZW1Ub1B4ID0gcGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShkb2N1bWVudC5ib2R5LCBcImZvbnRTaXplXCIpKSB8fCAxNjsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2ltaWxhcmx5LCB2aWV3cG9ydCB1bml0cyBhcmUgJS1yZWxhdGl2ZSB0byB0aGUgd2luZG93J3MgaW5uZXIgZGltZW5zaW9ucy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbFVuaXRDb252ZXJzaW9uRGF0YS52d1RvUHggPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbFVuaXRDb252ZXJzaW9uRGF0YS52d1RvUHggPSBwYXJzZUZsb2F0KHdpbmRvdy5pbm5lcldpZHRoKSAvIDEwMDsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxVbml0Q29udmVyc2lvbkRhdGEudmhUb1B4ID0gcGFyc2VGbG9hdCh3aW5kb3cuaW5uZXJIZWlnaHQpIC8gMTAwOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnJlbVRvUHggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLnJlbVRvUHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy52d1RvUHggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLnZ3VG9QeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnZoVG9QeCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEudmhUb1B4O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnID49IDEpIGNvbnNvbGUubG9nKFwiVW5pdCByYXRpb3M6IFwiICsgSlNPTi5zdHJpbmdpZnkodW5pdFJhdGlvcyksIGVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuaXRSYXRpb3M7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgVW5pdCBDb252ZXJzaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlICogYW5kIC8gb3BlcmF0b3JzLCB3aGljaCBhcmUgbm90IHBhc3NlZCBpbiB3aXRoIGFuIGFzc29jaWF0ZWQgdW5pdCwgaW5oZXJlbnRseSB1c2Ugc3RhcnRWYWx1ZSdzIHVuaXQuIFNraXAgdmFsdWUgYW5kIHVuaXQgY29udmVyc2lvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvW1xcLypdLy50ZXN0KG9wZXJhdG9yKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUgPSBzdGFydFZhbHVlVW5pdFR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBzdGFydFZhbHVlIGFuZCBlbmRWYWx1ZSBkaWZmZXIgaW4gdW5pdCB0eXBlLCBjb252ZXJ0IHN0YXJ0VmFsdWUgaW50byB0aGUgc2FtZSB1bml0IHR5cGUgYXMgZW5kVmFsdWUgc28gdGhhdCBpZiBlbmRWYWx1ZVVuaXRUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpcyBhIHJlbGF0aXZlIHVuaXQgKCUsIGVtLCByZW0pLCB0aGUgdmFsdWVzIHNldCBkdXJpbmcgdHdlZW5pbmcgd2lsbCBjb250aW51ZSB0byBiZSBhY2N1cmF0ZWx5IHJlbGF0aXZlIGV2ZW4gaWYgdGhlIG1ldHJpY3MgdGhleSBkZXBlbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uIGFyZSBkeW5hbWljYWxseSBjaGFuZ2luZyBkdXJpbmcgdGhlIGNvdXJzZSBvZiB0aGUgYW5pbWF0aW9uLiBDb252ZXJzZWx5LCBpZiB3ZSBhbHdheXMgbm9ybWFsaXplZCBpbnRvIHB4IGFuZCB1c2VkIHB4IGZvciBzZXR0aW5nIHZhbHVlcywgdGhlIHB4IHJhdGlvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB3b3VsZCBiZWNvbWUgc3RhbGUgaWYgdGhlIG9yaWdpbmFsIHVuaXQgYmVpbmcgYW5pbWF0ZWQgdG93YXJkIHdhcyByZWxhdGl2ZSBhbmQgdGhlIHVuZGVybHlpbmcgbWV0cmljcyBjaGFuZ2UgZHVyaW5nIHRoZSBhbmltYXRpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSAwIGlzIDAgaW4gYW55IHVuaXQgdHlwZSwgbm8gY29udmVyc2lvbiBpcyBuZWNlc3Nhcnkgd2hlbiBzdGFydFZhbHVlIGlzIDAgLS0gd2UganVzdCBzdGFydCBhdCAwIHdpdGggZW5kVmFsdWVVbml0VHlwZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKHN0YXJ0VmFsdWVVbml0VHlwZSAhPT0gZW5kVmFsdWVVbml0VHlwZSkgJiYgc3RhcnRWYWx1ZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFVuaXQgY29udmVyc2lvbiBpcyBhbHNvIHNraXBwZWQgd2hlbiBlbmRWYWx1ZSBpcyAwLCBidXQgKnN0YXJ0VmFsdWVVbml0VHlwZSogbXVzdCBiZSB1c2VkIGZvciB0d2VlbiB2YWx1ZXMgdG8gcmVtYWluIGFjY3VyYXRlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFNraXBwaW5nIHVuaXQgY29udmVyc2lvbiBoZXJlIG1lYW5zIHRoYXQgaWYgZW5kVmFsdWVVbml0VHlwZSB3YXMgb3JpZ2luYWxseSBhIHJlbGF0aXZlIHVuaXQsIHRoZSBhbmltYXRpb24gd29uJ3QgcmVsYXRpdmVseVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoIHRoZSB1bmRlcmx5aW5nIG1ldHJpY3MgaWYgdGhleSBjaGFuZ2UsIGJ1dCB0aGlzIGlzIGFjY2VwdGFibGUgc2luY2Ugd2UncmUgYW5pbWF0aW5nIHRvd2FyZCBpbnZpc2liaWxpdHkgaW5zdGVhZCBvZiB0b3dhcmQgdmlzaWJpbGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGljaCByZW1haW5zIHBhc3QgdGhlIHBvaW50IG9mIHRoZSBhbmltYXRpb24ncyBjb21wbGV0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbmRWYWx1ZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlID0gc3RhcnRWYWx1ZVVuaXRUeXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEJ5IHRoaXMgcG9pbnQsIHdlIGNhbm5vdCBhdm9pZCB1bml0IGNvbnZlcnNpb24gKGl0J3MgdW5kZXNpcmFibGUgc2luY2UgaXQgY2F1c2VzIGxheW91dCB0aHJhc2hpbmcpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJZiB3ZSBoYXZlbid0IGFscmVhZHksIHdlIHRyaWdnZXIgY2FsY3VsYXRlVW5pdFJhdGlvcygpLCB3aGljaCBydW5zIG9uY2UgcGVyIGVsZW1lbnQgcGVyIGNhbGwuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEgPSBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhIHx8IGNhbGN1bGF0ZVVuaXRSYXRpb3MoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgZm9sbG93aW5nIFJlZ0V4IG1hdGNoZXMgQ1NTIHByb3BlcnRpZXMgdGhhdCBoYXZlIHRoZWlyICUgdmFsdWVzIG1lYXN1cmVkIHJlbGF0aXZlIHRvIHRoZSB4LWF4aXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFczQyBzcGVjIG1hbmRhdGVzIHRoYXQgYWxsIG9mIG1hcmdpbiBhbmQgcGFkZGluZydzIHByb3BlcnRpZXMgKGV2ZW4gdG9wIGFuZCBib3R0b20pIGFyZSAlLXJlbGF0aXZlIHRvIHRoZSAqd2lkdGgqIG9mIHRoZSBwYXJlbnQgZWxlbWVudC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGF4aXMgPSAoL21hcmdpbnxwYWRkaW5nfGxlZnR8cmlnaHR8d2lkdGh8dGV4dHx3b3JkfGxldHRlci9pLnRlc3QocHJvcGVydHkpIHx8IC9YJC8udGVzdChwcm9wZXJ0eSkgfHwgcHJvcGVydHkgPT09IFwieFwiKSA/IFwieFwiIDogXCJ5XCI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSW4gb3JkZXIgdG8gYXZvaWQgZ2VuZXJhdGluZyBuXjIgYmVzcG9rZSBjb252ZXJzaW9uIGZ1bmN0aW9ucywgdW5pdCBjb252ZXJzaW9uIGlzIGEgdHdvLXN0ZXAgcHJvY2VzczpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMSkgQ29udmVydCBzdGFydFZhbHVlIGludG8gcGl4ZWxzLiAyKSBDb252ZXJ0IHRoaXMgbmV3IHBpeGVsIHZhbHVlIGludG8gZW5kVmFsdWUncyB1bml0IHR5cGUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoc3RhcnRWYWx1ZVVuaXRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiJVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IHRyYW5zbGF0ZVggYW5kIHRyYW5zbGF0ZVkgYXJlIHRoZSBvbmx5IHByb3BlcnRpZXMgdGhhdCBhcmUgJS1yZWxhdGl2ZSB0byBhbiBlbGVtZW50J3Mgb3duIGRpbWVuc2lvbnMgLS0gbm90IGl0cyBwYXJlbnQncyBkaW1lbnNpb25zLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5IGRvZXMgbm90IGluY2x1ZGUgYSBzcGVjaWFsIGNvbnZlcnNpb24gcHJvY2VzcyB0byBhY2NvdW50IGZvciB0aGlzIGJlaGF2aW9yLiBUaGVyZWZvcmUsIGFuaW1hdGluZyB0cmFuc2xhdGVYL1kgZnJvbSBhICUgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byBhIG5vbi0lIHZhbHVlIHdpbGwgcHJvZHVjZSBhbiBpbmNvcnJlY3Qgc3RhcnQgdmFsdWUuIEZvcnR1bmF0ZWx5LCB0aGlzIHNvcnQgb2YgY3Jvc3MtdW5pdCBjb252ZXJzaW9uIGlzIHJhcmVseSBkb25lIGJ5IHVzZXJzIGluIHByYWN0aWNlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgKj0gKGF4aXMgPT09IFwieFwiID8gZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YS5wZXJjZW50VG9QeFdpZHRoIDogZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YS5wZXJjZW50VG9QeEhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJweFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHB4IGFjdHMgYXMgb3VyIG1pZHBvaW50IGluIHRoZSB1bml0IGNvbnZlcnNpb24gcHJvY2VzczsgZG8gbm90aGluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlICo9IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGFbc3RhcnRWYWx1ZVVuaXRUeXBlICsgXCJUb1B4XCJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSW52ZXJ0IHRoZSBweCByYXRpb3MgdG8gY29udmVydCBpbnRvIHRvIHRoZSB0YXJnZXQgdW5pdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChlbmRWYWx1ZVVuaXRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiJVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgKj0gMSAvIChheGlzID09PSBcInhcIiA/IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEucGVyY2VudFRvUHhXaWR0aCA6IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEucGVyY2VudFRvUHhIZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicHhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBzdGFydFZhbHVlIGlzIGFscmVhZHkgaW4gcHgsIGRvIG5vdGhpbmc7IHdlJ3JlIGRvbmUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSAqPSAxIC8gZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YVtlbmRWYWx1ZVVuaXRUeXBlICsgXCJUb1B4XCJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBSZWxhdGl2ZSBWYWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogT3BlcmF0b3IgbG9naWMgbXVzdCBiZSBwZXJmb3JtZWQgbGFzdCBzaW5jZSBpdCByZXF1aXJlcyB1bml0LW5vcm1hbGl6ZWQgc3RhcnQgYW5kIGVuZCB2YWx1ZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBSZWxhdGl2ZSAqcGVyY2VudCB2YWx1ZXMqIGRvIG5vdCBiZWhhdmUgaG93IG1vc3QgcGVvcGxlIHRoaW5rOyB3aGlsZSBvbmUgd291bGQgZXhwZWN0IFwiKz01MCVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gaW5jcmVhc2UgdGhlIHByb3BlcnR5IDEuNXggaXRzIGN1cnJlbnQgdmFsdWUsIGl0IGluIGZhY3QgaW5jcmVhc2VzIHRoZSBwZXJjZW50IHVuaXRzIGluIGFic29sdXRlIHRlcm1zOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgNTAgcG9pbnRzIGlzIGFkZGVkIG9uIHRvcCBvZiB0aGUgY3VycmVudCAlIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCIrXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc3RhcnRWYWx1ZSArIGVuZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCItXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc3RhcnRWYWx1ZSAtIGVuZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCIqXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc3RhcnRWYWx1ZSAqIGVuZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCIvXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc3RhcnRWYWx1ZSAvIGVuZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXIgUHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnN0cnVjdCB0aGUgcGVyLXByb3BlcnR5IHR3ZWVuIG9iamVjdCwgYW5kIHB1c2ggaXQgdG8gdGhlIGVsZW1lbnQncyB0d2VlbnNDb250YWluZXIuICovXG4gICAgICAgICAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXJbcHJvcGVydHldID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlOiByb290UHJvcGVydHlWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlOiBzdGFydFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogc3RhcnRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZTogZW5kVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFR5cGU6IGVuZFZhbHVlVW5pdFR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nOiBlYXNpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZykgY29uc29sZS5sb2coXCJ0d2VlbnNDb250YWluZXIgKFwiICsgcHJvcGVydHkgKyBcIik6IFwiICsgSlNPTi5zdHJpbmdpZnkodHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XSksIGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogQWxvbmcgd2l0aCBpdHMgcHJvcGVydHkgZGF0YSwgc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnQgaXRzZWxmIG9udG8gdHdlZW5zQ29udGFpbmVyLiAqL1xuICAgICAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXIuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgIENhbGwgUHVzaFxuICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgLyogTm90ZTogdHdlZW5zQ29udGFpbmVyIGNhbiBiZSBlbXB0eSBpZiBhbGwgb2YgdGhlIHByb3BlcnRpZXMgaW4gdGhpcyBjYWxsJ3MgcHJvcGVydHkgbWFwIHdlcmUgc2tpcHBlZCBkdWUgdG8gbm90XG4gICAgICAgICAgICAgICAgICAgYmVpbmcgc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyLiBUaGUgZWxlbWVudCBwcm9wZXJ0eSBpcyB1c2VkIGZvciBjaGVja2luZyB0aGF0IHRoZSB0d2VlbnNDb250YWluZXIgaGFzIGJlZW4gYXBwZW5kZWQgdG8uICovXG4gICAgICAgICAgICAgICAgaWYgKHR3ZWVuc0NvbnRhaW5lci5lbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIEFwcGx5IHRoZSBcInZlbG9jaXR5LWFuaW1hdGluZ1wiIGluZGljYXRvciBjbGFzcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgQ1NTLlZhbHVlcy5hZGRDbGFzcyhlbGVtZW50LCBcInZlbG9jaXR5LWFuaW1hdGluZ1wiKTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBUaGUgY2FsbCBhcnJheSBob3VzZXMgdGhlIHR3ZWVuc0NvbnRhaW5lcnMgZm9yIGVhY2ggZWxlbWVudCBiZWluZyBhbmltYXRlZCBpbiB0aGUgY3VycmVudCBjYWxsLiAqL1xuICAgICAgICAgICAgICAgICAgICBjYWxsLnB1c2godHdlZW5zQ29udGFpbmVyKTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBTdG9yZSB0aGUgdHdlZW5zQ29udGFpbmVyIGFuZCBvcHRpb25zIGlmIHdlJ3JlIHdvcmtpbmcgb24gdGhlIGRlZmF1bHQgZWZmZWN0cyBxdWV1ZSwgc28gdGhhdCB0aGV5IGNhbiBiZSB1c2VkIGJ5IHRoZSByZXZlcnNlIGNvbW1hbmQuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLnF1ZXVlID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lciA9IHR3ZWVuc0NvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkub3B0cyA9IG9wdHM7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBTd2l0Y2ggb24gdGhlIGVsZW1lbnQncyBhbmltYXRpbmcgZmxhZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5pc0FuaW1hdGluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgLyogT25jZSB0aGUgZmluYWwgZWxlbWVudCBpbiB0aGlzIGNhbGwncyBlbGVtZW50IHNldCBoYXMgYmVlbiBwcm9jZXNzZWQsIHB1c2ggdGhlIGNhbGwgYXJyYXkgb250b1xuICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxscyBmb3IgdGhlIGFuaW1hdGlvbiB0aWNrIHRvIGltbWVkaWF0ZWx5IGJlZ2luIHByb2Nlc3NpbmcuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50c0luZGV4ID09PSBlbGVtZW50c0xlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFkZCB0aGUgY3VycmVudCBjYWxsIHBsdXMgaXRzIGFzc29jaWF0ZWQgbWV0YWRhdGEgKHRoZSBlbGVtZW50IHNldCBhbmQgdGhlIGNhbGwncyBvcHRpb25zKSBvbnRvIHRoZSBnbG9iYWwgY2FsbCBjb250YWluZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBBbnl0aGluZyBvbiB0aGlzIGNhbGwgY29udGFpbmVyIGlzIHN1YmplY3RlZCB0byB0aWNrKCkgcHJvY2Vzc2luZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzLnB1c2goWyBjYWxsLCBlbGVtZW50cywgb3B0cywgbnVsbCwgcHJvbWlzZURhdGEucmVzb2x2ZXIgXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBhbmltYXRpb24gdGljayBpc24ndCBydW5uaW5nLCBzdGFydCBpdC4gKFZlbG9jaXR5IHNodXRzIGl0IG9mZiB3aGVuIHRoZXJlIGFyZSBubyBhY3RpdmUgY2FsbHMgdG8gcHJvY2Vzcy4pICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuU3RhdGUuaXNUaWNraW5nID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmlzVGlja2luZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTdGFydCB0aGUgdGljayBsb29wLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogV2hlbiB0aGUgcXVldWUgb3B0aW9uIGlzIHNldCB0byBmYWxzZSwgdGhlIGNhbGwgc2tpcHMgdGhlIGVsZW1lbnQncyBxdWV1ZSBhbmQgZmlyZXMgaW1tZWRpYXRlbHkuICovXG4gICAgICAgICAgICBpZiAob3B0cy5xdWV1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGlzIGJ1aWxkUXVldWUgY2FsbCBkb2Vzbid0IHJlc3BlY3QgdGhlIGVsZW1lbnQncyBleGlzdGluZyBxdWV1ZSAod2hpY2ggaXMgd2hlcmUgYSBkZWxheSBvcHRpb24gd291bGQgaGF2ZSBiZWVuIGFwcGVuZGVkKSxcbiAgICAgICAgICAgICAgICAgICB3ZSBtYW51YWxseSBpbmplY3QgdGhlIGRlbGF5IHByb3BlcnR5IGhlcmUgd2l0aCBhbiBleHBsaWNpdCBzZXRUaW1lb3V0LiAqL1xuICAgICAgICAgICAgICAgIGlmIChvcHRzLmRlbGF5KSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoYnVpbGRRdWV1ZSwgb3B0cy5kZWxheSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYnVpbGRRdWV1ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIE90aGVyd2lzZSwgdGhlIGNhbGwgdW5kZXJnb2VzIGVsZW1lbnQgcXVldWVpbmcgYXMgbm9ybWFsLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogVG8gaW50ZXJvcGVyYXRlIHdpdGggalF1ZXJ5LCBWZWxvY2l0eSB1c2VzIGpRdWVyeSdzIG93biAkLnF1ZXVlKCkgc3RhY2sgZm9yIHF1ZXVpbmcgbG9naWMuICovXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQucXVldWUoZWxlbWVudCwgb3B0cy5xdWV1ZSwgZnVuY3Rpb24obmV4dCwgY2xlYXJRdWV1ZSkge1xuICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgY2xlYXJRdWV1ZSBmbGFnIHdhcyBwYXNzZWQgaW4gYnkgdGhlIHN0b3AgY29tbWFuZCwgcmVzb2x2ZSB0aGlzIGNhbGwncyBwcm9taXNlLiAoUHJvbWlzZXMgY2FuIG9ubHkgYmUgcmVzb2x2ZWQgb25jZSxcbiAgICAgICAgICAgICAgICAgICAgICAgc28gaXQncyBmaW5lIGlmIHRoaXMgaXMgcmVwZWF0ZWRseSB0cmlnZ2VyZWQgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgYXNzb2NpYXRlZCBjYWxsLikgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNsZWFyUXVldWUgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9taXNlRGF0YS5wcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZURhdGEucmVzb2x2ZXIoZWxlbWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBEbyBub3QgY29udGludWUgd2l0aCBhbmltYXRpb24gcXVldWVpbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIFRoaXMgZmxhZyBpbmRpY2F0ZXMgdG8gdGhlIHVwY29taW5nIGNvbXBsZXRlQ2FsbCgpIGZ1bmN0aW9uIHRoYXQgdGhpcyBxdWV1ZSBlbnRyeSB3YXMgaW5pdGlhdGVkIGJ5IFZlbG9jaXR5LlxuICAgICAgICAgICAgICAgICAgICAgICBTZWUgY29tcGxldGVDYWxsKCkgZm9yIGZ1cnRoZXIgZGV0YWlscy4gKi9cbiAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkudmVsb2NpdHlRdWV1ZUVudHJ5RmxhZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgYnVpbGRRdWV1ZShuZXh0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgIEF1dG8tRGVxdWV1aW5nXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIEFzIHBlciBqUXVlcnkncyAkLnF1ZXVlKCkgYmVoYXZpb3IsIHRvIGZpcmUgdGhlIGZpcnN0IG5vbi1jdXN0b20tcXVldWUgZW50cnkgb24gYW4gZWxlbWVudCwgdGhlIGVsZW1lbnRcbiAgICAgICAgICAgICAgIG11c3QgYmUgZGVxdWV1ZWQgaWYgaXRzIHF1ZXVlIHN0YWNrIGNvbnNpc3RzICpzb2xlbHkqIG9mIHRoZSBjdXJyZW50IGNhbGwuIChUaGlzIGNhbiBiZSBkZXRlcm1pbmVkIGJ5IGNoZWNraW5nXG4gICAgICAgICAgICAgICBmb3IgdGhlIFwiaW5wcm9ncmVzc1wiIGl0ZW0gdGhhdCBqUXVlcnkgcHJlcGVuZHMgdG8gYWN0aXZlIHF1ZXVlIHN0YWNrIGFycmF5cy4pIFJlZ2FyZGxlc3MsIHdoZW5ldmVyIHRoZSBlbGVtZW50J3NcbiAgICAgICAgICAgICAgIHF1ZXVlIGlzIGZ1cnRoZXIgYXBwZW5kZWQgd2l0aCBhZGRpdGlvbmFsIGl0ZW1zIC0tIGluY2x1ZGluZyAkLmRlbGF5KCkncyBvciBldmVuICQuYW5pbWF0ZSgpIGNhbGxzLCB0aGUgcXVldWUnc1xuICAgICAgICAgICAgICAgZmlyc3QgZW50cnkgaXMgYXV0b21hdGljYWxseSBmaXJlZC4gVGhpcyBiZWhhdmlvciBjb250cmFzdHMgdGhhdCBvZiBjdXN0b20gcXVldWVzLCB3aGljaCBuZXZlciBhdXRvLWZpcmUuICovXG4gICAgICAgICAgICAvKiBOb3RlOiBXaGVuIGFuIGVsZW1lbnQgc2V0IGlzIGJlaW5nIHN1YmplY3RlZCB0byBhIG5vbi1wYXJhbGxlbCBWZWxvY2l0eSBjYWxsLCB0aGUgYW5pbWF0aW9uIHdpbGwgbm90IGJlZ2luIHVudGlsXG4gICAgICAgICAgICAgICBlYWNoIG9uZSBvZiB0aGUgZWxlbWVudHMgaW4gdGhlIHNldCBoYXMgcmVhY2hlZCB0aGUgZW5kIG9mIGl0cyBpbmRpdmlkdWFsbHkgcHJlLWV4aXN0aW5nIHF1ZXVlIGNoYWluLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogVW5mb3J0dW5hdGVseSwgbW9zdCBwZW9wbGUgZG9uJ3QgZnVsbHkgZ3Jhc3AgalF1ZXJ5J3MgcG93ZXJmdWwsIHlldCBxdWlya3ksICQucXVldWUoKSBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgIExlYW4gbW9yZSBoZXJlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTgxNTgvY2FuLXNvbWVib2R5LWV4cGxhaW4tanF1ZXJ5LXF1ZXVlLXRvLW1lICovXG4gICAgICAgICAgICBpZiAoKG9wdHMucXVldWUgPT09IFwiXCIgfHwgb3B0cy5xdWV1ZSA9PT0gXCJmeFwiKSAmJiAkLnF1ZXVlKGVsZW1lbnQpWzBdICE9PSBcImlucHJvZ3Jlc3NcIikge1xuICAgICAgICAgICAgICAgICQuZGVxdWV1ZShlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICBFbGVtZW50IFNldCBJdGVyYXRpb25cbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogSWYgdGhlIFwibm9kZVR5cGVcIiBwcm9wZXJ0eSBleGlzdHMgb24gdGhlIGVsZW1lbnRzIHZhcmlhYmxlLCB3ZSdyZSBhbmltYXRpbmcgYSBzaW5nbGUgZWxlbWVudC5cbiAgICAgICAgICAgUGxhY2UgaXQgaW4gYW4gYXJyYXkgc28gdGhhdCAkLmVhY2goKSBjYW4gaXRlcmF0ZSBvdmVyIGl0LiAqL1xuICAgICAgICAkLmVhY2goZWxlbWVudHMsIGZ1bmN0aW9uKGksIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIC8qIEVuc3VyZSBlYWNoIGVsZW1lbnQgaW4gYSBzZXQgaGFzIGEgbm9kZVR5cGUgKGlzIGEgcmVhbCBlbGVtZW50KSB0byBhdm9pZCB0aHJvd2luZyBlcnJvcnMuICovXG4gICAgICAgICAgICBpZiAoVHlwZS5pc05vZGUoZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzRWxlbWVudC5jYWxsKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIE9wdGlvbjogTG9vcFxuICAgICAgICAqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogVGhlIGxvb3Agb3B0aW9uIGFjY2VwdHMgYW4gaW50ZWdlciBpbmRpY2F0aW5nIGhvdyBtYW55IHRpbWVzIHRoZSBlbGVtZW50IHNob3VsZCBsb29wIGJldHdlZW4gdGhlIHZhbHVlcyBpbiB0aGVcbiAgICAgICAgICAgY3VycmVudCBjYWxsJ3MgcHJvcGVydGllcyBtYXAgYW5kIHRoZSBlbGVtZW50J3MgcHJvcGVydHkgdmFsdWVzIHByaW9yIHRvIHRoaXMgY2FsbC4gKi9cbiAgICAgICAgLyogTm90ZTogVGhlIGxvb3Agb3B0aW9uJ3MgbG9naWMgaXMgcGVyZm9ybWVkIGhlcmUgLS0gYWZ0ZXIgZWxlbWVudCBwcm9jZXNzaW5nIC0tIGJlY2F1c2UgdGhlIGN1cnJlbnQgY2FsbCBuZWVkc1xuICAgICAgICAgICB0byB1bmRlcmdvIGl0cyBxdWV1ZSBpbnNlcnRpb24gcHJpb3IgdG8gdGhlIGxvb3Agb3B0aW9uIGdlbmVyYXRpbmcgaXRzIHNlcmllcyBvZiBjb25zdGl0dWVudCBcInJldmVyc2VcIiBjYWxscyxcbiAgICAgICAgICAgd2hpY2ggY2hhaW4gYWZ0ZXIgdGhlIGN1cnJlbnQgY2FsbC4gVHdvIHJldmVyc2UgY2FsbHMgKHR3byBcImFsdGVybmF0aW9uc1wiKSBjb25zdGl0dXRlIG9uZSBsb29wLiAqL1xuICAgICAgICB2YXIgb3B0cyA9ICQuZXh0ZW5kKHt9LCBWZWxvY2l0eS5kZWZhdWx0cywgb3B0aW9ucyksXG4gICAgICAgICAgICByZXZlcnNlQ2FsbHNDb3VudDtcblxuICAgICAgICBvcHRzLmxvb3AgPSBwYXJzZUludChvcHRzLmxvb3ApO1xuICAgICAgICByZXZlcnNlQ2FsbHNDb3VudCA9IChvcHRzLmxvb3AgKiAyKSAtIDE7XG5cbiAgICAgICAgaWYgKG9wdHMubG9vcCkge1xuICAgICAgICAgICAgLyogRG91YmxlIHRoZSBsb29wIGNvdW50IHRvIGNvbnZlcnQgaXQgaW50byBpdHMgYXBwcm9wcmlhdGUgbnVtYmVyIG9mIFwicmV2ZXJzZVwiIGNhbGxzLlxuICAgICAgICAgICAgICAgU3VidHJhY3QgMSBmcm9tIHRoZSByZXN1bHRpbmcgdmFsdWUgc2luY2UgdGhlIGN1cnJlbnQgY2FsbCBpcyBpbmNsdWRlZCBpbiB0aGUgdG90YWwgYWx0ZXJuYXRpb24gY291bnQuICovXG4gICAgICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHJldmVyc2VDYWxsc0NvdW50OyB4KyspIHtcbiAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGUgbG9naWMgZm9yIHRoZSByZXZlcnNlIGFjdGlvbiBvY2N1cnMgaW5zaWRlIFF1ZXVlaW5nIGFuZCB0aGVyZWZvcmUgdGhpcyBjYWxsJ3Mgb3B0aW9ucyBvYmplY3RcbiAgICAgICAgICAgICAgICAgICBpc24ndCBwYXJzZWQgdW50aWwgdGhlbiBhcyB3ZWxsLCB0aGUgY3VycmVudCBjYWxsJ3MgZGVsYXkgb3B0aW9uIG11c3QgYmUgZXhwbGljaXRseSBwYXNzZWQgaW50byB0aGUgcmV2ZXJzZVxuICAgICAgICAgICAgICAgICAgIGNhbGwgc28gdGhhdCB0aGUgZGVsYXkgbG9naWMgdGhhdCBvY2N1cnMgaW5zaWRlICpQcmUtUXVldWVpbmcqIGNhbiBwcm9jZXNzIGl0LiAqL1xuICAgICAgICAgICAgICAgIHZhciByZXZlcnNlT3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgZGVsYXk6IG9wdHMuZGVsYXksXG4gICAgICAgICAgICAgICAgICAgIHByb2dyZXNzOiBvcHRzLnByb2dyZXNzXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qIElmIGEgY29tcGxldGUgY2FsbGJhY2sgd2FzIHBhc3NlZCBpbnRvIHRoaXMgY2FsbCwgdHJhbnNmZXIgaXQgdG8gdGhlIGxvb3AgcmVkaXJlY3QncyBmaW5hbCBcInJldmVyc2VcIiBjYWxsXG4gICAgICAgICAgICAgICAgICAgc28gdGhhdCBpdCdzIHRyaWdnZXJlZCB3aGVuIHRoZSBlbnRpcmUgcmVkaXJlY3QgaXMgY29tcGxldGUgKGFuZCBub3Qgd2hlbiB0aGUgdmVyeSBmaXJzdCBhbmltYXRpb24gaXMgY29tcGxldGUpLiAqL1xuICAgICAgICAgICAgICAgIGlmICh4ID09PSByZXZlcnNlQ2FsbHNDb3VudCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV2ZXJzZU9wdGlvbnMuZGlzcGxheSA9IG9wdHMuZGlzcGxheTtcbiAgICAgICAgICAgICAgICAgICAgcmV2ZXJzZU9wdGlvbnMudmlzaWJpbGl0eSA9IG9wdHMudmlzaWJpbGl0eTtcbiAgICAgICAgICAgICAgICAgICAgcmV2ZXJzZU9wdGlvbnMuY29tcGxldGUgPSBvcHRzLmNvbXBsZXRlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGFuaW1hdGUoZWxlbWVudHMsIFwicmV2ZXJzZVwiLCByZXZlcnNlT3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKioqKioqKioqKioqKioqXG4gICAgICAgICAgICBDaGFpbmluZ1xuICAgICAgICAqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogUmV0dXJuIHRoZSBlbGVtZW50cyBiYWNrIHRvIHRoZSBjYWxsIGNoYWluLCB3aXRoIHdyYXBwZWQgZWxlbWVudHMgdGFraW5nIHByZWNlZGVuY2UgaW4gY2FzZSBWZWxvY2l0eSB3YXMgY2FsbGVkIHZpYSB0aGUgJC5mbi4gZXh0ZW5zaW9uLiAqL1xuICAgICAgICByZXR1cm4gZ2V0Q2hhaW4oKTtcbiAgICB9O1xuXG4gICAgLyogVHVybiBWZWxvY2l0eSBpbnRvIHRoZSBhbmltYXRpb24gZnVuY3Rpb24sIGV4dGVuZGVkIHdpdGggdGhlIHByZS1leGlzdGluZyBWZWxvY2l0eSBvYmplY3QuICovXG4gICAgVmVsb2NpdHkgPSAkLmV4dGVuZChhbmltYXRlLCBWZWxvY2l0eSk7XG4gICAgLyogRm9yIGxlZ2FjeSBzdXBwb3J0LCBhbHNvIGV4cG9zZSB0aGUgbGl0ZXJhbCBhbmltYXRlIG1ldGhvZC4gKi9cbiAgICBWZWxvY2l0eS5hbmltYXRlID0gYW5pbWF0ZTtcblxuICAgIC8qKioqKioqKioqKioqKlxuICAgICAgICBUaW1pbmdcbiAgICAqKioqKioqKioqKioqKi9cblxuICAgIC8qIFRpY2tlciBmdW5jdGlvbi4gKi9cbiAgICB2YXIgdGlja2VyID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCByQUZTaGltO1xuXG4gICAgLyogSW5hY3RpdmUgYnJvd3NlciB0YWJzIHBhdXNlIHJBRiwgd2hpY2ggcmVzdWx0cyBpbiBhbGwgYWN0aXZlIGFuaW1hdGlvbnMgaW1tZWRpYXRlbHkgc3ByaW50aW5nIHRvIHRoZWlyIGNvbXBsZXRpb24gc3RhdGVzIHdoZW4gdGhlIHRhYiByZWZvY3VzZXMuXG4gICAgICAgVG8gZ2V0IGFyb3VuZCB0aGlzLCB3ZSBkeW5hbWljYWxseSBzd2l0Y2ggckFGIHRvIHNldFRpbWVvdXQgKHdoaWNoIHRoZSBicm93c2VyICpkb2Vzbid0KiBwYXVzZSkgd2hlbiB0aGUgdGFiIGxvc2VzIGZvY3VzLiBXZSBza2lwIHRoaXMgZm9yIG1vYmlsZVxuICAgICAgIGRldmljZXMgdG8gYXZvaWQgd2FzdGluZyBiYXR0ZXJ5IHBvd2VyIG9uIGluYWN0aXZlIHRhYnMuICovXG4gICAgLyogTm90ZTogVGFiIGZvY3VzIGRldGVjdGlvbiBkb2Vzbid0IHdvcmsgb24gb2xkZXIgdmVyc2lvbnMgb2YgSUUsIGJ1dCB0aGF0J3Mgb2theSBzaW5jZSB0aGV5IGRvbid0IHN1cHBvcnQgckFGIHRvIGJlZ2luIHdpdGguICovXG4gICAgaWYgKCFWZWxvY2l0eS5TdGF0ZS5pc01vYmlsZSAmJiBkb2N1bWVudC5oaWRkZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8qIFJlYXNzaWduIHRoZSByQUYgZnVuY3Rpb24gKHdoaWNoIHRoZSBnbG9iYWwgdGljaygpIGZ1bmN0aW9uIHVzZXMpIGJhc2VkIG9uIHRoZSB0YWIncyBmb2N1cyBzdGF0ZS4gKi9cbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5oaWRkZW4pIHtcbiAgICAgICAgICAgICAgICB0aWNrZXIgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAvKiBUaGUgdGljayBmdW5jdGlvbiBuZWVkcyBhIHRydXRoeSBmaXJzdCBhcmd1bWVudCBpbiBvcmRlciB0byBwYXNzIGl0cyBpbnRlcm5hbCB0aW1lc3RhbXAgY2hlY2suICovXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayh0cnVlKSB9LCAxNik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qIFRoZSByQUYgbG9vcCBoYXMgYmVlbiBwYXVzZWQgYnkgdGhlIGJyb3dzZXIsIHNvIHdlIG1hbnVhbGx5IHJlc3RhcnQgdGhlIHRpY2suICovXG4gICAgICAgICAgICAgICAgdGljaygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aWNrZXIgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHJBRlNoaW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKipcbiAgICAgICAgVGlja1xuICAgICoqKioqKioqKioqKi9cblxuICAgIC8qIE5vdGU6IEFsbCBjYWxscyB0byBWZWxvY2l0eSBhcmUgcHVzaGVkIHRvIHRoZSBWZWxvY2l0eS5TdGF0ZS5jYWxscyBhcnJheSwgd2hpY2ggaXMgZnVsbHkgaXRlcmF0ZWQgdGhyb3VnaCB1cG9uIGVhY2ggdGljay4gKi9cbiAgICBmdW5jdGlvbiB0aWNrICh0aW1lc3RhbXApIHtcbiAgICAgICAgLyogQW4gZW1wdHkgdGltZXN0YW1wIGFyZ3VtZW50IGluZGljYXRlcyB0aGF0IHRoaXMgaXMgdGhlIGZpcnN0IHRpY2sgb2NjdXJlbmNlIHNpbmNlIHRpY2tpbmcgd2FzIHR1cm5lZCBvbi5cbiAgICAgICAgICAgV2UgbGV2ZXJhZ2UgdGhpcyBtZXRhZGF0YSB0byBmdWxseSBpZ25vcmUgdGhlIGZpcnN0IHRpY2sgcGFzcyBzaW5jZSBSQUYncyBpbml0aWFsIHBhc3MgaXMgZmlyZWQgd2hlbmV2ZXJcbiAgICAgICAgICAgdGhlIGJyb3dzZXIncyBuZXh0IHRpY2sgc3luYyB0aW1lIG9jY3Vycywgd2hpY2ggcmVzdWx0cyBpbiB0aGUgZmlyc3QgZWxlbWVudHMgc3ViamVjdGVkIHRvIFZlbG9jaXR5XG4gICAgICAgICAgIGNhbGxzIGJlaW5nIGFuaW1hdGVkIG91dCBvZiBzeW5jIHdpdGggYW55IGVsZW1lbnRzIGFuaW1hdGVkIGltbWVkaWF0ZWx5IHRoZXJlYWZ0ZXIuIEluIHNob3J0LCB3ZSBpZ25vcmVcbiAgICAgICAgICAgdGhlIGZpcnN0IFJBRiB0aWNrIHBhc3Mgc28gdGhhdCBlbGVtZW50cyBiZWluZyBpbW1lZGlhdGVseSBjb25zZWN1dGl2ZWx5IGFuaW1hdGVkIC0tIGluc3RlYWQgb2Ygc2ltdWx0YW5lb3VzbHkgYW5pbWF0ZWRcbiAgICAgICAgICAgYnkgdGhlIHNhbWUgVmVsb2NpdHkgY2FsbCAtLSBhcmUgcHJvcGVybHkgYmF0Y2hlZCBpbnRvIHRoZSBzYW1lIGluaXRpYWwgUkFGIHRpY2sgYW5kIGNvbnNlcXVlbnRseSByZW1haW4gaW4gc3luYyB0aGVyZWFmdGVyLiAqL1xuICAgICAgICBpZiAodGltZXN0YW1wKSB7XG4gICAgICAgICAgICAvKiBXZSBpZ25vcmUgUkFGJ3MgaGlnaCByZXNvbHV0aW9uIHRpbWVzdGFtcCBzaW5jZSBpdCBjYW4gYmUgc2lnbmlmaWNhbnRseSBvZmZzZXQgd2hlbiB0aGUgYnJvd3NlciBpc1xuICAgICAgICAgICAgICAgdW5kZXIgaGlnaCBzdHJlc3M7IHdlIG9wdCBmb3IgY2hvcHBpbmVzcyBvdmVyIGFsbG93aW5nIHRoZSBicm93c2VyIHRvIGRyb3AgaHVnZSBjaHVua3Mgb2YgZnJhbWVzLiAqL1xuICAgICAgICAgICAgdmFyIHRpbWVDdXJyZW50ID0gKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgQ2FsbCBJdGVyYXRpb25cbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICB2YXIgY2FsbHNMZW5ndGggPSBWZWxvY2l0eS5TdGF0ZS5jYWxscy5sZW5ndGg7XG5cbiAgICAgICAgICAgIC8qIFRvIHNwZWVkIHVwIGl0ZXJhdGluZyBvdmVyIHRoaXMgYXJyYXksIGl0IGlzIGNvbXBhY3RlZCAoZmFsc2V5IGl0ZW1zIC0tIGNhbGxzIHRoYXQgaGF2ZSBjb21wbGV0ZWQgLS0gYXJlIHJlbW92ZWQpXG4gICAgICAgICAgICAgICB3aGVuIGl0cyBsZW5ndGggaGFzIGJhbGxvb25lZCB0byBhIHBvaW50IHRoYXQgY2FuIGltcGFjdCB0aWNrIHBlcmZvcm1hbmNlLiBUaGlzIG9ubHkgYmVjb21lcyBuZWNlc3Nhcnkgd2hlbiBhbmltYXRpb25cbiAgICAgICAgICAgICAgIGhhcyBiZWVuIGNvbnRpbnVvdXMgd2l0aCBtYW55IGVsZW1lbnRzIG92ZXIgYSBsb25nIHBlcmlvZCBvZiB0aW1lOyB3aGVuZXZlciBhbGwgYWN0aXZlIGNhbGxzIGFyZSBjb21wbGV0ZWQsIGNvbXBsZXRlQ2FsbCgpIGNsZWFycyBWZWxvY2l0eS5TdGF0ZS5jYWxscy4gKi9cbiAgICAgICAgICAgIGlmIChjYWxsc0xlbmd0aCA+IDEwMDAwKSB7XG4gICAgICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHMgPSBjb21wYWN0U3BhcnNlQXJyYXkoVmVsb2NpdHkuU3RhdGUuY2FsbHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggZWFjaCBhY3RpdmUgY2FsbC4gKi9cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIC8qIFdoZW4gYSBWZWxvY2l0eSBjYWxsIGlzIGNvbXBsZXRlZCwgaXRzIFZlbG9jaXR5LlN0YXRlLmNhbGxzIGVudHJ5IGlzIHNldCB0byBmYWxzZS4gQ29udGludWUgb24gdG8gdGhlIG5leHQgY2FsbC4gKi9cbiAgICAgICAgICAgICAgICBpZiAoIVZlbG9jaXR5LlN0YXRlLmNhbGxzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICBDYWxsLVdpZGUgVmFyaWFibGVzXG4gICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgdmFyIGNhbGxDb250YWluZXIgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgY2FsbCA9IGNhbGxDb250YWluZXJbMF0sXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBjYWxsQ29udGFpbmVyWzJdLFxuICAgICAgICAgICAgICAgICAgICB0aW1lU3RhcnQgPSBjYWxsQ29udGFpbmVyWzNdLFxuICAgICAgICAgICAgICAgICAgICBmaXJzdFRpY2sgPSAhIXRpbWVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAgdHdlZW5EdW1teVZhbHVlID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIC8qIElmIHRpbWVTdGFydCBpcyB1bmRlZmluZWQsIHRoZW4gdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB0aGF0IHRoaXMgY2FsbCBoYXMgYmVlbiBwcm9jZXNzZWQgYnkgdGljaygpLlxuICAgICAgICAgICAgICAgICAgIFdlIGFzc2lnbiB0aW1lU3RhcnQgbm93IHNvIHRoYXQgaXRzIHZhbHVlIGlzIGFzIGNsb3NlIHRvIHRoZSByZWFsIGFuaW1hdGlvbiBzdGFydCB0aW1lIGFzIHBvc3NpYmxlLlxuICAgICAgICAgICAgICAgICAgIChDb252ZXJzZWx5LCBoYWQgdGltZVN0YXJ0IGJlZW4gZGVmaW5lZCB3aGVuIHRoaXMgY2FsbCB3YXMgYWRkZWQgdG8gVmVsb2NpdHkuU3RhdGUuY2FsbHMsIHRoZSBkZWxheVxuICAgICAgICAgICAgICAgICAgIGJldHdlZW4gdGhhdCB0aW1lIGFuZCBub3cgd291bGQgY2F1c2UgdGhlIGZpcnN0IGZldyBmcmFtZXMgb2YgdGhlIHR3ZWVuIHRvIGJlIHNraXBwZWQgc2luY2VcbiAgICAgICAgICAgICAgICAgICBwZXJjZW50Q29tcGxldGUgaXMgY2FsY3VsYXRlZCByZWxhdGl2ZSB0byB0aW1lU3RhcnQuKSAqL1xuICAgICAgICAgICAgICAgIC8qIEZ1cnRoZXIsIHN1YnRyYWN0IDE2bXMgKHRoZSBhcHByb3hpbWF0ZSByZXNvbHV0aW9uIG9mIFJBRikgZnJvbSB0aGUgY3VycmVudCB0aW1lIHZhbHVlIHNvIHRoYXQgdGhlXG4gICAgICAgICAgICAgICAgICAgZmlyc3QgdGljayBpdGVyYXRpb24gaXNuJ3Qgd2FzdGVkIGJ5IGFuaW1hdGluZyBhdCAwJSB0d2VlbiBjb21wbGV0aW9uLCB3aGljaCB3b3VsZCBwcm9kdWNlIHRoZVxuICAgICAgICAgICAgICAgICAgIHNhbWUgc3R5bGUgdmFsdWUgYXMgdGhlIGVsZW1lbnQncyBjdXJyZW50IHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgIGlmICghdGltZVN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVTdGFydCA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzW2ldWzNdID0gdGltZUN1cnJlbnQgLSAxNjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBUaGUgdHdlZW4ncyBjb21wbGV0aW9uIHBlcmNlbnRhZ2UgaXMgcmVsYXRpdmUgdG8gdGhlIHR3ZWVuJ3Mgc3RhcnQgdGltZSwgbm90IHRoZSB0d2VlbidzIHN0YXJ0IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgKHdoaWNoIHdvdWxkIHJlc3VsdCBpbiB1bnByZWRpY3RhYmxlIHR3ZWVuIGR1cmF0aW9ucyBzaW5jZSBKYXZhU2NyaXB0J3MgdGltZXJzIGFyZSBub3QgcGFydGljdWxhcmx5IGFjY3VyYXRlKS5cbiAgICAgICAgICAgICAgICAgICBBY2NvcmRpbmdseSwgd2UgZW5zdXJlIHRoYXQgcGVyY2VudENvbXBsZXRlIGRvZXMgbm90IGV4Y2VlZCAxLiAqL1xuICAgICAgICAgICAgICAgIHZhciBwZXJjZW50Q29tcGxldGUgPSBNYXRoLm1pbigodGltZUN1cnJlbnQgLSB0aW1lU3RhcnQpIC8gb3B0cy5kdXJhdGlvbiwgMSk7XG5cbiAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgIEVsZW1lbnQgSXRlcmF0aW9uXG4gICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgIC8qIEZvciBldmVyeSBjYWxsLCBpdGVyYXRlIHRocm91Z2ggZWFjaCBvZiB0aGUgZWxlbWVudHMgaW4gaXRzIHNldC4gKi9cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgY2FsbExlbmd0aCA9IGNhbGwubGVuZ3RoOyBqIDwgY2FsbExlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0d2VlbnNDb250YWluZXIgPSBjYWxsW2pdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHR3ZWVuc0NvbnRhaW5lci5lbGVtZW50O1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIENoZWNrIHRvIHNlZSBpZiB0aGlzIGVsZW1lbnQgaGFzIGJlZW4gZGVsZXRlZCBtaWR3YXkgdGhyb3VnaCB0aGUgYW5pbWF0aW9uIGJ5IGNoZWNraW5nIGZvciB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVkIGV4aXN0ZW5jZSBvZiBpdHMgZGF0YSBjYWNoZS4gSWYgaXQncyBnb25lLCBza2lwIGFuaW1hdGluZyB0aGlzIGVsZW1lbnQuICovXG4gICAgICAgICAgICAgICAgICAgIGlmICghRGF0YShlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgdHJhbnNmb3JtUHJvcGVydHlFeGlzdHMgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICBEaXNwbGF5ICYgVmlzaWJpbGl0eSBUb2dnbGluZ1xuICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBkaXNwbGF5IG9wdGlvbiBpcyBzZXQgdG8gbm9uLVwibm9uZVwiLCBzZXQgaXQgdXBmcm9udCBzbyB0aGF0IHRoZSBlbGVtZW50IGNhbiBiZWNvbWUgdmlzaWJsZSBiZWZvcmUgdHdlZW5pbmcgYmVnaW5zLlxuICAgICAgICAgICAgICAgICAgICAgICAoT3RoZXJ3aXNlLCBkaXNwbGF5J3MgXCJub25lXCIgdmFsdWUgaXMgc2V0IGluIGNvbXBsZXRlQ2FsbCgpIG9uY2UgdGhlIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkLikgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSAhPT0gdW5kZWZpbmVkICYmIG9wdHMuZGlzcGxheSAhPT0gbnVsbCAmJiBvcHRzLmRpc3BsYXkgIT09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ID09PSBcImZsZXhcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmbGV4VmFsdWVzID0gWyBcIi13ZWJraXQtYm94XCIsIFwiLW1vei1ib3hcIiwgXCItbXMtZmxleGJveFwiLCBcIi13ZWJraXQtZmxleFwiIF07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goZmxleFZhbHVlcywgZnVuY3Rpb24oaSwgZmxleFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiLCBmbGV4VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIiwgb3B0cy5kaXNwbGF5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIFNhbWUgZ29lcyB3aXRoIHRoZSB2aXNpYmlsaXR5IG9wdGlvbiwgYnV0IGl0cyBcIm5vbmVcIiBlcXVpdmFsZW50IGlzIFwiaGlkZGVuXCIuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLnZpc2liaWxpdHkgIT09IFwiaGlkZGVuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwidmlzaWJpbGl0eVwiLCBvcHRzLnZpc2liaWxpdHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICBQcm9wZXJ0eSBJdGVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIEZvciBldmVyeSBlbGVtZW50LCBpdGVyYXRlIHRocm91Z2ggZWFjaCBwcm9wZXJ0eS4gKi9cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gdHdlZW5zQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBJbiBhZGRpdGlvbiB0byBwcm9wZXJ0eSB0d2VlbiBkYXRhLCB0d2VlbnNDb250YWluZXIgY29udGFpbnMgYSByZWZlcmVuY2UgdG8gaXRzIGFzc29jaWF0ZWQgZWxlbWVudC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSAhPT0gXCJlbGVtZW50XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHdlZW4gPSB0d2VlbnNDb250YWluZXJbcHJvcGVydHldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEVhc2luZyBjYW4gZWl0aGVyIGJlIGEgcHJlLWdlbmVyZWF0ZWQgZnVuY3Rpb24gb3IgYSBzdHJpbmcgdGhhdCByZWZlcmVuY2VzIGEgcHJlLXJlZ2lzdGVyZWQgZWFzaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uIHRoZSBWZWxvY2l0eS5FYXNpbmdzIG9iamVjdC4gSW4gZWl0aGVyIGNhc2UsIHJldHVybiB0aGUgYXBwcm9wcmlhdGUgZWFzaW5nICpmdW5jdGlvbiouICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZyA9IFR5cGUuaXNTdHJpbmcodHdlZW4uZWFzaW5nKSA/IFZlbG9jaXR5LkVhc2luZ3NbdHdlZW4uZWFzaW5nXSA6IHR3ZWVuLmVhc2luZztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDdXJyZW50IFZhbHVlIENhbGN1bGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhpcyBpcyB0aGUgbGFzdCB0aWNrIHBhc3MgKGlmIHdlJ3ZlIHJlYWNoZWQgMTAwJSBjb21wbGV0aW9uIGZvciB0aGlzIHR3ZWVuKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnN1cmUgdGhhdCBjdXJyZW50VmFsdWUgaXMgZXhwbGljaXRseSBzZXQgdG8gaXRzIHRhcmdldCBlbmRWYWx1ZSBzbyB0aGF0IGl0J3Mgbm90IHN1YmplY3RlZCB0byBhbnkgcm91bmRpbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlcmNlbnRDb21wbGV0ZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUgPSB0d2Vlbi5lbmRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBPdGhlcndpc2UsIGNhbGN1bGF0ZSBjdXJyZW50VmFsdWUgYmFzZWQgb24gdGhlIGN1cnJlbnQgZGVsdGEgZnJvbSBzdGFydFZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0d2VlbkRlbHRhID0gdHdlZW4uZW5kVmFsdWUgLSB0d2Vlbi5zdGFydFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUgPSB0d2Vlbi5zdGFydFZhbHVlICsgKHR3ZWVuRGVsdGEgKiBlYXNpbmcocGVyY2VudENvbXBsZXRlLCBvcHRzLCB0d2VlbkRlbHRhKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgbm8gdmFsdWUgY2hhbmdlIGlzIG9jY3VycmluZywgZG9uJ3QgcHJvY2VlZCB3aXRoIERPTSB1cGRhdGluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdFRpY2sgJiYgKGN1cnJlbnRWYWx1ZSA9PT0gdHdlZW4uY3VycmVudFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2Vlbi5jdXJyZW50VmFsdWUgPSBjdXJyZW50VmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB3ZSdyZSB0d2VlbmluZyBhIGZha2UgJ3R3ZWVuJyBwcm9wZXJ0eSBpbiBvcmRlciB0byBsb2cgdHJhbnNpdGlvbiB2YWx1ZXMsIHVwZGF0ZSB0aGUgb25lLXBlci1jYWxsIHZhcmlhYmxlIHNvIHRoYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdCBjYW4gYmUgcGFzc2VkIGludG8gdGhlIHByb2dyZXNzIGNhbGxiYWNrLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSA9PT0gXCJ0d2VlblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuRHVtbXlWYWx1ZSA9IGN1cnJlbnRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhvb2tzOiBQYXJ0IElcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZvciBob29rZWQgcHJvcGVydGllcywgdGhlIG5ld2x5LXVwZGF0ZWQgcm9vdFByb3BlcnR5VmFsdWVDYWNoZSBpcyBjYWNoZWQgb250byB0aGUgZWxlbWVudCBzbyB0aGF0IGl0IGNhbiBiZSB1c2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBzdWJzZXF1ZW50IGhvb2tzIGluIHRoaXMgY2FsbCB0aGF0IGFyZSBhc3NvY2lhdGVkIHdpdGggdGhlIHNhbWUgcm9vdCBwcm9wZXJ0eS4gSWYgd2UgZGlkbid0IGNhY2hlIHRoZSB1cGRhdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlLCBlYWNoIHN1YnNlcXVlbnQgdXBkYXRlIHRvIHRoZSByb290IHByb3BlcnR5IGluIHRoaXMgdGljayBwYXNzIHdvdWxkIHJlc2V0IHRoZSBwcmV2aW91cyBob29rJ3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlcyB0byByb290UHJvcGVydHlWYWx1ZSBwcmlvciB0byBpbmplY3Rpb24uIEEgbmljZSBwZXJmb3JtYW5jZSBieXByb2R1Y3Qgb2Ygcm9vdFByb3BlcnR5VmFsdWUgY2FjaGluZyBpcyB0aGF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNlcXVlbnRseSBjaGFpbmVkIGFuaW1hdGlvbnMgdXNpbmcgdGhlIHNhbWUgaG9va1Jvb3QgYnV0IGEgZGlmZmVyZW50IGhvb2sgY2FuIHVzZSB0aGlzIGNhY2hlZCByb290UHJvcGVydHlWYWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5Ib29rcy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhvb2tSb290ID0gQ1NTLkhvb2tzLmdldFJvb3QocHJvcGVydHkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGUgPSBEYXRhKGVsZW1lbnQpLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGVbaG9va1Jvb3RdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocm9vdFByb3BlcnR5VmFsdWVDYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuLnJvb3RQcm9wZXJ0eVZhbHVlID0gcm9vdFByb3BlcnR5VmFsdWVDYWNoZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRE9NIFVwZGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBzZXRQcm9wZXJ0eVZhbHVlKCkgcmV0dXJucyBhbiBhcnJheSBvZiB0aGUgcHJvcGVydHkgbmFtZSBhbmQgcHJvcGVydHkgdmFsdWUgcG9zdCBhbnkgbm9ybWFsaXphdGlvbiB0aGF0IG1heSBoYXZlIGJlZW4gcGVyZm9ybWVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBUbyBzb2x2ZSBhbiBJRTw9OCBwb3NpdGlvbmluZyBidWcsIHRoZSB1bml0IHR5cGUgaXMgZHJvcHBlZCB3aGVuIHNldHRpbmcgYSBwcm9wZXJ0eSB2YWx1ZSBvZiAwLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWRqdXN0ZWRTZXREYXRhID0gQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgLyogU0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuLmN1cnJlbnRWYWx1ZSArIChwYXJzZUZsb2F0KGN1cnJlbnRWYWx1ZSkgPT09IDAgPyBcIlwiIDogdHdlZW4udW5pdFR5cGUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW4ucm9vdFByb3BlcnR5VmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2Vlbi5zY3JvbGxEYXRhKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBIb29rczogUGFydCBJSVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdyB0aGF0IHdlIGhhdmUgdGhlIGhvb2sncyB1cGRhdGVkIHJvb3RQcm9wZXJ0eVZhbHVlICh0aGUgcG9zdC1wcm9jZXNzZWQgdmFsdWUgcHJvdmlkZWQgYnkgYWRqdXN0ZWRTZXREYXRhKSwgY2FjaGUgaXQgb250byB0aGUgZWxlbWVudC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5Ib29rcy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgYWRqdXN0ZWRTZXREYXRhIGNvbnRhaW5zIG5vcm1hbGl6ZWQgZGF0YSByZWFkeSBmb3IgRE9NIHVwZGF0aW5nLCB0aGUgcm9vdFByb3BlcnR5VmFsdWUgbmVlZHMgdG8gYmUgcmUtZXh0cmFjdGVkIGZyb20gaXRzIG5vcm1hbGl6ZWQgZm9ybS4gPz8gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtob29rUm9vdF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGVbaG9va1Jvb3RdID0gQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbaG9va1Jvb3RdKFwiZXh0cmFjdFwiLCBudWxsLCBhZGp1c3RlZFNldERhdGFbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGVbaG9va1Jvb3RdID0gYWRqdXN0ZWRTZXREYXRhWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUcmFuc2Zvcm1zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBGbGFnIHdoZXRoZXIgYSB0cmFuc2Zvcm0gcHJvcGVydHkgaXMgYmVpbmcgYW5pbWF0ZWQgc28gdGhhdCBmbHVzaFRyYW5zZm9ybUNhY2hlKCkgY2FuIGJlIHRyaWdnZXJlZCBvbmNlIHRoaXMgdGljayBwYXNzIGlzIGNvbXBsZXRlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWRqdXN0ZWRTZXREYXRhWzBdID09PSBcInRyYW5zZm9ybVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1Qcm9wZXJ0eUV4aXN0cyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2JpbGVIQVxuICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIElmIG1vYmlsZUhBIGlzIGVuYWJsZWQsIHNldCB0aGUgdHJhbnNsYXRlM2QgdHJhbnNmb3JtIHRvIG51bGwgdG8gZm9yY2UgaGFyZHdhcmUgYWNjZWxlcmF0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICBJdCdzIHNhZmUgdG8gb3ZlcnJpZGUgdGhpcyBwcm9wZXJ0eSBzaW5jZSBWZWxvY2l0eSBkb2Vzbid0IGFjdHVhbGx5IHN1cHBvcnQgaXRzIGFuaW1hdGlvbiAoaG9va3MgYXJlIHVzZWQgaW4gaXRzIHBsYWNlKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMubW9iaWxlSEEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIERvbid0IHNldCB0aGUgbnVsbCB0cmFuc2Zvcm0gaGFjayBpZiB3ZSd2ZSBhbHJlYWR5IGRvbmUgc28uICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZS50cmFuc2xhdGUzZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQWxsIGVudHJpZXMgb24gdGhlIHRyYW5zZm9ybUNhY2hlIG9iamVjdCBhcmUgbGF0ZXIgY29uY2F0ZW5hdGVkIGludG8gYSBzaW5nbGUgdHJhbnNmb3JtIHN0cmluZyB2aWEgZmx1c2hUcmFuc2Zvcm1DYWNoZSgpLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGUudHJhbnNsYXRlM2QgPSBcIigwcHgsIDBweCwgMHB4KVwiO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUHJvcGVydHlFeGlzdHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zZm9ybVByb3BlcnR5RXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDU1MuZmx1c2hUcmFuc2Zvcm1DYWNoZShlbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIFRoZSBub24tXCJub25lXCIgZGlzcGxheSB2YWx1ZSBpcyBvbmx5IGFwcGxpZWQgdG8gYW4gZWxlbWVudCBvbmNlIC0tIHdoZW4gaXRzIGFzc29jaWF0ZWQgY2FsbCBpcyBmaXJzdCB0aWNrZWQgdGhyb3VnaC5cbiAgICAgICAgICAgICAgICAgICBBY2NvcmRpbmdseSwgaXQncyBzZXQgdG8gZmFsc2Ugc28gdGhhdCBpdCBpc24ndCByZS1wcm9jZXNzZWQgYnkgdGhpcyBjYWxsIGluIHRoZSBuZXh0IHRpY2suICovXG4gICAgICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSAhPT0gdW5kZWZpbmVkICYmIG9wdHMuZGlzcGxheSAhPT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHNbaV1bMl0uZGlzcGxheSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAob3B0cy52aXNpYmlsaXR5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy52aXNpYmlsaXR5ICE9PSBcImhpZGRlblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzW2ldWzJdLnZpc2liaWxpdHkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBQYXNzIHRoZSBlbGVtZW50cyBhbmQgdGhlIHRpbWluZyBkYXRhIChwZXJjZW50Q29tcGxldGUsIG1zUmVtYWluaW5nLCB0aW1lU3RhcnQsIHR3ZWVuRHVtbXlWYWx1ZSkgaW50byB0aGUgcHJvZ3Jlc3MgY2FsbGJhY2suICovXG4gICAgICAgICAgICAgICAgaWYgKG9wdHMucHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5wcm9ncmVzcy5jYWxsKGNhbGxDb250YWluZXJbMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsQ29udGFpbmVyWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVyY2VudENvbXBsZXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgoMCwgKHRpbWVTdGFydCArIG9wdHMuZHVyYXRpb24pIC0gdGltZUN1cnJlbnQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZVN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5EdW1teVZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBJZiB0aGlzIGNhbGwgaGFzIGZpbmlzaGVkIHR3ZWVuaW5nLCBwYXNzIGl0cyBpbmRleCB0byBjb21wbGV0ZUNhbGwoKSB0byBoYW5kbGUgY2FsbCBjbGVhbnVwLiAqL1xuICAgICAgICAgICAgICAgIGlmIChwZXJjZW50Q29tcGxldGUgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGxldGVDYWxsKGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qIE5vdGU6IGNvbXBsZXRlQ2FsbCgpIHNldHMgdGhlIGlzVGlja2luZyBmbGFnIHRvIGZhbHNlIHdoZW4gdGhlIGxhc3QgY2FsbCBvbiBWZWxvY2l0eS5TdGF0ZS5jYWxscyBoYXMgY29tcGxldGVkLiAqL1xuICAgICAgICBpZiAoVmVsb2NpdHkuU3RhdGUuaXNUaWNraW5nKSB7XG4gICAgICAgICAgICB0aWNrZXIodGljayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDYWxsIENvbXBsZXRpb25cbiAgICAqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLyogTm90ZTogVW5saWtlIHRpY2soKSwgd2hpY2ggcHJvY2Vzc2VzIGFsbCBhY3RpdmUgY2FsbHMgYXQgb25jZSwgY2FsbCBjb21wbGV0aW9uIGlzIGhhbmRsZWQgb24gYSBwZXItY2FsbCBiYXNpcy4gKi9cbiAgICBmdW5jdGlvbiBjb21wbGV0ZUNhbGwgKGNhbGxJbmRleCwgaXNTdG9wcGVkKSB7XG4gICAgICAgIC8qIEVuc3VyZSB0aGUgY2FsbCBleGlzdHMuICovXG4gICAgICAgIGlmICghVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogUHVsbCB0aGUgbWV0YWRhdGEgZnJvbSB0aGUgY2FsbC4gKi9cbiAgICAgICAgdmFyIGNhbGwgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdWzBdLFxuICAgICAgICAgICAgZWxlbWVudHMgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdWzFdLFxuICAgICAgICAgICAgb3B0cyA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzW2NhbGxJbmRleF1bMl0sXG4gICAgICAgICAgICByZXNvbHZlciA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzW2NhbGxJbmRleF1bNF07XG5cbiAgICAgICAgdmFyIHJlbWFpbmluZ0NhbGxzRXhpc3QgPSBmYWxzZTtcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICBFbGVtZW50IEZpbmFsaXphdGlvblxuICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBjYWxsTGVuZ3RoID0gY2FsbC5sZW5ndGg7IGkgPCBjYWxsTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50ID0gY2FsbFtpXS5lbGVtZW50O1xuXG4gICAgICAgICAgICAvKiBJZiB0aGUgdXNlciBzZXQgZGlzcGxheSB0byBcIm5vbmVcIiAoaW50ZW5kaW5nIHRvIGhpZGUgdGhlIGVsZW1lbnQpLCBzZXQgaXQgbm93IHRoYXQgdGhlIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogZGlzcGxheTpub25lIGlzbid0IHNldCB3aGVuIGNhbGxzIGFyZSBtYW51YWxseSBzdG9wcGVkICh2aWEgVmVsb2NpdHkoXCJzdG9wXCIpLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogRGlzcGxheSBnZXRzIGlnbm9yZWQgd2l0aCBcInJldmVyc2VcIiBjYWxscyBhbmQgaW5maW5pdGUgbG9vcHMsIHNpbmNlIHRoaXMgYmVoYXZpb3Igd291bGQgYmUgdW5kZXNpcmFibGUuICovXG4gICAgICAgICAgICBpZiAoIWlzU3RvcHBlZCAmJiAhb3B0cy5sb29wKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSA9PT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJkaXNwbGF5XCIsIG9wdHMuZGlzcGxheSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG9wdHMudmlzaWJpbGl0eSA9PT0gXCJoaWRkZW5cIikge1xuICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInZpc2liaWxpdHlcIiwgb3B0cy52aXNpYmlsaXR5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIElmIHRoZSBlbGVtZW50J3MgcXVldWUgaXMgZW1wdHkgKGlmIG9ubHkgdGhlIFwiaW5wcm9ncmVzc1wiIGl0ZW0gaXMgbGVmdCBhdCBwb3NpdGlvbiAwKSBvciBpZiBpdHMgcXVldWUgaXMgYWJvdXQgdG8gcnVuXG4gICAgICAgICAgICAgICBhIG5vbi1WZWxvY2l0eS1pbml0aWF0ZWQgZW50cnksIHR1cm4gb2ZmIHRoZSBpc0FuaW1hdGluZyBmbGFnLiBBIG5vbi1WZWxvY2l0eS1pbml0aWF0aWVkIHF1ZXVlIGVudHJ5J3MgbG9naWMgbWlnaHQgYWx0ZXJcbiAgICAgICAgICAgICAgIGFuIGVsZW1lbnQncyBDU1MgdmFsdWVzIGFuZCB0aGVyZWJ5IGNhdXNlIFZlbG9jaXR5J3MgY2FjaGVkIHZhbHVlIGRhdGEgdG8gZ28gc3RhbGUuIFRvIGRldGVjdCBpZiBhIHF1ZXVlIGVudHJ5IHdhcyBpbml0aWF0ZWQgYnkgVmVsb2NpdHksXG4gICAgICAgICAgICAgICB3ZSBjaGVjayBmb3IgdGhlIGV4aXN0ZW5jZSBvZiBvdXIgc3BlY2lhbCBWZWxvY2l0eS5xdWV1ZUVudHJ5RmxhZyBkZWNsYXJhdGlvbiwgd2hpY2ggbWluaWZpZXJzIHdvbid0IHJlbmFtZSBzaW5jZSB0aGUgZmxhZ1xuICAgICAgICAgICAgICAgaXMgYXNzaWduZWQgdG8galF1ZXJ5J3MgZ2xvYmFsICQgb2JqZWN0IGFuZCB0aHVzIGV4aXN0cyBvdXQgb2YgVmVsb2NpdHkncyBvd24gc2NvcGUuICovXG4gICAgICAgICAgICBpZiAob3B0cy5sb29wICE9PSB0cnVlICYmICgkLnF1ZXVlKGVsZW1lbnQpWzFdID09PSB1bmRlZmluZWQgfHwgIS9cXC52ZWxvY2l0eVF1ZXVlRW50cnlGbGFnL2kudGVzdCgkLnF1ZXVlKGVsZW1lbnQpWzFdKSkpIHtcbiAgICAgICAgICAgICAgICAvKiBUaGUgZWxlbWVudCBtYXkgaGF2ZSBiZWVuIGRlbGV0ZWQuIEVuc3VyZSB0aGF0IGl0cyBkYXRhIGNhY2hlIHN0aWxsIGV4aXN0cyBiZWZvcmUgYWN0aW5nIG9uIGl0LiAqL1xuICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkuaXNBbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgLyogQ2xlYXIgdGhlIGVsZW1lbnQncyByb290UHJvcGVydHlWYWx1ZUNhY2hlLCB3aGljaCB3aWxsIGJlY29tZSBzdGFsZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5yb290UHJvcGVydHlWYWx1ZUNhY2hlID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRyYW5zZm9ybUhBUHJvcGVydHlFeGlzdHMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgLyogSWYgYW55IDNEIHRyYW5zZm9ybSBzdWJwcm9wZXJ0eSBpcyBhdCBpdHMgZGVmYXVsdCB2YWx1ZSAocmVnYXJkbGVzcyBvZiB1bml0IHR5cGUpLCByZW1vdmUgaXQuICovXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChDU1MuTGlzdHMudHJhbnNmb3JtczNELCBmdW5jdGlvbihpLCB0cmFuc2Zvcm1OYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVmYXVsdFZhbHVlID0gL15zY2FsZS8udGVzdCh0cmFuc2Zvcm1OYW1lKSA/IDEgOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZSA9IERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdICE9PSB1bmRlZmluZWQgJiYgbmV3IFJlZ0V4cChcIl5cXFxcKFwiICsgZGVmYXVsdFZhbHVlICsgXCJbXi5dXCIpLnRlc3QoY3VycmVudFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybUhBUHJvcGVydHlFeGlzdHMgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIE1vYmlsZSBkZXZpY2VzIGhhdmUgaGFyZHdhcmUgYWNjZWxlcmF0aW9uIHJlbW92ZWQgYXQgdGhlIGVuZCBvZiB0aGUgYW5pbWF0aW9uIGluIG9yZGVyIHRvIGF2b2lkIGhvZ2dpbmcgdGhlIEdQVSdzIG1lbW9yeS4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMubW9iaWxlSEEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybUhBUHJvcGVydHlFeGlzdHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGUudHJhbnNsYXRlM2Q7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBGbHVzaCB0aGUgc3VicHJvcGVydHkgcmVtb3ZhbHMgdG8gdGhlIERPTS4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zZm9ybUhBUHJvcGVydHlFeGlzdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIENTUy5mbHVzaFRyYW5zZm9ybUNhY2hlKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogUmVtb3ZlIHRoZSBcInZlbG9jaXR5LWFuaW1hdGluZ1wiIGluZGljYXRvciBjbGFzcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgQ1NTLlZhbHVlcy5yZW1vdmVDbGFzcyhlbGVtZW50LCBcInZlbG9jaXR5LWFuaW1hdGluZ1wiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIE9wdGlvbjogQ29tcGxldGVcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgLyogQ29tcGxldGUgaXMgZmlyZWQgb25jZSBwZXIgY2FsbCAobm90IG9uY2UgcGVyIGVsZW1lbnQpIGFuZCBpcyBwYXNzZWQgdGhlIGZ1bGwgcmF3IERPTSBlbGVtZW50IHNldCBhcyBib3RoIGl0cyBjb250ZXh0IGFuZCBpdHMgZmlyc3QgYXJndW1lbnQuICovXG4gICAgICAgICAgICAvKiBOb3RlOiBDYWxsYmFja3MgYXJlbid0IGZpcmVkIHdoZW4gY2FsbHMgYXJlIG1hbnVhbGx5IHN0b3BwZWQgKHZpYSBWZWxvY2l0eShcInN0b3BcIikuICovXG4gICAgICAgICAgICBpZiAoIWlzU3RvcHBlZCAmJiBvcHRzLmNvbXBsZXRlICYmICFvcHRzLmxvb3AgJiYgKGkgPT09IGNhbGxMZW5ndGggLSAxKSkge1xuICAgICAgICAgICAgICAgIC8qIFdlIHRocm93IGNhbGxiYWNrcyBpbiBhIHNldFRpbWVvdXQgc28gdGhhdCB0aHJvd24gZXJyb3JzIGRvbid0IGhhbHQgdGhlIGV4ZWN1dGlvbiBvZiBWZWxvY2l0eSBpdHNlbGYuICovXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5jb21wbGV0ZS5jYWxsKGVsZW1lbnRzLCBlbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgdGhyb3cgZXJyb3I7IH0sIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIFByb21pc2UgUmVzb2x2aW5nXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAvKiBOb3RlOiBJbmZpbml0ZSBsb29wcyBkb24ndCByZXR1cm4gcHJvbWlzZXMuICovXG4gICAgICAgICAgICBpZiAocmVzb2x2ZXIgJiYgb3B0cy5sb29wICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIoZWxlbWVudHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgT3B0aW9uOiBMb29wIChJbmZpbml0ZSlcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpICYmIG9wdHMubG9vcCA9PT0gdHJ1ZSAmJiAhaXNTdG9wcGVkKSB7XG4gICAgICAgICAgICAgICAgLyogSWYgYSByb3RhdGVYL1kvWiBwcm9wZXJ0eSBpcyBiZWluZyBhbmltYXRlZCB0byAzNjAgZGVnIHdpdGggbG9vcDp0cnVlLCBzd2FwIHR3ZWVuIHN0YXJ0L2VuZCB2YWx1ZXMgdG8gZW5hYmxlXG4gICAgICAgICAgICAgICAgICAgY29udGludW91cyBpdGVyYXRpdmUgcm90YXRpb24gbG9vcGluZy4gKE90aGVyaXNlLCB0aGUgZWxlbWVudCB3b3VsZCBqdXN0IHJvdGF0ZSBiYWNrIGFuZCBmb3J0aC4pICovXG4gICAgICAgICAgICAgICAgJC5lYWNoKERhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyLCBmdW5jdGlvbihwcm9wZXJ0eU5hbWUsIHR3ZWVuQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgvXnJvdGF0ZS8udGVzdChwcm9wZXJ0eU5hbWUpICYmIHBhcnNlRmxvYXQodHdlZW5Db250YWluZXIuZW5kVmFsdWUpID09PSAzNjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuQ29udGFpbmVyLmVuZFZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuQ29udGFpbmVyLnN0YXJ0VmFsdWUgPSAzNjA7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoL15iYWNrZ3JvdW5kUG9zaXRpb24vLnRlc3QocHJvcGVydHlOYW1lKSAmJiBwYXJzZUZsb2F0KHR3ZWVuQ29udGFpbmVyLmVuZFZhbHVlKSA9PT0gMTAwICYmIHR3ZWVuQ29udGFpbmVyLnVuaXRUeXBlID09PSBcIiVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5Db250YWluZXIuZW5kVmFsdWUgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5Db250YWluZXIuc3RhcnRWYWx1ZSA9IDEwMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgVmVsb2NpdHkoZWxlbWVudCwgXCJyZXZlcnNlXCIsIHsgbG9vcDogdHJ1ZSwgZGVsYXk6IG9wdHMuZGVsYXkgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIERlcXVldWVpbmdcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgLyogRmlyZSB0aGUgbmV4dCBjYWxsIGluIHRoZSBxdWV1ZSBzbyBsb25nIGFzIHRoaXMgY2FsbCdzIHF1ZXVlIHdhc24ndCBzZXQgdG8gZmFsc2UgKHRvIHRyaWdnZXIgYSBwYXJhbGxlbCBhbmltYXRpb24pLFxuICAgICAgICAgICAgICAgd2hpY2ggd291bGQgaGF2ZSBhbHJlYWR5IGNhdXNlZCB0aGUgbmV4dCBjYWxsIHRvIGZpcmUuIE5vdGU6IEV2ZW4gaWYgdGhlIGVuZCBvZiB0aGUgYW5pbWF0aW9uIHF1ZXVlIGhhcyBiZWVuIHJlYWNoZWQsXG4gICAgICAgICAgICAgICAkLmRlcXVldWUoKSBtdXN0IHN0aWxsIGJlIGNhbGxlZCBpbiBvcmRlciB0byBjb21wbGV0ZWx5IGNsZWFyIGpRdWVyeSdzIGFuaW1hdGlvbiBxdWV1ZS4gKi9cbiAgICAgICAgICAgIGlmIChvcHRzLnF1ZXVlICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICQuZGVxdWV1ZShlbGVtZW50LCBvcHRzLnF1ZXVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgQ2FsbHMgQXJyYXkgQ2xlYW51cFxuICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogU2luY2UgdGhpcyBjYWxsIGlzIGNvbXBsZXRlLCBzZXQgaXQgdG8gZmFsc2Ugc28gdGhhdCB0aGUgckFGIHRpY2sgc2tpcHMgaXQuIFRoaXMgYXJyYXkgaXMgbGF0ZXIgY29tcGFjdGVkIHZpYSBjb21wYWN0U3BhcnNlQXJyYXkoKS5cbiAgICAgICAgICAoRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHRoZSBjYWxsIGlzIHNldCB0byBmYWxzZSBpbnN0ZWFkIG9mIGJlaW5nIGRlbGV0ZWQgZnJvbSB0aGUgYXJyYXk6IGh0dHA6Ly93d3cuaHRtbDVyb2Nrcy5jb20vZW4vdHV0b3JpYWxzL3NwZWVkL3Y4LykgKi9cbiAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XSA9IGZhbHNlO1xuXG4gICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCB0aGUgY2FsbHMgYXJyYXkgdG8gZGV0ZXJtaW5lIGlmIHRoaXMgd2FzIHRoZSBmaW5hbCBpbi1wcm9ncmVzcyBhbmltYXRpb24uXG4gICAgICAgICAgIElmIHNvLCBzZXQgYSBmbGFnIHRvIGVuZCB0aWNraW5nIGFuZCBjbGVhciB0aGUgY2FsbHMgYXJyYXkuICovXG4gICAgICAgIGZvciAodmFyIGogPSAwLCBjYWxsc0xlbmd0aCA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzLmxlbmd0aDsgaiA8IGNhbGxzTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChWZWxvY2l0eS5TdGF0ZS5jYWxsc1tqXSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZW1haW5pbmdDYWxsc0V4aXN0ID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlbWFpbmluZ0NhbGxzRXhpc3QgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAvKiB0aWNrKCkgd2lsbCBkZXRlY3QgdGhpcyBmbGFnIHVwb24gaXRzIG5leHQgaXRlcmF0aW9uIGFuZCBzdWJzZXF1ZW50bHkgdHVybiBpdHNlbGYgb2ZmLiAqL1xuICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuaXNUaWNraW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgIC8qIENsZWFyIHRoZSBjYWxscyBhcnJheSBzbyB0aGF0IGl0cyBsZW5ndGggaXMgcmVzZXQuICovXG4gICAgICAgICAgICBkZWxldGUgVmVsb2NpdHkuU3RhdGUuY2FsbHM7XG4gICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxscyA9IFtdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKlxuICAgICAgICBGcmFtZXdvcmtzXG4gICAgKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLyogQm90aCBqUXVlcnkgYW5kIFplcHRvIGFsbG93IHRoZWlyICQuZm4gb2JqZWN0IHRvIGJlIGV4dGVuZGVkIHRvIGFsbG93IHdyYXBwZWQgZWxlbWVudHMgdG8gYmUgc3ViamVjdGVkIHRvIHBsdWdpbiBjYWxscy5cbiAgICAgICBJZiBlaXRoZXIgZnJhbWV3b3JrIGlzIGxvYWRlZCwgcmVnaXN0ZXIgYSBcInZlbG9jaXR5XCIgZXh0ZW5zaW9uIHBvaW50aW5nIHRvIFZlbG9jaXR5J3MgY29yZSBhbmltYXRlKCkgbWV0aG9kLiAgVmVsb2NpdHlcbiAgICAgICBhbHNvIHJlZ2lzdGVycyBpdHNlbGYgb250byBhIGdsb2JhbCBjb250YWluZXIgKHdpbmRvdy5qUXVlcnkgfHwgd2luZG93LlplcHRvIHx8IHdpbmRvdykgc28gdGhhdCBjZXJ0YWluIGZlYXR1cmVzIGFyZVxuICAgICAgIGFjY2Vzc2libGUgYmV5b25kIGp1c3QgYSBwZXItZWxlbWVudCBzY29wZS4gVGhpcyBtYXN0ZXIgb2JqZWN0IGNvbnRhaW5zIGFuIC5hbmltYXRlKCkgbWV0aG9kLCB3aGljaCBpcyBsYXRlciBhc3NpZ25lZCB0byAkLmZuXG4gICAgICAgKGlmIGpRdWVyeSBvciBaZXB0byBhcmUgcHJlc2VudCkuIEFjY29yZGluZ2x5LCBWZWxvY2l0eSBjYW4gYm90aCBhY3Qgb24gd3JhcHBlZCBET00gZWxlbWVudHMgYW5kIHN0YW5kIGFsb25lIGZvciB0YXJnZXRpbmcgcmF3IERPTSBlbGVtZW50cy4gKi9cbiAgICBnbG9iYWwuVmVsb2NpdHkgPSBWZWxvY2l0eTtcblxuICAgIGlmIChnbG9iYWwgIT09IHdpbmRvdykge1xuICAgICAgICAvKiBBc3NpZ24gdGhlIGVsZW1lbnQgZnVuY3Rpb24gdG8gVmVsb2NpdHkncyBjb3JlIGFuaW1hdGUoKSBtZXRob2QuICovXG4gICAgICAgIGdsb2JhbC5mbi52ZWxvY2l0eSA9IGFuaW1hdGU7XG4gICAgICAgIC8qIEFzc2lnbiB0aGUgb2JqZWN0IGZ1bmN0aW9uJ3MgZGVmYXVsdHMgdG8gVmVsb2NpdHkncyBnbG9iYWwgZGVmYXVsdHMgb2JqZWN0LiAqL1xuICAgICAgICBnbG9iYWwuZm4udmVsb2NpdHkuZGVmYXVsdHMgPSBWZWxvY2l0eS5kZWZhdWx0cztcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICBQYWNrYWdlZCBSZWRpcmVjdHNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8qIHNsaWRlVXAsIHNsaWRlRG93biAqL1xuICAgICQuZWFjaChbIFwiRG93blwiLCBcIlVwXCIgXSwgZnVuY3Rpb24oaSwgZGlyZWN0aW9uKSB7XG4gICAgICAgIFZlbG9jaXR5LlJlZGlyZWN0c1tcInNsaWRlXCIgKyBkaXJlY3Rpb25dID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMsIGVsZW1lbnRzSW5kZXgsIGVsZW1lbnRzU2l6ZSwgZWxlbWVudHMsIHByb21pc2VEYXRhKSB7XG4gICAgICAgICAgICB2YXIgb3B0cyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICBiZWdpbiA9IG9wdHMuYmVnaW4sXG4gICAgICAgICAgICAgICAgY29tcGxldGUgPSBvcHRzLmNvbXBsZXRlLFxuICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWVzID0geyBoZWlnaHQ6IFwiXCIsIG1hcmdpblRvcDogXCJcIiwgbWFyZ2luQm90dG9tOiBcIlwiLCBwYWRkaW5nVG9wOiBcIlwiLCBwYWRkaW5nQm90dG9tOiBcIlwiIH0sXG4gICAgICAgICAgICAgICAgaW5saW5lVmFsdWVzID0ge307XG5cbiAgICAgICAgICAgIGlmIChvcHRzLmRpc3BsYXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIC8qIFNob3cgdGhlIGVsZW1lbnQgYmVmb3JlIHNsaWRlRG93biBiZWdpbnMgYW5kIGhpZGUgdGhlIGVsZW1lbnQgYWZ0ZXIgc2xpZGVVcCBjb21wbGV0ZXMuICovXG4gICAgICAgICAgICAgICAgLyogTm90ZTogSW5saW5lIGVsZW1lbnRzIGNhbm5vdCBoYXZlIGRpbWVuc2lvbnMgYW5pbWF0ZWQsIHNvIHRoZXkncmUgcmV2ZXJ0ZWQgdG8gaW5saW5lLWJsb2NrLiAqL1xuICAgICAgICAgICAgICAgIG9wdHMuZGlzcGxheSA9IChkaXJlY3Rpb24gPT09IFwiRG93blwiID8gKFZlbG9jaXR5LkNTUy5WYWx1ZXMuZ2V0RGlzcGxheVR5cGUoZWxlbWVudCkgPT09IFwiaW5saW5lXCIgPyBcImlubGluZS1ibG9ja1wiIDogXCJibG9ja1wiKSA6IFwibm9uZVwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3B0cy5iZWdpbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8qIElmIHRoZSB1c2VyIHBhc3NlZCBpbiBhIGJlZ2luIGNhbGxiYWNrLCBmaXJlIGl0IG5vdy4gKi9cbiAgICAgICAgICAgICAgICBiZWdpbiAmJiBiZWdpbi5jYWxsKGVsZW1lbnRzLCBlbGVtZW50cyk7XG5cbiAgICAgICAgICAgICAgICAvKiBDYWNoZSB0aGUgZWxlbWVudHMnIG9yaWdpbmFsIHZlcnRpY2FsIGRpbWVuc2lvbmFsIHByb3BlcnR5IHZhbHVlcyBzbyB0aGF0IHdlIGNhbiBhbmltYXRlIGJhY2sgdG8gdGhlbS4gKi9cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBjb21wdXRlZFZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICBpbmxpbmVWYWx1ZXNbcHJvcGVydHldID0gZWxlbWVudC5zdHlsZVtwcm9wZXJ0eV07XG5cbiAgICAgICAgICAgICAgICAgICAgLyogRm9yIHNsaWRlRG93biwgdXNlIGZvcmNlZmVlZGluZyB0byBhbmltYXRlIGFsbCB2ZXJ0aWNhbCBwcm9wZXJ0aWVzIGZyb20gMC4gRm9yIHNsaWRlVXAsXG4gICAgICAgICAgICAgICAgICAgICAgIHVzZSBmb3JjZWZlZWRpbmcgdG8gc3RhcnQgZnJvbSBjb21wdXRlZCB2YWx1ZXMgYW5kIGFuaW1hdGUgZG93biB0byAwLiAqL1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHlWYWx1ZSA9IFZlbG9jaXR5LkNTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZXNbcHJvcGVydHldID0gKGRpcmVjdGlvbiA9PT0gXCJEb3duXCIpID8gWyBwcm9wZXJ0eVZhbHVlLCAwIF0gOiBbIDAsIHByb3BlcnR5VmFsdWUgXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBGb3JjZSB2ZXJ0aWNhbCBvdmVyZmxvdyBjb250ZW50IHRvIGNsaXAgc28gdGhhdCBzbGlkaW5nIHdvcmtzIGFzIGV4cGVjdGVkLiAqL1xuICAgICAgICAgICAgICAgIGlubGluZVZhbHVlcy5vdmVyZmxvdyA9IGVsZW1lbnQuc3R5bGUub3ZlcmZsb3c7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wdHMuY29tcGxldGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvKiBSZXNldCBlbGVtZW50IHRvIGl0cyBwcmUtc2xpZGUgaW5saW5lIHZhbHVlcyBvbmNlIGl0cyBzbGlkZSBhbmltYXRpb24gaXMgY29tcGxldGUuICovXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gaW5saW5lVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGVbcHJvcGVydHldID0gaW5saW5lVmFsdWVzW3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBJZiB0aGUgdXNlciBwYXNzZWQgaW4gYSBjb21wbGV0ZSBjYWxsYmFjaywgZmlyZSBpdCBub3cuICovXG4gICAgICAgICAgICAgICAgY29tcGxldGUgJiYgY29tcGxldGUuY2FsbChlbGVtZW50cywgZWxlbWVudHMpO1xuICAgICAgICAgICAgICAgIHByb21pc2VEYXRhICYmIHByb21pc2VEYXRhLnJlc29sdmVyKGVsZW1lbnRzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIFZlbG9jaXR5KGVsZW1lbnQsIGNvbXB1dGVkVmFsdWVzLCBvcHRzKTtcbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIC8qIGZhZGVJbiwgZmFkZU91dCAqL1xuICAgICQuZWFjaChbIFwiSW5cIiwgXCJPdXRcIiBdLCBmdW5jdGlvbihpLCBkaXJlY3Rpb24pIHtcbiAgICAgICAgVmVsb2NpdHkuUmVkaXJlY3RzW1wiZmFkZVwiICsgZGlyZWN0aW9uXSA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zLCBlbGVtZW50c0luZGV4LCBlbGVtZW50c1NpemUsIGVsZW1lbnRzLCBwcm9taXNlRGF0YSkge1xuICAgICAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgcHJvcGVydGllc01hcCA9IHsgb3BhY2l0eTogKGRpcmVjdGlvbiA9PT0gXCJJblwiKSA/IDEgOiAwIH0sXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxDb21wbGV0ZSA9IG9wdHMuY29tcGxldGU7XG5cbiAgICAgICAgICAgIC8qIFNpbmNlIHJlZGlyZWN0cyBhcmUgdHJpZ2dlcmVkIGluZGl2aWR1YWxseSBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBhbmltYXRlZCBzZXQsIGF2b2lkIHJlcGVhdGVkbHkgdHJpZ2dlcmluZ1xuICAgICAgICAgICAgICAgY2FsbGJhY2tzIGJ5IGZpcmluZyB0aGVtIG9ubHkgd2hlbiB0aGUgZmluYWwgZWxlbWVudCBoYXMgYmVlbiByZWFjaGVkLiAqL1xuICAgICAgICAgICAgaWYgKGVsZW1lbnRzSW5kZXggIT09IGVsZW1lbnRzU2l6ZSAtIDEpIHtcbiAgICAgICAgICAgICAgICBvcHRzLmNvbXBsZXRlID0gb3B0cy5iZWdpbiA9IG51bGw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9wdHMuY29tcGxldGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9yaWdpbmFsQ29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsQ29tcGxldGUuY2FsbChlbGVtZW50cywgZWxlbWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZURhdGEgJiYgcHJvbWlzZURhdGEucmVzb2x2ZXIoZWxlbWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogSWYgYSBkaXNwbGF5IHdhcyBwYXNzZWQgaW4sIHVzZSBpdC4gT3RoZXJ3aXNlLCBkZWZhdWx0IHRvIFwibm9uZVwiIGZvciBmYWRlT3V0IG9yIHRoZSBlbGVtZW50LXNwZWNpZmljIGRlZmF1bHQgZm9yIGZhZGVJbi4gKi9cbiAgICAgICAgICAgIC8qIE5vdGU6IFdlIGFsbG93IHVzZXJzIHRvIHBhc3MgaW4gXCJudWxsXCIgdG8gc2tpcCBkaXNwbGF5IHNldHRpbmcgYWx0b2dldGhlci4gKi9cbiAgICAgICAgICAgIGlmIChvcHRzLmRpc3BsYXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIG9wdHMuZGlzcGxheSA9IChkaXJlY3Rpb24gPT09IFwiSW5cIiA/IFwiYXV0b1wiIDogXCJub25lXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBWZWxvY2l0eSh0aGlzLCBwcm9wZXJ0aWVzTWFwLCBvcHRzKTtcbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIHJldHVybiBWZWxvY2l0eTtcbn0oKHdpbmRvdy5qUXVlcnkgfHwgd2luZG93LlplcHRvIHx8IHdpbmRvdyksIHdpbmRvdywgZG9jdW1lbnQpO1xufSkpO1xuXG4vKioqKioqKioqKioqKioqKioqXG4gICBLbm93biBJc3N1ZXNcbioqKioqKioqKioqKioqKioqKi9cblxuLyogVGhlIENTUyBzcGVjIG1hbmRhdGVzIHRoYXQgdGhlIHRyYW5zbGF0ZVgvWS9aIHRyYW5zZm9ybXMgYXJlICUtcmVsYXRpdmUgdG8gdGhlIGVsZW1lbnQgaXRzZWxmIC0tIG5vdCBpdHMgcGFyZW50LlxuVmVsb2NpdHksIGhvd2V2ZXIsIGRvZXNuJ3QgbWFrZSB0aGlzIGRpc3RpbmN0aW9uLiBUaHVzLCBjb252ZXJ0aW5nIHRvIG9yIGZyb20gdGhlICUgdW5pdCB3aXRoIHRoZXNlIHN1YnByb3BlcnRpZXNcbndpbGwgcHJvZHVjZSBhbiBpbmFjY3VyYXRlIGNvbnZlcnNpb24gdmFsdWUuIFRoZSBzYW1lIGlzc3VlIGV4aXN0cyB3aXRoIHRoZSBjeC9jeSBhdHRyaWJ1dGVzIG9mIFNWRyBjaXJjbGVzIGFuZCBlbGxpcHNlcy4gKi8iLCJ2YXIgY3JlYXRlRWxlbWVudCA9IHJlcXVpcmUoXCIuL3Zkb20vY3JlYXRlLWVsZW1lbnQuanNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVFbGVtZW50XG4iLCJ2YXIgZGlmZiA9IHJlcXVpcmUoXCIuL3Z0cmVlL2RpZmYuanNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBkaWZmXG4iLCJ2YXIgaCA9IHJlcXVpcmUoXCIuL3ZpcnR1YWwtaHlwZXJzY3JpcHQvaW5kZXguanNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBoXG4iLCJ2YXIgcGF0Y2ggPSByZXF1aXJlKFwiLi92ZG9tL3BhdGNoLmpzXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gcGF0Y2hcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoXCJpcy1vYmplY3RcIilcbnZhciBpc0hvb2sgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdmhvb2suanNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBhcHBseVByb3BlcnRpZXNcblxuZnVuY3Rpb24gYXBwbHlQcm9wZXJ0aWVzKG5vZGUsIHByb3BzLCBwcmV2aW91cykge1xuICAgIGZvciAodmFyIHByb3BOYW1lIGluIHByb3BzKSB7XG4gICAgICAgIHZhciBwcm9wVmFsdWUgPSBwcm9wc1twcm9wTmFtZV1cblxuICAgICAgICBpZiAocHJvcFZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlbW92ZVByb3BlcnR5KG5vZGUsIHByb3BOYW1lLCBwcm9wVmFsdWUsIHByZXZpb3VzKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc0hvb2socHJvcFZhbHVlKSkge1xuICAgICAgICAgICAgcmVtb3ZlUHJvcGVydHkobm9kZSwgcHJvcE5hbWUsIHByb3BWYWx1ZSwgcHJldmlvdXMpXG4gICAgICAgICAgICBpZiAocHJvcFZhbHVlLmhvb2spIHtcbiAgICAgICAgICAgICAgICBwcm9wVmFsdWUuaG9vayhub2RlLFxuICAgICAgICAgICAgICAgICAgICBwcm9wTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXMgPyBwcmV2aW91c1twcm9wTmFtZV0gOiB1bmRlZmluZWQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoaXNPYmplY3QocHJvcFZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoT2JqZWN0KG5vZGUsIHByb3BzLCBwcmV2aW91cywgcHJvcE5hbWUsIHByb3BWYWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vZGVbcHJvcE5hbWVdID0gcHJvcFZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVByb3BlcnR5KG5vZGUsIHByb3BOYW1lLCBwcm9wVmFsdWUsIHByZXZpb3VzKSB7XG4gICAgaWYgKHByZXZpb3VzKSB7XG4gICAgICAgIHZhciBwcmV2aW91c1ZhbHVlID0gcHJldmlvdXNbcHJvcE5hbWVdXG5cbiAgICAgICAgaWYgKCFpc0hvb2socHJldmlvdXNWYWx1ZSkpIHtcbiAgICAgICAgICAgIGlmIChwcm9wTmFtZSA9PT0gXCJhdHRyaWJ1dGVzXCIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBhdHRyTmFtZSBpbiBwcmV2aW91c1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcE5hbWUgPT09IFwic3R5bGVcIikge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gcHJldmlvdXNWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnN0eWxlW2ldID0gXCJcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHByZXZpb3VzVmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBub2RlW3Byb3BOYW1lXSA9IFwiXCJcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbm9kZVtwcm9wTmFtZV0gPSBudWxsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocHJldmlvdXNWYWx1ZS51bmhvb2spIHtcbiAgICAgICAgICAgIHByZXZpb3VzVmFsdWUudW5ob29rKG5vZGUsIHByb3BOYW1lLCBwcm9wVmFsdWUpXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhdGNoT2JqZWN0KG5vZGUsIHByb3BzLCBwcmV2aW91cywgcHJvcE5hbWUsIHByb3BWYWx1ZSkge1xuICAgIHZhciBwcmV2aW91c1ZhbHVlID0gcHJldmlvdXMgPyBwcmV2aW91c1twcm9wTmFtZV0gOiB1bmRlZmluZWRcblxuICAgIC8vIFNldCBhdHRyaWJ1dGVzXG4gICAgaWYgKHByb3BOYW1lID09PSBcImF0dHJpYnV0ZXNcIikge1xuICAgICAgICBmb3IgKHZhciBhdHRyTmFtZSBpbiBwcm9wVmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBhdHRyVmFsdWUgPSBwcm9wVmFsdWVbYXR0ck5hbWVdXG5cbiAgICAgICAgICAgIGlmIChhdHRyVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0clZhbHVlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYocHJldmlvdXNWYWx1ZSAmJiBpc09iamVjdChwcmV2aW91c1ZhbHVlKSAmJlxuICAgICAgICBnZXRQcm90b3R5cGUocHJldmlvdXNWYWx1ZSkgIT09IGdldFByb3RvdHlwZShwcm9wVmFsdWUpKSB7XG4gICAgICAgIG5vZGVbcHJvcE5hbWVdID0gcHJvcFZhbHVlXG4gICAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmICghaXNPYmplY3Qobm9kZVtwcm9wTmFtZV0pKSB7XG4gICAgICAgIG5vZGVbcHJvcE5hbWVdID0ge31cbiAgICB9XG5cbiAgICB2YXIgcmVwbGFjZXIgPSBwcm9wTmFtZSA9PT0gXCJzdHlsZVwiID8gXCJcIiA6IHVuZGVmaW5lZFxuXG4gICAgZm9yICh2YXIgayBpbiBwcm9wVmFsdWUpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gcHJvcFZhbHVlW2tdXG4gICAgICAgIG5vZGVbcHJvcE5hbWVdW2tdID0gKHZhbHVlID09PSB1bmRlZmluZWQpID8gcmVwbGFjZXIgOiB2YWx1ZVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0UHJvdG90eXBlKHZhbHVlKSB7XG4gICAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZikge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKHZhbHVlKVxuICAgIH0gZWxzZSBpZiAodmFsdWUuX19wcm90b19fKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS5fX3Byb3RvX19cbiAgICB9IGVsc2UgaWYgKHZhbHVlLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGVcbiAgICB9XG59XG4iLCJ2YXIgZG9jdW1lbnQgPSByZXF1aXJlKFwiZ2xvYmFsL2RvY3VtZW50XCIpXG5cbnZhciBhcHBseVByb3BlcnRpZXMgPSByZXF1aXJlKFwiLi9hcHBseS1wcm9wZXJ0aWVzXCIpXG5cbnZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZub2RlLmpzXCIpXG52YXIgaXNWVGV4dCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12dGV4dC5qc1wiKVxudmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXdpZGdldC5qc1wiKVxudmFyIGhhbmRsZVRodW5rID0gcmVxdWlyZShcIi4uL3Zub2RlL2hhbmRsZS10aHVuay5qc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUVsZW1lbnRcblxuZnVuY3Rpb24gY3JlYXRlRWxlbWVudCh2bm9kZSwgb3B0cykge1xuICAgIHZhciBkb2MgPSBvcHRzID8gb3B0cy5kb2N1bWVudCB8fCBkb2N1bWVudCA6IGRvY3VtZW50XG4gICAgdmFyIHdhcm4gPSBvcHRzID8gb3B0cy53YXJuIDogbnVsbFxuXG4gICAgdm5vZGUgPSBoYW5kbGVUaHVuayh2bm9kZSkuYVxuXG4gICAgaWYgKGlzV2lkZ2V0KHZub2RlKSkge1xuICAgICAgICByZXR1cm4gdm5vZGUuaW5pdCgpXG4gICAgfSBlbHNlIGlmIChpc1ZUZXh0KHZub2RlKSkge1xuICAgICAgICByZXR1cm4gZG9jLmNyZWF0ZVRleHROb2RlKHZub2RlLnRleHQpXG4gICAgfSBlbHNlIGlmICghaXNWTm9kZSh2bm9kZSkpIHtcbiAgICAgICAgaWYgKHdhcm4pIHtcbiAgICAgICAgICAgIHdhcm4oXCJJdGVtIGlzIG5vdCBhIHZhbGlkIHZpcnR1YWwgZG9tIG5vZGVcIiwgdm5vZGUpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICB2YXIgbm9kZSA9ICh2bm9kZS5uYW1lc3BhY2UgPT09IG51bGwpID9cbiAgICAgICAgZG9jLmNyZWF0ZUVsZW1lbnQodm5vZGUudGFnTmFtZSkgOlxuICAgICAgICBkb2MuY3JlYXRlRWxlbWVudE5TKHZub2RlLm5hbWVzcGFjZSwgdm5vZGUudGFnTmFtZSlcblxuICAgIHZhciBwcm9wcyA9IHZub2RlLnByb3BlcnRpZXNcbiAgICBhcHBseVByb3BlcnRpZXMobm9kZSwgcHJvcHMpXG5cbiAgICB2YXIgY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlblxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGROb2RlID0gY3JlYXRlRWxlbWVudChjaGlsZHJlbltpXSwgb3B0cylcbiAgICAgICAgaWYgKGNoaWxkTm9kZSkge1xuICAgICAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChjaGlsZE5vZGUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbm9kZVxufVxuIiwiLy8gTWFwcyBhIHZpcnR1YWwgRE9NIHRyZWUgb250byBhIHJlYWwgRE9NIHRyZWUgaW4gYW4gZWZmaWNpZW50IG1hbm5lci5cbi8vIFdlIGRvbid0IHdhbnQgdG8gcmVhZCBhbGwgb2YgdGhlIERPTSBub2RlcyBpbiB0aGUgdHJlZSBzbyB3ZSB1c2Vcbi8vIHRoZSBpbi1vcmRlciB0cmVlIGluZGV4aW5nIHRvIGVsaW1pbmF0ZSByZWN1cnNpb24gZG93biBjZXJ0YWluIGJyYW5jaGVzLlxuLy8gV2Ugb25seSByZWN1cnNlIGludG8gYSBET00gbm9kZSBpZiB3ZSBrbm93IHRoYXQgaXQgY29udGFpbnMgYSBjaGlsZCBvZlxuLy8gaW50ZXJlc3QuXG5cbnZhciBub0NoaWxkID0ge31cblxubW9kdWxlLmV4cG9ydHMgPSBkb21JbmRleFxuXG5mdW5jdGlvbiBkb21JbmRleChyb290Tm9kZSwgdHJlZSwgaW5kaWNlcywgbm9kZXMpIHtcbiAgICBpZiAoIWluZGljZXMgfHwgaW5kaWNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHt9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaW5kaWNlcy5zb3J0KGFzY2VuZGluZylcbiAgICAgICAgcmV0dXJuIHJlY3Vyc2Uocm9vdE5vZGUsIHRyZWUsIGluZGljZXMsIG5vZGVzLCAwKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVjdXJzZShyb290Tm9kZSwgdHJlZSwgaW5kaWNlcywgbm9kZXMsIHJvb3RJbmRleCkge1xuICAgIG5vZGVzID0gbm9kZXMgfHwge31cblxuXG4gICAgaWYgKHJvb3ROb2RlKSB7XG4gICAgICAgIGlmIChpbmRleEluUmFuZ2UoaW5kaWNlcywgcm9vdEluZGV4LCByb290SW5kZXgpKSB7XG4gICAgICAgICAgICBub2Rlc1tyb290SW5kZXhdID0gcm9vdE5vZGVcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB2Q2hpbGRyZW4gPSB0cmVlLmNoaWxkcmVuXG5cbiAgICAgICAgaWYgKHZDaGlsZHJlbikge1xuXG4gICAgICAgICAgICB2YXIgY2hpbGROb2RlcyA9IHJvb3ROb2RlLmNoaWxkTm9kZXNcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmVlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcm9vdEluZGV4ICs9IDFcblxuICAgICAgICAgICAgICAgIHZhciB2Q2hpbGQgPSB2Q2hpbGRyZW5baV0gfHwgbm9DaGlsZFxuICAgICAgICAgICAgICAgIHZhciBuZXh0SW5kZXggPSByb290SW5kZXggKyAodkNoaWxkLmNvdW50IHx8IDApXG5cbiAgICAgICAgICAgICAgICAvLyBza2lwIHJlY3Vyc2lvbiBkb3duIHRoZSB0cmVlIGlmIHRoZXJlIGFyZSBubyBub2RlcyBkb3duIGhlcmVcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXhJblJhbmdlKGluZGljZXMsIHJvb3RJbmRleCwgbmV4dEluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICByZWN1cnNlKGNoaWxkTm9kZXNbaV0sIHZDaGlsZCwgaW5kaWNlcywgbm9kZXMsIHJvb3RJbmRleClcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByb290SW5kZXggPSBuZXh0SW5kZXhcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBub2Rlc1xufVxuXG4vLyBCaW5hcnkgc2VhcmNoIGZvciBhbiBpbmRleCBpbiB0aGUgaW50ZXJ2YWwgW2xlZnQsIHJpZ2h0XVxuZnVuY3Rpb24gaW5kZXhJblJhbmdlKGluZGljZXMsIGxlZnQsIHJpZ2h0KSB7XG4gICAgaWYgKGluZGljZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHZhciBtaW5JbmRleCA9IDBcbiAgICB2YXIgbWF4SW5kZXggPSBpbmRpY2VzLmxlbmd0aCAtIDFcbiAgICB2YXIgY3VycmVudEluZGV4XG4gICAgdmFyIGN1cnJlbnRJdGVtXG5cbiAgICB3aGlsZSAobWluSW5kZXggPD0gbWF4SW5kZXgpIHtcbiAgICAgICAgY3VycmVudEluZGV4ID0gKChtYXhJbmRleCArIG1pbkluZGV4KSAvIDIpID4+IDBcbiAgICAgICAgY3VycmVudEl0ZW0gPSBpbmRpY2VzW2N1cnJlbnRJbmRleF1cblxuICAgICAgICBpZiAobWluSW5kZXggPT09IG1heEluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudEl0ZW0gPj0gbGVmdCAmJiBjdXJyZW50SXRlbSA8PSByaWdodFxuICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRJdGVtIDwgbGVmdCkge1xuICAgICAgICAgICAgbWluSW5kZXggPSBjdXJyZW50SW5kZXggKyAxXG4gICAgICAgIH0gZWxzZSAgaWYgKGN1cnJlbnRJdGVtID4gcmlnaHQpIHtcbiAgICAgICAgICAgIG1heEluZGV4ID0gY3VycmVudEluZGV4IC0gMVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gYXNjZW5kaW5nKGEsIGIpIHtcbiAgICByZXR1cm4gYSA+IGIgPyAxIDogLTFcbn1cbiIsInZhciBhcHBseVByb3BlcnRpZXMgPSByZXF1aXJlKFwiLi9hcHBseS1wcm9wZXJ0aWVzXCIpXG5cbnZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy13aWRnZXQuanNcIilcbnZhciBWUGF0Y2ggPSByZXF1aXJlKFwiLi4vdm5vZGUvdnBhdGNoLmpzXCIpXG5cbnZhciB1cGRhdGVXaWRnZXQgPSByZXF1aXJlKFwiLi91cGRhdGUtd2lkZ2V0XCIpXG5cbm1vZHVsZS5leHBvcnRzID0gYXBwbHlQYXRjaFxuXG5mdW5jdGlvbiBhcHBseVBhdGNoKHZwYXRjaCwgZG9tTm9kZSwgcmVuZGVyT3B0aW9ucykge1xuICAgIHZhciB0eXBlID0gdnBhdGNoLnR5cGVcbiAgICB2YXIgdk5vZGUgPSB2cGF0Y2gudk5vZGVcbiAgICB2YXIgcGF0Y2ggPSB2cGF0Y2gucGF0Y2hcbmNvbnNvbGUubG9nKHR5cGUsIHBhdGNoKVxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlIFZQYXRjaC5SRU1PVkU6XG4gICAgICAgICAgICByZXR1cm4gcmVtb3ZlTm9kZShkb21Ob2RlLCB2Tm9kZSlcbiAgICAgICAgY2FzZSBWUGF0Y2guSU5TRVJUOlxuICAgICAgICAgICAgcmV0dXJuIGluc2VydE5vZGUoZG9tTm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpXG4gICAgICAgIGNhc2UgVlBhdGNoLlZURVhUOlxuICAgICAgICAgICAgcmV0dXJuIHN0cmluZ1BhdGNoKGRvbU5vZGUsIHZOb2RlLCBwYXRjaCwgcmVuZGVyT3B0aW9ucylcbiAgICAgICAgY2FzZSBWUGF0Y2guV0lER0VUOlxuICAgICAgICAgICAgcmV0dXJuIHdpZGdldFBhdGNoKGRvbU5vZGUsIHZOb2RlLCBwYXRjaCwgcmVuZGVyT3B0aW9ucylcbiAgICAgICAgY2FzZSBWUGF0Y2guVk5PREU6XG4gICAgICAgICAgICByZXR1cm4gdk5vZGVQYXRjaChkb21Ob2RlLCB2Tm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpXG4gICAgICAgIGNhc2UgVlBhdGNoLk9SREVSOlxuICAgICAgICAgICAgcmVvcmRlckNoaWxkcmVuKGRvbU5vZGUsIHBhdGNoKVxuICAgICAgICAgICAgcmV0dXJuIGRvbU5vZGVcbiAgICAgICAgY2FzZSBWUGF0Y2guUFJPUFM6XG4gICAgICAgICAgICBhcHBseVByb3BlcnRpZXMoZG9tTm9kZSwgcGF0Y2gsIHZOb2RlLnByb3BlcnRpZXMpXG4gICAgICAgICAgICByZXR1cm4gZG9tTm9kZVxuICAgICAgICBjYXNlIFZQYXRjaC5USFVOSzpcbiAgICAgICAgICAgIHJldHVybiByZXBsYWNlUm9vdChkb21Ob2RlLFxuICAgICAgICAgICAgICAgIHJlbmRlck9wdGlvbnMucGF0Y2goZG9tTm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpKVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIGRvbU5vZGVcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZU5vZGUoZG9tTm9kZSwgdk5vZGUpIHtcbiAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZVxuXG4gICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChkb21Ob2RlKVxuICAgIH1cblxuICAgIGRlc3Ryb3lXaWRnZXQoZG9tTm9kZSwgdk5vZGUpO1xuXG4gICAgcmV0dXJuIG51bGxcbn1cblxuZnVuY3Rpb24gaW5zZXJ0Tm9kZShwYXJlbnROb2RlLCB2Tm9kZSwgcmVuZGVyT3B0aW9ucykge1xuICAgIHZhciBuZXdOb2RlID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIodk5vZGUsIHJlbmRlck9wdGlvbnMpXG5cbiAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICBwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5ld05vZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcmVudE5vZGVcbn1cblxuZnVuY3Rpb24gc3RyaW5nUGF0Y2goZG9tTm9kZSwgbGVmdFZOb2RlLCB2VGV4dCwgcmVuZGVyT3B0aW9ucykge1xuICAgIHZhciBuZXdOb2RlXG5cbiAgICBpZiAoZG9tTm9kZS5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICBkb21Ob2RlLnJlcGxhY2VEYXRhKDAsIGRvbU5vZGUubGVuZ3RoLCB2VGV4dC50ZXh0KVxuICAgICAgICBuZXdOb2RlID0gZG9tTm9kZVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBwYXJlbnROb2RlID0gZG9tTm9kZS5wYXJlbnROb2RlXG4gICAgICAgIG5ld05vZGUgPSByZW5kZXJPcHRpb25zLnJlbmRlcih2VGV4dCwgcmVuZGVyT3B0aW9ucylcblxuICAgICAgICBpZiAocGFyZW50Tm9kZSAmJiBuZXdOb2RlICE9PSBkb21Ob2RlKSB7XG4gICAgICAgICAgICBwYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdOb2RlLCBkb21Ob2RlKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld05vZGVcbn1cblxuZnVuY3Rpb24gd2lkZ2V0UGF0Y2goZG9tTm9kZSwgbGVmdFZOb2RlLCB3aWRnZXQsIHJlbmRlck9wdGlvbnMpIHtcbiAgICB2YXIgdXBkYXRpbmcgPSB1cGRhdGVXaWRnZXQobGVmdFZOb2RlLCB3aWRnZXQpXG4gICAgdmFyIG5ld05vZGVcblxuICAgIGlmICh1cGRhdGluZykge1xuICAgICAgICBuZXdOb2RlID0gd2lkZ2V0LnVwZGF0ZShsZWZ0Vk5vZGUsIGRvbU5vZGUpIHx8IGRvbU5vZGVcbiAgICB9IGVsc2Uge1xuICAgICAgICBuZXdOb2RlID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIod2lkZ2V0LCByZW5kZXJPcHRpb25zKVxuICAgIH1cblxuICAgIHZhciBwYXJlbnROb2RlID0gZG9tTm9kZS5wYXJlbnROb2RlXG5cbiAgICBpZiAocGFyZW50Tm9kZSAmJiBuZXdOb2RlICE9PSBkb21Ob2RlKSB7XG4gICAgICAgIHBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld05vZGUsIGRvbU5vZGUpXG4gICAgfVxuXG4gICAgaWYgKCF1cGRhdGluZykge1xuICAgICAgICBkZXN0cm95V2lkZ2V0KGRvbU5vZGUsIGxlZnRWTm9kZSlcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3Tm9kZVxufVxuXG5mdW5jdGlvbiB2Tm9kZVBhdGNoKGRvbU5vZGUsIGxlZnRWTm9kZSwgdk5vZGUsIHJlbmRlck9wdGlvbnMpIHtcbiAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZVxuICAgIHZhciBuZXdOb2RlID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIodk5vZGUsIHJlbmRlck9wdGlvbnMpXG5cbiAgICBpZiAocGFyZW50Tm9kZSAmJiBuZXdOb2RlICE9PSBkb21Ob2RlKSB7XG4gICAgICAgIHBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld05vZGUsIGRvbU5vZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld05vZGVcbn1cblxuZnVuY3Rpb24gZGVzdHJveVdpZGdldChkb21Ob2RlLCB3KSB7XG4gICAgaWYgKHR5cGVvZiB3LmRlc3Ryb3kgPT09IFwiZnVuY3Rpb25cIiAmJiBpc1dpZGdldCh3KSkge1xuICAgICAgICB3LmRlc3Ryb3koZG9tTm9kZSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlb3JkZXJDaGlsZHJlbihkb21Ob2RlLCBtb3Zlcykge1xuICAgIHZhciBjaGlsZE5vZGVzID0gZG9tTm9kZS5jaGlsZE5vZGVzXG4gICAgdmFyIGtleU1hcCA9IHt9XG4gICAgdmFyIG5vZGVcbiAgICB2YXIgcmVtb3ZlXG4gICAgdmFyIGluc2VydFxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3Zlcy5yZW1vdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJlbW92ZSA9IG1vdmVzLnJlbW92ZXNbaV1cbiAgICAgICAgbm9kZSA9IGNoaWxkTm9kZXNbcmVtb3ZlLmZyb21dXG4gICAgICAgIGlmIChyZW1vdmUua2V5KSB7XG4gICAgICAgICAgICBrZXlNYXBbcmVtb3ZlLmtleV0gPSBub2RlXG4gICAgICAgIH1cbiAgICAgICAgZG9tTm9kZS5yZW1vdmVDaGlsZChub2RlKVxuICAgIH1cblxuICAgIHZhciBsZW5ndGggPSBjaGlsZE5vZGVzLmxlbmd0aFxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgbW92ZXMuaW5zZXJ0cy5sZW5ndGg7IGorKykge1xuICAgICAgICBpbnNlcnQgPSBtb3Zlcy5pbnNlcnRzW2pdXG4gICAgICAgIG5vZGUgPSBrZXlNYXBbaW5zZXJ0LmtleV1cbiAgICAgICAgLy8gdGhpcyBpcyB0aGUgd2VpcmRlc3QgYnVnIGkndmUgZXZlciBzZWVuIGluIHdlYmtpdFxuICAgICAgICBkb21Ob2RlLmluc2VydEJlZm9yZShub2RlLCBpbnNlcnQudG8gPj0gbGVuZ3RoKysgPyBudWxsIDogY2hpbGROb2Rlc1tpbnNlcnQudG9dKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVwbGFjZVJvb3Qob2xkUm9vdCwgbmV3Um9vdCkge1xuICAgIGlmIChvbGRSb290ICYmIG5ld1Jvb3QgJiYgb2xkUm9vdCAhPT0gbmV3Um9vdCAmJiBvbGRSb290LnBhcmVudE5vZGUpIHtcbiAgICAgICAgb2xkUm9vdC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdSb290LCBvbGRSb290KVxuICAgIH1cblxuICAgIHJldHVybiBuZXdSb290O1xufVxuIiwidmFyIGRvY3VtZW50ID0gcmVxdWlyZShcImdsb2JhbC9kb2N1bWVudFwiKVxudmFyIGlzQXJyYXkgPSByZXF1aXJlKFwieC1pcy1hcnJheVwiKVxuXG52YXIgcmVuZGVyID0gcmVxdWlyZShcIi4vY3JlYXRlLWVsZW1lbnRcIilcbnZhciBkb21JbmRleCA9IHJlcXVpcmUoXCIuL2RvbS1pbmRleFwiKVxudmFyIHBhdGNoT3AgPSByZXF1aXJlKFwiLi9wYXRjaC1vcFwiKVxubW9kdWxlLmV4cG9ydHMgPSBwYXRjaFxuXG5mdW5jdGlvbiBwYXRjaChyb290Tm9kZSwgcGF0Y2hlcywgcmVuZGVyT3B0aW9ucykge1xuICAgIHJlbmRlck9wdGlvbnMgPSByZW5kZXJPcHRpb25zIHx8IHt9XG4gICAgcmVuZGVyT3B0aW9ucy5wYXRjaCA9IHJlbmRlck9wdGlvbnMucGF0Y2ggJiYgcmVuZGVyT3B0aW9ucy5wYXRjaCAhPT0gcGF0Y2hcbiAgICAgICAgPyByZW5kZXJPcHRpb25zLnBhdGNoXG4gICAgICAgIDogcGF0Y2hSZWN1cnNpdmVcbiAgICByZW5kZXJPcHRpb25zLnJlbmRlciA9IHJlbmRlck9wdGlvbnMucmVuZGVyIHx8IHJlbmRlclxuXG4gICAgcmV0dXJuIHJlbmRlck9wdGlvbnMucGF0Y2gocm9vdE5vZGUsIHBhdGNoZXMsIHJlbmRlck9wdGlvbnMpXG59XG5cbmZ1bmN0aW9uIHBhdGNoUmVjdXJzaXZlKHJvb3ROb2RlLCBwYXRjaGVzLCByZW5kZXJPcHRpb25zKSB7XG4gICAgdmFyIGluZGljZXMgPSBwYXRjaEluZGljZXMocGF0Y2hlcylcblxuICAgIGlmIChpbmRpY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gcm9vdE5vZGVcbiAgICB9XG5cbiAgICB2YXIgaW5kZXggPSBkb21JbmRleChyb290Tm9kZSwgcGF0Y2hlcy5hLCBpbmRpY2VzKVxuICAgIHZhciBvd25lckRvY3VtZW50ID0gcm9vdE5vZGUub3duZXJEb2N1bWVudFxuXG4gICAgaWYgKCFyZW5kZXJPcHRpb25zLmRvY3VtZW50ICYmIG93bmVyRG9jdW1lbnQgIT09IGRvY3VtZW50KSB7XG4gICAgICAgIHJlbmRlck9wdGlvbnMuZG9jdW1lbnQgPSBvd25lckRvY3VtZW50XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbmRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBub2RlSW5kZXggPSBpbmRpY2VzW2ldXG4gICAgICAgIHJvb3ROb2RlID0gYXBwbHlQYXRjaChyb290Tm9kZSxcbiAgICAgICAgICAgIGluZGV4W25vZGVJbmRleF0sXG4gICAgICAgICAgICBwYXRjaGVzW25vZGVJbmRleF0sXG4gICAgICAgICAgICByZW5kZXJPcHRpb25zKVxuICAgIH1cblxuICAgIHJldHVybiByb290Tm9kZVxufVxuXG5mdW5jdGlvbiBhcHBseVBhdGNoKHJvb3ROb2RlLCBkb21Ob2RlLCBwYXRjaExpc3QsIHJlbmRlck9wdGlvbnMpIHtcbiAgICBpZiAoIWRvbU5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHJvb3ROb2RlXG4gICAgfVxuXG4gICAgdmFyIG5ld05vZGVcblxuICAgIGlmIChpc0FycmF5KHBhdGNoTGlzdCkpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRjaExpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5ld05vZGUgPSBwYXRjaE9wKHBhdGNoTGlzdFtpXSwgZG9tTm9kZSwgcmVuZGVyT3B0aW9ucylcblxuICAgICAgICAgICAgaWYgKGRvbU5vZGUgPT09IHJvb3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgcm9vdE5vZGUgPSBuZXdOb2RlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBuZXdOb2RlID0gcGF0Y2hPcChwYXRjaExpc3QsIGRvbU5vZGUsIHJlbmRlck9wdGlvbnMpXG5cbiAgICAgICAgaWYgKGRvbU5vZGUgPT09IHJvb3ROb2RlKSB7XG4gICAgICAgICAgICByb290Tm9kZSA9IG5ld05vZGVcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByb290Tm9kZVxufVxuXG5mdW5jdGlvbiBwYXRjaEluZGljZXMocGF0Y2hlcykge1xuICAgIHZhciBpbmRpY2VzID0gW11cblxuICAgIGZvciAodmFyIGtleSBpbiBwYXRjaGVzKSB7XG4gICAgICAgIGlmIChrZXkgIT09IFwiYVwiKSB7XG4gICAgICAgICAgICBpbmRpY2VzLnB1c2goTnVtYmVyKGtleSkpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW5kaWNlc1xufVxuIiwidmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXdpZGdldC5qc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHVwZGF0ZVdpZGdldFxuXG5mdW5jdGlvbiB1cGRhdGVXaWRnZXQoYSwgYikge1xuICAgIGlmIChpc1dpZGdldChhKSAmJiBpc1dpZGdldChiKSkge1xuICAgICAgICBpZiAoXCJuYW1lXCIgaW4gYSAmJiBcIm5hbWVcIiBpbiBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYS5pZCA9PT0gYi5pZFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGEuaW5pdCA9PT0gYi5pbml0XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2Vcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEV2U3RvcmUgPSByZXF1aXJlKCdldi1zdG9yZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2SG9vaztcblxuZnVuY3Rpb24gRXZIb29rKHZhbHVlKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEV2SG9vaykpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFdkhvb2sodmFsdWUpO1xuICAgIH1cblxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn1cblxuRXZIb29rLnByb3RvdHlwZS5ob29rID0gZnVuY3Rpb24gKG5vZGUsIHByb3BlcnR5TmFtZSkge1xuICAgIHZhciBlcyA9IEV2U3RvcmUobm9kZSk7XG4gICAgdmFyIHByb3BOYW1lID0gcHJvcGVydHlOYW1lLnN1YnN0cigzKTtcblxuICAgIGVzW3Byb3BOYW1lXSA9IHRoaXMudmFsdWU7XG59O1xuXG5Fdkhvb2sucHJvdG90eXBlLnVuaG9vayA9IGZ1bmN0aW9uKG5vZGUsIHByb3BlcnR5TmFtZSkge1xuICAgIHZhciBlcyA9IEV2U3RvcmUobm9kZSk7XG4gICAgdmFyIHByb3BOYW1lID0gcHJvcGVydHlOYW1lLnN1YnN0cigzKTtcblxuICAgIGVzW3Byb3BOYW1lXSA9IHVuZGVmaW5lZDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gU29mdFNldEhvb2s7XG5cbmZ1bmN0aW9uIFNvZnRTZXRIb29rKHZhbHVlKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNvZnRTZXRIb29rKSkge1xuICAgICAgICByZXR1cm4gbmV3IFNvZnRTZXRIb29rKHZhbHVlKTtcbiAgICB9XG5cbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG59XG5cblNvZnRTZXRIb29rLnByb3RvdHlwZS5ob29rID0gZnVuY3Rpb24gKG5vZGUsIHByb3BlcnR5TmFtZSkge1xuICAgIGlmIChub2RlW3Byb3BlcnR5TmFtZV0gIT09IHRoaXMudmFsdWUpIHtcbiAgICAgICAgbm9kZVtwcm9wZXJ0eU5hbWVdID0gdGhpcy52YWx1ZTtcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ3gtaXMtYXJyYXknKTtcblxudmFyIFZOb2RlID0gcmVxdWlyZSgnLi4vdm5vZGUvdm5vZGUuanMnKTtcbnZhciBWVGV4dCA9IHJlcXVpcmUoJy4uL3Zub2RlL3Z0ZXh0LmpzJyk7XG52YXIgaXNWTm9kZSA9IHJlcXVpcmUoJy4uL3Zub2RlL2lzLXZub2RlJyk7XG52YXIgaXNWVGV4dCA9IHJlcXVpcmUoJy4uL3Zub2RlL2lzLXZ0ZXh0Jyk7XG52YXIgaXNXaWRnZXQgPSByZXF1aXJlKCcuLi92bm9kZS9pcy13aWRnZXQnKTtcbnZhciBpc0hvb2sgPSByZXF1aXJlKCcuLi92bm9kZS9pcy12aG9vaycpO1xudmFyIGlzVlRodW5rID0gcmVxdWlyZSgnLi4vdm5vZGUvaXMtdGh1bmsnKTtcblxudmFyIHBhcnNlVGFnID0gcmVxdWlyZSgnLi9wYXJzZS10YWcuanMnKTtcbnZhciBzb2Z0U2V0SG9vayA9IHJlcXVpcmUoJy4vaG9va3Mvc29mdC1zZXQtaG9vay5qcycpO1xudmFyIGV2SG9vayA9IHJlcXVpcmUoJy4vaG9va3MvZXYtaG9vay5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGg7XG5cbmZ1bmN0aW9uIGgodGFnTmFtZSwgcHJvcGVydGllcywgY2hpbGRyZW4pIHtcbiAgICB2YXIgY2hpbGROb2RlcyA9IFtdO1xuICAgIHZhciB0YWcsIHByb3BzLCBrZXksIG5hbWVzcGFjZTtcblxuICAgIGlmICghY2hpbGRyZW4gJiYgaXNDaGlsZHJlbihwcm9wZXJ0aWVzKSkge1xuICAgICAgICBjaGlsZHJlbiA9IHByb3BlcnRpZXM7XG4gICAgICAgIHByb3BzID0ge307XG4gICAgfVxuXG4gICAgcHJvcHMgPSBwcm9wcyB8fCBwcm9wZXJ0aWVzIHx8IHt9O1xuICAgIHRhZyA9IHBhcnNlVGFnKHRhZ05hbWUsIHByb3BzKTtcblxuICAgIC8vIHN1cHBvcnQga2V5c1xuICAgIGlmIChwcm9wcy5oYXNPd25Qcm9wZXJ0eSgna2V5JykpIHtcbiAgICAgICAga2V5ID0gcHJvcHMua2V5O1xuICAgICAgICBwcm9wcy5rZXkgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8gc3VwcG9ydCBuYW1lc3BhY2VcbiAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkoJ25hbWVzcGFjZScpKSB7XG4gICAgICAgIG5hbWVzcGFjZSA9IHByb3BzLm5hbWVzcGFjZTtcbiAgICAgICAgcHJvcHMubmFtZXNwYWNlID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIGZpeCBjdXJzb3IgYnVnXG4gICAgaWYgKHRhZyA9PT0gJ0lOUFVUJyAmJlxuICAgICAgICAhbmFtZXNwYWNlICYmXG4gICAgICAgIHByb3BzLmhhc093blByb3BlcnR5KCd2YWx1ZScpICYmXG4gICAgICAgIHByb3BzLnZhbHVlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgIWlzSG9vayhwcm9wcy52YWx1ZSlcbiAgICApIHtcbiAgICAgICAgcHJvcHMudmFsdWUgPSBzb2Z0U2V0SG9vayhwcm9wcy52YWx1ZSk7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtUHJvcGVydGllcyhwcm9wcyk7XG5cbiAgICBpZiAoY2hpbGRyZW4gIT09IHVuZGVmaW5lZCAmJiBjaGlsZHJlbiAhPT0gbnVsbCkge1xuICAgICAgICBhZGRDaGlsZChjaGlsZHJlbiwgY2hpbGROb2RlcywgdGFnLCBwcm9wcyk7XG4gICAgfVxuXG5cbiAgICByZXR1cm4gbmV3IFZOb2RlKHRhZywgcHJvcHMsIGNoaWxkTm9kZXMsIGtleSwgbmFtZXNwYWNlKTtcbn1cblxuZnVuY3Rpb24gYWRkQ2hpbGQoYywgY2hpbGROb2RlcywgdGFnLCBwcm9wcykge1xuICAgIGlmICh0eXBlb2YgYyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY2hpbGROb2Rlcy5wdXNoKG5ldyBWVGV4dChjKSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYyA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgY2hpbGROb2Rlcy5wdXNoKG5ldyBWVGV4dChTdHJpbmcoYykpKTtcbiAgICB9IGVsc2UgaWYgKGlzQ2hpbGQoYykpIHtcbiAgICAgICAgY2hpbGROb2Rlcy5wdXNoKGMpO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShjKSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFkZENoaWxkKGNbaV0sIGNoaWxkTm9kZXMsIHRhZywgcHJvcHMpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChjID09PSBudWxsIHx8IGMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgVW5leHBlY3RlZFZpcnR1YWxFbGVtZW50KHtcbiAgICAgICAgICAgIGZvcmVpZ25PYmplY3Q6IGMsXG4gICAgICAgICAgICBwYXJlbnRWbm9kZToge1xuICAgICAgICAgICAgICAgIHRhZ05hbWU6IHRhZyxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBwcm9wc1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyYW5zZm9ybVByb3BlcnRpZXMocHJvcHMpIHtcbiAgICBmb3IgKHZhciBwcm9wTmFtZSBpbiBwcm9wcykge1xuICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkocHJvcE5hbWUpKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBwcm9wc1twcm9wTmFtZV07XG5cbiAgICAgICAgICAgIGlmIChpc0hvb2sodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwcm9wTmFtZS5zdWJzdHIoMCwgMykgPT09ICdldi0nKSB7XG4gICAgICAgICAgICAgICAgLy8gYWRkIGV2LWZvbyBzdXBwb3J0XG4gICAgICAgICAgICAgICAgcHJvcHNbcHJvcE5hbWVdID0gZXZIb29rKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNDaGlsZCh4KSB7XG4gICAgcmV0dXJuIGlzVk5vZGUoeCkgfHwgaXNWVGV4dCh4KSB8fCBpc1dpZGdldCh4KSB8fCBpc1ZUaHVuayh4KTtcbn1cblxuZnVuY3Rpb24gaXNDaGlsZHJlbih4KSB7XG4gICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnc3RyaW5nJyB8fCBpc0FycmF5KHgpIHx8IGlzQ2hpbGQoeCk7XG59XG5cbmZ1bmN0aW9uIFVuZXhwZWN0ZWRWaXJ0dWFsRWxlbWVudChkYXRhKSB7XG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuXG4gICAgZXJyLnR5cGUgPSAndmlydHVhbC1oeXBlcnNjcmlwdC51bmV4cGVjdGVkLnZpcnR1YWwtZWxlbWVudCc7XG4gICAgZXJyLm1lc3NhZ2UgPSAnVW5leHBlY3RlZCB2aXJ0dWFsIGNoaWxkIHBhc3NlZCB0byBoKCkuXFxuJyArXG4gICAgICAgICdFeHBlY3RlZCBhIFZOb2RlIC8gVnRodW5rIC8gVldpZGdldCAvIHN0cmluZyBidXQ6XFxuJyArXG4gICAgICAgICdnb3Q6XFxuJyArXG4gICAgICAgIGVycm9yU3RyaW5nKGRhdGEuZm9yZWlnbk9iamVjdCkgK1xuICAgICAgICAnLlxcbicgK1xuICAgICAgICAnVGhlIHBhcmVudCB2bm9kZSBpczpcXG4nICtcbiAgICAgICAgZXJyb3JTdHJpbmcoZGF0YS5wYXJlbnRWbm9kZSlcbiAgICAgICAgJ1xcbicgK1xuICAgICAgICAnU3VnZ2VzdGVkIGZpeDogY2hhbmdlIHlvdXIgYGgoLi4uLCBbIC4uLiBdKWAgY2FsbHNpdGUuJztcbiAgICBlcnIuZm9yZWlnbk9iamVjdCA9IGRhdGEuZm9yZWlnbk9iamVjdDtcbiAgICBlcnIucGFyZW50Vm5vZGUgPSBkYXRhLnBhcmVudFZub2RlO1xuXG4gICAgcmV0dXJuIGVycjtcbn1cblxuZnVuY3Rpb24gZXJyb3JTdHJpbmcob2JqKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgJyAgICAnKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBTdHJpbmcob2JqKTtcbiAgICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzcGxpdCA9IHJlcXVpcmUoJ2Jyb3dzZXItc3BsaXQnKTtcblxudmFyIGNsYXNzSWRTcGxpdCA9IC8oW1xcLiNdP1thLXpBLVowLTlcXHUwMDdGLVxcdUZGRkZfOi1dKykvO1xudmFyIG5vdENsYXNzSWQgPSAvXlxcLnwjLztcblxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZVRhZztcblxuZnVuY3Rpb24gcGFyc2VUYWcodGFnLCBwcm9wcykge1xuICAgIGlmICghdGFnKSB7XG4gICAgICAgIHJldHVybiAnRElWJztcbiAgICB9XG5cbiAgICB2YXIgbm9JZCA9ICEocHJvcHMuaGFzT3duUHJvcGVydHkoJ2lkJykpO1xuXG4gICAgdmFyIHRhZ1BhcnRzID0gc3BsaXQodGFnLCBjbGFzc0lkU3BsaXQpO1xuICAgIHZhciB0YWdOYW1lID0gbnVsbDtcblxuICAgIGlmIChub3RDbGFzc0lkLnRlc3QodGFnUGFydHNbMV0pKSB7XG4gICAgICAgIHRhZ05hbWUgPSAnRElWJztcbiAgICB9XG5cbiAgICB2YXIgY2xhc3NlcywgcGFydCwgdHlwZSwgaTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCB0YWdQYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBwYXJ0ID0gdGFnUGFydHNbaV07XG5cbiAgICAgICAgaWYgKCFwYXJ0KSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHR5cGUgPSBwYXJ0LmNoYXJBdCgwKTtcblxuICAgICAgICBpZiAoIXRhZ05hbWUpIHtcbiAgICAgICAgICAgIHRhZ05hbWUgPSBwYXJ0O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICcuJykge1xuICAgICAgICAgICAgY2xhc3NlcyA9IGNsYXNzZXMgfHwgW107XG4gICAgICAgICAgICBjbGFzc2VzLnB1c2gocGFydC5zdWJzdHJpbmcoMSwgcGFydC5sZW5ndGgpKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnIycgJiYgbm9JZCkge1xuICAgICAgICAgICAgcHJvcHMuaWQgPSBwYXJ0LnN1YnN0cmluZygxLCBwYXJ0Lmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY2xhc3Nlcykge1xuICAgICAgICBpZiAocHJvcHMuY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICBjbGFzc2VzLnB1c2gocHJvcHMuY2xhc3NOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BzLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbignICcpO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9wcy5uYW1lc3BhY2UgPyB0YWdOYW1lIDogdGFnTmFtZS50b1VwcGVyQ2FzZSgpO1xufVxuIiwidmFyIGlzVk5vZGUgPSByZXF1aXJlKFwiLi9pcy12bm9kZVwiKVxudmFyIGlzVlRleHQgPSByZXF1aXJlKFwiLi9pcy12dGV4dFwiKVxudmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4vaXMtd2lkZ2V0XCIpXG52YXIgaXNUaHVuayA9IHJlcXVpcmUoXCIuL2lzLXRodW5rXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gaGFuZGxlVGh1bmtcblxuZnVuY3Rpb24gaGFuZGxlVGh1bmsoYSwgYikge1xuICAgIHZhciByZW5kZXJlZEEgPSBhXG4gICAgdmFyIHJlbmRlcmVkQiA9IGJcblxuICAgIGlmIChpc1RodW5rKGIpKSB7XG4gICAgICAgIHJlbmRlcmVkQiA9IHJlbmRlclRodW5rKGIsIGEpXG4gICAgfVxuXG4gICAgaWYgKGlzVGh1bmsoYSkpIHtcbiAgICAgICAgcmVuZGVyZWRBID0gcmVuZGVyVGh1bmsoYSwgbnVsbClcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhOiByZW5kZXJlZEEsXG4gICAgICAgIGI6IHJlbmRlcmVkQlxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyVGh1bmsodGh1bmssIHByZXZpb3VzKSB7XG4gICAgdmFyIHJlbmRlcmVkVGh1bmsgPSB0aHVuay52bm9kZVxuXG4gICAgaWYgKCFyZW5kZXJlZFRodW5rKSB7XG4gICAgICAgIHJlbmRlcmVkVGh1bmsgPSB0aHVuay52bm9kZSA9IHRodW5rLnJlbmRlcihwcmV2aW91cylcbiAgICB9XG5cbiAgICBpZiAoIShpc1ZOb2RlKHJlbmRlcmVkVGh1bmspIHx8XG4gICAgICAgICAgICBpc1ZUZXh0KHJlbmRlcmVkVGh1bmspIHx8XG4gICAgICAgICAgICBpc1dpZGdldChyZW5kZXJlZFRodW5rKSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidGh1bmsgZGlkIG5vdCByZXR1cm4gYSB2YWxpZCBub2RlXCIpO1xuICAgIH1cblxuICAgIHJldHVybiByZW5kZXJlZFRodW5rXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGlzVGh1bmtcclxuXHJcbmZ1bmN0aW9uIGlzVGh1bmsodCkge1xyXG4gICAgcmV0dXJuIHQgJiYgdC50eXBlID09PSBcIlRodW5rXCJcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGlzSG9va1xuXG5mdW5jdGlvbiBpc0hvb2soaG9vaykge1xuICAgIHJldHVybiBob29rICYmXG4gICAgICAodHlwZW9mIGhvb2suaG9vayA9PT0gXCJmdW5jdGlvblwiICYmICFob29rLmhhc093blByb3BlcnR5KFwiaG9va1wiKSB8fFxuICAgICAgIHR5cGVvZiBob29rLnVuaG9vayA9PT0gXCJmdW5jdGlvblwiICYmICFob29rLmhhc093blByb3BlcnR5KFwidW5ob29rXCIpKVxufVxuIiwidmFyIHZlcnNpb24gPSByZXF1aXJlKFwiLi92ZXJzaW9uXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gaXNWaXJ0dWFsTm9kZVxuXG5mdW5jdGlvbiBpc1ZpcnR1YWxOb2RlKHgpIHtcbiAgICByZXR1cm4geCAmJiB4LnR5cGUgPT09IFwiVmlydHVhbE5vZGVcIiAmJiB4LnZlcnNpb24gPT09IHZlcnNpb25cbn1cbiIsInZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzVmlydHVhbFRleHRcblxuZnVuY3Rpb24gaXNWaXJ0dWFsVGV4dCh4KSB7XG4gICAgcmV0dXJuIHggJiYgeC50eXBlID09PSBcIlZpcnR1YWxUZXh0XCIgJiYgeC52ZXJzaW9uID09PSB2ZXJzaW9uXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGlzV2lkZ2V0XG5cbmZ1bmN0aW9uIGlzV2lkZ2V0KHcpIHtcbiAgICByZXR1cm4gdyAmJiB3LnR5cGUgPT09IFwiV2lkZ2V0XCJcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gXCIyXCJcbiIsInZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKVxudmFyIGlzVk5vZGUgPSByZXF1aXJlKFwiLi9pcy12bm9kZVwiKVxudmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4vaXMtd2lkZ2V0XCIpXG52YXIgaXNUaHVuayA9IHJlcXVpcmUoXCIuL2lzLXRodW5rXCIpXG52YXIgaXNWSG9vayA9IHJlcXVpcmUoXCIuL2lzLXZob29rXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gVmlydHVhbE5vZGVcblxudmFyIG5vUHJvcGVydGllcyA9IHt9XG52YXIgbm9DaGlsZHJlbiA9IFtdXG5cbmZ1bmN0aW9uIFZpcnR1YWxOb2RlKHRhZ05hbWUsIHByb3BlcnRpZXMsIGNoaWxkcmVuLCBrZXksIG5hbWVzcGFjZSkge1xuICAgIHRoaXMudGFnTmFtZSA9IHRhZ05hbWVcbiAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzIHx8IG5vUHJvcGVydGllc1xuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbiB8fCBub0NoaWxkcmVuXG4gICAgdGhpcy5rZXkgPSBrZXkgIT0gbnVsbCA/IFN0cmluZyhrZXkpIDogdW5kZWZpbmVkXG4gICAgdGhpcy5uYW1lc3BhY2UgPSAodHlwZW9mIG5hbWVzcGFjZSA9PT0gXCJzdHJpbmdcIikgPyBuYW1lc3BhY2UgOiBudWxsXG5cbiAgICB2YXIgY291bnQgPSAoY2hpbGRyZW4gJiYgY2hpbGRyZW4ubGVuZ3RoKSB8fCAwXG4gICAgdmFyIGRlc2NlbmRhbnRzID0gMFxuICAgIHZhciBoYXNXaWRnZXRzID0gZmFsc2VcbiAgICB2YXIgaGFzVGh1bmtzID0gZmFsc2VcbiAgICB2YXIgZGVzY2VuZGFudEhvb2tzID0gZmFsc2VcbiAgICB2YXIgaG9va3NcblxuICAgIGZvciAodmFyIHByb3BOYW1lIGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgaWYgKHByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkocHJvcE5hbWUpKSB7XG4gICAgICAgICAgICB2YXIgcHJvcGVydHkgPSBwcm9wZXJ0aWVzW3Byb3BOYW1lXVxuICAgICAgICAgICAgaWYgKGlzVkhvb2socHJvcGVydHkpICYmIHByb3BlcnR5LnVuaG9vaykge1xuICAgICAgICAgICAgICAgIGlmICghaG9va3MpIHtcbiAgICAgICAgICAgICAgICAgICAgaG9va3MgPSB7fVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGhvb2tzW3Byb3BOYW1lXSA9IHByb3BlcnR5XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICAgICAgaWYgKGlzVk5vZGUoY2hpbGQpKSB7XG4gICAgICAgICAgICBkZXNjZW5kYW50cyArPSBjaGlsZC5jb3VudCB8fCAwXG5cbiAgICAgICAgICAgIGlmICghaGFzV2lkZ2V0cyAmJiBjaGlsZC5oYXNXaWRnZXRzKSB7XG4gICAgICAgICAgICAgICAgaGFzV2lkZ2V0cyA9IHRydWVcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFoYXNUaHVua3MgJiYgY2hpbGQuaGFzVGh1bmtzKSB7XG4gICAgICAgICAgICAgICAgaGFzVGh1bmtzID0gdHJ1ZVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWRlc2NlbmRhbnRIb29rcyAmJiAoY2hpbGQuaG9va3MgfHwgY2hpbGQuZGVzY2VuZGFudEhvb2tzKSkge1xuICAgICAgICAgICAgICAgIGRlc2NlbmRhbnRIb29rcyA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghaGFzV2lkZ2V0cyAmJiBpc1dpZGdldChjaGlsZCkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2hpbGQuZGVzdHJveSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgaGFzV2lkZ2V0cyA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghaGFzVGh1bmtzICYmIGlzVGh1bmsoY2hpbGQpKSB7XG4gICAgICAgICAgICBoYXNUaHVua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jb3VudCA9IGNvdW50ICsgZGVzY2VuZGFudHNcbiAgICB0aGlzLmhhc1dpZGdldHMgPSBoYXNXaWRnZXRzXG4gICAgdGhpcy5oYXNUaHVua3MgPSBoYXNUaHVua3NcbiAgICB0aGlzLmhvb2tzID0gaG9va3NcbiAgICB0aGlzLmRlc2NlbmRhbnRIb29rcyA9IGRlc2NlbmRhbnRIb29rc1xufVxuXG5WaXJ0dWFsTm9kZS5wcm90b3R5cGUudmVyc2lvbiA9IHZlcnNpb25cblZpcnR1YWxOb2RlLnByb3RvdHlwZS50eXBlID0gXCJWaXJ0dWFsTm9kZVwiXG4iLCJ2YXIgdmVyc2lvbiA9IHJlcXVpcmUoXCIuL3ZlcnNpb25cIilcblxuVmlydHVhbFBhdGNoLk5PTkUgPSAwXG5WaXJ0dWFsUGF0Y2guVlRFWFQgPSAxXG5WaXJ0dWFsUGF0Y2guVk5PREUgPSAyXG5WaXJ0dWFsUGF0Y2guV0lER0VUID0gM1xuVmlydHVhbFBhdGNoLlBST1BTID0gNFxuVmlydHVhbFBhdGNoLk9SREVSID0gNVxuVmlydHVhbFBhdGNoLklOU0VSVCA9IDZcblZpcnR1YWxQYXRjaC5SRU1PVkUgPSA3XG5WaXJ0dWFsUGF0Y2guVEhVTksgPSA4XG5cbm1vZHVsZS5leHBvcnRzID0gVmlydHVhbFBhdGNoXG5cbmZ1bmN0aW9uIFZpcnR1YWxQYXRjaCh0eXBlLCB2Tm9kZSwgcGF0Y2gpIHtcbiAgICB0aGlzLnR5cGUgPSBOdW1iZXIodHlwZSlcbiAgICB0aGlzLnZOb2RlID0gdk5vZGVcbiAgICB0aGlzLnBhdGNoID0gcGF0Y2hcbn1cblxuVmlydHVhbFBhdGNoLnByb3RvdHlwZS52ZXJzaW9uID0gdmVyc2lvblxuVmlydHVhbFBhdGNoLnByb3RvdHlwZS50eXBlID0gXCJWaXJ0dWFsUGF0Y2hcIlxuIiwidmFyIHZlcnNpb24gPSByZXF1aXJlKFwiLi92ZXJzaW9uXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gVmlydHVhbFRleHRcblxuZnVuY3Rpb24gVmlydHVhbFRleHQodGV4dCkge1xuICAgIHRoaXMudGV4dCA9IFN0cmluZyh0ZXh0KVxufVxuXG5WaXJ0dWFsVGV4dC5wcm90b3R5cGUudmVyc2lvbiA9IHZlcnNpb25cblZpcnR1YWxUZXh0LnByb3RvdHlwZS50eXBlID0gXCJWaXJ0dWFsVGV4dFwiXG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKFwiaXMtb2JqZWN0XCIpXG52YXIgaXNIb29rID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZob29rXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gZGlmZlByb3BzXG5cbmZ1bmN0aW9uIGRpZmZQcm9wcyhhLCBiKSB7XG4gICAgdmFyIGRpZmZcblxuICAgIGZvciAodmFyIGFLZXkgaW4gYSkge1xuICAgICAgICBpZiAoIShhS2V5IGluIGIpKSB7XG4gICAgICAgICAgICBkaWZmID0gZGlmZiB8fCB7fVxuICAgICAgICAgICAgZGlmZlthS2V5XSA9IHVuZGVmaW5lZFxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFWYWx1ZSA9IGFbYUtleV1cbiAgICAgICAgdmFyIGJWYWx1ZSA9IGJbYUtleV1cblxuICAgICAgICBpZiAoYVZhbHVlID09PSBiVmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaXNPYmplY3QoYVZhbHVlKSAmJiBpc09iamVjdChiVmFsdWUpKSB7XG4gICAgICAgICAgICBpZiAoZ2V0UHJvdG90eXBlKGJWYWx1ZSkgIT09IGdldFByb3RvdHlwZShhVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge31cbiAgICAgICAgICAgICAgICBkaWZmW2FLZXldID0gYlZhbHVlXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzSG9vayhiVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9XG4gICAgICAgICAgICAgICAgIGRpZmZbYUtleV0gPSBiVmFsdWVcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIG9iamVjdERpZmYgPSBkaWZmUHJvcHMoYVZhbHVlLCBiVmFsdWUpXG4gICAgICAgICAgICAgICAgaWYgKG9iamVjdERpZmYpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge31cbiAgICAgICAgICAgICAgICAgICAgZGlmZlthS2V5XSA9IG9iamVjdERpZmZcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkaWZmID0gZGlmZiB8fCB7fVxuICAgICAgICAgICAgZGlmZlthS2V5XSA9IGJWYWx1ZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgYktleSBpbiBiKSB7XG4gICAgICAgIGlmICghKGJLZXkgaW4gYSkpIHtcbiAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9XG4gICAgICAgICAgICBkaWZmW2JLZXldID0gYltiS2V5XVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRpZmZcbn1cblxuZnVuY3Rpb24gZ2V0UHJvdG90eXBlKHZhbHVlKSB7XG4gIGlmIChPYmplY3QuZ2V0UHJvdG90eXBlT2YpIHtcbiAgICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKHZhbHVlKVxuICB9IGVsc2UgaWYgKHZhbHVlLl9fcHJvdG9fXykge1xuICAgIHJldHVybiB2YWx1ZS5fX3Byb3RvX19cbiAgfSBlbHNlIGlmICh2YWx1ZS5jb25zdHJ1Y3Rvcikge1xuICAgIHJldHVybiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGVcbiAgfVxufVxuIiwidmFyIGlzQXJyYXkgPSByZXF1aXJlKFwieC1pcy1hcnJheVwiKVxuXG52YXIgVlBhdGNoID0gcmVxdWlyZShcIi4uL3Zub2RlL3ZwYXRjaFwiKVxudmFyIGlzVk5vZGUgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdm5vZGVcIilcbnZhciBpc1ZUZXh0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZ0ZXh0XCIpXG52YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtd2lkZ2V0XCIpXG52YXIgaXNUaHVuayA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy10aHVua1wiKVxudmFyIGhhbmRsZVRodW5rID0gcmVxdWlyZShcIi4uL3Zub2RlL2hhbmRsZS10aHVua1wiKVxuXG52YXIgZGlmZlByb3BzID0gcmVxdWlyZShcIi4vZGlmZi1wcm9wc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRpZmZcblxuZnVuY3Rpb24gZGlmZihhLCBiKSB7XG4gICAgdmFyIHBhdGNoID0geyBhOiBhIH1cbiAgICB3YWxrKGEsIGIsIHBhdGNoLCAwKVxuICAgIHJldHVybiBwYXRjaFxufVxuXG5mdW5jdGlvbiB3YWxrKGEsIGIsIHBhdGNoLCBpbmRleCkge1xuICAgIGlmIChhID09PSBiKSB7XG4gICAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHZhciBhcHBseSA9IHBhdGNoW2luZGV4XVxuICAgIHZhciBhcHBseUNsZWFyID0gZmFsc2VcblxuICAgIGlmIChpc1RodW5rKGEpIHx8IGlzVGh1bmsoYikpIHtcbiAgICAgICAgdGh1bmtzKGEsIGIsIHBhdGNoLCBpbmRleClcbiAgICB9IGVsc2UgaWYgKGIgPT0gbnVsbCkge1xuXG4gICAgICAgIC8vIElmIGEgaXMgYSB3aWRnZXQgd2Ugd2lsbCBhZGQgYSByZW1vdmUgcGF0Y2ggZm9yIGl0XG4gICAgICAgIC8vIE90aGVyd2lzZSBhbnkgY2hpbGQgd2lkZ2V0cy9ob29rcyBtdXN0IGJlIGRlc3Ryb3llZC5cbiAgICAgICAgLy8gVGhpcyBwcmV2ZW50cyBhZGRpbmcgdHdvIHJlbW92ZSBwYXRjaGVzIGZvciBhIHdpZGdldC5cbiAgICAgICAgaWYgKCFpc1dpZGdldChhKSkge1xuICAgICAgICAgICAgY2xlYXJTdGF0ZShhLCBwYXRjaCwgaW5kZXgpXG4gICAgICAgICAgICBhcHBseSA9IHBhdGNoW2luZGV4XVxuICAgICAgICB9XG5cbiAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guUkVNT1ZFLCBhLCBiKSlcbiAgICB9IGVsc2UgaWYgKGlzVk5vZGUoYikpIHtcbiAgICAgICAgaWYgKGlzVk5vZGUoYSkpIHtcbiAgICAgICAgICAgIGlmIChhLnRhZ05hbWUgPT09IGIudGFnTmFtZSAmJlxuICAgICAgICAgICAgICAgIGEubmFtZXNwYWNlID09PSBiLm5hbWVzcGFjZSAmJlxuICAgICAgICAgICAgICAgIGEua2V5ID09PSBiLmtleSkge1xuICAgICAgICAgICAgICAgIHZhciBwcm9wc1BhdGNoID0gZGlmZlByb3BzKGEucHJvcGVydGllcywgYi5wcm9wZXJ0aWVzKVxuICAgICAgICAgICAgICAgIGlmIChwcm9wc1BhdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgVlBhdGNoKFZQYXRjaC5QUk9QUywgYSwgcHJvcHNQYXRjaCkpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFwcGx5ID0gZGlmZkNoaWxkcmVuKGEsIGIsIHBhdGNoLCBhcHBseSwgaW5kZXgpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlZOT0RFLCBhLCBiKSlcbiAgICAgICAgICAgICAgICBhcHBseUNsZWFyID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guVk5PREUsIGEsIGIpKVxuICAgICAgICAgICAgYXBwbHlDbGVhciA9IHRydWVcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNWVGV4dChiKSkge1xuICAgICAgICBpZiAoIWlzVlRleHQoYSkpIHtcbiAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlZURVhULCBhLCBiKSlcbiAgICAgICAgICAgIGFwcGx5Q2xlYXIgPSB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAoYS50ZXh0ICE9PSBiLnRleHQpIHtcbiAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlZURVhULCBhLCBiKSlcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNXaWRnZXQoYikpIHtcbiAgICAgICAgaWYgKCFpc1dpZGdldChhKSkge1xuICAgICAgICAgICAgYXBwbHlDbGVhciA9IHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLldJREdFVCwgYSwgYikpXG4gICAgfVxuXG4gICAgaWYgKGFwcGx5KSB7XG4gICAgICAgIHBhdGNoW2luZGV4XSA9IGFwcGx5XG4gICAgfVxuXG4gICAgaWYgKGFwcGx5Q2xlYXIpIHtcbiAgICAgICAgY2xlYXJTdGF0ZShhLCBwYXRjaCwgaW5kZXgpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBkaWZmQ2hpbGRyZW4oYSwgYiwgcGF0Y2gsIGFwcGx5LCBpbmRleCkge1xuICAgIHZhciBhQ2hpbGRyZW4gPSBhLmNoaWxkcmVuXG4gICAgdmFyIG9yZGVyZWRTZXQgPSByZW9yZGVyKGFDaGlsZHJlbiwgYi5jaGlsZHJlbilcbiAgICB2YXIgYkNoaWxkcmVuID0gb3JkZXJlZFNldC5jaGlsZHJlblxuXG4gICAgdmFyIGFMZW4gPSBhQ2hpbGRyZW4ubGVuZ3RoXG4gICAgdmFyIGJMZW4gPSBiQ2hpbGRyZW4ubGVuZ3RoXG4gICAgdmFyIGxlbiA9IGFMZW4gPiBiTGVuID8gYUxlbiA6IGJMZW5cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFyIGxlZnROb2RlID0gYUNoaWxkcmVuW2ldXG4gICAgICAgIHZhciByaWdodE5vZGUgPSBiQ2hpbGRyZW5baV1cbiAgICAgICAgaW5kZXggKz0gMVxuXG4gICAgICAgIGlmICghbGVmdE5vZGUpIHtcbiAgICAgICAgICAgIGlmIChyaWdodE5vZGUpIHtcbiAgICAgICAgICAgICAgICAvLyBFeGNlc3Mgbm9kZXMgaW4gYiBuZWVkIHRvIGJlIGFkZGVkXG4gICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IFZQYXRjaChWUGF0Y2guSU5TRVJULCBudWxsLCByaWdodE5vZGUpKVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd2FsayhsZWZ0Tm9kZSwgcmlnaHROb2RlLCBwYXRjaCwgaW5kZXgpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNWTm9kZShsZWZ0Tm9kZSkgJiYgbGVmdE5vZGUuY291bnQpIHtcbiAgICAgICAgICAgIGluZGV4ICs9IGxlZnROb2RlLmNvdW50XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3JkZXJlZFNldC5tb3Zlcykge1xuICAgICAgICAvLyBSZW9yZGVyIG5vZGVzIGxhc3RcbiAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChcbiAgICAgICAgICAgIFZQYXRjaC5PUkRFUixcbiAgICAgICAgICAgIGEsXG4gICAgICAgICAgICBvcmRlcmVkU2V0Lm1vdmVzXG4gICAgICAgICkpXG4gICAgfVxuXG4gICAgcmV0dXJuIGFwcGx5XG59XG5cbmZ1bmN0aW9uIGNsZWFyU3RhdGUodk5vZGUsIHBhdGNoLCBpbmRleCkge1xuICAgIC8vIFRPRE86IE1ha2UgdGhpcyBhIHNpbmdsZSB3YWxrLCBub3QgdHdvXG4gICAgdW5ob29rKHZOb2RlLCBwYXRjaCwgaW5kZXgpXG4gICAgZGVzdHJveVdpZGdldHModk5vZGUsIHBhdGNoLCBpbmRleClcbn1cblxuLy8gUGF0Y2ggcmVjb3JkcyBmb3IgYWxsIGRlc3Ryb3llZCB3aWRnZXRzIG11c3QgYmUgYWRkZWQgYmVjYXVzZSB3ZSBuZWVkXG4vLyBhIERPTSBub2RlIHJlZmVyZW5jZSBmb3IgdGhlIGRlc3Ryb3kgZnVuY3Rpb25cbmZ1bmN0aW9uIGRlc3Ryb3lXaWRnZXRzKHZOb2RlLCBwYXRjaCwgaW5kZXgpIHtcbiAgICBpZiAoaXNXaWRnZXQodk5vZGUpKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygdk5vZGUuZGVzdHJveSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBwYXRjaFtpbmRleF0gPSBhcHBlbmRQYXRjaChcbiAgICAgICAgICAgICAgICBwYXRjaFtpbmRleF0sXG4gICAgICAgICAgICAgICAgbmV3IFZQYXRjaChWUGF0Y2guUkVNT1ZFLCB2Tm9kZSwgbnVsbClcbiAgICAgICAgICAgIClcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNWTm9kZSh2Tm9kZSkgJiYgKHZOb2RlLmhhc1dpZGdldHMgfHwgdk5vZGUuaGFzVGh1bmtzKSkge1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSB2Tm9kZS5jaGlsZHJlblxuICAgICAgICB2YXIgbGVuID0gY2hpbGRyZW4ubGVuZ3RoXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgICAgICAgICBpbmRleCArPSAxXG5cbiAgICAgICAgICAgIGRlc3Ryb3lXaWRnZXRzKGNoaWxkLCBwYXRjaCwgaW5kZXgpXG5cbiAgICAgICAgICAgIGlmIChpc1ZOb2RlKGNoaWxkKSAmJiBjaGlsZC5jb3VudCkge1xuICAgICAgICAgICAgICAgIGluZGV4ICs9IGNoaWxkLmNvdW50XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzVGh1bmsodk5vZGUpKSB7XG4gICAgICAgIHRodW5rcyh2Tm9kZSwgbnVsbCwgcGF0Y2gsIGluZGV4KVxuICAgIH1cbn1cblxuLy8gQ3JlYXRlIGEgc3ViLXBhdGNoIGZvciB0aHVua3NcbmZ1bmN0aW9uIHRodW5rcyhhLCBiLCBwYXRjaCwgaW5kZXgpIHtcbiAgICB2YXIgbm9kZXMgPSBoYW5kbGVUaHVuayhhLCBiKVxuICAgIHZhciB0aHVua1BhdGNoID0gZGlmZihub2Rlcy5hLCBub2Rlcy5iKVxuICAgIGlmIChoYXNQYXRjaGVzKHRodW5rUGF0Y2gpKSB7XG4gICAgICAgIHBhdGNoW2luZGV4XSA9IG5ldyBWUGF0Y2goVlBhdGNoLlRIVU5LLCBudWxsLCB0aHVua1BhdGNoKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzUGF0Y2hlcyhwYXRjaCkge1xuICAgIGZvciAodmFyIGluZGV4IGluIHBhdGNoKSB7XG4gICAgICAgIGlmIChpbmRleCAhPT0gXCJhXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2Vcbn1cblxuLy8gRXhlY3V0ZSBob29rcyB3aGVuIHR3byBub2RlcyBhcmUgaWRlbnRpY2FsXG5mdW5jdGlvbiB1bmhvb2sodk5vZGUsIHBhdGNoLCBpbmRleCkge1xuICAgIGlmIChpc1ZOb2RlKHZOb2RlKSkge1xuICAgICAgICBpZiAodk5vZGUuaG9va3MpIHtcbiAgICAgICAgICAgIHBhdGNoW2luZGV4XSA9IGFwcGVuZFBhdGNoKFxuICAgICAgICAgICAgICAgIHBhdGNoW2luZGV4XSxcbiAgICAgICAgICAgICAgICBuZXcgVlBhdGNoKFxuICAgICAgICAgICAgICAgICAgICBWUGF0Y2guUFJPUFMsXG4gICAgICAgICAgICAgICAgICAgIHZOb2RlLFxuICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWRLZXlzKHZOb2RlLmhvb2tzKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2Tm9kZS5kZXNjZW5kYW50SG9va3MgfHwgdk5vZGUuaGFzVGh1bmtzKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB2Tm9kZS5jaGlsZHJlblxuICAgICAgICAgICAgdmFyIGxlbiA9IGNoaWxkcmVuLmxlbmd0aFxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgICAgICAgICAgICAgaW5kZXggKz0gMVxuXG4gICAgICAgICAgICAgICAgdW5ob29rKGNoaWxkLCBwYXRjaCwgaW5kZXgpXG5cbiAgICAgICAgICAgICAgICBpZiAoaXNWTm9kZShjaGlsZCkgJiYgY2hpbGQuY291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gY2hpbGQuY291bnRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzVGh1bmsodk5vZGUpKSB7XG4gICAgICAgIHRodW5rcyh2Tm9kZSwgbnVsbCwgcGF0Y2gsIGluZGV4KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gdW5kZWZpbmVkS2V5cyhvYmopIHtcbiAgICB2YXIgcmVzdWx0ID0ge31cblxuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSB1bmRlZmluZWRcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG59XG5cbi8vIExpc3QgZGlmZiwgbmFpdmUgbGVmdCB0byByaWdodCByZW9yZGVyaW5nXG5mdW5jdGlvbiByZW9yZGVyKGFDaGlsZHJlbiwgYkNoaWxkcmVuKSB7XG4gICAgLy8gTyhNKSB0aW1lLCBPKE0pIG1lbW9yeVxuICAgIHZhciBiQ2hpbGRJbmRleCA9IGtleUluZGV4KGJDaGlsZHJlbilcbiAgICB2YXIgYktleXMgPSBiQ2hpbGRJbmRleC5rZXlzXG4gICAgdmFyIGJGcmVlID0gYkNoaWxkSW5kZXguZnJlZVxuXG4gICAgaWYgKGJGcmVlLmxlbmd0aCA9PT0gYkNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2hpbGRyZW46IGJDaGlsZHJlbixcbiAgICAgICAgICAgIG1vdmVzOiBudWxsXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPKE4pIHRpbWUsIE8oTikgbWVtb3J5XG4gICAgdmFyIGFDaGlsZEluZGV4ID0ga2V5SW5kZXgoYUNoaWxkcmVuKVxuICAgIHZhciBhS2V5cyA9IGFDaGlsZEluZGV4LmtleXNcbiAgICB2YXIgYUZyZWUgPSBhQ2hpbGRJbmRleC5mcmVlXG5cbiAgICBpZiAoYUZyZWUubGVuZ3RoID09PSBhQ2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjaGlsZHJlbjogYkNoaWxkcmVuLFxuICAgICAgICAgICAgbW92ZXM6IG51bGxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE8oTUFYKE4sIE0pKSBtZW1vcnlcbiAgICB2YXIgbmV3Q2hpbGRyZW4gPSBbXVxuXG4gICAgdmFyIGZyZWVJbmRleCA9IDBcbiAgICB2YXIgZnJlZUNvdW50ID0gYkZyZWUubGVuZ3RoXG4gICAgdmFyIGRlbGV0ZWRJdGVtcyA9IDBcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhIGFuZCBtYXRjaCBhIG5vZGUgaW4gYlxuICAgIC8vIE8oTikgdGltZSxcbiAgICBmb3IgKHZhciBpID0gMCA7IGkgPCBhQ2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGFJdGVtID0gYUNoaWxkcmVuW2ldXG4gICAgICAgIHZhciBpdGVtSW5kZXhcblxuICAgICAgICBpZiAoYUl0ZW0ua2V5KSB7XG4gICAgICAgICAgICBpZiAoYktleXMuaGFzT3duUHJvcGVydHkoYUl0ZW0ua2V5KSkge1xuICAgICAgICAgICAgICAgIC8vIE1hdGNoIHVwIHRoZSBvbGQga2V5c1xuICAgICAgICAgICAgICAgIGl0ZW1JbmRleCA9IGJLZXlzW2FJdGVtLmtleV1cbiAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKGJDaGlsZHJlbltpdGVtSW5kZXhdKVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBvbGQga2V5ZWQgaXRlbXNcbiAgICAgICAgICAgICAgICBpdGVtSW5kZXggPSBpIC0gZGVsZXRlZEl0ZW1zKytcbiAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKG51bGwpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBNYXRjaCB0aGUgaXRlbSBpbiBhIHdpdGggdGhlIG5leHQgZnJlZSBpdGVtIGluIGJcbiAgICAgICAgICAgIGlmIChmcmVlSW5kZXggPCBmcmVlQ291bnQpIHtcbiAgICAgICAgICAgICAgICBpdGVtSW5kZXggPSBiRnJlZVtmcmVlSW5kZXgrK11cbiAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKGJDaGlsZHJlbltpdGVtSW5kZXhdKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBUaGVyZSBhcmUgbm8gZnJlZSBpdGVtcyBpbiBiIHRvIG1hdGNoIHdpdGhcbiAgICAgICAgICAgICAgICAvLyB0aGUgZnJlZSBpdGVtcyBpbiBhLCBzbyB0aGUgZXh0cmEgZnJlZSBub2Rlc1xuICAgICAgICAgICAgICAgIC8vIGFyZSBkZWxldGVkLlxuICAgICAgICAgICAgICAgIGl0ZW1JbmRleCA9IGkgLSBkZWxldGVkSXRlbXMrK1xuICAgICAgICAgICAgICAgIG5ld0NoaWxkcmVuLnB1c2gobnVsbClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBsYXN0RnJlZUluZGV4ID0gZnJlZUluZGV4ID49IGJGcmVlLmxlbmd0aCA/XG4gICAgICAgIGJDaGlsZHJlbi5sZW5ndGggOlxuICAgICAgICBiRnJlZVtmcmVlSW5kZXhdXG5cbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggYiBhbmQgYXBwZW5kIGFueSBuZXcga2V5c1xuICAgIC8vIE8oTSkgdGltZVxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgYkNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBuZXdJdGVtID0gYkNoaWxkcmVuW2pdXG5cbiAgICAgICAgaWYgKG5ld0l0ZW0ua2V5KSB7XG4gICAgICAgICAgICBpZiAoIWFLZXlzLmhhc093blByb3BlcnR5KG5ld0l0ZW0ua2V5KSkge1xuICAgICAgICAgICAgICAgIC8vIEFkZCBhbnkgbmV3IGtleWVkIGl0ZW1zXG4gICAgICAgICAgICAgICAgLy8gV2UgYXJlIGFkZGluZyBuZXcgaXRlbXMgdG8gdGhlIGVuZCBhbmQgdGhlbiBzb3J0aW5nIHRoZW1cbiAgICAgICAgICAgICAgICAvLyBpbiBwbGFjZS4gSW4gZnV0dXJlIHdlIHNob3VsZCBpbnNlcnQgbmV3IGl0ZW1zIGluIHBsYWNlLlxuICAgICAgICAgICAgICAgIG5ld0NoaWxkcmVuLnB1c2gobmV3SXRlbSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChqID49IGxhc3RGcmVlSW5kZXgpIHtcbiAgICAgICAgICAgIC8vIEFkZCBhbnkgbGVmdG92ZXIgbm9uLWtleWVkIGl0ZW1zXG4gICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKG5ld0l0ZW0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgc2ltdWxhdGUgPSBuZXdDaGlsZHJlbi5zbGljZSgpXG4gICAgdmFyIHNpbXVsYXRlSW5kZXggPSAwXG4gICAgdmFyIHJlbW92ZXMgPSBbXVxuICAgIHZhciBpbnNlcnRzID0gW11cbiAgICB2YXIgc2ltdWxhdGVJdGVtXG5cbiAgICBmb3IgKHZhciBrID0gMDsgayA8IGJDaGlsZHJlbi5sZW5ndGg7KSB7XG4gICAgICAgIHZhciB3YW50ZWRJdGVtID0gYkNoaWxkcmVuW2tdXG4gICAgICAgIHNpbXVsYXRlSXRlbSA9IHNpbXVsYXRlW3NpbXVsYXRlSW5kZXhdXG5cbiAgICAgICAgLy8gcmVtb3ZlIGl0ZW1zXG4gICAgICAgIHdoaWxlIChzaW11bGF0ZUl0ZW0gPT09IG51bGwgJiYgc2ltdWxhdGUubGVuZ3RoKSB7XG4gICAgICAgICAgICByZW1vdmVzLnB1c2gocmVtb3ZlKHNpbXVsYXRlLCBzaW11bGF0ZUluZGV4LCBudWxsKSlcbiAgICAgICAgICAgIHNpbXVsYXRlSXRlbSA9IHNpbXVsYXRlW3NpbXVsYXRlSW5kZXhdXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNpbXVsYXRlSXRlbSB8fCBzaW11bGF0ZUl0ZW0ua2V5ICE9PSB3YW50ZWRJdGVtLmtleSkge1xuICAgICAgICAgICAgLy8gaWYgd2UgbmVlZCBhIGtleSBpbiB0aGlzIHBvc2l0aW9uLi4uXG4gICAgICAgICAgICBpZiAod2FudGVkSXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2ltdWxhdGVJdGVtICYmIHNpbXVsYXRlSXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgYW4gaW5zZXJ0IGRvZXNuJ3QgcHV0IHRoaXMga2V5IGluIHBsYWNlLCBpdCBuZWVkcyB0byBtb3ZlXG4gICAgICAgICAgICAgICAgICAgIGlmIChiS2V5c1tzaW11bGF0ZUl0ZW0ua2V5XSAhPT0gayArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZXMucHVzaChyZW1vdmUoc2ltdWxhdGUsIHNpbXVsYXRlSW5kZXgsIHNpbXVsYXRlSXRlbS5rZXkpKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2ltdWxhdGVJdGVtID0gc2ltdWxhdGVbc2ltdWxhdGVJbmRleF1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSByZW1vdmUgZGlkbid0IHB1dCB0aGUgd2FudGVkIGl0ZW0gaW4gcGxhY2UsIHdlIG5lZWQgdG8gaW5zZXJ0IGl0XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNpbXVsYXRlSXRlbSB8fCBzaW11bGF0ZUl0ZW0ua2V5ICE9PSB3YW50ZWRJdGVtLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydHMucHVzaCh7a2V5OiB3YW50ZWRJdGVtLmtleSwgdG86IGt9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXRlbXMgYXJlIG1hdGNoaW5nLCBzbyBza2lwIGFoZWFkXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW11bGF0ZUluZGV4KytcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydHMucHVzaCh7a2V5OiB3YW50ZWRJdGVtLmtleSwgdG86IGt9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnRzLnB1c2goe2tleTogd2FudGVkSXRlbS5rZXksIHRvOiBrfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaysrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBhIGtleSBpbiBzaW11bGF0ZSBoYXMgbm8gbWF0Y2hpbmcgd2FudGVkIGtleSwgcmVtb3ZlIGl0XG4gICAgICAgICAgICBlbHNlIGlmIChzaW11bGF0ZUl0ZW0gJiYgc2ltdWxhdGVJdGVtLmtleSkge1xuICAgICAgICAgICAgICAgIHJlbW92ZXMucHVzaChyZW1vdmUoc2ltdWxhdGUsIHNpbXVsYXRlSW5kZXgsIHNpbXVsYXRlSXRlbS5rZXkpKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2ltdWxhdGVJbmRleCsrXG4gICAgICAgICAgICBrKytcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJlbW92ZSBhbGwgdGhlIHJlbWFpbmluZyBub2RlcyBmcm9tIHNpbXVsYXRlXG4gICAgd2hpbGUoc2ltdWxhdGVJbmRleCA8IHNpbXVsYXRlLmxlbmd0aCkge1xuICAgICAgICBzaW11bGF0ZUl0ZW0gPSBzaW11bGF0ZVtzaW11bGF0ZUluZGV4XVxuICAgICAgICByZW1vdmVzLnB1c2gocmVtb3ZlKHNpbXVsYXRlLCBzaW11bGF0ZUluZGV4LCBzaW11bGF0ZUl0ZW0gJiYgc2ltdWxhdGVJdGVtLmtleSkpXG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIG9ubHkgbW92ZXMgd2UgaGF2ZSBhcmUgZGVsZXRlcyB0aGVuIHdlIGNhbiBqdXN0XG4gICAgLy8gbGV0IHRoZSBkZWxldGUgcGF0Y2ggcmVtb3ZlIHRoZXNlIGl0ZW1zLlxuICAgIGlmIChyZW1vdmVzLmxlbmd0aCA9PT0gZGVsZXRlZEl0ZW1zICYmICFpbnNlcnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2hpbGRyZW46IG5ld0NoaWxkcmVuLFxuICAgICAgICAgICAgbW92ZXM6IG51bGxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGNoaWxkcmVuOiBuZXdDaGlsZHJlbixcbiAgICAgICAgbW92ZXM6IHtcbiAgICAgICAgICAgIHJlbW92ZXM6IHJlbW92ZXMsXG4gICAgICAgICAgICBpbnNlcnRzOiBpbnNlcnRzXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZShhcnIsIGluZGV4LCBrZXkpIHtcbiAgICBhcnIuc3BsaWNlKGluZGV4LCAxKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZnJvbTogaW5kZXgsXG4gICAgICAgIGtleToga2V5XG4gICAgfVxufVxuXG5mdW5jdGlvbiBrZXlJbmRleChjaGlsZHJlbikge1xuICAgIHZhciBrZXlzID0ge31cbiAgICB2YXIgZnJlZSA9IFtdXG4gICAgdmFyIGxlbmd0aCA9IGNoaWxkcmVuLmxlbmd0aFxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXVxuXG4gICAgICAgIGlmIChjaGlsZC5rZXkpIHtcbiAgICAgICAgICAgIGtleXNbY2hpbGQua2V5XSA9IGlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZyZWUucHVzaChpKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAga2V5czoga2V5cywgICAgIC8vIEEgaGFzaCBvZiBrZXkgbmFtZSB0byBpbmRleFxuICAgICAgICBmcmVlOiBmcmVlICAgICAgLy8gQW4gYXJyYXkgb2YgdW5rZXllZCBpdGVtIGluZGljZXNcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFBhdGNoKGFwcGx5LCBwYXRjaCkge1xuICAgIGlmIChhcHBseSkge1xuICAgICAgICBpZiAoaXNBcnJheShhcHBseSkpIHtcbiAgICAgICAgICAgIGFwcGx5LnB1c2gocGF0Y2gpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcHBseSA9IFthcHBseSwgcGF0Y2hdXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXBwbHlcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcGF0Y2hcbiAgICB9XG59XG4iLCJ2YXIgbmF0aXZlSXNBcnJheSA9IEFycmF5LmlzQXJyYXlcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcblxubW9kdWxlLmV4cG9ydHMgPSBuYXRpdmVJc0FycmF5IHx8IGlzQXJyYXlcblxuZnVuY3Rpb24gaXNBcnJheShvYmopIHtcbiAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSBcIltvYmplY3QgQXJyYXldXCJcbn1cbiIsInZhciBhcHBseVByb3BlcnRpZXMgPSByZXF1aXJlKFwidmlydHVhbC1kb20vdmRvbS9hcHBseS1wcm9wZXJ0aWVzXCIpXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoXCJ4LWlzLWFycmF5XCIpXG5cbnZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCJ2aXJ0dWFsLWRvbS92bm9kZS9pcy13aWRnZXRcIilcbnZhciBWUGF0Y2ggPSByZXF1aXJlKFwidmlydHVhbC1kb20vdm5vZGUvdnBhdGNoXCIpXG5cbnZhciB1cGRhdGVXaWRnZXQgPSByZXF1aXJlKFwidmlydHVhbC1kb20vdmRvbS91cGRhdGUtd2lkZ2V0XCIpXG5cbm1vZHVsZS5leHBvcnRzID0gYXBwbHlQYXRjaFxuXG5mdW5jdGlvbiBhcHBseVBhdGNoKHZwYXRjaCwgZG9tTm9kZSwgcmVuZGVyT3B0aW9ucykge1xuICAgIHZhciB0eXBlID0gdnBhdGNoLnR5cGVcbiAgICB2YXIgdk5vZGUgPSB2cGF0Y2gudk5vZGVcbiAgICB2YXIgcGF0Y2ggPSB2cGF0Y2gucGF0Y2hcblxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlIFZQYXRjaC5SRU1PVkU6XG4gICAgICAgICAgcmV0dXJuIFByb21pc2VcbiAgICAgICAgICAgICAgLmFsbChyZW1vdmVPcCh2Tm9kZSwgZG9tTm9kZSkpXG4gICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVOb2RlKGRvbU5vZGUsIHZOb2RlKVxuICAgICAgICAgICAgICB9KVxuICAgICAgICBjYXNlIFZQYXRjaC5JTlNFUlQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGluc2VydE5vZGUoZG9tTm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpXG4gICAgICAgIGNhc2UgVlBhdGNoLlZURVhUOlxuICAgICAgICAgIHJldHVybiBQcm9taXNlXG4gICAgICAgICAgICAgIC5hbGwodXBkYXRlT3AocGF0Y2gsIGRvbU5vZGUucGFyZW50Tm9kZSkpXG4gICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHJpbmdQYXRjaChkb21Ob2RlLCB2Tm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgIGNhc2UgVlBhdGNoLldJREdFVDpcbiAgICAgICAgICAgIHJldHVybiB3aWRnZXRQYXRjaChkb21Ob2RlLCB2Tm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpXG4gICAgICAgIGNhc2UgVlBhdGNoLlZOT0RFOlxuICAgICAgICAgICAgcmV0dXJuIHZOb2RlUGF0Y2goZG9tTm9kZSwgdk5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKVxuICAgICAgICBjYXNlIFZQYXRjaC5PUkRFUjpcbiAgICAgICAgICAgIHJldHVybiByZW9yZGVyQ2hpbGRyZW4oZG9tTm9kZSwgcGF0Y2gsIHZOb2RlKVxuICAgICAgICBjYXNlIFZQYXRjaC5QUk9QUzpcbiAgICAgICAgICB2YXIgcmVtb3ZlSW50ZXJuYWxzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICBbJ29uRW50ZXInLCAnb25VcGRhdGUnLCAnb25FeGl0JywgJ2tleSddXG4gICAgICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgZGVsZXRlIG9ialtkXSB9KVxuXG4gICAgICAgICAgICByZXR1cm4gb2JqXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcGF0Y2ggPSByZW1vdmVJbnRlcm5hbHMocGF0Y2gpXG5cbiAgICAgICAgICBpZiAoIU9iamVjdC5rZXlzKHBhdGNoKS5sZW5ndGgpIHJldHVybiBQcm9taXNlLnJlc29sdmUoZG9tTm9kZSlcblxuICAgICAgICAgIHJldHVybiBQcm9taXNlXG4gICAgICAgICAgICAgIC5hbGwodXBkYXRlT3Aodk5vZGUsIGRvbU5vZGUsIHtvbGQ6IHBhdGNoLCBuZXc6IHJlbW92ZUludGVybmFscyh2Tm9kZS5wcm9wZXJ0aWVzKX0pKVxuICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBhcHBseVByb3BlcnRpZXMoZG9tTm9kZSwgcGF0Y2gsIHZOb2RlLnByb3BlcnRpZXMpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvbU5vZGVcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgY2FzZSBWUGF0Y2guVEhVTks6XG4gICAgICAgICAgICByZXR1cm4gcmVwbGFjZVJvb3QoZG9tTm9kZSxcbiAgICAgICAgICAgICAgICByZW5kZXJPcHRpb25zLnBhdGNoKGRvbU5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKSlcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBkb21Ob2RlXG4gICAgfVxufVxuXG4vL2hhaGEgc3RvcGVkIHRvIHVuZGVyc3RhbmQgd2hhdCBpdCBpcyBkb2luZywgcmV3cml0ZSBpdCFcbnZhciBnZXRDaGlsZHNPcHMgPSBmdW5jdGlvbih2Tm9kZSwgZG9tTm9kZSwgbWV0aG9kLCBwcm9wcywgZGVlcCkge1xuICB2YXIgb3BzID0gW11cblxuICB2YXIgZ2V0Q2hpbGRyZW4gPSBmdW5jdGlvbihub2RlLCB0cmVlKSB7XG4gICAgaWYgKCF0cmVlKSByZXR1cm5cblxuICAgIHZhciBkb21Ob2RlXG5cbiAgICAobm9kZS5jaGlsZHJlbiB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbihjaGlsZCwgaWR4KSB7XG4gICAgICBkb21Ob2RlID0gdHJlZS5jaGlsZHJlbltpZHhdXG4gICAgICBpZihjaGlsZC5wcm9wZXJ0aWVzICYmIGNoaWxkLnByb3BlcnRpZXNbbWV0aG9kXSAmJiBkb21Ob2RlKSB7XG4gICAgICAgIC8vc29tZXRpbWVzIHRoZXJlIGFyZSB0d28gdXBkYXRlcywgZmlyc3Qgb25lIHJlbGF0ZWQgdG8gdGFnLmNsYXNzIGlzIG5vdCByZWxldmFudCwgc28gc2tpcHBpbmcgaXRcbiAgICAgICAgdmFyIHNraXAgPSBPYmplY3Qua2V5cyhwcm9wcyB8fCB7fSkubGVuZ3RoID09IDEgJiYgKHByb3BzIHx8IHt9KS5jbGFzc05hbWU7XG4gICAgICAgIG9wcy5wdXNoKGNoaWxkLnByb3BlcnRpZXNbbWV0aG9kXShkb21Ob2RlLCBza2lwID8gKGNoaWxkLnByb3BlcnRpZXMgfHwgcHJvcHMpIDogKHByb3BzIHx8IGNoaWxkLnByb3BlcnRpZXMpKSlcbiAgICAgIH0gZWxzZSBpZihkb21Ob2RlICYmIGRvbU5vZGVbbWV0aG9kXSkge1xuICAgICAgICBvcHMucHVzaChkb21Ob2RlW21ldGhvZF0oZG9tTm9kZSwgcHJvcHMgfHwgY2hpbGQucHJvcGVydGllcykpXG4gICAgICB9XG4gICAgICBkZWVwICYmIGdldENoaWxkcmVuKGNoaWxkLCBkb21Ob2RlKTtcbiAgICB9KVxuICB9XG5cbiAgdmFyIHN0YXJ0ID0gZ2V0Q2hpbGRyZW4oeyBjaGlsZHJlbjogaXNBcnJheSh2Tm9kZSkgPyB2Tm9kZSA6IFt2Tm9kZV0gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICx7IGNoaWxkcmVuOiBpc0FycmF5KGRvbU5vZGUpID8gZG9tTm9kZSA6IFtkb21Ob2RlXSB9KVxuICByZXR1cm4gb3BzLnJldmVyc2UoKVxufVxuXG52YXIgcmVtb3ZlT3AgPSBmdW5jdGlvbihub2RlLCBkb21Ob2RlLCBwcm9wcywgZGVlcCkgeyByZXR1cm4gZ2V0Q2hpbGRzT3BzKG5vZGUsIGRvbU5vZGUsICdvbkV4aXQnLCBwcm9wcywgZGVlcCkgfVxuICAsIGluc2VydE9wID0gZnVuY3Rpb24obm9kZSwgZG9tTm9kZSwgcHJvcHMsIGRlZXApIHsgcmV0dXJuIGdldENoaWxkc09wcyhub2RlLCBkb21Ob2RlLCAnb25FbnRlcicsIHByb3BzLCBkZWVwKSB9XG4gICwgdXBkYXRlT3AgPSBmdW5jdGlvbihub2RlLCBkb21Ob2RlLCBwcm9wcywgZGVlcCkgeyByZXR1cm4gZ2V0Q2hpbGRzT3BzKG5vZGUsIGRvbU5vZGUsICdvblVwZGF0ZScsIHByb3BzLCBkZWVwKSB9XG5mdW5jdGlvbiByZW1vdmVOb2RlKGRvbU5vZGUsIHZOb2RlKSB7XG4gICAgdmFyIHBhcmVudE5vZGUgPSBkb21Ob2RlLnBhcmVudE5vZGVcblxuICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZG9tTm9kZSlcbiAgICB9XG5cbiAgICBkZXN0cm95V2lkZ2V0KGRvbU5vZGUsIHZOb2RlKTtcblxuICAgIHJldHVybiBudWxsXG59XG5cbmZ1bmN0aW9uIGluc2VydE5vZGUocGFyZW50Tm9kZSwgdk5vZGUsIHJlbmRlck9wdGlvbnMpIHtcbiAgdmFyIG5ld05vZGUgPSByZW5kZXJPcHRpb25zLnJlbmRlcih2Tm9kZSwgcmVuZGVyT3B0aW9ucylcblxuICBpZiAocGFyZW50Tm9kZSkgcGFyZW50Tm9kZS5hcHBlbmRDaGlsZChuZXdOb2RlKVxuXG4gIHJldHVybiBQcm9taXNlXG4gICAgLmFsbChpbnNlcnRPcCh2Tm9kZSwgbmV3Tm9kZSwgdk5vZGUucHJvcGVydGllcyB8fCB2Tm9kZSwgdHJ1ZSkpXG4gICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcGFyZW50Tm9kZVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHN0cmluZ1BhdGNoKGRvbU5vZGUsIGxlZnRWTm9kZSwgdlRleHQsIHJlbmRlck9wdGlvbnMpIHtcbiAgICB2YXIgbmV3Tm9kZVxuXG4gICAgaWYgKGRvbU5vZGUubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgICAgZG9tTm9kZS5yZXBsYWNlRGF0YSgwLCBkb21Ob2RlLmxlbmd0aCwgdlRleHQudGV4dClcbiAgICAgICAgbmV3Tm9kZSA9IGRvbU5vZGVcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZVxuICAgICAgICBuZXdOb2RlID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIodlRleHQsIHJlbmRlck9wdGlvbnMpXG5cbiAgICAgICAgaWYgKHBhcmVudE5vZGUgJiYgbmV3Tm9kZSAhPT0gZG9tTm9kZSkge1xuICAgICAgICAgICAgcGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Tm9kZSwgZG9tTm9kZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXdOb2RlXG59XG5cbmZ1bmN0aW9uIHdpZGdldFBhdGNoKGRvbU5vZGUsIGxlZnRWTm9kZSwgd2lkZ2V0LCByZW5kZXJPcHRpb25zKSB7XG4gICAgdmFyIHVwZGF0aW5nID0gdXBkYXRlV2lkZ2V0KGxlZnRWTm9kZSwgd2lkZ2V0KVxuICAgIHZhciBuZXdOb2RlXG5cbiAgICBpZiAodXBkYXRpbmcpIHtcbiAgICAgICAgbmV3Tm9kZSA9IHdpZGdldC51cGRhdGUobGVmdFZOb2RlLCBkb21Ob2RlKSB8fCBkb21Ob2RlXG4gICAgfSBlbHNlIHtcbiAgICAgICAgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHdpZGdldCwgcmVuZGVyT3B0aW9ucylcbiAgICB9XG5cbiAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZVxuXG4gICAgaWYgKHBhcmVudE5vZGUgJiYgbmV3Tm9kZSAhPT0gZG9tTm9kZSkge1xuICAgICAgICBwYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdOb2RlLCBkb21Ob2RlKVxuICAgIH1cblxuICAgIGlmICghdXBkYXRpbmcpIHtcbiAgICAgICAgZGVzdHJveVdpZGdldChkb21Ob2RlLCBsZWZ0Vk5vZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld05vZGVcbn1cblxuXG5mdW5jdGlvbiBkZXN0cm95V2lkZ2V0KGRvbU5vZGUsIHcpIHtcbiAgICBpZiAodHlwZW9mIHcuZGVzdHJveSA9PT0gXCJmdW5jdGlvblwiICYmIGlzV2lkZ2V0KHcpKSB7XG4gICAgICAgIHcuZGVzdHJveShkb21Ob2RlKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVwbGFjZVJvb3Qob2xkUm9vdCwgbmV3Um9vdCkge1xuICAgIGlmIChvbGRSb290ICYmIG5ld1Jvb3QgJiYgb2xkUm9vdCAhPT0gbmV3Um9vdCAmJiBvbGRSb290LnBhcmVudE5vZGUpIHtcbiAgICAgICAgb2xkUm9vdC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdSb290LCBvbGRSb290KVxuICAgIH1cblxuICAgIHJldHVybiBuZXdSb290O1xufVxuXG5mdW5jdGlvbiB2Tm9kZVBhdGNoKGRvbU5vZGUsIGxlZnRWTm9kZSwgdk5vZGUsIHJlbmRlck9wdGlvbnMpIHtcbiAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZVxuXG4gICAgcmV0dXJuIFByb21pc2VcbiAgICAgIC5hbGwocmVtb3ZlT3AobGVmdFZOb2RlLCBkb21Ob2RlKSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHZOb2RlLCByZW5kZXJPcHRpb25zKVxuXG4gICAgICAgIGlmIChwYXJlbnROb2RlICYmIG5ld05vZGUgIT09IGRvbU5vZGUpIHtcbiAgICAgICAgICAgIHBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld05vZGUsIGRvbU5vZGUpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3Tm9kZVxuICAgICAgfSlcbn1cblxuZnVuY3Rpb24gcmVvcmRlckNoaWxkcmVuKGRvbU5vZGUsIG1vdmVzLCB2bm9kZSkge1xuICAgIHZhciBjaGlsZE5vZGVzID0gZG9tTm9kZS5jaGlsZE5vZGVzXG4gICAgICAsIG5vZGVcbiAgICAgICwgcmVtb3ZlXG5cbiAgICB2YXIgdG9SZW1vdmUgPSBbXVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3Zlcy5yZW1vdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJlbW92ZSA9IG1vdmVzLnJlbW92ZXNbaV1cbiAgICAgICAgbm9kZSA9IGNoaWxkTm9kZXNbcmVtb3ZlLmZyb21dXG4gICAgICAgIGlmICghcmVtb3ZlLmtleSkgdG9SZW1vdmUucHVzaChub2RlKVxuICAgIH1cbiAgICAvL1RPIENPTlNJREVSOiBob29rIGZvciByZW9yZGVyaW5nXG4gICAgcmV0dXJuIFByb21pc2VcbiAgICAgIC5hbGwocmVtb3ZlT3Aodm5vZGUsIHRvUmVtb3ZlKSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIga2V5TWFwID0ge31cbiAgICAgICAgdmFyIGluc2VydFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vdmVzLnJlbW92ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHJlbW92ZSA9IG1vdmVzLnJlbW92ZXNbaV1cbiAgICAgICAgICAgIG5vZGUgPSBjaGlsZE5vZGVzW3JlbW92ZS5mcm9tXVxuICAgICAgICAgICAgaWYgKHJlbW92ZS5rZXkpIHtcbiAgICAgICAgICAgICAgICBrZXlNYXBbcmVtb3ZlLmtleV0gPSBub2RlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb21Ob2RlLnJlbW92ZUNoaWxkKG5vZGUpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGVuZ3RoID0gY2hpbGROb2Rlcy5sZW5ndGhcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBtb3Zlcy5pbnNlcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpbnNlcnQgPSBtb3Zlcy5pbnNlcnRzW2pdXG4gICAgICAgICAgICBub2RlID0ga2V5TWFwW2luc2VydC5rZXldXG4gICAgICAgICAgICBkb21Ob2RlLmluc2VydEJlZm9yZShub2RlLCBpbnNlcnQudG8gPj0gbGVuZ3RoKysgPyBudWxsIDogY2hpbGROb2Rlc1tpbnNlcnQudG9dKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRvbU5vZGVcbiAgICAgIH0pXG59XG4iLCJ2YXIgaXNBcnJheSA9IHJlcXVpcmUoXCJ4LWlzLWFycmF5XCIpXG5cbnZhciByZW5kZXIgPSByZXF1aXJlKFwidmlydHVhbC1kb20vdmRvbS9jcmVhdGUtZWxlbWVudFwiKVxudmFyIGRvbUluZGV4ID0gcmVxdWlyZShcInZpcnR1YWwtZG9tL3Zkb20vZG9tLWluZGV4XCIpXG52YXIgcGF0Y2hPcCA9IHJlcXVpcmUoXCIuL3BhdGNoLW9wXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gZGVmZmVyZWRQYXRjaFxuXG52YXIgb3BObyA9IDBcblxuZnVuY3Rpb24gZGVmZmVyZWRQYXRjaChyb290Tm9kZSwgcGF0Y2hlcywgcmVuZGVyT3B0aW9ucykge1xuICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLT4gb3BlcmF0aW9uIG5vJywgb3BObysrKVxuXG4gICAgdmFyIGluZGljZXMgPSBwYXRjaEluZGljZXMocGF0Y2hlcylcblxuICAgIGlmIChpbmRpY2VzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJvb3ROb2RlKSB9XG5cbiAgICB2YXIgaW5kZXggPSBkb21JbmRleChyb290Tm9kZSwgcGF0Y2hlcy5hLCBpbmRpY2VzKVxuICAgIHZhciBvd25lckRvY3VtZW50ID0gcm9vdE5vZGUub3duZXJEb2N1bWVudFxuXG4gICAgaWYgKCFyZW5kZXJPcHRpb25zLmRvY3VtZW50ICYmIG93bmVyRG9jdW1lbnQgIT09IGRvY3VtZW50KSB7XG4gICAgICAgIHJlbmRlck9wdGlvbnMuZG9jdW1lbnQgPSBvd25lckRvY3VtZW50XG4gICAgfVxuXG4gICAgdmFyIF9fcCA9IFtdXG5cbiAgICBpbmRpY2VzLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgdmFyIGlkeCA9IGRcbiAgICAgICAgLCBwYXRjaCA9IHBhdGNoZXNbaWR4XVxuXG4gICAgICBpZiAoIWlzQXJyYXkocGF0Y2gpKSBwYXRjaCA9IFtwYXRjaF1cbiAgICAgIFxuICAgICAgcGF0Y2guZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgIF9fcC5wdXNoKHtpZHg6IGlkeCwgcGF0Y2g6IGR9KVxuICAgICAgfSkgXG4gICAgfSlcblxuICAgIHZhciBvcGVyYXRpb25zID0gX19wLm1hcChmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oX19yb290Tm9kZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ob2spIHtcbiAgICAgICAgICB2YXIgX19jID0gYXBwbHlQYXRjaChpbmRleFtkLmlkeF0sIGQucGF0Y2gsIHJlbmRlck9wdGlvbnMpXG4gICAgICAgICAgaWYoX19jICYmIF9fYy50aGVuKSB7XG4gICAgICAgICAgICBfX2MudGhlbihmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgIG9rKF9fcm9vdE5vZGUpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgIG9rKF9fcm9vdE5vZGUpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgICBcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ob2ssIGVycikge1xuICAgICAgdmFyIHAgPSBQcm9taXNlLnJlc29sdmUocm9vdE5vZGUpXG4gICAgICAgICwgeiA9IDBcblxuICAgICAgdmFyIHRha2VOZXh0ID0gZnVuY3Rpb24ocCkge1xuICAgICAgICBwLnRoZW4oZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgIGlmKCB6ID09IG9wZXJhdGlvbnMubGVuZ3RoICkgcmV0dXJuIG9rKG5vZGUpXG4gICAgICAgICAgaWYgKHJvb3ROb2RlID09PSBub2RlKSByb290Tm9kZSA9IG5vZGVcbiAgICAgICAgICB0YWtlTmV4dChuZXcgUHJvbWlzZShvcGVyYXRpb25zW3pdKG5vZGUpKSlcbiAgICAgICAgICB6KytcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgdGFrZU5leHQocClcbiAgICB9KS50aGVuKGZ1bmN0aW9uKGRvbSkge1xuICAgICAgcmV0dXJuIGRvbVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGFwcGx5UGF0Y2goZG9tTm9kZSwgcGF0Y2hMaXN0LCByZW5kZXJPcHRpb25zKSB7XG4gIGlmICghZG9tTm9kZSkgcmV0dXJuIHJvb3ROb2RlXG4gIHJldHVybiBwYXRjaE9wKHBhdGNoTGlzdCwgZG9tTm9kZSwgcmVuZGVyT3B0aW9ucylcbn1cblxuZnVuY3Rpb24gcGF0Y2hJbmRpY2VzKHBhdGNoZXMpIHtcbiAgICB2YXIgaW5kaWNlcyA9IFtdXG5cbiAgICBmb3IgKHZhciBrZXkgaW4gcGF0Y2hlcykge1xuICAgICAgICBpZiAoa2V5ICE9PSBcImFcIikge1xuICAgICAgICAgICAgaW5kaWNlcy5wdXNoKE51bWJlcihrZXkpKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZGljZXNcbn1cbiIsIiJdfQ==
