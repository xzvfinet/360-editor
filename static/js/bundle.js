(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":1,"inherits":2}],5:[function(require,module,exports){
// Constants
var PRIMITIVE_DEFINITIONS = ['box', 'sphere', 'cylinder', 'plane', 'image'];
var OBJECT_DEFINITIONS = ['teleport'];
var OBJECT_LISTENER = 'object-listener';
var EVENT_LIST = ['teleport', 'link', 'page', 'image', 'video'];
var BACKGROUND_PREFIX = "../img/";
var EVENT_DICTIONARY = {
    'teleport': teleportEvent
}
var TEST_JSON = '[{"el":null,"type":"primitive","shape":"box","transform":{"position":{"x":-3.6739403974420594e-16,"y":0,"z":-6},"rotation":{"x":0,"y":0,"z":0},"scale":{"x":1,"y":1,"z":1}},"material":{"color":"#257654"},"clickListener":"object-listener","eventList":[]},{"el":null,"type":"primitive","shape":"sphere","transform":{"position":{"x":-1.3275046384397702,"y":-1.2272767136552951,"z":-5.721147026867983},"rotation":{"x":-11.802930579694959,"y":13.06343772898277,"z":0},"scale":{"x":1,"y":1,"z":1}},"material":{"color":"#013882"},"clickListener":"object-listener","eventList":[]},{"el":null,"type":"primitive","shape":"cylinder","transform":{"position":{"x":0.9465000710454844,"y":-1.989605502556811,"z":-5.580824989166615},"rotation":{"x":-19.365973475421832,"y":-9.625690958197833,"z":0},"scale":{"x":1,"y":1,"z":1}},"material":{"color":"#404134"},"clickListener":"object-listener","eventList":[]}]';


// Editor Dom Elements
var mainCanvas;
var idEl;
var shapeEl;
var positionEl;
var rotationEl;
var scaleEl;
var deleteBtn;
var editorToggle;
var eventArgEl;
var loadTextEl;
var loadBtnEl;
var borderList = [];

// Aframe Dom Elements
var mainFrame;
var scene = null;
var camera = null;
var background = null;

// State Variables
var editorMode = true;
var currentSelectedObject = null;
var nowClick = null;

var util = require('./util.js');
var nodeUtil = require('util');
var obj = require('./object.js');

window.onLoadCanvas = function(frame) {
    mainFrame = frame;

    initEditor();
    initCanvas();

    var boxEl = mainFrame.document.getElementById('testbox');
    var left = mainFrame.document.getElementById('left');
    var right = mainFrame.document.getElementById('right');
    var top = mainFrame.document.getElementById('top');
    var bottom = mainFrame.document.getElementById('bottom');
    var els = [left, right, top, bottom];
    for (var i = 0; i < els.length; ++i) {
        els[i].setAttribute('mover-listener', "");
        els[i].addEventListener('mouseenter', function() {
            var scale = this.getAttribute('scale');
            this.setAttribute('scale', { x: scale.x * 2, y: scale.y * 2, z: scale.z });
        });
        els[i].addEventListener('mouseleave', function() {
            var scale = this.getAttribute('scale');
            this.setAttribute('scale', { x: scale.x * 0.5, y: scale.y * 0.5, z: scale.z });
        });
        els[i].addEventListener('mousedown', function(evt) {
            console.log('down');
        });
    }

    // boxEl.addEventListener('mouseenter', function() {
    //     boxEl.setAttribute('scale', { x: 2, y: 2, z: 2 });
    // });
    // boxEl.addEventListener('mouseleave', function() {
    //     boxEl.setAttribute('scale', { x: 1, y: 1, z: 1 });
    // });
}

window.create = function(type) {
    if (PRIMITIVE_DEFINITIONS.includes(type)) {
        createPrimitive(type);
    } else if (OBJECT_DEFINITIONS.includes(type)) {
        createObject(type);
    }
}

window.onMouseMove = function(evt) {
    console.log(evt.clientX + ", " + evt.clientY);
}

function initEditor() {
    idEl = document.getElementsByClassName('object-id')[0];
    shapeEl = document.getElementsByClassName('object-shape')[0];
    positionEl = document.getElementsByClassName('object-position')[0];
    rotationEl = document.getElementsByClassName('object-rotation')[0];
    scaleEl = document.getElementsByClassName('object-scale')[0];
    deleteBtn = document.getElementById('delete-btn');
    deleteBtn.addEventListener('click', function(evt) {
        if (currentSelectedObject == null)
            console.log('Not selected');
        else {
            obj.Controller.remove(currentSelectedObject);
        }
    });
    editorToggle = $('#toggle-event');
    // Initially the editor mode is enabled.
    editorToggle.bootstrapToggle('on');
    editorMode = true;
    editorToggle.change(function() {
        editorMode = !editorMode;
    });
    eventArgEl = document.getElementById('eventArg');
    loadTextEl = document.getElementById('loadInput');
    loadTextEl.value = TEST_JSON;
    loadBtnEl = document.getElementById('loadBtn');
    loadBtnEl.addEventListener('click', function(evt) {
        loadObjectsFromJson(loadTextEl.value);
    });

    for (var i = 0; i < EVENT_LIST.length; ++i) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.appendChild(document.createTextNode(EVENT_LIST[i]));
        a.setAttribute('href', '#');
        li.appendChild(a);
        $(".dropdown-menu")[0].appendChild(li);
    }

    $(".dropdown-menu").on("click", "li", function(event) {
        if (currentSelectedObject != null) {
            var eventName = this.children[0].innerHTML;
            currentSelectedObject.eventList = [];
            currentSelectedObject.eventList.push({ 'type': eventName, 'arg': eventArgEl.value });
            // currentSelectedObject.eventList.push([eventName, eventArgEl.value]);
        }
    })
}

function initCanvas() {
    scene = mainFrame.document.querySelector('a-scene');
    camera = mainFrame.document.querySelector('[camera]');
    background = mainFrame.document.querySelector('a-sky');

    mainFrame.AFRAME.registerComponent(OBJECT_LISTENER, {
        schema: {
            id: {
                default: "shape"
            }
        },
        init: function() {
            this.el.addEventListener('click', onObjectSelect);
        },
        tick: function(time, timeDelta) {
            // console.log(time + ', ' + timeDelta);
            // console.log(camera.getAttribute('rotation'));
        }
    });
}

function loadRoom(data) {
    var bgSrc = data.bgSrc;
    var objects = data.objects;
}

function createPrimitive(shape) {
    if (!PRIMITIVE_DEFINITIONS.includes(shape)) {
        console.log('Not valid shape:' + shape);
        return;
    }
    newObject('primitive', shape);
}

function createObject(type) {
    if (!OBJECT_DEFINITIONS.includes(type)) {
        console.log('Not valid type:' + type);
        return;
    }
    newObject(type, 'plane');
}

function makeArrayAsString() {
    var result = "";
    for (var i = 0; i < arguments.length - 1; ++i) {
        result += arguments[i] + ", ";
    }
    result += arguments[arguments.length - 1];
    return result;
}

function onObjectSelect() {
    hideBorder();
    nowClick = this;
    currentSelectedObject = obj.Controller.findByEl(this);
    if (editorMode) {
        shapeEl.innerHTML = currentSelectedObject.getShape();
        var position = currentSelectedObject.transform.position;
        positionEl.innerHTML = makeArrayAsString(
            util.floorTwo(position.x),
            util.floorTwo(position.y),
            util.floorTwo(position.z));
        var rotation = currentSelectedObject.transform.rotation;
        rotationEl.innerHTML = makeArrayAsString(
            util.floorTwo(rotation.x),
            util.floorTwo(rotation.y));
        scale = currentSelectedObject.transform.scale;
        scaleEl.innerHTML = makeArrayAsString(scale.x, scale.y, scale.z);
        showObjectBorder();
    } else {
        // Execute events assigned to object.
        for (var i = 0; i < currentSelectedObject.eventList.length; ++i) {
            var event = currentSelectedObject.eventList[i];
            var eventType = event['type'];
            var func = EVENT_DICTIONARY[eventType];
            var arg = event['arg'];
            func(arg);
        }
    }
}

function onObjectUnselect() {
    currentSelectedObject = null;
    shapeEl.innerHTML = "";
    positionEl.innerHTML = "";
    rotationEl.innerHTML = "";
    scaleEl.innerHTML = "";
}

function newObject(type, shape, position, rotation, scale) {
    var tag = 'a-' + shape;
    var newEl = mainFrame.document.createElement(tag);
    var newObj = new obj.Objct(newEl);

    newObj.type = type;
    newObj.shape = shape;
    position = util.getForwardPostion(camera.getAttribute('rotation'));
    newObj.setPosition(position);
    rotation = camera.getAttribute('rotation');
    newObj.setRotation(rotation);
    scale = { x: 2, y: 2, z: 1 };
    newObj.setScale(scale);

    if (shape == 'image') {
      /*
        why??
        util.getImageSize("http://i.imgur.com/fHyEMsl.jpg", function() {
            newObj.setScale({ x: 1, y: this.height / this.width });
        });
      */
        newObj.setMaterial({ 'src': "http://i.imgur.com/fHyEMsl.jpg" });
    } else {
        newObj.setMaterial({ 'color': util.getRandomHexColor() });
    }
    newObj.setClickListener(OBJECT_LISTENER);
    newObj.eventList = [];
    newObj.eventList.push({ 'type': type, 'arg': 'bg1.jpg' });
    scene.appendChild(newEl);
}

function createBorder(id, transform, material){
  var newEl = mainFrame.document.createElement('a-image');
  var newObj = new obj.Objct(newEl);

  newObj.type = 'primitive';
  newObj.shape = 'image';
  newObj.setPosition(transform.position);
  newObj.setRotation(transform.rotation);
  var scale = { x: 0.1, y: 0.1, z: 1 };
  newObj.setScale(scale);
  /*
  util.getImageSize(material.src, function() {
      newObj.setScale({ x: 0.1, y: this.height / this.width });
  });*/
  newObj.setMaterial(material);

  //scene.appendChild(newEl);
  nowClick.appendChild(newEl);

  newEl.setAttribute('id', id);
  newEl.addEventListener('mousedown', function (evt) {
    var pos = this.getAttribute('position');
    console.log('click : ' + util.floorTwo(pos.x) + ", " + util.floorTwo(pos.y) + ", " + util.floorTwo(pos.z));
  });
  console.log('create ' + util.floorTwo(transform.position.x) + ", " + util.floorTwo(transform.position.y) + ", " + util.floorTwo(transform.position.z));
  borderList.push(newEl);
}

function hideBorder(){
  if(nowClick!=null){
    for(var i=0; i<borderList.length; i++)
      nowClick.removeChild(borderList[i]);

    borderList = [];
  }
}

function showObjectBorder(){
  console.log("now Click : " + nowClick);
  console.log("scene : "  + scene);
  var position = currentSelectedObject.transform.position;
  var rotation = currentSelectedObject.transform.rotation;
  var scale = currentSelectedObject.transform.scale;
  var material = { 'src':"http://i.imgur.com/fHyEMsl.jpg"};

  // position now working
  var leftTop = {
    position: {x:-scale.x/2, y:+scale.y/2, z:position.z},
    rotation: { x: 0, y: 0, z: 0}
  };
  var leftBottom = {
    position: {x:-scale.x/2, y:-scale.y/2, z:position.z},
    rotation: { x: rotation.x, y: rotation.y, z: rotation.z}
  };
  var rightTop = {
    position: {x:scale.x/2, y:+scale.y/2, z:position.z},
    rotation: { x: rotation.x, y: rotation.y, z: rotation.z}
  };
  var rightBottom = {
    position: {x:scale.x/2, y:-scale.y/2, z:position.z},
    rotation: { x: rotation.x, y: rotation.y, z: rotation.z}
  };

  createBorder('leftTop', leftTop, material);
  createBorder('leftBottom', leftBottom, material);
  createImage('rightTop', rightTop, material);
  createImage('rightBottom', rightBottom, material);
}

function teleportEvent(arg) {
    console.log('teleport! to:' + arg);
    var imageUrl = BACKGROUND_PREFIX + arg;
    background.setAttribute('src', imageUrl);
}

function loadObjectsFromJson(json) {
    var objects = obj.Controller.objectsFromJson(json);
    for (var i = 0; i < objects.length; ++i) {
        var el = obj.Controller.createElFromObj(mainFrame, objects[i]);
        scene.appendChild(el);
    }
}

},{"./object.js":6,"./util.js":7,"util":4}],6:[function(require,module,exports){
var objects = [];

function Objct(el, obj) {
    this.el = el;
    this.type = "";
    this.shape = "";
    this.transform = {};
    this.material = {};

    this.clickListener = "";
    this.eventList = [];

    // copy all properties of obj to this
    for (var prop in obj) {
        this[prop] = obj[prop];
    }

    objects.push(this);
}

Objct.prototype.getShape = function() {
    if (this.el)
        return this.el.getAttribute('geometry').primitive;
    else
        return this.shape;
}

Objct.prototype.setPosition = function(newPosition) {
    if (this.el)
        this.el.setAttribute('position', newPosition);
    this.transform.position = newPosition;
}

Objct.prototype.setRotation = function(newRotation) {
    if (this.el)
        this.el.setAttribute('rotation', newRotation);
    this.transform.rotation = newRotation;
}

Objct.prototype.setScale = function(newScale) {
    if (this.el)
        this.el.setAttribute('scale', newScale);
    this.transform.scale = newScale;
}

Objct.prototype.setMaterial = function(newMaterial) {
    this.material = newMaterial;
    for (var key in newMaterial) {
        this.el.setAttribute(key, newMaterial[key]);
    }
}

Objct.prototype.setClickListener = function(listener) {
    if (this.el)
        this.el.setAttribute(listener, "");
    this.clickListener = listener;
}

Objct.prototype.toObj = function() {
    return null;
}

Objct.prototype.getSaveForm = function() {
    var tmp = this.el;
    this.el = null;
    var copyObj = JSON.parse(JSON.stringify(this));
    this.el = tmp;
    return copyObj;
}

function Controller() {}

Controller.prototype.objectsFromJson = function(json) {
    var loadedObjects;
    loadedObjects = JSON.parse(json);
    // console.log(loadedObjects);
    var loadedObjectsWithPrototype = [];
    for (var i = 0; i < loadedObjects.length; ++i) {
        var newObj = new Objct(null, loadedObjects[i]);
        // console.log(loadedObjects[i]);
        // console.log(newObj);
        loadedObjectsWithPrototype.push(newObj);
    }
    return loadedObjectsWithPrototype;
}

Controller.prototype.objectsToJson = function() {
    var saveObjects = [];
    for (var i = 0; i < objects.length; ++i) {
        saveObjects.push(objects[i].getSaveForm());
    }
    var json = JSON.stringify(saveObjects);
    return json;
}

Controller.prototype.createElFromObj = function(frame, obj) {
    var newEl = frame.document.createElement("a-" + obj.shape);
    obj.el = newEl;
    obj.setPosition(obj.transform.position);
    obj.setRotation(obj.transform.rotation);
    obj.setScale(obj.transform.scale);
    obj.setMaterial(obj.material);
    obj.setClickListener(obj.clickListener);

    return newEl;
}

Controller.prototype.getNum = function() {
    return objects.length;
}

Controller.prototype.remove = function(obj) {
    if (obj.el) {
        obj.el.parentElement.removeChild(obj.el);
    }
}

Controller.prototype.findByEl = function(el) {
    var objs = objects.filter(function(obj) {
        return obj.el == el;
    });
    return objs[0];
}

module.exports = {
    Objct: Objct,
    Controller: new Controller()
};

},{}],7:[function(require,module,exports){
function getRandomIntRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

module.exports.getRandomHexColor = function() {
    var color = "#";
    for (var i = 0; i < 6; ++i) {
        var randomCode1 = getRandomIntRange("A".charCodeAt(0), "F".charCodeAt(0));
        var randomCode2 = getRandomIntRange("0".charCodeAt(0), "9".charCodeAt(0));
        var randomSelect = getRandomIntRange(0, 1);
        color += String.fromCharCode((randomSelect) ? randomCode1 : randomCode2);
    }
    return color;
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function toAngle(radians) {
    return radians * (180 / Math.PI);
}

module.exports.getForwardPostion = function(rotation) {
    var cameraRotation = rotation;
    var yaw = -toRadians(cameraRotation.y - 90);
    var pitch = -toRadians(cameraRotation.x);
    var radius = -6;
    var x = radius * Math.cos(yaw) * Math.cos(pitch);
    var y = radius * Math.sin(pitch);
    var z = radius * Math.sin(yaw) * Math.cos(pitch);

    return { x: x, y: y, z: z };
}

module.exports.floorTwo = function(val) {
    return Math.round(val * 100) / 100;
}

module.exports.getImageSize = function(url, callback) {
    var img = new Image();
    img.onload = callback;
    img.src = url;
}

},{}]},{},[5]);
