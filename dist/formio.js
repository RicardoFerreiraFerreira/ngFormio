(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
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
    var timeout = setTimeout(cleanUpNextTick);
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
    clearTimeout(timeout);
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
        setTimeout(drainQueue, 0);
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
module.exports = {
  /**
   * Iterate through each component within a form.
   * @param components
   * @param fn
   */
  eachComponent: function eachComponent(components, fn) {
    if (!components) return;

    components.forEach(function(component) {
      if (component.columns && Array.isArray(component.columns)) {
        component.columns.forEach(function(column) {
          eachComponent(column.components, fn);
        });
      }

      else if (component.rows && Array.isArray(component.rows)) {
        [].concat.apply([], component.rows).forEach(function(row) {
          eachComponent(row.components, fn);
        });
      }

      else if (component.components && Array.isArray(component.components)) {
        eachComponent(component.components, fn);
      }

      else {
        fn(component);
      }
      // If the component is a tree, be sure to add it back in as well.
      if (component.tree) {
        fn(component);
      }
    });
  },

  /**
   * Get a component by its key
   * @param components
   * @param key The key of the component to get
   * @returns The component that matches the given key, or undefined if not found.
   */
  getComponent: function getComponent(components, key) {
    var result;
    module.exports.eachComponent(components, function(component) {
      if (component.key === key) {
        result = component;
      }
    });
    return result;
  },

  /**
   * Flatten the form components for data manipulation.
   * @param components
   * @param flattened
   * @returns {*|{}}
   */
  flattenComponents: function flattenComponents(components) {
    var flattened = {};
    module.exports.eachComponent(components, function(component) {
      flattened[component.key] = component;
    });
    return flattened;
  }
};

},{}],3:[function(require,module,exports){
(function (process){
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object" && typeof module === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else if (typeof window !== "undefined" || typeof self !== "undefined") {
        // Prefer window over self for add-on scripts. Use self for
        // non-windowed contexts.
        var global = typeof window !== "undefined" ? window : self;

        // Get the `window` object, save the previous Q global
        // and initialize Q as a global.
        var previousQ = global.Q;
        global.Q = definition();

        // Add a noConflict function so Q can be removed from the
        // global namespace.
        global.Q.noConflict = function () {
            global.Q = previousQ;
            return this;
        };

    } else {
        throw new Error("This environment was not anticipated by Q. Please file a bug.");
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;
    // queue for late tasks, used by unhandled rejection tracking
    var laterQueue = [];

    function flush() {
        /* jshint loopfunc: true */
        var task, domain;

        while (head.next) {
            head = head.next;
            task = head.task;
            head.task = void 0;
            domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }
            runSingle(task, domain);

        }
        while (laterQueue.length) {
            task = laterQueue.pop();
            runSingle(task);
        }
        flushing = false;
    }
    // runs a single function in the async queue
    function runSingle(task, domain) {
        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function () {
                    throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process === "object" &&
        process.toString() === "[object process]" && process.nextTick) {
        // Ensure Q is in a real Node environment, with a `process.nextTick`.
        // To see through fake Node environments:
        // * Mocha test runner - exposes a `process` global without a `nextTick`
        // * Browserify - exposes a `process.nexTick` function that uses
        //   `setTimeout`. In this case `setImmediate` is preferred because
        //    it is faster. Browserify's `process.toString()` yields
        //   "[object Object]", while in a real Node environment
        //   `process.nextTick()` yields "[object process]".
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }
    // runs a task after all other tasks have been run
    // this is useful for unhandled rejection tracking that needs to happen
    // after all `then`d tasks have been run.
    nextTick.runAfter = function (task) {
        laterQueue.push(task);
        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };
    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            Q.nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            Q.nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become settled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be settled
 */
Q.race = race;
function race(answerPs) {
    return promise(function (resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function (answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
};

/**
 * Works almost like "finally", but not called for rejections.
 * Original resolution value is passed through callback unaffected.
 * Callback may return a promise that will be awaited for.
 * @param {Function} callback
 * @returns {Q.Promise}
 * @example
 * doSomething()
 *   .then(...)
 *   .tap(console.log)
 *   .then(...);
 */
Promise.prototype.tap = function (callback) {
    callback = Q(callback);

    return this.then(function (value) {
        return callback.fcall(value).thenResolve(value);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var reportedUnhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }
    if (typeof process === "object" && typeof process.emit === "function") {
        Q.nextTick.runAfter(function () {
            if (array_indexOf(unhandledRejections, promise) !== -1) {
                process.emit("unhandledRejection", reason, promise);
                reportedUnhandledRejections.push(promise);
            }
        });
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        if (typeof process === "object" && typeof process.emit === "function") {
            Q.nextTick.runAfter(function () {
                var atReport = array_indexOf(reportedUnhandledRejections, promise);
                if (atReport !== -1) {
                    process.emit("rejectionHandled", unhandledReasons[at], promise);
                    reportedUnhandledRejections.splice(atReport, 1);
                }
            });
        }
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return Q(result.value);
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return Q(exception.value);
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var pendingCount = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++pendingCount;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--pendingCount === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (pendingCount === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Returns the first resolved promise of an array. Prior rejected promises are
 * ignored.  Rejects only if all promises are rejected.
 * @param {Array*} an array containing values or promises for values
 * @returns a promise fulfilled with the value of the first resolved promise,
 * or a rejected promise if all promises are rejected.
 */
Q.any = any;

function any(promises) {
    if (promises.length === 0) {
        return Q.resolve();
    }

    var deferred = Q.defer();
    var pendingCount = 0;
    array_reduce(promises, function (prev, current, index) {
        var promise = promises[index];

        pendingCount++;

        when(promise, onFulfilled, onRejected, onProgress);
        function onFulfilled(result) {
            deferred.resolve(result);
        }
        function onRejected() {
            pendingCount--;
            if (pendingCount === 0) {
                deferred.reject(new Error(
                    "Can't get fulfillment value from any promise, all " +
                    "promises were rejected."
                ));
            }
        }
        function onProgress(progress) {
            deferred.notify({
                index: index,
                value: progress
            });
        }
    }, undefined);

    return deferred.promise;
}

Promise.prototype.any = function () {
    return any(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        Q.nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {Any*} custom error message or Error object (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
};

Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        if (!error || "string" === typeof error) {
            error = new Error(error || "Timed out after " + ms + " ms");
            error.code = "ETIMEDOUT";
        }
        deferred.reject(error);
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            Q.nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            Q.nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

Q.noConflict = function() {
    throw new Error("Q.noConflict only works when Q is used as a global");
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

}).call(this,require('_process'))

},{"_process":1}],4:[function(require,module,exports){
/*!
 * EventEmitter2
 * https://github.com/hij1nx/EventEmitter2
 *
 * Copyright (c) 2013 hij1nx
 * Licensed under the MIT license.
 */
;!function(undefined) {

  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {

      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      conf.maxListeners && (this._events.maxListeners = conf.maxListeners);
      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this.newListener = conf.newListener);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this.newListener = false;
    configure.call(this, conf);
  }

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
        typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      if (typeof tree._listeners === 'function') {
        handlers && handlers.push(tree._listeners);
        return [tree];
      } else {
        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
          handlers && handlers.push(tree._listeners[leaf]);
        }
        return [tree];
      }
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners) {
          // The next element has a _listeners, add it to the handlers.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            if(branch === '*' || branch === '**') {
              if(tree[branch]._listeners && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if(branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(branch in xxTree) {
          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(var i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    var tree = this.listenerTree;
    var name = type.shift();

    while (name) {

      if (!tree[name]) {
        tree[name] = {};
      }

      tree = tree[name];

      if (type.length === 0) {

        if (!tree._listeners) {
          tree._listeners = listener;
        }
        else if(typeof tree._listeners === 'function') {
          tree._listeners = [tree._listeners, listener];
        }
        else if (isArray(tree._listeners)) {

          tree._listeners.push(listener);

          if (!tree._listeners.warned) {

            var m = defaultMaxListeners;

            if (typeof this._events.maxListeners !== 'undefined') {
              m = this._events.maxListeners;
            }

            if (m > 0 && tree._listeners.length > m) {

              tree._listeners.warned = true;
              console.error('(node) warning: possible EventEmitter memory ' +
                            'leak detected. %d listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit.',
                            tree._listeners.length);
              console.trace();
            }
          }
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    this._events || init.call(this);
    this._events.maxListeners = n;
    if (!this._conf) this._conf = {};
    this._conf.maxListeners = n;
  };

  EventEmitter.prototype.event = '';

  EventEmitter.prototype.once = function(event, fn) {
    this.many(event, 1, fn);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    var self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      fn.apply(this, arguments);
    }

    listener._origin = fn;

    this.on(event, listener);

    return self;
  };

  EventEmitter.prototype.emit = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) { return false; }
    }

    // Loop through the *_all* functions and invoke them.
    if (this._all) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type;
        this._all[i].apply(this, args);
      }
    }

    // If there is no 'error' event listener then throw.
    if (type === 'error') {

      if (!this._all &&
        !this._events.error &&
        !(this.wildcard && this.listenerTree.error)) {

        if (arguments[1] instanceof Error) {
          throw arguments[1]; // Unhandled 'error' event
        } else {
          throw new Error("Uncaught, unspecified 'error' event.");
        }
        return false;
      }
    }

    var handler;

    if(this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    }
    else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      if (arguments.length === 1) {
        handler.call(this);
      }
      else if (arguments.length > 1)
        switch (arguments.length) {
          case 2:
            handler.call(this, arguments[1]);
            break;
          case 3:
            handler.call(this, arguments[1], arguments[2]);
            break;
          // slower
          default:
            var l = arguments.length;
            var args = new Array(l - 1);
            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
            handler.apply(this, args);
        }
      return true;
    }
    else if (handler) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

      var listeners = handler.slice();
      for (var i = 0, l = listeners.length; i < l; i++) {
        this.event = type;
        listeners[i].apply(this, args);
      }
      return (listeners.length > 0) || !!this._all;
    }
    else {
      return !!this._all;
    }

  };

  EventEmitter.prototype.on = function(type, listener) {

    if (typeof type === 'function') {
      this.onAny(type);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if(this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    }
    else if(typeof this._events[type] === 'function') {
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];
    }
    else if (isArray(this._events[type])) {
      // If we've already got an array, just append.
      this._events[type].push(listener);

      // Check for listener leak
      if (!this._events[type].warned) {

        var m = defaultMaxListeners;

        if (typeof this._events.maxListeners !== 'undefined') {
          m = this._events.maxListeners;
        }

        if (m > 0 && this._events[type].length > m) {

          this._events[type].warned = true;
          console.error('(node) warning: possible EventEmitter memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitter.setMaxListeners() to increase limit.',
                        this._events[type].length);
          console.trace();
        }
      }
    }
    return this;
  };

  EventEmitter.prototype.onAny = function(fn) {

    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    if(!this._all) {
      this._all = [];
    }

    // Add the function to the event listener collection.
    this._all.push(fn);
    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    var handlers,leafs=[];

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners:handlers});
    }

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      handlers = leaf._listeners;
      if (isArray(handlers)) {

        var position = -1;

        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }

        if (position < 0) {
          continue;
        }

        if(this.wildcard) {
          leaf._listeners.splice(position, 1);
        }
        else {
          this._events[type].splice(position, 1);
        }

        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }
        return this;
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }
      }
    }

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    var i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          return this;
        }
      }
    } else {
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      !this._events || init.call(this);
      return this;
    }

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
        var leaf = leafs[iLeaf];
        leaf._listeners = null;
      }
    }
    else {
      if (!this._events[type]) return this;
      this._events[type] = null;
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if(this.wildcard) {
      var handlers = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (typeof define === 'function' && define.amd) {
     // AMD. Register as an anonymous module.
    define(function() {
      return EventEmitter;
    });
  } else if (typeof exports === 'object') {
    // CommonJS
    exports.EventEmitter2 = EventEmitter;
  }
  else {
    // Browser global.
    window.EventEmitter2 = EventEmitter;
  }
}();

},{}],5:[function(require,module,exports){
module.exports = function (obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    var copy;
    
    if (isArray(obj)) {
        var len = obj.length;
        copy = Array(len);
        for (var i = 0; i < len; i++) {
            copy[i] = obj[i];
        }
    }
    else {
        var keys = objectKeys(obj);
        copy = {};
        
        for (var i = 0, l = keys.length; i < l; i++) {
            var key = keys[i];
            copy[key] = obj[key];
        }
    }
    return copy;
};

var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) {
        if ({}.hasOwnProperty.call(obj, key)) keys.push(key);
    }
    return keys;
};

var isArray = Array.isArray || function (xs) {
    return {}.toString.call(xs) === '[object Array]';
};

},{}],6:[function(require,module,exports){
(function() {
  'use strict';

  if (self.fetch) {
    return
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = name.toString();
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = value.toString();
    }
    return value
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self
  }

  function Body() {
    this.bodyUsed = false


    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (!body) {
        this._bodyText = ''
      } else {
        throw new Error('unsupported BodyInit type')
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(url, options) {
    options = options || {}
    this.url = url

    this.credentials = options.credentials || 'omit'
    this.headers = new Headers(options.headers)
    this.method = normalizeMethod(options.method || 'GET')
    this.mode = options.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && options.body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(options.body)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this._initBody(bodyInit)
    this.type = 'default'
    this.url = null
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
  }

  Body.call(Response.prototype)

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    // TODO: Request constructor should accept input, init
    var request
    if (Request.prototype.isPrototypeOf(input) && !init) {
      request = input
    } else {
      request = new Request(input, init)
    }

    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return;
      }

      xhr.onload = function() {
        var status = (xhr.status === 1223) ? 204 : xhr.status
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'))
          return
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})();

},{}],7:[function(require,module,exports){
'use strict';

require('whatwg-fetch');
var Q = require('Q');
var EventEmitter = require('eventemitter2').EventEmitter2;
var copy = require('shallow-copy');

// The default base url.
var baseUrl = '';

var plugins = [];

// The temporary GET request cache storage
var cache = {};

var noop = function(){};
var identity = function(value) { return value; };

// Will invoke a function on all plugins.
// Returns a promise that resolves when all promises
// returned by the plugins have resolved.
// Should be used when you want plugins to prepare for an event
// but don't want any data returned.
var pluginWait = function(pluginFn) {
  var args = [].slice.call(arguments, 1);
  return Q.all(plugins.map(function(plugin) {
    return (plugin[pluginFn] || noop).apply(plugin, args);
  }));
};

// Will invoke a function on plugins from highest priority
// to lowest until one returns a value. Returns null if no
// plugins return a value.
// Should be used when you want just one plugin to handle things.
var pluginGet = function(pluginFn) {
  var args = [].slice.call(arguments, 0);
  var callPlugin = function(index, pluginFn) {
    var plugin = plugins[index];
    if (!plugin) return Q(null);
    return Q((plugin && plugin[pluginFn] || noop).apply(plugin, [].slice.call(arguments, 2)))
    .then(function(result) {
      if (result !== null && result !== undefined) return result;
      return callPlugin.apply(null, [index + 1].concat(args));
    });
  };
  return callPlugin.apply(null, [0].concat(args));
};

// Will invoke a function on plugins from highest priority to
// lowest, building a promise chain from their return values
// Should be used when all plugins need to process a promise's
// success or failure
var pluginAlter = function(pluginFn, value) {
  var args = [].slice.call(arguments, 2);
  return plugins.reduce(function(value, plugin) {
      return (plugin[pluginFn] || identity).apply(plugin, [value].concat(args));
  }, value);
};


/**
 * Returns parts of the URL that are important.
 * Indexes
 *  - 0: The full url
 *  - 1: The protocol
 *  - 2: The hostname
 *  - 3: The rest
 *
 * @param url
 * @returns {*}
 */
var getUrlParts = function(url) {
  return url.match(/^(http[s]?:\/\/)([^/]+)($|\/.*)/);
};

var serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
};

// The formio class.
var Formio = function(path) {

  // Ensure we have an instance of Formio.
  if (!(this instanceof Formio)) { return new Formio(path); }
  if (!path) {
    // Allow user to create new projects if this was instantiated without
    // a url
    this.projectUrl = baseUrl + '/project';
    this.projectsUrl = baseUrl + '/project';
    this.projectId = false;
    this.query = '';
    return;
  }

  // Initialize our variables.
  this.projectsUrl = '';
  this.projectUrl = '';
  this.projectId = '';
  this.formUrl = '';
  this.formsUrl = '';
  this.formId = '';
  this.submissionsUrl = '';
  this.submissionUrl = '';
  this.submissionId = '';
  this.actionsUrl = '';
  this.actionId = '';
  this.actionUrl = '';
  this.query = '';

  // Normalize to an absolute path.
  if ((path.indexOf('http') !== 0) && (path.indexOf('//') !== 0)) {
    baseUrl = baseUrl ? baseUrl : window.location.href.match(/http[s]?:\/\/api./)[0];
    path = baseUrl + path;
  }

  var hostparts = getUrlParts(path);
  var parts = [];
  var hostName = hostparts[1] + hostparts[2];
  path = hostparts.length > 3 ? hostparts[3] : '';
  var queryparts = path.split('?');
  if (queryparts.length > 1) {
    path = queryparts[0];
    this.query = '?' + queryparts[1];
  }

  // See if this is a form path.
  if ((path.search(/(^|\/)(form|project)($|\/)/) !== -1)) {

    // Register a specific path.
    var registerPath = function(name, base) {
      this[name + 'sUrl'] = base + '/' + name;
      var regex = new RegExp('\/' + name + '\/([^/]+)');
      if (path.search(regex) !== -1) {
        parts = path.match(regex);
        this[name + 'Url'] = parts ? (base + parts[0]) : '';
        this[name + 'Id'] = (parts.length > 1) ? parts[1] : '';
        base += parts[0];
      }
      return base;
    }.bind(this);

    // Register an array of items.
    var registerItems = function(items, base, staticBase) {
      for (var i in items) {
        if (items.hasOwnProperty(i)) {
          var item = items[i];
          if (item instanceof Array) {
            registerItems(item, base, true);
          }
          else {
            var newBase = registerPath(item, base);
            base = staticBase ? base : newBase;
          }
        }
      }
    };

    registerItems(['project', 'form', ['submission', 'action']], hostName);

    if (!this.projectId) {
      if (hostparts.length > 2 && hostparts[2].split('.').length > 2) {
        this.projectUrl = hostName;
        this.projectId = hostparts[2].split('.')[0];
      }
    }
  }
  else {

    // This is an aliased url.
    this.projectUrl = hostName;
    this.projectId = (hostparts.length > 2) ? hostparts[2].split('.')[0] : '';
    var subRegEx = new RegExp('\/(submission|action)($|\/.*)');
    var subs = path.match(subRegEx);
    this.pathType = (subs && (subs.length > 1)) ? subs[1] : '';
    path = path.replace(subRegEx, '');
    path = path.replace(/\/$/, '');
    this.formsUrl = hostName + '/form';
    this.formUrl = hostName + path;
    this.formId = path.replace(/^\/+|\/+$/g, '');
    var items = ['submission', 'action'];
    for (var i in items) {
      if (items.hasOwnProperty(i)) {
        var item = items[i];
        this[item + 'sUrl'] = hostName + path + '/' + item;
        if ((this.pathType === item) && (subs.length > 2) && subs[2]) {
          this[item + 'Id'] = subs[2].replace(/^\/+|\/+$/g, '');
          this[item + 'Url'] = hostName + path + subs[0];
        }
      }
    }
  }
};

/**
 * Load a resource.
 *
 * @param type
 * @returns {Function}
 * @private
 */
var _load = function(type) {
  var _id = type + 'Id';
  var _url = type + 'Url';
  return function(query, opts) {
    if (query && typeof query === 'object') {
      query = serialize(query.params);
    }
    if (query) {
      query = this.query ? (this.query + '&' + query) : ('?' + query);
    }
    else {
      query = this.query;
    }
    if (!this[_id]) { return Q.reject('Missing ' + _id); }
    return this.makeRequest(type, this[_url] + query, 'get', null, opts);
  };
};

/**
 * Save a resource.
 *
 * @param type
 * @returns {Function}
 * @private
 */
var _save = function(type) {
  var _id = type + 'Id';
  var _url = type + 'Url';
  return function(data, opts) {
    var method = this[_id] ? 'put' : 'post';
    var reqUrl = this[_id] ? this[_url] : this[type + 'sUrl'];
    cache = {};
    return this.makeRequest(type, reqUrl + this.query, method, data, opts);
  };
};

/**
 * Delete a resource.
 *
 * @param type
 * @returns {Function}
 * @private
 */
var _delete = function(type) {
  var _id = type + 'Id';
  var _url = type + 'Url';
  return function(opts) {
    if (!this[_id]) { Q.reject('Nothing to delete'); }
    cache = {};
    return this.makeRequest(type, this[_url], 'delete', null, opts);
  };
};

/**
 * Resource index method.
 *
 * @param type
 * @returns {Function}
 * @private
 */
var _index = function(type) {
  var _url = type + 'Url';
  return function(query, opts) {
    query = query || '';
    if (query && typeof query === 'object') {
      query = '?' + serialize(query.params);
    }
    return this.makeRequest(type, this[_url] + query, 'get', null, opts);
  };
};

// Activates plugin hooks, makes Formio.request if no plugin provides a request
Formio.prototype.makeRequest = function(type, url, method, data, opts) {
  var self = this;
  method = (method || 'GET').toUpperCase();
  if(!opts || typeof opts !== 'object') {
    opts = {};
  }

  var requestArgs = {
    formio: self,
    type: type,
    url: url,
    method: method,
    data: data,
    opts: opts
  };

  var request = pluginWait('preRequest', requestArgs)
  .then(function() {
    return pluginGet('request', requestArgs)
    .then(function(result) {
      if (result === null || result === undefined) {
        return Formio.request(url, method, data);
      }
      return result;
    });
  });

  return pluginAlter('wrapRequestPromise', request, requestArgs);
};

// Define specific CRUD methods.
Formio.prototype.loadProject = _load('project');
Formio.prototype.saveProject = _save('project');
Formio.prototype.deleteProject = _delete('project');
Formio.prototype.loadForm = _load('form');
Formio.prototype.saveForm = _save('form');
Formio.prototype.deleteForm = _delete('form');
Formio.prototype.loadForms = _index('forms');
Formio.prototype.loadSubmission = _load('submission');
Formio.prototype.saveSubmission = _save('submission');
Formio.prototype.deleteSubmission = _delete('submission');
Formio.prototype.loadSubmissions = _index('submissions');
Formio.prototype.loadAction = _load('action');
Formio.prototype.saveAction = _save('action');
Formio.prototype.deleteAction = _delete('action');
Formio.prototype.loadActions = _index('actions');
Formio.prototype.availableActions = function() { return this.makeRequest('availableActions', this.formUrl + '/actions'); };
Formio.prototype.actionInfo = function(name) { return this.makeRequest('actionInfo', this.formUrl + '/actions/' + name); };

Formio.makeStaticRequest = function(url, method, data) {
  var self = this;
  method = (method || 'GET').toUpperCase();

  var requestArgs = {
    url: url,
    method: method,
    data: data
  };

  var request = pluginWait('preStaticRequest', requestArgs)
  .then(function() {
    return pluginGet('staticRequest', requestArgs)
    .then(function(result) {
      if (result === null || result === undefined) {
        return Formio.request(url, method, data);
      }
      return result;
    });
  });

  return pluginAlter('wrapStaticRequestPromise', request, requestArgs);
};

// Static methods.
Formio.loadProjects = function(query) {
  query = query || '';
  if (typeof query === 'object') {
    query = '?' + serialize(query.params);
  }
  return this.makeStaticRequest(baseUrl + '/project' + query);
};
Formio.request = function(url, method, data) {
  if (!url) { return Q.reject('No url provided'); }
  method = (method || 'GET').toUpperCase();
  var cacheKey = btoa(url);

  return Q().then(function() {
    // Get the cached promise to save multiple loads.
    if (method === 'GET' && cache.hasOwnProperty(cacheKey)) {
      return cache[cacheKey];
    }
    else {
      return Q()
      .then(function() {
        // Set up and fetch request
        var headers = new Headers({
          'Accept': 'application/json',
          'Content-type': 'application/json; charset=UTF-8'
        });
        var token = Formio.getToken();
        if (token) {
          headers.append('x-jwt-token', token);
        }

        var options = {
          method: method,
          headers: headers,
          mode: 'cors'
        };
        if (data) {
          options.body = JSON.stringify(data);
        }

        return fetch(url, options);
      })
      .catch(function(err) {
        err.message = 'Could not connect to API server (' + err.message + ')';
        err.networkError = true;
        throw err;
      })
      .then(function(response) {
        // Handle fetch results
        if (response.ok) {
          var token = response.headers.get('x-jwt-token');
          if (response.status >= 200 && response.status < 300 && token && token !== '') {
            Formio.setToken(token);
          }
          // 204 is no content. Don't try to .json() it.
          if (response.status === 204) {
            return {};
          }
          return (response.headers.get('content-type').indexOf('application/json') !== -1 ?
            response.json() : response.text())
          .then(function(result) {
            // Add some content-range metadata to the result here
            var range = response.headers.get('content-range');
            if (range && typeof result === 'object') {
              range = range.split('/');
              if(range[0] !== '*') {
                var skipLimit = range[0].split('-');
                result.skip = Number(skipLimit[0]);
                result.limit = skipLimit[1] - skipLimit[0] + 1;
              }
              result.serverCount = range[1] === '*' ? range[1] : Number(range[1]);
            }
            return result;
          });
        }
        else {
          if (response.status === 440) {
            Formio.setToken(null);
          }
          // Parse and return the error as a rejected promise to reject this promise
          return (response.headers.get('content-type').indexOf('application/json') !== -1 ?
            response.json() : response.text())
            .then(function(error){
              throw error;
            });
        }
      })
      .catch(function(err) {
        // Remove failed promises from cache
        delete cache[cacheKey];
        // Propagate error so client can handle accordingly
        throw err;
      });
    }
  })
  .then(function(result) {
    // Save the cache
    if (method === 'GET') {
      cache[cacheKey] = Q(result);
    }

    // Shallow copy result so modifications don't end up in cache
    if(Array.isArray(result)) {
      var resultCopy = result.map(copy);
      resultCopy.skip = result.skip;
      resultCopy.limit = result.limit;
      resultCopy.serverCount = result.serverCount;
      return resultCopy;
    }
    return copy(result);
  });
};

Formio.setToken = function(token) {
  token = token || '';
  if (token === this.token) { return; }
  this.token = token;
  if (!token) {
    Formio.setUser(null);
    return localStorage.removeItem('formioToken');
  }
  localStorage.setItem('formioToken', token);
  Formio.currentUser(); // Run this so user is updated if null
};
Formio.getToken = function() {
  if (this.token) { return this.token; }
  var token = localStorage.getItem('formioToken') || '';
  this.token = token;
  return token;
};
Formio.setUser = function(user) {
  if (!user) {
    this.setToken(null);
    return localStorage.removeItem('formioUser');
  }
  localStorage.setItem('formioUser', JSON.stringify(user));
};
Formio.getUser = function() {
  return JSON.parse(localStorage.getItem('formioUser') || null);
};

Formio.setBaseUrl = function(url) {
  baseUrl = url;
};
Formio.getBaseUrl = function() {
  return baseUrl;
}
Formio.clearCache = function() { cache = {}; };

Formio.currentUser = function() {
  var url = baseUrl + '/current';
  var user = this.getUser();
  if (user) {
    return pluginAlter('wrapStaticRequestPromise', Q(user), {
      url: url,
      method: 'GET'
    })
  }
  var token = this.getToken();
  if (!token) {
    return pluginAlter('wrapStaticRequestPromise', Q(null), {
      url: url,
      method: 'GET'
    })
  }
  return this.makeStaticRequest(url)
  .then(function(response) {
    Formio.setUser(response);
    return response;
  });
};

// Keep track of their logout callback.
Formio.logout = function() {
  return this.makeStaticRequest(baseUrl + '/logout').finally(function() {
    this.setToken(null);
    this.setUser(null);
    Formio.clearCache();
  }.bind(this));
};
Formio.fieldData = function(data, component) {
  if (!data) { return ''; }
  if (component.key.indexOf('.') !== -1) {
    var value = data;
    var parts = component.key.split('.');
    var key = '';
    for (var i = 0; i < parts.length; i++) {
      key = parts[i];

      // Handle nested resources
      if (value.hasOwnProperty('_id')) {
        value = value.data;
      }

      // Return if the key is not found on the value.
      if (!value.hasOwnProperty(key)) {
        return;
      }

      // Convert old single field data in submissions to multiple
      if (key === parts[parts.length - 1] && component.multiple && !Array.isArray(value[key])) {
        value[key] = [value[key]];
      }

      // Set the value of this key.
      value = value[key];
    }
    return value;
  }
  else {
    // Convert old single field data in submissions to multiple
    if (component.multiple && !Array.isArray(data[component.key])) {
      data[component.key] = [data[component.key]];
    }
    return data[component.key];
  }
};

/**
 * EventEmitter for Formio events.
 * See Node.js documentation for API documentation: https://nodejs.org/api/events.html
 */
Formio.events = new EventEmitter({
  wildcard: false,
  maxListeners: 0
});

/**
 * Register a plugin with Formio.js
 * @param plugin The plugin to register. See plugin documentation.
 * @param name   Optional name to later retrieve plugin with.
 */
Formio.registerPlugin = function(plugin, name) {
  plugins.push(plugin);
  plugins.sort(function(a, b) {
    return (b.priority || 0) - (a.priority || 0);
  });
  plugin.__name = name;
  (plugin.init || noop).call(plugin, Formio);
};

/**
 * Returns the plugin registered with the given name.
 */
Formio.getPlugin = function(name) {
  return plugins.reduce(function(result, plugin) {
    if (result) return result;
    if (plugin.__name === name) return plugin;
  }, null);
};

/**
 * Deregisters a plugin with Formio.js.
 * @param  plugin The instance or name of the plugin
 * @return true if deregistered, false otherwise
 */
Formio.deregisterPlugin = function(plugin) {
  var beforeLength = plugins.length;
  plugins = plugins.filter(function(p) {
    if(p !== plugin && p.__name !== plugin) return true;
    (p.deregister || noop).call(p, Formio);
    return false;
  });
  return beforeLength !== plugins.length;
};

module.exports = Formio;

},{"Q":3,"eventemitter2":4,"shallow-copy":5,"whatwg-fetch":6}],8:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  /*jshint camelcase: false */
  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('address', {
        title: 'Address',
        template: function ($scope) {
          return $scope.component.multiple ? 'formio/components/address-multiple.html' : 'formio/components/address.html';
        },
        controller: function (settings, $scope, $http) {
          $scope.address = {};
          $scope.addresses = [];
          $scope.refreshAddress = function (address) {
            var params = {address: address, sensor: false};
            return $http.get(
              'https://maps.googleapis.com/maps/api/geocode/json',
              {
                disableJWT: true,
                params: params,
                headers: {
                  Authorization: undefined,
                  Pragma: undefined,
                  'Cache-Control': undefined
                }
              }
            ).then(function (response) {
                $scope.addresses = response.data.results;
              });
          };
        },
        tableView: function (data) {
          return data ? data.formatted_address : '';
        },
        group: 'advanced',
        settings: {
          input: true,
          tableView: true,
          label: '',
          key: 'addressField',
          placeholder: '',
          multiple: false,
          protected: false,
          unique: false,
          persistent: true,
          validate: {
            required: false
          }
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('formio/components/address.html',
        "<label ng-if=\"component.label\" for=\"{{ component.key }}\" ng-class=\"{'field-required': component.validate.required}\">{{ component.label }}</label>\n<span ng-if=\"!component.label && component.validate.required\" class=\"glyphicon glyphicon-asterisk form-control-feedback field-required-inline\" aria-hidden=\"true\"></span>\n<ui-select ng-model=\"data[component.key]\" safe-multiple-to-single ng-disabled=\"readOnly\" ng-required=\"component.validate.required\" id=\"{{ component.key }}\" tabindex=\"{{ component.tabindex || 0 }}\" theme=\"bootstrap\">\n  <ui-select-match placeholder=\"{{ component.placeholder }}\">{{$item.formatted_address || $select.selected.formatted_address}}</ui-select-match>\n  <ui-select-choices repeat=\"address in addresses\" refresh=\"refreshAddress($select.search)\" refresh-delay=\"500\">\n    <div ng-bind-html=\"address.formatted_address | highlight: $select.search\"></div>\n  </ui-select-choices>\n</ui-select>\n"
      );

      // Change the ui-select to ui-select multiple.
      $templateCache.put('formio/components/address-multiple.html',
        $templateCache.get('formio/components/address.html').replace('<ui-select', '<ui-select multiple')
      );
    }
  ]);
};

},{}],9:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('button', {
        title: 'Button',
        template: 'formio/components/button.html',
        settings: {
          input: true,
          label: 'Submit',
          tableView: false,
          key: 'submit',
          size: 'md',
          leftIcon: '',
          rightIcon: '',
          block: false,
          action: 'submit',
          disableOnInvalid: true,
          theme: 'primary'
        },
        controller: function (settings, $scope) {
          $scope.onClick = function() {
            switch (settings.action) {
              case 'submit':
                return;
              case 'reset':
                $scope.resetForm();
                break;
              case 'oauth':
                if ($scope.hasOwnProperty('form')) {
                  if (!settings.oauth) {
                    $scope.showAlerts({
                      type: 'danger',
                      message: 'You must assign this button to an OAuth action before it will work.'
                    });
                    break;
                  }
                  if (settings.oauth.error) {
                    $scope.showAlerts({
                      type: 'danger',
                      message: settings.oauth.error
                    });
                    break;
                  }
                  $scope.openOAuth(settings.oauth);
                }
                break;
            }
          };

          $scope.openOAuth = function(settings) {
            var params = {
              response_type: 'code',
              client_id: settings.clientId,
              redirect_uri: window.location.origin || window.location.protocol + '//' + window.location.host,
              state: settings.state,
              scope: settings.scope
            };
            // Make display optional.
            if (settings.display) {
              params.display = settings.display;
            }
            params = Object.keys(params).map(function(key) {
              return key + '=' + encodeURIComponent(params[key]);
            }).join('&');

            var url = settings.authURI + '?' + params;

            // TODO: make window options from oauth settings, have better defaults
            var popup = window.open(url, settings.provider, 'width=1020,height=618');
            var interval = setInterval(function() {
              try {
                var popupHost = popup.location.host;
                var currentHost = window.location.host;
                if (popup && !popup.closed && popupHost === currentHost && popup.location.search) {
                  popup.close();
                  var params = popup.location.search.substr(1).split('&').reduce(function(params, param) {
                    var split = param.split('=');
                    params[split[0]] = split[1];
                    return params;
                  }, {});
                  if (params.error) {
                    $scope.showAlerts({
                      type: 'danger',
                      message: params.error_description || params.error
                    });
                    return;
                  }
                  // TODO: check for error response here
                  if (settings.state !== params.state) {
                    $scope.showAlerts({
                      type: 'danger',
                      message: 'OAuth state does not match. Please try logging in again.'
                    });
                    return;
                  }
                  var submission = {data: {}, oauth: {}};
                  submission.oauth[settings.provider] = params;
                  submission.oauth[settings.provider].redirectURI = window.location.origin || window.location.protocol + '//' + window.location.host;
                  $scope.form.submitting = true;
                  $scope.formio.saveSubmission(submission)
                  .then(function(submission) {
                    // Trigger the form submission.
                    $scope.$emit('formSubmission', submission);
                  })
                  .catch(function(error) {
                    $scope.showAlerts({
                      type: 'danger',
                      message: error.message || error
                    });
                  })
                  .finally(function() {
                    $scope.form.submitting = false;
                  });
                }
              }
              catch (error) {
                if (error.name !== 'SecurityError') {
                  $scope.showAlerts({
                    type: 'danger',
                    message: error.message || error
                  });
                }
              }
              if (!popup || popup.closed || popup.closed === undefined) {
                clearInterval(interval);
              }
            }, 100);
          };

        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('formio/components/button.html',
        "<button type=\"{{component.action == 'submit' || component.action == 'reset' ? component.action : 'button'}}\"\nng-class=\"{'btn-block': component.block}\"\nclass=\"btn btn-{{ component.theme }} btn-{{ component.size }}\"\nng-disabled=\"readOnly || form.submitting || (component.disableOnInvalid && form.$invalid)\"\ntabindex=\"{{ component.tabindex || 0 }}\"\nng-click=\"onClick()\">\n  <span ng-if=\"component.leftIcon\" class=\"{{ component.leftIcon }}\" aria-hidden=\"true\"></span>\n  <span ng-if=\"component.leftIcon && component.label\">&nbsp;</span>{{ component.label }}<span ng-if=\"component.rightIcon && component.label\">&nbsp;</span>\n  <span ng-if=\"component.rightIcon\" class=\"{{ component.rightIcon }}\" aria-hidden=\"true\"></span>\n   <i ng-if=\"component.action == 'submit' && form.submitting\" class=\"glyphicon glyphicon-refresh glyphicon-spin\"></i>\n</button>\n"
      );
    }
  ]);
};

},{}],10:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('checkbox', {
        title: 'Check Box',
        template: 'formio/components/checkbox.html',
        settings: {
          input: true,
          inputType: 'checkbox',
          tableView: true,
          // This hides the default label layout so we can use a special inline label
          hideLabel: true,
          label: '',
          key: 'checkboxField',
          defaultValue: false,
          protected: false,
          persistent: true,
          validate: {
            required: false
          }
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    'FormioUtils',
    function ($templateCache) {
      $templateCache.put('formio/components/checkbox.html',
        "<div class=\"checkbox\">\n  <label for=\"{{ component.key }}\" ng-class=\"{'field-required': component.validate.required}\">\n    <input type=\"{{ component.inputType }}\"\n    id=\"{{ component.key }}\"\n    name=\"{{ component.key }}\"\n    value=\"{{ component.key }}\"\n    tabindex=\"{{ component.tabindex || 0 }}\"\n    ng-disabled=\"readOnly\"\n    ng-model=\"data[component.key]\"\n    ng-required=\"component.validate.required\">\n    {{ component.label }}\n  </label>\n</div>\n"
      );
    }
  ]);
};

},{}],11:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('columns', {
        title: 'Columns',
        template: 'formio/components/columns.html',
        group: 'layout',
        settings: {
          input: false,
          columns: [{components: []}, {components: []}]
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('formio/components/columns.html',
        "<div class=\"row\">\n  <div class=\"col-xs-6\" ng-repeat=\"column in component.columns\">\n    <formio-component ng-repeat=\"component in column.components\" component=\"component\" data=\"data\" formio=\"formio\" read-only=\"readOnly\"></formio-component>\n  </div>\n</div>\n"
      );
    }
  ]);
};

},{}],12:[function(require,module,exports){
"use strict";
module.exports = function (app) {

  app.provider('formioComponents', function () {
    var components = {};
    var groups = {
      __component: {
        title: 'Basic Components'
      },
      advanced: {
        title: 'Special Components'
      },
      layout: {
        title: 'Layout Components'
      }
    };
    return {
      addGroup: function (name, group) {
        groups[name] = group;
      },
      register: function (type, component, group) {
        if (!components[type]) {
          components[type] = component;
        }
        else {
          angular.extend(components[type], component);
        }

        // Set the type for this component.
        if (!components[type].group) {
          components[type].group = group || '__component';
        }
        components[type].settings.type = type;
      },
      $get: function () {
        return {
          components: components,
          groups: groups
        };
      }
    };
  });

  app.directive('safeMultipleToSingle', [function () {
    return {
      require: 'ngModel',
      restrict: 'A',
      link: function ($scope, el, attrs, ngModel) {
        ngModel.$formatters.push(function (modelValue) {
          if (!$scope.component.multiple && Array.isArray(modelValue)) {
            return modelValue[0] || '';
          }

          return modelValue;
        });
      }
    };
  }]);
};

},{}],13:[function(require,module,exports){
"use strict";

module.exports = function(app) {

  app.config([
    'formioComponentsProvider',
    function(formioComponentsProvider) {
      formioComponentsProvider.register('container', {
        title: 'Container',
        template: 'formio/components/container.html',
        group: 'layout',
        icon: 'fa fa-folder-open',
        settings: {
          input: true,
          tree: true,
          components: [],
          tableView: true,
          label: '',
          key: 'container',
          protected: false,
          persistent: true
        }
      });
    }
  ]);
  app.controller('formioContainerComponent', [
    '$scope',
    function($scope) {
      $scope.data[$scope.component.key] = $scope.data[$scope.component.key] || {};
      $scope.parentKey = $scope.component.key;
    }
  ]);
  app.run([
    '$templateCache',
    'FormioUtils',
    function($templateCache, FormioUtils) {
      $templateCache.put('formio/components/container.html', FormioUtils.fieldWrap(
        "<div ng-controller=\"formioContainerComponent\" class=\"formio-container-component\">\n  <formio-component ng-repeat=\"component in component.components\" component=\"component\" data=\"data[parentKey]\" formio=\"formio\" read-only=\"readOnly\"></formio-component>\n</div>\n"
      ));
    }
  ]);
};

},{}],14:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('content', {
        title: 'Content',
        template: 'formio/components/content.html',
        settings: {
          input: false,
          html: ''
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('formio/components/content.html',
        "<div ng-bind-html=\"component.html | safehtml\"></div>\n"
      );
    }
  ]);
};

},{}],15:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('custom', {
        title: 'Custom',
        template: 'formio/components/custom.html',
        group: 'advanced',
        settings: {}
      });
    }
  ]);
  app.run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('formio/components/custom.html',
        "<div class=\"panel panel-default\">\n  <div class=\"panel-body text-muted text-center\">\n    Custom Component ({{ component.type }})\n  </div>\n</div>\n"
      );
    }
  ]);
};

},{}],16:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function(formioComponentsProvider) {
      formioComponentsProvider.register('datagrid', {
        title: 'Data Grid',
        template: 'formio/components/datagrid.html',
        group: 'layout',
        settings: {
          input: true,
          tree: true,
          components: [],
          tableView: true,
          label: '',
          key: 'datagrid',
          protected: false,
          persistent: true
        }
      });
    }
  ]);
  app.controller('formioDataGrid', [
    '$scope',
    function($scope) {
      $scope.data[$scope.component.key] = $scope.data[$scope.component.key] || [{}];

      $scope.addRow = function() {
        // Ensure the object is initialized as it may be unset on a "Reset".
        if (!Array.isArray($scope.data[$scope.component.key])) {
          $scope.data[$scope.component.key] = [];
        }
        $scope.data[$scope.component.key].push({});
      };

      $scope.removeRow = function(index) {
        $scope.data[$scope.component.key].splice(index, 1);
      };
    }
  ]);
  app.run([
    '$templateCache',
    'FormioUtils',
    function($templateCache, FormioUtils) {
      $templateCache.put('formio/components/datagrid.html', FormioUtils.fieldWrap(
        "<div class=\"formio-data-grid\" ng-controller=\"formioDataGrid\" >\n  <table ng-class=\"{'table-striped': component.striped, 'table-bordered': component.bordered, 'table-hover': component.hover, 'table-condensed': component.condensed}\" class=\"table datagrid-table\">\n    <tr>\n      <th ng-repeat=\"component in component.components\">{{ component.label}}</th>\n      <th></th>\n    </tr>\n    <tr class=\"formio-data-grid-row\" ng-repeat=\"rowData in data[component.key] track by $index\">\n      <td ng-repeat=\"component in component.components\" ng-init=\"component.hideLabel = true\" >\n        <formio-component component=\"component\" data=\"rowData\" formio=\"formio\" read-only=\"readOnly\"></formio-component>\n      </td>\n      <td>\n        <a ng-click=\"removeRow($index)\" class=\"btn btn-default\">\n          <span class=\"glyphicon glyphicon-remove-circle\"></span>\n        </a>\n      </td>\n    </tr>\n  </table>\n  <div class=\"datagrid-add\">\n    <a ng-click=\"addRow()\" class=\"btn btn-primary\">\n      <span class=\"glyphicon glyphicon-plus\" aria-hidden=\"true\"></span> {{ component.addAnother || \"Add Another\" }}\n    </a>\n  </div>\n</div>\n"
      ));
    }
  ]);
};

},{}],17:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function(formioComponentsProvider) {
      formioComponentsProvider.register('datetime', {
        title: 'Date / Time',
        template: 'formio/components/datetime.html',
        tableView: function(data) {
          return '<span>{{ "' + data + '" | date: "' + this.settings.format + '" }}</span>';
        },
        group: 'advanced',
        settings: {
          input: true,
          tableView: true,
          label: '',
          key: 'datetimeField',
          placeholder: '',
          format: 'yyyy-MM-dd HH:mm',
          enableDate: true,
          enableTime: true,
          minDate: null,
          maxDate: null,
          datepickerMode: 'day',
          datePicker: {
            showWeeks: true,
            startingDay: 0,
            initDate: '',
            minMode: 'day',
            maxMode: 'year',
            yearRange: '20'
          },
          timePicker: {
            hourStep: 1,
            minuteStep: 1,
            showMeridian: true,
            readonlyInput: false,
            mousewheel: true,
            arrowkeys: true
          },
          protected: false,
          persistent: true,
          validate: {
            required: false,
            custom: ''
          }
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    'FormioUtils',
    function($templateCache, FormioUtils) {
      $templateCache.put('formio/components/datetime.html', FormioUtils.fieldWrap(
        "<div class=\"input-group\">\n  <input type=\"text\" class=\"form-control\"\n  ng-focus=\"calendarOpen = true\"\n  ng-click=\"calendarOpen = true\"\n  ng-init=\"calendarOpen = false\"\n  ng-disabled=\"readOnly\"\n  ng-required=\"component.validate.required\"\n  is-open=\"calendarOpen\"\n  datetime-picker=\"{{ component.format }}\"\n  min-date=\"component.minDate\"\n  max-date=\"component.maxDate\"\n  datepicker-mode=\"component.datepickerMode\"\n  enable-date=\"component.enableDate\"\n  enable-time=\"component.enableTime\"\n  ng-model=\"data[component.key]\"\n  tabindex=\"{{ component.tabindex || 0 }}\"\n  placeholder=\"{{ component.placeholder }}\"\n  datepicker-options=\"component.datePicker\"\n  timepicker-options=\"component.timePicker\" />\n  <span class=\"input-group-btn\">\n    <button type=\"button\" ng-disabled=\"readOnly\" class=\"btn btn-default\" ng-click=\"calendarOpen = true\">\n      <i ng-if=\"component.enableDate\" class=\"glyphicon glyphicon-calendar\"></i>\n      <i ng-if=\"!component.enableDate\" class=\"glyphicon glyphicon-time\"></i>\n    </button>\n  </span>\n</div>\n"
      ));
    }
  ]);
};

},{}],18:[function(require,module,exports){
"use strict";
module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('email', {
        title: 'Email',
        template: 'formio/components/textfield.html',
        group: 'advanced',
        settings: {
          input: true,
          tableView: true,
          inputType: 'email',
          label: '',
          key: 'emailField',
          placeholder: '',
          prefix: '',
          suffix: '',
          defaultValue: '',
          protected: false,
          unique: false,
          persistent: true
        }
      });
    }
  ]);
};

},{}],19:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('fieldset', {
        title: 'Field Set',
        template: 'formio/components/fieldset.html',
        group: 'layout',
        settings: {
          input: false,
          tableView: true,
          legend: '',
          components: []
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('formio/components/fieldset.html',
        "<fieldset>\n  <legend ng-if=\"component.legend\">{{ component.legend }}</legend>\n  <formio-component ng-repeat=\"component in component.components\" component=\"component\" data=\"data\" formio=\"formio\" read-only=\"readOnly\"></formio-component>\n</fieldset>\n"
      );
    }
  ]);
};

},{}],20:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('file', {
        title: 'File',
        template: 'formio/components/file.html',
        group: 'advanced',
        settings: {
          input: true,
          tableView: true,
          label: '',
          key: 'file',
          placeholder: '',
          multiple: false,
          defaultValue: '',
          protected: false
        }
      });
    }
  ]);

  app.directive('formioFileList', [function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        files: '=',
        form: '=',
        readOnly: '='
      },
      templateUrl: 'formio/components/formio-file-list.html',
      controller: [
        '$scope',
        function ($scope) {
          $scope.removeFile = function (event, index) {
            event.preventDefault();
            $scope.files.splice(index, 1);
          };

          $scope.fileSize = function (a, b, c, d, e) {
            return (b = Math, c = b.log, d = 1024, e = c(a) / c(d) | 0, a / b.pow(d, e)).toFixed(2) + ' ' + (e ? 'kMGTPEZY'[--e] + 'B' : 'Bytes');
          };
        }
      ]
    };
  }]);

  app.directive('formioFile', [function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        file: '=',
        form: '='
      },
      template: '<a href="{{ file.url }}" ng-click="getFile($event)" target="_blank">{{ file.name }}</a>',
      controller: [
        '$scope',
        'FormioPlugins',
        function (
          $scope,
          FormioPlugins
        ) {
          $scope.getFile = function (evt) {
            var plugin = FormioPlugins('storage', $scope.file.storage);
            if (plugin) {
              plugin.downloadFile(evt, $scope.file, $scope);
            }
          };
        }
      ]
    };
  }]);

  app.controller('formioFileUpload', [
    '$scope',
    'FormioPlugins',
    function(
      $scope,
      FormioPlugins
    ) {
      $scope.fileUploads = {};

      $scope.removeUpload = function(index) {
        delete $scope.fileUploads[index];
      };

      // This fixes new fields having an empty space in the array.
      if ($scope.data && $scope.data[$scope.component.key] === '') {
        $scope.data[$scope.component.key] = [];
      }
      if ($scope.data && $scope.data[$scope.component.key][0] === '') {
        $scope.data[$scope.component.key].splice(0, 1);
      }

      $scope.upload = function(files) {
        if ($scope.component.storage && files && files.length) {
          var plugin = FormioPlugins('storage', $scope.component.storage);
          angular.forEach(files, function(file) {
            if (plugin) {
              $scope.fileUploads[file.name] = {
                name: file.name,
                size: file.size,
                status: 'info',
                message: 'Starting upload'
              };
              plugin.uploadFile(file, $scope.fileUploads[file.name], $scope)
                .then(function(fileInfo) {
                  delete $scope.fileUploads[file.name];
                  fileInfo.storage = $scope.component.storage;
                  $scope.data[$scope.component.key].push(fileInfo);
                })
                .catch(function(message) {
                  $scope.fileUploads[file.name].status = 'error';
                  $scope.fileUploads[file.name].message = message;
                  delete $scope.fileUploads[file.name].progress;
                });
            }
            else {
              $scope.fileUploads[file.name] = {
                name: file.name,
                size: file.size,
                status: 'error',
                message: 'Storage plugin not found'
              };
            }
          });
        }
      };
    }
  ]);
  app.run([
    '$templateCache',
    function (
      $templateCache
    ) {

      $templateCache.put('formio/components/formio-file-list.html',
        "<table class=\"table table-striped table-bordered\">\n  <thead>\n    <tr>\n      <td ng-if=\"!readOnly\" style=\"width:1%;white-space:nowrap;\"></td>\n      <th>File Name</th>\n      <th>Size</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr ng-repeat=\"file in files track by $index\">\n      <td ng-if=\"!readOnly\" style=\"width:1%;white-space:nowrap;\"><a ng-if=\"!readOnly\" href=\"#\" ng-click=\"removeFile($event, $index)\" style=\"padding: 2px 4px;\" class=\"btn btn-sm btn-default\"><span class=\"glyphicon glyphicon-remove\"></span></a></td>\n      <td><formio-file file=\"file\" form=\"form\"></formio-file></td>\n      <td>{{ fileSize(file.size) }}</td>\n    </tr>\n  </tbody>\n</table>\n"
      );

      $templateCache.put('formio/components/file.html',
        "<label ng-if=\"component.label && !component.hideLabel\" for=\"{{ component.key }}\" class=\"control-label\" ng-class=\"{'field-required': component.validate.required}\">{{ component.label }}</label>\n<span ng-if=\"!component.label && component.validate.required\" class=\"glyphicon glyphicon-asterisk form-control-feedback field-required-inline\" aria-hidden=\"true\"></span>\n<div ng-controller=\"formioFileUpload\">\n  <formio-file-list files=\"data[component.key]\" form=\"formio.formUrl\"></formio-file-list>\n  <div ng-if=\"!readOnly\">\n    <div ngf-drop=\"upload($files)\" class=\"fileSelector\" ngf-drag-over-class=\"'fileDragOver'\" ngf-multiple=\"component.multiple\"><span class=\"glyphicon glyphicon-cloud-upload\"></span>Drop files to attach, or <a href=\"#\" ngf-select=\"upload($files)\" tabindex=\"{{ component.tabindex || 0 }}\" ngf-multiple=\"component.multiple\">browse</a>.</div>\n    <div ng-if=\"!component.storage\" class=\"alert alert-warning\">No storage has been set for this field. File uploads are disabled until storage is set up.</div>\n    <div ngf-no-file-drop>File Drag/Drop is not supported for this browser</div>\n  </div>\n  <div ng-repeat=\"fileUpload in fileUploads track by $index\" ng-class=\"{'has-error': fileUpload.status === 'error'}\" class=\"file\">\n    <div class=\"row\">\n      <div class=\"fileName control-label col-sm-10\">{{ fileUpload.name }} <span ng-click=\"removeUpload(fileUpload.name)\" class=\"glyphicon glyphicon-remove\"></span></div>\n      <div class=\"fileSize control-label col-sm-2 text-right\">{{ fileSize(fileUpload.size) }}</div>\n    </div>\n    <div class=\"row\">\n      <div class=\"col-sm-12\">\n        <span ng-if=\"fileUpload.status === 'progress'\">\n          <div class=\"progress\">\n            <div class=\"progress-bar\" role=\"progressbar\" aria-valuenow=\"{{fileUpload.progress}}\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width:{{fileUpload.progress}}%\">\n              <span class=\"sr-only\">{{fileUpload.progress}}% Complete</span>\n            </div>\n          </div>\n        </span>\n        <div ng-if=\"!fileUpload.status !== 'progress'\" class=\"bg-{{ fileUpload.status }} control-label\">{{ fileUpload.message }}</div>\n      </div>\n    </div>\n  </div>\n</div>\n"
      );
    }
  ]);
};

},{}],21:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('hidden', {
        title: 'Hidden',
        template: 'formio/components/hidden.html',
        group: 'advanced',
        settings: {
          input: true,
          tableView: true,
          key: 'hiddenField',
          label: '',
          protected: false,
          unique: false,
          persistent: true
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('formio/components/hidden.html',
        "<input type=\"hidden\" id=\"{{ component.key }}\" name=\"{{ component.key }}\" ng-model=\"data[component.key]\">\n"
      );
    }
  ]);
};

},{}],22:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.directive('formioHtmlElement', [
    '$sanitize',
    function($sanitize) {
      return {
        restrict: 'E',
        scope: {
          component: '='
        },
        templateUrl: 'formio/components/htmlelement-directive.html',
        link: function($scope) {
          var createElement = function() {
            var element = angular.element(
              '<' + $scope.component.tag + '>' + '</' + $scope.component.tag + '>'
            );

            element.html($scope.component.content);

            element.attr('class', $scope.component.className);
            angular.forEach($scope.component.attrs, function(attr) {
              if (!attr.attr) return;
              element.attr(attr.attr, attr.value);
            });

            try {
              $scope.html = $sanitize(element.prop('outerHTML'));
              $scope.parseError = null;
            }
            catch (err) {
              // Isolate the message and store it.
              $scope.parseError = err.message
              .split('\n')[0]
              .replace('[$sanitize:badparse]', '');
            }

          };

          createElement();

          $scope.$watch('component', createElement, true);
        }
      };
  }]);

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('htmlelement', {
        title: 'HTML Element',
        template: 'formio/components/htmlelement.html',
        settings: {
          input: false,
          tag: 'p',
          attrs: [],
          className: '',
          content: ''
        }
      });
    }
  ]);

  app.run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('formio/components/htmlelement.html',
        '<formio-html-element component="component"></div>'
      );

      $templateCache.put('formio/components/htmlelement-directive.html',
        "<div class=\"alert alert-warning\" ng-if=\"parseError\">{{ parseError }}</div>\n<div ng-bind-html=\"html\"></div>\n"
      );
    }
  ]);
};

},{}],23:[function(require,module,exports){
"use strict";
var app = angular.module('formio');

// Basic
require('./components')(app);
require('./textfield')(app);
require('./number')(app);
require('./password')(app);
require('./textarea')(app);
require('./checkbox')(app);
require('./selectboxes')(app);
require('./select')(app);
require('./radio')(app);
require('./htmlelement')(app);
require('./content')(app);
require('./button')(app);

// Special
require('./email')(app);
require('./phonenumber')(app);
require('./address')(app);
require('./datetime')(app);
require('./hidden')(app);
require('./resource')(app);
require('./file')(app);
require('./signature')(app);
require('./custom')(app);

// Layout
require('./columns')(app);
require('./fieldset')(app);
require('./container')(app);
require('./datagrid')(app);
require('./page')(app);
require('./panel')(app);
require('./table')(app);
require('./well')(app);

},{"./address":8,"./button":9,"./checkbox":10,"./columns":11,"./components":12,"./container":13,"./content":14,"./custom":15,"./datagrid":16,"./datetime":17,"./email":18,"./fieldset":19,"./file":20,"./hidden":21,"./htmlelement":22,"./number":24,"./page":25,"./panel":26,"./password":27,"./phonenumber":28,"./radio":29,"./resource":30,"./select":31,"./selectboxes":32,"./signature":33,"./table":34,"./textarea":35,"./textfield":36,"./well":37}],24:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('number', {
        title: 'Number',
        template: 'formio/components/number.html',
        settings: {
          input: true,
          tableView: true,
          inputType: 'number',
          label: '',
          key: 'numberField',
          placeholder: '',
          prefix: '',
          suffix: '',
          defaultValue: '',
          protected: false,
          persistent: true,
          validate: {
            required: false,
            min: '',
            max: '',
            step: 'any',
            integer: '',
            multiple: '',
            custom: ''
          }
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    'FormioUtils',
    function ($templateCache,
              FormioUtils) {
      $templateCache.put('formio/components/number.html', FormioUtils.fieldWrap(
        "<input type=\"{{ component.inputType }}\"\nclass=\"form-control\"\nid=\"{{ component.key }}\"\nname=\"{{ component.key }}\"\ntabindex=\"{{ component.tabindex || 0 }}\"\nng-model=\"data[component.key]\"\nng-required=\"component.validate.required\"\nng-disabled=\"readOnly\"\nsafe-multiple-to-single\nmin=\"{{ component.validate.min }}\"\nmax=\"{{ component.validate.max }}\"\nstep=\"{{ component.validate.step }}\"\nplaceholder=\"{{ component.placeholder }}\"\ncustom-validator=\"component.validate.custom\"\nui-mask=\"{{ component.inputMask }}\"\nui-mask-placeholder=\"\"\nui-options=\"uiMaskOptions\"\n>\n"
      ));
    }
  ]);
};

},{}],25:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('page', {
        template: 'formio/components/page.html',
        settings: {
          input: false,
          components: []
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('formio/components/page.html',
        "<formio-component ng-repeat=\"component in component.components\" component=\"component\" data=\"data\" formio=\"formio\"></formio-component>\n"
      );
    }
  ]);
};

},{}],26:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('panel', {
        title: 'Panel',
        template: 'formio/components/panel.html',
        group: 'layout',
        settings: {
          input: false,
          title: '',
          theme: 'default',
          components: []
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('formio/components/panel.html',
        "<div class=\"panel panel-{{ component.theme }}\">\n  <div ng-if=\"component.title\" class=\"panel-heading\">\n    <h3 class=\"panel-title\">{{ component.title }}</h3>\n  </div>\n  <div class=\"panel-body\">\n    <formio-component ng-repeat=\"component in component.components\" component=\"component\" data=\"data\" formio=\"formio\" read-only=\"readOnly\"></formio-component>\n  </div>\n</div>\n"
      );
    }
  ]);
};

},{}],27:[function(require,module,exports){
"use strict";
module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('password', {
        title: 'Password',
        template: 'formio/components/textfield.html',
        tableView: function () {
          return '--- PROTECTED ---';
        },
        settings: {
          input: true,
          tableView: false,
          inputType: 'password',
          label: '',
          key: 'passwordField',
          placeholder: '',
          prefix: '',
          suffix: '',
          protected: true,
          persistent: true
        }
      });
    }
  ]);
};

},{}],28:[function(require,module,exports){
"use strict";
module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('phoneNumber', {
        title: 'Phone Number',
        template: 'formio/components/textfield.html',
        group: 'advanced',
        settings: {
          input: true,
          tableView: true,
          inputMask: '(999) 999-9999',
          label: '',
          key: 'phonenumberField',
          placeholder: '',
          prefix: '',
          suffix: '',
          multiple: false,
          protected: false,
          unique: false,
          persistent: true,
          validate: {
            required: false
          }
        }
      });
    }
  ]);
};

},{}],29:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('radio', {
        title: 'Radio',
        template: 'formio/components/radio.html',
        settings: {
          input: true,
          tableView: true,
          inputType: 'radio',
          label: '',
          key: 'radioField',
          values: [],
          defaultValue: '',
          protected: false,
          persistent: true,
          validate: {
            required: false,
            custom: '',
            customPrivate: false
          }
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    'FormioUtils',
    function ($templateCache,
              FormioUtils) {
      $templateCache.put('formio/components/radio.html', FormioUtils.fieldWrap(
        "<div ng-class=\"component.inline ? 'radio-inline' : 'radio'\" ng-repeat=\"v in component.values track by $index\">\n  <label class=\"control-label\" for=\"{{ v.value }}\">\n    <input type=\"{{ component.inputType }}\"\n    id=\"{{ v.value }}\"\n    name=\"{{ component.key }}\"\n    value=\"{{ v.value }}\"\n    tabindex=\"{{ component.tabindex || 0 }}\"\n    ng-model=\"data[component.key]\"\n    ng-required=\"component.validate.required\"\n    ng-disabled=\"readOnly\"\n    custom-validator=\"component.validate.custom\">\n    {{ v.label }}\n  </label>\n</div>\n"
      ));
    }
  ]);
};

},{}],30:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('resource', {
        title: 'Resource',
        tableView: function (data) {
          return data ? data._id : '';
        },
        template: function ($scope) {
          return $scope.component.multiple ? 'formio/components/resource-multiple.html' : 'formio/components/resource.html';
        },
        controller: function (settings, $scope, $http, Formio) {
          $scope.selectItems = [];
          if (settings.multiple) {
            settings.defaultValue = [];
          }
          if (settings.resource) {
            var formio = new Formio($scope.formio.projectUrl + '/form/' + settings.resource);
            $scope.refreshSubmissions = function (input) {
              var params = settings.params || {};
              // If they wish to return only some fields.
              if (settings.selectFields) {
                params.select = settings.selectFields;
              }
              if (settings.searchFields && input) {
                angular.forEach(settings.searchFields, function (field, index) {
                  params[field] = input;
                });
              }
              // Load the submissions.
              formio.loadSubmissions({
                params: params
              }).then(function (submissions) {
                $scope.selectItems = submissions || [];
              });
            };

            $scope.refreshSubmissions();
          }
        },
        group: 'advanced',
        settings: {
          input: true,
          tableView: true,
          label: '',
          key: 'resourceField',
          placeholder: '',
          resource: '',
          defaultValue: '',
          template: '<span>{{ item.data }}</span>',
          selectFields: '',
          searchFields: '',
          multiple: false,
          protected: false,
          persistent: true,
          validate: {
            required: false
          }
        }
      });
    }
  ]);

  app.run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('formio/components/resource.html',
        "<label ng-if=\"component.label\" for=\"{{ component.key }}\" class=\"control-label\" ng-class=\"{'field-required': component.validate.required}\">{{ component.label }}</label>\n<span ng-if=\"!component.label && component.validate.required\" class=\"glyphicon glyphicon-asterisk form-control-feedback field-required-inline\" aria-hidden=\"true\"></span>\n<ui-select ui-select-required safe-multiple-to-single ui-select-open-on-focus ng-model=\"data[component.key]\" ng-disabled=\"readOnly\" ng-required=\"component.validate.required\" id=\"{{ component.key }}\" name=\"{{ component.key }}\" theme=\"bootstrap\" tabindex=\"{{ component.tabindex || 0 }}\">\n  <ui-select-match placeholder=\"{{ component.placeholder }}\">\n    <formio-select-item template=\"component.template\" item=\"$item || $select.selected\" select=\"$select\"></formio-select-item>\n  </ui-select-match>\n  <ui-select-choices repeat=\"item in selectItems | filter: $select.search\" refresh=\"refreshSubmissions($select.search)\" refresh-delay=\"250\">\n    <formio-select-item template=\"component.template\" item=\"item\" select=\"$select\"></formio-select-item>\n  </ui-select-choices>\n</ui-select>\n<formio-errors></formio-errors>\n"
      );

      // Change the ui-select to ui-select multiple.
      $templateCache.put('formio/components/resource-multiple.html',
        $templateCache.get('formio/components/resource.html').replace('<ui-select', '<ui-select multiple')
      );
    }
  ]);
};

},{}],31:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.directive('formioSelectItem', [
    '$compile',
    function ($compile) {
      return {
        restrict: 'E',
        scope: {
          template: '=',
          item: '=',
          select: '='
        },
        link: function (scope, element) {
          if (scope.template) {
            element.html($compile(angular.element(scope.template))(scope));
          }
        }
      };
    }
  ]);

  app.directive('uiSelectRequired', function () {
    return {
      require: 'ngModel',
      link: function (scope, element, attrs, ngModel) {
        var oldIsEmpty = ngModel.$isEmpty;
        ngModel.$isEmpty = function (value) {
          return (Array.isArray(value) && value.length === 0) || oldIsEmpty(value);
        };
      }
    };
  });

// A hack to have ui-select open on focus
  app.directive('uiSelectOpenOnFocus', ['$timeout', function ($timeout) {
    return {
      require: 'uiSelect',
      restrict: 'A',
      link: function ($scope, el, attrs, uiSelect) {
        var closing = false;

        angular.element(uiSelect.focusser).on('focus', function () {
          if (!closing) {
            uiSelect.activate();
          }
        });

        // Because ui-select immediately focuses the focusser after closing
        // we need to not re-activate after closing
        $scope.$on('uis:close', function () {
          closing = true;
          $timeout(function () { // I'm so sorry
            closing = false;
          });
        });
      }
    };
  }]);

// Configure the Select component.
  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('select', {
        title: 'Select',
        template: function ($scope) {
          return $scope.component.multiple ? 'formio/components/select-multiple.html' : 'formio/components/select.html';
        },
        controller: function (settings, $scope, $http, Formio) {
          $scope.nowrap = true;
          $scope.selectItems = [];
          var valueProp = $scope.component.valueProperty;
          $scope.getSelectItem = function (item) {
            if (!item) {
              return '';
            }
            if (settings.dataSrc === 'values') {
              return item.value;
            }
            return valueProp ? item[valueProp] : item;
          };

          if (settings.multiple) {
            settings.defaultValue = [];
          }

          $scope.refreshItems = angular.noop;

          switch (settings.dataSrc) {
            case 'values':
              $scope.selectItems = settings.data.values;
              break;
            case 'json':
              try {
                $scope.selectItems = angular.fromJson(settings.data.json);
              }
              catch (error) {
                $scope.selectItems = [];
              }
              break;
            case 'url':
              if (settings.data.url) {
                var options = {cache: true};
                if (settings.data.url.substr(0, 1) === '/') {
                  settings.data.url = Formio.getBaseUrl() + settings.data.url;
                }

                // Disable auth for outgoing requests.
                if (settings.data.url.indexOf(Formio.getBaseUrl()) === -1) {
                  options = {
                    disableJWT: true,
                    headers: {
                      Authorization: undefined,
                      Pragma: undefined,
                      'Cache-Control': undefined
                    }
                  };
                }

                var loaded = false;
                $scope.refreshItems = function(input) {
                  var url = settings.data.url;

                  if (settings.searchField && input) {
                    url += ((url.indexOf('?') === -1) ? '?' : '&') +
                      encodeURIComponent(settings.searchField) +
                      '=' +
                      encodeURIComponent(input);
                  }
                  else if (loaded) {
                    return; // Skip if we've loaded before, to avoid multiple requests
                  }
                  $http.get(url, options)
                  .then(function (result) {
                    $scope.selectItems = result.data;
                    loaded = true;
                  });
                };
                $scope.refreshItems();
              }
              break;
            default:
              $scope.selectItems = [];
          }
        },
        settings: {
          input: true,
          tableView: true,
          label: '',
          key: 'selectField',
          placeholder: '',
          data: {
            values: [],
            json: '',
            url: ''
          },
          dataSrc: 'values',
          valueProperty: '',
          defaultValue: '',
          template: '<span>{{ item.label }}</span>',
          multiple: false,
          protected: false,
          unique: false,
          persistent: true,
          validate: {
            required: false
          }
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('formio/components/select.html',
        "<label ng-if=\"component.label && !component.hideLabel\"  for=\"{{ component.key }}\" class=\"control-label\" ng-class=\"{'field-required': component.validate.required}\">{{ component.label }}</label>\n<span ng-if=\"!component.label && component.validate.required\" class=\"glyphicon glyphicon-asterisk form-control-feedback field-required-inline\" aria-hidden=\"true\"></span>\n<ui-select ui-select-required ui-select-open-on-focus ng-model=\"data[component.key]\" safe-multiple-to-single name=\"{{ component.key }}\" ng-disabled=\"readOnly\" ng-required=\"component.validate.required\" id=\"{{ component.key }}\" theme=\"bootstrap\" tabindex=\"{{ component.tabindex || 0 }}\">\n  <ui-select-match placeholder=\"{{ component.placeholder }}\">\n    <formio-select-item template=\"component.template\" item=\"$item || $select.selected\" select=\"$select\"></formio-select-item>\n  </ui-select-match>\n  <ui-select-choices repeat=\"getSelectItem(item) as item in selectItems | filter: $select.search\" refresh=\"refreshItems($select.search)\" refresh-delay=\"250\">\n    <formio-select-item template=\"component.template\" item=\"item\" select=\"$select\"></formio-select-item>\n  </ui-select-choices>\n</ui-select>\n<formio-errors></formio-errors>\n"
      );

      // Change the ui-select to ui-select multiple.
      $templateCache.put('formio/components/select-multiple.html',
        $templateCache.get('formio/components/select.html').replace('<ui-select', '<ui-select multiple')
      );
    }
  ]);
};

},{}],32:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.directive('formioSelectBoxes', [function() {
    return {
      restrict: 'E',
      replace: true,
      require: 'ngModel',
      scope: {
        component: '=',
        readOnly: '=',
        model: '=ngModel'
      },
      templateUrl: 'formio/components/selectboxes-directive.html',
      link: function($scope, el, attrs, ngModel) {
        // Initialize model
        var model = {};
        angular.forEach($scope.component.values, function(v) {
          model[v.value] = !!ngModel.$viewValue[v.value];
        });
        ngModel.$setViewValue(model);
        ngModel.$setPristine(true);

        ngModel.$isEmpty = function(value) {
          return Object.keys(value).every(function(key) {
            return !value[key];
          });
        };

        $scope.toggleCheckbox = function(value) {
          var model = angular.copy(ngModel.$viewValue);
          model[value] = !model[value];
          ngModel.$setViewValue(model);
        };
      }
    };
  }]);

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('selectboxes', {
        title: 'Select Boxes',
        template: 'formio/components/selectboxes.html',
        tableView: function (data) {
          if (!data) return '';

          return Object.keys(data)
          .filter(function(key) {
            return data[key];
          })
          .join(', ');
        },
        settings: {
          input: true,
          tableView: true,
          label: '',
          key: 'selectboxesField',
          values: [],
          defaultValue: {},
          inline: false,
          protected: false,
          persistent: true,
          validate: {
            required: false
          }
        }
      });
    }
  ]);

  app.run([
    '$templateCache',
    'FormioUtils',
    function ($templateCache) {
      $templateCache.put('formio/components/selectboxes-directive.html',
        "<div class=\"select-boxes\">\n  <div ng-class=\"component.inline ? 'checkbox-inline' : 'checkbox'\" ng-repeat=\"v in component.values track by $index\">\n    <label class=\"control-label\" for=\"{{ component.key }}-{{ v.value }}\">\n      <input type=\"checkbox\"\n      id=\"{{ component.key }}-{{ v.value }}\"\n      name=\"{{ component.key }}-{{ v.value }}\"\n      value=\"{{ v.value }}\"\n      tabindex=\"{{ component.tabindex || 0 }}\"\n      ng-disabled=\"readOnly\"\n      ng-click=\"toggleCheckbox(v.value)\"\n      ng-checked=\"model[v.value]\"\n      >\n      {{ v.label }}\n    </label>\n  </div>\n</div>\n"
      );
      $templateCache.put('formio/components/selectboxes.html',
        "<label ng-if=\"component.label\" for=\"{{ component.key }}\" class=\"control-label\" ng-class=\"{'field-required': component.validate.required}\">{{ component.label }}</label>\n<formio-select-boxes\n  name=\"{{ component.key }}\"\n  ng-model=\"data[component.key]\"\n  ng-model-options=\"{allowInvalid: true}\"\n  component=\"component\"\n  read-only=\"readOnly\"\n  ng-required=\"component.validate.required\"\n  custom-validator=\"component.validate.custom\"\n  ></formio-select-boxes>\n<formio-errors></formio-errors>\n"
      );
    }
  ]);
};

},{}],33:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('signature', {
        title: 'Signature',
        template: 'formio/components/signature.html',
        tableView: function (data) {
          return data ? 'Yes' : 'No';
        },
        group: 'advanced',
        settings: {
          input: true,
          tableView: true,
          label: '',
          key: 'signature',
          placeholder: '',
          footer: 'Sign above',
          width: '100%',
          height: '150',
          penColor: 'black',
          backgroundColor: 'rgb(245,245,235)',
          minWidth: '0.5',
          maxWidth: '2.5',
          protected: false,
          persistent: true,
          validate: {
            required: false
          }
        }
      });
    }
  ]);
  app.directive('signature', function () {
    return {
      restrict: 'A',
      scope: {
        component: '='
      },
      require: '?ngModel',
      link: function (scope, element, attrs, ngModel) {
        if (!ngModel) {
          return;
        }

        // Sets the label of component for error display.
        scope.component.label = 'Signature';
        scope.component.hideLabel = true;

        // Sets the dimension of a width or height.
        var setDimension = function (dim) {
          if (scope.component[dim].slice(-1) === '%') {
            var percent = parseFloat(scope.component[dim].slice(0, -1)) / 100;
            element[0][dim] = element.parent()[dim]() * percent;
          }
          else {
            element[0][dim] = parseInt(scope.component[dim], 10);
            scope.component[dim] = element[0][dim] + 'px';
          }
        };

        // Set the width and height of the canvas.
        setDimension('width');
        setDimension('height');

        // Create the signature pad.
        /* global SignaturePad:false */
        var signaturePad = new SignaturePad(element[0], {
          minWidth: scope.component.minWidth,
          maxWidth: scope.component.maxWidth,
          penColor: scope.component.penColor,
          backgroundColor: scope.component.backgroundColor
        });

        scope.$watch('component.penColor', function (newValue) {
          signaturePad.penColor = newValue;
        });

        scope.$watch('component.backgroundColor', function (newValue) {
          signaturePad.backgroundColor = newValue;
          signaturePad.clear();
        });

        // Clear the signature.
        scope.component.clearSignature = function () {
          signaturePad.clear();
          readSignature();
        };

        // Set some CSS properties.
        element.css({
          'border-radius': '4px',
          'box-shadow': '0 0 5px rgba(0, 0, 0, 0.02) inset',
          'border': '1px solid #f4f4f4'
        });

        function readSignature() {
          if (scope.component.validate.required && signaturePad.isEmpty()) {
            ngModel.$setViewValue('');
          }
          else {
            ngModel.$setViewValue(signaturePad.toDataURL());
          }
        }

        ngModel.$render = function () {
          signaturePad.fromDataURL(ngModel.$viewValue);
        };
        signaturePad.onEnd = function () {
          scope.$evalAsync(readSignature);
        };

        // Read initial empty canvas, unless signature is required, then keep it pristine
        if (!scope.component.validate.required) {
          readSignature();
        }
      }
    };
  });
  app.run([
    '$templateCache',
    'FormioUtils',
    function ($templateCache,
              FormioUtils) {
      $templateCache.put('formio/components/signature.html', FormioUtils.fieldWrap(
        "<img ng-if=\"readOnly\" ng-attr-src=\"{{data[component.key]}}\" src=\"\" />\n<div ng-if=\"!readOnly\" style=\"width: {{ component.width }}; height: {{ component.height }};\">\n  <a class=\"btn btn-xs btn-default\" style=\"position:absolute; left: 0; top: 0; z-index: 1000\" ng-click=\"component.clearSignature()\">\n    <span class=\"glyphicon glyphicon-refresh\"></span>\n  </a>\n  <canvas signature component=\"component\" name=\"{{ component.key }}\" ng-model=\"data[component.key]\" ng-required=\"component.validate.required\"></canvas>\n  <div class=\"formio-signature-footer\" style=\"text-align: center;color:#C3C3C3;\" ng-class=\"{'field-required': component.validate.required}\">{{ component.footer }}</div>\n</div>\n"
      ));
    }
  ]);
};

},{}],34:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('table', {
        title: 'Table',
        template: 'formio/components/table.html',
        group: 'layout',
        settings: {
          input: false,
          numRows: 3,
          numCols: 3,
          rows: [[{components: []}, {components: []}, {components: []}], [{components: []}, {components: []}, {components: []}], [{components: []}, {components: []}, {components: []}]],
          header: [],
          caption: '',
          striped: false,
          bordered: false,
          hover: false,
          condensed: false
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    function ($templateCache) {
      var tableClasses = "{'table-striped': component.striped, ";
      tableClasses += "'table-bordered': component.bordered, ";
      tableClasses += "'table-hover': component.hover, ";
      tableClasses += "'table-condensed': component.condensed}";
      $templateCache.put('formio/components/table.html',
        "<div class=\"table-responsive\">\n  <table ng-class=\"{'table-striped': component.striped, 'table-bordered': component.bordered, 'table-hover': component.hover, 'table-condensed': component.condensed}\" class=\"table\">\n    <thead ng-if=\"component.header.length\">\n      <th ng-repeat=\"header in component.header\">{{ header }}</th>\n    </thead>\n    <tbody>\n      <tr ng-repeat=\"row in component.rows track by $index\">\n        <td ng-repeat=\"column in row track by $index\">\n          <formio-component ng-repeat=\"component in column.components\" component=\"component\" data=\"data\" formio=\"formio\"></formio-component>\n        </td>\n      </tr>\n    </tbody>\n  </table>\n</div>\n"
      );
    }
  ]);
};

},{}],35:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('textarea', {
        title: 'Text Area',
        template: 'formio/components/textarea.html',
        settings: {
          input: true,
          tableView: true,
          label: '',
          key: 'textareaField',
          placeholder: '',
          prefix: '',
          suffix: '',
          rows: 3,
          multiple: false,
          defaultValue: '',
          protected: false,
          persistent: true,
          validate: {
            required: false,
            minLength: '',
            maxLength: '',
            pattern: '',
            custom: ''
          }
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    'FormioUtils',
    function ($templateCache,
              FormioUtils) {
      $templateCache.put('formio/components/textarea.html', FormioUtils.fieldWrap(
        "<textarea\nclass=\"form-control\"\nng-model=\"data[component.key]\"\nng-disabled=\"readOnly\"\nng-required=\"component.validate.required\"\nsafe-multiple-to-single\nid=\"{{ component.key }}\"\ntabindex=\"{{ component.tabindex || 0 }}\"\nplaceholder=\"{{ component.placeholder }}\"\ncustom-validator=\"component.validate.custom\"\nrows=\"{{ component.rows }}\"></textarea>\n"
      ));
    }
  ]);
};

},{}],36:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('textfield', {
        title: 'Text Field',
        template: 'formio/components/textfield.html',
        icon: 'fa fa-terminal',
        settings: {
          input: true,
          tableView: true,
          inputType: 'text',
          inputMask: '',
          label: '',
          key: 'textField',
          placeholder: '',
          prefix: '',
          suffix: '',
          multiple: false,
          defaultValue: '',
          protected: false,
          unique: false,
          persistent: true,
          validate: {
            required: false,
            minLength: '',
            maxLength: '',
            pattern: '',
            custom: '',
            customPrivate: false
          }
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    'FormioUtils',
    function ($templateCache,
              FormioUtils) {
      $templateCache.put('formio/components/textfield.html', FormioUtils.fieldWrap(
        "<input type=\"{{ component.inputType }}\"\nclass=\"form-control\"\nid=\"{{ component.key }}\"\nname=\"{{ component.key }}\"\ntabindex=\"{{ component.tabindex || 0 }}\"\nng-disabled=\"readOnly\"\nng-model=\"data[component.key]\"\nng-model-options=\"{ debounce: 500 }\"\nsafe-multiple-to-single\nng-required=\"component.validate.required\"\nng-minlength=\"component.validate.minLength\"\nng-maxlength=\"component.validate.maxLength\"\nng-pattern=\"component.validate.pattern\"\ncustom-validator=\"component.validate.custom\"\nplaceholder=\"{{ component.placeholder }}\"\nui-mask=\"{{ component.inputMask }}\"\nui-mask-placeholder=\"\" ' + // avoids regular placeholder mixing with mask placeholder\nui-options=\"uiMaskOptions\"\n>\n"
      ));
    }
  ]);
};

},{}],37:[function(require,module,exports){
"use strict";

module.exports = function (app) {

  app.config([
    'formioComponentsProvider',
    function (formioComponentsProvider) {
      formioComponentsProvider.register('well', {
        title: 'Well',
        template: 'formio/components/well.html',
        group: 'layout',
        settings: {
          input: false,
          components: []
        }
      });
    }
  ]);
  app.run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('formio/components/well.html',
        "<div class=\"well\">\n  <formio-component ng-repeat=\"component in component.components\" component=\"component\" data=\"data\" formio=\"formio\" read-only=\"readOnly\"></formio-component>\n</div>\n"
      );
    }
  ]);
};

},{}],38:[function(require,module,exports){
"use strict";
module.exports = function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, ele, attrs, ctrl) {
      if (
        !scope.component.validate ||
        !scope.component.validate.custom
      ) {
        return;
      }
      ctrl.$validators.custom = function(modelValue, viewValue) {
        var valid = true;
        var input = modelValue || viewValue;

        var custom = scope.component.validate.custom;
        custom = custom.replace(/({{\s+(.*)\s+}})/, function(match, $1, $2) {
          return scope.data[$2];
        });

        /* jshint evil: true */
        eval(custom);

        if (valid !== true) {
          scope.component.customError = valid;
          return false;
        }

        return true;
      };
    }
  };
};

},{}],39:[function(require,module,exports){
"use strict";
module.exports = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      src: '=',
      formAction: '=',
      form: '=',
      submission: '=',
      readOnly: '=',
      formioOptions: '='
    },
    controller: [
      '$scope',
      '$http',
      '$element',
      'FormioScope',
      'Formio',
      'FormioUtils',
      function(
        $scope,
        $http,
        $element,
        FormioScope,
        Formio,
        FormioUtils
      ) {
        $scope.formioAlerts = [];
        // Shows the given alerts (single or array), and dismisses old alerts
        this.showAlerts = $scope.showAlerts = function(alerts) {
          $scope.formioAlerts = [].concat(alerts);
        };

        // Add the live form parameter to the url.
        $scope._src = $scope.src;
        if ($scope._src && ($scope._src.indexOf('live=') === -1)) {
          $scope._src += ($scope._src.indexOf('?') === -1) ? '?' : '&';
          $scope._src += 'live=1';
        }

        // Create the formio object.
        $scope.formio = FormioScope.register($scope, $element, {
          form: true,
          submission: true
        });

        // Called when the form is submitted.
        $scope.onSubmit = function(form) {
          if (!$scope.formioForm.$valid || form.submitting) return;
          form.submitting = true;

          // Create a sanitized submission object.
          var submissionData = {data: {}};
          if ($scope._submission._id) {
            submissionData._id = $scope._submission._id;
          }
          if ($scope._submission.data._id) {
            submissionData._id = $scope._submission.data._id;
          }

          var components = FormioUtils.flattenComponents($scope._form.components);
          angular.forEach(components, function(component) {
            if ($scope._submission.data.hasOwnProperty(component.key)) {
              submissionData.data[component.key] = $scope._submission.data[component.key];
            }
          });
          angular.forEach($scope._submission.data, function(value, key) {
            if (value && !value.hasOwnProperty('_id')) {
              submissionData.data[key] = value;
            }
          });

          // Called when a submission has been made.
          var onSubmitDone = function(method, submission) {
            $scope.showAlerts({
              type: 'success',
              message: 'Submission was ' + ((method === 'put') ? 'updated' : 'created') + '.'
            });
            form.submitting = false;
            // Trigger the form submission.
            $scope.$emit('formSubmission', submission);
          };

          var submitEvent = $scope.$emit('formSubmit', submissionData);
          if (submitEvent.defaultPrevented) {
            // Listener wants to cancel the form submission
            return;
          }

          // Allow custom action urls.
          if ($scope.action) {
            var method = submissionData._id ? 'put' : 'post';
            $http[method]($scope.action, submissionData).success(function (submission) {
              Formio.clearCache();
              onSubmitDone(method, submission);
            }).error(FormioScope.onError($scope, $element))
              .finally(function() {
                form.submitting = false;
              });
          }

          // If they wish to submit to the default location.
          else if ($scope.formio) {
            $scope.formio.saveSubmission(angular.copy(submissionData), $scope.formioOptions) // copy to remove angular $$hashKey
              .then(function(submission) {
              onSubmitDone(submission.method, submission);
            }, FormioScope.onError($scope, $element))
              .finally(function() {
                form.submitting = false;
              });
          }
          else {
            $scope.$emit('formSubmission', submissionData);
          }
        };
      }
    ],
    templateUrl: 'formio.html'
  };
};

},{}],40:[function(require,module,exports){
"use strict";
module.exports = [
  'Formio',
  'formioComponents',
  function(
    Formio,
    formioComponents
  ) {
    return {
      replace: true,
      restrict: 'E',
      require: '?^formio',
      scope: {
        component: '=',
        data: '=',
        formio: '=',
        form: '=',
        readOnly: '='
      },
      templateUrl: 'formio/component.html',
      link: function($scope, el, attrs, formioCtrl) {
        if (formioCtrl) {
          $scope.showAlerts = formioCtrl.showAlerts.bind(formioCtrl);
        }
        else {
          $scope.showAlerts = function() {
            throw new Error('Cannot call $scope.showAlerts unless this component is inside a formio directive.');
          };
        }
      },
      controller: [
        '$scope',
        '$http',
        function(
          $scope,
          $http
        ) {

          // Options to match jquery.maskedinput masks
          $scope.uiMaskOptions = {
            maskDefinitions: {
              '9': /\d/,
              'a': /[a-zA-Z]/,
              '*': /[a-zA-Z0-9]/
            },
            clearOnBlur: false,
            eventsToHandle: ['input', 'keyup', 'click', 'focus'],
            silentEvents: ['click', 'focus']
          };

          $scope.resetForm = function() {
            // Manually remove each key so we don't lose a reference to original
            // data in child scopes.
            for (var key in $scope.data) {
              delete $scope.data[key];
            }
          };

          // Initialize the data.
          if (!$scope.data) {
            $scope.resetForm();
          }

          // If this component references an object, we need to determine the
          // value by navigating through the object.
          if (
            $scope.component &&
            $scope.component.key
          ) {
            var root = '';
            if ($scope.component.key.indexOf('.') !== -1) {
              root = $scope.component.key.split('.').shift();
            }
            $scope.$watch('data', function(data) {
              if (!data || angular.equals({}, data)) return;
              if (root && (!data.hasOwnProperty(root) || angular.equals({}, data[root]))) return;
              if (root && data[root].hasOwnProperty('_id')) {
                $scope.data[root + '._id'] = data[root]._id;
              }
              var value = Formio.fieldData(data, $scope.component);
              if (value !== undefined) {
                $scope.data[$scope.component.key] = value;
              }
            });
          }

          // Get the settings.
          var component = formioComponents.components[$scope.component.type] || formioComponents.components['custom'];

          // Set the component with the defaults from the component settings.
          angular.forEach(component.settings, function(value, key) {
            if (!$scope.component.hasOwnProperty(key)) {
              $scope.component[key] = angular.copy(value);
            }
          });

          // Add a new field value.
          $scope.addFieldValue = function() {
            $scope.data[$scope.component.key] = $scope.data[$scope.component.key] || [];
            $scope.data[$scope.component.key].push('');
          };

          // Remove a field value.
          $scope.removeFieldValue = function(index) {
            $scope.data[$scope.component.key].splice(index, 1);
          };

          // Set the template for the component.
          if (typeof component.template === 'function') {
            $scope.template = component.template($scope);
          }
          else {
            $scope.template = component.template;
          }

          // Allow component keys to look like "settings[username]"
          if ($scope.component.key && $scope.component.key.indexOf('[') !== -1) {
            var matches = $scope.component.key.match(/([^\[]+)\[([^]+)\]/);
            if ((matches.length === 3) && $scope.data.hasOwnProperty(matches[1])) {
              $scope.data = $scope.data[matches[1]];
              $scope.component.key = matches[2];
            }
          }

          // If the component has a controller.
          if (component.controller) {
            component.controller($scope.component, $scope, $http, Formio);
          }

          // Establish a default for data.
          if ($scope.data && !$scope.data.hasOwnProperty($scope.component.key) && $scope.component.hasOwnProperty('defaultValue')) {
            if ($scope.component.multiple && !angular.isArray($scope.component.defaultValue)) {
              $scope.data[$scope.component.key] = [$scope.component.defaultValue];
            }
            else {
              $scope.data[$scope.component.key] = $scope.component.defaultValue;
            }
          }
          else if ($scope.data && !$scope.data.hasOwnProperty($scope.component.key) && $scope.component.multiple) {
            $scope.data[$scope.component.key] = [];
          }
        }
      ]
    };
  }
];

},{}],41:[function(require,module,exports){
"use strict";
module.exports = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      form: '=',
      submission: '=',
      src: '=',
      formAction: '=',
      resourceName: '='
    },
    templateUrl: 'formio-delete.html',
    controller: [
      '$scope',
      '$element',
      'FormioScope',
      'Formio',
      '$http',
      function(
        $scope,
        $element,
        FormioScope,
        Formio,
        $http
      ) {
        $scope.formioAlerts = [];
        // Shows the given alerts (single or array), and dismisses old alerts
        $scope.showAlerts = function(alerts) {
          $scope.formioAlerts = [].concat(alerts);
        };
        var resourceName = 'resource';
        var methodName = '';
        var loader = FormioScope.register($scope, $element, {
          form: true,
          submission: true
        });

        if (loader) {
          resourceName = loader.submissionId ? 'submission' : 'form';
          var resourceTitle = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
          methodName = 'delete' + resourceTitle;
        }

        // Set the resource name
        $scope._resourceName = resourceName;

        // Create delete capability.
        $scope.onDelete = function() {
          // Rebuild resourceTitle, $scope.resourceName could have changed
          var resourceName = $scope.resourceName || $scope._resourceName;
          var resourceTitle = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
          // Called when the delete is done.
          var onDeleteDone = function(data) {
            $scope.showAlerts({
              type: 'success',
              message: resourceTitle + ' was deleted.'
            });
            Formio.clearCache();
            $scope.$emit('delete', data);
          };

          if ($scope.action) {
            $http.delete($scope.action).success(onDeleteDone).error(FormioScope.onError($scope, $element));
          }
          else if (loader) {
            if (!methodName) return;
            if (typeof loader[methodName] !== 'function') return;
            loader[methodName]().then(onDeleteDone, FormioScope.onError($scope, $element));
          }
        };
        $scope.onCancel = function() {
          $scope.$emit('cancel');
        };
      }
    ]
  };
};

},{}],42:[function(require,module,exports){
"use strict";
module.exports = [
  '$compile',
  '$templateCache',
  function(
    $compile,
    $templateCache
  ) {
    return {
      scope: false,
      link: function(scope, element) {
        element.replaceWith($compile($templateCache.get(scope.template))(scope));
        scope.$emit('formElementRender', element);
      },
      controller: function() {
        // This is required for some reason as it will occasionally throw an error without it.
      }
    };
  }
];

},{}],43:[function(require,module,exports){
"use strict";
module.exports = function() {
  return {
    scope: false,
    restrict: 'E',
    templateUrl: 'formio/errors.html'
  };
};

},{}],44:[function(require,module,exports){
"use strict";
module.exports = function() {
  return {
    replace: true,
    restrict: 'E',
    scope: {
      src: '=',
      form: '=',
      submissions: '=',
      perPage: '='
    },
    templateUrl: 'formio/submissions.html',
    controller: [
      '$scope',
      '$element',
      'FormioScope',
      function(
        $scope,
        $element,
        FormioScope
      ) {
        $scope.formioAlerts = [];
        // Shows the given alerts (single or array), and dismisses old alerts
        this.showAlerts = $scope.showAlerts = function(alerts) {
          $scope.formioAlerts = [].concat(alerts);
        };

        $scope.perPage = $scope.perPage === undefined ? 10 : $scope.perPage;
        $scope.formio = FormioScope.register($scope, $element, {
          form: true,
          submissions: true
        });

        $scope.currentPage = 1;
        $scope.pageChanged = function(page) {
          $scope.skip = (page - 1) * $scope.perPage;
          $scope.updateSubmissions();
        };

        $scope.tableView = function(component) {
          return !component.hasOwnProperty('tableView') || component.tableView;
        };

        $scope.$watch('_submissions', function(submissions) {
          if (submissions && submissions.length > 0) {
            $scope.$emit('submissionLoad', $scope._submissions);
          }
        });
      }
    ]
  };
};

},{}],45:[function(require,module,exports){
"use strict";
module.exports = [
  'Formio',
  'formioComponents',
  function(
    Formio,
    formioComponents
  ) {
    return {
      onError: function($scope, $element) {
        return function(error) {
          if (error.name === 'ValidationError') {
            $element.find('#form-group-' + error.details[0].path).addClass('has-error');
            var message = 'ValidationError: ' + error.details[0].message;
            $scope.showAlerts({
              type: 'danger',
              message: message
            });
          }
          else {
            if (error instanceof Error) {
              error = error.toString();
            }
            else if (typeof error === 'object') {
              error = JSON.stringify(error);
            }
            $scope.showAlerts({
              type: 'danger',
              message: error
            });
          }
          $scope.$emit('formError', error);
        };
      },
      register: function($scope, $element, options) {
        var self = this;
        var loader = null;
        $scope._src = $scope._src || $scope.src || '';
        $scope._form = $scope.form || {};
        $scope._submission = $scope.submission || {data: {}};
        $scope._submissions = $scope.submissions || [];
        $scope.formLoading = true;

        // Keep track of the elements rendered.
        var elementsRendered = 0;
        $scope.$on('formElementRender', function() {
          elementsRendered++;
          if (elementsRendered === $scope._form.components.length) {
            setTimeout(function() {
              $scope.$emit('formRender', $scope._form);
            }, 1);
          }
        });

        // Used to set the form action.
        var getAction = function(action) {
          if (!action) return '';
          if ($scope.action) return '';
          if (action.substr(0, 1) === '/') {
            action = Formio.getBaseUrl() + action;
          }
          return action;
        };

        // Set the action.
        $scope.action = getAction($scope.formAction);

        // Allow sub components the ability to add new form components to the form.
        var addedData = {};
        $scope.$on('addFormComponent', function(event, component) {
          if (!addedData.hasOwnProperty(component.settings.key)) {
            addedData[component.settings.key] = true;
            var defaultComponent = formioComponents.components[component.type];
            $scope._form.components.push(angular.extend(defaultComponent.settings, component.settings));
          }
        });

        // Set the action if they provided it in the form.
        $scope.$watch('form.action', function(value) {
          if (!value) return;
          var action = getAction(value);
          if (action) {
            $scope.action = action;
          }
        });

        // Return the value and set the scope for the model input.
        $scope.fieldData = function(data, component) {
          var value = Formio.fieldData(data, component);
          var componentInfo = formioComponents.components[component.type];
          if (!componentInfo.tableView) return value;
          if (component.multiple && (value.length > 0)) {
            var values = [];
            angular.forEach(value, function(arrayValue) {
              values.push(componentInfo.tableView(arrayValue, component));
            });
            return values;
          }
          return componentInfo.tableView(value, component);
        };

        $scope.updateSubmissions = function() {
          $scope.formLoading = true;
          var params = {};
          if ($scope.perPage) params.limit = $scope.perPage;
          if ($scope.skip) params.skip = $scope.skip;
          loader.loadSubmissions({params: params}).then(function(submissions) {
            $scope._submissions = submissions;
            $scope.formLoading = false;
            $scope.$emit('submissionsLoad', submissions);
          }, self.onError($scope));
        };

        if ($scope._src) {
          loader = new Formio($scope._src);
          if (options.form) {
            $scope.formLoading = true;
            loader.loadForm().then(function(form) {
              $scope._form = form;
              $scope.formLoading = false;
              $scope.$emit('formLoad', form);
            }, this.onError($scope));
          }
          if (options.submission && loader.submissionId) {
            $scope.formLoading = true;
            loader.loadSubmission().then(function(submission) {
              $scope._submission = submission;
              if (!$scope._submission.data) {
                $scope._submission.data = {};
              }
              $scope.formLoading = false;
              $scope.$emit('submissionLoad', submission);
            }, this.onError($scope));
          }
          if (options.submissions) {
            $scope.updateSubmissions();
          }
        }
        else {

          $scope.formoLoaded = true;
          $scope.formLoading = false;

          // Emit the events if these objects are already loaded.
          if ($scope._form) {
            $scope.$emit('formLoad', $scope._form);
          }
          if ($scope._submission) {
            $scope.$emit('submissionLoad', $scope._submission);
          }
          if ($scope._submissions) {
            $scope.$emit('submissionsLoad', $scope._submissions);
          }
        }

        // Return the loader.
        return loader;
      }
    };
  }
];

},{}],46:[function(require,module,exports){
"use strict";
var formioUtils = require('formio-utils');

module.exports = function() {
  return {
    flattenComponents: formioUtils.flattenComponents,
    eachComponent: formioUtils.eachComponent,
    getComponent: formioUtils.getComponent,
    fieldWrap: function(input) {
      input = input + '<formio-errors></formio-errors>';
      var multiInput = input.replace('data[component.key]', 'data[component.key][$index]');
      var inputLabel = '<label ng-if="component.label && !component.hideLabel" for="{{ component.key }}" class="control-label" ng-class="{\'field-required\': component.validate.required}">{{ component.label }}</label>';
      var requiredInline = '<span ng-if="!component.label && component.validate.required" class="glyphicon glyphicon-asterisk form-control-feedback field-required-inline" aria-hidden="true"></span>';
      var template =
        '<div ng-if="!component.multiple">' +
        inputLabel + requiredInline +
        '<div class="input-group" ng-if="component.prefix || component.suffix">' +
        '<div class="input-group-addon" ng-if="!!component.prefix">{{ component.prefix }}</div>' +
        input +
        '<div class="input-group-addon" ng-if="!!component.suffix">{{ component.suffix }}</div>' +
        '</div>' +
        '<div ng-if="!component.prefix && !component.suffix">' + input + '</div>' +
        '</div>' +
        '<div ng-if="component.multiple"><table class="table table-bordered">' +
        inputLabel +
        '<tr ng-repeat="value in data[component.key] track by $index">' +
        '<td>' + requiredInline +
        '<div class="input-group" ng-if="component.prefix || component.suffix">' +
        '<div class="input-group-addon" ng-if="!!component.prefix">{{ component.prefix }}</div>' +
        multiInput +
        '<div class="input-group-addon" ng-if="!!component.suffix">{{ component.suffix }}</div>' +
        '</div>' +
        '<div ng-if="!component.prefix && !component.suffix">' + multiInput + '</div>' +
        '</td>' +
        '<td><a ng-click="removeFieldValue($index)" class="btn btn-default"><span class="glyphicon glyphicon-remove-circle"></span></a></td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="2"><a ng-click="addFieldValue()" class="btn btn-primary"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span> {{ component.addAnother || "Add Another" }}</a></td>' +
        '</tr>' +
        '</table></div>';
      return template;
    }
  };
};

},{"formio-utils":2}],47:[function(require,module,exports){
"use strict";
module.exports = [
  '$q',
  '$rootScope',
  'Formio',
  function($q, $rootScope, Formio) {
    var Interceptor = {
      /**
       * Update JWT token received from response.
       */
      response: function(response) {
        var token = response.headers('x-jwt-token');
        if (response.status >= 200 && response.status < 300 && token && token !== '') {
          Formio.setToken(token);
        }
        return response;
      },

      /**
       * Intercept a response error.
       */
      responseError: function(response) {
        if (parseInt(response.status, 10) === 440) {
          response.loggedOut = true;
          Formio.setToken(null);
          $rootScope.$broadcast('formio.sessionExpired', response.body);
        }
        else if (parseInt(response.status, 10) === 401) {
          $rootScope.$broadcast('formio.unauthorized', response.body);
        }
        return $q.reject(response);
      },

      /**
       * Set the token in the request headers.
       */
      request: function(config) {
        if (config.disableJWT) return config;
        var token = Formio.getToken();
        if (token) config.headers['x-jwt-token'] = token;
        return config;
      }
    };

    return Interceptor;
  }
];

},{}],48:[function(require,module,exports){
"use strict";
module.exports = [
  'FormioUtils',
  function(FormioUtils) {
    return FormioUtils.flattenComponents;
  }
];

},{}],49:[function(require,module,exports){
"use strict";
module.exports = [
  '$sce',
  function(
    $sce
  ) {
    return function(html) {
      return $sce.trustAsHtml(html);
    };
  }
];

},{}],50:[function(require,module,exports){
"use strict";


var app = angular.module('formio', [
  'ngSanitize',
  'ui.bootstrap',
  'ui.bootstrap.datetimepicker',
  'ui.select',
  'ui.mask',
  'angularMoment',
  'ngFileUpload'
]);

/**
 * Create the formio providers.
 */
app.provider('Formio', require('./providers/Formio'));

app.provider('FormioPlugins', require('./providers/FormioPlugins'));

/**
 * Provides a way to regsiter the Formio scope.
 */
app.factory('FormioScope', require('./factories/FormioScope'));

app.factory('FormioUtils', require('./factories/FormioUtils'));

app.factory('formioInterceptor', require('./factories/formioInterceptor'));

app.directive('formio', require('./directives/formio'));

app.directive('formioDelete', require('./directives/formioDelete'));

app.directive('formioErrors', require('./directives/formioErrors'));

app.directive('customValidator', require('./directives/customValidator'));

app.directive('formioSubmissions', require('./directives/formioSubmissions'));

app.directive('formioComponent', require('./directives/formioComponent'));

app.directive('formioElement', require('./directives/formioElement'));

/**
 * Filter to flatten form components.
 */
app.filter('flattenComponents', require('./filters/flattenComponents'));

app.filter('safehtml', require('./filters/safehtml'));

app.config([
  '$httpProvider',
  function(
    $httpProvider
  ) {
    if (!$httpProvider.defaults.headers.get) {
      $httpProvider.defaults.headers.get = {};
    }

    // Disable IE caching for GET requests.
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get.Pragma = 'no-cache';
    $httpProvider.interceptors.push('formioInterceptor');
  }
]);

require('./plugins')(app);

app.run([
  '$templateCache',
  function($templateCache) {

    // The template for the formio forms.
    $templateCache.put('formio.html',
      "<form role=\"form\" name=\"formioForm\" ng-submit=\"onSubmit(formioForm)\" novalidate>\n  <i style=\"font-size: 2em;\" ng-if=\"formLoading\" class=\"glyphicon glyphicon-refresh glyphicon-spin\"></i>\n  <div ng-repeat=\"alert in formioAlerts\" class=\"alert alert-{{ alert.type }}\" role=\"alert\">\n    {{ alert.message }}\n  </div>\n  <formio-component ng-repeat=\"component in _form.components track by $index\" component=\"component\" data=\"_submission.data\" form=\"formioForm\" formio=\"formio\" read-only=\"readOnly\"></formio-component>\n</form>\n"
    );

    $templateCache.put('formio-delete.html',
      "<form role=\"form\">\n  <div ng-repeat=\"alert in formioAlerts\" class=\"alert alert-{{ alert.type }}\" role=\"alert\">\n    {{ alert.message }}\n  </div>\n  <h3>Are you sure you wish to delete the {{ resourceName || _resourceName }}?</h3>\n  <div class=\"btn-toolbar\">\n    <button ng-click=\"onDelete()\" class=\"btn btn-danger\">Yes</button>\n    <button ng-click=\"onCancel()\" class=\"btn btn-default\">No</button>\n  </div>\n</form>\n"
    );

    $templateCache.put('formio/submissions.html',
      "<div>\n  <div ng-repeat=\"alert in formioAlerts\" class=\"alert alert-{{ alert.type }}\" role=\"alert\">\n    {{ alert.message }}\n  </div>\n  <table class=\"table\">\n    <thead>\n      <tr>\n        <th ng-repeat=\"component in _form.components | flattenComponents\" ng-if=\"tableView(component)\">{{ component.label || component.key }}</th>\n        <th>Submitted</th>\n        <th>Updated</th>\n        <th>Operations</th>\n      </tr>\n    </thead>\n    <tbody>\n      <tr ng-repeat=\"submission in _submissions\" class=\"formio-submission\" ng-click=\"$emit('submissionView', submission)\">\n        <td ng-repeat=\"component in _form.components | flattenComponents\" ng-if=\"tableView(component)\">{{ fieldData(submission.data, component) }}</td>\n        <td>{{ submission.created | amDateFormat:'l, h:mm:ss a' }}</td>\n        <td>{{ submission.modified | amDateFormat:'l, h:mm:ss a' }}</td>\n        <td>\n          <div class=\"button-group\" style=\"display:flex;\">\n            <a ng-click=\"$emit('submissionView', submission); $event.stopPropagation();\" class=\"btn btn-primary btn-xs\"><span class=\"glyphicon glyphicon-eye-open\"></span></a>&nbsp;\n            <a ng-click=\"$emit('submissionEdit', submission); $event.stopPropagation();\" class=\"btn btn-default btn-xs\"><span class=\"glyphicon glyphicon-edit\"></span></a>&nbsp;\n            <a ng-click=\"$emit('submissionDelete', submission); $event.stopPropagation();\" class=\"btn btn-danger btn-xs\"><span class=\"glyphicon glyphicon-remove-circle\"></span></a>\n          </div>\n        </td>\n      </tr>\n    </tbody>\n  </table>\n  <pagination\n    ng-if=\"_submissions.serverCount > perPage\"\n    ng-model=\"currentPage\"\n    ng-change=\"pageChanged(currentPage)\"\n    total-items=\"_submissions.serverCount\"\n    items-per-page=\"perPage\"\n    direction-links=\"false\"\n    boundary-links=\"true\"\n    first-text=\"&laquo;\"\n    last-text=\"&raquo;\"\n    >\n  </pagination>\n</div>\n"
    );

    // A formio component template.
    $templateCache.put('formio/component.html',
      "<ng-form name=\"formioFieldForm\" class=\"formio-component-{{ component.key }}\">\n  <div class=\"form-group has-feedback form-field-type-{{ component.type }} {{component.customClass}}\" id=\"form-group-{{ component.key }}\" ng-class=\"{'has-error': formioFieldForm[component.key].$invalid && !formioFieldForm[component.key].$pristine }\" ng-style=\"component.style\">\n    <formio-element></formio-element>\n  </div>\n</ng-form>\n"
    );

    $templateCache.put('formio/errors.html',
      "<div ng-show=\"formioFieldForm[component.key].$error && !formioFieldForm[component.key].$pristine\">\n  <p class=\"help-block\" ng-show=\"formioFieldForm[component.key].$error.email\">{{ component.label || component.key }} must be a valid email.</p>\n  <p class=\"help-block\" ng-show=\"formioFieldForm[component.key].$error.required\">{{ component.label || component.key }} is required.</p>\n  <p class=\"help-block\" ng-show=\"formioFieldForm[component.key].$error.number\">{{ component.label || component.key }} must be a number.</p>\n  <p class=\"help-block\" ng-show=\"formioFieldForm[component.key].$error.maxlength\">{{ component.label || component.key }} must be shorter than {{ component.validate.maxLength + 1 }} characters.</p>\n  <p class=\"help-block\" ng-show=\"formioFieldForm[component.key].$error.minlength\">{{ component.label || component.key }} must be longer than {{ component.validate.minLength - 1 }} characters.</p>\n  <p class=\"help-block\" ng-show=\"formioFieldForm[component.key].$error.min\">{{ component.label || component.key }} must be higher than {{ component.validate.min - 1 }}.</p>\n  <p class=\"help-block\" ng-show=\"formioFieldForm[component.key].$error.max\">{{ component.label || component.key }} must be lower than {{ component.validate.max + 1 }}.</p>\n  <p class=\"help-block\" ng-show=\"formioFieldForm[component.key].$error.custom\">{{ component.customError }}</p>\n  <p class=\"help-block\" ng-show=\"formioFieldForm[component.key].$error.pattern\">{{ component.label || component.key }} does not match the pattern {{ component.validate.pattern }}</p>\n</div>\n"
    );
  }
]);

require('./components');

},{"./components":23,"./directives/customValidator":38,"./directives/formio":39,"./directives/formioComponent":40,"./directives/formioDelete":41,"./directives/formioElement":42,"./directives/formioErrors":43,"./directives/formioSubmissions":44,"./factories/FormioScope":45,"./factories/FormioUtils":46,"./factories/formioInterceptor":47,"./filters/flattenComponents":48,"./filters/safehtml":49,"./plugins":51,"./providers/Formio":55,"./providers/FormioPlugins":56}],51:[function(require,module,exports){
"use strict";
module.exports = function(app) {
  require('./storage/url')(app);
  require('./storage/s3')(app);
  require('./storage/dropbox')(app);
};

},{"./storage/dropbox":52,"./storage/s3":53,"./storage/url":54}],52:[function(require,module,exports){
"use strict";

module.exports = function(app) {
  app.config([
    'FormioPluginsProvider',
    'FormioStorageDropboxProvider',
    function (
      FormioPluginsProvider,
      FormioStorageDropboxProvider
    ) {
      FormioPluginsProvider.register('storage', 'dropbox', FormioStorageDropboxProvider.$get());
    }]
  );

  app.factory('FormioStorageDropbox', [
    '$q',
    '$rootScope',
    '$window',
    '$http',
    function(
      $q,
      $rootScope,
      $window,
      $http
    ) {
      var getDropboxToken = function() {
        var dropboxToken;
        if ($rootScope.user && $rootScope.user.externalTokens) {
          angular.forEach($rootScope.user.externalTokens, function(token) {
            if (token.type === 'dropbox') {
              dropboxToken = token.token;
            }
          });
        }
        return dropboxToken;
        //return _.result(_.find($rootScope.user.externalTokens, {type: 'dropbox'}), 'token');
      };

      return {
        title: 'Dropbox',
        name: 'dropbox',
        uploadFile: function(file, status, $scope) {
          var defer = $q.defer();
          var dir = $scope.component.dir || '';
          var dropboxToken = getDropboxToken();
          if (!dropboxToken) {
            defer.reject('You must authenticate with dropbox before uploading files.');
          }
          else {
            // Both Upload and $http don't handle files as application/octet-stream which is required by dropbox.
            var xhr = new XMLHttpRequest();

            var onProgress = function(evt) {
              status.status = 'progress';
              status.progress = parseInt(100.0 * evt.loaded / evt.total);
              delete status.message;
              $scope.$apply();
            };

            xhr.upload.onprogress = onProgress;

            xhr.onload = function() {
              if (xhr.status === 200) {
                defer.resolve(JSON.parse(xhr.response));
                $scope.$apply();
              }
              else {
                defer.reject(xhr.response || 'Unable to upload file');
                $scope.$apply();
              }
            };

            xhr.open('POST', 'https://content.dropboxapi.com/2/files/upload');
            xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify({
              path: '/' + dir + file.name,
              mode: 'add',
              autorename: true,
              mute: false
            }));

            xhr.send(file);
          }
          return defer.promise;
        },
        downloadFile: function(evt, file) {
          evt.preventDefault();
          var dropboxToken = getDropboxToken();
          $http({
            method: 'POST',
            url: 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
            headers: {
              'Authorization': 'Bearer ' + dropboxToken,
              'Content-Type': 'application/json'
            },
            data: {
              path: file.path_lower
            },
            disableJWT: true
          }).then(function successCallback(response) {
            $window.open(response.data.url, '_blank');
          }, function errorCallback(response) {
            alert(response.data);
          });
        }
      };
    }
  ]);
};

},{}],53:[function(require,module,exports){
"use strict";

module.exports = function(app) {
  app.config([
    'FormioPluginsProvider',
    'FormioStorageS3Provider',
    function (
      FormioPluginsProvider,
      FormioStorageS3Provider
    ) {
      FormioPluginsProvider.register('storage', 's3', FormioStorageS3Provider.$get());
    }
  ]);

  app.factory('FormioStorageS3', [
    '$q',
    '$window',
    'Formio',
    'Upload',
    function(
      $q,
      $window,
      Formio,
      Upload
    ) {
      return {
        title: 'S3',
        name: 's3',
        uploadFile: function(file, status, $scope) {
          var defer = $q.defer();
          Formio.request($scope.formio.formUrl + '/storage/s3', 'POST', {
            name: file.name,
            size: file.size,
            type: file.type
          })
            .then(function(response) {
              var request = {
                url: response.url,
                method: 'POST',
                data: response.data
              };
              request.data.file = file;
              var dir = $scope.component.dir || '';
              request.data.key += dir + file.name;
              var upload = Upload.upload(request);
              upload
                .then(function() {
                  // Handle upload finished.
                  defer.resolve({
                    name: file.name,
                    bucket: response.bucket,
                    key: request.data.key,
                    url: response.url + request.data.key,
                    acl: request.data.acl,
                    size: file.size,
                    type: file.type
                  });
                }, function(resp) {
                  // Handle error
                  var oParser = new DOMParser();
                  var oDOM = oParser.parseFromString(resp.data, 'text/xml');
                  var message = oDOM.getElementsByTagName('Message')[0].innerHTML;
                  defer.reject(message);
                }, function(evt) {
                  // Progress notify
                  status.status = 'progress';
                  status.progress = parseInt(100.0 * evt.loaded / evt.total);
                  delete status.message;
                });
            });
          return defer.promise;
        },
        downloadFile: function(evt, file, $scope) {
          // If this is not a public file, get a signed url and open in new tab.
          if (file.acl !== 'public-read') {
            evt.preventDefault();
            Formio.request($scope.form + '/storage/s3?bucket=' + file.bucket + '&key=' + file.key, 'GET')
              .then(function (response) {
                $window.open(response.url, '_blank');
              })
              .catch(function (response) {
                // Is alert the best way to do this?
                // User is expecting an immediate notification due to attempting to download a file.
                alert(response);
              });
          }
        }
      };
    }
  ]);
};

},{}],54:[function(require,module,exports){
"use strict";
module.exports = function(app) {
  app.config([
    'FormioPluginsProvider',
    'FormioStorageUrlProvider',
    function (
      FormioPluginsProvider,
      FormioStorageUrlProvider
    ) {
      FormioPluginsProvider.register('storage', 'url', FormioStorageUrlProvider.$get());
    }
  ]);

  app.factory('FormioStorageUrl', [
    '$q',
    'Upload',
    function (
      $q,
      Upload
    ) {
      return {
        title: 'Url',
        name: 'url',
        uploadFile: function(file, status, $scope) {
          var defer = $q.defer();
          Upload.upload({
            url: $scope.component.url,
            data: {
              file: file
            }
          })
            .then(function(resp) {
              defer.resolve(resp);
            }, function(resp) {
              defer.reject(resp.data);
            }, function (evt) {
              // Progress notify
              status.status = 'progress';
              status.progress = parseInt(100.0 * evt.loaded / evt.total);
              delete status.message;
            });
          return defer.promise;
        },
        downloadFile: function() {
          // Do nothing which will cause a normal link click to occur.
        }
      };
    }]
  );
};

},{}],55:[function(require,module,exports){
"use strict";
module.exports = function() {

  // The formio class.
  var Formio = require('formiojs/src/formio.js');

  // Return the provider interface.
  return {

    // Expose Formio configuration functions
    setBaseUrl: Formio.setBaseUrl,
    getBaseUrl: Formio.getBaseUrl,
    registerPlugin: Formio.registerPlugin,
    getPlugin: Formio.getPlugin,
    setDomain: function(dom) {
      // Remove this?
    },

    $get: [
      '$rootScope',
      '$q',
      function(
        $rootScope,
        $q
      ) {

        var wrapQPromise = function(promise) {
          return $q.when(promise)
          .catch(function(error) {
            if (error === 'Unauthorized') {
              $rootScope.$broadcast('formio.unauthorized', error);
            }
            else if (error === 'Login Timeout') {
              $rootScope.$broadcast('formio.sessionExpired', error);
            }
            // Propagate error
            throw error;
          });
        };

        Formio.registerPlugin({
          priority: -100,
          // Wrap Formio.request's promises with $q so $apply gets called correctly.
          wrapRequestPromise: wrapQPromise,
          wrapStaticRequestPromise: wrapQPromise
        }, 'ngFormioPromiseWrapper');

        // Broadcast offline events from $rootScope
        Formio.events.onAny(function() {
          var event = 'formio.' + this.event;
          var args = [].splice.call(arguments, 0);
          args.unshift(event);
          $rootScope.$apply(function() {
            $rootScope.$broadcast.apply($rootScope, args);
          });
        });

        // Return the formio interface.
        return Formio;
      }
    ]
  };
};

},{"formiojs/src/formio.js":7}],56:[function(require,module,exports){
"use strict";

module.exports = function() {

  var plugins = {};

  return {

    register: function(type, name, plugin) {
      if (!plugins[type]) {
        plugins[type] = {};
      }
      plugins[type][name] = plugin;
    },

    $get: [
      function() {
        return function(type, name) {
          if (type) {
            if (name) {
              return plugins[type][name] || false;
            }
            return plugins[type] || false;
          }
          return plugins;
        };
      }
    ]
  };
};

},{}]},{},[50])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Zvcm1pby11dGlscy9zcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZm9ybWlvanMvbm9kZV9tb2R1bGVzL1EvcS5qcyIsIm5vZGVfbW9kdWxlcy9mb3JtaW9qcy9ub2RlX21vZHVsZXMvZXZlbnRlbWl0dGVyMi9saWIvZXZlbnRlbWl0dGVyMi5qcyIsIm5vZGVfbW9kdWxlcy9mb3JtaW9qcy9ub2RlX21vZHVsZXMvc2hhbGxvdy1jb3B5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Zvcm1pb2pzL25vZGVfbW9kdWxlcy93aGF0d2ctZmV0Y2gvZmV0Y2guanMiLCJub2RlX21vZHVsZXMvZm9ybWlvanMvc3JjL2Zvcm1pby5qcyIsInNyYy9jb21wb25lbnRzL2FkZHJlc3MuanMiLCJzcmMvY29tcG9uZW50cy9idXR0b24uanMiLCJzcmMvY29tcG9uZW50cy9jaGVja2JveC5qcyIsInNyYy9jb21wb25lbnRzL2NvbHVtbnMuanMiLCJzcmMvY29tcG9uZW50cy9jb21wb25lbnRzLmpzIiwic3JjL2NvbXBvbmVudHMvY29udGFpbmVyLmpzIiwic3JjL2NvbXBvbmVudHMvY29udGVudC5qcyIsInNyYy9jb21wb25lbnRzL2N1c3RvbS5qcyIsInNyYy9jb21wb25lbnRzL2RhdGFncmlkLmpzIiwic3JjL2NvbXBvbmVudHMvZGF0ZXRpbWUuanMiLCJzcmMvY29tcG9uZW50cy9lbWFpbC5qcyIsInNyYy9jb21wb25lbnRzL2ZpZWxkc2V0LmpzIiwic3JjL2NvbXBvbmVudHMvZmlsZS5qcyIsInNyYy9jb21wb25lbnRzL2hpZGRlbi5qcyIsInNyYy9jb21wb25lbnRzL2h0bWxlbGVtZW50LmpzIiwic3JjL2NvbXBvbmVudHMvaW5kZXguanMiLCJzcmMvY29tcG9uZW50cy9udW1iZXIuanMiLCJzcmMvY29tcG9uZW50cy9wYWdlLmpzIiwic3JjL2NvbXBvbmVudHMvcGFuZWwuanMiLCJzcmMvY29tcG9uZW50cy9wYXNzd29yZC5qcyIsInNyYy9jb21wb25lbnRzL3Bob25lbnVtYmVyLmpzIiwic3JjL2NvbXBvbmVudHMvcmFkaW8uanMiLCJzcmMvY29tcG9uZW50cy9yZXNvdXJjZS5qcyIsInNyYy9jb21wb25lbnRzL3NlbGVjdC5qcyIsInNyYy9jb21wb25lbnRzL3NlbGVjdGJveGVzLmpzIiwic3JjL2NvbXBvbmVudHMvc2lnbmF0dXJlLmpzIiwic3JjL2NvbXBvbmVudHMvdGFibGUuanMiLCJzcmMvY29tcG9uZW50cy90ZXh0YXJlYS5qcyIsInNyYy9jb21wb25lbnRzL3RleHRmaWVsZC5qcyIsInNyYy9jb21wb25lbnRzL3dlbGwuanMiLCJzcmMvZGlyZWN0aXZlcy9jdXN0b21WYWxpZGF0b3IuanMiLCJzcmMvZGlyZWN0aXZlcy9mb3JtaW8uanMiLCJzcmMvZGlyZWN0aXZlcy9mb3JtaW9Db21wb25lbnQuanMiLCJzcmMvZGlyZWN0aXZlcy9mb3JtaW9EZWxldGUuanMiLCJzcmMvZGlyZWN0aXZlcy9mb3JtaW9FbGVtZW50LmpzIiwic3JjL2RpcmVjdGl2ZXMvZm9ybWlvRXJyb3JzLmpzIiwic3JjL2RpcmVjdGl2ZXMvZm9ybWlvU3VibWlzc2lvbnMuanMiLCJzcmMvZmFjdG9yaWVzL0Zvcm1pb1Njb3BlLmpzIiwic3JjL2ZhY3Rvcmllcy9Gb3JtaW9VdGlscy5qcyIsInNyYy9mYWN0b3JpZXMvZm9ybWlvSW50ZXJjZXB0b3IuanMiLCJzcmMvZmlsdGVycy9mbGF0dGVuQ29tcG9uZW50cy5qcyIsInNyYy9maWx0ZXJzL3NhZmVodG1sLmpzIiwic3JjL2Zvcm1pby5qcyIsInNyYy9wbHVnaW5zL2luZGV4LmpzIiwic3JjL3BsdWdpbnMvc3RvcmFnZS9kcm9wYm94LmpzIiwic3JjL3BsdWdpbnMvc3RvcmFnZS9zMy5qcyIsInNyYy9wbHVnaW5zL3N0b3JhZ2UvdXJsLmpzIiwic3JjL3Byb3ZpZGVycy9Gb3JtaW8uanMiLCJzcmMvcHJvdmlkZXJzL0Zvcm1pb1BsdWdpbnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hnRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDem1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgLyoqXG4gICAqIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIGNvbXBvbmVudCB3aXRoaW4gYSBmb3JtLlxuICAgKiBAcGFyYW0gY29tcG9uZW50c1xuICAgKiBAcGFyYW0gZm5cbiAgICovXG4gIGVhY2hDb21wb25lbnQ6IGZ1bmN0aW9uIGVhY2hDb21wb25lbnQoY29tcG9uZW50cywgZm4pIHtcbiAgICBpZiAoIWNvbXBvbmVudHMpIHJldHVybjtcblxuICAgIGNvbXBvbmVudHMuZm9yRWFjaChmdW5jdGlvbihjb21wb25lbnQpIHtcbiAgICAgIGlmIChjb21wb25lbnQuY29sdW1ucyAmJiBBcnJheS5pc0FycmF5KGNvbXBvbmVudC5jb2x1bW5zKSkge1xuICAgICAgICBjb21wb25lbnQuY29sdW1ucy5mb3JFYWNoKGZ1bmN0aW9uKGNvbHVtbikge1xuICAgICAgICAgIGVhY2hDb21wb25lbnQoY29sdW1uLmNvbXBvbmVudHMsIGZuKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGVsc2UgaWYgKGNvbXBvbmVudC5yb3dzICYmIEFycmF5LmlzQXJyYXkoY29tcG9uZW50LnJvd3MpKSB7XG4gICAgICAgIFtdLmNvbmNhdC5hcHBseShbXSwgY29tcG9uZW50LnJvd3MpLmZvckVhY2goZnVuY3Rpb24ocm93KSB7XG4gICAgICAgICAgZWFjaENvbXBvbmVudChyb3cuY29tcG9uZW50cywgZm4pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZWxzZSBpZiAoY29tcG9uZW50LmNvbXBvbmVudHMgJiYgQXJyYXkuaXNBcnJheShjb21wb25lbnQuY29tcG9uZW50cykpIHtcbiAgICAgICAgZWFjaENvbXBvbmVudChjb21wb25lbnQuY29tcG9uZW50cywgZm4pO1xuICAgICAgfVxuXG4gICAgICBlbHNlIHtcbiAgICAgICAgZm4oY29tcG9uZW50KTtcbiAgICAgIH1cbiAgICAgIC8vIElmIHRoZSBjb21wb25lbnQgaXMgYSB0cmVlLCBiZSBzdXJlIHRvIGFkZCBpdCBiYWNrIGluIGFzIHdlbGwuXG4gICAgICBpZiAoY29tcG9uZW50LnRyZWUpIHtcbiAgICAgICAgZm4oY29tcG9uZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGEgY29tcG9uZW50IGJ5IGl0cyBrZXlcbiAgICogQHBhcmFtIGNvbXBvbmVudHNcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IG9mIHRoZSBjb21wb25lbnQgdG8gZ2V0XG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdGhhdCBtYXRjaGVzIHRoZSBnaXZlbiBrZXksIG9yIHVuZGVmaW5lZCBpZiBub3QgZm91bmQuXG4gICAqL1xuICBnZXRDb21wb25lbnQ6IGZ1bmN0aW9uIGdldENvbXBvbmVudChjb21wb25lbnRzLCBrZXkpIHtcbiAgICB2YXIgcmVzdWx0O1xuICAgIG1vZHVsZS5leHBvcnRzLmVhY2hDb21wb25lbnQoY29tcG9uZW50cywgZnVuY3Rpb24oY29tcG9uZW50KSB7XG4gICAgICBpZiAoY29tcG9uZW50LmtleSA9PT0ga2V5KSB7XG4gICAgICAgIHJlc3VsdCA9IGNvbXBvbmVudDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuXG4gIC8qKlxuICAgKiBGbGF0dGVuIHRoZSBmb3JtIGNvbXBvbmVudHMgZm9yIGRhdGEgbWFuaXB1bGF0aW9uLlxuICAgKiBAcGFyYW0gY29tcG9uZW50c1xuICAgKiBAcGFyYW0gZmxhdHRlbmVkXG4gICAqIEByZXR1cm5zIHsqfHt9fVxuICAgKi9cbiAgZmxhdHRlbkNvbXBvbmVudHM6IGZ1bmN0aW9uIGZsYXR0ZW5Db21wb25lbnRzKGNvbXBvbmVudHMpIHtcbiAgICB2YXIgZmxhdHRlbmVkID0ge307XG4gICAgbW9kdWxlLmV4cG9ydHMuZWFjaENvbXBvbmVudChjb21wb25lbnRzLCBmdW5jdGlvbihjb21wb25lbnQpIHtcbiAgICAgIGZsYXR0ZW5lZFtjb21wb25lbnQua2V5XSA9IGNvbXBvbmVudDtcbiAgICB9KTtcbiAgICByZXR1cm4gZmxhdHRlbmVkO1xuICB9XG59O1xuIiwiLy8gdmltOnRzPTQ6c3RzPTQ6c3c9NDpcbi8qIVxuICpcbiAqIENvcHlyaWdodCAyMDA5LTIwMTIgS3JpcyBLb3dhbCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVFxuICogbGljZW5zZSBmb3VuZCBhdCBodHRwOi8vZ2l0aHViLmNvbS9rcmlza293YWwvcS9yYXcvbWFzdGVyL0xJQ0VOU0VcbiAqXG4gKiBXaXRoIHBhcnRzIGJ5IFR5bGVyIENsb3NlXG4gKiBDb3B5cmlnaHQgMjAwNy0yMDA5IFR5bGVyIENsb3NlIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUIFggbGljZW5zZSBmb3VuZFxuICogYXQgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5odG1sXG4gKiBGb3JrZWQgYXQgcmVmX3NlbmQuanMgdmVyc2lvbjogMjAwOS0wNS0xMVxuICpcbiAqIFdpdGggcGFydHMgYnkgTWFyayBNaWxsZXJcbiAqIENvcHlyaWdodCAoQykgMjAxMSBHb29nbGUgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICpcbiAqL1xuXG4oZnVuY3Rpb24gKGRlZmluaXRpb24pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIC8vIFRoaXMgZmlsZSB3aWxsIGZ1bmN0aW9uIHByb3Blcmx5IGFzIGEgPHNjcmlwdD4gdGFnLCBvciBhIG1vZHVsZVxuICAgIC8vIHVzaW5nIENvbW1vbkpTIGFuZCBOb2RlSlMgb3IgUmVxdWlyZUpTIG1vZHVsZSBmb3JtYXRzLiAgSW5cbiAgICAvLyBDb21tb24vTm9kZS9SZXF1aXJlSlMsIHRoZSBtb2R1bGUgZXhwb3J0cyB0aGUgUSBBUEkgYW5kIHdoZW5cbiAgICAvLyBleGVjdXRlZCBhcyBhIHNpbXBsZSA8c2NyaXB0PiwgaXQgY3JlYXRlcyBhIFEgZ2xvYmFsIGluc3RlYWQuXG5cbiAgICAvLyBNb250YWdlIFJlcXVpcmVcbiAgICBpZiAodHlwZW9mIGJvb3RzdHJhcCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGJvb3RzdHJhcChcInByb21pc2VcIiwgZGVmaW5pdGlvbik7XG5cbiAgICAvLyBDb21tb25KU1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcblxuICAgIC8vIFJlcXVpcmVKU1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKGRlZmluaXRpb24pO1xuXG4gICAgLy8gU0VTIChTZWN1cmUgRWNtYVNjcmlwdClcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaWYgKCFzZXMub2soKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VzLm1ha2VRID0gZGVmaW5pdGlvbjtcbiAgICAgICAgfVxuXG4gICAgLy8gPHNjcmlwdD5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgfHwgdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gUHJlZmVyIHdpbmRvdyBvdmVyIHNlbGYgZm9yIGFkZC1vbiBzY3JpcHRzLiBVc2Ugc2VsZiBmb3JcbiAgICAgICAgLy8gbm9uLXdpbmRvd2VkIGNvbnRleHRzLlxuICAgICAgICB2YXIgZ2xvYmFsID0gdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHNlbGY7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBgd2luZG93YCBvYmplY3QsIHNhdmUgdGhlIHByZXZpb3VzIFEgZ2xvYmFsXG4gICAgICAgIC8vIGFuZCBpbml0aWFsaXplIFEgYXMgYSBnbG9iYWwuXG4gICAgICAgIHZhciBwcmV2aW91c1EgPSBnbG9iYWwuUTtcbiAgICAgICAgZ2xvYmFsLlEgPSBkZWZpbml0aW9uKCk7XG5cbiAgICAgICAgLy8gQWRkIGEgbm9Db25mbGljdCBmdW5jdGlvbiBzbyBRIGNhbiBiZSByZW1vdmVkIGZyb20gdGhlXG4gICAgICAgIC8vIGdsb2JhbCBuYW1lc3BhY2UuXG4gICAgICAgIGdsb2JhbC5RLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBnbG9iYWwuUSA9IHByZXZpb3VzUTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhpcyBlbnZpcm9ubWVudCB3YXMgbm90IGFudGljaXBhdGVkIGJ5IFEuIFBsZWFzZSBmaWxlIGEgYnVnLlwiKTtcbiAgICB9XG5cbn0pKGZ1bmN0aW9uICgpIHtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgaGFzU3RhY2tzID0gZmFsc2U7XG50cnkge1xuICAgIHRocm93IG5ldyBFcnJvcigpO1xufSBjYXRjaCAoZSkge1xuICAgIGhhc1N0YWNrcyA9ICEhZS5zdGFjaztcbn1cblxuLy8gQWxsIGNvZGUgYWZ0ZXIgdGhpcyBwb2ludCB3aWxsIGJlIGZpbHRlcmVkIGZyb20gc3RhY2sgdHJhY2VzIHJlcG9ydGVkXG4vLyBieSBRLlxudmFyIHFTdGFydGluZ0xpbmUgPSBjYXB0dXJlTGluZSgpO1xudmFyIHFGaWxlTmFtZTtcblxuLy8gc2hpbXNcblxuLy8gdXNlZCBmb3IgZmFsbGJhY2sgaW4gXCJhbGxSZXNvbHZlZFwiXG52YXIgbm9vcCA9IGZ1bmN0aW9uICgpIHt9O1xuXG4vLyBVc2UgdGhlIGZhc3Rlc3QgcG9zc2libGUgbWVhbnMgdG8gZXhlY3V0ZSBhIHRhc2sgaW4gYSBmdXR1cmUgdHVyblxuLy8gb2YgdGhlIGV2ZW50IGxvb3AuXG52YXIgbmV4dFRpY2sgPShmdW5jdGlvbiAoKSB7XG4gICAgLy8gbGlua2VkIGxpc3Qgb2YgdGFza3MgKHNpbmdsZSwgd2l0aCBoZWFkIG5vZGUpXG4gICAgdmFyIGhlYWQgPSB7dGFzazogdm9pZCAwLCBuZXh0OiBudWxsfTtcbiAgICB2YXIgdGFpbCA9IGhlYWQ7XG4gICAgdmFyIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgdmFyIHJlcXVlc3RUaWNrID0gdm9pZCAwO1xuICAgIHZhciBpc05vZGVKUyA9IGZhbHNlO1xuICAgIC8vIHF1ZXVlIGZvciBsYXRlIHRhc2tzLCB1c2VkIGJ5IHVuaGFuZGxlZCByZWplY3Rpb24gdHJhY2tpbmdcbiAgICB2YXIgbGF0ZXJRdWV1ZSA9IFtdO1xuXG4gICAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgICAgIC8qIGpzaGludCBsb29wZnVuYzogdHJ1ZSAqL1xuICAgICAgICB2YXIgdGFzaywgZG9tYWluO1xuXG4gICAgICAgIHdoaWxlIChoZWFkLm5leHQpIHtcbiAgICAgICAgICAgIGhlYWQgPSBoZWFkLm5leHQ7XG4gICAgICAgICAgICB0YXNrID0gaGVhZC50YXNrO1xuICAgICAgICAgICAgaGVhZC50YXNrID0gdm9pZCAwO1xuICAgICAgICAgICAgZG9tYWluID0gaGVhZC5kb21haW47XG5cbiAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICBoZWFkLmRvbWFpbiA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJ1blNpbmdsZSh0YXNrLCBkb21haW4pO1xuXG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGxhdGVyUXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgICB0YXNrID0gbGF0ZXJRdWV1ZS5wb3AoKTtcbiAgICAgICAgICAgIHJ1blNpbmdsZSh0YXNrKTtcbiAgICAgICAgfVxuICAgICAgICBmbHVzaGluZyA9IGZhbHNlO1xuICAgIH1cbiAgICAvLyBydW5zIGEgc2luZ2xlIGZ1bmN0aW9uIGluIHRoZSBhc3luYyBxdWV1ZVxuICAgIGZ1bmN0aW9uIHJ1blNpbmdsZSh0YXNrLCBkb21haW4pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRhc2soKTtcblxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoaXNOb2RlSlMpIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBub2RlLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBjb25zaWRlcmVkIGZhdGFsIGVycm9ycy5cbiAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIHN5bmNocm9ub3VzbHkgdG8gaW50ZXJydXB0IGZsdXNoaW5nIVxuXG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIGNvbnRpbnVhdGlvbiBpZiB0aGUgdW5jYXVnaHQgZXhjZXB0aW9uIGlzIHN1cHByZXNzZWRcbiAgICAgICAgICAgICAgICAvLyBsaXN0ZW5pbmcgXCJ1bmNhdWdodEV4Y2VwdGlvblwiIGV2ZW50cyAoYXMgZG9tYWlucyBkb2VzKS5cbiAgICAgICAgICAgICAgICAvLyBDb250aW51ZSBpbiBuZXh0IGV2ZW50IHRvIGF2b2lkIHRpY2sgcmVjdXJzaW9uLlxuICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEluIGJyb3dzZXJzLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuXG4gICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBhc3luY2hyb25vdXNseSB0byBhdm9pZCBzbG93LWRvd25zLlxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5leHRUaWNrID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGFpbCA9IHRhaWwubmV4dCA9IHtcbiAgICAgICAgICAgIHRhc2s6IHRhc2ssXG4gICAgICAgICAgICBkb21haW46IGlzTm9kZUpTICYmIHByb2Nlc3MuZG9tYWluLFxuICAgICAgICAgICAgbmV4dDogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghZmx1c2hpbmcpIHtcbiAgICAgICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIHByb2Nlc3MudG9TdHJpbmcoKSA9PT0gXCJbb2JqZWN0IHByb2Nlc3NdXCIgJiYgcHJvY2Vzcy5uZXh0VGljaykge1xuICAgICAgICAvLyBFbnN1cmUgUSBpcyBpbiBhIHJlYWwgTm9kZSBlbnZpcm9ubWVudCwgd2l0aCBhIGBwcm9jZXNzLm5leHRUaWNrYC5cbiAgICAgICAgLy8gVG8gc2VlIHRocm91Z2ggZmFrZSBOb2RlIGVudmlyb25tZW50czpcbiAgICAgICAgLy8gKiBNb2NoYSB0ZXN0IHJ1bm5lciAtIGV4cG9zZXMgYSBgcHJvY2Vzc2AgZ2xvYmFsIHdpdGhvdXQgYSBgbmV4dFRpY2tgXG4gICAgICAgIC8vICogQnJvd3NlcmlmeSAtIGV4cG9zZXMgYSBgcHJvY2Vzcy5uZXhUaWNrYCBmdW5jdGlvbiB0aGF0IHVzZXNcbiAgICAgICAgLy8gICBgc2V0VGltZW91dGAuIEluIHRoaXMgY2FzZSBgc2V0SW1tZWRpYXRlYCBpcyBwcmVmZXJyZWQgYmVjYXVzZVxuICAgICAgICAvLyAgICBpdCBpcyBmYXN0ZXIuIEJyb3dzZXJpZnkncyBgcHJvY2Vzcy50b1N0cmluZygpYCB5aWVsZHNcbiAgICAgICAgLy8gICBcIltvYmplY3QgT2JqZWN0XVwiLCB3aGlsZSBpbiBhIHJlYWwgTm9kZSBlbnZpcm9ubWVudFxuICAgICAgICAvLyAgIGBwcm9jZXNzLm5leHRUaWNrKClgIHlpZWxkcyBcIltvYmplY3QgcHJvY2Vzc11cIi5cbiAgICAgICAgaXNOb2RlSlMgPSB0cnVlO1xuXG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcHJvY2Vzcy5uZXh0VGljayhmbHVzaCk7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAvLyBJbiBJRTEwLCBOb2RlLmpzIDAuOSssIG9yIGh0dHBzOi8vZ2l0aHViLmNvbS9Ob2JsZUpTL3NldEltbWVkaWF0ZVxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSBzZXRJbW1lZGlhdGUuYmluZCh3aW5kb3csIGZsdXNoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNldEltbWVkaWF0ZShmbHVzaCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBNZXNzYWdlQ2hhbm5lbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBtb2Rlcm4gYnJvd3NlcnNcbiAgICAgICAgLy8gaHR0cDovL3d3dy5ub25ibG9ja2luZy5pby8yMDExLzA2L3dpbmRvd25leHR0aWNrLmh0bWxcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICAgICAgLy8gQXQgbGVhc3QgU2FmYXJpIFZlcnNpb24gNi4wLjUgKDg1MzYuMzAuMSkgaW50ZXJtaXR0ZW50bHkgY2Fubm90IGNyZWF0ZVxuICAgICAgICAvLyB3b3JraW5nIG1lc3NhZ2UgcG9ydHMgdGhlIGZpcnN0IHRpbWUgYSBwYWdlIGxvYWRzLlxuICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gcmVxdWVzdFBvcnRUaWNrO1xuICAgICAgICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmbHVzaDtcbiAgICAgICAgICAgIGZsdXNoKCk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciByZXF1ZXN0UG9ydFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBPcGVyYSByZXF1aXJlcyB1cyB0byBwcm92aWRlIGEgbWVzc2FnZSBwYXlsb2FkLCByZWdhcmRsZXNzIG9mXG4gICAgICAgICAgICAvLyB3aGV0aGVyIHdlIHVzZSBpdC5cbiAgICAgICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgICAgICByZXF1ZXN0UG9ydFRpY2soKTtcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG9sZCBicm93c2Vyc1xuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvLyBydW5zIGEgdGFzayBhZnRlciBhbGwgb3RoZXIgdGFza3MgaGF2ZSBiZWVuIHJ1blxuICAgIC8vIHRoaXMgaXMgdXNlZnVsIGZvciB1bmhhbmRsZWQgcmVqZWN0aW9uIHRyYWNraW5nIHRoYXQgbmVlZHMgdG8gaGFwcGVuXG4gICAgLy8gYWZ0ZXIgYWxsIGB0aGVuYGQgdGFza3MgaGF2ZSBiZWVuIHJ1bi5cbiAgICBuZXh0VGljay5ydW5BZnRlciA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIGxhdGVyUXVldWUucHVzaCh0YXNrKTtcbiAgICAgICAgaWYgKCFmbHVzaGluZykge1xuICAgICAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgICAgICAgICAgcmVxdWVzdFRpY2soKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIG5leHRUaWNrO1xufSkoKTtcblxuLy8gQXR0ZW1wdCB0byBtYWtlIGdlbmVyaWNzIHNhZmUgaW4gdGhlIGZhY2Ugb2YgZG93bnN0cmVhbVxuLy8gbW9kaWZpY2F0aW9ucy5cbi8vIFRoZXJlIGlzIG5vIHNpdHVhdGlvbiB3aGVyZSB0aGlzIGlzIG5lY2Vzc2FyeS5cbi8vIElmIHlvdSBuZWVkIGEgc2VjdXJpdHkgZ3VhcmFudGVlLCB0aGVzZSBwcmltb3JkaWFscyBuZWVkIHRvIGJlXG4vLyBkZWVwbHkgZnJvemVuIGFueXdheSwgYW5kIGlmIHlvdSBkb27igJl0IG5lZWQgYSBzZWN1cml0eSBndWFyYW50ZWUsXG4vLyB0aGlzIGlzIGp1c3QgcGxhaW4gcGFyYW5vaWQuXG4vLyBIb3dldmVyLCB0aGlzICoqbWlnaHQqKiBoYXZlIHRoZSBuaWNlIHNpZGUtZWZmZWN0IG9mIHJlZHVjaW5nIHRoZSBzaXplIG9mXG4vLyB0aGUgbWluaWZpZWQgY29kZSBieSByZWR1Y2luZyB4LmNhbGwoKSB0byBtZXJlbHkgeCgpXG4vLyBTZWUgTWFyayBNaWxsZXLigJlzIGV4cGxhbmF0aW9uIG9mIHdoYXQgdGhpcyBkb2VzLlxuLy8gaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9Y29udmVudGlvbnM6c2FmZV9tZXRhX3Byb2dyYW1taW5nXG52YXIgY2FsbCA9IEZ1bmN0aW9uLmNhbGw7XG5mdW5jdGlvbiB1bmN1cnJ5VGhpcyhmKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNhbGwuYXBwbHkoZiwgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuLy8gVGhpcyBpcyBlcXVpdmFsZW50LCBidXQgc2xvd2VyOlxuLy8gdW5jdXJyeVRoaXMgPSBGdW5jdGlvbl9iaW5kLmJpbmQoRnVuY3Rpb25fYmluZC5jYWxsKTtcbi8vIGh0dHA6Ly9qc3BlcmYuY29tL3VuY3Vycnl0aGlzXG5cbnZhciBhcnJheV9zbGljZSA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5zbGljZSk7XG5cbnZhciBhcnJheV9yZWR1Y2UgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUucmVkdWNlIHx8IGZ1bmN0aW9uIChjYWxsYmFjaywgYmFzaXMpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gMCxcbiAgICAgICAgICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAvLyBjb25jZXJuaW5nIHRoZSBpbml0aWFsIHZhbHVlLCBpZiBvbmUgaXMgbm90IHByb3ZpZGVkXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAvLyBzZWVrIHRvIHRoZSBmaXJzdCB2YWx1ZSBpbiB0aGUgYXJyYXksIGFjY291bnRpbmdcbiAgICAgICAgICAgIC8vIGZvciB0aGUgcG9zc2liaWxpdHkgdGhhdCBpcyBpcyBhIHNwYXJzZSBhcnJheVxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCBpbiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgICAgIGJhc2lzID0gdGhpc1tpbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICgrK2luZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB3aGlsZSAoMSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVkdWNlXG4gICAgICAgIGZvciAoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgLy8gYWNjb3VudCBmb3IgdGhlIHBvc3NpYmlsaXR5IHRoYXQgdGhlIGFycmF5IGlzIHNwYXJzZVxuICAgICAgICAgICAgaWYgKGluZGV4IGluIHRoaXMpIHtcbiAgICAgICAgICAgICAgICBiYXNpcyA9IGNhbGxiYWNrKGJhc2lzLCB0aGlzW2luZGV4XSwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYXNpcztcbiAgICB9XG4pO1xuXG52YXIgYXJyYXlfaW5kZXhPZiA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mIHx8IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBub3QgYSB2ZXJ5IGdvb2Qgc2hpbSwgYnV0IGdvb2QgZW5vdWdoIGZvciBvdXIgb25lIHVzZSBvZiBpdFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzW2ldID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4pO1xuXG52YXIgYXJyYXlfbWFwID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLm1hcCB8fCBmdW5jdGlvbiAoY2FsbGJhY2ssIHRoaXNwKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGNvbGxlY3QgPSBbXTtcbiAgICAgICAgYXJyYXlfcmVkdWNlKHNlbGYsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgY29sbGVjdC5wdXNoKGNhbGxiYWNrLmNhbGwodGhpc3AsIHZhbHVlLCBpbmRleCwgc2VsZikpO1xuICAgICAgICB9LCB2b2lkIDApO1xuICAgICAgICByZXR1cm4gY29sbGVjdDtcbiAgICB9XG4pO1xuXG52YXIgb2JqZWN0X2NyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24gKHByb3RvdHlwZSkge1xuICAgIGZ1bmN0aW9uIFR5cGUoKSB7IH1cbiAgICBUeXBlLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICByZXR1cm4gbmV3IFR5cGUoKTtcbn07XG5cbnZhciBvYmplY3RfaGFzT3duUHJvcGVydHkgPSB1bmN1cnJ5VGhpcyhPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KTtcblxudmFyIG9iamVjdF9rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0X2hhc093blByb3BlcnR5KG9iamVjdCwga2V5KSkge1xuICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG59O1xuXG52YXIgb2JqZWN0X3RvU3RyaW5nID0gdW5jdXJyeVRoaXMoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyk7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSBPYmplY3QodmFsdWUpO1xufVxuXG4vLyBnZW5lcmF0b3IgcmVsYXRlZCBzaGltc1xuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgZnVuY3Rpb24gb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW4gU3BpZGVyTW9ua2V5LlxuZnVuY3Rpb24gaXNTdG9wSXRlcmF0aW9uKGV4Y2VwdGlvbikge1xuICAgIHJldHVybiAoXG4gICAgICAgIG9iamVjdF90b1N0cmluZyhleGNlcHRpb24pID09PSBcIltvYmplY3QgU3RvcEl0ZXJhdGlvbl1cIiB8fFxuICAgICAgICBleGNlcHRpb24gaW5zdGFuY2VvZiBRUmV0dXJuVmFsdWVcbiAgICApO1xufVxuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgaGVscGVyIGFuZCBRLnJldHVybiBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpblxuLy8gU3BpZGVyTW9ua2V5LlxudmFyIFFSZXR1cm5WYWx1ZTtcbmlmICh0eXBlb2YgUmV0dXJuVmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBRUmV0dXJuVmFsdWUgPSBSZXR1cm5WYWx1ZTtcbn0gZWxzZSB7XG4gICAgUVJldHVyblZhbHVlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB9O1xufVxuXG4vLyBsb25nIHN0YWNrIHRyYWNlc1xuXG52YXIgU1RBQ0tfSlVNUF9TRVBBUkFUT1IgPSBcIkZyb20gcHJldmlvdXMgZXZlbnQ6XCI7XG5cbmZ1bmN0aW9uIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSkge1xuICAgIC8vIElmIHBvc3NpYmxlLCB0cmFuc2Zvcm0gdGhlIGVycm9yIHN0YWNrIHRyYWNlIGJ5IHJlbW92aW5nIE5vZGUgYW5kIFFcbiAgICAvLyBjcnVmdCwgdGhlbiBjb25jYXRlbmF0aW5nIHdpdGggdGhlIHN0YWNrIHRyYWNlIG9mIGBwcm9taXNlYC4gU2VlICM1Ny5cbiAgICBpZiAoaGFzU3RhY2tzICYmXG4gICAgICAgIHByb21pc2Uuc3RhY2sgJiZcbiAgICAgICAgdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIGVycm9yICE9PSBudWxsICYmXG4gICAgICAgIGVycm9yLnN0YWNrICYmXG4gICAgICAgIGVycm9yLnN0YWNrLmluZGV4T2YoU1RBQ0tfSlVNUF9TRVBBUkFUT1IpID09PSAtMVxuICAgICkge1xuICAgICAgICB2YXIgc3RhY2tzID0gW107XG4gICAgICAgIGZvciAodmFyIHAgPSBwcm9taXNlOyAhIXA7IHAgPSBwLnNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHAuc3RhY2spIHtcbiAgICAgICAgICAgICAgICBzdGFja3MudW5zaGlmdChwLnN0YWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdGFja3MudW5zaGlmdChlcnJvci5zdGFjayk7XG5cbiAgICAgICAgdmFyIGNvbmNhdGVkU3RhY2tzID0gc3RhY2tzLmpvaW4oXCJcXG5cIiArIFNUQUNLX0pVTVBfU0VQQVJBVE9SICsgXCJcXG5cIik7XG4gICAgICAgIGVycm9yLnN0YWNrID0gZmlsdGVyU3RhY2tTdHJpbmcoY29uY2F0ZWRTdGFja3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZmlsdGVyU3RhY2tTdHJpbmcoc3RhY2tTdHJpbmcpIHtcbiAgICB2YXIgbGluZXMgPSBzdGFja1N0cmluZy5zcGxpdChcIlxcblwiKTtcbiAgICB2YXIgZGVzaXJlZExpbmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2ldO1xuXG4gICAgICAgIGlmICghaXNJbnRlcm5hbEZyYW1lKGxpbmUpICYmICFpc05vZGVGcmFtZShsaW5lKSAmJiBsaW5lKSB7XG4gICAgICAgICAgICBkZXNpcmVkTGluZXMucHVzaChsaW5lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGVzaXJlZExpbmVzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGlzTm9kZUZyYW1lKHN0YWNrTGluZSkge1xuICAgIHJldHVybiBzdGFja0xpbmUuaW5kZXhPZihcIihtb2R1bGUuanM6XCIpICE9PSAtMSB8fFxuICAgICAgICAgICBzdGFja0xpbmUuaW5kZXhPZihcIihub2RlLmpzOlwiKSAhPT0gLTE7XG59XG5cbmZ1bmN0aW9uIGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihzdGFja0xpbmUpIHtcbiAgICAvLyBOYW1lZCBmdW5jdGlvbnM6IFwiYXQgZnVuY3Rpb25OYW1lIChmaWxlbmFtZTpsaW5lTnVtYmVyOmNvbHVtbk51bWJlcilcIlxuICAgIC8vIEluIElFMTAgZnVuY3Rpb24gbmFtZSBjYW4gaGF2ZSBzcGFjZXMgKFwiQW5vbnltb3VzIGZ1bmN0aW9uXCIpIE9fb1xuICAgIHZhciBhdHRlbXB0MSA9IC9hdCAuKyBcXCgoLispOihcXGQrKTooPzpcXGQrKVxcKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDEpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0MVsxXSwgTnVtYmVyKGF0dGVtcHQxWzJdKV07XG4gICAgfVxuXG4gICAgLy8gQW5vbnltb3VzIGZ1bmN0aW9uczogXCJhdCBmaWxlbmFtZTpsaW5lTnVtYmVyOmNvbHVtbk51bWJlclwiXG4gICAgdmFyIGF0dGVtcHQyID0gL2F0IChbXiBdKyk6KFxcZCspOig/OlxcZCspJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0Mikge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQyWzFdLCBOdW1iZXIoYXR0ZW1wdDJbMl0pXTtcbiAgICB9XG5cbiAgICAvLyBGaXJlZm94IHN0eWxlOiBcImZ1bmN0aW9uQGZpbGVuYW1lOmxpbmVOdW1iZXIgb3IgQGZpbGVuYW1lOmxpbmVOdW1iZXJcIlxuICAgIHZhciBhdHRlbXB0MyA9IC8uKkAoLispOihcXGQrKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDMpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0M1sxXSwgTnVtYmVyKGF0dGVtcHQzWzJdKV07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0ludGVybmFsRnJhbWUoc3RhY2tMaW5lKSB7XG4gICAgdmFyIGZpbGVOYW1lQW5kTGluZU51bWJlciA9IGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihzdGFja0xpbmUpO1xuXG4gICAgaWYgKCFmaWxlTmFtZUFuZExpbmVOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBmaWxlTmFtZSA9IGZpbGVOYW1lQW5kTGluZU51bWJlclswXTtcbiAgICB2YXIgbGluZU51bWJlciA9IGZpbGVOYW1lQW5kTGluZU51bWJlclsxXTtcblxuICAgIHJldHVybiBmaWxlTmFtZSA9PT0gcUZpbGVOYW1lICYmXG4gICAgICAgIGxpbmVOdW1iZXIgPj0gcVN0YXJ0aW5nTGluZSAmJlxuICAgICAgICBsaW5lTnVtYmVyIDw9IHFFbmRpbmdMaW5lO1xufVxuXG4vLyBkaXNjb3ZlciBvd24gZmlsZSBuYW1lIGFuZCBsaW5lIG51bWJlciByYW5nZSBmb3IgZmlsdGVyaW5nIHN0YWNrXG4vLyB0cmFjZXNcbmZ1bmN0aW9uIGNhcHR1cmVMaW5lKCkge1xuICAgIGlmICghaGFzU3RhY2tzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHZhciBsaW5lcyA9IGUuc3RhY2suc3BsaXQoXCJcXG5cIik7XG4gICAgICAgIHZhciBmaXJzdExpbmUgPSBsaW5lc1swXS5pbmRleE9mKFwiQFwiKSA+IDAgPyBsaW5lc1sxXSA6IGxpbmVzWzJdO1xuICAgICAgICB2YXIgZmlsZU5hbWVBbmRMaW5lTnVtYmVyID0gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKGZpcnN0TGluZSk7XG4gICAgICAgIGlmICghZmlsZU5hbWVBbmRMaW5lTnVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBxRmlsZU5hbWUgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMF07XG4gICAgICAgIHJldHVybiBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMV07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkZXByZWNhdGUoY2FsbGJhY2ssIG5hbWUsIGFsdGVybmF0aXZlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgICAgICB0eXBlb2YgY29uc29sZS53YXJuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihuYW1lICsgXCIgaXMgZGVwcmVjYXRlZCwgdXNlIFwiICsgYWx0ZXJuYXRpdmUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGluc3RlYWQuXCIsIG5ldyBFcnJvcihcIlwiKS5zdGFjayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KGNhbGxiYWNrLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8vIGVuZCBvZiBzaGltc1xuLy8gYmVnaW5uaW5nIG9mIHJlYWwgd29ya1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBwcm9taXNlIGZvciBhbiBpbW1lZGlhdGUgcmVmZXJlbmNlLCBwYXNzZXMgcHJvbWlzZXMgdGhyb3VnaCwgb3JcbiAqIGNvZXJjZXMgcHJvbWlzZXMgZnJvbSBkaWZmZXJlbnQgc3lzdGVtcy5cbiAqIEBwYXJhbSB2YWx1ZSBpbW1lZGlhdGUgcmVmZXJlbmNlIG9yIHByb21pc2VcbiAqL1xuZnVuY3Rpb24gUSh2YWx1ZSkge1xuICAgIC8vIElmIHRoZSBvYmplY3QgaXMgYWxyZWFkeSBhIFByb21pc2UsIHJldHVybiBpdCBkaXJlY3RseS4gIFRoaXMgZW5hYmxlc1xuICAgIC8vIHRoZSByZXNvbHZlIGZ1bmN0aW9uIHRvIGJvdGggYmUgdXNlZCB0byBjcmVhdGVkIHJlZmVyZW5jZXMgZnJvbSBvYmplY3RzLFxuICAgIC8vIGJ1dCB0byB0b2xlcmFibHkgY29lcmNlIG5vbi1wcm9taXNlcyB0byBwcm9taXNlcy5cbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICAvLyBhc3NpbWlsYXRlIHRoZW5hYmxlc1xuICAgIGlmIChpc1Byb21pc2VBbGlrZSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIGNvZXJjZSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZ1bGZpbGwodmFsdWUpO1xuICAgIH1cbn1cblEucmVzb2x2ZSA9IFE7XG5cbi8qKlxuICogUGVyZm9ybXMgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm4gb2YgdGhlIGV2ZW50IGxvb3AuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSB0YXNrXG4gKi9cblEubmV4dFRpY2sgPSBuZXh0VGljaztcblxuLyoqXG4gKiBDb250cm9scyB3aGV0aGVyIG9yIG5vdCBsb25nIHN0YWNrIHRyYWNlcyB3aWxsIGJlIG9uXG4gKi9cblEubG9uZ1N0YWNrU3VwcG9ydCA9IGZhbHNlO1xuXG4vLyBlbmFibGUgbG9uZyBzdGFja3MgaWYgUV9ERUJVRyBpcyBzZXRcbmlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzICYmIHByb2Nlc3MuZW52ICYmIHByb2Nlc3MuZW52LlFfREVCVUcpIHtcbiAgICBRLmxvbmdTdGFja1N1cHBvcnQgPSB0cnVlO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSB7cHJvbWlzZSwgcmVzb2x2ZSwgcmVqZWN0fSBvYmplY3QuXG4gKlxuICogYHJlc29sdmVgIGlzIGEgY2FsbGJhY2sgdG8gaW52b2tlIHdpdGggYSBtb3JlIHJlc29sdmVkIHZhbHVlIGZvciB0aGVcbiAqIHByb21pc2UuIFRvIGZ1bGZpbGwgdGhlIHByb21pc2UsIGludm9rZSBgcmVzb2x2ZWAgd2l0aCBhbnkgdmFsdWUgdGhhdCBpc1xuICogbm90IGEgdGhlbmFibGUuIFRvIHJlamVjdCB0aGUgcHJvbWlzZSwgaW52b2tlIGByZXNvbHZlYCB3aXRoIGEgcmVqZWN0ZWRcbiAqIHRoZW5hYmxlLCBvciBpbnZva2UgYHJlamVjdGAgd2l0aCB0aGUgcmVhc29uIGRpcmVjdGx5LiBUbyByZXNvbHZlIHRoZVxuICogcHJvbWlzZSB0byBhbm90aGVyIHRoZW5hYmxlLCB0aHVzIHB1dHRpbmcgaXQgaW4gdGhlIHNhbWUgc3RhdGUsIGludm9rZVxuICogYHJlc29sdmVgIHdpdGggdGhhdCBvdGhlciB0aGVuYWJsZS5cbiAqL1xuUS5kZWZlciA9IGRlZmVyO1xuZnVuY3Rpb24gZGVmZXIoKSB7XG4gICAgLy8gaWYgXCJtZXNzYWdlc1wiIGlzIGFuIFwiQXJyYXlcIiwgdGhhdCBpbmRpY2F0ZXMgdGhhdCB0aGUgcHJvbWlzZSBoYXMgbm90IHlldFxuICAgIC8vIGJlZW4gcmVzb2x2ZWQuICBJZiBpdCBpcyBcInVuZGVmaW5lZFwiLCBpdCBoYXMgYmVlbiByZXNvbHZlZC4gIEVhY2hcbiAgICAvLyBlbGVtZW50IG9mIHRoZSBtZXNzYWdlcyBhcnJheSBpcyBpdHNlbGYgYW4gYXJyYXkgb2YgY29tcGxldGUgYXJndW1lbnRzIHRvXG4gICAgLy8gZm9yd2FyZCB0byB0aGUgcmVzb2x2ZWQgcHJvbWlzZS4gIFdlIGNvZXJjZSB0aGUgcmVzb2x1dGlvbiB2YWx1ZSB0byBhXG4gICAgLy8gcHJvbWlzZSB1c2luZyB0aGUgYHJlc29sdmVgIGZ1bmN0aW9uIGJlY2F1c2UgaXQgaGFuZGxlcyBib3RoIGZ1bGx5XG4gICAgLy8gbm9uLXRoZW5hYmxlIHZhbHVlcyBhbmQgb3RoZXIgdGhlbmFibGVzIGdyYWNlZnVsbHkuXG4gICAgdmFyIG1lc3NhZ2VzID0gW10sIHByb2dyZXNzTGlzdGVuZXJzID0gW10sIHJlc29sdmVkUHJvbWlzZTtcblxuICAgIHZhciBkZWZlcnJlZCA9IG9iamVjdF9jcmVhdGUoZGVmZXIucHJvdG90eXBlKTtcbiAgICB2YXIgcHJvbWlzZSA9IG9iamVjdF9jcmVhdGUoUHJvbWlzZS5wcm90b3R5cGUpO1xuXG4gICAgcHJvbWlzZS5wcm9taXNlRGlzcGF0Y2ggPSBmdW5jdGlvbiAocmVzb2x2ZSwgb3AsIG9wZXJhbmRzKSB7XG4gICAgICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICBtZXNzYWdlcy5wdXNoKGFyZ3MpO1xuICAgICAgICAgICAgaWYgKG9wID09PSBcIndoZW5cIiAmJiBvcGVyYW5kc1sxXSkgeyAvLyBwcm9ncmVzcyBvcGVyYW5kXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcnMucHVzaChvcGVyYW5kc1sxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlZFByb21pc2UucHJvbWlzZURpc3BhdGNoLmFwcGx5KHJlc29sdmVkUHJvbWlzZSwgYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBYWFggZGVwcmVjYXRlZFxuICAgIHByb21pc2UudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmVhcmVyVmFsdWUgPSBuZWFyZXIocmVzb2x2ZWRQcm9taXNlKTtcbiAgICAgICAgaWYgKGlzUHJvbWlzZShuZWFyZXJWYWx1ZSkpIHtcbiAgICAgICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5lYXJlclZhbHVlOyAvLyBzaG9ydGVuIGNoYWluXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5lYXJlclZhbHVlO1xuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghcmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJwZW5kaW5nXCIgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzb2x2ZWRQcm9taXNlLmluc3BlY3QoKTtcbiAgICB9O1xuXG4gICAgaWYgKFEubG9uZ1N0YWNrU3VwcG9ydCAmJiBoYXNTdGFja3MpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBOT1RFOiBkb24ndCB0cnkgdG8gdXNlIGBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZWAgb3IgdHJhbnNmZXIgdGhlXG4gICAgICAgICAgICAvLyBhY2Nlc3NvciBhcm91bmQ7IHRoYXQgY2F1c2VzIG1lbW9yeSBsZWFrcyBhcyBwZXIgR0gtMTExLiBKdXN0XG4gICAgICAgICAgICAvLyByZWlmeSB0aGUgc3RhY2sgdHJhY2UgYXMgYSBzdHJpbmcgQVNBUC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBdCB0aGUgc2FtZSB0aW1lLCBjdXQgb2ZmIHRoZSBmaXJzdCBsaW5lOyBpdCdzIGFsd2F5cyBqdXN0XG4gICAgICAgICAgICAvLyBcIltvYmplY3QgUHJvbWlzZV1cXG5cIiwgYXMgcGVyIHRoZSBgdG9TdHJpbmdgLlxuICAgICAgICAgICAgcHJvbWlzZS5zdGFjayA9IGUuc3RhY2suc3Vic3RyaW5nKGUuc3RhY2suaW5kZXhPZihcIlxcblwiKSArIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTk9URTogd2UgZG8gdGhlIGNoZWNrcyBmb3IgYHJlc29sdmVkUHJvbWlzZWAgaW4gZWFjaCBtZXRob2QsIGluc3RlYWQgb2ZcbiAgICAvLyBjb25zb2xpZGF0aW5nIHRoZW0gaW50byBgYmVjb21lYCwgc2luY2Ugb3RoZXJ3aXNlIHdlJ2QgY3JlYXRlIG5ld1xuICAgIC8vIHByb21pc2VzIHdpdGggdGhlIGxpbmVzIGBiZWNvbWUod2hhdGV2ZXIodmFsdWUpKWAuIFNlZSBlLmcuIEdILTI1Mi5cblxuICAgIGZ1bmN0aW9uIGJlY29tZShuZXdQcm9taXNlKSB7XG4gICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5ld1Byb21pc2U7XG4gICAgICAgIHByb21pc2Uuc291cmNlID0gbmV3UHJvbWlzZTtcblxuICAgICAgICBhcnJheV9yZWR1Y2UobWVzc2FnZXMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5ld1Byb21pc2UucHJvbWlzZURpc3BhdGNoLmFwcGx5KG5ld1Byb21pc2UsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG5cbiAgICAgICAgbWVzc2FnZXMgPSB2b2lkIDA7XG4gICAgICAgIHByb2dyZXNzTGlzdGVuZXJzID0gdm9pZCAwO1xuICAgIH1cblxuICAgIGRlZmVycmVkLnByb21pc2UgPSBwcm9taXNlO1xuICAgIGRlZmVycmVkLnJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKFEodmFsdWUpKTtcbiAgICB9O1xuXG4gICAgZGVmZXJyZWQuZnVsZmlsbCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUoZnVsZmlsbCh2YWx1ZSkpO1xuICAgIH07XG4gICAgZGVmZXJyZWQucmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUocmVqZWN0KHJlYXNvbikpO1xuICAgIH07XG4gICAgZGVmZXJyZWQubm90aWZ5ID0gZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFycmF5X3JlZHVjZShwcm9ncmVzc0xpc3RlbmVycywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgcHJvZ3Jlc3NMaXN0ZW5lcikge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcihwcm9ncmVzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlZmVycmVkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBOb2RlLXN0eWxlIGNhbGxiYWNrIHRoYXQgd2lsbCByZXNvbHZlIG9yIHJlamVjdCB0aGUgZGVmZXJyZWRcbiAqIHByb21pc2UuXG4gKiBAcmV0dXJucyBhIG5vZGViYWNrXG4gKi9cbmRlZmVyLnByb3RvdHlwZS5tYWtlTm9kZVJlc29sdmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gZnVuY3Rpb24gKGVycm9yLCB2YWx1ZSkge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNlbGYucmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgc2VsZi5yZXNvbHZlKGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4vKipcbiAqIEBwYXJhbSByZXNvbHZlciB7RnVuY3Rpb259IGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIG5vdGhpbmcgYW5kIGFjY2VwdHNcbiAqIHRoZSByZXNvbHZlLCByZWplY3QsIGFuZCBub3RpZnkgZnVuY3Rpb25zIGZvciBhIGRlZmVycmVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgbWF5IGJlIHJlc29sdmVkIHdpdGggdGhlIGdpdmVuIHJlc29sdmUgYW5kIHJlamVjdFxuICogZnVuY3Rpb25zLCBvciByZWplY3RlZCBieSBhIHRocm93biBleGNlcHRpb24gaW4gcmVzb2x2ZXJcbiAqL1xuUS5Qcm9taXNlID0gcHJvbWlzZTsgLy8gRVM2XG5RLnByb21pc2UgPSBwcm9taXNlO1xuZnVuY3Rpb24gcHJvbWlzZShyZXNvbHZlcikge1xuICAgIGlmICh0eXBlb2YgcmVzb2x2ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwicmVzb2x2ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLlwiKTtcbiAgICB9XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB0cnkge1xuICAgICAgICByZXNvbHZlcihkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QsIGRlZmVycmVkLm5vdGlmeSk7XG4gICAgfSBjYXRjaCAocmVhc29uKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChyZWFzb24pO1xuICAgIH1cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxucHJvbWlzZS5yYWNlID0gcmFjZTsgLy8gRVM2XG5wcm9taXNlLmFsbCA9IGFsbDsgLy8gRVM2XG5wcm9taXNlLnJlamVjdCA9IHJlamVjdDsgLy8gRVM2XG5wcm9taXNlLnJlc29sdmUgPSBROyAvLyBFUzZcblxuLy8gWFhYIGV4cGVyaW1lbnRhbC4gIFRoaXMgbWV0aG9kIGlzIGEgd2F5IHRvIGRlbm90ZSB0aGF0IGEgbG9jYWwgdmFsdWUgaXNcbi8vIHNlcmlhbGl6YWJsZSBhbmQgc2hvdWxkIGJlIGltbWVkaWF0ZWx5IGRpc3BhdGNoZWQgdG8gYSByZW1vdGUgdXBvbiByZXF1ZXN0LFxuLy8gaW5zdGVhZCBvZiBwYXNzaW5nIGEgcmVmZXJlbmNlLlxuUS5wYXNzQnlDb3B5ID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIC8vZnJlZXplKG9iamVjdCk7XG4gICAgLy9wYXNzQnlDb3BpZXMuc2V0KG9iamVjdCwgdHJ1ZSk7XG4gICAgcmV0dXJuIG9iamVjdDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnBhc3NCeUNvcHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy9mcmVlemUob2JqZWN0KTtcbiAgICAvL3Bhc3NCeUNvcGllcy5zZXQob2JqZWN0LCB0cnVlKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSWYgdHdvIHByb21pc2VzIGV2ZW50dWFsbHkgZnVsZmlsbCB0byB0aGUgc2FtZSB2YWx1ZSwgcHJvbWlzZXMgdGhhdCB2YWx1ZSxcbiAqIGJ1dCBvdGhlcndpc2UgcmVqZWN0cy5cbiAqIEBwYXJhbSB4IHtBbnkqfVxuICogQHBhcmFtIHkge0FueSp9XG4gKiBAcmV0dXJucyB7QW55Kn0gYSBwcm9taXNlIGZvciB4IGFuZCB5IGlmIHRoZXkgYXJlIHRoZSBzYW1lLCBidXQgYSByZWplY3Rpb25cbiAqIG90aGVyd2lzZS5cbiAqXG4gKi9cblEuam9pbiA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgcmV0dXJuIFEoeCkuam9pbih5KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbiAodGhhdCkge1xuICAgIHJldHVybiBRKFt0aGlzLCB0aGF0XSkuc3ByZWFkKGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIGlmICh4ID09PSB5KSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBcIj09PVwiIHNob3VsZCBiZSBPYmplY3QuaXMgb3IgZXF1aXZcbiAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3Qgam9pbjogbm90IHRoZSBzYW1lOiBcIiArIHggKyBcIiBcIiArIHkpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgZmlyc3Qgb2YgYW4gYXJyYXkgb2YgcHJvbWlzZXMgdG8gYmVjb21lIHNldHRsZWQuXG4gKiBAcGFyYW0gYW5zd2VycyB7QXJyYXlbQW55Kl19IHByb21pc2VzIHRvIHJhY2VcbiAqIEByZXR1cm5zIHtBbnkqfSB0aGUgZmlyc3QgcHJvbWlzZSB0byBiZSBzZXR0bGVkXG4gKi9cblEucmFjZSA9IHJhY2U7XG5mdW5jdGlvbiByYWNlKGFuc3dlclBzKSB7XG4gICAgcmV0dXJuIHByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAvLyBTd2l0Y2ggdG8gdGhpcyBvbmNlIHdlIGNhbiBhc3N1bWUgYXQgbGVhc3QgRVM1XG4gICAgICAgIC8vIGFuc3dlclBzLmZvckVhY2goZnVuY3Rpb24gKGFuc3dlclApIHtcbiAgICAgICAgLy8gICAgIFEoYW5zd2VyUCkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy8gVXNlIHRoaXMgaW4gdGhlIG1lYW50aW1lXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhbnN3ZXJQcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgUShhbnN3ZXJQc1tpXSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnJhY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihRLnJhY2UpO1xufTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgUHJvbWlzZSB3aXRoIGEgcHJvbWlzZSBkZXNjcmlwdG9yIG9iamVjdCBhbmQgb3B0aW9uYWwgZmFsbGJhY2tcbiAqIGZ1bmN0aW9uLiAgVGhlIGRlc2NyaXB0b3IgY29udGFpbnMgbWV0aG9kcyBsaWtlIHdoZW4ocmVqZWN0ZWQpLCBnZXQobmFtZSksXG4gKiBzZXQobmFtZSwgdmFsdWUpLCBwb3N0KG5hbWUsIGFyZ3MpLCBhbmQgZGVsZXRlKG5hbWUpLCB3aGljaCBhbGxcbiAqIHJldHVybiBlaXRoZXIgYSB2YWx1ZSwgYSBwcm9taXNlIGZvciBhIHZhbHVlLCBvciBhIHJlamVjdGlvbi4gIFRoZSBmYWxsYmFja1xuICogYWNjZXB0cyB0aGUgb3BlcmF0aW9uIG5hbWUsIGEgcmVzb2x2ZXIsIGFuZCBhbnkgZnVydGhlciBhcmd1bWVudHMgdGhhdCB3b3VsZFxuICogaGF2ZSBiZWVuIGZvcndhcmRlZCB0byB0aGUgYXBwcm9wcmlhdGUgbWV0aG9kIGFib3ZlIGhhZCBhIG1ldGhvZCBiZWVuXG4gKiBwcm92aWRlZCB3aXRoIHRoZSBwcm9wZXIgbmFtZS4gIFRoZSBBUEkgbWFrZXMgbm8gZ3VhcmFudGVlcyBhYm91dCB0aGUgbmF0dXJlXG4gKiBvZiB0aGUgcmV0dXJuZWQgb2JqZWN0LCBhcGFydCBmcm9tIHRoYXQgaXQgaXMgdXNhYmxlIHdoZXJlZXZlciBwcm9taXNlcyBhcmVcbiAqIGJvdWdodCBhbmQgc29sZC5cbiAqL1xuUS5tYWtlUHJvbWlzZSA9IFByb21pc2U7XG5mdW5jdGlvbiBQcm9taXNlKGRlc2NyaXB0b3IsIGZhbGxiYWNrLCBpbnNwZWN0KSB7XG4gICAgaWYgKGZhbGxiYWNrID09PSB2b2lkIDApIHtcbiAgICAgICAgZmFsbGJhY2sgPSBmdW5jdGlvbiAob3ApIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIFwiUHJvbWlzZSBkb2VzIG5vdCBzdXBwb3J0IG9wZXJhdGlvbjogXCIgKyBvcFxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChpbnNwZWN0ID09PSB2b2lkIDApIHtcbiAgICAgICAgaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7c3RhdGU6IFwidW5rbm93blwifTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgcHJvbWlzZSA9IG9iamVjdF9jcmVhdGUoUHJvbWlzZS5wcm90b3R5cGUpO1xuXG4gICAgcHJvbWlzZS5wcm9taXNlRGlzcGF0Y2ggPSBmdW5jdGlvbiAocmVzb2x2ZSwgb3AsIGFyZ3MpIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChkZXNjcmlwdG9yW29wXSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGRlc2NyaXB0b3Jbb3BdLmFwcGx5KHByb21pc2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmYWxsYmFjay5jYWxsKHByb21pc2UsIG9wLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb21pc2UuaW5zcGVjdCA9IGluc3BlY3Q7XG5cbiAgICAvLyBYWFggZGVwcmVjYXRlZCBgdmFsdWVPZmAgYW5kIGBleGNlcHRpb25gIHN1cHBvcnRcbiAgICBpZiAoaW5zcGVjdCkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcInJlamVjdGVkXCIpIHtcbiAgICAgICAgICAgIHByb21pc2UuZXhjZXB0aW9uID0gaW5zcGVjdGVkLnJlYXNvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb21pc2UudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpbnNwZWN0ZWQgPSBpbnNwZWN0KCk7XG4gICAgICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcInBlbmRpbmdcIiB8fFxuICAgICAgICAgICAgICAgIGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdGVkLnZhbHVlO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNlO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gXCJbb2JqZWN0IFByb21pc2VdXCI7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24gKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgZG9uZSA9IGZhbHNlOyAgIC8vIGVuc3VyZSB0aGUgdW50cnVzdGVkIHByb21pc2UgbWFrZXMgYXQgbW9zdCBhXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzaW5nbGUgY2FsbCB0byBvbmUgb2YgdGhlIGNhbGxiYWNrc1xuXG4gICAgZnVuY3Rpb24gX2Z1bGZpbGxlZCh2YWx1ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBmdWxmaWxsZWQgPT09IFwiZnVuY3Rpb25cIiA/IGZ1bGZpbGxlZCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcmVqZWN0ZWQoZXhjZXB0aW9uKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVqZWN0ZWQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgbWFrZVN0YWNrVHJhY2VMb25nKGV4Y2VwdGlvbiwgc2VsZik7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3RlZChleGNlcHRpb24pO1xuICAgICAgICAgICAgfSBjYXRjaCAobmV3RXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXdFeGNlcHRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcHJvZ3Jlc3NlZCh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHByb2dyZXNzZWQgPT09IFwiZnVuY3Rpb25cIiA/IHByb2dyZXNzZWQodmFsdWUpIDogdmFsdWU7XG4gICAgfVxuXG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShfZnVsZmlsbGVkKHZhbHVlKSk7XG4gICAgICAgIH0sIFwid2hlblwiLCBbZnVuY3Rpb24gKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShfcmVqZWN0ZWQoZXhjZXB0aW9uKSk7XG4gICAgICAgIH1dKTtcbiAgICB9KTtcblxuICAgIC8vIFByb2dyZXNzIHByb3BhZ2F0b3IgbmVlZCB0byBiZSBhdHRhY2hlZCBpbiB0aGUgY3VycmVudCB0aWNrLlxuICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKHZvaWQgMCwgXCJ3aGVuXCIsIFt2b2lkIDAsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgbmV3VmFsdWU7XG4gICAgICAgIHZhciB0aHJldyA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbmV3VmFsdWUgPSBfcHJvZ3Jlc3NlZCh2YWx1ZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocmV3ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChRLm9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBRLm9uZXJyb3IoZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRocmV3KSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkobmV3VmFsdWUpO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5RLnRhcCA9IGZ1bmN0aW9uIChwcm9taXNlLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBRKHByb21pc2UpLnRhcChjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIFdvcmtzIGFsbW9zdCBsaWtlIFwiZmluYWxseVwiLCBidXQgbm90IGNhbGxlZCBmb3IgcmVqZWN0aW9ucy5cbiAqIE9yaWdpbmFsIHJlc29sdXRpb24gdmFsdWUgaXMgcGFzc2VkIHRocm91Z2ggY2FsbGJhY2sgdW5hZmZlY3RlZC5cbiAqIENhbGxiYWNrIG1heSByZXR1cm4gYSBwcm9taXNlIHRoYXQgd2lsbCBiZSBhd2FpdGVkIGZvci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJucyB7US5Qcm9taXNlfVxuICogQGV4YW1wbGVcbiAqIGRvU29tZXRoaW5nKClcbiAqICAgLnRoZW4oLi4uKVxuICogICAudGFwKGNvbnNvbGUubG9nKVxuICogICAudGhlbiguLi4pO1xuICovXG5Qcm9taXNlLnByb3RvdHlwZS50YXAgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IFEoY2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKHZhbHVlKS50aGVuUmVzb2x2ZSh2YWx1ZSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVycyBhbiBvYnNlcnZlciBvbiBhIHByb21pc2UuXG4gKlxuICogR3VhcmFudGVlczpcbiAqXG4gKiAxLiB0aGF0IGZ1bGZpbGxlZCBhbmQgcmVqZWN0ZWQgd2lsbCBiZSBjYWxsZWQgb25seSBvbmNlLlxuICogMi4gdGhhdCBlaXRoZXIgdGhlIGZ1bGZpbGxlZCBjYWxsYmFjayBvciB0aGUgcmVqZWN0ZWQgY2FsbGJhY2sgd2lsbCBiZVxuICogICAgY2FsbGVkLCBidXQgbm90IGJvdGguXG4gKiAzLiB0aGF0IGZ1bGZpbGxlZCBhbmQgcmVqZWN0ZWQgd2lsbCBub3QgYmUgY2FsbGVkIGluIHRoaXMgdHVybi5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgICAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgdG8gb2JzZXJ2ZVxuICogQHBhcmFtIGZ1bGZpbGxlZCAgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdpdGggdGhlIGZ1bGZpbGxlZCB2YWx1ZVxuICogQHBhcmFtIHJlamVjdGVkICAgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdpdGggdGhlIHJlamVjdGlvbiBleGNlcHRpb25cbiAqIEBwYXJhbSBwcm9ncmVzc2VkIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBhbnkgcHJvZ3Jlc3Mgbm90aWZpY2F0aW9uc1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIGZyb20gdGhlIGludm9rZWQgY2FsbGJhY2tcbiAqL1xuUS53aGVuID0gd2hlbjtcbmZ1bmN0aW9uIHdoZW4odmFsdWUsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gUSh2YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZhbHVlOyB9KTtcbn07XG5cblEudGhlblJlc29sdmUgPSBmdW5jdGlvbiAocHJvbWlzZSwgdmFsdWUpIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50aGVuUmVzb2x2ZSh2YWx1ZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuUmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKCkgeyB0aHJvdyByZWFzb247IH0pO1xufTtcblxuUS50aGVuUmVqZWN0ID0gZnVuY3Rpb24gKHByb21pc2UsIHJlYXNvbikge1xuICAgIHJldHVybiBRKHByb21pc2UpLnRoZW5SZWplY3QocmVhc29uKTtcbn07XG5cbi8qKlxuICogSWYgYW4gb2JqZWN0IGlzIG5vdCBhIHByb21pc2UsIGl0IGlzIGFzIFwibmVhclwiIGFzIHBvc3NpYmxlLlxuICogSWYgYSBwcm9taXNlIGlzIHJlamVjdGVkLCBpdCBpcyBhcyBcIm5lYXJcIiBhcyBwb3NzaWJsZSB0b28uXG4gKiBJZiBpdOKAmXMgYSBmdWxmaWxsZWQgcHJvbWlzZSwgdGhlIGZ1bGZpbGxtZW50IHZhbHVlIGlzIG5lYXJlci5cbiAqIElmIGl04oCZcyBhIGRlZmVycmVkIHByb21pc2UgYW5kIHRoZSBkZWZlcnJlZCBoYXMgYmVlbiByZXNvbHZlZCwgdGhlXG4gKiByZXNvbHV0aW9uIGlzIFwibmVhcmVyXCIuXG4gKiBAcGFyYW0gb2JqZWN0XG4gKiBAcmV0dXJucyBtb3N0IHJlc29sdmVkIChuZWFyZXN0KSBmb3JtIG9mIHRoZSBvYmplY3RcbiAqL1xuXG4vLyBYWFggc2hvdWxkIHdlIHJlLWRvIHRoaXM/XG5RLm5lYXJlciA9IG5lYXJlcjtcbmZ1bmN0aW9uIG5lYXJlcih2YWx1ZSkge1xuICAgIGlmIChpc1Byb21pc2UodmFsdWUpKSB7XG4gICAgICAgIHZhciBpbnNwZWN0ZWQgPSB2YWx1ZS5pbnNwZWN0KCk7XG4gICAgICAgIGlmIChpbnNwZWN0ZWQuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnNwZWN0ZWQudmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHByb21pc2UuXG4gKiBPdGhlcndpc2UgaXQgaXMgYSBmdWxmaWxsZWQgdmFsdWUuXG4gKi9cblEuaXNQcm9taXNlID0gaXNQcm9taXNlO1xuZnVuY3Rpb24gaXNQcm9taXNlKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBQcm9taXNlO1xufVxuXG5RLmlzUHJvbWlzZUFsaWtlID0gaXNQcm9taXNlQWxpa2U7XG5mdW5jdGlvbiBpc1Byb21pc2VBbGlrZShvYmplY3QpIHtcbiAgICByZXR1cm4gaXNPYmplY3Qob2JqZWN0KSAmJiB0eXBlb2Ygb2JqZWN0LnRoZW4gPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBwZW5kaW5nIHByb21pc2UsIG1lYW5pbmcgbm90XG4gKiBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuXG4gKi9cblEuaXNQZW5kaW5nID0gaXNQZW5kaW5nO1xuZnVuY3Rpb24gaXNQZW5kaW5nKG9iamVjdCkge1xuICAgIHJldHVybiBpc1Byb21pc2Uob2JqZWN0KSAmJiBvYmplY3QuaW5zcGVjdCgpLnN0YXRlID09PSBcInBlbmRpbmdcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNQZW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59O1xuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHZhbHVlIG9yIGZ1bGZpbGxlZFxuICogcHJvbWlzZS5cbiAqL1xuUS5pc0Z1bGZpbGxlZCA9IGlzRnVsZmlsbGVkO1xuZnVuY3Rpb24gaXNGdWxmaWxsZWQob2JqZWN0KSB7XG4gICAgcmV0dXJuICFpc1Byb21pc2Uob2JqZWN0KSB8fCBvYmplY3QuaW5zcGVjdCgpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc0Z1bGZpbGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCI7XG59O1xuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHJlamVjdGVkIHByb21pc2UuXG4gKi9cblEuaXNSZWplY3RlZCA9IGlzUmVqZWN0ZWQ7XG5mdW5jdGlvbiBpc1JlamVjdGVkKG9iamVjdCkge1xuICAgIHJldHVybiBpc1Byb21pc2Uob2JqZWN0KSAmJiBvYmplY3QuaW5zcGVjdCgpLnN0YXRlID09PSBcInJlamVjdGVkXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzUmVqZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcInJlamVjdGVkXCI7XG59O1xuXG4vLy8vIEJFR0lOIFVOSEFORExFRCBSRUpFQ1RJT04gVFJBQ0tJTkdcblxuLy8gVGhpcyBwcm9taXNlIGxpYnJhcnkgY29uc3VtZXMgZXhjZXB0aW9ucyB0aHJvd24gaW4gaGFuZGxlcnMgc28gdGhleSBjYW4gYmVcbi8vIGhhbmRsZWQgYnkgYSBzdWJzZXF1ZW50IHByb21pc2UuICBUaGUgZXhjZXB0aW9ucyBnZXQgYWRkZWQgdG8gdGhpcyBhcnJheSB3aGVuXG4vLyB0aGV5IGFyZSBjcmVhdGVkLCBhbmQgcmVtb3ZlZCB3aGVuIHRoZXkgYXJlIGhhbmRsZWQuICBOb3RlIHRoYXQgaW4gRVM2IG9yXG4vLyBzaGltbWVkIGVudmlyb25tZW50cywgdGhpcyB3b3VsZCBuYXR1cmFsbHkgYmUgYSBgU2V0YC5cbnZhciB1bmhhbmRsZWRSZWFzb25zID0gW107XG52YXIgdW5oYW5kbGVkUmVqZWN0aW9ucyA9IFtdO1xudmFyIHJlcG9ydGVkVW5oYW5kbGVkUmVqZWN0aW9ucyA9IFtdO1xudmFyIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG5cbmZ1bmN0aW9uIHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpIHtcbiAgICB1bmhhbmRsZWRSZWFzb25zLmxlbmd0aCA9IDA7XG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5sZW5ndGggPSAwO1xuXG4gICAgaWYgKCF0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMpIHtcbiAgICAgICAgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gdHJ1ZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyYWNrUmVqZWN0aW9uKHByb21pc2UsIHJlYXNvbikge1xuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBwcm9jZXNzLmVtaXQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBRLm5leHRUaWNrLnJ1bkFmdGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChhcnJheV9pbmRleE9mKHVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHByb2Nlc3MuZW1pdChcInVuaGFuZGxlZFJlamVjdGlvblwiLCByZWFzb24sIHByb21pc2UpO1xuICAgICAgICAgICAgICAgIHJlcG9ydGVkVW5oYW5kbGVkUmVqZWN0aW9ucy5wdXNoKHByb21pc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB1bmhhbmRsZWRSZWplY3Rpb25zLnB1c2gocHJvbWlzZSk7XG4gICAgaWYgKHJlYXNvbiAmJiB0eXBlb2YgcmVhc29uLnN0YWNrICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMucHVzaChyZWFzb24uc3RhY2spO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMucHVzaChcIihubyBzdGFjaykgXCIgKyByZWFzb24pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdW50cmFja1JlamVjdGlvbihwcm9taXNlKSB7XG4gICAgaWYgKCF0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBhdCA9IGFycmF5X2luZGV4T2YodW5oYW5kbGVkUmVqZWN0aW9ucywgcHJvbWlzZSk7XG4gICAgaWYgKGF0ICE9PSAtMSkge1xuICAgICAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHByb2Nlc3MuZW1pdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrLnJ1bkFmdGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXRSZXBvcnQgPSBhcnJheV9pbmRleE9mKHJlcG9ydGVkVW5oYW5kbGVkUmVqZWN0aW9ucywgcHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgaWYgKGF0UmVwb3J0ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVtaXQoXCJyZWplY3Rpb25IYW5kbGVkXCIsIHVuaGFuZGxlZFJlYXNvbnNbYXRdLCBwcm9taXNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0ZWRVbmhhbmRsZWRSZWplY3Rpb25zLnNwbGljZShhdFJlcG9ydCwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5zcGxpY2UoYXQsIDEpO1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnNwbGljZShhdCwgMSk7XG4gICAgfVxufVxuXG5RLnJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucyA9IHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucztcblxuUS5nZXRVbmhhbmRsZWRSZWFzb25zID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIE1ha2UgYSBjb3B5IHNvIHRoYXQgY29uc3VtZXJzIGNhbid0IGludGVyZmVyZSB3aXRoIG91ciBpbnRlcm5hbCBzdGF0ZS5cbiAgICByZXR1cm4gdW5oYW5kbGVkUmVhc29ucy5zbGljZSgpO1xufTtcblxuUS5zdG9wVW5oYW5kbGVkUmVqZWN0aW9uVHJhY2tpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCk7XG4gICAgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gZmFsc2U7XG59O1xuXG5yZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKTtcblxuLy8vLyBFTkQgVU5IQU5ETEVEIFJFSkVDVElPTiBUUkFDS0lOR1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSByZWplY3RlZCBwcm9taXNlLlxuICogQHBhcmFtIHJlYXNvbiB2YWx1ZSBkZXNjcmliaW5nIHRoZSBmYWlsdXJlXG4gKi9cblEucmVqZWN0ID0gcmVqZWN0O1xuZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICAgIHZhciByZWplY3Rpb24gPSBQcm9taXNlKHtcbiAgICAgICAgXCJ3aGVuXCI6IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgICAgICAgICAgLy8gbm90ZSB0aGF0IHRoZSBlcnJvciBoYXMgYmVlbiBoYW5kbGVkXG4gICAgICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB1bnRyYWNrUmVqZWN0aW9uKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkID8gcmVqZWN0ZWQocmVhc29uKSA6IHRoaXM7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjaygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwicmVqZWN0ZWRcIiwgcmVhc29uOiByZWFzb24gfTtcbiAgICB9KTtcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcmVhc29uIGhhcyBub3QgYmVlbiBoYW5kbGVkLlxuICAgIHRyYWNrUmVqZWN0aW9uKHJlamVjdGlvbiwgcmVhc29uKTtcblxuICAgIHJldHVybiByZWplY3Rpb247XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIGZ1bGZpbGxlZCBwcm9taXNlIGZvciBhbiBpbW1lZGlhdGUgcmVmZXJlbmNlLlxuICogQHBhcmFtIHZhbHVlIGltbWVkaWF0ZSByZWZlcmVuY2VcbiAqL1xuUS5mdWxmaWxsID0gZnVsZmlsbDtcbmZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwid2hlblwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWVbbmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0XCI6IGZ1bmN0aW9uIChuYW1lLCByaHMpIHtcbiAgICAgICAgICAgIHZhbHVlW25hbWVdID0gcmhzO1xuICAgICAgICB9LFxuICAgICAgICBcImRlbGV0ZVwiOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHZhbHVlW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBcInBvc3RcIjogZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICAgICAgICAgIC8vIE1hcmsgTWlsbGVyIHByb3Bvc2VzIHRoYXQgcG9zdCB3aXRoIG5vIG5hbWUgc2hvdWxkIGFwcGx5IGFcbiAgICAgICAgICAgIC8vIHByb21pc2VkIGZ1bmN0aW9uLlxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IG51bGwgfHwgbmFtZSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHZvaWQgMCwgYXJncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVtuYW1lXS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiYXBwbHlcIjogZnVuY3Rpb24gKHRoaXNwLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodGhpc3AsIGFyZ3MpO1xuICAgICAgICB9LFxuICAgICAgICBcImtleXNcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdF9rZXlzKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sIHZvaWQgMCwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwiZnVsZmlsbGVkXCIsIHZhbHVlOiB2YWx1ZSB9O1xuICAgIH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZW5hYmxlcyB0byBRIHByb21pc2VzLlxuICogQHBhcmFtIHByb21pc2UgdGhlbmFibGUgcHJvbWlzZVxuICogQHJldHVybnMgYSBRIHByb21pc2VcbiAqL1xuZnVuY3Rpb24gY29lcmNlKHByb21pc2UpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCwgZGVmZXJyZWQubm90aWZ5KTtcbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG4vKipcbiAqIEFubm90YXRlcyBhbiBvYmplY3Qgc3VjaCB0aGF0IGl0IHdpbGwgbmV2ZXIgYmVcbiAqIHRyYW5zZmVycmVkIGF3YXkgZnJvbSB0aGlzIHByb2Nlc3Mgb3ZlciBhbnkgcHJvbWlzZVxuICogY29tbXVuaWNhdGlvbiBjaGFubmVsLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgcHJvbWlzZSBhIHdyYXBwaW5nIG9mIHRoYXQgb2JqZWN0IHRoYXRcbiAqIGFkZGl0aW9uYWxseSByZXNwb25kcyB0byB0aGUgXCJpc0RlZlwiIG1lc3NhZ2VcbiAqIHdpdGhvdXQgYSByZWplY3Rpb24uXG4gKi9cblEubWFzdGVyID0gbWFzdGVyO1xuZnVuY3Rpb24gbWFzdGVyKG9iamVjdCkge1xuICAgIHJldHVybiBQcm9taXNlKHtcbiAgICAgICAgXCJpc0RlZlwiOiBmdW5jdGlvbiAoKSB7fVxuICAgIH0sIGZ1bmN0aW9uIGZhbGxiYWNrKG9wLCBhcmdzKSB7XG4gICAgICAgIHJldHVybiBkaXNwYXRjaChvYmplY3QsIG9wLCBhcmdzKTtcbiAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBRKG9iamVjdCkuaW5zcGVjdCgpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIFNwcmVhZHMgdGhlIHZhbHVlcyBvZiBhIHByb21pc2VkIGFycmF5IG9mIGFyZ3VtZW50cyBpbnRvIHRoZVxuICogZnVsZmlsbG1lbnQgY2FsbGJhY2suXG4gKiBAcGFyYW0gZnVsZmlsbGVkIGNhbGxiYWNrIHRoYXQgcmVjZWl2ZXMgdmFyaWFkaWMgYXJndW1lbnRzIGZyb20gdGhlXG4gKiBwcm9taXNlZCBhcnJheVxuICogQHBhcmFtIHJlamVjdGVkIGNhbGxiYWNrIHRoYXQgcmVjZWl2ZXMgdGhlIGV4Y2VwdGlvbiBpZiB0aGUgcHJvbWlzZVxuICogaXMgcmVqZWN0ZWQuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgb3IgdGhyb3duIGV4Y2VwdGlvbiBvZlxuICogZWl0aGVyIGNhbGxiYWNrLlxuICovXG5RLnNwcmVhZCA9IHNwcmVhZDtcbmZ1bmN0aW9uIHNwcmVhZCh2YWx1ZSwgZnVsZmlsbGVkLCByZWplY3RlZCkge1xuICAgIHJldHVybiBRKHZhbHVlKS5zcHJlYWQoZnVsZmlsbGVkLCByZWplY3RlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnNwcmVhZCA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIHRoaXMuYWxsKCkudGhlbihmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bGZpbGxlZC5hcHBseSh2b2lkIDAsIGFycmF5KTtcbiAgICB9LCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIFRoZSBhc3luYyBmdW5jdGlvbiBpcyBhIGRlY29yYXRvciBmb3IgZ2VuZXJhdG9yIGZ1bmN0aW9ucywgdHVybmluZ1xuICogdGhlbSBpbnRvIGFzeW5jaHJvbm91cyBnZW5lcmF0b3JzLiAgQWx0aG91Z2ggZ2VuZXJhdG9ycyBhcmUgb25seSBwYXJ0XG4gKiBvZiB0aGUgbmV3ZXN0IEVDTUFTY3JpcHQgNiBkcmFmdHMsIHRoaXMgY29kZSBkb2VzIG5vdCBjYXVzZSBzeW50YXhcbiAqIGVycm9ycyBpbiBvbGRlciBlbmdpbmVzLiAgVGhpcyBjb2RlIHNob3VsZCBjb250aW51ZSB0byB3b3JrIGFuZCB3aWxsXG4gKiBpbiBmYWN0IGltcHJvdmUgb3ZlciB0aW1lIGFzIHRoZSBsYW5ndWFnZSBpbXByb3Zlcy5cbiAqXG4gKiBFUzYgZ2VuZXJhdG9ycyBhcmUgY3VycmVudGx5IHBhcnQgb2YgVjggdmVyc2lvbiAzLjE5IHdpdGggdGhlXG4gKiAtLWhhcm1vbnktZ2VuZXJhdG9ycyBydW50aW1lIGZsYWcgZW5hYmxlZC4gIFNwaWRlck1vbmtleSBoYXMgaGFkIHRoZW1cbiAqIGZvciBsb25nZXIsIGJ1dCB1bmRlciBhbiBvbGRlciBQeXRob24taW5zcGlyZWQgZm9ybS4gIFRoaXMgZnVuY3Rpb25cbiAqIHdvcmtzIG9uIGJvdGgga2luZHMgb2YgZ2VuZXJhdG9ycy5cbiAqXG4gKiBEZWNvcmF0ZXMgYSBnZW5lcmF0b3IgZnVuY3Rpb24gc3VjaCB0aGF0OlxuICogIC0gaXQgbWF5IHlpZWxkIHByb21pc2VzXG4gKiAgLSBleGVjdXRpb24gd2lsbCBjb250aW51ZSB3aGVuIHRoYXQgcHJvbWlzZSBpcyBmdWxmaWxsZWRcbiAqICAtIHRoZSB2YWx1ZSBvZiB0aGUgeWllbGQgZXhwcmVzc2lvbiB3aWxsIGJlIHRoZSBmdWxmaWxsZWQgdmFsdWVcbiAqICAtIGl0IHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlICh3aGVuIHRoZSBnZW5lcmF0b3JcbiAqICAgIHN0b3BzIGl0ZXJhdGluZylcbiAqICAtIHRoZSBkZWNvcmF0ZWQgZnVuY3Rpb24gcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqICAgIG9mIHRoZSBnZW5lcmF0b3Igb3IgdGhlIGZpcnN0IHJlamVjdGVkIHByb21pc2UgYW1vbmcgdGhvc2VcbiAqICAgIHlpZWxkZWQuXG4gKiAgLSBpZiBhbiBlcnJvciBpcyB0aHJvd24gaW4gdGhlIGdlbmVyYXRvciwgaXQgcHJvcGFnYXRlcyB0aHJvdWdoXG4gKiAgICBldmVyeSBmb2xsb3dpbmcgeWllbGQgdW50aWwgaXQgaXMgY2F1Z2h0LCBvciB1bnRpbCBpdCBlc2NhcGVzXG4gKiAgICB0aGUgZ2VuZXJhdG9yIGZ1bmN0aW9uIGFsdG9nZXRoZXIsIGFuZCBpcyB0cmFuc2xhdGVkIGludG8gYVxuICogICAgcmVqZWN0aW9uIGZvciB0aGUgcHJvbWlzZSByZXR1cm5lZCBieSB0aGUgZGVjb3JhdGVkIGdlbmVyYXRvci5cbiAqL1xuUS5hc3luYyA9IGFzeW5jO1xuZnVuY3Rpb24gYXN5bmMobWFrZUdlbmVyYXRvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIHdoZW4gdmVyYiBpcyBcInNlbmRcIiwgYXJnIGlzIGEgdmFsdWVcbiAgICAgICAgLy8gd2hlbiB2ZXJiIGlzIFwidGhyb3dcIiwgYXJnIGlzIGFuIGV4Y2VwdGlvblxuICAgICAgICBmdW5jdGlvbiBjb250aW51ZXIodmVyYiwgYXJnKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0O1xuXG4gICAgICAgICAgICAvLyBVbnRpbCBWOCAzLjE5IC8gQ2hyb21pdW0gMjkgaXMgcmVsZWFzZWQsIFNwaWRlck1vbmtleSBpcyB0aGUgb25seVxuICAgICAgICAgICAgLy8gZW5naW5lIHRoYXQgaGFzIGEgZGVwbG95ZWQgYmFzZSBvZiBicm93c2VycyB0aGF0IHN1cHBvcnQgZ2VuZXJhdG9ycy5cbiAgICAgICAgICAgIC8vIEhvd2V2ZXIsIFNNJ3MgZ2VuZXJhdG9ycyB1c2UgdGhlIFB5dGhvbi1pbnNwaXJlZCBzZW1hbnRpY3Mgb2ZcbiAgICAgICAgICAgIC8vIG91dGRhdGVkIEVTNiBkcmFmdHMuICBXZSB3b3VsZCBsaWtlIHRvIHN1cHBvcnQgRVM2LCBidXQgd2UnZCBhbHNvXG4gICAgICAgICAgICAvLyBsaWtlIHRvIG1ha2UgaXQgcG9zc2libGUgdG8gdXNlIGdlbmVyYXRvcnMgaW4gZGVwbG95ZWQgYnJvd3NlcnMsIHNvXG4gICAgICAgICAgICAvLyB3ZSBhbHNvIHN1cHBvcnQgUHl0aG9uLXN0eWxlIGdlbmVyYXRvcnMuICBBdCBzb21lIHBvaW50IHdlIGNhbiByZW1vdmVcbiAgICAgICAgICAgIC8vIHRoaXMgYmxvY2suXG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgU3RvcEl0ZXJhdGlvbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIC8vIEVTNiBHZW5lcmF0b3JzXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kb25lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBRKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdoZW4ocmVzdWx0LnZhbHVlLCBjYWxsYmFjaywgZXJyYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBTcGlkZXJNb25rZXkgR2VuZXJhdG9yc1xuICAgICAgICAgICAgICAgIC8vIEZJWE1FOiBSZW1vdmUgdGhpcyBjYXNlIHdoZW4gU00gZG9lcyBFUzYgZ2VuZXJhdG9ycy5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0b3JbdmVyYl0oYXJnKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3RvcEl0ZXJhdGlvbihleGNlcHRpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUShleGNlcHRpb24udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB3aGVuKHJlc3VsdCwgY2FsbGJhY2ssIGVycmJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBnZW5lcmF0b3IgPSBtYWtlR2VuZXJhdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGNvbnRpbnVlci5iaW5kKGNvbnRpbnVlciwgXCJuZXh0XCIpO1xuICAgICAgICB2YXIgZXJyYmFjayA9IGNvbnRpbnVlci5iaW5kKGNvbnRpbnVlciwgXCJ0aHJvd1wiKTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBUaGUgc3Bhd24gZnVuY3Rpb24gaXMgYSBzbWFsbCB3cmFwcGVyIGFyb3VuZCBhc3luYyB0aGF0IGltbWVkaWF0ZWx5XG4gKiBjYWxscyB0aGUgZ2VuZXJhdG9yIGFuZCBhbHNvIGVuZHMgdGhlIHByb21pc2UgY2hhaW4sIHNvIHRoYXQgYW55XG4gKiB1bmhhbmRsZWQgZXJyb3JzIGFyZSB0aHJvd24gaW5zdGVhZCBvZiBmb3J3YXJkZWQgdG8gdGhlIGVycm9yXG4gKiBoYW5kbGVyLiBUaGlzIGlzIHVzZWZ1bCBiZWNhdXNlIGl0J3MgZXh0cmVtZWx5IGNvbW1vbiB0byBydW5cbiAqIGdlbmVyYXRvcnMgYXQgdGhlIHRvcC1sZXZlbCB0byB3b3JrIHdpdGggbGlicmFyaWVzLlxuICovXG5RLnNwYXduID0gc3Bhd247XG5mdW5jdGlvbiBzcGF3bihtYWtlR2VuZXJhdG9yKSB7XG4gICAgUS5kb25lKFEuYXN5bmMobWFrZUdlbmVyYXRvcikoKSk7XG59XG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBpbnRlcmZhY2Ugb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW4gU3BpZGVyTW9ua2V5LlxuLyoqXG4gKiBUaHJvd3MgYSBSZXR1cm5WYWx1ZSBleGNlcHRpb24gdG8gc3RvcCBhbiBhc3luY2hyb25vdXMgZ2VuZXJhdG9yLlxuICpcbiAqIFRoaXMgaW50ZXJmYWNlIGlzIGEgc3RvcC1nYXAgbWVhc3VyZSB0byBzdXBwb3J0IGdlbmVyYXRvciByZXR1cm5cbiAqIHZhbHVlcyBpbiBvbGRlciBGaXJlZm94L1NwaWRlck1vbmtleS4gIEluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBFUzZcbiAqIGdlbmVyYXRvcnMgbGlrZSBDaHJvbWl1bSAyOSwganVzdCB1c2UgXCJyZXR1cm5cIiBpbiB5b3VyIGdlbmVyYXRvclxuICogZnVuY3Rpb25zLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSB0aGUgcmV0dXJuIHZhbHVlIGZvciB0aGUgc3Vycm91bmRpbmcgZ2VuZXJhdG9yXG4gKiBAdGhyb3dzIFJldHVyblZhbHVlIGV4Y2VwdGlvbiB3aXRoIHRoZSB2YWx1ZS5cbiAqIEBleGFtcGxlXG4gKiAvLyBFUzYgc3R5bGVcbiAqIFEuYXN5bmMoZnVuY3Rpb24qICgpIHtcbiAqICAgICAgdmFyIGZvbyA9IHlpZWxkIGdldEZvb1Byb21pc2UoKTtcbiAqICAgICAgdmFyIGJhciA9IHlpZWxkIGdldEJhclByb21pc2UoKTtcbiAqICAgICAgcmV0dXJuIGZvbyArIGJhcjtcbiAqIH0pXG4gKiAvLyBPbGRlciBTcGlkZXJNb25rZXkgc3R5bGVcbiAqIFEuYXN5bmMoZnVuY3Rpb24gKCkge1xuICogICAgICB2YXIgZm9vID0geWllbGQgZ2V0Rm9vUHJvbWlzZSgpO1xuICogICAgICB2YXIgYmFyID0geWllbGQgZ2V0QmFyUHJvbWlzZSgpO1xuICogICAgICBRLnJldHVybihmb28gKyBiYXIpO1xuICogfSlcbiAqL1xuUVtcInJldHVyblwiXSA9IF9yZXR1cm47XG5mdW5jdGlvbiBfcmV0dXJuKHZhbHVlKSB7XG4gICAgdGhyb3cgbmV3IFFSZXR1cm5WYWx1ZSh2YWx1ZSk7XG59XG5cbi8qKlxuICogVGhlIHByb21pc2VkIGZ1bmN0aW9uIGRlY29yYXRvciBlbnN1cmVzIHRoYXQgYW55IHByb21pc2UgYXJndW1lbnRzXG4gKiBhcmUgc2V0dGxlZCBhbmQgcGFzc2VkIGFzIHZhbHVlcyAoYHRoaXNgIGlzIGFsc28gc2V0dGxlZCBhbmQgcGFzc2VkXG4gKiBhcyBhIHZhbHVlKS4gIEl0IHdpbGwgYWxzbyBlbnN1cmUgdGhhdCB0aGUgcmVzdWx0IG9mIGEgZnVuY3Rpb24gaXNcbiAqIGFsd2F5cyBhIHByb21pc2UuXG4gKlxuICogQGV4YW1wbGVcbiAqIHZhciBhZGQgPSBRLnByb21pc2VkKGZ1bmN0aW9uIChhLCBiKSB7XG4gKiAgICAgcmV0dXJuIGEgKyBiO1xuICogfSk7XG4gKiBhZGQoUShhKSwgUShCKSk7XG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRvIGRlY29yYXRlXG4gKiBAcmV0dXJucyB7ZnVuY3Rpb259IGEgZnVuY3Rpb24gdGhhdCBoYXMgYmVlbiBkZWNvcmF0ZWQuXG4gKi9cblEucHJvbWlzZWQgPSBwcm9taXNlZDtcbmZ1bmN0aW9uIHByb21pc2VkKGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNwcmVhZChbdGhpcywgYWxsKGFyZ3VtZW50cyldLCBmdW5jdGlvbiAoc2VsZiwgYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICB9O1xufVxuXG4vKipcbiAqIHNlbmRzIGEgbWVzc2FnZSB0byBhIHZhbHVlIGluIGEgZnV0dXJlIHR1cm5cbiAqIEBwYXJhbSBvYmplY3QqIHRoZSByZWNpcGllbnRcbiAqIEBwYXJhbSBvcCB0aGUgbmFtZSBvZiB0aGUgbWVzc2FnZSBvcGVyYXRpb24sIGUuZy4sIFwid2hlblwiLFxuICogQHBhcmFtIGFyZ3MgZnVydGhlciBhcmd1bWVudHMgdG8gYmUgZm9yd2FyZGVkIHRvIHRoZSBvcGVyYXRpb25cbiAqIEByZXR1cm5zIHJlc3VsdCB7UHJvbWlzZX0gYSBwcm9taXNlIGZvciB0aGUgcmVzdWx0IG9mIHRoZSBvcGVyYXRpb25cbiAqL1xuUS5kaXNwYXRjaCA9IGRpc3BhdGNoO1xuZnVuY3Rpb24gZGlzcGF0Y2gob2JqZWN0LCBvcCwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2gob3AsIGFyZ3MpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5kaXNwYXRjaCA9IGZ1bmN0aW9uIChvcCwgYXJncykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnByb21pc2VEaXNwYXRjaChkZWZlcnJlZC5yZXNvbHZlLCBvcCwgYXJncyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gZ2V0XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSBwcm9wZXJ0eSB2YWx1ZVxuICovXG5RLmdldCA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJnZXRcIiwgW2tleV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiZ2V0XCIsIFtrZXldKTtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIG9iamVjdCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBzZXRcbiAqIEBwYXJhbSB2YWx1ZSAgICAgbmV3IHZhbHVlIG9mIHByb3BlcnR5XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5zZXQgPSBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInNldFwiLCBba2V5LCB2YWx1ZV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInNldFwiLCBba2V5LCB2YWx1ZV0pO1xufTtcblxuLyoqXG4gKiBEZWxldGVzIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gZGVsZXRlXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5kZWwgPSAvLyBYWFggbGVnYWN5XG5RW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24gKG9iamVjdCwga2V5KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImRlbGV0ZVwiLCBba2V5XSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kZWwgPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImRlbGV0ZVwiXSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImRlbGV0ZVwiLCBba2V5XSk7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIHZhbHVlICAgICBhIHZhbHVlIHRvIHBvc3QsIHR5cGljYWxseSBhbiBhcnJheSBvZlxuICogICAgICAgICAgICAgICAgICBpbnZvY2F0aW9uIGFyZ3VtZW50cyBmb3IgcHJvbWlzZXMgdGhhdFxuICogICAgICAgICAgICAgICAgICBhcmUgdWx0aW1hdGVseSBiYWNrZWQgd2l0aCBgcmVzb2x2ZWAgdmFsdWVzLFxuICogICAgICAgICAgICAgICAgICBhcyBvcHBvc2VkIHRvIHRob3NlIGJhY2tlZCB3aXRoIFVSTHNcbiAqICAgICAgICAgICAgICAgICAgd2hlcmVpbiB0aGUgcG9zdGVkIHZhbHVlIGNhbiBiZSBhbnlcbiAqICAgICAgICAgICAgICAgICAgSlNPTiBzZXJpYWxpemFibGUgb2JqZWN0LlxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cbi8vIGJvdW5kIGxvY2FsbHkgYmVjYXVzZSBpdCBpcyB1c2VkIGJ5IG90aGVyIG1ldGhvZHNcblEubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEucG9zdCA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJnc10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLnBvc3QgPSBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJnc10pO1xufTtcblxuLyoqXG4gKiBJbnZva2VzIGEgbWV0aG9kIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIG1ldGhvZCB0byBpbnZva2VcbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgaW52b2NhdGlvbiBhcmd1bWVudHNcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLnNlbmQgPSAvLyBYWFggTWFyayBNaWxsZXIncyBwcm9wb3NlZCBwYXJsYW5jZVxuUS5tY2FsbCA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLmludm9rZSA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc2VuZCA9IC8vIFhYWCBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIHBhcmxhbmNlXG5Qcm9taXNlLnByb3RvdHlwZS5tY2FsbCA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5pbnZva2UgPSBmdW5jdGlvbiAobmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKV0pO1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIGFyZ3MgICAgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUS5mYXBwbHkgPSBmdW5jdGlvbiAob2JqZWN0LCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFyZ3NdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZhcHBseSA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcmdzXSk7XG59O1xuXG4vKipcbiAqIENhbGxzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUVtcInRyeVwiXSA9XG5RLmZjYWxsID0gZnVuY3Rpb24gKG9iamVjdCAvKiAuLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmNhbGwgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFycmF5X3NsaWNlKGFyZ3VtZW50cyldKTtcbn07XG5cbi8qKlxuICogQmluZHMgdGhlIHByb21pc2VkIGZ1bmN0aW9uLCB0cmFuc2Zvcm1pbmcgcmV0dXJuIHZhbHVlcyBpbnRvIGEgZnVsZmlsbGVkXG4gKiBwcm9taXNlIGFuZCB0aHJvd24gZXJyb3JzIGludG8gYSByZWplY3RlZCBvbmUuXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RLmZiaW5kID0gZnVuY3Rpb24gKG9iamVjdCAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBwcm9taXNlID0gUShvYmplY3QpO1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gZmJvdW5kKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS5kaXNwYXRjaChcImFwcGx5XCIsIFtcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBhcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKVxuICAgICAgICBdKTtcbiAgICB9O1xufTtcblByb21pc2UucHJvdG90eXBlLmZiaW5kID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzO1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gZmJvdW5kKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS5kaXNwYXRjaChcImFwcGx5XCIsIFtcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBhcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKVxuICAgICAgICBdKTtcbiAgICB9O1xufTtcblxuLyoqXG4gKiBSZXF1ZXN0cyB0aGUgbmFtZXMgb2YgdGhlIG93bmVkIHByb3BlcnRpZXMgb2YgYSBwcm9taXNlZFxuICogb2JqZWN0IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUga2V5cyBvZiB0aGUgZXZlbnR1YWxseSBzZXR0bGVkIG9iamVjdFxuICovXG5RLmtleXMgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImtleXNcIiwgW10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImtleXNcIiwgW10pO1xufTtcblxuLyoqXG4gKiBUdXJucyBhbiBhcnJheSBvZiBwcm9taXNlcyBpbnRvIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkuICBJZiBhbnkgb2ZcbiAqIHRoZSBwcm9taXNlcyBnZXRzIHJlamVjdGVkLCB0aGUgd2hvbGUgYXJyYXkgaXMgcmVqZWN0ZWQgaW1tZWRpYXRlbHkuXG4gKiBAcGFyYW0ge0FycmF5Kn0gYW4gYXJyYXkgKG9yIHByb21pc2UgZm9yIGFuIGFycmF5KSBvZiB2YWx1ZXMgKG9yXG4gKiBwcm9taXNlcyBmb3IgdmFsdWVzKVxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXNcbiAqL1xuLy8gQnkgTWFyayBNaWxsZXJcbi8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPXN0cmF3bWFuOmNvbmN1cnJlbmN5JnJldj0xMzA4Nzc2NTIxI2FsbGZ1bGZpbGxlZFxuUS5hbGwgPSBhbGw7XG5mdW5jdGlvbiBhbGwocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHZhciBwZW5kaW5nQ291bnQgPSAwO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBhcnJheV9yZWR1Y2UocHJvbWlzZXMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHByb21pc2UsIGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgc25hcHNob3Q7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgaXNQcm9taXNlKHByb21pc2UpICYmXG4gICAgICAgICAgICAgICAgKHNuYXBzaG90ID0gcHJvbWlzZS5pbnNwZWN0KCkpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlc1tpbmRleF0gPSBzbmFwc2hvdC52YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgKytwZW5kaW5nQ291bnQ7XG4gICAgICAgICAgICAgICAgd2hlbihcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlc1tpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgtLXBlbmRpbmdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KHsgaW5kZXg6IGluZGV4LCB2YWx1ZTogcHJvZ3Jlc3MgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB2b2lkIDApO1xuICAgICAgICBpZiAocGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9KTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGwodGhpcyk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IHJlc29sdmVkIHByb21pc2Ugb2YgYW4gYXJyYXkuIFByaW9yIHJlamVjdGVkIHByb21pc2VzIGFyZVxuICogaWdub3JlZC4gIFJlamVjdHMgb25seSBpZiBhbGwgcHJvbWlzZXMgYXJlIHJlamVjdGVkLlxuICogQHBhcmFtIHtBcnJheSp9IGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIG9yIHByb21pc2VzIGZvciB2YWx1ZXNcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmdWxmaWxsZWQgd2l0aCB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IHJlc29sdmVkIHByb21pc2UsXG4gKiBvciBhIHJlamVjdGVkIHByb21pc2UgaWYgYWxsIHByb21pc2VzIGFyZSByZWplY3RlZC5cbiAqL1xuUS5hbnkgPSBhbnk7XG5cbmZ1bmN0aW9uIGFueShwcm9taXNlcykge1xuICAgIGlmIChwcm9taXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIFEucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIHZhciBkZWZlcnJlZCA9IFEuZGVmZXIoKTtcbiAgICB2YXIgcGVuZGluZ0NvdW50ID0gMDtcbiAgICBhcnJheV9yZWR1Y2UocHJvbWlzZXMsIGZ1bmN0aW9uIChwcmV2LCBjdXJyZW50LCBpbmRleCkge1xuICAgICAgICB2YXIgcHJvbWlzZSA9IHByb21pc2VzW2luZGV4XTtcblxuICAgICAgICBwZW5kaW5nQ291bnQrKztcblxuICAgICAgICB3aGVuKHByb21pc2UsIG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCBvblByb2dyZXNzKTtcbiAgICAgICAgZnVuY3Rpb24gb25GdWxmaWxsZWQocmVzdWx0KSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25SZWplY3RlZCgpIHtcbiAgICAgICAgICAgIHBlbmRpbmdDb3VudC0tO1xuICAgICAgICAgICAgaWYgKHBlbmRpbmdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIFwiQ2FuJ3QgZ2V0IGZ1bGZpbGxtZW50IHZhbHVlIGZyb20gYW55IHByb21pc2UsIGFsbCBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwicHJvbWlzZXMgd2VyZSByZWplY3RlZC5cIlxuICAgICAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uUHJvZ3Jlc3MocHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLm5vdGlmeSh7XG4gICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9ncmVzc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LCB1bmRlZmluZWQpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFueSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYW55KHRoaXMpO1xufTtcblxuLyoqXG4gKiBXYWl0cyBmb3IgYWxsIHByb21pc2VzIHRvIGJlIHNldHRsZWQsIGVpdGhlciBmdWxmaWxsZWQgb3JcbiAqIHJlamVjdGVkLiAgVGhpcyBpcyBkaXN0aW5jdCBmcm9tIGBhbGxgIHNpbmNlIHRoYXQgd291bGQgc3RvcFxuICogd2FpdGluZyBhdCB0aGUgZmlyc3QgcmVqZWN0aW9uLiAgVGhlIHByb21pc2UgcmV0dXJuZWQgYnlcbiAqIGBhbGxSZXNvbHZlZGAgd2lsbCBuZXZlciBiZSByZWplY3RlZC5cbiAqIEBwYXJhbSBwcm9taXNlcyBhIHByb21pc2UgZm9yIGFuIGFycmF5IChvciBhbiBhcnJheSkgb2YgcHJvbWlzZXNcbiAqIChvciB2YWx1ZXMpXG4gKiBAcmV0dXJuIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgcHJvbWlzZXNcbiAqL1xuUS5hbGxSZXNvbHZlZCA9IGRlcHJlY2F0ZShhbGxSZXNvbHZlZCwgXCJhbGxSZXNvbHZlZFwiLCBcImFsbFNldHRsZWRcIik7XG5mdW5jdGlvbiBhbGxSZXNvbHZlZChwcm9taXNlcykge1xuICAgIHJldHVybiB3aGVuKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgcHJvbWlzZXMgPSBhcnJheV9tYXAocHJvbWlzZXMsIFEpO1xuICAgICAgICByZXR1cm4gd2hlbihhbGwoYXJyYXlfbWFwKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIHdoZW4ocHJvbWlzZSwgbm9vcCwgbm9vcCk7XG4gICAgICAgIH0pKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2VzO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYWxsUmVzb2x2ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFsbFJlc29sdmVkKHRoaXMpO1xufTtcblxuLyoqXG4gKiBAc2VlIFByb21pc2UjYWxsU2V0dGxlZFxuICovXG5RLmFsbFNldHRsZWQgPSBhbGxTZXR0bGVkO1xuZnVuY3Rpb24gYWxsU2V0dGxlZChwcm9taXNlcykge1xuICAgIHJldHVybiBRKHByb21pc2VzKS5hbGxTZXR0bGVkKCk7XG59XG5cbi8qKlxuICogVHVybnMgYW4gYXJyYXkgb2YgcHJvbWlzZXMgaW50byBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHRoZWlyIHN0YXRlcyAoYXNcbiAqIHJldHVybmVkIGJ5IGBpbnNwZWN0YCkgd2hlbiB0aGV5IGhhdmUgYWxsIHNldHRsZWQuXG4gKiBAcGFyYW0ge0FycmF5W0FueSpdfSB2YWx1ZXMgYW4gYXJyYXkgKG9yIHByb21pc2UgZm9yIGFuIGFycmF5KSBvZiB2YWx1ZXMgKG9yXG4gKiBwcm9taXNlcyBmb3IgdmFsdWVzKVxuICogQHJldHVybnMge0FycmF5W1N0YXRlXX0gYW4gYXJyYXkgb2Ygc3RhdGVzIGZvciB0aGUgcmVzcGVjdGl2ZSB2YWx1ZXMuXG4gKi9cblByb21pc2UucHJvdG90eXBlLmFsbFNldHRsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgcmV0dXJuIGFsbChhcnJheV9tYXAocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgICAgICAgICBwcm9taXNlID0gUShwcm9taXNlKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlZ2FyZGxlc3MoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2UuaW5zcGVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbihyZWdhcmRsZXNzLCByZWdhcmRsZXNzKTtcbiAgICAgICAgfSkpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBDYXB0dXJlcyB0aGUgZmFpbHVyZSBvZiBhIHByb21pc2UsIGdpdmluZyBhbiBvcG9ydHVuaXR5IHRvIHJlY292ZXJcbiAqIHdpdGggYSBjYWxsYmFjay4gIElmIHRoZSBnaXZlbiBwcm9taXNlIGlzIGZ1bGZpbGxlZCwgdGhlIHJldHVybmVkXG4gKiBwcm9taXNlIGlzIGZ1bGZpbGxlZC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZSBmb3Igc29tZXRoaW5nXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0byBmdWxmaWxsIHRoZSByZXR1cm5lZCBwcm9taXNlIGlmIHRoZVxuICogZ2l2ZW4gcHJvbWlzZSBpcyByZWplY3RlZFxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBjYWxsYmFja1xuICovXG5RLmZhaWwgPSAvLyBYWFggbGVnYWN5XG5RW1wiY2F0Y2hcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCByZWplY3RlZCkge1xuICAgIHJldHVybiBRKG9iamVjdCkudGhlbih2b2lkIDAsIHJlamVjdGVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZhaWwgPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbih2b2lkIDAsIHJlamVjdGVkKTtcbn07XG5cbi8qKlxuICogQXR0YWNoZXMgYSBsaXN0ZW5lciB0aGF0IGNhbiByZXNwb25kIHRvIHByb2dyZXNzIG5vdGlmaWNhdGlvbnMgZnJvbSBhXG4gKiBwcm9taXNlJ3Mgb3JpZ2luYXRpbmcgZGVmZXJyZWQuIFRoaXMgbGlzdGVuZXIgcmVjZWl2ZXMgdGhlIGV4YWN0IGFyZ3VtZW50c1xuICogcGFzc2VkIHRvIGBgZGVmZXJyZWQubm90aWZ5YGAuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gcmVjZWl2ZSBhbnkgcHJvZ3Jlc3Mgbm90aWZpY2F0aW9uc1xuICogQHJldHVybnMgdGhlIGdpdmVuIHByb21pc2UsIHVuY2hhbmdlZFxuICovXG5RLnByb2dyZXNzID0gcHJvZ3Jlc3M7XG5mdW5jdGlvbiBwcm9ncmVzcyhvYmplY3QsIHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRoZW4odm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5wcm9ncmVzcyA9IGZ1bmN0aW9uIChwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbih2b2lkIDAsIHZvaWQgMCwgcHJvZ3Jlc3NlZCk7XG59O1xuXG4vKipcbiAqIFByb3ZpZGVzIGFuIG9wcG9ydHVuaXR5IHRvIG9ic2VydmUgdGhlIHNldHRsaW5nIG9mIGEgcHJvbWlzZSxcbiAqIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciB0aGUgcHJvbWlzZSBpcyBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuICBGb3J3YXJkc1xuICogdGhlIHJlc29sdXRpb24gdG8gdGhlIHJldHVybmVkIHByb21pc2Ugd2hlbiB0aGUgY2FsbGJhY2sgaXMgZG9uZS5cbiAqIFRoZSBjYWxsYmFjayBjYW4gcmV0dXJuIGEgcHJvbWlzZSB0byBkZWZlciBjb21wbGV0aW9uLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0byBvYnNlcnZlIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlblxuICogcHJvbWlzZSwgdGFrZXMgbm8gYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSB3aGVuXG4gKiBgYGZpbmBgIGlzIGRvbmUuXG4gKi9cblEuZmluID0gLy8gWFhYIGxlZ2FjeVxuUVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgIHJldHVybiBRKG9iamVjdClbXCJmaW5hbGx5XCJdKGNhbGxiYWNrKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZpbiA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiZmluYWxseVwiXSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrID0gUShjYWxsYmFjayk7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gVE9ETyBhdHRlbXB0IHRvIHJlY3ljbGUgdGhlIHJlamVjdGlvbiB3aXRoIFwidGhpc1wiLlxuICAgICAgICByZXR1cm4gY2FsbGJhY2suZmNhbGwoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRocm93IHJlYXNvbjtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFRlcm1pbmF0ZXMgYSBjaGFpbiBvZiBwcm9taXNlcywgZm9yY2luZyByZWplY3Rpb25zIHRvIGJlXG4gKiB0aHJvd24gYXMgZXhjZXB0aW9ucy5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZSBhdCB0aGUgZW5kIG9mIGEgY2hhaW4gb2YgcHJvbWlzZXNcbiAqIEByZXR1cm5zIG5vdGhpbmdcbiAqL1xuUS5kb25lID0gZnVuY3Rpb24gKG9iamVjdCwgZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRvbmUoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykge1xuICAgIHZhciBvblVuaGFuZGxlZEVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIC8vIGZvcndhcmQgdG8gYSBmdXR1cmUgdHVybiBzbyB0aGF0IGBgd2hlbmBgXG4gICAgICAgIC8vIGRvZXMgbm90IGNhdGNoIGl0IGFuZCB0dXJuIGl0IGludG8gYSByZWplY3Rpb24uXG4gICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWFrZVN0YWNrVHJhY2VMb25nKGVycm9yLCBwcm9taXNlKTtcbiAgICAgICAgICAgIGlmIChRLm9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBRLm9uZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIEF2b2lkIHVubmVjZXNzYXJ5IGBuZXh0VGlja2BpbmcgdmlhIGFuIHVubmVjZXNzYXJ5IGB3aGVuYC5cbiAgICB2YXIgcHJvbWlzZSA9IGZ1bGZpbGxlZCB8fCByZWplY3RlZCB8fCBwcm9ncmVzcyA/XG4gICAgICAgIHRoaXMudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykgOlxuICAgICAgICB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHByb2Nlc3MgJiYgcHJvY2Vzcy5kb21haW4pIHtcbiAgICAgICAgb25VbmhhbmRsZWRFcnJvciA9IHByb2Nlc3MuZG9tYWluLmJpbmQob25VbmhhbmRsZWRFcnJvcik7XG4gICAgfVxuXG4gICAgcHJvbWlzZS50aGVuKHZvaWQgMCwgb25VbmhhbmRsZWRFcnJvcik7XG59O1xuXG4vKipcbiAqIENhdXNlcyBhIHByb21pc2UgdG8gYmUgcmVqZWN0ZWQgaWYgaXQgZG9lcyBub3QgZ2V0IGZ1bGZpbGxlZCBiZWZvcmVcbiAqIHNvbWUgbWlsbGlzZWNvbmRzIHRpbWUgb3V0LlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge051bWJlcn0gbWlsbGlzZWNvbmRzIHRpbWVvdXRcbiAqIEBwYXJhbSB7QW55Kn0gY3VzdG9tIGVycm9yIG1lc3NhZ2Ugb3IgRXJyb3Igb2JqZWN0IChvcHRpb25hbClcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UgaWYgaXQgaXNcbiAqIGZ1bGZpbGxlZCBiZWZvcmUgdGhlIHRpbWVvdXQsIG90aGVyd2lzZSByZWplY3RlZC5cbiAqL1xuUS50aW1lb3V0ID0gZnVuY3Rpb24gKG9iamVjdCwgbXMsIGVycm9yKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aW1lb3V0KG1zLCBlcnJvcik7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aW1lb3V0ID0gZnVuY3Rpb24gKG1zLCBlcnJvcikge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWVycm9yIHx8IFwic3RyaW5nXCIgPT09IHR5cGVvZiBlcnJvcikge1xuICAgICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoZXJyb3IgfHwgXCJUaW1lZCBvdXQgYWZ0ZXIgXCIgKyBtcyArIFwiIG1zXCIpO1xuICAgICAgICAgICAgZXJyb3IuY29kZSA9IFwiRVRJTUVET1VUXCI7XG4gICAgICAgIH1cbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICB9LCBtcyk7XG5cbiAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHZhbHVlKTtcbiAgICB9LCBmdW5jdGlvbiAoZXhjZXB0aW9uKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICB9LCBkZWZlcnJlZC5ub3RpZnkpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgZ2l2ZW4gdmFsdWUgKG9yIHByb21pc2VkIHZhbHVlKSwgc29tZVxuICogbWlsbGlzZWNvbmRzIGFmdGVyIGl0IHJlc29sdmVkLiBQYXNzZXMgcmVqZWN0aW9ucyBpbW1lZGlhdGVseS5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kc1xuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSBhZnRlciBtaWxsaXNlY29uZHNcbiAqIHRpbWUgaGFzIGVsYXBzZWQgc2luY2UgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UuXG4gKiBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSByZWplY3RzLCB0aGF0IGlzIHBhc3NlZCBpbW1lZGlhdGVseS5cbiAqL1xuUS5kZWxheSA9IGZ1bmN0aW9uIChvYmplY3QsIHRpbWVvdXQpIHtcbiAgICBpZiAodGltZW91dCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRpbWVvdXQgPSBvYmplY3Q7XG4gICAgICAgIG9iamVjdCA9IHZvaWQgMDtcbiAgICB9XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kZWxheSh0aW1lb3V0KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24gKHRpbWVvdXQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFBhc3NlcyBhIGNvbnRpbnVhdGlvbiB0byBhIE5vZGUgZnVuY3Rpb24sIHdoaWNoIGlzIGNhbGxlZCB3aXRoIHRoZSBnaXZlblxuICogYXJndW1lbnRzIHByb3ZpZGVkIGFzIGFuIGFycmF5LCBhbmQgcmV0dXJucyBhIHByb21pc2UuXG4gKlxuICogICAgICBRLm5mYXBwbHkoRlMucmVhZEZpbGUsIFtfX2ZpbGVuYW1lXSlcbiAqICAgICAgLnRoZW4oZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAqICAgICAgfSlcbiAqXG4gKi9cblEubmZhcHBseSA9IGZ1bmN0aW9uIChjYWxsYmFjaywgYXJncykge1xuICAgIHJldHVybiBRKGNhbGxiYWNrKS5uZmFwcGx5KGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZhcHBseSA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogUGFzc2VzIGEgY29udGludWF0aW9uIHRvIGEgTm9kZSBmdW5jdGlvbiwgd2hpY2ggaXMgY2FsbGVkIHdpdGggdGhlIGdpdmVuXG4gKiBhcmd1bWVudHMgcHJvdmlkZWQgaW5kaXZpZHVhbGx5LCBhbmQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBAZXhhbXBsZVxuICogUS5uZmNhbGwoRlMucmVhZEZpbGUsIF9fZmlsZW5hbWUpXG4gKiAudGhlbihmdW5jdGlvbiAoY29udGVudCkge1xuICogfSlcbiAqXG4gKi9cblEubmZjYWxsID0gZnVuY3Rpb24gKGNhbGxiYWNrIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBRKGNhbGxiYWNrKS5uZmFwcGx5KGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZjYWxsID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBXcmFwcyBhIE5vZGVKUyBjb250aW51YXRpb24gcGFzc2luZyBmdW5jdGlvbiBhbmQgcmV0dXJucyBhbiBlcXVpdmFsZW50XG4gKiB2ZXJzaW9uIHRoYXQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBAZXhhbXBsZVxuICogUS5uZmJpbmQoRlMucmVhZEZpbGUsIF9fZmlsZW5hbWUpKFwidXRmLThcIilcbiAqIC50aGVuKGNvbnNvbGUubG9nKVxuICogLmRvbmUoKVxuICovXG5RLm5mYmluZCA9XG5RLmRlbm9kZWlmeSA9IGZ1bmN0aW9uIChjYWxsYmFjayAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBiYXNlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGVBcmdzID0gYmFzZUFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgICAgIFEoY2FsbGJhY2spLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZiaW5kID1cblByb21pc2UucHJvdG90eXBlLmRlbm9kZWlmeSA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgcmV0dXJuIFEuZGVub2RlaWZ5LmFwcGx5KHZvaWQgMCwgYXJncyk7XG59O1xuXG5RLm5iaW5kID0gZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzcCAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBiYXNlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGVBcmdzID0gYmFzZUFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgICAgIGZ1bmN0aW9uIGJvdW5kKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXNwLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICAgIFEoYm91bmQpLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmJpbmQgPSBmdW5jdGlvbiAoLyp0aGlzcCwgLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDApO1xuICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICByZXR1cm4gUS5uYmluZC5hcHBseSh2b2lkIDAsIGFyZ3MpO1xufTtcblxuLyoqXG4gKiBDYWxscyBhIG1ldGhvZCBvZiBhIE5vZGUtc3R5bGUgb2JqZWN0IHRoYXQgYWNjZXB0cyBhIE5vZGUtc3R5bGVcbiAqIGNhbGxiYWNrIHdpdGggYSBnaXZlbiBhcnJheSBvZiBhcmd1bWVudHMsIHBsdXMgYSBwcm92aWRlZCBjYWxsYmFjay5cbiAqIEBwYXJhbSBvYmplY3QgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBuYW1lZCBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIG1ldGhvZCBvZiBvYmplY3RcbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3MgYXJndW1lbnRzIHRvIHBhc3MgdG8gdGhlIG1ldGhvZDsgdGhlIGNhbGxiYWNrXG4gKiB3aWxsIGJlIHByb3ZpZGVkIGJ5IFEgYW5kIGFwcGVuZGVkIHRvIHRoZXNlIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9yIGVycm9yXG4gKi9cblEubm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLm5wb3N0ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkubnBvc3QobmFtZSwgYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5ubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLm5wb3N0ID0gZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzIHx8IFtdKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIENhbGxzIGEgbWV0aG9kIG9mIGEgTm9kZS1zdHlsZSBvYmplY3QgdGhhdCBhY2NlcHRzIGEgTm9kZS1zdHlsZVxuICogY2FsbGJhY2ssIGZvcndhcmRpbmcgdGhlIGdpdmVuIHZhcmlhZGljIGFyZ3VtZW50cywgcGx1cyBhIHByb3ZpZGVkXG4gKiBjYWxsYmFjayBhcmd1bWVudC5cbiAqIEBwYXJhbSBvYmplY3QgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBuYW1lZCBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIG1ldGhvZCBvZiBvYmplY3RcbiAqIEBwYXJhbSAuLi5hcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFjayB3aWxsXG4gKiBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5zZW5kID0gLy8gWFhYIEJhc2VkIG9uIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgXCJzZW5kXCJcblEubm1jYWxsID0gLy8gWFhYIEJhc2VkIG9uIFwiUmVkc2FuZHJvJ3NcIiBwcm9wb3NhbFxuUS5uaW52b2tlID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uc2VuZCA9IC8vIFhYWCBCYXNlZCBvbiBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIFwic2VuZFwiXG5Qcm9taXNlLnByb3RvdHlwZS5ubWNhbGwgPSAvLyBYWFggQmFzZWQgb24gXCJSZWRzYW5kcm8nc1wiIHByb3Bvc2FsXG5Qcm9taXNlLnByb3RvdHlwZS5uaW52b2tlID0gZnVuY3Rpb24gKG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogSWYgYSBmdW5jdGlvbiB3b3VsZCBsaWtlIHRvIHN1cHBvcnQgYm90aCBOb2RlIGNvbnRpbnVhdGlvbi1wYXNzaW5nLXN0eWxlIGFuZFxuICogcHJvbWlzZS1yZXR1cm5pbmctc3R5bGUsIGl0IGNhbiBlbmQgaXRzIGludGVybmFsIHByb21pc2UgY2hhaW4gd2l0aFxuICogYG5vZGVpZnkobm9kZWJhY2spYCwgZm9yd2FyZGluZyB0aGUgb3B0aW9uYWwgbm9kZWJhY2sgYXJndW1lbnQuICBJZiB0aGUgdXNlclxuICogZWxlY3RzIHRvIHVzZSBhIG5vZGViYWNrLCB0aGUgcmVzdWx0IHdpbGwgYmUgc2VudCB0aGVyZS4gIElmIHRoZXkgZG8gbm90XG4gKiBwYXNzIGEgbm9kZWJhY2ssIHRoZXkgd2lsbCByZWNlaXZlIHRoZSByZXN1bHQgcHJvbWlzZS5cbiAqIEBwYXJhbSBvYmplY3QgYSByZXN1bHQgKG9yIGEgcHJvbWlzZSBmb3IgYSByZXN1bHQpXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBub2RlYmFjayBhIE5vZGUuanMtc3R5bGUgY2FsbGJhY2tcbiAqIEByZXR1cm5zIGVpdGhlciB0aGUgcHJvbWlzZSBvciBub3RoaW5nXG4gKi9cblEubm9kZWlmeSA9IG5vZGVpZnk7XG5mdW5jdGlvbiBub2RlaWZ5KG9iamVjdCwgbm9kZWJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpLm5vZGVpZnkobm9kZWJhY2spO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5ub2RlaWZ5ID0gZnVuY3Rpb24gKG5vZGViYWNrKSB7XG4gICAgaWYgKG5vZGViYWNrKSB7XG4gICAgICAgIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5vZGViYWNrKG51bGwsIHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5vZGViYWNrKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59O1xuXG5RLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJRLm5vQ29uZmxpY3Qgb25seSB3b3JrcyB3aGVuIFEgaXMgdXNlZCBhcyBhIGdsb2JhbFwiKTtcbn07XG5cbi8vIEFsbCBjb2RlIGJlZm9yZSB0aGlzIHBvaW50IHdpbGwgYmUgZmlsdGVyZWQgZnJvbSBzdGFjayB0cmFjZXMuXG52YXIgcUVuZGluZ0xpbmUgPSBjYXB0dXJlTGluZSgpO1xuXG5yZXR1cm4gUTtcblxufSk7XG4iLCIvKiFcbiAqIEV2ZW50RW1pdHRlcjJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9oaWoxbngvRXZlbnRFbWl0dGVyMlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMyBoaWoxbnhcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuOyFmdW5jdGlvbih1bmRlZmluZWQpIHtcblxuICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgPyBBcnJheS5pc0FycmF5IDogZnVuY3Rpb24gX2lzQXJyYXkob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSBcIltvYmplY3QgQXJyYXldXCI7XG4gIH07XG4gIHZhciBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbiAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBpZiAodGhpcy5fY29uZikge1xuICAgICAgY29uZmlndXJlLmNhbGwodGhpcywgdGhpcy5fY29uZik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY29uZmlndXJlKGNvbmYpIHtcbiAgICBpZiAoY29uZikge1xuXG4gICAgICB0aGlzLl9jb25mID0gY29uZjtcblxuICAgICAgY29uZi5kZWxpbWl0ZXIgJiYgKHRoaXMuZGVsaW1pdGVyID0gY29uZi5kZWxpbWl0ZXIpO1xuICAgICAgY29uZi5tYXhMaXN0ZW5lcnMgJiYgKHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgPSBjb25mLm1heExpc3RlbmVycyk7XG4gICAgICBjb25mLndpbGRjYXJkICYmICh0aGlzLndpbGRjYXJkID0gY29uZi53aWxkY2FyZCk7XG4gICAgICBjb25mLm5ld0xpc3RlbmVyICYmICh0aGlzLm5ld0xpc3RlbmVyID0gY29uZi5uZXdMaXN0ZW5lcik7XG5cbiAgICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJUcmVlID0ge307XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gRXZlbnRFbWl0dGVyKGNvbmYpIHtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICB0aGlzLm5ld0xpc3RlbmVyID0gZmFsc2U7XG4gICAgY29uZmlndXJlLmNhbGwodGhpcywgY29uZik7XG4gIH1cblxuICAvL1xuICAvLyBBdHRlbnRpb24sIGZ1bmN0aW9uIHJldHVybiB0eXBlIG5vdyBpcyBhcnJheSwgYWx3YXlzICFcbiAgLy8gSXQgaGFzIHplcm8gZWxlbWVudHMgaWYgbm8gYW55IG1hdGNoZXMgZm91bmQgYW5kIG9uZSBvciBtb3JlXG4gIC8vIGVsZW1lbnRzIChsZWFmcykgaWYgdGhlcmUgYXJlIG1hdGNoZXNcbiAgLy9cbiAgZnVuY3Rpb24gc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlLCBpKSB7XG4gICAgaWYgKCF0cmVlKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHZhciBsaXN0ZW5lcnM9W10sIGxlYWYsIGxlbiwgYnJhbmNoLCB4VHJlZSwgeHhUcmVlLCBpc29sYXRlZEJyYW5jaCwgZW5kUmVhY2hlZCxcbiAgICAgICAgdHlwZUxlbmd0aCA9IHR5cGUubGVuZ3RoLCBjdXJyZW50VHlwZSA9IHR5cGVbaV0sIG5leHRUeXBlID0gdHlwZVtpKzFdO1xuICAgIGlmIChpID09PSB0eXBlTGVuZ3RoICYmIHRyZWUuX2xpc3RlbmVycykge1xuICAgICAgLy9cbiAgICAgIC8vIElmIGF0IHRoZSBlbmQgb2YgdGhlIGV2ZW50KHMpIGxpc3QgYW5kIHRoZSB0cmVlIGhhcyBsaXN0ZW5lcnNcbiAgICAgIC8vIGludm9rZSB0aG9zZSBsaXN0ZW5lcnMuXG4gICAgICAvL1xuICAgICAgaWYgKHR5cGVvZiB0cmVlLl9saXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaGFuZGxlcnMgJiYgaGFuZGxlcnMucHVzaCh0cmVlLl9saXN0ZW5lcnMpO1xuICAgICAgICByZXR1cm4gW3RyZWVdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChsZWFmID0gMCwgbGVuID0gdHJlZS5fbGlzdGVuZXJzLmxlbmd0aDsgbGVhZiA8IGxlbjsgbGVhZisrKSB7XG4gICAgICAgICAgaGFuZGxlcnMgJiYgaGFuZGxlcnMucHVzaCh0cmVlLl9saXN0ZW5lcnNbbGVhZl0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbdHJlZV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKChjdXJyZW50VHlwZSA9PT0gJyonIHx8IGN1cnJlbnRUeXBlID09PSAnKionKSB8fCB0cmVlW2N1cnJlbnRUeXBlXSkge1xuICAgICAgLy9cbiAgICAgIC8vIElmIHRoZSBldmVudCBlbWl0dGVkIGlzICcqJyBhdCB0aGlzIHBhcnRcbiAgICAgIC8vIG9yIHRoZXJlIGlzIGEgY29uY3JldGUgbWF0Y2ggYXQgdGhpcyBwYXRjaFxuICAgICAgLy9cbiAgICAgIGlmIChjdXJyZW50VHlwZSA9PT0gJyonKSB7XG4gICAgICAgIGZvciAoYnJhbmNoIGluIHRyZWUpIHtcbiAgICAgICAgICBpZiAoYnJhbmNoICE9PSAnX2xpc3RlbmVycycgJiYgdHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKzEpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpc3RlbmVycztcbiAgICAgIH0gZWxzZSBpZihjdXJyZW50VHlwZSA9PT0gJyoqJykge1xuICAgICAgICBlbmRSZWFjaGVkID0gKGkrMSA9PT0gdHlwZUxlbmd0aCB8fCAoaSsyID09PSB0eXBlTGVuZ3RoICYmIG5leHRUeXBlID09PSAnKicpKTtcbiAgICAgICAgaWYoZW5kUmVhY2hlZCAmJiB0cmVlLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgICAvLyBUaGUgbmV4dCBlbGVtZW50IGhhcyBhIF9saXN0ZW5lcnMsIGFkZCBpdCB0byB0aGUgaGFuZGxlcnMuXG4gICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWUsIHR5cGVMZW5ndGgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoYnJhbmNoIGluIHRyZWUpIHtcbiAgICAgICAgICBpZiAoYnJhbmNoICE9PSAnX2xpc3RlbmVycycgJiYgdHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XG4gICAgICAgICAgICBpZihicmFuY2ggPT09ICcqJyB8fCBicmFuY2ggPT09ICcqKicpIHtcbiAgICAgICAgICAgICAgaWYodHJlZVticmFuY2hdLl9saXN0ZW5lcnMgJiYgIWVuZFJlYWNoZWQpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCB0eXBlTGVuZ3RoKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbYnJhbmNoXSwgaSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGJyYW5jaCA9PT0gbmV4dFR5cGUpIHtcbiAgICAgICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbYnJhbmNoXSwgaSsyKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBObyBtYXRjaCBvbiB0aGlzIG9uZSwgc2hpZnQgaW50byB0aGUgdHJlZSBidXQgbm90IGluIHRoZSB0eXBlIGFycmF5LlxuICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaXN0ZW5lcnM7XG4gICAgICB9XG5cbiAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2N1cnJlbnRUeXBlXSwgaSsxKSk7XG4gICAgfVxuXG4gICAgeFRyZWUgPSB0cmVlWycqJ107XG4gICAgaWYgKHhUcmVlKSB7XG4gICAgICAvL1xuICAgICAgLy8gSWYgdGhlIGxpc3RlbmVyIHRyZWUgd2lsbCBhbGxvdyBhbnkgbWF0Y2ggZm9yIHRoaXMgcGFydCxcbiAgICAgIC8vIHRoZW4gcmVjdXJzaXZlbHkgZXhwbG9yZSBhbGwgYnJhbmNoZXMgb2YgdGhlIHRyZWVcbiAgICAgIC8vXG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHhUcmVlLCBpKzEpO1xuICAgIH1cblxuICAgIHh4VHJlZSA9IHRyZWVbJyoqJ107XG4gICAgaWYoeHhUcmVlKSB7XG4gICAgICBpZihpIDwgdHlwZUxlbmd0aCkge1xuICAgICAgICBpZih4eFRyZWUuX2xpc3RlbmVycykge1xuICAgICAgICAgIC8vIElmIHdlIGhhdmUgYSBsaXN0ZW5lciBvbiBhICcqKicsIGl0IHdpbGwgY2F0Y2ggYWxsLCBzbyBhZGQgaXRzIGhhbmRsZXIuXG4gICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWUsIHR5cGVMZW5ndGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQnVpbGQgYXJyYXlzIG9mIG1hdGNoaW5nIG5leHQgYnJhbmNoZXMgYW5kIG90aGVycy5cbiAgICAgICAgZm9yKGJyYW5jaCBpbiB4eFRyZWUpIHtcbiAgICAgICAgICBpZihicmFuY2ggIT09ICdfbGlzdGVuZXJzJyAmJiB4eFRyZWUuaGFzT3duUHJvcGVydHkoYnJhbmNoKSkge1xuICAgICAgICAgICAgaWYoYnJhbmNoID09PSBuZXh0VHlwZSkge1xuICAgICAgICAgICAgICAvLyBXZSBrbm93IHRoZSBuZXh0IGVsZW1lbnQgd2lsbCBtYXRjaCwgc28ganVtcCB0d2ljZS5cbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbYnJhbmNoXSwgaSsyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZihicmFuY2ggPT09IGN1cnJlbnRUeXBlKSB7XG4gICAgICAgICAgICAgIC8vIEN1cnJlbnQgbm9kZSBtYXRjaGVzLCBtb3ZlIGludG8gdGhlIHRyZWUuXG4gICAgICAgICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeHhUcmVlW2JyYW5jaF0sIGkrMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpc29sYXRlZEJyYW5jaCA9IHt9O1xuICAgICAgICAgICAgICBpc29sYXRlZEJyYW5jaFticmFuY2hdID0geHhUcmVlW2JyYW5jaF07XG4gICAgICAgICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeyAnKionOiBpc29sYXRlZEJyYW5jaCB9LCBpKzEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKHh4VHJlZS5fbGlzdGVuZXJzKSB7XG4gICAgICAgIC8vIFdlIGhhdmUgcmVhY2hlZCB0aGUgZW5kIGFuZCBzdGlsbCBvbiBhICcqKidcbiAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWUsIHR5cGVMZW5ndGgpO1xuICAgICAgfSBlbHNlIGlmKHh4VHJlZVsnKiddICYmIHh4VHJlZVsnKiddLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbJyonXSwgdHlwZUxlbmd0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGxpc3RlbmVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIGdyb3dMaXN0ZW5lclRyZWUodHlwZSwgbGlzdGVuZXIpIHtcblxuICAgIHR5cGUgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcblxuICAgIC8vXG4gICAgLy8gTG9va3MgZm9yIHR3byBjb25zZWN1dGl2ZSAnKionLCBpZiBzbywgZG9uJ3QgYWRkIHRoZSBldmVudCBhdCBhbGwuXG4gICAgLy9cbiAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0eXBlLmxlbmd0aDsgaSsxIDwgbGVuOyBpKyspIHtcbiAgICAgIGlmKHR5cGVbaV0gPT09ICcqKicgJiYgdHlwZVtpKzFdID09PSAnKionKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgdHJlZSA9IHRoaXMubGlzdGVuZXJUcmVlO1xuICAgIHZhciBuYW1lID0gdHlwZS5zaGlmdCgpO1xuXG4gICAgd2hpbGUgKG5hbWUpIHtcblxuICAgICAgaWYgKCF0cmVlW25hbWVdKSB7XG4gICAgICAgIHRyZWVbbmFtZV0gPSB7fTtcbiAgICAgIH1cblxuICAgICAgdHJlZSA9IHRyZWVbbmFtZV07XG5cbiAgICAgIGlmICh0eXBlLmxlbmd0aCA9PT0gMCkge1xuXG4gICAgICAgIGlmICghdHJlZS5fbGlzdGVuZXJzKSB7XG4gICAgICAgICAgdHJlZS5fbGlzdGVuZXJzID0gbGlzdGVuZXI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih0eXBlb2YgdHJlZS5fbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdHJlZS5fbGlzdGVuZXJzID0gW3RyZWUuX2xpc3RlbmVycywgbGlzdGVuZXJdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzQXJyYXkodHJlZS5fbGlzdGVuZXJzKSkge1xuXG4gICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgICAgICAgaWYgKCF0cmVlLl9saXN0ZW5lcnMud2FybmVkKSB7XG5cbiAgICAgICAgICAgIHZhciBtID0gZGVmYXVsdE1heExpc3RlbmVycztcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBtID0gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG0gPiAwICYmIHRyZWUuX2xpc3RlbmVycy5sZW5ndGggPiBtKSB7XG5cbiAgICAgICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLndhcm5lZCA9IHRydWU7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyZWUuX2xpc3RlbmVycy5sZW5ndGgpO1xuICAgICAgICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgbmFtZSA9IHR5cGUuc2hpZnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuXG4gIC8vIDEwIGxpc3RlbmVycyBhcmUgYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaFxuICAvLyBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbiAgLy9cbiAgLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4gIC8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZGVsaW1pdGVyID0gJy4nO1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XG4gICAgdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyA9IG47XG4gICAgaWYgKCF0aGlzLl9jb25mKSB0aGlzLl9jb25mID0ge307XG4gICAgdGhpcy5fY29uZi5tYXhMaXN0ZW5lcnMgPSBuO1xuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnQgPSAnJztcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgZm4pIHtcbiAgICB0aGlzLm1hbnkoZXZlbnQsIDEsIGZuKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm1hbnkgPSBmdW5jdGlvbihldmVudCwgdHRsLCBmbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWFueSBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlzdGVuZXIoKSB7XG4gICAgICBpZiAoLS10dGwgPT09IDApIHtcbiAgICAgICAgc2VsZi5vZmYoZXZlbnQsIGxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgbGlzdGVuZXIuX29yaWdpbiA9IGZuO1xuXG4gICAgdGhpcy5vbihldmVudCwgbGlzdGVuZXIpO1xuXG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICB0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xuXG4gICAgdmFyIHR5cGUgPSBhcmd1bWVudHNbMF07XG5cbiAgICBpZiAodHlwZSA9PT0gJ25ld0xpc3RlbmVyJyAmJiAhdGhpcy5uZXdMaXN0ZW5lcikge1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgfVxuXG4gICAgLy8gTG9vcCB0aHJvdWdoIHRoZSAqX2FsbCogZnVuY3Rpb25zIGFuZCBpbnZva2UgdGhlbS5cbiAgICBpZiAodGhpcy5fYWxsKSB7XG4gICAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShsIC0gMSk7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGw7IGkrKykgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICBmb3IgKGkgPSAwLCBsID0gdGhpcy5fYWxsLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcbiAgICAgICAgdGhpcy5fYWxsW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuXG4gICAgICBpZiAoIXRoaXMuX2FsbCAmJlxuICAgICAgICAhdGhpcy5fZXZlbnRzLmVycm9yICYmXG4gICAgICAgICEodGhpcy53aWxkY2FyZCAmJiB0aGlzLmxpc3RlbmVyVHJlZS5lcnJvcikpIHtcblxuICAgICAgICBpZiAoYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICB0aHJvdyBhcmd1bWVudHNbMV07IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5jYXVnaHQsIHVuc3BlY2lmaWVkICdlcnJvcicgZXZlbnQuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgaGFuZGxlcjtcblxuICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgIGhhbmRsZXIgPSBbXTtcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgaGFuZGxlciwgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSlcbiAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgLy8gc2xvd2VyXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGwgLSAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbDsgaSsrKSBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmIChoYW5kbGVyKSB7XG4gICAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShsIC0gMSk7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGw7IGkrKykgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICAgIHZhciBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XG4gICAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAobGlzdGVuZXJzLmxlbmd0aCA+IDApIHx8ICEhdGhpcy5fYWxsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiAhIXRoaXMuX2FsbDtcbiAgICB9XG5cbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcblxuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5vbkFueSh0eXBlKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignb24gb25seSBhY2NlcHRzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICAgIH1cbiAgICB0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xuXG4gICAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PSBcIm5ld0xpc3RlbmVyc1wiISBCZWZvcmVcbiAgICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyc1wiLlxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICBncm93TGlzdGVuZXJUcmVlLmNhbGwodGhpcywgdHlwZSwgbGlzdGVuZXIpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHtcbiAgICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gICAgfVxuICAgIGVsc2UgaWYodHlwZW9mIHRoaXMuX2V2ZW50c1t0eXBlXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG4gICAgfVxuICAgIGVsc2UgaWYgKGlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuICAgICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG5cbiAgICAgICAgdmFyIG0gPSBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBtID0gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuXG4gICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub25BbnkgPSBmdW5jdGlvbihmbikge1xuXG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdvbkFueSBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gICAgfVxuXG4gICAgaWYoIXRoaXMuX2FsbCkge1xuICAgICAgdGhpcy5fYWxsID0gW107XG4gICAgfVxuXG4gICAgLy8gQWRkIHRoZSBmdW5jdGlvbiB0byB0aGUgZXZlbnQgbGlzdGVuZXIgY29sbGVjdGlvbi5cbiAgICB0aGlzLl9hbGwucHVzaChmbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncmVtb3ZlTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICB2YXIgaGFuZGxlcnMsbGVhZnM9W107XG5cbiAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcbiAgICAgIGxlYWZzID0gc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgbnVsbCwgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cbiAgICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSByZXR1cm4gdGhpcztcbiAgICAgIGhhbmRsZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgICAgbGVhZnMucHVzaCh7X2xpc3RlbmVyczpoYW5kbGVyc30pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGlMZWFmPTA7IGlMZWFmPGxlYWZzLmxlbmd0aDsgaUxlYWYrKykge1xuICAgICAgdmFyIGxlYWYgPSBsZWFmc1tpTGVhZl07XG4gICAgICBoYW5kbGVycyA9IGxlYWYuX2xpc3RlbmVycztcbiAgICAgIGlmIChpc0FycmF5KGhhbmRsZXJzKSkge1xuXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IC0xO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBoYW5kbGVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChoYW5kbGVyc1tpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAgIChoYW5kbGVyc1tpXS5saXN0ZW5lciAmJiBoYW5kbGVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHx8XG4gICAgICAgICAgICAoaGFuZGxlcnNbaV0uX29yaWdpbiAmJiBoYW5kbGVyc1tpXS5fb3JpZ2luID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwb3NpdGlvbiA8IDApIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgICAgICBsZWFmLl9saXN0ZW5lcnMuc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0uc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYW5kbGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICAgICAgICBkZWxldGUgbGVhZi5fbGlzdGVuZXJzO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoaGFuZGxlcnMgPT09IGxpc3RlbmVyIHx8XG4gICAgICAgIChoYW5kbGVycy5saXN0ZW5lciAmJiBoYW5kbGVycy5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHx8XG4gICAgICAgIChoYW5kbGVycy5fb3JpZ2luICYmIGhhbmRsZXJzLl9vcmlnaW4gPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICAgICAgZGVsZXRlIGxlYWYuX2xpc3RlbmVycztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmZBbnkgPSBmdW5jdGlvbihmbikge1xuICAgIHZhciBpID0gMCwgbCA9IDAsIGZucztcbiAgICBpZiAoZm4gJiYgdGhpcy5fYWxsICYmIHRoaXMuX2FsbC5sZW5ndGggPiAwKSB7XG4gICAgICBmbnMgPSB0aGlzLl9hbGw7XG4gICAgICBmb3IoaSA9IDAsIGwgPSBmbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmKGZuID09PSBmbnNbaV0pIHtcbiAgICAgICAgICBmbnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2FsbCA9IFtdO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmY7XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICF0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYodGhpcy53aWxkY2FyZCkge1xuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XG4gICAgICB2YXIgbGVhZnMgPSBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBudWxsLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xuXG4gICAgICBmb3IgKHZhciBpTGVhZj0wOyBpTGVhZjxsZWFmcy5sZW5ndGg7IGlMZWFmKyspIHtcbiAgICAgICAgdmFyIGxlYWYgPSBsZWFmc1tpTGVhZl07XG4gICAgICAgIGxlYWYuX2xpc3RlbmVycyA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgaWYodGhpcy53aWxkY2FyZCkge1xuICAgICAgdmFyIGhhbmRsZXJzID0gW107XG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcbiAgICAgIHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIGhhbmRsZXJzLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xuICAgICAgcmV0dXJuIGhhbmRsZXJzO1xuICAgIH1cblxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XG5cbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gW107XG4gICAgaWYgKCFpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzQW55ID0gZnVuY3Rpb24oKSB7XG5cbiAgICBpZih0aGlzLl9hbGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9hbGw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICB9O1xuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBFdmVudEVtaXR0ZXI7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBleHBvcnRzLkV2ZW50RW1pdHRlcjIgPSBFdmVudEVtaXR0ZXI7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gQnJvd3NlciBnbG9iYWwuXG4gICAgd2luZG93LkV2ZW50RW1pdHRlcjIgPSBFdmVudEVtaXR0ZXI7XG4gIH1cbn0oKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuICAgIGlmICghb2JqIHx8IHR5cGVvZiBvYmogIT09ICdvYmplY3QnKSByZXR1cm4gb2JqO1xuICAgIFxuICAgIHZhciBjb3B5O1xuICAgIFxuICAgIGlmIChpc0FycmF5KG9iaikpIHtcbiAgICAgICAgdmFyIGxlbiA9IG9iai5sZW5ndGg7XG4gICAgICAgIGNvcHkgPSBBcnJheShsZW4pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBjb3B5W2ldID0gb2JqW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIga2V5cyA9IG9iamVjdEtleXMob2JqKTtcbiAgICAgICAgY29weSA9IHt9O1xuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBrZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgICBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29weTtcbn07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4ga2V5cztcbn07XG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoeHMpIHtcbiAgICByZXR1cm4ge30udG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgaWYgKHNlbGYuZmV0Y2gpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZU5hbWUobmFtZSkge1xuICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIGlmICgvW15hLXowLTlcXC0jJCUmJyorLlxcXl9gfH5dL2kudGVzdChuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBjaGFyYWN0ZXIgaW4gaGVhZGVyIGZpZWxkIG5hbWUnKVxuICAgIH1cbiAgICByZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVWYWx1ZSh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZVxuICB9XG5cbiAgZnVuY3Rpb24gSGVhZGVycyhoZWFkZXJzKSB7XG4gICAgdGhpcy5tYXAgPSB7fVxuXG4gICAgaWYgKGhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG4gICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpXG4gICAgICB9LCB0aGlzKVxuXG4gICAgfSBlbHNlIGlmIChoZWFkZXJzKSB7XG4gICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgaGVhZGVyc1tuYW1lXSlcbiAgICAgIH0sIHRoaXMpXG4gICAgfVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICBuYW1lID0gbm9ybWFsaXplTmFtZShuYW1lKVxuICAgIHZhbHVlID0gbm9ybWFsaXplVmFsdWUodmFsdWUpXG4gICAgdmFyIGxpc3QgPSB0aGlzLm1hcFtuYW1lXVxuICAgIGlmICghbGlzdCkge1xuICAgICAgbGlzdCA9IFtdXG4gICAgICB0aGlzLm1hcFtuYW1lXSA9IGxpc3RcbiAgICB9XG4gICAgbGlzdC5wdXNoKHZhbHVlKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGVbJ2RlbGV0ZSddID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGRlbGV0ZSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciB2YWx1ZXMgPSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXVxuICAgIHJldHVybiB2YWx1ZXMgPyB2YWx1ZXNbMF0gOiBudWxsXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5nZXRBbGwgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldIHx8IFtdXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwLmhhc093blByb3BlcnR5KG5vcm1hbGl6ZU5hbWUobmFtZSkpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldID0gW25vcm1hbGl6ZVZhbHVlKHZhbHVlKV1cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMubWFwKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHRoaXMubWFwW25hbWVdLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2YWx1ZSwgbmFtZSwgdGhpcylcbiAgICAgIH0sIHRoaXMpXG4gICAgfSwgdGhpcylcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnN1bWVkKGJvZHkpIHtcbiAgICBpZiAoYm9keS5ib2R5VXNlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpKVxuICAgIH1cbiAgICBib2R5LmJvZHlVc2VkID0gdHJ1ZVxuICB9XG5cbiAgZnVuY3Rpb24gZmlsZVJlYWRlclJlYWR5KHJlYWRlcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxuICAgICAgfVxuICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KHJlYWRlci5lcnJvcilcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc0FycmF5QnVmZmVyKGJsb2IpIHtcbiAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKVxuICAgIHJldHVybiBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc1RleHQoYmxvYikge1xuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgcmVhZGVyLnJlYWRBc1RleHQoYmxvYilcbiAgICByZXR1cm4gZmlsZVJlYWRlclJlYWR5KHJlYWRlcilcbiAgfVxuXG4gIHZhciBzdXBwb3J0ID0ge1xuICAgIGJsb2I6ICdGaWxlUmVhZGVyJyBpbiBzZWxmICYmICdCbG9iJyBpbiBzZWxmICYmIChmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG5ldyBCbG9iKCk7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfSkoKSxcbiAgICBmb3JtRGF0YTogJ0Zvcm1EYXRhJyBpbiBzZWxmXG4gIH1cblxuICBmdW5jdGlvbiBCb2R5KCkge1xuICAgIHRoaXMuYm9keVVzZWQgPSBmYWxzZVxuXG5cbiAgICB0aGlzLl9pbml0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgICAgIHRoaXMuX2JvZHlJbml0ID0gYm9keVxuICAgICAgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHlcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5ibG9iICYmIEJsb2IucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUJsb2IgPSBib2R5XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuZm9ybURhdGEgJiYgRm9ybURhdGEucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUZvcm1EYXRhID0gYm9keVxuICAgICAgfSBlbHNlIGlmICghYm9keSkge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9ICcnXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc3VwcG9ydGVkIEJvZHlJbml0IHR5cGUnKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdXBwb3J0LmJsb2IpIHtcbiAgICAgIHRoaXMuYmxvYiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUJsb2IpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIGJsb2InKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlUZXh0XSkpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5hcnJheUJ1ZmZlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ibG9iKCkudGhlbihyZWFkQmxvYkFzQXJyYXlCdWZmZXIpXG4gICAgICB9XG5cbiAgICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgIHJldHVybiByZWFkQmxvYkFzVGV4dCh0aGlzLl9ib2R5QmxvYilcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgdGV4dCcpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRleHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcylcbiAgICAgICAgcmV0dXJuIHJlamVjdGVkID8gcmVqZWN0ZWQgOiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keVRleHQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN1cHBvcnQuZm9ybURhdGEpIHtcbiAgICAgIHRoaXMuZm9ybURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oZGVjb2RlKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuanNvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oSlNPTi5wYXJzZSlcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gSFRUUCBtZXRob2RzIHdob3NlIGNhcGl0YWxpemF0aW9uIHNob3VsZCBiZSBub3JtYWxpemVkXG4gIHZhciBtZXRob2RzID0gWydERUxFVEUnLCAnR0VUJywgJ0hFQUQnLCAnT1BUSU9OUycsICdQT1NUJywgJ1BVVCddXG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplTWV0aG9kKG1ldGhvZCkge1xuICAgIHZhciB1cGNhc2VkID0gbWV0aG9kLnRvVXBwZXJDYXNlKClcbiAgICByZXR1cm4gKG1ldGhvZHMuaW5kZXhPZih1cGNhc2VkKSA+IC0xKSA/IHVwY2FzZWQgOiBtZXRob2RcbiAgfVxuXG4gIGZ1bmN0aW9uIFJlcXVlc3QodXJsLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgICB0aGlzLnVybCA9IHVybFxuXG4gICAgdGhpcy5jcmVkZW50aWFscyA9IG9wdGlvbnMuY3JlZGVudGlhbHMgfHwgJ29taXQnXG4gICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKVxuICAgIHRoaXMubWV0aG9kID0gbm9ybWFsaXplTWV0aG9kKG9wdGlvbnMubWV0aG9kIHx8ICdHRVQnKVxuICAgIHRoaXMubW9kZSA9IG9wdGlvbnMubW9kZSB8fCBudWxsXG4gICAgdGhpcy5yZWZlcnJlciA9IG51bGxcblxuICAgIGlmICgodGhpcy5tZXRob2QgPT09ICdHRVQnIHx8IHRoaXMubWV0aG9kID09PSAnSEVBRCcpICYmIG9wdGlvbnMuYm9keSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQm9keSBub3QgYWxsb3dlZCBmb3IgR0VUIG9yIEhFQUQgcmVxdWVzdHMnKVxuICAgIH1cbiAgICB0aGlzLl9pbml0Qm9keShvcHRpb25zLmJvZHkpXG4gIH1cblxuICBmdW5jdGlvbiBkZWNvZGUoYm9keSkge1xuICAgIHZhciBmb3JtID0gbmV3IEZvcm1EYXRhKClcbiAgICBib2R5LnRyaW0oKS5zcGxpdCgnJicpLmZvckVhY2goZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAgIGlmIChieXRlcykge1xuICAgICAgICB2YXIgc3BsaXQgPSBieXRlcy5zcGxpdCgnPScpXG4gICAgICAgIHZhciBuYW1lID0gc3BsaXQuc2hpZnQoKS5yZXBsYWNlKC9cXCsvZywgJyAnKVxuICAgICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKCc9JykucmVwbGFjZSgvXFwrL2csICcgJylcbiAgICAgICAgZm9ybS5hcHBlbmQoZGVjb2RlVVJJQ29tcG9uZW50KG5hbWUpLCBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpKVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIGZvcm1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhlYWRlcnMoeGhyKSB7XG4gICAgdmFyIGhlYWQgPSBuZXcgSGVhZGVycygpXG4gICAgdmFyIHBhaXJzID0geGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpLnRyaW0oKS5zcGxpdCgnXFxuJylcbiAgICBwYWlycy5mb3JFYWNoKGZ1bmN0aW9uKGhlYWRlcikge1xuICAgICAgdmFyIHNwbGl0ID0gaGVhZGVyLnRyaW0oKS5zcGxpdCgnOicpXG4gICAgICB2YXIga2V5ID0gc3BsaXQuc2hpZnQoKS50cmltKClcbiAgICAgIHZhciB2YWx1ZSA9IHNwbGl0LmpvaW4oJzonKS50cmltKClcbiAgICAgIGhlYWQuYXBwZW5kKGtleSwgdmFsdWUpXG4gICAgfSlcbiAgICByZXR1cm4gaGVhZFxuICB9XG5cbiAgQm9keS5jYWxsKFJlcXVlc3QucHJvdG90eXBlKVxuXG4gIGZ1bmN0aW9uIFJlc3BvbnNlKGJvZHlJbml0LCBvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0ge31cbiAgICB9XG5cbiAgICB0aGlzLl9pbml0Qm9keShib2R5SW5pdClcbiAgICB0aGlzLnR5cGUgPSAnZGVmYXVsdCdcbiAgICB0aGlzLnVybCA9IG51bGxcbiAgICB0aGlzLnN0YXR1cyA9IG9wdGlvbnMuc3RhdHVzXG4gICAgdGhpcy5vayA9IHRoaXMuc3RhdHVzID49IDIwMCAmJiB0aGlzLnN0YXR1cyA8IDMwMFxuICAgIHRoaXMuc3RhdHVzVGV4dCA9IG9wdGlvbnMuc3RhdHVzVGV4dFxuICAgIHRoaXMuaGVhZGVycyA9IG9wdGlvbnMuaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMgPyBvcHRpb25zLmhlYWRlcnMgOiBuZXcgSGVhZGVycyhvcHRpb25zLmhlYWRlcnMpXG4gICAgdGhpcy51cmwgPSBvcHRpb25zLnVybCB8fCAnJ1xuICB9XG5cbiAgQm9keS5jYWxsKFJlc3BvbnNlLnByb3RvdHlwZSlcblxuICBzZWxmLkhlYWRlcnMgPSBIZWFkZXJzO1xuICBzZWxmLlJlcXVlc3QgPSBSZXF1ZXN0O1xuICBzZWxmLlJlc3BvbnNlID0gUmVzcG9uc2U7XG5cbiAgc2VsZi5mZXRjaCA9IGZ1bmN0aW9uKGlucHV0LCBpbml0KSB7XG4gICAgLy8gVE9ETzogUmVxdWVzdCBjb25zdHJ1Y3RvciBzaG91bGQgYWNjZXB0IGlucHV0LCBpbml0XG4gICAgdmFyIHJlcXVlc3RcbiAgICBpZiAoUmVxdWVzdC5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihpbnB1dCkgJiYgIWluaXQpIHtcbiAgICAgIHJlcXVlc3QgPSBpbnB1dFxuICAgIH0gZWxzZSB7XG4gICAgICByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoaW5wdXQsIGluaXQpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpXG5cbiAgICAgIGZ1bmN0aW9uIHJlc3BvbnNlVVJMKCkge1xuICAgICAgICBpZiAoJ3Jlc3BvbnNlVVJMJyBpbiB4aHIpIHtcbiAgICAgICAgICByZXR1cm4geGhyLnJlc3BvbnNlVVJMXG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdm9pZCBzZWN1cml0eSB3YXJuaW5ncyBvbiBnZXRSZXNwb25zZUhlYWRlciB3aGVuIG5vdCBhbGxvd2VkIGJ5IENPUlNcbiAgICAgICAgaWYgKC9eWC1SZXF1ZXN0LVVSTDovbS50ZXN0KHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSkpIHtcbiAgICAgICAgICByZXR1cm4geGhyLmdldFJlc3BvbnNlSGVhZGVyKCdYLVJlcXVlc3QtVVJMJylcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc3RhdHVzID0gKHhoci5zdGF0dXMgPT09IDEyMjMpID8gMjA0IDogeGhyLnN0YXR1c1xuICAgICAgICBpZiAoc3RhdHVzIDwgMTAwIHx8IHN0YXR1cyA+IDU5OSkge1xuICAgICAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdOZXR3b3JrIHJlcXVlc3QgZmFpbGVkJykpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQsXG4gICAgICAgICAgaGVhZGVyczogaGVhZGVycyh4aHIpLFxuICAgICAgICAgIHVybDogcmVzcG9uc2VVUkwoKVxuICAgICAgICB9XG4gICAgICAgIHZhciBib2R5ID0gJ3Jlc3BvbnNlJyBpbiB4aHIgPyB4aHIucmVzcG9uc2UgOiB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICByZXNvbHZlKG5ldyBSZXNwb25zZShib2R5LCBvcHRpb25zKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9wZW4ocmVxdWVzdC5tZXRob2QsIHJlcXVlc3QudXJsLCB0cnVlKVxuXG4gICAgICBpZiAocmVxdWVzdC5jcmVkZW50aWFscyA9PT0gJ2luY2x1ZGUnKSB7XG4gICAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSB0cnVlXG4gICAgICB9XG5cbiAgICAgIGlmICgncmVzcG9uc2VUeXBlJyBpbiB4aHIgJiYgc3VwcG9ydC5ibG9iKSB7XG4gICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYmxvYidcbiAgICAgIH1cblxuICAgICAgcmVxdWVzdC5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIobmFtZSwgdmFsdWUpXG4gICAgICB9KVxuXG4gICAgICB4aHIuc2VuZCh0eXBlb2YgcmVxdWVzdC5fYm9keUluaXQgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHJlcXVlc3QuX2JvZHlJbml0KVxuICAgIH0pXG4gIH1cbiAgc2VsZi5mZXRjaC5wb2x5ZmlsbCA9IHRydWVcbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnJlcXVpcmUoJ3doYXR3Zy1mZXRjaCcpO1xudmFyIFEgPSByZXF1aXJlKCdRJyk7XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMicpLkV2ZW50RW1pdHRlcjI7XG52YXIgY29weSA9IHJlcXVpcmUoJ3NoYWxsb3ctY29weScpO1xuXG4vLyBUaGUgZGVmYXVsdCBiYXNlIHVybC5cbnZhciBiYXNlVXJsID0gJyc7XG5cbnZhciBwbHVnaW5zID0gW107XG5cbi8vIFRoZSB0ZW1wb3JhcnkgR0VUIHJlcXVlc3QgY2FjaGUgc3RvcmFnZVxudmFyIGNhY2hlID0ge307XG5cbnZhciBub29wID0gZnVuY3Rpb24oKXt9O1xudmFyIGlkZW50aXR5ID0gZnVuY3Rpb24odmFsdWUpIHsgcmV0dXJuIHZhbHVlOyB9O1xuXG4vLyBXaWxsIGludm9rZSBhIGZ1bmN0aW9uIG9uIGFsbCBwbHVnaW5zLlxuLy8gUmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIGFsbCBwcm9taXNlc1xuLy8gcmV0dXJuZWQgYnkgdGhlIHBsdWdpbnMgaGF2ZSByZXNvbHZlZC5cbi8vIFNob3VsZCBiZSB1c2VkIHdoZW4geW91IHdhbnQgcGx1Z2lucyB0byBwcmVwYXJlIGZvciBhbiBldmVudFxuLy8gYnV0IGRvbid0IHdhbnQgYW55IGRhdGEgcmV0dXJuZWQuXG52YXIgcGx1Z2luV2FpdCA9IGZ1bmN0aW9uKHBsdWdpbkZuKSB7XG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICByZXR1cm4gUS5hbGwocGx1Z2lucy5tYXAoZnVuY3Rpb24ocGx1Z2luKSB7XG4gICAgcmV0dXJuIChwbHVnaW5bcGx1Z2luRm5dIHx8IG5vb3ApLmFwcGx5KHBsdWdpbiwgYXJncyk7XG4gIH0pKTtcbn07XG5cbi8vIFdpbGwgaW52b2tlIGEgZnVuY3Rpb24gb24gcGx1Z2lucyBmcm9tIGhpZ2hlc3QgcHJpb3JpdHlcbi8vIHRvIGxvd2VzdCB1bnRpbCBvbmUgcmV0dXJucyBhIHZhbHVlLiBSZXR1cm5zIG51bGwgaWYgbm9cbi8vIHBsdWdpbnMgcmV0dXJuIGEgdmFsdWUuXG4vLyBTaG91bGQgYmUgdXNlZCB3aGVuIHlvdSB3YW50IGp1c3Qgb25lIHBsdWdpbiB0byBoYW5kbGUgdGhpbmdzLlxudmFyIHBsdWdpbkdldCA9IGZ1bmN0aW9uKHBsdWdpbkZuKSB7XG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICB2YXIgY2FsbFBsdWdpbiA9IGZ1bmN0aW9uKGluZGV4LCBwbHVnaW5Gbikge1xuICAgIHZhciBwbHVnaW4gPSBwbHVnaW5zW2luZGV4XTtcbiAgICBpZiAoIXBsdWdpbikgcmV0dXJuIFEobnVsbCk7XG4gICAgcmV0dXJuIFEoKHBsdWdpbiAmJiBwbHVnaW5bcGx1Z2luRm5dIHx8IG5vb3ApLmFwcGx5KHBsdWdpbiwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpKSlcbiAgICAudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgIGlmIChyZXN1bHQgIT09IG51bGwgJiYgcmVzdWx0ICE9PSB1bmRlZmluZWQpIHJldHVybiByZXN1bHQ7XG4gICAgICByZXR1cm4gY2FsbFBsdWdpbi5hcHBseShudWxsLCBbaW5kZXggKyAxXS5jb25jYXQoYXJncykpO1xuICAgIH0pO1xuICB9O1xuICByZXR1cm4gY2FsbFBsdWdpbi5hcHBseShudWxsLCBbMF0uY29uY2F0KGFyZ3MpKTtcbn07XG5cbi8vIFdpbGwgaW52b2tlIGEgZnVuY3Rpb24gb24gcGx1Z2lucyBmcm9tIGhpZ2hlc3QgcHJpb3JpdHkgdG9cbi8vIGxvd2VzdCwgYnVpbGRpbmcgYSBwcm9taXNlIGNoYWluIGZyb20gdGhlaXIgcmV0dXJuIHZhbHVlc1xuLy8gU2hvdWxkIGJlIHVzZWQgd2hlbiBhbGwgcGx1Z2lucyBuZWVkIHRvIHByb2Nlc3MgYSBwcm9taXNlJ3Ncbi8vIHN1Y2Nlc3Mgb3IgZmFpbHVyZVxudmFyIHBsdWdpbkFsdGVyID0gZnVuY3Rpb24ocGx1Z2luRm4sIHZhbHVlKSB7XG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICByZXR1cm4gcGx1Z2lucy5yZWR1Y2UoZnVuY3Rpb24odmFsdWUsIHBsdWdpbikge1xuICAgICAgcmV0dXJuIChwbHVnaW5bcGx1Z2luRm5dIHx8IGlkZW50aXR5KS5hcHBseShwbHVnaW4sIFt2YWx1ZV0uY29uY2F0KGFyZ3MpKTtcbiAgfSwgdmFsdWUpO1xufTtcblxuXG4vKipcbiAqIFJldHVybnMgcGFydHMgb2YgdGhlIFVSTCB0aGF0IGFyZSBpbXBvcnRhbnQuXG4gKiBJbmRleGVzXG4gKiAgLSAwOiBUaGUgZnVsbCB1cmxcbiAqICAtIDE6IFRoZSBwcm90b2NvbFxuICogIC0gMjogVGhlIGhvc3RuYW1lXG4gKiAgLSAzOiBUaGUgcmVzdFxuICpcbiAqIEBwYXJhbSB1cmxcbiAqIEByZXR1cm5zIHsqfVxuICovXG52YXIgZ2V0VXJsUGFydHMgPSBmdW5jdGlvbih1cmwpIHtcbiAgcmV0dXJuIHVybC5tYXRjaCgvXihodHRwW3NdPzpcXC9cXC8pKFteL10rKSgkfFxcLy4qKS8pO1xufTtcblxudmFyIHNlcmlhbGl6ZSA9IGZ1bmN0aW9uKG9iaikge1xuICB2YXIgc3RyID0gW107XG4gIGZvcih2YXIgcCBpbiBvYmopXG4gICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwKSkge1xuICAgICAgc3RyLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KHApICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQob2JqW3BdKSk7XG4gICAgfVxuICByZXR1cm4gc3RyLmpvaW4oXCImXCIpO1xufTtcblxuLy8gVGhlIGZvcm1pbyBjbGFzcy5cbnZhciBGb3JtaW8gPSBmdW5jdGlvbihwYXRoKSB7XG5cbiAgLy8gRW5zdXJlIHdlIGhhdmUgYW4gaW5zdGFuY2Ugb2YgRm9ybWlvLlxuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRm9ybWlvKSkgeyByZXR1cm4gbmV3IEZvcm1pbyhwYXRoKTsgfVxuICBpZiAoIXBhdGgpIHtcbiAgICAvLyBBbGxvdyB1c2VyIHRvIGNyZWF0ZSBuZXcgcHJvamVjdHMgaWYgdGhpcyB3YXMgaW5zdGFudGlhdGVkIHdpdGhvdXRcbiAgICAvLyBhIHVybFxuICAgIHRoaXMucHJvamVjdFVybCA9IGJhc2VVcmwgKyAnL3Byb2plY3QnO1xuICAgIHRoaXMucHJvamVjdHNVcmwgPSBiYXNlVXJsICsgJy9wcm9qZWN0JztcbiAgICB0aGlzLnByb2plY3RJZCA9IGZhbHNlO1xuICAgIHRoaXMucXVlcnkgPSAnJztcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBJbml0aWFsaXplIG91ciB2YXJpYWJsZXMuXG4gIHRoaXMucHJvamVjdHNVcmwgPSAnJztcbiAgdGhpcy5wcm9qZWN0VXJsID0gJyc7XG4gIHRoaXMucHJvamVjdElkID0gJyc7XG4gIHRoaXMuZm9ybVVybCA9ICcnO1xuICB0aGlzLmZvcm1zVXJsID0gJyc7XG4gIHRoaXMuZm9ybUlkID0gJyc7XG4gIHRoaXMuc3VibWlzc2lvbnNVcmwgPSAnJztcbiAgdGhpcy5zdWJtaXNzaW9uVXJsID0gJyc7XG4gIHRoaXMuc3VibWlzc2lvbklkID0gJyc7XG4gIHRoaXMuYWN0aW9uc1VybCA9ICcnO1xuICB0aGlzLmFjdGlvbklkID0gJyc7XG4gIHRoaXMuYWN0aW9uVXJsID0gJyc7XG4gIHRoaXMucXVlcnkgPSAnJztcblxuICAvLyBOb3JtYWxpemUgdG8gYW4gYWJzb2x1dGUgcGF0aC5cbiAgaWYgKChwYXRoLmluZGV4T2YoJ2h0dHAnKSAhPT0gMCkgJiYgKHBhdGguaW5kZXhPZignLy8nKSAhPT0gMCkpIHtcbiAgICBiYXNlVXJsID0gYmFzZVVybCA/IGJhc2VVcmwgOiB3aW5kb3cubG9jYXRpb24uaHJlZi5tYXRjaCgvaHR0cFtzXT86XFwvXFwvYXBpLi8pWzBdO1xuICAgIHBhdGggPSBiYXNlVXJsICsgcGF0aDtcbiAgfVxuXG4gIHZhciBob3N0cGFydHMgPSBnZXRVcmxQYXJ0cyhwYXRoKTtcbiAgdmFyIHBhcnRzID0gW107XG4gIHZhciBob3N0TmFtZSA9IGhvc3RwYXJ0c1sxXSArIGhvc3RwYXJ0c1syXTtcbiAgcGF0aCA9IGhvc3RwYXJ0cy5sZW5ndGggPiAzID8gaG9zdHBhcnRzWzNdIDogJyc7XG4gIHZhciBxdWVyeXBhcnRzID0gcGF0aC5zcGxpdCgnPycpO1xuICBpZiAocXVlcnlwYXJ0cy5sZW5ndGggPiAxKSB7XG4gICAgcGF0aCA9IHF1ZXJ5cGFydHNbMF07XG4gICAgdGhpcy5xdWVyeSA9ICc/JyArIHF1ZXJ5cGFydHNbMV07XG4gIH1cblxuICAvLyBTZWUgaWYgdGhpcyBpcyBhIGZvcm0gcGF0aC5cbiAgaWYgKChwYXRoLnNlYXJjaCgvKF58XFwvKShmb3JtfHByb2plY3QpKCR8XFwvKS8pICE9PSAtMSkpIHtcblxuICAgIC8vIFJlZ2lzdGVyIGEgc3BlY2lmaWMgcGF0aC5cbiAgICB2YXIgcmVnaXN0ZXJQYXRoID0gZnVuY3Rpb24obmFtZSwgYmFzZSkge1xuICAgICAgdGhpc1tuYW1lICsgJ3NVcmwnXSA9IGJhc2UgKyAnLycgKyBuYW1lO1xuICAgICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cCgnXFwvJyArIG5hbWUgKyAnXFwvKFteL10rKScpO1xuICAgICAgaWYgKHBhdGguc2VhcmNoKHJlZ2V4KSAhPT0gLTEpIHtcbiAgICAgICAgcGFydHMgPSBwYXRoLm1hdGNoKHJlZ2V4KTtcbiAgICAgICAgdGhpc1tuYW1lICsgJ1VybCddID0gcGFydHMgPyAoYmFzZSArIHBhcnRzWzBdKSA6ICcnO1xuICAgICAgICB0aGlzW25hbWUgKyAnSWQnXSA9IChwYXJ0cy5sZW5ndGggPiAxKSA/IHBhcnRzWzFdIDogJyc7XG4gICAgICAgIGJhc2UgKz0gcGFydHNbMF07XG4gICAgICB9XG4gICAgICByZXR1cm4gYmFzZTtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAvLyBSZWdpc3RlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAgICB2YXIgcmVnaXN0ZXJJdGVtcyA9IGZ1bmN0aW9uKGl0ZW1zLCBiYXNlLCBzdGF0aWNCYXNlKSB7XG4gICAgICBmb3IgKHZhciBpIGluIGl0ZW1zKSB7XG4gICAgICAgIGlmIChpdGVtcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgIHZhciBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgICAgaWYgKGl0ZW0gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgcmVnaXN0ZXJJdGVtcyhpdGVtLCBiYXNlLCB0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbmV3QmFzZSA9IHJlZ2lzdGVyUGF0aChpdGVtLCBiYXNlKTtcbiAgICAgICAgICAgIGJhc2UgPSBzdGF0aWNCYXNlID8gYmFzZSA6IG5ld0Jhc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJlZ2lzdGVySXRlbXMoWydwcm9qZWN0JywgJ2Zvcm0nLCBbJ3N1Ym1pc3Npb24nLCAnYWN0aW9uJ11dLCBob3N0TmFtZSk7XG5cbiAgICBpZiAoIXRoaXMucHJvamVjdElkKSB7XG4gICAgICBpZiAoaG9zdHBhcnRzLmxlbmd0aCA+IDIgJiYgaG9zdHBhcnRzWzJdLnNwbGl0KCcuJykubGVuZ3RoID4gMikge1xuICAgICAgICB0aGlzLnByb2plY3RVcmwgPSBob3N0TmFtZTtcbiAgICAgICAgdGhpcy5wcm9qZWN0SWQgPSBob3N0cGFydHNbMl0uc3BsaXQoJy4nKVswXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSB7XG5cbiAgICAvLyBUaGlzIGlzIGFuIGFsaWFzZWQgdXJsLlxuICAgIHRoaXMucHJvamVjdFVybCA9IGhvc3ROYW1lO1xuICAgIHRoaXMucHJvamVjdElkID0gKGhvc3RwYXJ0cy5sZW5ndGggPiAyKSA/IGhvc3RwYXJ0c1syXS5zcGxpdCgnLicpWzBdIDogJyc7XG4gICAgdmFyIHN1YlJlZ0V4ID0gbmV3IFJlZ0V4cCgnXFwvKHN1Ym1pc3Npb258YWN0aW9uKSgkfFxcLy4qKScpO1xuICAgIHZhciBzdWJzID0gcGF0aC5tYXRjaChzdWJSZWdFeCk7XG4gICAgdGhpcy5wYXRoVHlwZSA9IChzdWJzICYmIChzdWJzLmxlbmd0aCA+IDEpKSA/IHN1YnNbMV0gOiAnJztcbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlKHN1YlJlZ0V4LCAnJyk7XG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXFwvJC8sICcnKTtcbiAgICB0aGlzLmZvcm1zVXJsID0gaG9zdE5hbWUgKyAnL2Zvcm0nO1xuICAgIHRoaXMuZm9ybVVybCA9IGhvc3ROYW1lICsgcGF0aDtcbiAgICB0aGlzLmZvcm1JZCA9IHBhdGgucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywgJycpO1xuICAgIHZhciBpdGVtcyA9IFsnc3VibWlzc2lvbicsICdhY3Rpb24nXTtcbiAgICBmb3IgKHZhciBpIGluIGl0ZW1zKSB7XG4gICAgICBpZiAoaXRlbXMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgdGhpc1tpdGVtICsgJ3NVcmwnXSA9IGhvc3ROYW1lICsgcGF0aCArICcvJyArIGl0ZW07XG4gICAgICAgIGlmICgodGhpcy5wYXRoVHlwZSA9PT0gaXRlbSkgJiYgKHN1YnMubGVuZ3RoID4gMikgJiYgc3Vic1syXSkge1xuICAgICAgICAgIHRoaXNbaXRlbSArICdJZCddID0gc3Vic1syXS5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCAnJyk7XG4gICAgICAgICAgdGhpc1tpdGVtICsgJ1VybCddID0gaG9zdE5hbWUgKyBwYXRoICsgc3Vic1swXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBMb2FkIGEgcmVzb3VyY2UuXG4gKlxuICogQHBhcmFtIHR5cGVcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAqIEBwcml2YXRlXG4gKi9cbnZhciBfbG9hZCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIF9pZCA9IHR5cGUgKyAnSWQnO1xuICB2YXIgX3VybCA9IHR5cGUgKyAnVXJsJztcbiAgcmV0dXJuIGZ1bmN0aW9uKHF1ZXJ5LCBvcHRzKSB7XG4gICAgaWYgKHF1ZXJ5ICYmIHR5cGVvZiBxdWVyeSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHF1ZXJ5ID0gc2VyaWFsaXplKHF1ZXJ5LnBhcmFtcyk7XG4gICAgfVxuICAgIGlmIChxdWVyeSkge1xuICAgICAgcXVlcnkgPSB0aGlzLnF1ZXJ5ID8gKHRoaXMucXVlcnkgKyAnJicgKyBxdWVyeSkgOiAoJz8nICsgcXVlcnkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHF1ZXJ5ID0gdGhpcy5xdWVyeTtcbiAgICB9XG4gICAgaWYgKCF0aGlzW19pZF0pIHsgcmV0dXJuIFEucmVqZWN0KCdNaXNzaW5nICcgKyBfaWQpOyB9XG4gICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3QodHlwZSwgdGhpc1tfdXJsXSArIHF1ZXJ5LCAnZ2V0JywgbnVsbCwgb3B0cyk7XG4gIH07XG59O1xuXG4vKipcbiAqIFNhdmUgYSByZXNvdXJjZS5cbiAqXG4gKiBAcGFyYW0gdHlwZVxuICogQHJldHVybnMge0Z1bmN0aW9ufVxuICogQHByaXZhdGVcbiAqL1xudmFyIF9zYXZlID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgX2lkID0gdHlwZSArICdJZCc7XG4gIHZhciBfdXJsID0gdHlwZSArICdVcmwnO1xuICByZXR1cm4gZnVuY3Rpb24oZGF0YSwgb3B0cykge1xuICAgIHZhciBtZXRob2QgPSB0aGlzW19pZF0gPyAncHV0JyA6ICdwb3N0JztcbiAgICB2YXIgcmVxVXJsID0gdGhpc1tfaWRdID8gdGhpc1tfdXJsXSA6IHRoaXNbdHlwZSArICdzVXJsJ107XG4gICAgY2FjaGUgPSB7fTtcbiAgICByZXR1cm4gdGhpcy5tYWtlUmVxdWVzdCh0eXBlLCByZXFVcmwgKyB0aGlzLnF1ZXJ5LCBtZXRob2QsIGRhdGEsIG9wdHMpO1xuICB9O1xufTtcblxuLyoqXG4gKiBEZWxldGUgYSByZXNvdXJjZS5cbiAqXG4gKiBAcGFyYW0gdHlwZVxuICogQHJldHVybnMge0Z1bmN0aW9ufVxuICogQHByaXZhdGVcbiAqL1xudmFyIF9kZWxldGUgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBfaWQgPSB0eXBlICsgJ0lkJztcbiAgdmFyIF91cmwgPSB0eXBlICsgJ1VybCc7XG4gIHJldHVybiBmdW5jdGlvbihvcHRzKSB7XG4gICAgaWYgKCF0aGlzW19pZF0pIHsgUS5yZWplY3QoJ05vdGhpbmcgdG8gZGVsZXRlJyk7IH1cbiAgICBjYWNoZSA9IHt9O1xuICAgIHJldHVybiB0aGlzLm1ha2VSZXF1ZXN0KHR5cGUsIHRoaXNbX3VybF0sICdkZWxldGUnLCBudWxsLCBvcHRzKTtcbiAgfTtcbn07XG5cbi8qKlxuICogUmVzb3VyY2UgaW5kZXggbWV0aG9kLlxuICpcbiAqIEBwYXJhbSB0eXBlXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gKiBAcHJpdmF0ZVxuICovXG52YXIgX2luZGV4ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgX3VybCA9IHR5cGUgKyAnVXJsJztcbiAgcmV0dXJuIGZ1bmN0aW9uKHF1ZXJ5LCBvcHRzKSB7XG4gICAgcXVlcnkgPSBxdWVyeSB8fCAnJztcbiAgICBpZiAocXVlcnkgJiYgdHlwZW9mIHF1ZXJ5ID09PSAnb2JqZWN0Jykge1xuICAgICAgcXVlcnkgPSAnPycgKyBzZXJpYWxpemUocXVlcnkucGFyYW1zKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3QodHlwZSwgdGhpc1tfdXJsXSArIHF1ZXJ5LCAnZ2V0JywgbnVsbCwgb3B0cyk7XG4gIH07XG59O1xuXG4vLyBBY3RpdmF0ZXMgcGx1Z2luIGhvb2tzLCBtYWtlcyBGb3JtaW8ucmVxdWVzdCBpZiBubyBwbHVnaW4gcHJvdmlkZXMgYSByZXF1ZXN0XG5Gb3JtaW8ucHJvdG90eXBlLm1ha2VSZXF1ZXN0ID0gZnVuY3Rpb24odHlwZSwgdXJsLCBtZXRob2QsIGRhdGEsIG9wdHMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBtZXRob2QgPSAobWV0aG9kIHx8ICdHRVQnKS50b1VwcGVyQ2FzZSgpO1xuICBpZighb3B0cyB8fCB0eXBlb2Ygb3B0cyAhPT0gJ29iamVjdCcpIHtcbiAgICBvcHRzID0ge307XG4gIH1cblxuICB2YXIgcmVxdWVzdEFyZ3MgPSB7XG4gICAgZm9ybWlvOiBzZWxmLFxuICAgIHR5cGU6IHR5cGUsXG4gICAgdXJsOiB1cmwsXG4gICAgbWV0aG9kOiBtZXRob2QsXG4gICAgZGF0YTogZGF0YSxcbiAgICBvcHRzOiBvcHRzXG4gIH07XG5cbiAgdmFyIHJlcXVlc3QgPSBwbHVnaW5XYWl0KCdwcmVSZXF1ZXN0JywgcmVxdWVzdEFyZ3MpXG4gIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBwbHVnaW5HZXQoJ3JlcXVlc3QnLCByZXF1ZXN0QXJncylcbiAgICAudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgIGlmIChyZXN1bHQgPT09IG51bGwgfHwgcmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIEZvcm1pby5yZXF1ZXN0KHVybCwgbWV0aG9kLCBkYXRhKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBwbHVnaW5BbHRlcignd3JhcFJlcXVlc3RQcm9taXNlJywgcmVxdWVzdCwgcmVxdWVzdEFyZ3MpO1xufTtcblxuLy8gRGVmaW5lIHNwZWNpZmljIENSVUQgbWV0aG9kcy5cbkZvcm1pby5wcm90b3R5cGUubG9hZFByb2plY3QgPSBfbG9hZCgncHJvamVjdCcpO1xuRm9ybWlvLnByb3RvdHlwZS5zYXZlUHJvamVjdCA9IF9zYXZlKCdwcm9qZWN0Jyk7XG5Gb3JtaW8ucHJvdG90eXBlLmRlbGV0ZVByb2plY3QgPSBfZGVsZXRlKCdwcm9qZWN0Jyk7XG5Gb3JtaW8ucHJvdG90eXBlLmxvYWRGb3JtID0gX2xvYWQoJ2Zvcm0nKTtcbkZvcm1pby5wcm90b3R5cGUuc2F2ZUZvcm0gPSBfc2F2ZSgnZm9ybScpO1xuRm9ybWlvLnByb3RvdHlwZS5kZWxldGVGb3JtID0gX2RlbGV0ZSgnZm9ybScpO1xuRm9ybWlvLnByb3RvdHlwZS5sb2FkRm9ybXMgPSBfaW5kZXgoJ2Zvcm1zJyk7XG5Gb3JtaW8ucHJvdG90eXBlLmxvYWRTdWJtaXNzaW9uID0gX2xvYWQoJ3N1Ym1pc3Npb24nKTtcbkZvcm1pby5wcm90b3R5cGUuc2F2ZVN1Ym1pc3Npb24gPSBfc2F2ZSgnc3VibWlzc2lvbicpO1xuRm9ybWlvLnByb3RvdHlwZS5kZWxldGVTdWJtaXNzaW9uID0gX2RlbGV0ZSgnc3VibWlzc2lvbicpO1xuRm9ybWlvLnByb3RvdHlwZS5sb2FkU3VibWlzc2lvbnMgPSBfaW5kZXgoJ3N1Ym1pc3Npb25zJyk7XG5Gb3JtaW8ucHJvdG90eXBlLmxvYWRBY3Rpb24gPSBfbG9hZCgnYWN0aW9uJyk7XG5Gb3JtaW8ucHJvdG90eXBlLnNhdmVBY3Rpb24gPSBfc2F2ZSgnYWN0aW9uJyk7XG5Gb3JtaW8ucHJvdG90eXBlLmRlbGV0ZUFjdGlvbiA9IF9kZWxldGUoJ2FjdGlvbicpO1xuRm9ybWlvLnByb3RvdHlwZS5sb2FkQWN0aW9ucyA9IF9pbmRleCgnYWN0aW9ucycpO1xuRm9ybWlvLnByb3RvdHlwZS5hdmFpbGFibGVBY3Rpb25zID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLm1ha2VSZXF1ZXN0KCdhdmFpbGFibGVBY3Rpb25zJywgdGhpcy5mb3JtVXJsICsgJy9hY3Rpb25zJyk7IH07XG5Gb3JtaW8ucHJvdG90eXBlLmFjdGlvbkluZm8gPSBmdW5jdGlvbihuYW1lKSB7IHJldHVybiB0aGlzLm1ha2VSZXF1ZXN0KCdhY3Rpb25JbmZvJywgdGhpcy5mb3JtVXJsICsgJy9hY3Rpb25zLycgKyBuYW1lKTsgfTtcblxuRm9ybWlvLm1ha2VTdGF0aWNSZXF1ZXN0ID0gZnVuY3Rpb24odXJsLCBtZXRob2QsIGRhdGEpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBtZXRob2QgPSAobWV0aG9kIHx8ICdHRVQnKS50b1VwcGVyQ2FzZSgpO1xuXG4gIHZhciByZXF1ZXN0QXJncyA9IHtcbiAgICB1cmw6IHVybCxcbiAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICBkYXRhOiBkYXRhXG4gIH07XG5cbiAgdmFyIHJlcXVlc3QgPSBwbHVnaW5XYWl0KCdwcmVTdGF0aWNSZXF1ZXN0JywgcmVxdWVzdEFyZ3MpXG4gIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBwbHVnaW5HZXQoJ3N0YXRpY1JlcXVlc3QnLCByZXF1ZXN0QXJncylcbiAgICAudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgIGlmIChyZXN1bHQgPT09IG51bGwgfHwgcmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIEZvcm1pby5yZXF1ZXN0KHVybCwgbWV0aG9kLCBkYXRhKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBwbHVnaW5BbHRlcignd3JhcFN0YXRpY1JlcXVlc3RQcm9taXNlJywgcmVxdWVzdCwgcmVxdWVzdEFyZ3MpO1xufTtcblxuLy8gU3RhdGljIG1ldGhvZHMuXG5Gb3JtaW8ubG9hZFByb2plY3RzID0gZnVuY3Rpb24ocXVlcnkpIHtcbiAgcXVlcnkgPSBxdWVyeSB8fCAnJztcbiAgaWYgKHR5cGVvZiBxdWVyeSA9PT0gJ29iamVjdCcpIHtcbiAgICBxdWVyeSA9ICc/JyArIHNlcmlhbGl6ZShxdWVyeS5wYXJhbXMpO1xuICB9XG4gIHJldHVybiB0aGlzLm1ha2VTdGF0aWNSZXF1ZXN0KGJhc2VVcmwgKyAnL3Byb2plY3QnICsgcXVlcnkpO1xufTtcbkZvcm1pby5yZXF1ZXN0ID0gZnVuY3Rpb24odXJsLCBtZXRob2QsIGRhdGEpIHtcbiAgaWYgKCF1cmwpIHsgcmV0dXJuIFEucmVqZWN0KCdObyB1cmwgcHJvdmlkZWQnKTsgfVxuICBtZXRob2QgPSAobWV0aG9kIHx8ICdHRVQnKS50b1VwcGVyQ2FzZSgpO1xuICB2YXIgY2FjaGVLZXkgPSBidG9hKHVybCk7XG5cbiAgcmV0dXJuIFEoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgIC8vIEdldCB0aGUgY2FjaGVkIHByb21pc2UgdG8gc2F2ZSBtdWx0aXBsZSBsb2Fkcy5cbiAgICBpZiAobWV0aG9kID09PSAnR0VUJyAmJiBjYWNoZS5oYXNPd25Qcm9wZXJ0eShjYWNoZUtleSkpIHtcbiAgICAgIHJldHVybiBjYWNoZVtjYWNoZUtleV07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIFEoKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFNldCB1cCBhbmQgZmV0Y2ggcmVxdWVzdFxuICAgICAgICB2YXIgaGVhZGVycyA9IG5ldyBIZWFkZXJzKHtcbiAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICdDb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD1VVEYtOCdcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciB0b2tlbiA9IEZvcm1pby5nZXRUb2tlbigpO1xuICAgICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgICBoZWFkZXJzLmFwcGVuZCgneC1qd3QtdG9rZW4nLCB0b2tlbik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICAgIG1vZGU6ICdjb3JzJ1xuICAgICAgICB9O1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgIG9wdGlvbnMuYm9keSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZldGNoKHVybCwgb3B0aW9ucyk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBlcnIubWVzc2FnZSA9ICdDb3VsZCBub3QgY29ubmVjdCB0byBBUEkgc2VydmVyICgnICsgZXJyLm1lc3NhZ2UgKyAnKSc7XG4gICAgICAgIGVyci5uZXR3b3JrRXJyb3IgPSB0cnVlO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgLy8gSGFuZGxlIGZldGNoIHJlc3VsdHNcbiAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgdmFyIHRva2VuID0gcmVzcG9uc2UuaGVhZGVycy5nZXQoJ3gtand0LXRva2VuJyk7XG4gICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA+PSAyMDAgJiYgcmVzcG9uc2Uuc3RhdHVzIDwgMzAwICYmIHRva2VuICYmIHRva2VuICE9PSAnJykge1xuICAgICAgICAgICAgRm9ybWlvLnNldFRva2VuKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gMjA0IGlzIG5vIGNvbnRlbnQuIERvbid0IHRyeSB0byAuanNvbigpIGl0LlxuICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDIwNCkge1xuICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gKHJlc3BvbnNlLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKS5pbmRleE9mKCdhcHBsaWNhdGlvbi9qc29uJykgIT09IC0xID9cbiAgICAgICAgICAgIHJlc3BvbnNlLmpzb24oKSA6IHJlc3BvbnNlLnRleHQoKSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgIC8vIEFkZCBzb21lIGNvbnRlbnQtcmFuZ2UgbWV0YWRhdGEgdG8gdGhlIHJlc3VsdCBoZXJlXG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSByZXNwb25zZS5oZWFkZXJzLmdldCgnY29udGVudC1yYW5nZScpO1xuICAgICAgICAgICAgaWYgKHJhbmdlICYmIHR5cGVvZiByZXN1bHQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgIHJhbmdlID0gcmFuZ2Uuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgICAgaWYocmFuZ2VbMF0gIT09ICcqJykge1xuICAgICAgICAgICAgICAgIHZhciBza2lwTGltaXQgPSByYW5nZVswXS5zcGxpdCgnLScpO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5za2lwID0gTnVtYmVyKHNraXBMaW1pdFswXSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmxpbWl0ID0gc2tpcExpbWl0WzFdIC0gc2tpcExpbWl0WzBdICsgMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXN1bHQuc2VydmVyQ291bnQgPSByYW5nZVsxXSA9PT0gJyonID8gcmFuZ2VbMV0gOiBOdW1iZXIocmFuZ2VbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0NDApIHtcbiAgICAgICAgICAgIEZvcm1pby5zZXRUb2tlbihudWxsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUGFyc2UgYW5kIHJldHVybiB0aGUgZXJyb3IgYXMgYSByZWplY3RlZCBwcm9taXNlIHRvIHJlamVjdCB0aGlzIHByb21pc2VcbiAgICAgICAgICByZXR1cm4gKHJlc3BvbnNlLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKS5pbmRleE9mKCdhcHBsaWNhdGlvbi9qc29uJykgIT09IC0xID9cbiAgICAgICAgICAgIHJlc3BvbnNlLmpzb24oKSA6IHJlc3BvbnNlLnRleHQoKSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgLy8gUmVtb3ZlIGZhaWxlZCBwcm9taXNlcyBmcm9tIGNhY2hlXG4gICAgICAgIGRlbGV0ZSBjYWNoZVtjYWNoZUtleV07XG4gICAgICAgIC8vIFByb3BhZ2F0ZSBlcnJvciBzbyBjbGllbnQgY2FuIGhhbmRsZSBhY2NvcmRpbmdseVxuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pXG4gIC50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgIC8vIFNhdmUgdGhlIGNhY2hlXG4gICAgaWYgKG1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgIGNhY2hlW2NhY2hlS2V5XSA9IFEocmVzdWx0KTtcbiAgICB9XG5cbiAgICAvLyBTaGFsbG93IGNvcHkgcmVzdWx0IHNvIG1vZGlmaWNhdGlvbnMgZG9uJ3QgZW5kIHVwIGluIGNhY2hlXG4gICAgaWYoQXJyYXkuaXNBcnJheShyZXN1bHQpKSB7XG4gICAgICB2YXIgcmVzdWx0Q29weSA9IHJlc3VsdC5tYXAoY29weSk7XG4gICAgICByZXN1bHRDb3B5LnNraXAgPSByZXN1bHQuc2tpcDtcbiAgICAgIHJlc3VsdENvcHkubGltaXQgPSByZXN1bHQubGltaXQ7XG4gICAgICByZXN1bHRDb3B5LnNlcnZlckNvdW50ID0gcmVzdWx0LnNlcnZlckNvdW50O1xuICAgICAgcmV0dXJuIHJlc3VsdENvcHk7XG4gICAgfVxuICAgIHJldHVybiBjb3B5KHJlc3VsdCk7XG4gIH0pO1xufTtcblxuRm9ybWlvLnNldFRva2VuID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgdG9rZW4gPSB0b2tlbiB8fCAnJztcbiAgaWYgKHRva2VuID09PSB0aGlzLnRva2VuKSB7IHJldHVybjsgfVxuICB0aGlzLnRva2VuID0gdG9rZW47XG4gIGlmICghdG9rZW4pIHtcbiAgICBGb3JtaW8uc2V0VXNlcihudWxsKTtcbiAgICByZXR1cm4gbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2Zvcm1pb1Rva2VuJyk7XG4gIH1cbiAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2Zvcm1pb1Rva2VuJywgdG9rZW4pO1xuICBGb3JtaW8uY3VycmVudFVzZXIoKTsgLy8gUnVuIHRoaXMgc28gdXNlciBpcyB1cGRhdGVkIGlmIG51bGxcbn07XG5Gb3JtaW8uZ2V0VG9rZW4gPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMudG9rZW4pIHsgcmV0dXJuIHRoaXMudG9rZW47IH1cbiAgdmFyIHRva2VuID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2Zvcm1pb1Rva2VuJykgfHwgJyc7XG4gIHRoaXMudG9rZW4gPSB0b2tlbjtcbiAgcmV0dXJuIHRva2VuO1xufTtcbkZvcm1pby5zZXRVc2VyID0gZnVuY3Rpb24odXNlcikge1xuICBpZiAoIXVzZXIpIHtcbiAgICB0aGlzLnNldFRva2VuKG51bGwpO1xuICAgIHJldHVybiBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZm9ybWlvVXNlcicpO1xuICB9XG4gIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdmb3JtaW9Vc2VyJywgSlNPTi5zdHJpbmdpZnkodXNlcikpO1xufTtcbkZvcm1pby5nZXRVc2VyID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdmb3JtaW9Vc2VyJykgfHwgbnVsbCk7XG59O1xuXG5Gb3JtaW8uc2V0QmFzZVVybCA9IGZ1bmN0aW9uKHVybCkge1xuICBiYXNlVXJsID0gdXJsO1xufTtcbkZvcm1pby5nZXRCYXNlVXJsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBiYXNlVXJsO1xufVxuRm9ybWlvLmNsZWFyQ2FjaGUgPSBmdW5jdGlvbigpIHsgY2FjaGUgPSB7fTsgfTtcblxuRm9ybWlvLmN1cnJlbnRVc2VyID0gZnVuY3Rpb24oKSB7XG4gIHZhciB1cmwgPSBiYXNlVXJsICsgJy9jdXJyZW50JztcbiAgdmFyIHVzZXIgPSB0aGlzLmdldFVzZXIoKTtcbiAgaWYgKHVzZXIpIHtcbiAgICByZXR1cm4gcGx1Z2luQWx0ZXIoJ3dyYXBTdGF0aWNSZXF1ZXN0UHJvbWlzZScsIFEodXNlciksIHtcbiAgICAgIHVybDogdXJsLFxuICAgICAgbWV0aG9kOiAnR0VUJ1xuICAgIH0pXG4gIH1cbiAgdmFyIHRva2VuID0gdGhpcy5nZXRUb2tlbigpO1xuICBpZiAoIXRva2VuKSB7XG4gICAgcmV0dXJuIHBsdWdpbkFsdGVyKCd3cmFwU3RhdGljUmVxdWVzdFByb21pc2UnLCBRKG51bGwpLCB7XG4gICAgICB1cmw6IHVybCxcbiAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICB9KVxuICB9XG4gIHJldHVybiB0aGlzLm1ha2VTdGF0aWNSZXF1ZXN0KHVybClcbiAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBGb3JtaW8uc2V0VXNlcihyZXNwb25zZSk7XG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9KTtcbn07XG5cbi8vIEtlZXAgdHJhY2sgb2YgdGhlaXIgbG9nb3V0IGNhbGxiYWNrLlxuRm9ybWlvLmxvZ291dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5tYWtlU3RhdGljUmVxdWVzdChiYXNlVXJsICsgJy9sb2dvdXQnKS5maW5hbGx5KGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0VG9rZW4obnVsbCk7XG4gICAgdGhpcy5zZXRVc2VyKG51bGwpO1xuICAgIEZvcm1pby5jbGVhckNhY2hlKCk7XG4gIH0uYmluZCh0aGlzKSk7XG59O1xuRm9ybWlvLmZpZWxkRGF0YSA9IGZ1bmN0aW9uKGRhdGEsIGNvbXBvbmVudCkge1xuICBpZiAoIWRhdGEpIHsgcmV0dXJuICcnOyB9XG4gIGlmIChjb21wb25lbnQua2V5LmluZGV4T2YoJy4nKSAhPT0gLTEpIHtcbiAgICB2YXIgdmFsdWUgPSBkYXRhO1xuICAgIHZhciBwYXJ0cyA9IGNvbXBvbmVudC5rZXkuc3BsaXQoJy4nKTtcbiAgICB2YXIga2V5ID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAga2V5ID0gcGFydHNbaV07XG5cbiAgICAgIC8vIEhhbmRsZSBuZXN0ZWQgcmVzb3VyY2VzXG4gICAgICBpZiAodmFsdWUuaGFzT3duUHJvcGVydHkoJ19pZCcpKSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWUuZGF0YTtcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJuIGlmIHRoZSBrZXkgaXMgbm90IGZvdW5kIG9uIHRoZSB2YWx1ZS5cbiAgICAgIGlmICghdmFsdWUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIENvbnZlcnQgb2xkIHNpbmdsZSBmaWVsZCBkYXRhIGluIHN1Ym1pc3Npb25zIHRvIG11bHRpcGxlXG4gICAgICBpZiAoa2V5ID09PSBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXSAmJiBjb21wb25lbnQubXVsdGlwbGUgJiYgIUFycmF5LmlzQXJyYXkodmFsdWVba2V5XSkpIHtcbiAgICAgICAgdmFsdWVba2V5XSA9IFt2YWx1ZVtrZXldXTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0IHRoZSB2YWx1ZSBvZiB0aGlzIGtleS5cbiAgICAgIHZhbHVlID0gdmFsdWVba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIENvbnZlcnQgb2xkIHNpbmdsZSBmaWVsZCBkYXRhIGluIHN1Ym1pc3Npb25zIHRvIG11bHRpcGxlXG4gICAgaWYgKGNvbXBvbmVudC5tdWx0aXBsZSAmJiAhQXJyYXkuaXNBcnJheShkYXRhW2NvbXBvbmVudC5rZXldKSkge1xuICAgICAgZGF0YVtjb21wb25lbnQua2V5XSA9IFtkYXRhW2NvbXBvbmVudC5rZXldXTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGFbY29tcG9uZW50LmtleV07XG4gIH1cbn07XG5cbi8qKlxuICogRXZlbnRFbWl0dGVyIGZvciBGb3JtaW8gZXZlbnRzLlxuICogU2VlIE5vZGUuanMgZG9jdW1lbnRhdGlvbiBmb3IgQVBJIGRvY3VtZW50YXRpb246IGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZXZlbnRzLmh0bWxcbiAqL1xuRm9ybWlvLmV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIoe1xuICB3aWxkY2FyZDogZmFsc2UsXG4gIG1heExpc3RlbmVyczogMFxufSk7XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBwbHVnaW4gd2l0aCBGb3JtaW8uanNcbiAqIEBwYXJhbSBwbHVnaW4gVGhlIHBsdWdpbiB0byByZWdpc3Rlci4gU2VlIHBsdWdpbiBkb2N1bWVudGF0aW9uLlxuICogQHBhcmFtIG5hbWUgICBPcHRpb25hbCBuYW1lIHRvIGxhdGVyIHJldHJpZXZlIHBsdWdpbiB3aXRoLlxuICovXG5Gb3JtaW8ucmVnaXN0ZXJQbHVnaW4gPSBmdW5jdGlvbihwbHVnaW4sIG5hbWUpIHtcbiAgcGx1Z2lucy5wdXNoKHBsdWdpbik7XG4gIHBsdWdpbnMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIChiLnByaW9yaXR5IHx8IDApIC0gKGEucHJpb3JpdHkgfHwgMCk7XG4gIH0pO1xuICBwbHVnaW4uX19uYW1lID0gbmFtZTtcbiAgKHBsdWdpbi5pbml0IHx8IG5vb3ApLmNhbGwocGx1Z2luLCBGb3JtaW8pO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBwbHVnaW4gcmVnaXN0ZXJlZCB3aXRoIHRoZSBnaXZlbiBuYW1lLlxuICovXG5Gb3JtaW8uZ2V0UGx1Z2luID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gcGx1Z2lucy5yZWR1Y2UoZnVuY3Rpb24ocmVzdWx0LCBwbHVnaW4pIHtcbiAgICBpZiAocmVzdWx0KSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChwbHVnaW4uX19uYW1lID09PSBuYW1lKSByZXR1cm4gcGx1Z2luO1xuICB9LCBudWxsKTtcbn07XG5cbi8qKlxuICogRGVyZWdpc3RlcnMgYSBwbHVnaW4gd2l0aCBGb3JtaW8uanMuXG4gKiBAcGFyYW0gIHBsdWdpbiBUaGUgaW5zdGFuY2Ugb3IgbmFtZSBvZiB0aGUgcGx1Z2luXG4gKiBAcmV0dXJuIHRydWUgaWYgZGVyZWdpc3RlcmVkLCBmYWxzZSBvdGhlcndpc2VcbiAqL1xuRm9ybWlvLmRlcmVnaXN0ZXJQbHVnaW4gPSBmdW5jdGlvbihwbHVnaW4pIHtcbiAgdmFyIGJlZm9yZUxlbmd0aCA9IHBsdWdpbnMubGVuZ3RoO1xuICBwbHVnaW5zID0gcGx1Z2lucy5maWx0ZXIoZnVuY3Rpb24ocCkge1xuICAgIGlmKHAgIT09IHBsdWdpbiAmJiBwLl9fbmFtZSAhPT0gcGx1Z2luKSByZXR1cm4gdHJ1ZTtcbiAgICAocC5kZXJlZ2lzdGVyIHx8IG5vb3ApLmNhbGwocCwgRm9ybWlvKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xuICByZXR1cm4gYmVmb3JlTGVuZ3RoICE9PSBwbHVnaW5zLmxlbmd0aDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRm9ybWlvO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIC8qanNoaW50IGNhbWVsY2FzZTogZmFsc2UgKi9cbiAgYXBwLmNvbmZpZyhbXG4gICAgJ2Zvcm1pb0NvbXBvbmVudHNQcm92aWRlcicsXG4gICAgZnVuY3Rpb24gKGZvcm1pb0NvbXBvbmVudHNQcm92aWRlcikge1xuICAgICAgZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyLnJlZ2lzdGVyKCdhZGRyZXNzJywge1xuICAgICAgICB0aXRsZTogJ0FkZHJlc3MnLFxuICAgICAgICB0ZW1wbGF0ZTogZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuY29tcG9uZW50Lm11bHRpcGxlID8gJ2Zvcm1pby9jb21wb25lbnRzL2FkZHJlc3MtbXVsdGlwbGUuaHRtbCcgOiAnZm9ybWlvL2NvbXBvbmVudHMvYWRkcmVzcy5odG1sJztcbiAgICAgICAgfSxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKHNldHRpbmdzLCAkc2NvcGUsICRodHRwKSB7XG4gICAgICAgICAgJHNjb3BlLmFkZHJlc3MgPSB7fTtcbiAgICAgICAgICAkc2NvcGUuYWRkcmVzc2VzID0gW107XG4gICAgICAgICAgJHNjb3BlLnJlZnJlc2hBZGRyZXNzID0gZnVuY3Rpb24gKGFkZHJlc3MpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSB7YWRkcmVzczogYWRkcmVzcywgc2Vuc29yOiBmYWxzZX07XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KFxuICAgICAgICAgICAgICAnaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2dlb2NvZGUvanNvbicsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBkaXNhYmxlSldUOiB0cnVlLFxuICAgICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb246IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgIFByYWdtYTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgJ0NhY2hlLUNvbnRyb2wnOiB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuYWRkcmVzc2VzID0gcmVzcG9uc2UuZGF0YS5yZXN1bHRzO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0YWJsZVZpZXc6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgcmV0dXJuIGRhdGEgPyBkYXRhLmZvcm1hdHRlZF9hZGRyZXNzIDogJyc7XG4gICAgICAgIH0sXG4gICAgICAgIGdyb3VwOiAnYWR2YW5jZWQnLFxuICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgIGlucHV0OiB0cnVlLFxuICAgICAgICAgIHRhYmxlVmlldzogdHJ1ZSxcbiAgICAgICAgICBsYWJlbDogJycsXG4gICAgICAgICAga2V5OiAnYWRkcmVzc0ZpZWxkJyxcbiAgICAgICAgICBwbGFjZWhvbGRlcjogJycsXG4gICAgICAgICAgbXVsdGlwbGU6IGZhbHNlLFxuICAgICAgICAgIHByb3RlY3RlZDogZmFsc2UsXG4gICAgICAgICAgdW5pcXVlOiBmYWxzZSxcbiAgICAgICAgICBwZXJzaXN0ZW50OiB0cnVlLFxuICAgICAgICAgIHZhbGlkYXRlOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG4gIGFwcC5ydW4oW1xuICAgICckdGVtcGxhdGVDYWNoZScsXG4gICAgZnVuY3Rpb24gKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICAgICAkdGVtcGxhdGVDYWNoZS5wdXQoJ2Zvcm1pby9jb21wb25lbnRzL2FkZHJlc3MuaHRtbCcsXG4gICAgICAgIFwiPGxhYmVsIG5nLWlmPVxcXCJjb21wb25lbnQubGFiZWxcXFwiIGZvcj1cXFwie3sgY29tcG9uZW50LmtleSB9fVxcXCIgbmctY2xhc3M9XFxcInsnZmllbGQtcmVxdWlyZWQnOiBjb21wb25lbnQudmFsaWRhdGUucmVxdWlyZWR9XFxcIj57eyBjb21wb25lbnQubGFiZWwgfX08L2xhYmVsPlxcbjxzcGFuIG5nLWlmPVxcXCIhY29tcG9uZW50LmxhYmVsICYmIGNvbXBvbmVudC52YWxpZGF0ZS5yZXF1aXJlZFxcXCIgY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tYXN0ZXJpc2sgZm9ybS1jb250cm9sLWZlZWRiYWNrIGZpZWxkLXJlcXVpcmVkLWlubGluZVxcXCIgYXJpYS1oaWRkZW49XFxcInRydWVcXFwiPjwvc3Bhbj5cXG48dWktc2VsZWN0IG5nLW1vZGVsPVxcXCJkYXRhW2NvbXBvbmVudC5rZXldXFxcIiBzYWZlLW11bHRpcGxlLXRvLXNpbmdsZSBuZy1kaXNhYmxlZD1cXFwicmVhZE9ubHlcXFwiIG5nLXJlcXVpcmVkPVxcXCJjb21wb25lbnQudmFsaWRhdGUucmVxdWlyZWRcXFwiIGlkPVxcXCJ7eyBjb21wb25lbnQua2V5IH19XFxcIiB0YWJpbmRleD1cXFwie3sgY29tcG9uZW50LnRhYmluZGV4IHx8IDAgfX1cXFwiIHRoZW1lPVxcXCJib290c3RyYXBcXFwiPlxcbiAgPHVpLXNlbGVjdC1tYXRjaCBwbGFjZWhvbGRlcj1cXFwie3sgY29tcG9uZW50LnBsYWNlaG9sZGVyIH19XFxcIj57eyRpdGVtLmZvcm1hdHRlZF9hZGRyZXNzIHx8ICRzZWxlY3Quc2VsZWN0ZWQuZm9ybWF0dGVkX2FkZHJlc3N9fTwvdWktc2VsZWN0LW1hdGNoPlxcbiAgPHVpLXNlbGVjdC1jaG9pY2VzIHJlcGVhdD1cXFwiYWRkcmVzcyBpbiBhZGRyZXNzZXNcXFwiIHJlZnJlc2g9XFxcInJlZnJlc2hBZGRyZXNzKCRzZWxlY3Quc2VhcmNoKVxcXCIgcmVmcmVzaC1kZWxheT1cXFwiNTAwXFxcIj5cXG4gICAgPGRpdiBuZy1iaW5kLWh0bWw9XFxcImFkZHJlc3MuZm9ybWF0dGVkX2FkZHJlc3MgfCBoaWdobGlnaHQ6ICRzZWxlY3Quc2VhcmNoXFxcIj48L2Rpdj5cXG4gIDwvdWktc2VsZWN0LWNob2ljZXM+XFxuPC91aS1zZWxlY3Q+XFxuXCJcbiAgICAgICk7XG5cbiAgICAgIC8vIENoYW5nZSB0aGUgdWktc2VsZWN0IHRvIHVpLXNlbGVjdCBtdWx0aXBsZS5cbiAgICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudHMvYWRkcmVzcy1tdWx0aXBsZS5odG1sJyxcbiAgICAgICAgJHRlbXBsYXRlQ2FjaGUuZ2V0KCdmb3JtaW8vY29tcG9uZW50cy9hZGRyZXNzLmh0bWwnKS5yZXBsYWNlKCc8dWktc2VsZWN0JywgJzx1aS1zZWxlY3QgbXVsdGlwbGUnKVxuICAgICAgKTtcbiAgICB9XG4gIF0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcHApIHtcblxuICBhcHAuY29uZmlnKFtcbiAgICAnZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyJyxcbiAgICBmdW5jdGlvbiAoZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyKSB7XG4gICAgICBmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIucmVnaXN0ZXIoJ2J1dHRvbicsIHtcbiAgICAgICAgdGl0bGU6ICdCdXR0b24nLFxuICAgICAgICB0ZW1wbGF0ZTogJ2Zvcm1pby9jb21wb25lbnRzL2J1dHRvbi5odG1sJyxcbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICBpbnB1dDogdHJ1ZSxcbiAgICAgICAgICBsYWJlbDogJ1N1Ym1pdCcsXG4gICAgICAgICAgdGFibGVWaWV3OiBmYWxzZSxcbiAgICAgICAgICBrZXk6ICdzdWJtaXQnLFxuICAgICAgICAgIHNpemU6ICdtZCcsXG4gICAgICAgICAgbGVmdEljb246ICcnLFxuICAgICAgICAgIHJpZ2h0SWNvbjogJycsXG4gICAgICAgICAgYmxvY2s6IGZhbHNlLFxuICAgICAgICAgIGFjdGlvbjogJ3N1Ym1pdCcsXG4gICAgICAgICAgZGlzYWJsZU9uSW52YWxpZDogdHJ1ZSxcbiAgICAgICAgICB0aGVtZTogJ3ByaW1hcnknXG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uIChzZXR0aW5ncywgJHNjb3BlKSB7XG4gICAgICAgICAgJHNjb3BlLm9uQ2xpY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoc2V0dGluZ3MuYWN0aW9uKSB7XG4gICAgICAgICAgICAgIGNhc2UgJ3N1Ym1pdCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICBjYXNlICdyZXNldCc6XG4gICAgICAgICAgICAgICAgJHNjb3BlLnJlc2V0Rm9ybSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlICdvYXV0aCc6XG4gICAgICAgICAgICAgICAgaWYgKCRzY29wZS5oYXNPd25Qcm9wZXJ0eSgnZm9ybScpKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIXNldHRpbmdzLm9hdXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zaG93QWxlcnRzKHtcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGFuZ2VyJyxcbiAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnWW91IG11c3QgYXNzaWduIHRoaXMgYnV0dG9uIHRvIGFuIE9BdXRoIGFjdGlvbiBiZWZvcmUgaXQgd2lsbCB3b3JrLidcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLm9hdXRoLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zaG93QWxlcnRzKHtcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGFuZ2VyJyxcbiAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBzZXR0aW5ncy5vYXV0aC5lcnJvclxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAkc2NvcGUub3Blbk9BdXRoKHNldHRpbmdzLm9hdXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgICRzY29wZS5vcGVuT0F1dGggPSBmdW5jdGlvbihzZXR0aW5ncykge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgICAgICAgcmVzcG9uc2VfdHlwZTogJ2NvZGUnLFxuICAgICAgICAgICAgICBjbGllbnRfaWQ6IHNldHRpbmdzLmNsaWVudElkLFxuICAgICAgICAgICAgICByZWRpcmVjdF91cmk6IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gfHwgd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgICBzdGF0ZTogc2V0dGluZ3Muc3RhdGUsXG4gICAgICAgICAgICAgIHNjb3BlOiBzZXR0aW5ncy5zY29wZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIE1ha2UgZGlzcGxheSBvcHRpb25hbC5cbiAgICAgICAgICAgIGlmIChzZXR0aW5ncy5kaXNwbGF5KSB7XG4gICAgICAgICAgICAgIHBhcmFtcy5kaXNwbGF5ID0gc2V0dGluZ3MuZGlzcGxheTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcmFtcyA9IE9iamVjdC5rZXlzKHBhcmFtcykubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgICByZXR1cm4ga2V5ICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtc1trZXldKTtcbiAgICAgICAgICAgIH0pLmpvaW4oJyYnKTtcblxuICAgICAgICAgICAgdmFyIHVybCA9IHNldHRpbmdzLmF1dGhVUkkgKyAnPycgKyBwYXJhbXM7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IG1ha2Ugd2luZG93IG9wdGlvbnMgZnJvbSBvYXV0aCBzZXR0aW5ncywgaGF2ZSBiZXR0ZXIgZGVmYXVsdHNcbiAgICAgICAgICAgIHZhciBwb3B1cCA9IHdpbmRvdy5vcGVuKHVybCwgc2V0dGluZ3MucHJvdmlkZXIsICd3aWR0aD0xMDIwLGhlaWdodD02MTgnKTtcbiAgICAgICAgICAgIHZhciBpbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBwb3B1cEhvc3QgPSBwb3B1cC5sb2NhdGlvbi5ob3N0O1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuICAgICAgICAgICAgICAgIGlmIChwb3B1cCAmJiAhcG9wdXAuY2xvc2VkICYmIHBvcHVwSG9zdCA9PT0gY3VycmVudEhvc3QgJiYgcG9wdXAubG9jYXRpb24uc2VhcmNoKSB7XG4gICAgICAgICAgICAgICAgICBwb3B1cC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHBvcHVwLmxvY2F0aW9uLnNlYXJjaC5zdWJzdHIoMSkuc3BsaXQoJyYnKS5yZWR1Y2UoZnVuY3Rpb24ocGFyYW1zLCBwYXJhbSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3BsaXQgPSBwYXJhbS5zcGxpdCgnPScpO1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXNbc3BsaXRbMF1dID0gc3BsaXRbMV07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgICAgICAgICAgICAgICB9LCB7fSk7XG4gICAgICAgICAgICAgICAgICBpZiAocGFyYW1zLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zaG93QWxlcnRzKHtcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGFuZ2VyJyxcbiAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBwYXJhbXMuZXJyb3JfZGVzY3JpcHRpb24gfHwgcGFyYW1zLmVycm9yXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvLyBUT0RPOiBjaGVjayBmb3IgZXJyb3IgcmVzcG9uc2UgaGVyZVxuICAgICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLnN0YXRlICE9PSBwYXJhbXMuc3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNob3dBbGVydHMoe1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkYW5nZXInLFxuICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdPQXV0aCBzdGF0ZSBkb2VzIG5vdCBtYXRjaC4gUGxlYXNlIHRyeSBsb2dnaW5nIGluIGFnYWluLidcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHZhciBzdWJtaXNzaW9uID0ge2RhdGE6IHt9LCBvYXV0aDoge319O1xuICAgICAgICAgICAgICAgICAgc3VibWlzc2lvbi5vYXV0aFtzZXR0aW5ncy5wcm92aWRlcl0gPSBwYXJhbXM7XG4gICAgICAgICAgICAgICAgICBzdWJtaXNzaW9uLm9hdXRoW3NldHRpbmdzLnByb3ZpZGVyXS5yZWRpcmVjdFVSSSA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gfHwgd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuICAgICAgICAgICAgICAgICAgJHNjb3BlLmZvcm0uc3VibWl0dGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAkc2NvcGUuZm9ybWlvLnNhdmVTdWJtaXNzaW9uKHN1Ym1pc3Npb24pXG4gICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihzdWJtaXNzaW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRyaWdnZXIgdGhlIGZvcm0gc3VibWlzc2lvbi5cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdmb3JtU3VibWlzc2lvbicsIHN1Ym1pc3Npb24pO1xuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2hvd0FsZXJ0cyh7XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2RhbmdlcicsXG4gICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSB8fCBlcnJvclxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmZvcm0uc3VibWl0dGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvci5uYW1lICE9PSAnU2VjdXJpdHlFcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICRzY29wZS5zaG93QWxlcnRzKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2RhbmdlcicsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfHwgZXJyb3JcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoIXBvcHVwIHx8IHBvcHVwLmNsb3NlZCB8fCBwb3B1cC5jbG9zZWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICBdKTtcbiAgYXBwLnJ1bihbXG4gICAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgICBmdW5jdGlvbiAoJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudHMvYnV0dG9uLmh0bWwnLFxuICAgICAgICBcIjxidXR0b24gdHlwZT1cXFwie3tjb21wb25lbnQuYWN0aW9uID09ICdzdWJtaXQnIHx8IGNvbXBvbmVudC5hY3Rpb24gPT0gJ3Jlc2V0JyA/IGNvbXBvbmVudC5hY3Rpb24gOiAnYnV0dG9uJ319XFxcIlxcbm5nLWNsYXNzPVxcXCJ7J2J0bi1ibG9jayc6IGNvbXBvbmVudC5ibG9ja31cXFwiXFxuY2xhc3M9XFxcImJ0biBidG4te3sgY29tcG9uZW50LnRoZW1lIH19IGJ0bi17eyBjb21wb25lbnQuc2l6ZSB9fVxcXCJcXG5uZy1kaXNhYmxlZD1cXFwicmVhZE9ubHkgfHwgZm9ybS5zdWJtaXR0aW5nIHx8IChjb21wb25lbnQuZGlzYWJsZU9uSW52YWxpZCAmJiBmb3JtLiRpbnZhbGlkKVxcXCJcXG50YWJpbmRleD1cXFwie3sgY29tcG9uZW50LnRhYmluZGV4IHx8IDAgfX1cXFwiXFxubmctY2xpY2s9XFxcIm9uQ2xpY2soKVxcXCI+XFxuICA8c3BhbiBuZy1pZj1cXFwiY29tcG9uZW50LmxlZnRJY29uXFxcIiBjbGFzcz1cXFwie3sgY29tcG9uZW50LmxlZnRJY29uIH19XFxcIiBhcmlhLWhpZGRlbj1cXFwidHJ1ZVxcXCI+PC9zcGFuPlxcbiAgPHNwYW4gbmctaWY9XFxcImNvbXBvbmVudC5sZWZ0SWNvbiAmJiBjb21wb25lbnQubGFiZWxcXFwiPiZuYnNwOzwvc3Bhbj57eyBjb21wb25lbnQubGFiZWwgfX08c3BhbiBuZy1pZj1cXFwiY29tcG9uZW50LnJpZ2h0SWNvbiAmJiBjb21wb25lbnQubGFiZWxcXFwiPiZuYnNwOzwvc3Bhbj5cXG4gIDxzcGFuIG5nLWlmPVxcXCJjb21wb25lbnQucmlnaHRJY29uXFxcIiBjbGFzcz1cXFwie3sgY29tcG9uZW50LnJpZ2h0SWNvbiB9fVxcXCIgYXJpYS1oaWRkZW49XFxcInRydWVcXFwiPjwvc3Bhbj5cXG4gICA8aSBuZy1pZj1cXFwiY29tcG9uZW50LmFjdGlvbiA9PSAnc3VibWl0JyAmJiBmb3JtLnN1Ym1pdHRpbmdcXFwiIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLXJlZnJlc2ggZ2x5cGhpY29uLXNwaW5cXFwiPjwvaT5cXG48L2J1dHRvbj5cXG5cIlxuICAgICAgKTtcbiAgICB9XG4gIF0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcHApIHtcblxuICBhcHAuY29uZmlnKFtcbiAgICAnZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyJyxcbiAgICBmdW5jdGlvbiAoZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyKSB7XG4gICAgICBmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIucmVnaXN0ZXIoJ2NoZWNrYm94Jywge1xuICAgICAgICB0aXRsZTogJ0NoZWNrIEJveCcsXG4gICAgICAgIHRlbXBsYXRlOiAnZm9ybWlvL2NvbXBvbmVudHMvY2hlY2tib3guaHRtbCcsXG4gICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgaW5wdXQ6IHRydWUsXG4gICAgICAgICAgaW5wdXRUeXBlOiAnY2hlY2tib3gnLFxuICAgICAgICAgIHRhYmxlVmlldzogdHJ1ZSxcbiAgICAgICAgICAvLyBUaGlzIGhpZGVzIHRoZSBkZWZhdWx0IGxhYmVsIGxheW91dCBzbyB3ZSBjYW4gdXNlIGEgc3BlY2lhbCBpbmxpbmUgbGFiZWxcbiAgICAgICAgICBoaWRlTGFiZWw6IHRydWUsXG4gICAgICAgICAgbGFiZWw6ICcnLFxuICAgICAgICAgIGtleTogJ2NoZWNrYm94RmllbGQnLFxuICAgICAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgICAgICAgcHJvdGVjdGVkOiBmYWxzZSxcbiAgICAgICAgICBwZXJzaXN0ZW50OiB0cnVlLFxuICAgICAgICAgIHZhbGlkYXRlOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG4gIGFwcC5ydW4oW1xuICAgICckdGVtcGxhdGVDYWNoZScsXG4gICAgJ0Zvcm1pb1V0aWxzJyxcbiAgICBmdW5jdGlvbiAoJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudHMvY2hlY2tib3guaHRtbCcsXG4gICAgICAgIFwiPGRpdiBjbGFzcz1cXFwiY2hlY2tib3hcXFwiPlxcbiAgPGxhYmVsIGZvcj1cXFwie3sgY29tcG9uZW50LmtleSB9fVxcXCIgbmctY2xhc3M9XFxcInsnZmllbGQtcmVxdWlyZWQnOiBjb21wb25lbnQudmFsaWRhdGUucmVxdWlyZWR9XFxcIj5cXG4gICAgPGlucHV0IHR5cGU9XFxcInt7IGNvbXBvbmVudC5pbnB1dFR5cGUgfX1cXFwiXFxuICAgIGlkPVxcXCJ7eyBjb21wb25lbnQua2V5IH19XFxcIlxcbiAgICBuYW1lPVxcXCJ7eyBjb21wb25lbnQua2V5IH19XFxcIlxcbiAgICB2YWx1ZT1cXFwie3sgY29tcG9uZW50LmtleSB9fVxcXCJcXG4gICAgdGFiaW5kZXg9XFxcInt7IGNvbXBvbmVudC50YWJpbmRleCB8fCAwIH19XFxcIlxcbiAgICBuZy1kaXNhYmxlZD1cXFwicmVhZE9ubHlcXFwiXFxuICAgIG5nLW1vZGVsPVxcXCJkYXRhW2NvbXBvbmVudC5rZXldXFxcIlxcbiAgICBuZy1yZXF1aXJlZD1cXFwiY29tcG9uZW50LnZhbGlkYXRlLnJlcXVpcmVkXFxcIj5cXG4gICAge3sgY29tcG9uZW50LmxhYmVsIH19XFxuICA8L2xhYmVsPlxcbjwvZGl2PlxcblwiXG4gICAgICApO1xuICAgIH1cbiAgXSk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIGFwcC5jb25maWcoW1xuICAgICdmb3JtaW9Db21wb25lbnRzUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uIChmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIpIHtcbiAgICAgIGZvcm1pb0NvbXBvbmVudHNQcm92aWRlci5yZWdpc3RlcignY29sdW1ucycsIHtcbiAgICAgICAgdGl0bGU6ICdDb2x1bW5zJyxcbiAgICAgICAgdGVtcGxhdGU6ICdmb3JtaW8vY29tcG9uZW50cy9jb2x1bW5zLmh0bWwnLFxuICAgICAgICBncm91cDogJ2xheW91dCcsXG4gICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgaW5wdXQ6IGZhbHNlLFxuICAgICAgICAgIGNvbHVtbnM6IFt7Y29tcG9uZW50czogW119LCB7Y29tcG9uZW50czogW119XVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuICBhcHAucnVuKFtcbiAgICAnJHRlbXBsYXRlQ2FjaGUnLFxuICAgIGZ1bmN0aW9uICgkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgJHRlbXBsYXRlQ2FjaGUucHV0KCdmb3JtaW8vY29tcG9uZW50cy9jb2x1bW5zLmh0bWwnLFxuICAgICAgICBcIjxkaXYgY2xhc3M9XFxcInJvd1xcXCI+XFxuICA8ZGl2IGNsYXNzPVxcXCJjb2wteHMtNlxcXCIgbmctcmVwZWF0PVxcXCJjb2x1bW4gaW4gY29tcG9uZW50LmNvbHVtbnNcXFwiPlxcbiAgICA8Zm9ybWlvLWNvbXBvbmVudCBuZy1yZXBlYXQ9XFxcImNvbXBvbmVudCBpbiBjb2x1bW4uY29tcG9uZW50c1xcXCIgY29tcG9uZW50PVxcXCJjb21wb25lbnRcXFwiIGRhdGE9XFxcImRhdGFcXFwiIGZvcm1pbz1cXFwiZm9ybWlvXFxcIiByZWFkLW9ubHk9XFxcInJlYWRPbmx5XFxcIj48L2Zvcm1pby1jb21wb25lbnQ+XFxuICA8L2Rpdj5cXG48L2Rpdj5cXG5cIlxuICAgICAgKTtcbiAgICB9XG4gIF0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXBwKSB7XG5cbiAgYXBwLnByb3ZpZGVyKCdmb3JtaW9Db21wb25lbnRzJywgZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb21wb25lbnRzID0ge307XG4gICAgdmFyIGdyb3VwcyA9IHtcbiAgICAgIF9fY29tcG9uZW50OiB7XG4gICAgICAgIHRpdGxlOiAnQmFzaWMgQ29tcG9uZW50cydcbiAgICAgIH0sXG4gICAgICBhZHZhbmNlZDoge1xuICAgICAgICB0aXRsZTogJ1NwZWNpYWwgQ29tcG9uZW50cydcbiAgICAgIH0sXG4gICAgICBsYXlvdXQ6IHtcbiAgICAgICAgdGl0bGU6ICdMYXlvdXQgQ29tcG9uZW50cydcbiAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICBhZGRHcm91cDogZnVuY3Rpb24gKG5hbWUsIGdyb3VwKSB7XG4gICAgICAgIGdyb3Vwc1tuYW1lXSA9IGdyb3VwO1xuICAgICAgfSxcbiAgICAgIHJlZ2lzdGVyOiBmdW5jdGlvbiAodHlwZSwgY29tcG9uZW50LCBncm91cCkge1xuICAgICAgICBpZiAoIWNvbXBvbmVudHNbdHlwZV0pIHtcbiAgICAgICAgICBjb21wb25lbnRzW3R5cGVdID0gY29tcG9uZW50O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKGNvbXBvbmVudHNbdHlwZV0sIGNvbXBvbmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXQgdGhlIHR5cGUgZm9yIHRoaXMgY29tcG9uZW50LlxuICAgICAgICBpZiAoIWNvbXBvbmVudHNbdHlwZV0uZ3JvdXApIHtcbiAgICAgICAgICBjb21wb25lbnRzW3R5cGVdLmdyb3VwID0gZ3JvdXAgfHwgJ19fY29tcG9uZW50JztcbiAgICAgICAgfVxuICAgICAgICBjb21wb25lbnRzW3R5cGVdLnNldHRpbmdzLnR5cGUgPSB0eXBlO1xuICAgICAgfSxcbiAgICAgICRnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb21wb25lbnRzOiBjb21wb25lbnRzLFxuICAgICAgICAgIGdyb3VwczogZ3JvdXBzXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG5cbiAgYXBwLmRpcmVjdGl2ZSgnc2FmZU11bHRpcGxlVG9TaW5nbGUnLCBbZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICByZXF1aXJlOiAnbmdNb2RlbCcsXG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgbGluazogZnVuY3Rpb24gKCRzY29wZSwgZWwsIGF0dHJzLCBuZ01vZGVsKSB7XG4gICAgICAgIG5nTW9kZWwuJGZvcm1hdHRlcnMucHVzaChmdW5jdGlvbiAobW9kZWxWYWx1ZSkge1xuICAgICAgICAgIGlmICghJHNjb3BlLmNvbXBvbmVudC5tdWx0aXBsZSAmJiBBcnJheS5pc0FycmF5KG1vZGVsVmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gbW9kZWxWYWx1ZVswXSB8fCAnJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gbW9kZWxWYWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfV0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFwcCkge1xuXG4gIGFwcC5jb25maWcoW1xuICAgICdmb3JtaW9Db21wb25lbnRzUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uKGZvcm1pb0NvbXBvbmVudHNQcm92aWRlcikge1xuICAgICAgZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyLnJlZ2lzdGVyKCdjb250YWluZXInLCB7XG4gICAgICAgIHRpdGxlOiAnQ29udGFpbmVyJyxcbiAgICAgICAgdGVtcGxhdGU6ICdmb3JtaW8vY29tcG9uZW50cy9jb250YWluZXIuaHRtbCcsXG4gICAgICAgIGdyb3VwOiAnbGF5b3V0JyxcbiAgICAgICAgaWNvbjogJ2ZhIGZhLWZvbGRlci1vcGVuJyxcbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICBpbnB1dDogdHJ1ZSxcbiAgICAgICAgICB0cmVlOiB0cnVlLFxuICAgICAgICAgIGNvbXBvbmVudHM6IFtdLFxuICAgICAgICAgIHRhYmxlVmlldzogdHJ1ZSxcbiAgICAgICAgICBsYWJlbDogJycsXG4gICAgICAgICAga2V5OiAnY29udGFpbmVyJyxcbiAgICAgICAgICBwcm90ZWN0ZWQ6IGZhbHNlLFxuICAgICAgICAgIHBlcnNpc3RlbnQ6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICBdKTtcbiAgYXBwLmNvbnRyb2xsZXIoJ2Zvcm1pb0NvbnRhaW5lckNvbXBvbmVudCcsIFtcbiAgICAnJHNjb3BlJyxcbiAgICBmdW5jdGlvbigkc2NvcGUpIHtcbiAgICAgICRzY29wZS5kYXRhWyRzY29wZS5jb21wb25lbnQua2V5XSA9ICRzY29wZS5kYXRhWyRzY29wZS5jb21wb25lbnQua2V5XSB8fCB7fTtcbiAgICAgICRzY29wZS5wYXJlbnRLZXkgPSAkc2NvcGUuY29tcG9uZW50LmtleTtcbiAgICB9XG4gIF0pO1xuICBhcHAucnVuKFtcbiAgICAnJHRlbXBsYXRlQ2FjaGUnLFxuICAgICdGb3JtaW9VdGlscycsXG4gICAgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUsIEZvcm1pb1V0aWxzKSB7XG4gICAgICAkdGVtcGxhdGVDYWNoZS5wdXQoJ2Zvcm1pby9jb21wb25lbnRzL2NvbnRhaW5lci5odG1sJywgRm9ybWlvVXRpbHMuZmllbGRXcmFwKFxuICAgICAgICBcIjxkaXYgbmctY29udHJvbGxlcj1cXFwiZm9ybWlvQ29udGFpbmVyQ29tcG9uZW50XFxcIiBjbGFzcz1cXFwiZm9ybWlvLWNvbnRhaW5lci1jb21wb25lbnRcXFwiPlxcbiAgPGZvcm1pby1jb21wb25lbnQgbmctcmVwZWF0PVxcXCJjb21wb25lbnQgaW4gY29tcG9uZW50LmNvbXBvbmVudHNcXFwiIGNvbXBvbmVudD1cXFwiY29tcG9uZW50XFxcIiBkYXRhPVxcXCJkYXRhW3BhcmVudEtleV1cXFwiIGZvcm1pbz1cXFwiZm9ybWlvXFxcIiByZWFkLW9ubHk9XFxcInJlYWRPbmx5XFxcIj48L2Zvcm1pby1jb21wb25lbnQ+XFxuPC9kaXY+XFxuXCJcbiAgICAgICkpO1xuICAgIH1cbiAgXSk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIGFwcC5jb25maWcoW1xuICAgICdmb3JtaW9Db21wb25lbnRzUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uIChmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIpIHtcbiAgICAgIGZvcm1pb0NvbXBvbmVudHNQcm92aWRlci5yZWdpc3RlcignY29udGVudCcsIHtcbiAgICAgICAgdGl0bGU6ICdDb250ZW50JyxcbiAgICAgICAgdGVtcGxhdGU6ICdmb3JtaW8vY29tcG9uZW50cy9jb250ZW50Lmh0bWwnLFxuICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgIGlucHV0OiBmYWxzZSxcbiAgICAgICAgICBodG1sOiAnJ1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuICBhcHAucnVuKFtcbiAgICAnJHRlbXBsYXRlQ2FjaGUnLFxuICAgIGZ1bmN0aW9uICgkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgJHRlbXBsYXRlQ2FjaGUucHV0KCdmb3JtaW8vY29tcG9uZW50cy9jb250ZW50Lmh0bWwnLFxuICAgICAgICBcIjxkaXYgbmctYmluZC1odG1sPVxcXCJjb21wb25lbnQuaHRtbCB8IHNhZmVodG1sXFxcIj48L2Rpdj5cXG5cIlxuICAgICAgKTtcbiAgICB9XG4gIF0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcHApIHtcblxuICBhcHAuY29uZmlnKFtcbiAgICAnZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyJyxcbiAgICBmdW5jdGlvbiAoZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyKSB7XG4gICAgICBmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIucmVnaXN0ZXIoJ2N1c3RvbScsIHtcbiAgICAgICAgdGl0bGU6ICdDdXN0b20nLFxuICAgICAgICB0ZW1wbGF0ZTogJ2Zvcm1pby9jb21wb25lbnRzL2N1c3RvbS5odG1sJyxcbiAgICAgICAgZ3JvdXA6ICdhZHZhbmNlZCcsXG4gICAgICAgIHNldHRpbmdzOiB7fVxuICAgICAgfSk7XG4gICAgfVxuICBdKTtcbiAgYXBwLnJ1bihbXG4gICAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgICBmdW5jdGlvbiAoJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudHMvY3VzdG9tLmh0bWwnLFxuICAgICAgICBcIjxkaXYgY2xhc3M9XFxcInBhbmVsIHBhbmVsLWRlZmF1bHRcXFwiPlxcbiAgPGRpdiBjbGFzcz1cXFwicGFuZWwtYm9keSB0ZXh0LW11dGVkIHRleHQtY2VudGVyXFxcIj5cXG4gICAgQ3VzdG9tIENvbXBvbmVudCAoe3sgY29tcG9uZW50LnR5cGUgfX0pXFxuICA8L2Rpdj5cXG48L2Rpdj5cXG5cIlxuICAgICAgKTtcbiAgICB9XG4gIF0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcHApIHtcblxuICBhcHAuY29uZmlnKFtcbiAgICAnZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyJyxcbiAgICBmdW5jdGlvbihmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIpIHtcbiAgICAgIGZvcm1pb0NvbXBvbmVudHNQcm92aWRlci5yZWdpc3RlcignZGF0YWdyaWQnLCB7XG4gICAgICAgIHRpdGxlOiAnRGF0YSBHcmlkJyxcbiAgICAgICAgdGVtcGxhdGU6ICdmb3JtaW8vY29tcG9uZW50cy9kYXRhZ3JpZC5odG1sJyxcbiAgICAgICAgZ3JvdXA6ICdsYXlvdXQnLFxuICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgIGlucHV0OiB0cnVlLFxuICAgICAgICAgIHRyZWU6IHRydWUsXG4gICAgICAgICAgY29tcG9uZW50czogW10sXG4gICAgICAgICAgdGFibGVWaWV3OiB0cnVlLFxuICAgICAgICAgIGxhYmVsOiAnJyxcbiAgICAgICAgICBrZXk6ICdkYXRhZ3JpZCcsXG4gICAgICAgICAgcHJvdGVjdGVkOiBmYWxzZSxcbiAgICAgICAgICBwZXJzaXN0ZW50OiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG4gIGFwcC5jb250cm9sbGVyKCdmb3JtaW9EYXRhR3JpZCcsIFtcbiAgICAnJHNjb3BlJyxcbiAgICBmdW5jdGlvbigkc2NvcGUpIHtcbiAgICAgICRzY29wZS5kYXRhWyRzY29wZS5jb21wb25lbnQua2V5XSA9ICRzY29wZS5kYXRhWyRzY29wZS5jb21wb25lbnQua2V5XSB8fCBbe31dO1xuXG4gICAgICAkc2NvcGUuYWRkUm93ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEVuc3VyZSB0aGUgb2JqZWN0IGlzIGluaXRpYWxpemVkIGFzIGl0IG1heSBiZSB1bnNldCBvbiBhIFwiUmVzZXRcIi5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KCRzY29wZS5kYXRhWyRzY29wZS5jb21wb25lbnQua2V5XSkpIHtcbiAgICAgICAgICAkc2NvcGUuZGF0YVskc2NvcGUuY29tcG9uZW50LmtleV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUuZGF0YVskc2NvcGUuY29tcG9uZW50LmtleV0ucHVzaCh7fSk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUucmVtb3ZlUm93ID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgJHNjb3BlLmRhdGFbJHNjb3BlLmNvbXBvbmVudC5rZXldLnNwbGljZShpbmRleCwgMSk7XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG4gIGFwcC5ydW4oW1xuICAgICckdGVtcGxhdGVDYWNoZScsXG4gICAgJ0Zvcm1pb1V0aWxzJyxcbiAgICBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSwgRm9ybWlvVXRpbHMpIHtcbiAgICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudHMvZGF0YWdyaWQuaHRtbCcsIEZvcm1pb1V0aWxzLmZpZWxkV3JhcChcbiAgICAgICAgXCI8ZGl2IGNsYXNzPVxcXCJmb3JtaW8tZGF0YS1ncmlkXFxcIiBuZy1jb250cm9sbGVyPVxcXCJmb3JtaW9EYXRhR3JpZFxcXCIgPlxcbiAgPHRhYmxlIG5nLWNsYXNzPVxcXCJ7J3RhYmxlLXN0cmlwZWQnOiBjb21wb25lbnQuc3RyaXBlZCwgJ3RhYmxlLWJvcmRlcmVkJzogY29tcG9uZW50LmJvcmRlcmVkLCAndGFibGUtaG92ZXInOiBjb21wb25lbnQuaG92ZXIsICd0YWJsZS1jb25kZW5zZWQnOiBjb21wb25lbnQuY29uZGVuc2VkfVxcXCIgY2xhc3M9XFxcInRhYmxlIGRhdGFncmlkLXRhYmxlXFxcIj5cXG4gICAgPHRyPlxcbiAgICAgIDx0aCBuZy1yZXBlYXQ9XFxcImNvbXBvbmVudCBpbiBjb21wb25lbnQuY29tcG9uZW50c1xcXCI+e3sgY29tcG9uZW50LmxhYmVsfX08L3RoPlxcbiAgICAgIDx0aD48L3RoPlxcbiAgICA8L3RyPlxcbiAgICA8dHIgY2xhc3M9XFxcImZvcm1pby1kYXRhLWdyaWQtcm93XFxcIiBuZy1yZXBlYXQ9XFxcInJvd0RhdGEgaW4gZGF0YVtjb21wb25lbnQua2V5XSB0cmFjayBieSAkaW5kZXhcXFwiPlxcbiAgICAgIDx0ZCBuZy1yZXBlYXQ9XFxcImNvbXBvbmVudCBpbiBjb21wb25lbnQuY29tcG9uZW50c1xcXCIgbmctaW5pdD1cXFwiY29tcG9uZW50LmhpZGVMYWJlbCA9IHRydWVcXFwiID5cXG4gICAgICAgIDxmb3JtaW8tY29tcG9uZW50IGNvbXBvbmVudD1cXFwiY29tcG9uZW50XFxcIiBkYXRhPVxcXCJyb3dEYXRhXFxcIiBmb3JtaW89XFxcImZvcm1pb1xcXCIgcmVhZC1vbmx5PVxcXCJyZWFkT25seVxcXCI+PC9mb3JtaW8tY29tcG9uZW50PlxcbiAgICAgIDwvdGQ+XFxuICAgICAgPHRkPlxcbiAgICAgICAgPGEgbmctY2xpY2s9XFxcInJlbW92ZVJvdygkaW5kZXgpXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0XFxcIj5cXG4gICAgICAgICAgPHNwYW4gY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tcmVtb3ZlLWNpcmNsZVxcXCI+PC9zcGFuPlxcbiAgICAgICAgPC9hPlxcbiAgICAgIDwvdGQ+XFxuICAgIDwvdHI+XFxuICA8L3RhYmxlPlxcbiAgPGRpdiBjbGFzcz1cXFwiZGF0YWdyaWQtYWRkXFxcIj5cXG4gICAgPGEgbmctY2xpY2s9XFxcImFkZFJvdygpXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1wcmltYXJ5XFxcIj5cXG4gICAgICA8c3BhbiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzXFxcIiBhcmlhLWhpZGRlbj1cXFwidHJ1ZVxcXCI+PC9zcGFuPiB7eyBjb21wb25lbnQuYWRkQW5vdGhlciB8fCBcXFwiQWRkIEFub3RoZXJcXFwiIH19XFxuICAgIDwvYT5cXG4gIDwvZGl2PlxcbjwvZGl2PlxcblwiXG4gICAgICApKTtcbiAgICB9XG4gIF0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcHApIHtcblxuICBhcHAuY29uZmlnKFtcbiAgICAnZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyJyxcbiAgICBmdW5jdGlvbihmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIpIHtcbiAgICAgIGZvcm1pb0NvbXBvbmVudHNQcm92aWRlci5yZWdpc3RlcignZGF0ZXRpbWUnLCB7XG4gICAgICAgIHRpdGxlOiAnRGF0ZSAvIFRpbWUnLFxuICAgICAgICB0ZW1wbGF0ZTogJ2Zvcm1pby9jb21wb25lbnRzL2RhdGV0aW1lLmh0bWwnLFxuICAgICAgICB0YWJsZVZpZXc6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICByZXR1cm4gJzxzcGFuPnt7IFwiJyArIGRhdGEgKyAnXCIgfCBkYXRlOiBcIicgKyB0aGlzLnNldHRpbmdzLmZvcm1hdCArICdcIiB9fTwvc3Bhbj4nO1xuICAgICAgICB9LFxuICAgICAgICBncm91cDogJ2FkdmFuY2VkJyxcbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICBpbnB1dDogdHJ1ZSxcbiAgICAgICAgICB0YWJsZVZpZXc6IHRydWUsXG4gICAgICAgICAgbGFiZWw6ICcnLFxuICAgICAgICAgIGtleTogJ2RhdGV0aW1lRmllbGQnLFxuICAgICAgICAgIHBsYWNlaG9sZGVyOiAnJyxcbiAgICAgICAgICBmb3JtYXQ6ICd5eXl5LU1NLWRkIEhIOm1tJyxcbiAgICAgICAgICBlbmFibGVEYXRlOiB0cnVlLFxuICAgICAgICAgIGVuYWJsZVRpbWU6IHRydWUsXG4gICAgICAgICAgbWluRGF0ZTogbnVsbCxcbiAgICAgICAgICBtYXhEYXRlOiBudWxsLFxuICAgICAgICAgIGRhdGVwaWNrZXJNb2RlOiAnZGF5JyxcbiAgICAgICAgICBkYXRlUGlja2VyOiB7XG4gICAgICAgICAgICBzaG93V2Vla3M6IHRydWUsXG4gICAgICAgICAgICBzdGFydGluZ0RheTogMCxcbiAgICAgICAgICAgIGluaXREYXRlOiAnJyxcbiAgICAgICAgICAgIG1pbk1vZGU6ICdkYXknLFxuICAgICAgICAgICAgbWF4TW9kZTogJ3llYXInLFxuICAgICAgICAgICAgeWVhclJhbmdlOiAnMjAnXG4gICAgICAgICAgfSxcbiAgICAgICAgICB0aW1lUGlja2VyOiB7XG4gICAgICAgICAgICBob3VyU3RlcDogMSxcbiAgICAgICAgICAgIG1pbnV0ZVN0ZXA6IDEsXG4gICAgICAgICAgICBzaG93TWVyaWRpYW46IHRydWUsXG4gICAgICAgICAgICByZWFkb25seUlucHV0OiBmYWxzZSxcbiAgICAgICAgICAgIG1vdXNld2hlZWw6IHRydWUsXG4gICAgICAgICAgICBhcnJvd2tleXM6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIHByb3RlY3RlZDogZmFsc2UsXG4gICAgICAgICAgcGVyc2lzdGVudDogdHJ1ZSxcbiAgICAgICAgICB2YWxpZGF0ZToge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgY3VzdG9tOiAnJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICBdKTtcbiAgYXBwLnJ1bihbXG4gICAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgICAnRm9ybWlvVXRpbHMnLFxuICAgIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlLCBGb3JtaW9VdGlscykge1xuICAgICAgJHRlbXBsYXRlQ2FjaGUucHV0KCdmb3JtaW8vY29tcG9uZW50cy9kYXRldGltZS5odG1sJywgRm9ybWlvVXRpbHMuZmllbGRXcmFwKFxuICAgICAgICBcIjxkaXYgY2xhc3M9XFxcImlucHV0LWdyb3VwXFxcIj5cXG4gIDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZm9ybS1jb250cm9sXFxcIlxcbiAgbmctZm9jdXM9XFxcImNhbGVuZGFyT3BlbiA9IHRydWVcXFwiXFxuICBuZy1jbGljaz1cXFwiY2FsZW5kYXJPcGVuID0gdHJ1ZVxcXCJcXG4gIG5nLWluaXQ9XFxcImNhbGVuZGFyT3BlbiA9IGZhbHNlXFxcIlxcbiAgbmctZGlzYWJsZWQ9XFxcInJlYWRPbmx5XFxcIlxcbiAgbmctcmVxdWlyZWQ9XFxcImNvbXBvbmVudC52YWxpZGF0ZS5yZXF1aXJlZFxcXCJcXG4gIGlzLW9wZW49XFxcImNhbGVuZGFyT3BlblxcXCJcXG4gIGRhdGV0aW1lLXBpY2tlcj1cXFwie3sgY29tcG9uZW50LmZvcm1hdCB9fVxcXCJcXG4gIG1pbi1kYXRlPVxcXCJjb21wb25lbnQubWluRGF0ZVxcXCJcXG4gIG1heC1kYXRlPVxcXCJjb21wb25lbnQubWF4RGF0ZVxcXCJcXG4gIGRhdGVwaWNrZXItbW9kZT1cXFwiY29tcG9uZW50LmRhdGVwaWNrZXJNb2RlXFxcIlxcbiAgZW5hYmxlLWRhdGU9XFxcImNvbXBvbmVudC5lbmFibGVEYXRlXFxcIlxcbiAgZW5hYmxlLXRpbWU9XFxcImNvbXBvbmVudC5lbmFibGVUaW1lXFxcIlxcbiAgbmctbW9kZWw9XFxcImRhdGFbY29tcG9uZW50LmtleV1cXFwiXFxuICB0YWJpbmRleD1cXFwie3sgY29tcG9uZW50LnRhYmluZGV4IHx8IDAgfX1cXFwiXFxuICBwbGFjZWhvbGRlcj1cXFwie3sgY29tcG9uZW50LnBsYWNlaG9sZGVyIH19XFxcIlxcbiAgZGF0ZXBpY2tlci1vcHRpb25zPVxcXCJjb21wb25lbnQuZGF0ZVBpY2tlclxcXCJcXG4gIHRpbWVwaWNrZXItb3B0aW9ucz1cXFwiY29tcG9uZW50LnRpbWVQaWNrZXJcXFwiIC8+XFxuICA8c3BhbiBjbGFzcz1cXFwiaW5wdXQtZ3JvdXAtYnRuXFxcIj5cXG4gICAgPGJ1dHRvbiB0eXBlPVxcXCJidXR0b25cXFwiIG5nLWRpc2FibGVkPVxcXCJyZWFkT25seVxcXCIgY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdFxcXCIgbmctY2xpY2s9XFxcImNhbGVuZGFyT3BlbiA9IHRydWVcXFwiPlxcbiAgICAgIDxpIG5nLWlmPVxcXCJjb21wb25lbnQuZW5hYmxlRGF0ZVxcXCIgY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tY2FsZW5kYXJcXFwiPjwvaT5cXG4gICAgICA8aSBuZy1pZj1cXFwiIWNvbXBvbmVudC5lbmFibGVEYXRlXFxcIiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi10aW1lXFxcIj48L2k+XFxuICAgIDwvYnV0dG9uPlxcbiAgPC9zcGFuPlxcbjwvZGl2PlxcblwiXG4gICAgICApKTtcbiAgICB9XG4gIF0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXBwKSB7XG5cbiAgYXBwLmNvbmZpZyhbXG4gICAgJ2Zvcm1pb0NvbXBvbmVudHNQcm92aWRlcicsXG4gICAgZnVuY3Rpb24gKGZvcm1pb0NvbXBvbmVudHNQcm92aWRlcikge1xuICAgICAgZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyLnJlZ2lzdGVyKCdlbWFpbCcsIHtcbiAgICAgICAgdGl0bGU6ICdFbWFpbCcsXG4gICAgICAgIHRlbXBsYXRlOiAnZm9ybWlvL2NvbXBvbmVudHMvdGV4dGZpZWxkLmh0bWwnLFxuICAgICAgICBncm91cDogJ2FkdmFuY2VkJyxcbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICBpbnB1dDogdHJ1ZSxcbiAgICAgICAgICB0YWJsZVZpZXc6IHRydWUsXG4gICAgICAgICAgaW5wdXRUeXBlOiAnZW1haWwnLFxuICAgICAgICAgIGxhYmVsOiAnJyxcbiAgICAgICAgICBrZXk6ICdlbWFpbEZpZWxkJyxcbiAgICAgICAgICBwbGFjZWhvbGRlcjogJycsXG4gICAgICAgICAgcHJlZml4OiAnJyxcbiAgICAgICAgICBzdWZmaXg6ICcnLFxuICAgICAgICAgIGRlZmF1bHRWYWx1ZTogJycsXG4gICAgICAgICAgcHJvdGVjdGVkOiBmYWxzZSxcbiAgICAgICAgICB1bmlxdWU6IGZhbHNlLFxuICAgICAgICAgIHBlcnNpc3RlbnQ6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICBdKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXBwKSB7XG5cbiAgYXBwLmNvbmZpZyhbXG4gICAgJ2Zvcm1pb0NvbXBvbmVudHNQcm92aWRlcicsXG4gICAgZnVuY3Rpb24gKGZvcm1pb0NvbXBvbmVudHNQcm92aWRlcikge1xuICAgICAgZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyLnJlZ2lzdGVyKCdmaWVsZHNldCcsIHtcbiAgICAgICAgdGl0bGU6ICdGaWVsZCBTZXQnLFxuICAgICAgICB0ZW1wbGF0ZTogJ2Zvcm1pby9jb21wb25lbnRzL2ZpZWxkc2V0Lmh0bWwnLFxuICAgICAgICBncm91cDogJ2xheW91dCcsXG4gICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgaW5wdXQ6IGZhbHNlLFxuICAgICAgICAgIHRhYmxlVmlldzogdHJ1ZSxcbiAgICAgICAgICBsZWdlbmQ6ICcnLFxuICAgICAgICAgIGNvbXBvbmVudHM6IFtdXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG4gIGFwcC5ydW4oW1xuICAgICckdGVtcGxhdGVDYWNoZScsXG4gICAgZnVuY3Rpb24gKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICAgICAkdGVtcGxhdGVDYWNoZS5wdXQoJ2Zvcm1pby9jb21wb25lbnRzL2ZpZWxkc2V0Lmh0bWwnLFxuICAgICAgICBcIjxmaWVsZHNldD5cXG4gIDxsZWdlbmQgbmctaWY9XFxcImNvbXBvbmVudC5sZWdlbmRcXFwiPnt7IGNvbXBvbmVudC5sZWdlbmQgfX08L2xlZ2VuZD5cXG4gIDxmb3JtaW8tY29tcG9uZW50IG5nLXJlcGVhdD1cXFwiY29tcG9uZW50IGluIGNvbXBvbmVudC5jb21wb25lbnRzXFxcIiBjb21wb25lbnQ9XFxcImNvbXBvbmVudFxcXCIgZGF0YT1cXFwiZGF0YVxcXCIgZm9ybWlvPVxcXCJmb3JtaW9cXFwiIHJlYWQtb25seT1cXFwicmVhZE9ubHlcXFwiPjwvZm9ybWlvLWNvbXBvbmVudD5cXG48L2ZpZWxkc2V0PlxcblwiXG4gICAgICApO1xuICAgIH1cbiAgXSk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIGFwcC5jb25maWcoW1xuICAgICdmb3JtaW9Db21wb25lbnRzUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uIChmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIpIHtcbiAgICAgIGZvcm1pb0NvbXBvbmVudHNQcm92aWRlci5yZWdpc3RlcignZmlsZScsIHtcbiAgICAgICAgdGl0bGU6ICdGaWxlJyxcbiAgICAgICAgdGVtcGxhdGU6ICdmb3JtaW8vY29tcG9uZW50cy9maWxlLmh0bWwnLFxuICAgICAgICBncm91cDogJ2FkdmFuY2VkJyxcbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICBpbnB1dDogdHJ1ZSxcbiAgICAgICAgICB0YWJsZVZpZXc6IHRydWUsXG4gICAgICAgICAgbGFiZWw6ICcnLFxuICAgICAgICAgIGtleTogJ2ZpbGUnLFxuICAgICAgICAgIHBsYWNlaG9sZGVyOiAnJyxcbiAgICAgICAgICBtdWx0aXBsZTogZmFsc2UsXG4gICAgICAgICAgZGVmYXVsdFZhbHVlOiAnJyxcbiAgICAgICAgICBwcm90ZWN0ZWQ6IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG5cbiAgYXBwLmRpcmVjdGl2ZSgnZm9ybWlvRmlsZUxpc3QnLCBbZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgZmlsZXM6ICc9JyxcbiAgICAgICAgZm9ybTogJz0nLFxuICAgICAgICByZWFkT25seTogJz0nXG4gICAgICB9LFxuICAgICAgdGVtcGxhdGVVcmw6ICdmb3JtaW8vY29tcG9uZW50cy9mb3JtaW8tZmlsZS1saXN0Lmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAnJHNjb3BlJyxcbiAgICAgICAgZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICRzY29wZS5yZW1vdmVGaWxlID0gZnVuY3Rpb24gKGV2ZW50LCBpbmRleCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICRzY29wZS5maWxlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICAkc2NvcGUuZmlsZVNpemUgPSBmdW5jdGlvbiAoYSwgYiwgYywgZCwgZSkge1xuICAgICAgICAgICAgcmV0dXJuIChiID0gTWF0aCwgYyA9IGIubG9nLCBkID0gMTAyNCwgZSA9IGMoYSkgLyBjKGQpIHwgMCwgYSAvIGIucG93KGQsIGUpKS50b0ZpeGVkKDIpICsgJyAnICsgKGUgPyAna01HVFBFWlknWy0tZV0gKyAnQicgOiAnQnl0ZXMnKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICBdXG4gICAgfTtcbiAgfV0pO1xuXG4gIGFwcC5kaXJlY3RpdmUoJ2Zvcm1pb0ZpbGUnLCBbZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgZmlsZTogJz0nLFxuICAgICAgICBmb3JtOiAnPSdcbiAgICAgIH0sXG4gICAgICB0ZW1wbGF0ZTogJzxhIGhyZWY9XCJ7eyBmaWxlLnVybCB9fVwiIG5nLWNsaWNrPVwiZ2V0RmlsZSgkZXZlbnQpXCIgdGFyZ2V0PVwiX2JsYW5rXCI+e3sgZmlsZS5uYW1lIH19PC9hPicsXG4gICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICckc2NvcGUnLFxuICAgICAgICAnRm9ybWlvUGx1Z2lucycsXG4gICAgICAgIGZ1bmN0aW9uIChcbiAgICAgICAgICAkc2NvcGUsXG4gICAgICAgICAgRm9ybWlvUGx1Z2luc1xuICAgICAgICApIHtcbiAgICAgICAgICAkc2NvcGUuZ2V0RmlsZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgIHZhciBwbHVnaW4gPSBGb3JtaW9QbHVnaW5zKCdzdG9yYWdlJywgJHNjb3BlLmZpbGUuc3RvcmFnZSk7XG4gICAgICAgICAgICBpZiAocGx1Z2luKSB7XG4gICAgICAgICAgICAgIHBsdWdpbi5kb3dubG9hZEZpbGUoZXZ0LCAkc2NvcGUuZmlsZSwgJHNjb3BlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICBdXG4gICAgfTtcbiAgfV0pO1xuXG4gIGFwcC5jb250cm9sbGVyKCdmb3JtaW9GaWxlVXBsb2FkJywgW1xuICAgICckc2NvcGUnLFxuICAgICdGb3JtaW9QbHVnaW5zJyxcbiAgICBmdW5jdGlvbihcbiAgICAgICRzY29wZSxcbiAgICAgIEZvcm1pb1BsdWdpbnNcbiAgICApIHtcbiAgICAgICRzY29wZS5maWxlVXBsb2FkcyA9IHt9O1xuXG4gICAgICAkc2NvcGUucmVtb3ZlVXBsb2FkID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgZGVsZXRlICRzY29wZS5maWxlVXBsb2Fkc1tpbmRleF07XG4gICAgICB9O1xuXG4gICAgICAvLyBUaGlzIGZpeGVzIG5ldyBmaWVsZHMgaGF2aW5nIGFuIGVtcHR5IHNwYWNlIGluIHRoZSBhcnJheS5cbiAgICAgIGlmICgkc2NvcGUuZGF0YSAmJiAkc2NvcGUuZGF0YVskc2NvcGUuY29tcG9uZW50LmtleV0gPT09ICcnKSB7XG4gICAgICAgICRzY29wZS5kYXRhWyRzY29wZS5jb21wb25lbnQua2V5XSA9IFtdO1xuICAgICAgfVxuICAgICAgaWYgKCRzY29wZS5kYXRhICYmICRzY29wZS5kYXRhWyRzY29wZS5jb21wb25lbnQua2V5XVswXSA9PT0gJycpIHtcbiAgICAgICAgJHNjb3BlLmRhdGFbJHNjb3BlLmNvbXBvbmVudC5rZXldLnNwbGljZSgwLCAxKTtcbiAgICAgIH1cblxuICAgICAgJHNjb3BlLnVwbG9hZCA9IGZ1bmN0aW9uKGZpbGVzKSB7XG4gICAgICAgIGlmICgkc2NvcGUuY29tcG9uZW50LnN0b3JhZ2UgJiYgZmlsZXMgJiYgZmlsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgdmFyIHBsdWdpbiA9IEZvcm1pb1BsdWdpbnMoJ3N0b3JhZ2UnLCAkc2NvcGUuY29tcG9uZW50LnN0b3JhZ2UpO1xuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChmaWxlcywgZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgICAgaWYgKHBsdWdpbikge1xuICAgICAgICAgICAgICAkc2NvcGUuZmlsZVVwbG9hZHNbZmlsZS5uYW1lXSA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICAgICAgc2l6ZTogZmlsZS5zaXplLFxuICAgICAgICAgICAgICAgIHN0YXR1czogJ2luZm8nLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdTdGFydGluZyB1cGxvYWQnXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIHBsdWdpbi51cGxvYWRGaWxlKGZpbGUsICRzY29wZS5maWxlVXBsb2Fkc1tmaWxlLm5hbWVdLCAkc2NvcGUpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oZmlsZUluZm8pIHtcbiAgICAgICAgICAgICAgICAgIGRlbGV0ZSAkc2NvcGUuZmlsZVVwbG9hZHNbZmlsZS5uYW1lXTtcbiAgICAgICAgICAgICAgICAgIGZpbGVJbmZvLnN0b3JhZ2UgPSAkc2NvcGUuY29tcG9uZW50LnN0b3JhZ2U7XG4gICAgICAgICAgICAgICAgICAkc2NvcGUuZGF0YVskc2NvcGUuY29tcG9uZW50LmtleV0ucHVzaChmaWxlSW5mbyk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgJHNjb3BlLmZpbGVVcGxvYWRzW2ZpbGUubmFtZV0uc3RhdHVzID0gJ2Vycm9yJztcbiAgICAgICAgICAgICAgICAgICRzY29wZS5maWxlVXBsb2Fkc1tmaWxlLm5hbWVdLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgZGVsZXRlICRzY29wZS5maWxlVXBsb2Fkc1tmaWxlLm5hbWVdLnByb2dyZXNzO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICRzY29wZS5maWxlVXBsb2Fkc1tmaWxlLm5hbWVdID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGZpbGUubmFtZSxcbiAgICAgICAgICAgICAgICBzaXplOiBmaWxlLnNpemUsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnZXJyb3InLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdTdG9yYWdlIHBsdWdpbiBub3QgZm91bmQnXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICBdKTtcbiAgYXBwLnJ1bihbXG4gICAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgICBmdW5jdGlvbiAoXG4gICAgICAkdGVtcGxhdGVDYWNoZVxuICAgICkge1xuXG4gICAgICAkdGVtcGxhdGVDYWNoZS5wdXQoJ2Zvcm1pby9jb21wb25lbnRzL2Zvcm1pby1maWxlLWxpc3QuaHRtbCcsXG4gICAgICAgIFwiPHRhYmxlIGNsYXNzPVxcXCJ0YWJsZSB0YWJsZS1zdHJpcGVkIHRhYmxlLWJvcmRlcmVkXFxcIj5cXG4gIDx0aGVhZD5cXG4gICAgPHRyPlxcbiAgICAgIDx0ZCBuZy1pZj1cXFwiIXJlYWRPbmx5XFxcIiBzdHlsZT1cXFwid2lkdGg6MSU7d2hpdGUtc3BhY2U6bm93cmFwO1xcXCI+PC90ZD5cXG4gICAgICA8dGg+RmlsZSBOYW1lPC90aD5cXG4gICAgICA8dGg+U2l6ZTwvdGg+XFxuICAgIDwvdHI+XFxuICA8L3RoZWFkPlxcbiAgPHRib2R5PlxcbiAgICA8dHIgbmctcmVwZWF0PVxcXCJmaWxlIGluIGZpbGVzIHRyYWNrIGJ5ICRpbmRleFxcXCI+XFxuICAgICAgPHRkIG5nLWlmPVxcXCIhcmVhZE9ubHlcXFwiIHN0eWxlPVxcXCJ3aWR0aDoxJTt3aGl0ZS1zcGFjZTpub3dyYXA7XFxcIj48YSBuZy1pZj1cXFwiIXJlYWRPbmx5XFxcIiBocmVmPVxcXCIjXFxcIiBuZy1jbGljaz1cXFwicmVtb3ZlRmlsZSgkZXZlbnQsICRpbmRleClcXFwiIHN0eWxlPVxcXCJwYWRkaW5nOiAycHggNHB4O1xcXCIgY2xhc3M9XFxcImJ0biBidG4tc20gYnRuLWRlZmF1bHRcXFwiPjxzcGFuIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLXJlbW92ZVxcXCI+PC9zcGFuPjwvYT48L3RkPlxcbiAgICAgIDx0ZD48Zm9ybWlvLWZpbGUgZmlsZT1cXFwiZmlsZVxcXCIgZm9ybT1cXFwiZm9ybVxcXCI+PC9mb3JtaW8tZmlsZT48L3RkPlxcbiAgICAgIDx0ZD57eyBmaWxlU2l6ZShmaWxlLnNpemUpIH19PC90ZD5cXG4gICAgPC90cj5cXG4gIDwvdGJvZHk+XFxuPC90YWJsZT5cXG5cIlxuICAgICAgKTtcblxuICAgICAgJHRlbXBsYXRlQ2FjaGUucHV0KCdmb3JtaW8vY29tcG9uZW50cy9maWxlLmh0bWwnLFxuICAgICAgICBcIjxsYWJlbCBuZy1pZj1cXFwiY29tcG9uZW50LmxhYmVsICYmICFjb21wb25lbnQuaGlkZUxhYmVsXFxcIiBmb3I9XFxcInt7IGNvbXBvbmVudC5rZXkgfX1cXFwiIGNsYXNzPVxcXCJjb250cm9sLWxhYmVsXFxcIiBuZy1jbGFzcz1cXFwieydmaWVsZC1yZXF1aXJlZCc6IGNvbXBvbmVudC52YWxpZGF0ZS5yZXF1aXJlZH1cXFwiPnt7IGNvbXBvbmVudC5sYWJlbCB9fTwvbGFiZWw+XFxuPHNwYW4gbmctaWY9XFxcIiFjb21wb25lbnQubGFiZWwgJiYgY29tcG9uZW50LnZhbGlkYXRlLnJlcXVpcmVkXFxcIiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi1hc3RlcmlzayBmb3JtLWNvbnRyb2wtZmVlZGJhY2sgZmllbGQtcmVxdWlyZWQtaW5saW5lXFxcIiBhcmlhLWhpZGRlbj1cXFwidHJ1ZVxcXCI+PC9zcGFuPlxcbjxkaXYgbmctY29udHJvbGxlcj1cXFwiZm9ybWlvRmlsZVVwbG9hZFxcXCI+XFxuICA8Zm9ybWlvLWZpbGUtbGlzdCBmaWxlcz1cXFwiZGF0YVtjb21wb25lbnQua2V5XVxcXCIgZm9ybT1cXFwiZm9ybWlvLmZvcm1VcmxcXFwiPjwvZm9ybWlvLWZpbGUtbGlzdD5cXG4gIDxkaXYgbmctaWY9XFxcIiFyZWFkT25seVxcXCI+XFxuICAgIDxkaXYgbmdmLWRyb3A9XFxcInVwbG9hZCgkZmlsZXMpXFxcIiBjbGFzcz1cXFwiZmlsZVNlbGVjdG9yXFxcIiBuZ2YtZHJhZy1vdmVyLWNsYXNzPVxcXCInZmlsZURyYWdPdmVyJ1xcXCIgbmdmLW11bHRpcGxlPVxcXCJjb21wb25lbnQubXVsdGlwbGVcXFwiPjxzcGFuIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLWNsb3VkLXVwbG9hZFxcXCI+PC9zcGFuPkRyb3AgZmlsZXMgdG8gYXR0YWNoLCBvciA8YSBocmVmPVxcXCIjXFxcIiBuZ2Ytc2VsZWN0PVxcXCJ1cGxvYWQoJGZpbGVzKVxcXCIgdGFiaW5kZXg9XFxcInt7IGNvbXBvbmVudC50YWJpbmRleCB8fCAwIH19XFxcIiBuZ2YtbXVsdGlwbGU9XFxcImNvbXBvbmVudC5tdWx0aXBsZVxcXCI+YnJvd3NlPC9hPi48L2Rpdj5cXG4gICAgPGRpdiBuZy1pZj1cXFwiIWNvbXBvbmVudC5zdG9yYWdlXFxcIiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FybmluZ1xcXCI+Tm8gc3RvcmFnZSBoYXMgYmVlbiBzZXQgZm9yIHRoaXMgZmllbGQuIEZpbGUgdXBsb2FkcyBhcmUgZGlzYWJsZWQgdW50aWwgc3RvcmFnZSBpcyBzZXQgdXAuPC9kaXY+XFxuICAgIDxkaXYgbmdmLW5vLWZpbGUtZHJvcD5GaWxlIERyYWcvRHJvcCBpcyBub3Qgc3VwcG9ydGVkIGZvciB0aGlzIGJyb3dzZXI8L2Rpdj5cXG4gIDwvZGl2PlxcbiAgPGRpdiBuZy1yZXBlYXQ9XFxcImZpbGVVcGxvYWQgaW4gZmlsZVVwbG9hZHMgdHJhY2sgYnkgJGluZGV4XFxcIiBuZy1jbGFzcz1cXFwieydoYXMtZXJyb3InOiBmaWxlVXBsb2FkLnN0YXR1cyA9PT0gJ2Vycm9yJ31cXFwiIGNsYXNzPVxcXCJmaWxlXFxcIj5cXG4gICAgPGRpdiBjbGFzcz1cXFwicm93XFxcIj5cXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJmaWxlTmFtZSBjb250cm9sLWxhYmVsIGNvbC1zbS0xMFxcXCI+e3sgZmlsZVVwbG9hZC5uYW1lIH19IDxzcGFuIG5nLWNsaWNrPVxcXCJyZW1vdmVVcGxvYWQoZmlsZVVwbG9hZC5uYW1lKVxcXCIgY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tcmVtb3ZlXFxcIj48L3NwYW4+PC9kaXY+XFxuICAgICAgPGRpdiBjbGFzcz1cXFwiZmlsZVNpemUgY29udHJvbC1sYWJlbCBjb2wtc20tMiB0ZXh0LXJpZ2h0XFxcIj57eyBmaWxlU2l6ZShmaWxlVXBsb2FkLnNpemUpIH19PC9kaXY+XFxuICAgIDwvZGl2PlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJyb3dcXFwiPlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcImNvbC1zbS0xMlxcXCI+XFxuICAgICAgICA8c3BhbiBuZy1pZj1cXFwiZmlsZVVwbG9hZC5zdGF0dXMgPT09ICdwcm9ncmVzcydcXFwiPlxcbiAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJwcm9ncmVzc1xcXCI+XFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwicHJvZ3Jlc3MtYmFyXFxcIiByb2xlPVxcXCJwcm9ncmVzc2JhclxcXCIgYXJpYS12YWx1ZW5vdz1cXFwie3tmaWxlVXBsb2FkLnByb2dyZXNzfX1cXFwiIGFyaWEtdmFsdWVtaW49XFxcIjBcXFwiIGFyaWEtdmFsdWVtYXg9XFxcIjEwMFxcXCIgc3R5bGU9XFxcIndpZHRoOnt7ZmlsZVVwbG9hZC5wcm9ncmVzc319JVxcXCI+XFxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwic3Itb25seVxcXCI+e3tmaWxlVXBsb2FkLnByb2dyZXNzfX0lIENvbXBsZXRlPC9zcGFuPlxcbiAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgIDwvc3Bhbj5cXG4gICAgICAgIDxkaXYgbmctaWY9XFxcIiFmaWxlVXBsb2FkLnN0YXR1cyAhPT0gJ3Byb2dyZXNzJ1xcXCIgY2xhc3M9XFxcImJnLXt7IGZpbGVVcGxvYWQuc3RhdHVzIH19IGNvbnRyb2wtbGFiZWxcXFwiPnt7IGZpbGVVcGxvYWQubWVzc2FnZSB9fTwvZGl2PlxcbiAgICAgIDwvZGl2PlxcbiAgICA8L2Rpdj5cXG4gIDwvZGl2PlxcbjwvZGl2PlxcblwiXG4gICAgICApO1xuICAgIH1cbiAgXSk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIGFwcC5jb25maWcoW1xuICAgICdmb3JtaW9Db21wb25lbnRzUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uIChmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIpIHtcbiAgICAgIGZvcm1pb0NvbXBvbmVudHNQcm92aWRlci5yZWdpc3RlcignaGlkZGVuJywge1xuICAgICAgICB0aXRsZTogJ0hpZGRlbicsXG4gICAgICAgIHRlbXBsYXRlOiAnZm9ybWlvL2NvbXBvbmVudHMvaGlkZGVuLmh0bWwnLFxuICAgICAgICBncm91cDogJ2FkdmFuY2VkJyxcbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICBpbnB1dDogdHJ1ZSxcbiAgICAgICAgICB0YWJsZVZpZXc6IHRydWUsXG4gICAgICAgICAga2V5OiAnaGlkZGVuRmllbGQnLFxuICAgICAgICAgIGxhYmVsOiAnJyxcbiAgICAgICAgICBwcm90ZWN0ZWQ6IGZhbHNlLFxuICAgICAgICAgIHVuaXF1ZTogZmFsc2UsXG4gICAgICAgICAgcGVyc2lzdGVudDogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuICBhcHAucnVuKFtcbiAgICAnJHRlbXBsYXRlQ2FjaGUnLFxuICAgIGZ1bmN0aW9uICgkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgJHRlbXBsYXRlQ2FjaGUucHV0KCdmb3JtaW8vY29tcG9uZW50cy9oaWRkZW4uaHRtbCcsXG4gICAgICAgIFwiPGlucHV0IHR5cGU9XFxcImhpZGRlblxcXCIgaWQ9XFxcInt7IGNvbXBvbmVudC5rZXkgfX1cXFwiIG5hbWU9XFxcInt7IGNvbXBvbmVudC5rZXkgfX1cXFwiIG5nLW1vZGVsPVxcXCJkYXRhW2NvbXBvbmVudC5rZXldXFxcIj5cXG5cIlxuICAgICAgKTtcbiAgICB9XG4gIF0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcHApIHtcblxuICBhcHAuZGlyZWN0aXZlKCdmb3JtaW9IdG1sRWxlbWVudCcsIFtcbiAgICAnJHNhbml0aXplJyxcbiAgICBmdW5jdGlvbigkc2FuaXRpemUpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgY29tcG9uZW50OiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdmb3JtaW8vY29tcG9uZW50cy9odG1sZWxlbWVudC1kaXJlY3RpdmUuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKCRzY29wZSkge1xuICAgICAgICAgIHZhciBjcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGFuZ3VsYXIuZWxlbWVudChcbiAgICAgICAgICAgICAgJzwnICsgJHNjb3BlLmNvbXBvbmVudC50YWcgKyAnPicgKyAnPC8nICsgJHNjb3BlLmNvbXBvbmVudC50YWcgKyAnPidcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuaHRtbCgkc2NvcGUuY29tcG9uZW50LmNvbnRlbnQpO1xuXG4gICAgICAgICAgICBlbGVtZW50LmF0dHIoJ2NsYXNzJywgJHNjb3BlLmNvbXBvbmVudC5jbGFzc05hbWUpO1xuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKCRzY29wZS5jb21wb25lbnQuYXR0cnMsIGZ1bmN0aW9uKGF0dHIpIHtcbiAgICAgICAgICAgICAgaWYgKCFhdHRyLmF0dHIpIHJldHVybjtcbiAgICAgICAgICAgICAgZWxlbWVudC5hdHRyKGF0dHIuYXR0ciwgYXR0ci52YWx1ZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgJHNjb3BlLmh0bWwgPSAkc2FuaXRpemUoZWxlbWVudC5wcm9wKCdvdXRlckhUTUwnKSk7XG4gICAgICAgICAgICAgICRzY29wZS5wYXJzZUVycm9yID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgLy8gSXNvbGF0ZSB0aGUgbWVzc2FnZSBhbmQgc3RvcmUgaXQuXG4gICAgICAgICAgICAgICRzY29wZS5wYXJzZUVycm9yID0gZXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgLnNwbGl0KCdcXG4nKVswXVxuICAgICAgICAgICAgICAucmVwbGFjZSgnWyRzYW5pdGl6ZTpiYWRwYXJzZV0nLCAnJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgICAgJHNjb3BlLiR3YXRjaCgnY29tcG9uZW50JywgY3JlYXRlRWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gIH1dKTtcblxuICBhcHAuY29uZmlnKFtcbiAgICAnZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyJyxcbiAgICBmdW5jdGlvbiAoZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyKSB7XG4gICAgICBmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIucmVnaXN0ZXIoJ2h0bWxlbGVtZW50Jywge1xuICAgICAgICB0aXRsZTogJ0hUTUwgRWxlbWVudCcsXG4gICAgICAgIHRlbXBsYXRlOiAnZm9ybWlvL2NvbXBvbmVudHMvaHRtbGVsZW1lbnQuaHRtbCcsXG4gICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgaW5wdXQ6IGZhbHNlLFxuICAgICAgICAgIHRhZzogJ3AnLFxuICAgICAgICAgIGF0dHJzOiBbXSxcbiAgICAgICAgICBjbGFzc05hbWU6ICcnLFxuICAgICAgICAgIGNvbnRlbnQ6ICcnXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG5cbiAgYXBwLnJ1bihbXG4gICAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgICBmdW5jdGlvbiAoJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudHMvaHRtbGVsZW1lbnQuaHRtbCcsXG4gICAgICAgICc8Zm9ybWlvLWh0bWwtZWxlbWVudCBjb21wb25lbnQ9XCJjb21wb25lbnRcIj48L2Rpdj4nXG4gICAgICApO1xuXG4gICAgICAkdGVtcGxhdGVDYWNoZS5wdXQoJ2Zvcm1pby9jb21wb25lbnRzL2h0bWxlbGVtZW50LWRpcmVjdGl2ZS5odG1sJyxcbiAgICAgICAgXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuaW5nXFxcIiBuZy1pZj1cXFwicGFyc2VFcnJvclxcXCI+e3sgcGFyc2VFcnJvciB9fTwvZGl2PlxcbjxkaXYgbmctYmluZC1odG1sPVxcXCJodG1sXFxcIj48L2Rpdj5cXG5cIlxuICAgICAgKTtcbiAgICB9XG4gIF0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmb3JtaW8nKTtcblxuLy8gQmFzaWNcbnJlcXVpcmUoJy4vY29tcG9uZW50cycpKGFwcCk7XG5yZXF1aXJlKCcuL3RleHRmaWVsZCcpKGFwcCk7XG5yZXF1aXJlKCcuL251bWJlcicpKGFwcCk7XG5yZXF1aXJlKCcuL3Bhc3N3b3JkJykoYXBwKTtcbnJlcXVpcmUoJy4vdGV4dGFyZWEnKShhcHApO1xucmVxdWlyZSgnLi9jaGVja2JveCcpKGFwcCk7XG5yZXF1aXJlKCcuL3NlbGVjdGJveGVzJykoYXBwKTtcbnJlcXVpcmUoJy4vc2VsZWN0JykoYXBwKTtcbnJlcXVpcmUoJy4vcmFkaW8nKShhcHApO1xucmVxdWlyZSgnLi9odG1sZWxlbWVudCcpKGFwcCk7XG5yZXF1aXJlKCcuL2NvbnRlbnQnKShhcHApO1xucmVxdWlyZSgnLi9idXR0b24nKShhcHApO1xuXG4vLyBTcGVjaWFsXG5yZXF1aXJlKCcuL2VtYWlsJykoYXBwKTtcbnJlcXVpcmUoJy4vcGhvbmVudW1iZXInKShhcHApO1xucmVxdWlyZSgnLi9hZGRyZXNzJykoYXBwKTtcbnJlcXVpcmUoJy4vZGF0ZXRpbWUnKShhcHApO1xucmVxdWlyZSgnLi9oaWRkZW4nKShhcHApO1xucmVxdWlyZSgnLi9yZXNvdXJjZScpKGFwcCk7XG5yZXF1aXJlKCcuL2ZpbGUnKShhcHApO1xucmVxdWlyZSgnLi9zaWduYXR1cmUnKShhcHApO1xucmVxdWlyZSgnLi9jdXN0b20nKShhcHApO1xuXG4vLyBMYXlvdXRcbnJlcXVpcmUoJy4vY29sdW1ucycpKGFwcCk7XG5yZXF1aXJlKCcuL2ZpZWxkc2V0JykoYXBwKTtcbnJlcXVpcmUoJy4vY29udGFpbmVyJykoYXBwKTtcbnJlcXVpcmUoJy4vZGF0YWdyaWQnKShhcHApO1xucmVxdWlyZSgnLi9wYWdlJykoYXBwKTtcbnJlcXVpcmUoJy4vcGFuZWwnKShhcHApO1xucmVxdWlyZSgnLi90YWJsZScpKGFwcCk7XG5yZXF1aXJlKCcuL3dlbGwnKShhcHApO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIGFwcC5jb25maWcoW1xuICAgICdmb3JtaW9Db21wb25lbnRzUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uIChmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIpIHtcbiAgICAgIGZvcm1pb0NvbXBvbmVudHNQcm92aWRlci5yZWdpc3RlcignbnVtYmVyJywge1xuICAgICAgICB0aXRsZTogJ051bWJlcicsXG4gICAgICAgIHRlbXBsYXRlOiAnZm9ybWlvL2NvbXBvbmVudHMvbnVtYmVyLmh0bWwnLFxuICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgIGlucHV0OiB0cnVlLFxuICAgICAgICAgIHRhYmxlVmlldzogdHJ1ZSxcbiAgICAgICAgICBpbnB1dFR5cGU6ICdudW1iZXInLFxuICAgICAgICAgIGxhYmVsOiAnJyxcbiAgICAgICAgICBrZXk6ICdudW1iZXJGaWVsZCcsXG4gICAgICAgICAgcGxhY2Vob2xkZXI6ICcnLFxuICAgICAgICAgIHByZWZpeDogJycsXG4gICAgICAgICAgc3VmZml4OiAnJyxcbiAgICAgICAgICBkZWZhdWx0VmFsdWU6ICcnLFxuICAgICAgICAgIHByb3RlY3RlZDogZmFsc2UsXG4gICAgICAgICAgcGVyc2lzdGVudDogdHJ1ZSxcbiAgICAgICAgICB2YWxpZGF0ZToge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgbWluOiAnJyxcbiAgICAgICAgICAgIG1heDogJycsXG4gICAgICAgICAgICBzdGVwOiAnYW55JyxcbiAgICAgICAgICAgIGludGVnZXI6ICcnLFxuICAgICAgICAgICAgbXVsdGlwbGU6ICcnLFxuICAgICAgICAgICAgY3VzdG9tOiAnJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICBdKTtcbiAgYXBwLnJ1bihbXG4gICAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgICAnRm9ybWlvVXRpbHMnLFxuICAgIGZ1bmN0aW9uICgkdGVtcGxhdGVDYWNoZSxcbiAgICAgICAgICAgICAgRm9ybWlvVXRpbHMpIHtcbiAgICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudHMvbnVtYmVyLmh0bWwnLCBGb3JtaW9VdGlscy5maWVsZFdyYXAoXG4gICAgICAgIFwiPGlucHV0IHR5cGU9XFxcInt7IGNvbXBvbmVudC5pbnB1dFR5cGUgfX1cXFwiXFxuY2xhc3M9XFxcImZvcm0tY29udHJvbFxcXCJcXG5pZD1cXFwie3sgY29tcG9uZW50LmtleSB9fVxcXCJcXG5uYW1lPVxcXCJ7eyBjb21wb25lbnQua2V5IH19XFxcIlxcbnRhYmluZGV4PVxcXCJ7eyBjb21wb25lbnQudGFiaW5kZXggfHwgMCB9fVxcXCJcXG5uZy1tb2RlbD1cXFwiZGF0YVtjb21wb25lbnQua2V5XVxcXCJcXG5uZy1yZXF1aXJlZD1cXFwiY29tcG9uZW50LnZhbGlkYXRlLnJlcXVpcmVkXFxcIlxcbm5nLWRpc2FibGVkPVxcXCJyZWFkT25seVxcXCJcXG5zYWZlLW11bHRpcGxlLXRvLXNpbmdsZVxcbm1pbj1cXFwie3sgY29tcG9uZW50LnZhbGlkYXRlLm1pbiB9fVxcXCJcXG5tYXg9XFxcInt7IGNvbXBvbmVudC52YWxpZGF0ZS5tYXggfX1cXFwiXFxuc3RlcD1cXFwie3sgY29tcG9uZW50LnZhbGlkYXRlLnN0ZXAgfX1cXFwiXFxucGxhY2Vob2xkZXI9XFxcInt7IGNvbXBvbmVudC5wbGFjZWhvbGRlciB9fVxcXCJcXG5jdXN0b20tdmFsaWRhdG9yPVxcXCJjb21wb25lbnQudmFsaWRhdGUuY3VzdG9tXFxcIlxcbnVpLW1hc2s9XFxcInt7IGNvbXBvbmVudC5pbnB1dE1hc2sgfX1cXFwiXFxudWktbWFzay1wbGFjZWhvbGRlcj1cXFwiXFxcIlxcbnVpLW9wdGlvbnM9XFxcInVpTWFza09wdGlvbnNcXFwiXFxuPlxcblwiXG4gICAgICApKTtcbiAgICB9XG4gIF0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcHApIHtcblxuICBhcHAuY29uZmlnKFtcbiAgICAnZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyJyxcbiAgICBmdW5jdGlvbiAoZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyKSB7XG4gICAgICBmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIucmVnaXN0ZXIoJ3BhZ2UnLCB7XG4gICAgICAgIHRlbXBsYXRlOiAnZm9ybWlvL2NvbXBvbmVudHMvcGFnZS5odG1sJyxcbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICBpbnB1dDogZmFsc2UsXG4gICAgICAgICAgY29tcG9uZW50czogW11cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICBdKTtcbiAgYXBwLnJ1bihbXG4gICAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgICBmdW5jdGlvbiAoJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudHMvcGFnZS5odG1sJyxcbiAgICAgICAgXCI8Zm9ybWlvLWNvbXBvbmVudCBuZy1yZXBlYXQ9XFxcImNvbXBvbmVudCBpbiBjb21wb25lbnQuY29tcG9uZW50c1xcXCIgY29tcG9uZW50PVxcXCJjb21wb25lbnRcXFwiIGRhdGE9XFxcImRhdGFcXFwiIGZvcm1pbz1cXFwiZm9ybWlvXFxcIj48L2Zvcm1pby1jb21wb25lbnQ+XFxuXCJcbiAgICAgICk7XG4gICAgfVxuICBdKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXBwKSB7XG5cbiAgYXBwLmNvbmZpZyhbXG4gICAgJ2Zvcm1pb0NvbXBvbmVudHNQcm92aWRlcicsXG4gICAgZnVuY3Rpb24gKGZvcm1pb0NvbXBvbmVudHNQcm92aWRlcikge1xuICAgICAgZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyLnJlZ2lzdGVyKCdwYW5lbCcsIHtcbiAgICAgICAgdGl0bGU6ICdQYW5lbCcsXG4gICAgICAgIHRlbXBsYXRlOiAnZm9ybWlvL2NvbXBvbmVudHMvcGFuZWwuaHRtbCcsXG4gICAgICAgIGdyb3VwOiAnbGF5b3V0JyxcbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICBpbnB1dDogZmFsc2UsXG4gICAgICAgICAgdGl0bGU6ICcnLFxuICAgICAgICAgIHRoZW1lOiAnZGVmYXVsdCcsXG4gICAgICAgICAgY29tcG9uZW50czogW11cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICBdKTtcbiAgYXBwLnJ1bihbXG4gICAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgICBmdW5jdGlvbiAoJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudHMvcGFuZWwuaHRtbCcsXG4gICAgICAgIFwiPGRpdiBjbGFzcz1cXFwicGFuZWwgcGFuZWwte3sgY29tcG9uZW50LnRoZW1lIH19XFxcIj5cXG4gIDxkaXYgbmctaWY9XFxcImNvbXBvbmVudC50aXRsZVxcXCIgY2xhc3M9XFxcInBhbmVsLWhlYWRpbmdcXFwiPlxcbiAgICA8aDMgY2xhc3M9XFxcInBhbmVsLXRpdGxlXFxcIj57eyBjb21wb25lbnQudGl0bGUgfX08L2gzPlxcbiAgPC9kaXY+XFxuICA8ZGl2IGNsYXNzPVxcXCJwYW5lbC1ib2R5XFxcIj5cXG4gICAgPGZvcm1pby1jb21wb25lbnQgbmctcmVwZWF0PVxcXCJjb21wb25lbnQgaW4gY29tcG9uZW50LmNvbXBvbmVudHNcXFwiIGNvbXBvbmVudD1cXFwiY29tcG9uZW50XFxcIiBkYXRhPVxcXCJkYXRhXFxcIiBmb3JtaW89XFxcImZvcm1pb1xcXCIgcmVhZC1vbmx5PVxcXCJyZWFkT25seVxcXCI+PC9mb3JtaW8tY29tcG9uZW50PlxcbiAgPC9kaXY+XFxuPC9kaXY+XFxuXCJcbiAgICAgICk7XG4gICAgfVxuICBdKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIGFwcC5jb25maWcoW1xuICAgICdmb3JtaW9Db21wb25lbnRzUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uIChmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIpIHtcbiAgICAgIGZvcm1pb0NvbXBvbmVudHNQcm92aWRlci5yZWdpc3RlcigncGFzc3dvcmQnLCB7XG4gICAgICAgIHRpdGxlOiAnUGFzc3dvcmQnLFxuICAgICAgICB0ZW1wbGF0ZTogJ2Zvcm1pby9jb21wb25lbnRzL3RleHRmaWVsZC5odG1sJyxcbiAgICAgICAgdGFibGVWaWV3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuICctLS0gUFJPVEVDVEVEIC0tLSc7XG4gICAgICAgIH0sXG4gICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgaW5wdXQ6IHRydWUsXG4gICAgICAgICAgdGFibGVWaWV3OiBmYWxzZSxcbiAgICAgICAgICBpbnB1dFR5cGU6ICdwYXNzd29yZCcsXG4gICAgICAgICAgbGFiZWw6ICcnLFxuICAgICAgICAgIGtleTogJ3Bhc3N3b3JkRmllbGQnLFxuICAgICAgICAgIHBsYWNlaG9sZGVyOiAnJyxcbiAgICAgICAgICBwcmVmaXg6ICcnLFxuICAgICAgICAgIHN1ZmZpeDogJycsXG4gICAgICAgICAgcHJvdGVjdGVkOiB0cnVlLFxuICAgICAgICAgIHBlcnNpc3RlbnQ6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICBdKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIGFwcC5jb25maWcoW1xuICAgICdmb3JtaW9Db21wb25lbnRzUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uIChmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIpIHtcbiAgICAgIGZvcm1pb0NvbXBvbmVudHNQcm92aWRlci5yZWdpc3RlcigncGhvbmVOdW1iZXInLCB7XG4gICAgICAgIHRpdGxlOiAnUGhvbmUgTnVtYmVyJyxcbiAgICAgICAgdGVtcGxhdGU6ICdmb3JtaW8vY29tcG9uZW50cy90ZXh0ZmllbGQuaHRtbCcsXG4gICAgICAgIGdyb3VwOiAnYWR2YW5jZWQnLFxuICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgIGlucHV0OiB0cnVlLFxuICAgICAgICAgIHRhYmxlVmlldzogdHJ1ZSxcbiAgICAgICAgICBpbnB1dE1hc2s6ICcoOTk5KSA5OTktOTk5OScsXG4gICAgICAgICAgbGFiZWw6ICcnLFxuICAgICAgICAgIGtleTogJ3Bob25lbnVtYmVyRmllbGQnLFxuICAgICAgICAgIHBsYWNlaG9sZGVyOiAnJyxcbiAgICAgICAgICBwcmVmaXg6ICcnLFxuICAgICAgICAgIHN1ZmZpeDogJycsXG4gICAgICAgICAgbXVsdGlwbGU6IGZhbHNlLFxuICAgICAgICAgIHByb3RlY3RlZDogZmFsc2UsXG4gICAgICAgICAgdW5pcXVlOiBmYWxzZSxcbiAgICAgICAgICBwZXJzaXN0ZW50OiB0cnVlLFxuICAgICAgICAgIHZhbGlkYXRlOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIGFwcC5jb25maWcoW1xuICAgICdmb3JtaW9Db21wb25lbnRzUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uIChmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIpIHtcbiAgICAgIGZvcm1pb0NvbXBvbmVudHNQcm92aWRlci5yZWdpc3RlcigncmFkaW8nLCB7XG4gICAgICAgIHRpdGxlOiAnUmFkaW8nLFxuICAgICAgICB0ZW1wbGF0ZTogJ2Zvcm1pby9jb21wb25lbnRzL3JhZGlvLmh0bWwnLFxuICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgIGlucHV0OiB0cnVlLFxuICAgICAgICAgIHRhYmxlVmlldzogdHJ1ZSxcbiAgICAgICAgICBpbnB1dFR5cGU6ICdyYWRpbycsXG4gICAgICAgICAgbGFiZWw6ICcnLFxuICAgICAgICAgIGtleTogJ3JhZGlvRmllbGQnLFxuICAgICAgICAgIHZhbHVlczogW10sXG4gICAgICAgICAgZGVmYXVsdFZhbHVlOiAnJyxcbiAgICAgICAgICBwcm90ZWN0ZWQ6IGZhbHNlLFxuICAgICAgICAgIHBlcnNpc3RlbnQ6IHRydWUsXG4gICAgICAgICAgdmFsaWRhdGU6IHtcbiAgICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICAgIGN1c3RvbTogJycsXG4gICAgICAgICAgICBjdXN0b21Qcml2YXRlOiBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICBdKTtcbiAgYXBwLnJ1bihbXG4gICAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgICAnRm9ybWlvVXRpbHMnLFxuICAgIGZ1bmN0aW9uICgkdGVtcGxhdGVDYWNoZSxcbiAgICAgICAgICAgICAgRm9ybWlvVXRpbHMpIHtcbiAgICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudHMvcmFkaW8uaHRtbCcsIEZvcm1pb1V0aWxzLmZpZWxkV3JhcChcbiAgICAgICAgXCI8ZGl2IG5nLWNsYXNzPVxcXCJjb21wb25lbnQuaW5saW5lID8gJ3JhZGlvLWlubGluZScgOiAncmFkaW8nXFxcIiBuZy1yZXBlYXQ9XFxcInYgaW4gY29tcG9uZW50LnZhbHVlcyB0cmFjayBieSAkaW5kZXhcXFwiPlxcbiAgPGxhYmVsIGNsYXNzPVxcXCJjb250cm9sLWxhYmVsXFxcIiBmb3I9XFxcInt7IHYudmFsdWUgfX1cXFwiPlxcbiAgICA8aW5wdXQgdHlwZT1cXFwie3sgY29tcG9uZW50LmlucHV0VHlwZSB9fVxcXCJcXG4gICAgaWQ9XFxcInt7IHYudmFsdWUgfX1cXFwiXFxuICAgIG5hbWU9XFxcInt7IGNvbXBvbmVudC5rZXkgfX1cXFwiXFxuICAgIHZhbHVlPVxcXCJ7eyB2LnZhbHVlIH19XFxcIlxcbiAgICB0YWJpbmRleD1cXFwie3sgY29tcG9uZW50LnRhYmluZGV4IHx8IDAgfX1cXFwiXFxuICAgIG5nLW1vZGVsPVxcXCJkYXRhW2NvbXBvbmVudC5rZXldXFxcIlxcbiAgICBuZy1yZXF1aXJlZD1cXFwiY29tcG9uZW50LnZhbGlkYXRlLnJlcXVpcmVkXFxcIlxcbiAgICBuZy1kaXNhYmxlZD1cXFwicmVhZE9ubHlcXFwiXFxuICAgIGN1c3RvbS12YWxpZGF0b3I9XFxcImNvbXBvbmVudC52YWxpZGF0ZS5jdXN0b21cXFwiPlxcbiAgICB7eyB2LmxhYmVsIH19XFxuICA8L2xhYmVsPlxcbjwvZGl2PlxcblwiXG4gICAgICApKTtcbiAgICB9XG4gIF0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcHApIHtcblxuICBhcHAuY29uZmlnKFtcbiAgICAnZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyJyxcbiAgICBmdW5jdGlvbiAoZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyKSB7XG4gICAgICBmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIucmVnaXN0ZXIoJ3Jlc291cmNlJywge1xuICAgICAgICB0aXRsZTogJ1Jlc291cmNlJyxcbiAgICAgICAgdGFibGVWaWV3OiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgIHJldHVybiBkYXRhID8gZGF0YS5faWQgOiAnJztcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmNvbXBvbmVudC5tdWx0aXBsZSA/ICdmb3JtaW8vY29tcG9uZW50cy9yZXNvdXJjZS1tdWx0aXBsZS5odG1sJyA6ICdmb3JtaW8vY29tcG9uZW50cy9yZXNvdXJjZS5odG1sJztcbiAgICAgICAgfSxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKHNldHRpbmdzLCAkc2NvcGUsICRodHRwLCBGb3JtaW8pIHtcbiAgICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbXMgPSBbXTtcbiAgICAgICAgICBpZiAoc2V0dGluZ3MubXVsdGlwbGUpIHtcbiAgICAgICAgICAgIHNldHRpbmdzLmRlZmF1bHRWYWx1ZSA9IFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc2V0dGluZ3MucmVzb3VyY2UpIHtcbiAgICAgICAgICAgIHZhciBmb3JtaW8gPSBuZXcgRm9ybWlvKCRzY29wZS5mb3JtaW8ucHJvamVjdFVybCArICcvZm9ybS8nICsgc2V0dGluZ3MucmVzb3VyY2UpO1xuICAgICAgICAgICAgJHNjb3BlLnJlZnJlc2hTdWJtaXNzaW9ucyA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgICB2YXIgcGFyYW1zID0gc2V0dGluZ3MucGFyYW1zIHx8IHt9O1xuICAgICAgICAgICAgICAvLyBJZiB0aGV5IHdpc2ggdG8gcmV0dXJuIG9ubHkgc29tZSBmaWVsZHMuXG4gICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5zZWxlY3RGaWVsZHMpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMuc2VsZWN0ID0gc2V0dGluZ3Muc2VsZWN0RmllbGRzO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5zZWFyY2hGaWVsZHMgJiYgaW5wdXQpIHtcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goc2V0dGluZ3Muc2VhcmNoRmllbGRzLCBmdW5jdGlvbiAoZmllbGQsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICBwYXJhbXNbZmllbGRdID0gaW5wdXQ7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gTG9hZCB0aGUgc3VibWlzc2lvbnMuXG4gICAgICAgICAgICAgIGZvcm1pby5sb2FkU3VibWlzc2lvbnMoe1xuICAgICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zXG4gICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN1Ym1pc3Npb25zKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdEl0ZW1zID0gc3VibWlzc2lvbnMgfHwgW107XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgJHNjb3BlLnJlZnJlc2hTdWJtaXNzaW9ucygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZ3JvdXA6ICdhZHZhbmNlZCcsXG4gICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgaW5wdXQ6IHRydWUsXG4gICAgICAgICAgdGFibGVWaWV3OiB0cnVlLFxuICAgICAgICAgIGxhYmVsOiAnJyxcbiAgICAgICAgICBrZXk6ICdyZXNvdXJjZUZpZWxkJyxcbiAgICAgICAgICBwbGFjZWhvbGRlcjogJycsXG4gICAgICAgICAgcmVzb3VyY2U6ICcnLFxuICAgICAgICAgIGRlZmF1bHRWYWx1ZTogJycsXG4gICAgICAgICAgdGVtcGxhdGU6ICc8c3Bhbj57eyBpdGVtLmRhdGEgfX08L3NwYW4+JyxcbiAgICAgICAgICBzZWxlY3RGaWVsZHM6ICcnLFxuICAgICAgICAgIHNlYXJjaEZpZWxkczogJycsXG4gICAgICAgICAgbXVsdGlwbGU6IGZhbHNlLFxuICAgICAgICAgIHByb3RlY3RlZDogZmFsc2UsXG4gICAgICAgICAgcGVyc2lzdGVudDogdHJ1ZSxcbiAgICAgICAgICB2YWxpZGF0ZToge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuXG4gIGFwcC5ydW4oW1xuICAgICckdGVtcGxhdGVDYWNoZScsXG4gICAgZnVuY3Rpb24gKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICAgICAkdGVtcGxhdGVDYWNoZS5wdXQoJ2Zvcm1pby9jb21wb25lbnRzL3Jlc291cmNlLmh0bWwnLFxuICAgICAgICBcIjxsYWJlbCBuZy1pZj1cXFwiY29tcG9uZW50LmxhYmVsXFxcIiBmb3I9XFxcInt7IGNvbXBvbmVudC5rZXkgfX1cXFwiIGNsYXNzPVxcXCJjb250cm9sLWxhYmVsXFxcIiBuZy1jbGFzcz1cXFwieydmaWVsZC1yZXF1aXJlZCc6IGNvbXBvbmVudC52YWxpZGF0ZS5yZXF1aXJlZH1cXFwiPnt7IGNvbXBvbmVudC5sYWJlbCB9fTwvbGFiZWw+XFxuPHNwYW4gbmctaWY9XFxcIiFjb21wb25lbnQubGFiZWwgJiYgY29tcG9uZW50LnZhbGlkYXRlLnJlcXVpcmVkXFxcIiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi1hc3RlcmlzayBmb3JtLWNvbnRyb2wtZmVlZGJhY2sgZmllbGQtcmVxdWlyZWQtaW5saW5lXFxcIiBhcmlhLWhpZGRlbj1cXFwidHJ1ZVxcXCI+PC9zcGFuPlxcbjx1aS1zZWxlY3QgdWktc2VsZWN0LXJlcXVpcmVkIHNhZmUtbXVsdGlwbGUtdG8tc2luZ2xlIHVpLXNlbGVjdC1vcGVuLW9uLWZvY3VzIG5nLW1vZGVsPVxcXCJkYXRhW2NvbXBvbmVudC5rZXldXFxcIiBuZy1kaXNhYmxlZD1cXFwicmVhZE9ubHlcXFwiIG5nLXJlcXVpcmVkPVxcXCJjb21wb25lbnQudmFsaWRhdGUucmVxdWlyZWRcXFwiIGlkPVxcXCJ7eyBjb21wb25lbnQua2V5IH19XFxcIiBuYW1lPVxcXCJ7eyBjb21wb25lbnQua2V5IH19XFxcIiB0aGVtZT1cXFwiYm9vdHN0cmFwXFxcIiB0YWJpbmRleD1cXFwie3sgY29tcG9uZW50LnRhYmluZGV4IHx8IDAgfX1cXFwiPlxcbiAgPHVpLXNlbGVjdC1tYXRjaCBwbGFjZWhvbGRlcj1cXFwie3sgY29tcG9uZW50LnBsYWNlaG9sZGVyIH19XFxcIj5cXG4gICAgPGZvcm1pby1zZWxlY3QtaXRlbSB0ZW1wbGF0ZT1cXFwiY29tcG9uZW50LnRlbXBsYXRlXFxcIiBpdGVtPVxcXCIkaXRlbSB8fCAkc2VsZWN0LnNlbGVjdGVkXFxcIiBzZWxlY3Q9XFxcIiRzZWxlY3RcXFwiPjwvZm9ybWlvLXNlbGVjdC1pdGVtPlxcbiAgPC91aS1zZWxlY3QtbWF0Y2g+XFxuICA8dWktc2VsZWN0LWNob2ljZXMgcmVwZWF0PVxcXCJpdGVtIGluIHNlbGVjdEl0ZW1zIHwgZmlsdGVyOiAkc2VsZWN0LnNlYXJjaFxcXCIgcmVmcmVzaD1cXFwicmVmcmVzaFN1Ym1pc3Npb25zKCRzZWxlY3Quc2VhcmNoKVxcXCIgcmVmcmVzaC1kZWxheT1cXFwiMjUwXFxcIj5cXG4gICAgPGZvcm1pby1zZWxlY3QtaXRlbSB0ZW1wbGF0ZT1cXFwiY29tcG9uZW50LnRlbXBsYXRlXFxcIiBpdGVtPVxcXCJpdGVtXFxcIiBzZWxlY3Q9XFxcIiRzZWxlY3RcXFwiPjwvZm9ybWlvLXNlbGVjdC1pdGVtPlxcbiAgPC91aS1zZWxlY3QtY2hvaWNlcz5cXG48L3VpLXNlbGVjdD5cXG48Zm9ybWlvLWVycm9ycz48L2Zvcm1pby1lcnJvcnM+XFxuXCJcbiAgICAgICk7XG5cbiAgICAgIC8vIENoYW5nZSB0aGUgdWktc2VsZWN0IHRvIHVpLXNlbGVjdCBtdWx0aXBsZS5cbiAgICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudHMvcmVzb3VyY2UtbXVsdGlwbGUuaHRtbCcsXG4gICAgICAgICR0ZW1wbGF0ZUNhY2hlLmdldCgnZm9ybWlvL2NvbXBvbmVudHMvcmVzb3VyY2UuaHRtbCcpLnJlcGxhY2UoJzx1aS1zZWxlY3QnLCAnPHVpLXNlbGVjdCBtdWx0aXBsZScpXG4gICAgICApO1xuICAgIH1cbiAgXSk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIGFwcC5kaXJlY3RpdmUoJ2Zvcm1pb1NlbGVjdEl0ZW0nLCBbXG4gICAgJyRjb21waWxlJyxcbiAgICBmdW5jdGlvbiAoJGNvbXBpbGUpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgdGVtcGxhdGU6ICc9JyxcbiAgICAgICAgICBpdGVtOiAnPScsXG4gICAgICAgICAgc2VsZWN0OiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7XG4gICAgICAgICAgaWYgKHNjb3BlLnRlbXBsYXRlKSB7XG4gICAgICAgICAgICBlbGVtZW50Lmh0bWwoJGNvbXBpbGUoYW5ndWxhci5lbGVtZW50KHNjb3BlLnRlbXBsYXRlKSkoc2NvcGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICBdKTtcblxuICBhcHAuZGlyZWN0aXZlKCd1aVNlbGVjdFJlcXVpcmVkJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICByZXF1aXJlOiAnbmdNb2RlbCcsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBuZ01vZGVsKSB7XG4gICAgICAgIHZhciBvbGRJc0VtcHR5ID0gbmdNb2RlbC4kaXNFbXB0eTtcbiAgICAgICAgbmdNb2RlbC4kaXNFbXB0eSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgIHJldHVybiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSB8fCBvbGRJc0VtcHR5KHZhbHVlKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcblxuLy8gQSBoYWNrIHRvIGhhdmUgdWktc2VsZWN0IG9wZW4gb24gZm9jdXNcbiAgYXBwLmRpcmVjdGl2ZSgndWlTZWxlY3RPcGVuT25Gb2N1cycsIFsnJHRpbWVvdXQnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVxdWlyZTogJ3VpU2VsZWN0JyxcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoJHNjb3BlLCBlbCwgYXR0cnMsIHVpU2VsZWN0KSB7XG4gICAgICAgIHZhciBjbG9zaW5nID0gZmFsc2U7XG5cbiAgICAgICAgYW5ndWxhci5lbGVtZW50KHVpU2VsZWN0LmZvY3Vzc2VyKS5vbignZm9jdXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKCFjbG9zaW5nKSB7XG4gICAgICAgICAgICB1aVNlbGVjdC5hY3RpdmF0ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQmVjYXVzZSB1aS1zZWxlY3QgaW1tZWRpYXRlbHkgZm9jdXNlcyB0aGUgZm9jdXNzZXIgYWZ0ZXIgY2xvc2luZ1xuICAgICAgICAvLyB3ZSBuZWVkIHRvIG5vdCByZS1hY3RpdmF0ZSBhZnRlciBjbG9zaW5nXG4gICAgICAgICRzY29wZS4kb24oJ3VpczpjbG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjbG9zaW5nID0gdHJ1ZTtcbiAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7IC8vIEknbSBzbyBzb3JyeVxuICAgICAgICAgICAgY2xvc2luZyA9IGZhbHNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XSk7XG5cbi8vIENvbmZpZ3VyZSB0aGUgU2VsZWN0IGNvbXBvbmVudC5cbiAgYXBwLmNvbmZpZyhbXG4gICAgJ2Zvcm1pb0NvbXBvbmVudHNQcm92aWRlcicsXG4gICAgZnVuY3Rpb24gKGZvcm1pb0NvbXBvbmVudHNQcm92aWRlcikge1xuICAgICAgZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyLnJlZ2lzdGVyKCdzZWxlY3QnLCB7XG4gICAgICAgIHRpdGxlOiAnU2VsZWN0JyxcbiAgICAgICAgdGVtcGxhdGU6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmNvbXBvbmVudC5tdWx0aXBsZSA/ICdmb3JtaW8vY29tcG9uZW50cy9zZWxlY3QtbXVsdGlwbGUuaHRtbCcgOiAnZm9ybWlvL2NvbXBvbmVudHMvc2VsZWN0Lmh0bWwnO1xuICAgICAgICB9LFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoc2V0dGluZ3MsICRzY29wZSwgJGh0dHAsIEZvcm1pbykge1xuICAgICAgICAgICRzY29wZS5ub3dyYXAgPSB0cnVlO1xuICAgICAgICAgICRzY29wZS5zZWxlY3RJdGVtcyA9IFtdO1xuICAgICAgICAgIHZhciB2YWx1ZVByb3AgPSAkc2NvcGUuY29tcG9uZW50LnZhbHVlUHJvcGVydHk7XG4gICAgICAgICAgJHNjb3BlLmdldFNlbGVjdEl0ZW0gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzZXR0aW5ncy5kYXRhU3JjID09PSAndmFsdWVzJykge1xuICAgICAgICAgICAgICByZXR1cm4gaXRlbS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZVByb3AgPyBpdGVtW3ZhbHVlUHJvcF0gOiBpdGVtO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAoc2V0dGluZ3MubXVsdGlwbGUpIHtcbiAgICAgICAgICAgIHNldHRpbmdzLmRlZmF1bHRWYWx1ZSA9IFtdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgICRzY29wZS5yZWZyZXNoSXRlbXMgPSBhbmd1bGFyLm5vb3A7XG5cbiAgICAgICAgICBzd2l0Y2ggKHNldHRpbmdzLmRhdGFTcmMpIHtcbiAgICAgICAgICAgIGNhc2UgJ3ZhbHVlcyc6XG4gICAgICAgICAgICAgICRzY29wZS5zZWxlY3RJdGVtcyA9IHNldHRpbmdzLmRhdGEudmFsdWVzO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2pzb24nOlxuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RJdGVtcyA9IGFuZ3VsYXIuZnJvbUpzb24oc2V0dGluZ3MuZGF0YS5qc29uKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbXMgPSBbXTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3VybCc6XG4gICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5kYXRhLnVybCkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRpb25zID0ge2NhY2hlOiB0cnVlfTtcbiAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MuZGF0YS51cmwuc3Vic3RyKDAsIDEpID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICAgIHNldHRpbmdzLmRhdGEudXJsID0gRm9ybWlvLmdldEJhc2VVcmwoKSArIHNldHRpbmdzLmRhdGEudXJsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIERpc2FibGUgYXV0aCBmb3Igb3V0Z29pbmcgcmVxdWVzdHMuXG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLmRhdGEudXJsLmluZGV4T2YoRm9ybWlvLmdldEJhc2VVcmwoKSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlSldUOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgIFByYWdtYTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICdDYWNoZS1Db250cm9sJzogdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGxvYWRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICRzY29wZS5yZWZyZXNoSXRlbXMgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IHNldHRpbmdzLmRhdGEudXJsO1xuXG4gICAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3Muc2VhcmNoRmllbGQgJiYgaW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsICs9ICgodXJsLmluZGV4T2YoJz8nKSA9PT0gLTEpID8gJz8nIDogJyYnKSArXG4gICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHNldHRpbmdzLnNlYXJjaEZpZWxkKSArXG4gICAgICAgICAgICAgICAgICAgICAgJz0nICtcbiAgICAgICAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoaW5wdXQpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjsgLy8gU2tpcCBpZiB3ZSd2ZSBsb2FkZWQgYmVmb3JlLCB0byBhdm9pZCBtdWx0aXBsZSByZXF1ZXN0c1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgJGh0dHAuZ2V0KHVybCwgb3B0aW9ucylcbiAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdEl0ZW1zID0gcmVzdWx0LmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICRzY29wZS5yZWZyZXNoSXRlbXMoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICRzY29wZS5zZWxlY3RJdGVtcyA9IFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICBpbnB1dDogdHJ1ZSxcbiAgICAgICAgICB0YWJsZVZpZXc6IHRydWUsXG4gICAgICAgICAgbGFiZWw6ICcnLFxuICAgICAgICAgIGtleTogJ3NlbGVjdEZpZWxkJyxcbiAgICAgICAgICBwbGFjZWhvbGRlcjogJycsXG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgdmFsdWVzOiBbXSxcbiAgICAgICAgICAgIGpzb246ICcnLFxuICAgICAgICAgICAgdXJsOiAnJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZGF0YVNyYzogJ3ZhbHVlcycsXG4gICAgICAgICAgdmFsdWVQcm9wZXJ0eTogJycsXG4gICAgICAgICAgZGVmYXVsdFZhbHVlOiAnJyxcbiAgICAgICAgICB0ZW1wbGF0ZTogJzxzcGFuPnt7IGl0ZW0ubGFiZWwgfX08L3NwYW4+JyxcbiAgICAgICAgICBtdWx0aXBsZTogZmFsc2UsXG4gICAgICAgICAgcHJvdGVjdGVkOiBmYWxzZSxcbiAgICAgICAgICB1bmlxdWU6IGZhbHNlLFxuICAgICAgICAgIHBlcnNpc3RlbnQ6IHRydWUsXG4gICAgICAgICAgdmFsaWRhdGU6IHtcbiAgICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICBdKTtcbiAgYXBwLnJ1bihbXG4gICAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgICBmdW5jdGlvbiAoJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudHMvc2VsZWN0Lmh0bWwnLFxuICAgICAgICBcIjxsYWJlbCBuZy1pZj1cXFwiY29tcG9uZW50LmxhYmVsICYmICFjb21wb25lbnQuaGlkZUxhYmVsXFxcIiAgZm9yPVxcXCJ7eyBjb21wb25lbnQua2V5IH19XFxcIiBjbGFzcz1cXFwiY29udHJvbC1sYWJlbFxcXCIgbmctY2xhc3M9XFxcInsnZmllbGQtcmVxdWlyZWQnOiBjb21wb25lbnQudmFsaWRhdGUucmVxdWlyZWR9XFxcIj57eyBjb21wb25lbnQubGFiZWwgfX08L2xhYmVsPlxcbjxzcGFuIG5nLWlmPVxcXCIhY29tcG9uZW50LmxhYmVsICYmIGNvbXBvbmVudC52YWxpZGF0ZS5yZXF1aXJlZFxcXCIgY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tYXN0ZXJpc2sgZm9ybS1jb250cm9sLWZlZWRiYWNrIGZpZWxkLXJlcXVpcmVkLWlubGluZVxcXCIgYXJpYS1oaWRkZW49XFxcInRydWVcXFwiPjwvc3Bhbj5cXG48dWktc2VsZWN0IHVpLXNlbGVjdC1yZXF1aXJlZCB1aS1zZWxlY3Qtb3Blbi1vbi1mb2N1cyBuZy1tb2RlbD1cXFwiZGF0YVtjb21wb25lbnQua2V5XVxcXCIgc2FmZS1tdWx0aXBsZS10by1zaW5nbGUgbmFtZT1cXFwie3sgY29tcG9uZW50LmtleSB9fVxcXCIgbmctZGlzYWJsZWQ9XFxcInJlYWRPbmx5XFxcIiBuZy1yZXF1aXJlZD1cXFwiY29tcG9uZW50LnZhbGlkYXRlLnJlcXVpcmVkXFxcIiBpZD1cXFwie3sgY29tcG9uZW50LmtleSB9fVxcXCIgdGhlbWU9XFxcImJvb3RzdHJhcFxcXCIgdGFiaW5kZXg9XFxcInt7IGNvbXBvbmVudC50YWJpbmRleCB8fCAwIH19XFxcIj5cXG4gIDx1aS1zZWxlY3QtbWF0Y2ggcGxhY2Vob2xkZXI9XFxcInt7IGNvbXBvbmVudC5wbGFjZWhvbGRlciB9fVxcXCI+XFxuICAgIDxmb3JtaW8tc2VsZWN0LWl0ZW0gdGVtcGxhdGU9XFxcImNvbXBvbmVudC50ZW1wbGF0ZVxcXCIgaXRlbT1cXFwiJGl0ZW0gfHwgJHNlbGVjdC5zZWxlY3RlZFxcXCIgc2VsZWN0PVxcXCIkc2VsZWN0XFxcIj48L2Zvcm1pby1zZWxlY3QtaXRlbT5cXG4gIDwvdWktc2VsZWN0LW1hdGNoPlxcbiAgPHVpLXNlbGVjdC1jaG9pY2VzIHJlcGVhdD1cXFwiZ2V0U2VsZWN0SXRlbShpdGVtKSBhcyBpdGVtIGluIHNlbGVjdEl0ZW1zIHwgZmlsdGVyOiAkc2VsZWN0LnNlYXJjaFxcXCIgcmVmcmVzaD1cXFwicmVmcmVzaEl0ZW1zKCRzZWxlY3Quc2VhcmNoKVxcXCIgcmVmcmVzaC1kZWxheT1cXFwiMjUwXFxcIj5cXG4gICAgPGZvcm1pby1zZWxlY3QtaXRlbSB0ZW1wbGF0ZT1cXFwiY29tcG9uZW50LnRlbXBsYXRlXFxcIiBpdGVtPVxcXCJpdGVtXFxcIiBzZWxlY3Q9XFxcIiRzZWxlY3RcXFwiPjwvZm9ybWlvLXNlbGVjdC1pdGVtPlxcbiAgPC91aS1zZWxlY3QtY2hvaWNlcz5cXG48L3VpLXNlbGVjdD5cXG48Zm9ybWlvLWVycm9ycz48L2Zvcm1pby1lcnJvcnM+XFxuXCJcbiAgICAgICk7XG5cbiAgICAgIC8vIENoYW5nZSB0aGUgdWktc2VsZWN0IHRvIHVpLXNlbGVjdCBtdWx0aXBsZS5cbiAgICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudHMvc2VsZWN0LW11bHRpcGxlLmh0bWwnLFxuICAgICAgICAkdGVtcGxhdGVDYWNoZS5nZXQoJ2Zvcm1pby9jb21wb25lbnRzL3NlbGVjdC5odG1sJykucmVwbGFjZSgnPHVpLXNlbGVjdCcsICc8dWktc2VsZWN0IG11bHRpcGxlJylcbiAgICAgICk7XG4gICAgfVxuICBdKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXBwKSB7XG5cbiAgYXBwLmRpcmVjdGl2ZSgnZm9ybWlvU2VsZWN0Qm94ZXMnLCBbZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgcmVxdWlyZTogJ25nTW9kZWwnLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgY29tcG9uZW50OiAnPScsXG4gICAgICAgIHJlYWRPbmx5OiAnPScsXG4gICAgICAgIG1vZGVsOiAnPW5nTW9kZWwnXG4gICAgICB9LFxuICAgICAgdGVtcGxhdGVVcmw6ICdmb3JtaW8vY29tcG9uZW50cy9zZWxlY3Rib3hlcy1kaXJlY3RpdmUuaHRtbCcsXG4gICAgICBsaW5rOiBmdW5jdGlvbigkc2NvcGUsIGVsLCBhdHRycywgbmdNb2RlbCkge1xuICAgICAgICAvLyBJbml0aWFsaXplIG1vZGVsXG4gICAgICAgIHZhciBtb2RlbCA9IHt9O1xuICAgICAgICBhbmd1bGFyLmZvckVhY2goJHNjb3BlLmNvbXBvbmVudC52YWx1ZXMsIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICBtb2RlbFt2LnZhbHVlXSA9ICEhbmdNb2RlbC4kdmlld1ZhbHVlW3YudmFsdWVdO1xuICAgICAgICB9KTtcbiAgICAgICAgbmdNb2RlbC4kc2V0Vmlld1ZhbHVlKG1vZGVsKTtcbiAgICAgICAgbmdNb2RlbC4kc2V0UHJpc3RpbmUodHJ1ZSk7XG5cbiAgICAgICAgbmdNb2RlbC4kaXNFbXB0eSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHZhbHVlKS5ldmVyeShmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiAhdmFsdWVba2V5XTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudG9nZ2xlQ2hlY2tib3ggPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIHZhciBtb2RlbCA9IGFuZ3VsYXIuY29weShuZ01vZGVsLiR2aWV3VmFsdWUpO1xuICAgICAgICAgIG1vZGVsW3ZhbHVlXSA9ICFtb2RlbFt2YWx1ZV07XG4gICAgICAgICAgbmdNb2RlbC4kc2V0Vmlld1ZhbHVlKG1vZGVsKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICB9XSk7XG5cbiAgYXBwLmNvbmZpZyhbXG4gICAgJ2Zvcm1pb0NvbXBvbmVudHNQcm92aWRlcicsXG4gICAgZnVuY3Rpb24gKGZvcm1pb0NvbXBvbmVudHNQcm92aWRlcikge1xuICAgICAgZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyLnJlZ2lzdGVyKCdzZWxlY3Rib3hlcycsIHtcbiAgICAgICAgdGl0bGU6ICdTZWxlY3QgQm94ZXMnLFxuICAgICAgICB0ZW1wbGF0ZTogJ2Zvcm1pby9jb21wb25lbnRzL3NlbGVjdGJveGVzLmh0bWwnLFxuICAgICAgICB0YWJsZVZpZXc6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgaWYgKCFkYXRhKSByZXR1cm4gJyc7XG5cbiAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoZGF0YSlcbiAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFba2V5XTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5qb2luKCcsICcpO1xuICAgICAgICB9LFxuICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgIGlucHV0OiB0cnVlLFxuICAgICAgICAgIHRhYmxlVmlldzogdHJ1ZSxcbiAgICAgICAgICBsYWJlbDogJycsXG4gICAgICAgICAga2V5OiAnc2VsZWN0Ym94ZXNGaWVsZCcsXG4gICAgICAgICAgdmFsdWVzOiBbXSxcbiAgICAgICAgICBkZWZhdWx0VmFsdWU6IHt9LFxuICAgICAgICAgIGlubGluZTogZmFsc2UsXG4gICAgICAgICAgcHJvdGVjdGVkOiBmYWxzZSxcbiAgICAgICAgICBwZXJzaXN0ZW50OiB0cnVlLFxuICAgICAgICAgIHZhbGlkYXRlOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG5cbiAgYXBwLnJ1bihbXG4gICAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgICAnRm9ybWlvVXRpbHMnLFxuICAgIGZ1bmN0aW9uICgkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgJHRlbXBsYXRlQ2FjaGUucHV0KCdmb3JtaW8vY29tcG9uZW50cy9zZWxlY3Rib3hlcy1kaXJlY3RpdmUuaHRtbCcsXG4gICAgICAgIFwiPGRpdiBjbGFzcz1cXFwic2VsZWN0LWJveGVzXFxcIj5cXG4gIDxkaXYgbmctY2xhc3M9XFxcImNvbXBvbmVudC5pbmxpbmUgPyAnY2hlY2tib3gtaW5saW5lJyA6ICdjaGVja2JveCdcXFwiIG5nLXJlcGVhdD1cXFwidiBpbiBjb21wb25lbnQudmFsdWVzIHRyYWNrIGJ5ICRpbmRleFxcXCI+XFxuICAgIDxsYWJlbCBjbGFzcz1cXFwiY29udHJvbC1sYWJlbFxcXCIgZm9yPVxcXCJ7eyBjb21wb25lbnQua2V5IH19LXt7IHYudmFsdWUgfX1cXFwiPlxcbiAgICAgIDxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCJcXG4gICAgICBpZD1cXFwie3sgY29tcG9uZW50LmtleSB9fS17eyB2LnZhbHVlIH19XFxcIlxcbiAgICAgIG5hbWU9XFxcInt7IGNvbXBvbmVudC5rZXkgfX0te3sgdi52YWx1ZSB9fVxcXCJcXG4gICAgICB2YWx1ZT1cXFwie3sgdi52YWx1ZSB9fVxcXCJcXG4gICAgICB0YWJpbmRleD1cXFwie3sgY29tcG9uZW50LnRhYmluZGV4IHx8IDAgfX1cXFwiXFxuICAgICAgbmctZGlzYWJsZWQ9XFxcInJlYWRPbmx5XFxcIlxcbiAgICAgIG5nLWNsaWNrPVxcXCJ0b2dnbGVDaGVja2JveCh2LnZhbHVlKVxcXCJcXG4gICAgICBuZy1jaGVja2VkPVxcXCJtb2RlbFt2LnZhbHVlXVxcXCJcXG4gICAgICA+XFxuICAgICAge3sgdi5sYWJlbCB9fVxcbiAgICA8L2xhYmVsPlxcbiAgPC9kaXY+XFxuPC9kaXY+XFxuXCJcbiAgICAgICk7XG4gICAgICAkdGVtcGxhdGVDYWNoZS5wdXQoJ2Zvcm1pby9jb21wb25lbnRzL3NlbGVjdGJveGVzLmh0bWwnLFxuICAgICAgICBcIjxsYWJlbCBuZy1pZj1cXFwiY29tcG9uZW50LmxhYmVsXFxcIiBmb3I9XFxcInt7IGNvbXBvbmVudC5rZXkgfX1cXFwiIGNsYXNzPVxcXCJjb250cm9sLWxhYmVsXFxcIiBuZy1jbGFzcz1cXFwieydmaWVsZC1yZXF1aXJlZCc6IGNvbXBvbmVudC52YWxpZGF0ZS5yZXF1aXJlZH1cXFwiPnt7IGNvbXBvbmVudC5sYWJlbCB9fTwvbGFiZWw+XFxuPGZvcm1pby1zZWxlY3QtYm94ZXNcXG4gIG5hbWU9XFxcInt7IGNvbXBvbmVudC5rZXkgfX1cXFwiXFxuICBuZy1tb2RlbD1cXFwiZGF0YVtjb21wb25lbnQua2V5XVxcXCJcXG4gIG5nLW1vZGVsLW9wdGlvbnM9XFxcInthbGxvd0ludmFsaWQ6IHRydWV9XFxcIlxcbiAgY29tcG9uZW50PVxcXCJjb21wb25lbnRcXFwiXFxuICByZWFkLW9ubHk9XFxcInJlYWRPbmx5XFxcIlxcbiAgbmctcmVxdWlyZWQ9XFxcImNvbXBvbmVudC52YWxpZGF0ZS5yZXF1aXJlZFxcXCJcXG4gIGN1c3RvbS12YWxpZGF0b3I9XFxcImNvbXBvbmVudC52YWxpZGF0ZS5jdXN0b21cXFwiXFxuICA+PC9mb3JtaW8tc2VsZWN0LWJveGVzPlxcbjxmb3JtaW8tZXJyb3JzPjwvZm9ybWlvLWVycm9ycz5cXG5cIlxuICAgICAgKTtcbiAgICB9XG4gIF0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcHApIHtcblxuICBhcHAuY29uZmlnKFtcbiAgICAnZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyJyxcbiAgICBmdW5jdGlvbiAoZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyKSB7XG4gICAgICBmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIucmVnaXN0ZXIoJ3NpZ25hdHVyZScsIHtcbiAgICAgICAgdGl0bGU6ICdTaWduYXR1cmUnLFxuICAgICAgICB0ZW1wbGF0ZTogJ2Zvcm1pby9jb21wb25lbnRzL3NpZ25hdHVyZS5odG1sJyxcbiAgICAgICAgdGFibGVWaWV3OiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgIHJldHVybiBkYXRhID8gJ1llcycgOiAnTm8nO1xuICAgICAgICB9LFxuICAgICAgICBncm91cDogJ2FkdmFuY2VkJyxcbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICBpbnB1dDogdHJ1ZSxcbiAgICAgICAgICB0YWJsZVZpZXc6IHRydWUsXG4gICAgICAgICAgbGFiZWw6ICcnLFxuICAgICAgICAgIGtleTogJ3NpZ25hdHVyZScsXG4gICAgICAgICAgcGxhY2Vob2xkZXI6ICcnLFxuICAgICAgICAgIGZvb3RlcjogJ1NpZ24gYWJvdmUnLFxuICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgaGVpZ2h0OiAnMTUwJyxcbiAgICAgICAgICBwZW5Db2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdyZ2IoMjQ1LDI0NSwyMzUpJyxcbiAgICAgICAgICBtaW5XaWR0aDogJzAuNScsXG4gICAgICAgICAgbWF4V2lkdGg6ICcyLjUnLFxuICAgICAgICAgIHByb3RlY3RlZDogZmFsc2UsXG4gICAgICAgICAgcGVyc2lzdGVudDogdHJ1ZSxcbiAgICAgICAgICB2YWxpZGF0ZToge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuICBhcHAuZGlyZWN0aXZlKCdzaWduYXR1cmUnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBzY29wZToge1xuICAgICAgICBjb21wb25lbnQ6ICc9J1xuICAgICAgfSxcbiAgICAgIHJlcXVpcmU6ICc/bmdNb2RlbCcsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBuZ01vZGVsKSB7XG4gICAgICAgIGlmICghbmdNb2RlbCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldHMgdGhlIGxhYmVsIG9mIGNvbXBvbmVudCBmb3IgZXJyb3IgZGlzcGxheS5cbiAgICAgICAgc2NvcGUuY29tcG9uZW50LmxhYmVsID0gJ1NpZ25hdHVyZSc7XG4gICAgICAgIHNjb3BlLmNvbXBvbmVudC5oaWRlTGFiZWwgPSB0cnVlO1xuXG4gICAgICAgIC8vIFNldHMgdGhlIGRpbWVuc2lvbiBvZiBhIHdpZHRoIG9yIGhlaWdodC5cbiAgICAgICAgdmFyIHNldERpbWVuc2lvbiA9IGZ1bmN0aW9uIChkaW0pIHtcbiAgICAgICAgICBpZiAoc2NvcGUuY29tcG9uZW50W2RpbV0uc2xpY2UoLTEpID09PSAnJScpIHtcbiAgICAgICAgICAgIHZhciBwZXJjZW50ID0gcGFyc2VGbG9hdChzY29wZS5jb21wb25lbnRbZGltXS5zbGljZSgwLCAtMSkpIC8gMTAwO1xuICAgICAgICAgICAgZWxlbWVudFswXVtkaW1dID0gZWxlbWVudC5wYXJlbnQoKVtkaW1dKCkgKiBwZXJjZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnRbMF1bZGltXSA9IHBhcnNlSW50KHNjb3BlLmNvbXBvbmVudFtkaW1dLCAxMCk7XG4gICAgICAgICAgICBzY29wZS5jb21wb25lbnRbZGltXSA9IGVsZW1lbnRbMF1bZGltXSArICdweCc7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFNldCB0aGUgd2lkdGggYW5kIGhlaWdodCBvZiB0aGUgY2FudmFzLlxuICAgICAgICBzZXREaW1lbnNpb24oJ3dpZHRoJyk7XG4gICAgICAgIHNldERpbWVuc2lvbignaGVpZ2h0Jyk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBzaWduYXR1cmUgcGFkLlxuICAgICAgICAvKiBnbG9iYWwgU2lnbmF0dXJlUGFkOmZhbHNlICovXG4gICAgICAgIHZhciBzaWduYXR1cmVQYWQgPSBuZXcgU2lnbmF0dXJlUGFkKGVsZW1lbnRbMF0sIHtcbiAgICAgICAgICBtaW5XaWR0aDogc2NvcGUuY29tcG9uZW50Lm1pbldpZHRoLFxuICAgICAgICAgIG1heFdpZHRoOiBzY29wZS5jb21wb25lbnQubWF4V2lkdGgsXG4gICAgICAgICAgcGVuQ29sb3I6IHNjb3BlLmNvbXBvbmVudC5wZW5Db2xvcixcbiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHNjb3BlLmNvbXBvbmVudC5iYWNrZ3JvdW5kQ29sb3JcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2NvcGUuJHdhdGNoKCdjb21wb25lbnQucGVuQ29sb3InLCBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICBzaWduYXR1cmVQYWQucGVuQ29sb3IgPSBuZXdWYWx1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2NvcGUuJHdhdGNoKCdjb21wb25lbnQuYmFja2dyb3VuZENvbG9yJywgZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgc2lnbmF0dXJlUGFkLmJhY2tncm91bmRDb2xvciA9IG5ld1ZhbHVlO1xuICAgICAgICAgIHNpZ25hdHVyZVBhZC5jbGVhcigpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDbGVhciB0aGUgc2lnbmF0dXJlLlxuICAgICAgICBzY29wZS5jb21wb25lbnQuY2xlYXJTaWduYXR1cmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgc2lnbmF0dXJlUGFkLmNsZWFyKCk7XG4gICAgICAgICAgcmVhZFNpZ25hdHVyZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFNldCBzb21lIENTUyBwcm9wZXJ0aWVzLlxuICAgICAgICBlbGVtZW50LmNzcyh7XG4gICAgICAgICAgJ2JvcmRlci1yYWRpdXMnOiAnNHB4JyxcbiAgICAgICAgICAnYm94LXNoYWRvdyc6ICcwIDAgNXB4IHJnYmEoMCwgMCwgMCwgMC4wMikgaW5zZXQnLFxuICAgICAgICAgICdib3JkZXInOiAnMXB4IHNvbGlkICNmNGY0ZjQnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIHJlYWRTaWduYXR1cmUoKSB7XG4gICAgICAgICAgaWYgKHNjb3BlLmNvbXBvbmVudC52YWxpZGF0ZS5yZXF1aXJlZCAmJiBzaWduYXR1cmVQYWQuaXNFbXB0eSgpKSB7XG4gICAgICAgICAgICBuZ01vZGVsLiRzZXRWaWV3VmFsdWUoJycpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5nTW9kZWwuJHNldFZpZXdWYWx1ZShzaWduYXR1cmVQYWQudG9EYXRhVVJMKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG5nTW9kZWwuJHJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzaWduYXR1cmVQYWQuZnJvbURhdGFVUkwobmdNb2RlbC4kdmlld1ZhbHVlKTtcbiAgICAgICAgfTtcbiAgICAgICAgc2lnbmF0dXJlUGFkLm9uRW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHNjb3BlLiRldmFsQXN5bmMocmVhZFNpZ25hdHVyZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUmVhZCBpbml0aWFsIGVtcHR5IGNhbnZhcywgdW5sZXNzIHNpZ25hdHVyZSBpcyByZXF1aXJlZCwgdGhlbiBrZWVwIGl0IHByaXN0aW5lXG4gICAgICAgIGlmICghc2NvcGUuY29tcG9uZW50LnZhbGlkYXRlLnJlcXVpcmVkKSB7XG4gICAgICAgICAgcmVhZFNpZ25hdHVyZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4gIGFwcC5ydW4oW1xuICAgICckdGVtcGxhdGVDYWNoZScsXG4gICAgJ0Zvcm1pb1V0aWxzJyxcbiAgICBmdW5jdGlvbiAoJHRlbXBsYXRlQ2FjaGUsXG4gICAgICAgICAgICAgIEZvcm1pb1V0aWxzKSB7XG4gICAgICAkdGVtcGxhdGVDYWNoZS5wdXQoJ2Zvcm1pby9jb21wb25lbnRzL3NpZ25hdHVyZS5odG1sJywgRm9ybWlvVXRpbHMuZmllbGRXcmFwKFxuICAgICAgICBcIjxpbWcgbmctaWY9XFxcInJlYWRPbmx5XFxcIiBuZy1hdHRyLXNyYz1cXFwie3tkYXRhW2NvbXBvbmVudC5rZXldfX1cXFwiIHNyYz1cXFwiXFxcIiAvPlxcbjxkaXYgbmctaWY9XFxcIiFyZWFkT25seVxcXCIgc3R5bGU9XFxcIndpZHRoOiB7eyBjb21wb25lbnQud2lkdGggfX07IGhlaWdodDoge3sgY29tcG9uZW50LmhlaWdodCB9fTtcXFwiPlxcbiAgPGEgY2xhc3M9XFxcImJ0biBidG4teHMgYnRuLWRlZmF1bHRcXFwiIHN0eWxlPVxcXCJwb3NpdGlvbjphYnNvbHV0ZTsgbGVmdDogMDsgdG9wOiAwOyB6LWluZGV4OiAxMDAwXFxcIiBuZy1jbGljaz1cXFwiY29tcG9uZW50LmNsZWFyU2lnbmF0dXJlKClcXFwiPlxcbiAgICA8c3BhbiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi1yZWZyZXNoXFxcIj48L3NwYW4+XFxuICA8L2E+XFxuICA8Y2FudmFzIHNpZ25hdHVyZSBjb21wb25lbnQ9XFxcImNvbXBvbmVudFxcXCIgbmFtZT1cXFwie3sgY29tcG9uZW50LmtleSB9fVxcXCIgbmctbW9kZWw9XFxcImRhdGFbY29tcG9uZW50LmtleV1cXFwiIG5nLXJlcXVpcmVkPVxcXCJjb21wb25lbnQudmFsaWRhdGUucmVxdWlyZWRcXFwiPjwvY2FudmFzPlxcbiAgPGRpdiBjbGFzcz1cXFwiZm9ybWlvLXNpZ25hdHVyZS1mb290ZXJcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOiBjZW50ZXI7Y29sb3I6I0MzQzNDMztcXFwiIG5nLWNsYXNzPVxcXCJ7J2ZpZWxkLXJlcXVpcmVkJzogY29tcG9uZW50LnZhbGlkYXRlLnJlcXVpcmVkfVxcXCI+e3sgY29tcG9uZW50LmZvb3RlciB9fTwvZGl2PlxcbjwvZGl2PlxcblwiXG4gICAgICApKTtcbiAgICB9XG4gIF0pO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcHApIHtcblxuICBhcHAuY29uZmlnKFtcbiAgICAnZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyJyxcbiAgICBmdW5jdGlvbiAoZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyKSB7XG4gICAgICBmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIucmVnaXN0ZXIoJ3RhYmxlJywge1xuICAgICAgICB0aXRsZTogJ1RhYmxlJyxcbiAgICAgICAgdGVtcGxhdGU6ICdmb3JtaW8vY29tcG9uZW50cy90YWJsZS5odG1sJyxcbiAgICAgICAgZ3JvdXA6ICdsYXlvdXQnLFxuICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgIGlucHV0OiBmYWxzZSxcbiAgICAgICAgICBudW1Sb3dzOiAzLFxuICAgICAgICAgIG51bUNvbHM6IDMsXG4gICAgICAgICAgcm93czogW1t7Y29tcG9uZW50czogW119LCB7Y29tcG9uZW50czogW119LCB7Y29tcG9uZW50czogW119XSwgW3tjb21wb25lbnRzOiBbXX0sIHtjb21wb25lbnRzOiBbXX0sIHtjb21wb25lbnRzOiBbXX1dLCBbe2NvbXBvbmVudHM6IFtdfSwge2NvbXBvbmVudHM6IFtdfSwge2NvbXBvbmVudHM6IFtdfV1dLFxuICAgICAgICAgIGhlYWRlcjogW10sXG4gICAgICAgICAgY2FwdGlvbjogJycsXG4gICAgICAgICAgc3RyaXBlZDogZmFsc2UsXG4gICAgICAgICAgYm9yZGVyZWQ6IGZhbHNlLFxuICAgICAgICAgIGhvdmVyOiBmYWxzZSxcbiAgICAgICAgICBjb25kZW5zZWQ6IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG4gIGFwcC5ydW4oW1xuICAgICckdGVtcGxhdGVDYWNoZScsXG4gICAgZnVuY3Rpb24gKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICAgICB2YXIgdGFibGVDbGFzc2VzID0gXCJ7J3RhYmxlLXN0cmlwZWQnOiBjb21wb25lbnQuc3RyaXBlZCwgXCI7XG4gICAgICB0YWJsZUNsYXNzZXMgKz0gXCIndGFibGUtYm9yZGVyZWQnOiBjb21wb25lbnQuYm9yZGVyZWQsIFwiO1xuICAgICAgdGFibGVDbGFzc2VzICs9IFwiJ3RhYmxlLWhvdmVyJzogY29tcG9uZW50LmhvdmVyLCBcIjtcbiAgICAgIHRhYmxlQ2xhc3NlcyArPSBcIid0YWJsZS1jb25kZW5zZWQnOiBjb21wb25lbnQuY29uZGVuc2VkfVwiO1xuICAgICAgJHRlbXBsYXRlQ2FjaGUucHV0KCdmb3JtaW8vY29tcG9uZW50cy90YWJsZS5odG1sJyxcbiAgICAgICAgXCI8ZGl2IGNsYXNzPVxcXCJ0YWJsZS1yZXNwb25zaXZlXFxcIj5cXG4gIDx0YWJsZSBuZy1jbGFzcz1cXFwieyd0YWJsZS1zdHJpcGVkJzogY29tcG9uZW50LnN0cmlwZWQsICd0YWJsZS1ib3JkZXJlZCc6IGNvbXBvbmVudC5ib3JkZXJlZCwgJ3RhYmxlLWhvdmVyJzogY29tcG9uZW50LmhvdmVyLCAndGFibGUtY29uZGVuc2VkJzogY29tcG9uZW50LmNvbmRlbnNlZH1cXFwiIGNsYXNzPVxcXCJ0YWJsZVxcXCI+XFxuICAgIDx0aGVhZCBuZy1pZj1cXFwiY29tcG9uZW50LmhlYWRlci5sZW5ndGhcXFwiPlxcbiAgICAgIDx0aCBuZy1yZXBlYXQ9XFxcImhlYWRlciBpbiBjb21wb25lbnQuaGVhZGVyXFxcIj57eyBoZWFkZXIgfX08L3RoPlxcbiAgICA8L3RoZWFkPlxcbiAgICA8dGJvZHk+XFxuICAgICAgPHRyIG5nLXJlcGVhdD1cXFwicm93IGluIGNvbXBvbmVudC5yb3dzIHRyYWNrIGJ5ICRpbmRleFxcXCI+XFxuICAgICAgICA8dGQgbmctcmVwZWF0PVxcXCJjb2x1bW4gaW4gcm93IHRyYWNrIGJ5ICRpbmRleFxcXCI+XFxuICAgICAgICAgIDxmb3JtaW8tY29tcG9uZW50IG5nLXJlcGVhdD1cXFwiY29tcG9uZW50IGluIGNvbHVtbi5jb21wb25lbnRzXFxcIiBjb21wb25lbnQ9XFxcImNvbXBvbmVudFxcXCIgZGF0YT1cXFwiZGF0YVxcXCIgZm9ybWlvPVxcXCJmb3JtaW9cXFwiPjwvZm9ybWlvLWNvbXBvbmVudD5cXG4gICAgICAgIDwvdGQ+XFxuICAgICAgPC90cj5cXG4gICAgPC90Ym9keT5cXG4gIDwvdGFibGU+XFxuPC9kaXY+XFxuXCJcbiAgICAgICk7XG4gICAgfVxuICBdKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXBwKSB7XG5cbiAgYXBwLmNvbmZpZyhbXG4gICAgJ2Zvcm1pb0NvbXBvbmVudHNQcm92aWRlcicsXG4gICAgZnVuY3Rpb24gKGZvcm1pb0NvbXBvbmVudHNQcm92aWRlcikge1xuICAgICAgZm9ybWlvQ29tcG9uZW50c1Byb3ZpZGVyLnJlZ2lzdGVyKCd0ZXh0YXJlYScsIHtcbiAgICAgICAgdGl0bGU6ICdUZXh0IEFyZWEnLFxuICAgICAgICB0ZW1wbGF0ZTogJ2Zvcm1pby9jb21wb25lbnRzL3RleHRhcmVhLmh0bWwnLFxuICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgIGlucHV0OiB0cnVlLFxuICAgICAgICAgIHRhYmxlVmlldzogdHJ1ZSxcbiAgICAgICAgICBsYWJlbDogJycsXG4gICAgICAgICAga2V5OiAndGV4dGFyZWFGaWVsZCcsXG4gICAgICAgICAgcGxhY2Vob2xkZXI6ICcnLFxuICAgICAgICAgIHByZWZpeDogJycsXG4gICAgICAgICAgc3VmZml4OiAnJyxcbiAgICAgICAgICByb3dzOiAzLFxuICAgICAgICAgIG11bHRpcGxlOiBmYWxzZSxcbiAgICAgICAgICBkZWZhdWx0VmFsdWU6ICcnLFxuICAgICAgICAgIHByb3RlY3RlZDogZmFsc2UsXG4gICAgICAgICAgcGVyc2lzdGVudDogdHJ1ZSxcbiAgICAgICAgICB2YWxpZGF0ZToge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgbWluTGVuZ3RoOiAnJyxcbiAgICAgICAgICAgIG1heExlbmd0aDogJycsXG4gICAgICAgICAgICBwYXR0ZXJuOiAnJyxcbiAgICAgICAgICAgIGN1c3RvbTogJydcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG4gIGFwcC5ydW4oW1xuICAgICckdGVtcGxhdGVDYWNoZScsXG4gICAgJ0Zvcm1pb1V0aWxzJyxcbiAgICBmdW5jdGlvbiAoJHRlbXBsYXRlQ2FjaGUsXG4gICAgICAgICAgICAgIEZvcm1pb1V0aWxzKSB7XG4gICAgICAkdGVtcGxhdGVDYWNoZS5wdXQoJ2Zvcm1pby9jb21wb25lbnRzL3RleHRhcmVhLmh0bWwnLCBGb3JtaW9VdGlscy5maWVsZFdyYXAoXG4gICAgICAgIFwiPHRleHRhcmVhXFxuY2xhc3M9XFxcImZvcm0tY29udHJvbFxcXCJcXG5uZy1tb2RlbD1cXFwiZGF0YVtjb21wb25lbnQua2V5XVxcXCJcXG5uZy1kaXNhYmxlZD1cXFwicmVhZE9ubHlcXFwiXFxubmctcmVxdWlyZWQ9XFxcImNvbXBvbmVudC52YWxpZGF0ZS5yZXF1aXJlZFxcXCJcXG5zYWZlLW11bHRpcGxlLXRvLXNpbmdsZVxcbmlkPVxcXCJ7eyBjb21wb25lbnQua2V5IH19XFxcIlxcbnRhYmluZGV4PVxcXCJ7eyBjb21wb25lbnQudGFiaW5kZXggfHwgMCB9fVxcXCJcXG5wbGFjZWhvbGRlcj1cXFwie3sgY29tcG9uZW50LnBsYWNlaG9sZGVyIH19XFxcIlxcbmN1c3RvbS12YWxpZGF0b3I9XFxcImNvbXBvbmVudC52YWxpZGF0ZS5jdXN0b21cXFwiXFxucm93cz1cXFwie3sgY29tcG9uZW50LnJvd3MgfX1cXFwiPjwvdGV4dGFyZWE+XFxuXCJcbiAgICAgICkpO1xuICAgIH1cbiAgXSk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIGFwcC5jb25maWcoW1xuICAgICdmb3JtaW9Db21wb25lbnRzUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uIChmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIpIHtcbiAgICAgIGZvcm1pb0NvbXBvbmVudHNQcm92aWRlci5yZWdpc3RlcigndGV4dGZpZWxkJywge1xuICAgICAgICB0aXRsZTogJ1RleHQgRmllbGQnLFxuICAgICAgICB0ZW1wbGF0ZTogJ2Zvcm1pby9jb21wb25lbnRzL3RleHRmaWVsZC5odG1sJyxcbiAgICAgICAgaWNvbjogJ2ZhIGZhLXRlcm1pbmFsJyxcbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICBpbnB1dDogdHJ1ZSxcbiAgICAgICAgICB0YWJsZVZpZXc6IHRydWUsXG4gICAgICAgICAgaW5wdXRUeXBlOiAndGV4dCcsXG4gICAgICAgICAgaW5wdXRNYXNrOiAnJyxcbiAgICAgICAgICBsYWJlbDogJycsXG4gICAgICAgICAga2V5OiAndGV4dEZpZWxkJyxcbiAgICAgICAgICBwbGFjZWhvbGRlcjogJycsXG4gICAgICAgICAgcHJlZml4OiAnJyxcbiAgICAgICAgICBzdWZmaXg6ICcnLFxuICAgICAgICAgIG11bHRpcGxlOiBmYWxzZSxcbiAgICAgICAgICBkZWZhdWx0VmFsdWU6ICcnLFxuICAgICAgICAgIHByb3RlY3RlZDogZmFsc2UsXG4gICAgICAgICAgdW5pcXVlOiBmYWxzZSxcbiAgICAgICAgICBwZXJzaXN0ZW50OiB0cnVlLFxuICAgICAgICAgIHZhbGlkYXRlOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgICBtaW5MZW5ndGg6ICcnLFxuICAgICAgICAgICAgbWF4TGVuZ3RoOiAnJyxcbiAgICAgICAgICAgIHBhdHRlcm46ICcnLFxuICAgICAgICAgICAgY3VzdG9tOiAnJyxcbiAgICAgICAgICAgIGN1c3RvbVByaXZhdGU6IGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuICBhcHAucnVuKFtcbiAgICAnJHRlbXBsYXRlQ2FjaGUnLFxuICAgICdGb3JtaW9VdGlscycsXG4gICAgZnVuY3Rpb24gKCR0ZW1wbGF0ZUNhY2hlLFxuICAgICAgICAgICAgICBGb3JtaW9VdGlscykge1xuICAgICAgJHRlbXBsYXRlQ2FjaGUucHV0KCdmb3JtaW8vY29tcG9uZW50cy90ZXh0ZmllbGQuaHRtbCcsIEZvcm1pb1V0aWxzLmZpZWxkV3JhcChcbiAgICAgICAgXCI8aW5wdXQgdHlwZT1cXFwie3sgY29tcG9uZW50LmlucHV0VHlwZSB9fVxcXCJcXG5jbGFzcz1cXFwiZm9ybS1jb250cm9sXFxcIlxcbmlkPVxcXCJ7eyBjb21wb25lbnQua2V5IH19XFxcIlxcbm5hbWU9XFxcInt7IGNvbXBvbmVudC5rZXkgfX1cXFwiXFxudGFiaW5kZXg9XFxcInt7IGNvbXBvbmVudC50YWJpbmRleCB8fCAwIH19XFxcIlxcbm5nLWRpc2FibGVkPVxcXCJyZWFkT25seVxcXCJcXG5uZy1tb2RlbD1cXFwiZGF0YVtjb21wb25lbnQua2V5XVxcXCJcXG5uZy1tb2RlbC1vcHRpb25zPVxcXCJ7IGRlYm91bmNlOiA1MDAgfVxcXCJcXG5zYWZlLW11bHRpcGxlLXRvLXNpbmdsZVxcbm5nLXJlcXVpcmVkPVxcXCJjb21wb25lbnQudmFsaWRhdGUucmVxdWlyZWRcXFwiXFxubmctbWlubGVuZ3RoPVxcXCJjb21wb25lbnQudmFsaWRhdGUubWluTGVuZ3RoXFxcIlxcbm5nLW1heGxlbmd0aD1cXFwiY29tcG9uZW50LnZhbGlkYXRlLm1heExlbmd0aFxcXCJcXG5uZy1wYXR0ZXJuPVxcXCJjb21wb25lbnQudmFsaWRhdGUucGF0dGVyblxcXCJcXG5jdXN0b20tdmFsaWRhdG9yPVxcXCJjb21wb25lbnQudmFsaWRhdGUuY3VzdG9tXFxcIlxcbnBsYWNlaG9sZGVyPVxcXCJ7eyBjb21wb25lbnQucGxhY2Vob2xkZXIgfX1cXFwiXFxudWktbWFzaz1cXFwie3sgY29tcG9uZW50LmlucHV0TWFzayB9fVxcXCJcXG51aS1tYXNrLXBsYWNlaG9sZGVyPVxcXCJcXFwiICcgKyAvLyBhdm9pZHMgcmVndWxhciBwbGFjZWhvbGRlciBtaXhpbmcgd2l0aCBtYXNrIHBsYWNlaG9sZGVyXFxudWktb3B0aW9ucz1cXFwidWlNYXNrT3B0aW9uc1xcXCJcXG4+XFxuXCJcbiAgICAgICkpO1xuICAgIH1cbiAgXSk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIGFwcC5jb25maWcoW1xuICAgICdmb3JtaW9Db21wb25lbnRzUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uIChmb3JtaW9Db21wb25lbnRzUHJvdmlkZXIpIHtcbiAgICAgIGZvcm1pb0NvbXBvbmVudHNQcm92aWRlci5yZWdpc3Rlcignd2VsbCcsIHtcbiAgICAgICAgdGl0bGU6ICdXZWxsJyxcbiAgICAgICAgdGVtcGxhdGU6ICdmb3JtaW8vY29tcG9uZW50cy93ZWxsLmh0bWwnLFxuICAgICAgICBncm91cDogJ2xheW91dCcsXG4gICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgaW5wdXQ6IGZhbHNlLFxuICAgICAgICAgIGNvbXBvbmVudHM6IFtdXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG4gIGFwcC5ydW4oW1xuICAgICckdGVtcGxhdGVDYWNoZScsXG4gICAgZnVuY3Rpb24gKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICAgICAkdGVtcGxhdGVDYWNoZS5wdXQoJ2Zvcm1pby9jb21wb25lbnRzL3dlbGwuaHRtbCcsXG4gICAgICAgIFwiPGRpdiBjbGFzcz1cXFwid2VsbFxcXCI+XFxuICA8Zm9ybWlvLWNvbXBvbmVudCBuZy1yZXBlYXQ9XFxcImNvbXBvbmVudCBpbiBjb21wb25lbnQuY29tcG9uZW50c1xcXCIgY29tcG9uZW50PVxcXCJjb21wb25lbnRcXFwiIGRhdGE9XFxcImRhdGFcXFwiIGZvcm1pbz1cXFwiZm9ybWlvXFxcIiByZWFkLW9ubHk9XFxcInJlYWRPbmx5XFxcIj48L2Zvcm1pby1jb21wb25lbnQ+XFxuPC9kaXY+XFxuXCJcbiAgICAgICk7XG4gICAgfVxuICBdKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICByZXF1aXJlOiAnbmdNb2RlbCcsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZSwgYXR0cnMsIGN0cmwpIHtcbiAgICAgIGlmIChcbiAgICAgICAgIXNjb3BlLmNvbXBvbmVudC52YWxpZGF0ZSB8fFxuICAgICAgICAhc2NvcGUuY29tcG9uZW50LnZhbGlkYXRlLmN1c3RvbVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGN0cmwuJHZhbGlkYXRvcnMuY3VzdG9tID0gZnVuY3Rpb24obW9kZWxWYWx1ZSwgdmlld1ZhbHVlKSB7XG4gICAgICAgIHZhciB2YWxpZCA9IHRydWU7XG4gICAgICAgIHZhciBpbnB1dCA9IG1vZGVsVmFsdWUgfHwgdmlld1ZhbHVlO1xuXG4gICAgICAgIHZhciBjdXN0b20gPSBzY29wZS5jb21wb25lbnQudmFsaWRhdGUuY3VzdG9tO1xuICAgICAgICBjdXN0b20gPSBjdXN0b20ucmVwbGFjZSgvKHt7XFxzKyguKilcXHMrfX0pLywgZnVuY3Rpb24obWF0Y2gsICQxLCAkMikge1xuICAgICAgICAgIHJldHVybiBzY29wZS5kYXRhWyQyXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLyoganNoaW50IGV2aWw6IHRydWUgKi9cbiAgICAgICAgZXZhbChjdXN0b20pO1xuXG4gICAgICAgIGlmICh2YWxpZCAhPT0gdHJ1ZSkge1xuICAgICAgICAgIHNjb3BlLmNvbXBvbmVudC5jdXN0b21FcnJvciA9IHZhbGlkO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcbiAgICB9XG4gIH07XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgcmVwbGFjZTogdHJ1ZSxcbiAgICBzY29wZToge1xuICAgICAgc3JjOiAnPScsXG4gICAgICBmb3JtQWN0aW9uOiAnPScsXG4gICAgICBmb3JtOiAnPScsXG4gICAgICBzdWJtaXNzaW9uOiAnPScsXG4gICAgICByZWFkT25seTogJz0nLFxuICAgICAgZm9ybWlvT3B0aW9uczogJz0nXG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBbXG4gICAgICAnJHNjb3BlJyxcbiAgICAgICckaHR0cCcsXG4gICAgICAnJGVsZW1lbnQnLFxuICAgICAgJ0Zvcm1pb1Njb3BlJyxcbiAgICAgICdGb3JtaW8nLFxuICAgICAgJ0Zvcm1pb1V0aWxzJyxcbiAgICAgIGZ1bmN0aW9uKFxuICAgICAgICAkc2NvcGUsXG4gICAgICAgICRodHRwLFxuICAgICAgICAkZWxlbWVudCxcbiAgICAgICAgRm9ybWlvU2NvcGUsXG4gICAgICAgIEZvcm1pbyxcbiAgICAgICAgRm9ybWlvVXRpbHNcbiAgICAgICkge1xuICAgICAgICAkc2NvcGUuZm9ybWlvQWxlcnRzID0gW107XG4gICAgICAgIC8vIFNob3dzIHRoZSBnaXZlbiBhbGVydHMgKHNpbmdsZSBvciBhcnJheSksIGFuZCBkaXNtaXNzZXMgb2xkIGFsZXJ0c1xuICAgICAgICB0aGlzLnNob3dBbGVydHMgPSAkc2NvcGUuc2hvd0FsZXJ0cyA9IGZ1bmN0aW9uKGFsZXJ0cykge1xuICAgICAgICAgICRzY29wZS5mb3JtaW9BbGVydHMgPSBbXS5jb25jYXQoYWxlcnRzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBBZGQgdGhlIGxpdmUgZm9ybSBwYXJhbWV0ZXIgdG8gdGhlIHVybC5cbiAgICAgICAgJHNjb3BlLl9zcmMgPSAkc2NvcGUuc3JjO1xuICAgICAgICBpZiAoJHNjb3BlLl9zcmMgJiYgKCRzY29wZS5fc3JjLmluZGV4T2YoJ2xpdmU9JykgPT09IC0xKSkge1xuICAgICAgICAgICRzY29wZS5fc3JjICs9ICgkc2NvcGUuX3NyYy5pbmRleE9mKCc/JykgPT09IC0xKSA/ICc/JyA6ICcmJztcbiAgICAgICAgICAkc2NvcGUuX3NyYyArPSAnbGl2ZT0xJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgZm9ybWlvIG9iamVjdC5cbiAgICAgICAgJHNjb3BlLmZvcm1pbyA9IEZvcm1pb1Njb3BlLnJlZ2lzdGVyKCRzY29wZSwgJGVsZW1lbnQsIHtcbiAgICAgICAgICBmb3JtOiB0cnVlLFxuICAgICAgICAgIHN1Ym1pc3Npb246IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ2FsbGVkIHdoZW4gdGhlIGZvcm0gaXMgc3VibWl0dGVkLlxuICAgICAgICAkc2NvcGUub25TdWJtaXQgPSBmdW5jdGlvbihmb3JtKSB7XG4gICAgICAgICAgaWYgKCEkc2NvcGUuZm9ybWlvRm9ybS4kdmFsaWQgfHwgZm9ybS5zdWJtaXR0aW5nKSByZXR1cm47XG4gICAgICAgICAgZm9ybS5zdWJtaXR0aW5nID0gdHJ1ZTtcblxuICAgICAgICAgIC8vIENyZWF0ZSBhIHNhbml0aXplZCBzdWJtaXNzaW9uIG9iamVjdC5cbiAgICAgICAgICB2YXIgc3VibWlzc2lvbkRhdGEgPSB7ZGF0YToge319O1xuICAgICAgICAgIGlmICgkc2NvcGUuX3N1Ym1pc3Npb24uX2lkKSB7XG4gICAgICAgICAgICBzdWJtaXNzaW9uRGF0YS5faWQgPSAkc2NvcGUuX3N1Ym1pc3Npb24uX2lkO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoJHNjb3BlLl9zdWJtaXNzaW9uLmRhdGEuX2lkKSB7XG4gICAgICAgICAgICBzdWJtaXNzaW9uRGF0YS5faWQgPSAkc2NvcGUuX3N1Ym1pc3Npb24uZGF0YS5faWQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGNvbXBvbmVudHMgPSBGb3JtaW9VdGlscy5mbGF0dGVuQ29tcG9uZW50cygkc2NvcGUuX2Zvcm0uY29tcG9uZW50cyk7XG4gICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGNvbXBvbmVudHMsIGZ1bmN0aW9uKGNvbXBvbmVudCkge1xuICAgICAgICAgICAgaWYgKCRzY29wZS5fc3VibWlzc2lvbi5kYXRhLmhhc093blByb3BlcnR5KGNvbXBvbmVudC5rZXkpKSB7XG4gICAgICAgICAgICAgIHN1Ym1pc3Npb25EYXRhLmRhdGFbY29tcG9uZW50LmtleV0gPSAkc2NvcGUuX3N1Ym1pc3Npb24uZGF0YVtjb21wb25lbnQua2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2goJHNjb3BlLl9zdWJtaXNzaW9uLmRhdGEsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiAhdmFsdWUuaGFzT3duUHJvcGVydHkoJ19pZCcpKSB7XG4gICAgICAgICAgICAgIHN1Ym1pc3Npb25EYXRhLmRhdGFba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gQ2FsbGVkIHdoZW4gYSBzdWJtaXNzaW9uIGhhcyBiZWVuIG1hZGUuXG4gICAgICAgICAgdmFyIG9uU3VibWl0RG9uZSA9IGZ1bmN0aW9uKG1ldGhvZCwgc3VibWlzc2lvbikge1xuICAgICAgICAgICAgJHNjb3BlLnNob3dBbGVydHMoe1xuICAgICAgICAgICAgICB0eXBlOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdTdWJtaXNzaW9uIHdhcyAnICsgKChtZXRob2QgPT09ICdwdXQnKSA/ICd1cGRhdGVkJyA6ICdjcmVhdGVkJykgKyAnLidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZm9ybS5zdWJtaXR0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAvLyBUcmlnZ2VyIHRoZSBmb3JtIHN1Ym1pc3Npb24uXG4gICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2Zvcm1TdWJtaXNzaW9uJywgc3VibWlzc2lvbik7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHZhciBzdWJtaXRFdmVudCA9ICRzY29wZS4kZW1pdCgnZm9ybVN1Ym1pdCcsIHN1Ym1pc3Npb25EYXRhKTtcbiAgICAgICAgICBpZiAoc3VibWl0RXZlbnQuZGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgICAgICAgLy8gTGlzdGVuZXIgd2FudHMgdG8gY2FuY2VsIHRoZSBmb3JtIHN1Ym1pc3Npb25cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBbGxvdyBjdXN0b20gYWN0aW9uIHVybHMuXG4gICAgICAgICAgaWYgKCRzY29wZS5hY3Rpb24pIHtcbiAgICAgICAgICAgIHZhciBtZXRob2QgPSBzdWJtaXNzaW9uRGF0YS5faWQgPyAncHV0JyA6ICdwb3N0JztcbiAgICAgICAgICAgICRodHRwW21ldGhvZF0oJHNjb3BlLmFjdGlvbiwgc3VibWlzc2lvbkRhdGEpLnN1Y2Nlc3MoZnVuY3Rpb24gKHN1Ym1pc3Npb24pIHtcbiAgICAgICAgICAgICAgRm9ybWlvLmNsZWFyQ2FjaGUoKTtcbiAgICAgICAgICAgICAgb25TdWJtaXREb25lKG1ldGhvZCwgc3VibWlzc2lvbik7XG4gICAgICAgICAgICB9KS5lcnJvcihGb3JtaW9TY29wZS5vbkVycm9yKCRzY29wZSwgJGVsZW1lbnQpKVxuICAgICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBmb3JtLnN1Ym1pdHRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSWYgdGhleSB3aXNoIHRvIHN1Ym1pdCB0byB0aGUgZGVmYXVsdCBsb2NhdGlvbi5cbiAgICAgICAgICBlbHNlIGlmICgkc2NvcGUuZm9ybWlvKSB7XG4gICAgICAgICAgICAkc2NvcGUuZm9ybWlvLnNhdmVTdWJtaXNzaW9uKGFuZ3VsYXIuY29weShzdWJtaXNzaW9uRGF0YSksICRzY29wZS5mb3JtaW9PcHRpb25zKSAvLyBjb3B5IHRvIHJlbW92ZSBhbmd1bGFyICQkaGFzaEtleVxuICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihzdWJtaXNzaW9uKSB7XG4gICAgICAgICAgICAgIG9uU3VibWl0RG9uZShzdWJtaXNzaW9uLm1ldGhvZCwgc3VibWlzc2lvbik7XG4gICAgICAgICAgICB9LCBGb3JtaW9TY29wZS5vbkVycm9yKCRzY29wZSwgJGVsZW1lbnQpKVxuICAgICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBmb3JtLnN1Ym1pdHRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdmb3JtU3VibWlzc2lvbicsIHN1Ym1pc3Npb25EYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgXSxcbiAgICB0ZW1wbGF0ZVVybDogJ2Zvcm1pby5odG1sJ1xuICB9O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBbXG4gICdGb3JtaW8nLFxuICAnZm9ybWlvQ29tcG9uZW50cycsXG4gIGZ1bmN0aW9uKFxuICAgIEZvcm1pbyxcbiAgICBmb3JtaW9Db21wb25lbnRzXG4gICkge1xuICAgIHJldHVybiB7XG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgIHJlcXVpcmU6ICc/XmZvcm1pbycsXG4gICAgICBzY29wZToge1xuICAgICAgICBjb21wb25lbnQ6ICc9JyxcbiAgICAgICAgZGF0YTogJz0nLFxuICAgICAgICBmb3JtaW86ICc9JyxcbiAgICAgICAgZm9ybTogJz0nLFxuICAgICAgICByZWFkT25seTogJz0nXG4gICAgICB9LFxuICAgICAgdGVtcGxhdGVVcmw6ICdmb3JtaW8vY29tcG9uZW50Lmh0bWwnLFxuICAgICAgbGluazogZnVuY3Rpb24oJHNjb3BlLCBlbCwgYXR0cnMsIGZvcm1pb0N0cmwpIHtcbiAgICAgICAgaWYgKGZvcm1pb0N0cmwpIHtcbiAgICAgICAgICAkc2NvcGUuc2hvd0FsZXJ0cyA9IGZvcm1pb0N0cmwuc2hvd0FsZXJ0cy5iaW5kKGZvcm1pb0N0cmwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICRzY29wZS5zaG93QWxlcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYWxsICRzY29wZS5zaG93QWxlcnRzIHVubGVzcyB0aGlzIGNvbXBvbmVudCBpcyBpbnNpZGUgYSBmb3JtaW8gZGlyZWN0aXZlLicpO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICckc2NvcGUnLFxuICAgICAgICAnJGh0dHAnLFxuICAgICAgICBmdW5jdGlvbihcbiAgICAgICAgICAkc2NvcGUsXG4gICAgICAgICAgJGh0dHBcbiAgICAgICAgKSB7XG5cbiAgICAgICAgICAvLyBPcHRpb25zIHRvIG1hdGNoIGpxdWVyeS5tYXNrZWRpbnB1dCBtYXNrc1xuICAgICAgICAgICRzY29wZS51aU1hc2tPcHRpb25zID0ge1xuICAgICAgICAgICAgbWFza0RlZmluaXRpb25zOiB7XG4gICAgICAgICAgICAgICc5JzogL1xcZC8sXG4gICAgICAgICAgICAgICdhJzogL1thLXpBLVpdLyxcbiAgICAgICAgICAgICAgJyonOiAvW2EtekEtWjAtOV0vXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2xlYXJPbkJsdXI6IGZhbHNlLFxuICAgICAgICAgICAgZXZlbnRzVG9IYW5kbGU6IFsnaW5wdXQnLCAna2V5dXAnLCAnY2xpY2snLCAnZm9jdXMnXSxcbiAgICAgICAgICAgIHNpbGVudEV2ZW50czogWydjbGljaycsICdmb2N1cyddXG4gICAgICAgICAgfTtcblxuICAgICAgICAgICRzY29wZS5yZXNldEZvcm0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIE1hbnVhbGx5IHJlbW92ZSBlYWNoIGtleSBzbyB3ZSBkb24ndCBsb3NlIGEgcmVmZXJlbmNlIHRvIG9yaWdpbmFsXG4gICAgICAgICAgICAvLyBkYXRhIGluIGNoaWxkIHNjb3Blcy5cbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiAkc2NvcGUuZGF0YSkge1xuICAgICAgICAgICAgICBkZWxldGUgJHNjb3BlLmRhdGFba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgZGF0YS5cbiAgICAgICAgICBpZiAoISRzY29wZS5kYXRhKSB7XG4gICAgICAgICAgICAkc2NvcGUucmVzZXRGb3JtKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSWYgdGhpcyBjb21wb25lbnQgcmVmZXJlbmNlcyBhbiBvYmplY3QsIHdlIG5lZWQgdG8gZGV0ZXJtaW5lIHRoZVxuICAgICAgICAgIC8vIHZhbHVlIGJ5IG5hdmlnYXRpbmcgdGhyb3VnaCB0aGUgb2JqZWN0LlxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICRzY29wZS5jb21wb25lbnQgJiZcbiAgICAgICAgICAgICRzY29wZS5jb21wb25lbnQua2V5XG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB2YXIgcm9vdCA9ICcnO1xuICAgICAgICAgICAgaWYgKCRzY29wZS5jb21wb25lbnQua2V5LmluZGV4T2YoJy4nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgcm9vdCA9ICRzY29wZS5jb21wb25lbnQua2V5LnNwbGl0KCcuJykuc2hpZnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ2RhdGEnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgIGlmICghZGF0YSB8fCBhbmd1bGFyLmVxdWFscyh7fSwgZGF0YSkpIHJldHVybjtcbiAgICAgICAgICAgICAgaWYgKHJvb3QgJiYgKCFkYXRhLmhhc093blByb3BlcnR5KHJvb3QpIHx8IGFuZ3VsYXIuZXF1YWxzKHt9LCBkYXRhW3Jvb3RdKSkpIHJldHVybjtcbiAgICAgICAgICAgICAgaWYgKHJvb3QgJiYgZGF0YVtyb290XS5oYXNPd25Qcm9wZXJ0eSgnX2lkJykpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZGF0YVtyb290ICsgJy5faWQnXSA9IGRhdGFbcm9vdF0uX2lkO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciB2YWx1ZSA9IEZvcm1pby5maWVsZERhdGEoZGF0YSwgJHNjb3BlLmNvbXBvbmVudCk7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmRhdGFbJHNjb3BlLmNvbXBvbmVudC5rZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEdldCB0aGUgc2V0dGluZ3MuXG4gICAgICAgICAgdmFyIGNvbXBvbmVudCA9IGZvcm1pb0NvbXBvbmVudHMuY29tcG9uZW50c1skc2NvcGUuY29tcG9uZW50LnR5cGVdIHx8IGZvcm1pb0NvbXBvbmVudHMuY29tcG9uZW50c1snY3VzdG9tJ107XG5cbiAgICAgICAgICAvLyBTZXQgdGhlIGNvbXBvbmVudCB3aXRoIHRoZSBkZWZhdWx0cyBmcm9tIHRoZSBjb21wb25lbnQgc2V0dGluZ3MuXG4gICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGNvbXBvbmVudC5zZXR0aW5ncywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICAgICAgaWYgKCEkc2NvcGUuY29tcG9uZW50Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgJHNjb3BlLmNvbXBvbmVudFtrZXldID0gYW5ndWxhci5jb3B5KHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIEFkZCBhIG5ldyBmaWVsZCB2YWx1ZS5cbiAgICAgICAgICAkc2NvcGUuYWRkRmllbGRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHNjb3BlLmRhdGFbJHNjb3BlLmNvbXBvbmVudC5rZXldID0gJHNjb3BlLmRhdGFbJHNjb3BlLmNvbXBvbmVudC5rZXldIHx8IFtdO1xuICAgICAgICAgICAgJHNjb3BlLmRhdGFbJHNjb3BlLmNvbXBvbmVudC5rZXldLnB1c2goJycpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICAvLyBSZW1vdmUgYSBmaWVsZCB2YWx1ZS5cbiAgICAgICAgICAkc2NvcGUucmVtb3ZlRmllbGRWYWx1ZSA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAkc2NvcGUuZGF0YVskc2NvcGUuY29tcG9uZW50LmtleV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgLy8gU2V0IHRoZSB0ZW1wbGF0ZSBmb3IgdGhlIGNvbXBvbmVudC5cbiAgICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudC50ZW1wbGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgJHNjb3BlLnRlbXBsYXRlID0gY29tcG9uZW50LnRlbXBsYXRlKCRzY29wZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnRlbXBsYXRlID0gY29tcG9uZW50LnRlbXBsYXRlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFsbG93IGNvbXBvbmVudCBrZXlzIHRvIGxvb2sgbGlrZSBcInNldHRpbmdzW3VzZXJuYW1lXVwiXG4gICAgICAgICAgaWYgKCRzY29wZS5jb21wb25lbnQua2V5ICYmICRzY29wZS5jb21wb25lbnQua2V5LmluZGV4T2YoJ1snKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciBtYXRjaGVzID0gJHNjb3BlLmNvbXBvbmVudC5rZXkubWF0Y2goLyhbXlxcW10rKVxcWyhbXl0rKVxcXS8pO1xuICAgICAgICAgICAgaWYgKChtYXRjaGVzLmxlbmd0aCA9PT0gMykgJiYgJHNjb3BlLmRhdGEuaGFzT3duUHJvcGVydHkobWF0Y2hlc1sxXSkpIHtcbiAgICAgICAgICAgICAgJHNjb3BlLmRhdGEgPSAkc2NvcGUuZGF0YVttYXRjaGVzWzFdXTtcbiAgICAgICAgICAgICAgJHNjb3BlLmNvbXBvbmVudC5rZXkgPSBtYXRjaGVzWzJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIElmIHRoZSBjb21wb25lbnQgaGFzIGEgY29udHJvbGxlci5cbiAgICAgICAgICBpZiAoY29tcG9uZW50LmNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudC5jb250cm9sbGVyKCRzY29wZS5jb21wb25lbnQsICRzY29wZSwgJGh0dHAsIEZvcm1pbyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gRXN0YWJsaXNoIGEgZGVmYXVsdCBmb3IgZGF0YS5cbiAgICAgICAgICBpZiAoJHNjb3BlLmRhdGEgJiYgISRzY29wZS5kYXRhLmhhc093blByb3BlcnR5KCRzY29wZS5jb21wb25lbnQua2V5KSAmJiAkc2NvcGUuY29tcG9uZW50Lmhhc093blByb3BlcnR5KCdkZWZhdWx0VmFsdWUnKSkge1xuICAgICAgICAgICAgaWYgKCRzY29wZS5jb21wb25lbnQubXVsdGlwbGUgJiYgIWFuZ3VsYXIuaXNBcnJheSgkc2NvcGUuY29tcG9uZW50LmRlZmF1bHRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgJHNjb3BlLmRhdGFbJHNjb3BlLmNvbXBvbmVudC5rZXldID0gWyRzY29wZS5jb21wb25lbnQuZGVmYXVsdFZhbHVlXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAkc2NvcGUuZGF0YVskc2NvcGUuY29tcG9uZW50LmtleV0gPSAkc2NvcGUuY29tcG9uZW50LmRlZmF1bHRWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoJHNjb3BlLmRhdGEgJiYgISRzY29wZS5kYXRhLmhhc093blByb3BlcnR5KCRzY29wZS5jb21wb25lbnQua2V5KSAmJiAkc2NvcGUuY29tcG9uZW50Lm11bHRpcGxlKSB7XG4gICAgICAgICAgICAkc2NvcGUuZGF0YVskc2NvcGUuY29tcG9uZW50LmtleV0gPSBbXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9O1xuICB9XG5dO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgcmVwbGFjZTogdHJ1ZSxcbiAgICBzY29wZToge1xuICAgICAgZm9ybTogJz0nLFxuICAgICAgc3VibWlzc2lvbjogJz0nLFxuICAgICAgc3JjOiAnPScsXG4gICAgICBmb3JtQWN0aW9uOiAnPScsXG4gICAgICByZXNvdXJjZU5hbWU6ICc9J1xuICAgIH0sXG4gICAgdGVtcGxhdGVVcmw6ICdmb3JtaW8tZGVsZXRlLmh0bWwnLFxuICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICckc2NvcGUnLFxuICAgICAgJyRlbGVtZW50JyxcbiAgICAgICdGb3JtaW9TY29wZScsXG4gICAgICAnRm9ybWlvJyxcbiAgICAgICckaHR0cCcsXG4gICAgICBmdW5jdGlvbihcbiAgICAgICAgJHNjb3BlLFxuICAgICAgICAkZWxlbWVudCxcbiAgICAgICAgRm9ybWlvU2NvcGUsXG4gICAgICAgIEZvcm1pbyxcbiAgICAgICAgJGh0dHBcbiAgICAgICkge1xuICAgICAgICAkc2NvcGUuZm9ybWlvQWxlcnRzID0gW107XG4gICAgICAgIC8vIFNob3dzIHRoZSBnaXZlbiBhbGVydHMgKHNpbmdsZSBvciBhcnJheSksIGFuZCBkaXNtaXNzZXMgb2xkIGFsZXJ0c1xuICAgICAgICAkc2NvcGUuc2hvd0FsZXJ0cyA9IGZ1bmN0aW9uKGFsZXJ0cykge1xuICAgICAgICAgICRzY29wZS5mb3JtaW9BbGVydHMgPSBbXS5jb25jYXQoYWxlcnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlc291cmNlTmFtZSA9ICdyZXNvdXJjZSc7XG4gICAgICAgIHZhciBtZXRob2ROYW1lID0gJyc7XG4gICAgICAgIHZhciBsb2FkZXIgPSBGb3JtaW9TY29wZS5yZWdpc3Rlcigkc2NvcGUsICRlbGVtZW50LCB7XG4gICAgICAgICAgZm9ybTogdHJ1ZSxcbiAgICAgICAgICBzdWJtaXNzaW9uOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChsb2FkZXIpIHtcbiAgICAgICAgICByZXNvdXJjZU5hbWUgPSBsb2FkZXIuc3VibWlzc2lvbklkID8gJ3N1Ym1pc3Npb24nIDogJ2Zvcm0nO1xuICAgICAgICAgIHZhciByZXNvdXJjZVRpdGxlID0gcmVzb3VyY2VOYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcmVzb3VyY2VOYW1lLnNsaWNlKDEpO1xuICAgICAgICAgIG1ldGhvZE5hbWUgPSAnZGVsZXRlJyArIHJlc291cmNlVGl0bGU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXQgdGhlIHJlc291cmNlIG5hbWVcbiAgICAgICAgJHNjb3BlLl9yZXNvdXJjZU5hbWUgPSByZXNvdXJjZU5hbWU7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGRlbGV0ZSBjYXBhYmlsaXR5LlxuICAgICAgICAkc2NvcGUub25EZWxldGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAvLyBSZWJ1aWxkIHJlc291cmNlVGl0bGUsICRzY29wZS5yZXNvdXJjZU5hbWUgY291bGQgaGF2ZSBjaGFuZ2VkXG4gICAgICAgICAgdmFyIHJlc291cmNlTmFtZSA9ICRzY29wZS5yZXNvdXJjZU5hbWUgfHwgJHNjb3BlLl9yZXNvdXJjZU5hbWU7XG4gICAgICAgICAgdmFyIHJlc291cmNlVGl0bGUgPSByZXNvdXJjZU5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyByZXNvdXJjZU5hbWUuc2xpY2UoMSk7XG4gICAgICAgICAgLy8gQ2FsbGVkIHdoZW4gdGhlIGRlbGV0ZSBpcyBkb25lLlxuICAgICAgICAgIHZhciBvbkRlbGV0ZURvbmUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2hvd0FsZXJ0cyh7XG4gICAgICAgICAgICAgIHR5cGU6ICdzdWNjZXNzJyxcbiAgICAgICAgICAgICAgbWVzc2FnZTogcmVzb3VyY2VUaXRsZSArICcgd2FzIGRlbGV0ZWQuJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBGb3JtaW8uY2xlYXJDYWNoZSgpO1xuICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdkZWxldGUnLCBkYXRhKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKCRzY29wZS5hY3Rpb24pIHtcbiAgICAgICAgICAgICRodHRwLmRlbGV0ZSgkc2NvcGUuYWN0aW9uKS5zdWNjZXNzKG9uRGVsZXRlRG9uZSkuZXJyb3IoRm9ybWlvU2NvcGUub25FcnJvcigkc2NvcGUsICRlbGVtZW50KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKGxvYWRlcikge1xuICAgICAgICAgICAgaWYgKCFtZXRob2ROYW1lKSByZXR1cm47XG4gICAgICAgICAgICBpZiAodHlwZW9mIGxvYWRlclttZXRob2ROYW1lXSAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuO1xuICAgICAgICAgICAgbG9hZGVyW21ldGhvZE5hbWVdKCkudGhlbihvbkRlbGV0ZURvbmUsIEZvcm1pb1Njb3BlLm9uRXJyb3IoJHNjb3BlLCAkZWxlbWVudCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLm9uQ2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJHNjb3BlLiRlbWl0KCdjYW5jZWwnKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICBdXG4gIH07XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IFtcbiAgJyRjb21waWxlJyxcbiAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgZnVuY3Rpb24oXG4gICAgJGNvbXBpbGUsXG4gICAgJHRlbXBsYXRlQ2FjaGVcbiAgKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjb3BlOiBmYWxzZSxcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQucmVwbGFjZVdpdGgoJGNvbXBpbGUoJHRlbXBsYXRlQ2FjaGUuZ2V0KHNjb3BlLnRlbXBsYXRlKSkoc2NvcGUpKTtcbiAgICAgICAgc2NvcGUuJGVtaXQoJ2Zvcm1FbGVtZW50UmVuZGVyJywgZWxlbWVudCk7XG4gICAgICB9LFxuICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgcmVxdWlyZWQgZm9yIHNvbWUgcmVhc29uIGFzIGl0IHdpbGwgb2NjYXNpb25hbGx5IHRocm93IGFuIGVycm9yIHdpdGhvdXQgaXQuXG4gICAgICB9XG4gICAgfTtcbiAgfVxuXTtcbiIsIlwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICBzY29wZTogZmFsc2UsXG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICB0ZW1wbGF0ZVVybDogJ2Zvcm1pby9lcnJvcnMuaHRtbCdcbiAgfTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVwbGFjZTogdHJ1ZSxcbiAgICByZXN0cmljdDogJ0UnLFxuICAgIHNjb3BlOiB7XG4gICAgICBzcmM6ICc9JyxcbiAgICAgIGZvcm06ICc9JyxcbiAgICAgIHN1Ym1pc3Npb25zOiAnPScsXG4gICAgICBwZXJQYWdlOiAnPSdcbiAgICB9LFxuICAgIHRlbXBsYXRlVXJsOiAnZm9ybWlvL3N1Ym1pc3Npb25zLmh0bWwnLFxuICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICckc2NvcGUnLFxuICAgICAgJyRlbGVtZW50JyxcbiAgICAgICdGb3JtaW9TY29wZScsXG4gICAgICBmdW5jdGlvbihcbiAgICAgICAgJHNjb3BlLFxuICAgICAgICAkZWxlbWVudCxcbiAgICAgICAgRm9ybWlvU2NvcGVcbiAgICAgICkge1xuICAgICAgICAkc2NvcGUuZm9ybWlvQWxlcnRzID0gW107XG4gICAgICAgIC8vIFNob3dzIHRoZSBnaXZlbiBhbGVydHMgKHNpbmdsZSBvciBhcnJheSksIGFuZCBkaXNtaXNzZXMgb2xkIGFsZXJ0c1xuICAgICAgICB0aGlzLnNob3dBbGVydHMgPSAkc2NvcGUuc2hvd0FsZXJ0cyA9IGZ1bmN0aW9uKGFsZXJ0cykge1xuICAgICAgICAgICRzY29wZS5mb3JtaW9BbGVydHMgPSBbXS5jb25jYXQoYWxlcnRzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUucGVyUGFnZSA9ICRzY29wZS5wZXJQYWdlID09PSB1bmRlZmluZWQgPyAxMCA6ICRzY29wZS5wZXJQYWdlO1xuICAgICAgICAkc2NvcGUuZm9ybWlvID0gRm9ybWlvU2NvcGUucmVnaXN0ZXIoJHNjb3BlLCAkZWxlbWVudCwge1xuICAgICAgICAgIGZvcm06IHRydWUsXG4gICAgICAgICAgc3VibWlzc2lvbnM6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLmN1cnJlbnRQYWdlID0gMTtcbiAgICAgICAgJHNjb3BlLnBhZ2VDaGFuZ2VkID0gZnVuY3Rpb24ocGFnZSkge1xuICAgICAgICAgICRzY29wZS5za2lwID0gKHBhZ2UgLSAxKSAqICRzY29wZS5wZXJQYWdlO1xuICAgICAgICAgICRzY29wZS51cGRhdGVTdWJtaXNzaW9ucygpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS50YWJsZVZpZXcgPSBmdW5jdGlvbihjb21wb25lbnQpIHtcbiAgICAgICAgICByZXR1cm4gIWNvbXBvbmVudC5oYXNPd25Qcm9wZXJ0eSgndGFibGVWaWV3JykgfHwgY29tcG9uZW50LnRhYmxlVmlldztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuJHdhdGNoKCdfc3VibWlzc2lvbnMnLCBmdW5jdGlvbihzdWJtaXNzaW9ucykge1xuICAgICAgICAgIGlmIChzdWJtaXNzaW9ucyAmJiBzdWJtaXNzaW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ3N1Ym1pc3Npb25Mb2FkJywgJHNjb3BlLl9zdWJtaXNzaW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICBdXG4gIH07XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IFtcbiAgJ0Zvcm1pbycsXG4gICdmb3JtaW9Db21wb25lbnRzJyxcbiAgZnVuY3Rpb24oXG4gICAgRm9ybWlvLFxuICAgIGZvcm1pb0NvbXBvbmVudHNcbiAgKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9uRXJyb3I6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgaWYgKGVycm9yLm5hbWUgPT09ICdWYWxpZGF0aW9uRXJyb3InKSB7XG4gICAgICAgICAgICAkZWxlbWVudC5maW5kKCcjZm9ybS1ncm91cC0nICsgZXJyb3IuZGV0YWlsc1swXS5wYXRoKS5hZGRDbGFzcygnaGFzLWVycm9yJyk7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9ICdWYWxpZGF0aW9uRXJyb3I6ICcgKyBlcnJvci5kZXRhaWxzWzBdLm1lc3NhZ2U7XG4gICAgICAgICAgICAkc2NvcGUuc2hvd0FsZXJ0cyh7XG4gICAgICAgICAgICAgIHR5cGU6ICdkYW5nZXInLFxuICAgICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICBlcnJvciA9IGVycm9yLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgZXJyb3IgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgIGVycm9yID0gSlNPTi5zdHJpbmdpZnkoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJHNjb3BlLnNob3dBbGVydHMoe1xuICAgICAgICAgICAgICB0eXBlOiAnZGFuZ2VyJyxcbiAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3JcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2Zvcm1FcnJvcicsIGVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICByZWdpc3RlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgb3B0aW9ucykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBsb2FkZXIgPSBudWxsO1xuICAgICAgICAkc2NvcGUuX3NyYyA9ICRzY29wZS5fc3JjIHx8ICRzY29wZS5zcmMgfHwgJyc7XG4gICAgICAgICRzY29wZS5fZm9ybSA9ICRzY29wZS5mb3JtIHx8IHt9O1xuICAgICAgICAkc2NvcGUuX3N1Ym1pc3Npb24gPSAkc2NvcGUuc3VibWlzc2lvbiB8fCB7ZGF0YToge319O1xuICAgICAgICAkc2NvcGUuX3N1Ym1pc3Npb25zID0gJHNjb3BlLnN1Ym1pc3Npb25zIHx8IFtdO1xuICAgICAgICAkc2NvcGUuZm9ybUxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIGVsZW1lbnRzIHJlbmRlcmVkLlxuICAgICAgICB2YXIgZWxlbWVudHNSZW5kZXJlZCA9IDA7XG4gICAgICAgICRzY29wZS4kb24oJ2Zvcm1FbGVtZW50UmVuZGVyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZWxlbWVudHNSZW5kZXJlZCsrO1xuICAgICAgICAgIGlmIChlbGVtZW50c1JlbmRlcmVkID09PSAkc2NvcGUuX2Zvcm0uY29tcG9uZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnZm9ybVJlbmRlcicsICRzY29wZS5fZm9ybSk7XG4gICAgICAgICAgICB9LCAxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFVzZWQgdG8gc2V0IHRoZSBmb3JtIGFjdGlvbi5cbiAgICAgICAgdmFyIGdldEFjdGlvbiA9IGZ1bmN0aW9uKGFjdGlvbikge1xuICAgICAgICAgIGlmICghYWN0aW9uKSByZXR1cm4gJyc7XG4gICAgICAgICAgaWYgKCRzY29wZS5hY3Rpb24pIHJldHVybiAnJztcbiAgICAgICAgICBpZiAoYWN0aW9uLnN1YnN0cigwLCAxKSA9PT0gJy8nKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSBGb3JtaW8uZ2V0QmFzZVVybCgpICsgYWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYWN0aW9uO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFNldCB0aGUgYWN0aW9uLlxuICAgICAgICAkc2NvcGUuYWN0aW9uID0gZ2V0QWN0aW9uKCRzY29wZS5mb3JtQWN0aW9uKTtcblxuICAgICAgICAvLyBBbGxvdyBzdWIgY29tcG9uZW50cyB0aGUgYWJpbGl0eSB0byBhZGQgbmV3IGZvcm0gY29tcG9uZW50cyB0byB0aGUgZm9ybS5cbiAgICAgICAgdmFyIGFkZGVkRGF0YSA9IHt9O1xuICAgICAgICAkc2NvcGUuJG9uKCdhZGRGb3JtQ29tcG9uZW50JywgZnVuY3Rpb24oZXZlbnQsIGNvbXBvbmVudCkge1xuICAgICAgICAgIGlmICghYWRkZWREYXRhLmhhc093blByb3BlcnR5KGNvbXBvbmVudC5zZXR0aW5ncy5rZXkpKSB7XG4gICAgICAgICAgICBhZGRlZERhdGFbY29tcG9uZW50LnNldHRpbmdzLmtleV0gPSB0cnVlO1xuICAgICAgICAgICAgdmFyIGRlZmF1bHRDb21wb25lbnQgPSBmb3JtaW9Db21wb25lbnRzLmNvbXBvbmVudHNbY29tcG9uZW50LnR5cGVdO1xuICAgICAgICAgICAgJHNjb3BlLl9mb3JtLmNvbXBvbmVudHMucHVzaChhbmd1bGFyLmV4dGVuZChkZWZhdWx0Q29tcG9uZW50LnNldHRpbmdzLCBjb21wb25lbnQuc2V0dGluZ3MpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFNldCB0aGUgYWN0aW9uIGlmIHRoZXkgcHJvdmlkZWQgaXQgaW4gdGhlIGZvcm0uXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ2Zvcm0uYWN0aW9uJywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgICAgICAgdmFyIGFjdGlvbiA9IGdldEFjdGlvbih2YWx1ZSk7XG4gICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgJHNjb3BlLmFjdGlvbiA9IGFjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFJldHVybiB0aGUgdmFsdWUgYW5kIHNldCB0aGUgc2NvcGUgZm9yIHRoZSBtb2RlbCBpbnB1dC5cbiAgICAgICAgJHNjb3BlLmZpZWxkRGF0YSA9IGZ1bmN0aW9uKGRhdGEsIGNvbXBvbmVudCkge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IEZvcm1pby5maWVsZERhdGEoZGF0YSwgY29tcG9uZW50KTtcbiAgICAgICAgICB2YXIgY29tcG9uZW50SW5mbyA9IGZvcm1pb0NvbXBvbmVudHMuY29tcG9uZW50c1tjb21wb25lbnQudHlwZV07XG4gICAgICAgICAgaWYgKCFjb21wb25lbnRJbmZvLnRhYmxlVmlldykgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgIGlmIChjb21wb25lbnQubXVsdGlwbGUgJiYgKHZhbHVlLmxlbmd0aCA+IDApKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWVzID0gW107XG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2godmFsdWUsIGZ1bmN0aW9uKGFycmF5VmFsdWUpIHtcbiAgICAgICAgICAgICAgdmFsdWVzLnB1c2goY29tcG9uZW50SW5mby50YWJsZVZpZXcoYXJyYXlWYWx1ZSwgY29tcG9uZW50KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjb21wb25lbnRJbmZvLnRhYmxlVmlldyh2YWx1ZSwgY29tcG9uZW50KTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudXBkYXRlU3VibWlzc2lvbnMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkc2NvcGUuZm9ybUxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgIHZhciBwYXJhbXMgPSB7fTtcbiAgICAgICAgICBpZiAoJHNjb3BlLnBlclBhZ2UpIHBhcmFtcy5saW1pdCA9ICRzY29wZS5wZXJQYWdlO1xuICAgICAgICAgIGlmICgkc2NvcGUuc2tpcCkgcGFyYW1zLnNraXAgPSAkc2NvcGUuc2tpcDtcbiAgICAgICAgICBsb2FkZXIubG9hZFN1Ym1pc3Npb25zKHtwYXJhbXM6IHBhcmFtc30pLnRoZW4oZnVuY3Rpb24oc3VibWlzc2lvbnMpIHtcbiAgICAgICAgICAgICRzY29wZS5fc3VibWlzc2lvbnMgPSBzdWJtaXNzaW9ucztcbiAgICAgICAgICAgICRzY29wZS5mb3JtTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdzdWJtaXNzaW9uc0xvYWQnLCBzdWJtaXNzaW9ucyk7XG4gICAgICAgICAgfSwgc2VsZi5vbkVycm9yKCRzY29wZSkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICgkc2NvcGUuX3NyYykge1xuICAgICAgICAgIGxvYWRlciA9IG5ldyBGb3JtaW8oJHNjb3BlLl9zcmMpO1xuICAgICAgICAgIGlmIChvcHRpb25zLmZvcm0pIHtcbiAgICAgICAgICAgICRzY29wZS5mb3JtTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICBsb2FkZXIubG9hZEZvcm0oKS50aGVuKGZ1bmN0aW9uKGZvcm0pIHtcbiAgICAgICAgICAgICAgJHNjb3BlLl9mb3JtID0gZm9ybTtcbiAgICAgICAgICAgICAgJHNjb3BlLmZvcm1Mb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnZm9ybUxvYWQnLCBmb3JtKTtcbiAgICAgICAgICAgIH0sIHRoaXMub25FcnJvcigkc2NvcGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG9wdGlvbnMuc3VibWlzc2lvbiAmJiBsb2FkZXIuc3VibWlzc2lvbklkKSB7XG4gICAgICAgICAgICAkc2NvcGUuZm9ybUxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgbG9hZGVyLmxvYWRTdWJtaXNzaW9uKCkudGhlbihmdW5jdGlvbihzdWJtaXNzaW9uKSB7XG4gICAgICAgICAgICAgICRzY29wZS5fc3VibWlzc2lvbiA9IHN1Ym1pc3Npb247XG4gICAgICAgICAgICAgIGlmICghJHNjb3BlLl9zdWJtaXNzaW9uLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuX3N1Ym1pc3Npb24uZGF0YSA9IHt9O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICRzY29wZS5mb3JtTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ3N1Ym1pc3Npb25Mb2FkJywgc3VibWlzc2lvbik7XG4gICAgICAgICAgICB9LCB0aGlzLm9uRXJyb3IoJHNjb3BlKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvcHRpb25zLnN1Ym1pc3Npb25zKSB7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlU3VibWlzc2lvbnMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAkc2NvcGUuZm9ybW9Mb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICRzY29wZS5mb3JtTG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgLy8gRW1pdCB0aGUgZXZlbnRzIGlmIHRoZXNlIG9iamVjdHMgYXJlIGFscmVhZHkgbG9hZGVkLlxuICAgICAgICAgIGlmICgkc2NvcGUuX2Zvcm0pIHtcbiAgICAgICAgICAgICRzY29wZS4kZW1pdCgnZm9ybUxvYWQnLCAkc2NvcGUuX2Zvcm0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoJHNjb3BlLl9zdWJtaXNzaW9uKSB7XG4gICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ3N1Ym1pc3Npb25Mb2FkJywgJHNjb3BlLl9zdWJtaXNzaW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCRzY29wZS5fc3VibWlzc2lvbnMpIHtcbiAgICAgICAgICAgICRzY29wZS4kZW1pdCgnc3VibWlzc2lvbnNMb2FkJywgJHNjb3BlLl9zdWJtaXNzaW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmV0dXJuIHRoZSBsb2FkZXIuXG4gICAgICAgIHJldHVybiBsb2FkZXI7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIGZvcm1pb1V0aWxzID0gcmVxdWlyZSgnZm9ybWlvLXV0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgZmxhdHRlbkNvbXBvbmVudHM6IGZvcm1pb1V0aWxzLmZsYXR0ZW5Db21wb25lbnRzLFxuICAgIGVhY2hDb21wb25lbnQ6IGZvcm1pb1V0aWxzLmVhY2hDb21wb25lbnQsXG4gICAgZ2V0Q29tcG9uZW50OiBmb3JtaW9VdGlscy5nZXRDb21wb25lbnQsXG4gICAgZmllbGRXcmFwOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgaW5wdXQgPSBpbnB1dCArICc8Zm9ybWlvLWVycm9ycz48L2Zvcm1pby1lcnJvcnM+JztcbiAgICAgIHZhciBtdWx0aUlucHV0ID0gaW5wdXQucmVwbGFjZSgnZGF0YVtjb21wb25lbnQua2V5XScsICdkYXRhW2NvbXBvbmVudC5rZXldWyRpbmRleF0nKTtcbiAgICAgIHZhciBpbnB1dExhYmVsID0gJzxsYWJlbCBuZy1pZj1cImNvbXBvbmVudC5sYWJlbCAmJiAhY29tcG9uZW50LmhpZGVMYWJlbFwiIGZvcj1cInt7IGNvbXBvbmVudC5rZXkgfX1cIiBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIiBuZy1jbGFzcz1cIntcXCdmaWVsZC1yZXF1aXJlZFxcJzogY29tcG9uZW50LnZhbGlkYXRlLnJlcXVpcmVkfVwiPnt7IGNvbXBvbmVudC5sYWJlbCB9fTwvbGFiZWw+JztcbiAgICAgIHZhciByZXF1aXJlZElubGluZSA9ICc8c3BhbiBuZy1pZj1cIiFjb21wb25lbnQubGFiZWwgJiYgY29tcG9uZW50LnZhbGlkYXRlLnJlcXVpcmVkXCIgY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLWFzdGVyaXNrIGZvcm0tY29udHJvbC1mZWVkYmFjayBmaWVsZC1yZXF1aXJlZC1pbmxpbmVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+JztcbiAgICAgIHZhciB0ZW1wbGF0ZSA9XG4gICAgICAgICc8ZGl2IG5nLWlmPVwiIWNvbXBvbmVudC5tdWx0aXBsZVwiPicgK1xuICAgICAgICBpbnB1dExhYmVsICsgcmVxdWlyZWRJbmxpbmUgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImlucHV0LWdyb3VwXCIgbmctaWY9XCJjb21wb25lbnQucHJlZml4IHx8IGNvbXBvbmVudC5zdWZmaXhcIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC1hZGRvblwiIG5nLWlmPVwiISFjb21wb25lbnQucHJlZml4XCI+e3sgY29tcG9uZW50LnByZWZpeCB9fTwvZGl2PicgK1xuICAgICAgICBpbnB1dCArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtYWRkb25cIiBuZy1pZj1cIiEhY29tcG9uZW50LnN1ZmZpeFwiPnt7IGNvbXBvbmVudC5zdWZmaXggfX08L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBuZy1pZj1cIiFjb21wb25lbnQucHJlZml4ICYmICFjb21wb25lbnQuc3VmZml4XCI+JyArIGlucHV0ICsgJzwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IG5nLWlmPVwiY29tcG9uZW50Lm11bHRpcGxlXCI+PHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtYm9yZGVyZWRcIj4nICtcbiAgICAgICAgaW5wdXRMYWJlbCArXG4gICAgICAgICc8dHIgbmctcmVwZWF0PVwidmFsdWUgaW4gZGF0YVtjb21wb25lbnQua2V5XSB0cmFjayBieSAkaW5kZXhcIj4nICtcbiAgICAgICAgJzx0ZD4nICsgcmVxdWlyZWRJbmxpbmUgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImlucHV0LWdyb3VwXCIgbmctaWY9XCJjb21wb25lbnQucHJlZml4IHx8IGNvbXBvbmVudC5zdWZmaXhcIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC1hZGRvblwiIG5nLWlmPVwiISFjb21wb25lbnQucHJlZml4XCI+e3sgY29tcG9uZW50LnByZWZpeCB9fTwvZGl2PicgK1xuICAgICAgICBtdWx0aUlucHV0ICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC1hZGRvblwiIG5nLWlmPVwiISFjb21wb25lbnQuc3VmZml4XCI+e3sgY29tcG9uZW50LnN1ZmZpeCB9fTwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IG5nLWlmPVwiIWNvbXBvbmVudC5wcmVmaXggJiYgIWNvbXBvbmVudC5zdWZmaXhcIj4nICsgbXVsdGlJbnB1dCArICc8L2Rpdj4nICtcbiAgICAgICAgJzwvdGQ+JyArXG4gICAgICAgICc8dGQ+PGEgbmctY2xpY2s9XCJyZW1vdmVGaWVsZFZhbHVlKCRpbmRleClcIiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdFwiPjxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1yZW1vdmUtY2lyY2xlXCI+PC9zcGFuPjwvYT48L3RkPicgK1xuICAgICAgICAnPC90cj4nICtcbiAgICAgICAgJzx0cj4nICtcbiAgICAgICAgJzx0ZCBjb2xzcGFuPVwiMlwiPjxhIG5nLWNsaWNrPVwiYWRkRmllbGRWYWx1ZSgpXCIgY2xhc3M9XCJidG4gYnRuLXByaW1hcnlcIj48c3BhbiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tcGx1c1wiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj4ge3sgY29tcG9uZW50LmFkZEFub3RoZXIgfHwgXCJBZGQgQW5vdGhlclwiIH19PC9hPjwvdGQ+JyArXG4gICAgICAgICc8L3RyPicgK1xuICAgICAgICAnPC90YWJsZT48L2Rpdj4nO1xuICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cbiAgfTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gW1xuICAnJHEnLFxuICAnJHJvb3RTY29wZScsXG4gICdGb3JtaW8nLFxuICBmdW5jdGlvbigkcSwgJHJvb3RTY29wZSwgRm9ybWlvKSB7XG4gICAgdmFyIEludGVyY2VwdG9yID0ge1xuICAgICAgLyoqXG4gICAgICAgKiBVcGRhdGUgSldUIHRva2VuIHJlY2VpdmVkIGZyb20gcmVzcG9uc2UuXG4gICAgICAgKi9cbiAgICAgIHJlc3BvbnNlOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB2YXIgdG9rZW4gPSByZXNwb25zZS5oZWFkZXJzKCd4LWp3dC10b2tlbicpO1xuICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID49IDIwMCAmJiByZXNwb25zZS5zdGF0dXMgPCAzMDAgJiYgdG9rZW4gJiYgdG9rZW4gIT09ICcnKSB7XG4gICAgICAgICAgRm9ybWlvLnNldFRva2VuKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIEludGVyY2VwdCBhIHJlc3BvbnNlIGVycm9yLlxuICAgICAgICovXG4gICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBpZiAocGFyc2VJbnQocmVzcG9uc2Uuc3RhdHVzLCAxMCkgPT09IDQ0MCkge1xuICAgICAgICAgIHJlc3BvbnNlLmxvZ2dlZE91dCA9IHRydWU7XG4gICAgICAgICAgRm9ybWlvLnNldFRva2VuKG51bGwpO1xuICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnZm9ybWlvLnNlc3Npb25FeHBpcmVkJywgcmVzcG9uc2UuYm9keSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocGFyc2VJbnQocmVzcG9uc2Uuc3RhdHVzLCAxMCkgPT09IDQwMSkge1xuICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnZm9ybWlvLnVuYXV0aG9yaXplZCcsIHJlc3BvbnNlLmJvZHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBTZXQgdGhlIHRva2VuIGluIHRoZSByZXF1ZXN0IGhlYWRlcnMuXG4gICAgICAgKi9cbiAgICAgIHJlcXVlc3Q6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICBpZiAoY29uZmlnLmRpc2FibGVKV1QpIHJldHVybiBjb25maWc7XG4gICAgICAgIHZhciB0b2tlbiA9IEZvcm1pby5nZXRUb2tlbigpO1xuICAgICAgICBpZiAodG9rZW4pIGNvbmZpZy5oZWFkZXJzWyd4LWp3dC10b2tlbiddID0gdG9rZW47XG4gICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBJbnRlcmNlcHRvcjtcbiAgfVxuXTtcbiIsIlwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBbXG4gICdGb3JtaW9VdGlscycsXG4gIGZ1bmN0aW9uKEZvcm1pb1V0aWxzKSB7XG4gICAgcmV0dXJuIEZvcm1pb1V0aWxzLmZsYXR0ZW5Db21wb25lbnRzO1xuICB9XG5dO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IFtcbiAgJyRzY2UnLFxuICBmdW5jdGlvbihcbiAgICAkc2NlXG4gICkge1xuICAgIHJldHVybiBmdW5jdGlvbihodG1sKSB7XG4gICAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbChodG1sKTtcbiAgICB9O1xuICB9XG5dO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmb3JtaW8nLCBbXG4gICduZ1Nhbml0aXplJyxcbiAgJ3VpLmJvb3RzdHJhcCcsXG4gICd1aS5ib290c3RyYXAuZGF0ZXRpbWVwaWNrZXInLFxuICAndWkuc2VsZWN0JyxcbiAgJ3VpLm1hc2snLFxuICAnYW5ndWxhck1vbWVudCcsXG4gICduZ0ZpbGVVcGxvYWQnXG5dKTtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIGZvcm1pbyBwcm92aWRlcnMuXG4gKi9cbmFwcC5wcm92aWRlcignRm9ybWlvJywgcmVxdWlyZSgnLi9wcm92aWRlcnMvRm9ybWlvJykpO1xuXG5hcHAucHJvdmlkZXIoJ0Zvcm1pb1BsdWdpbnMnLCByZXF1aXJlKCcuL3Byb3ZpZGVycy9Gb3JtaW9QbHVnaW5zJykpO1xuXG4vKipcbiAqIFByb3ZpZGVzIGEgd2F5IHRvIHJlZ3NpdGVyIHRoZSBGb3JtaW8gc2NvcGUuXG4gKi9cbmFwcC5mYWN0b3J5KCdGb3JtaW9TY29wZScsIHJlcXVpcmUoJy4vZmFjdG9yaWVzL0Zvcm1pb1Njb3BlJykpO1xuXG5hcHAuZmFjdG9yeSgnRm9ybWlvVXRpbHMnLCByZXF1aXJlKCcuL2ZhY3Rvcmllcy9Gb3JtaW9VdGlscycpKTtcblxuYXBwLmZhY3RvcnkoJ2Zvcm1pb0ludGVyY2VwdG9yJywgcmVxdWlyZSgnLi9mYWN0b3JpZXMvZm9ybWlvSW50ZXJjZXB0b3InKSk7XG5cbmFwcC5kaXJlY3RpdmUoJ2Zvcm1pbycsIHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9mb3JtaW8nKSk7XG5cbmFwcC5kaXJlY3RpdmUoJ2Zvcm1pb0RlbGV0ZScsIHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9mb3JtaW9EZWxldGUnKSk7XG5cbmFwcC5kaXJlY3RpdmUoJ2Zvcm1pb0Vycm9ycycsIHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9mb3JtaW9FcnJvcnMnKSk7XG5cbmFwcC5kaXJlY3RpdmUoJ2N1c3RvbVZhbGlkYXRvcicsIHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jdXN0b21WYWxpZGF0b3InKSk7XG5cbmFwcC5kaXJlY3RpdmUoJ2Zvcm1pb1N1Ym1pc3Npb25zJywgcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2Zvcm1pb1N1Ym1pc3Npb25zJykpO1xuXG5hcHAuZGlyZWN0aXZlKCdmb3JtaW9Db21wb25lbnQnLCByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvZm9ybWlvQ29tcG9uZW50JykpO1xuXG5hcHAuZGlyZWN0aXZlKCdmb3JtaW9FbGVtZW50JywgcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2Zvcm1pb0VsZW1lbnQnKSk7XG5cbi8qKlxuICogRmlsdGVyIHRvIGZsYXR0ZW4gZm9ybSBjb21wb25lbnRzLlxuICovXG5hcHAuZmlsdGVyKCdmbGF0dGVuQ29tcG9uZW50cycsIHJlcXVpcmUoJy4vZmlsdGVycy9mbGF0dGVuQ29tcG9uZW50cycpKTtcblxuYXBwLmZpbHRlcignc2FmZWh0bWwnLCByZXF1aXJlKCcuL2ZpbHRlcnMvc2FmZWh0bWwnKSk7XG5cbmFwcC5jb25maWcoW1xuICAnJGh0dHBQcm92aWRlcicsXG4gIGZ1bmN0aW9uKFxuICAgICRodHRwUHJvdmlkZXJcbiAgKSB7XG4gICAgaWYgKCEkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuZ2V0KSB7XG4gICAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuZ2V0ID0ge307XG4gICAgfVxuXG4gICAgLy8gRGlzYWJsZSBJRSBjYWNoaW5nIGZvciBHRVQgcmVxdWVzdHMuXG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmdldFsnQ2FjaGUtQ29udHJvbCddID0gJ25vLWNhY2hlJztcbiAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuZ2V0LlByYWdtYSA9ICduby1jYWNoZSc7XG4gICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnZm9ybWlvSW50ZXJjZXB0b3InKTtcbiAgfVxuXSk7XG5cbnJlcXVpcmUoJy4vcGx1Z2lucycpKGFwcCk7XG5cbmFwcC5ydW4oW1xuICAnJHRlbXBsYXRlQ2FjaGUnLFxuICBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuXG4gICAgLy8gVGhlIHRlbXBsYXRlIGZvciB0aGUgZm9ybWlvIGZvcm1zLlxuICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvLmh0bWwnLFxuICAgICAgXCI8Zm9ybSByb2xlPVxcXCJmb3JtXFxcIiBuYW1lPVxcXCJmb3JtaW9Gb3JtXFxcIiBuZy1zdWJtaXQ9XFxcIm9uU3VibWl0KGZvcm1pb0Zvcm0pXFxcIiBub3ZhbGlkYXRlPlxcbiAgPGkgc3R5bGU9XFxcImZvbnQtc2l6ZTogMmVtO1xcXCIgbmctaWY9XFxcImZvcm1Mb2FkaW5nXFxcIiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi1yZWZyZXNoIGdseXBoaWNvbi1zcGluXFxcIj48L2k+XFxuICA8ZGl2IG5nLXJlcGVhdD1cXFwiYWxlcnQgaW4gZm9ybWlvQWxlcnRzXFxcIiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQte3sgYWxlcnQudHlwZSB9fVxcXCIgcm9sZT1cXFwiYWxlcnRcXFwiPlxcbiAgICB7eyBhbGVydC5tZXNzYWdlIH19XFxuICA8L2Rpdj5cXG4gIDxmb3JtaW8tY29tcG9uZW50IG5nLXJlcGVhdD1cXFwiY29tcG9uZW50IGluIF9mb3JtLmNvbXBvbmVudHMgdHJhY2sgYnkgJGluZGV4XFxcIiBjb21wb25lbnQ9XFxcImNvbXBvbmVudFxcXCIgZGF0YT1cXFwiX3N1Ym1pc3Npb24uZGF0YVxcXCIgZm9ybT1cXFwiZm9ybWlvRm9ybVxcXCIgZm9ybWlvPVxcXCJmb3JtaW9cXFwiIHJlYWQtb25seT1cXFwicmVhZE9ubHlcXFwiPjwvZm9ybWlvLWNvbXBvbmVudD5cXG48L2Zvcm0+XFxuXCJcbiAgICApO1xuXG4gICAgJHRlbXBsYXRlQ2FjaGUucHV0KCdmb3JtaW8tZGVsZXRlLmh0bWwnLFxuICAgICAgXCI8Zm9ybSByb2xlPVxcXCJmb3JtXFxcIj5cXG4gIDxkaXYgbmctcmVwZWF0PVxcXCJhbGVydCBpbiBmb3JtaW9BbGVydHNcXFwiIGNsYXNzPVxcXCJhbGVydCBhbGVydC17eyBhbGVydC50eXBlIH19XFxcIiByb2xlPVxcXCJhbGVydFxcXCI+XFxuICAgIHt7IGFsZXJ0Lm1lc3NhZ2UgfX1cXG4gIDwvZGl2PlxcbiAgPGgzPkFyZSB5b3Ugc3VyZSB5b3Ugd2lzaCB0byBkZWxldGUgdGhlIHt7IHJlc291cmNlTmFtZSB8fCBfcmVzb3VyY2VOYW1lIH19PzwvaDM+XFxuICA8ZGl2IGNsYXNzPVxcXCJidG4tdG9vbGJhclxcXCI+XFxuICAgIDxidXR0b24gbmctY2xpY2s9XFxcIm9uRGVsZXRlKClcXFwiIGNsYXNzPVxcXCJidG4gYnRuLWRhbmdlclxcXCI+WWVzPC9idXR0b24+XFxuICAgIDxidXR0b24gbmctY2xpY2s9XFxcIm9uQ2FuY2VsKClcXFwiIGNsYXNzPVxcXCJidG4gYnRuLWRlZmF1bHRcXFwiPk5vPC9idXR0b24+XFxuICA8L2Rpdj5cXG48L2Zvcm0+XFxuXCJcbiAgICApO1xuXG4gICAgJHRlbXBsYXRlQ2FjaGUucHV0KCdmb3JtaW8vc3VibWlzc2lvbnMuaHRtbCcsXG4gICAgICBcIjxkaXY+XFxuICA8ZGl2IG5nLXJlcGVhdD1cXFwiYWxlcnQgaW4gZm9ybWlvQWxlcnRzXFxcIiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQte3sgYWxlcnQudHlwZSB9fVxcXCIgcm9sZT1cXFwiYWxlcnRcXFwiPlxcbiAgICB7eyBhbGVydC5tZXNzYWdlIH19XFxuICA8L2Rpdj5cXG4gIDx0YWJsZSBjbGFzcz1cXFwidGFibGVcXFwiPlxcbiAgICA8dGhlYWQ+XFxuICAgICAgPHRyPlxcbiAgICAgICAgPHRoIG5nLXJlcGVhdD1cXFwiY29tcG9uZW50IGluIF9mb3JtLmNvbXBvbmVudHMgfCBmbGF0dGVuQ29tcG9uZW50c1xcXCIgbmctaWY9XFxcInRhYmxlVmlldyhjb21wb25lbnQpXFxcIj57eyBjb21wb25lbnQubGFiZWwgfHwgY29tcG9uZW50LmtleSB9fTwvdGg+XFxuICAgICAgICA8dGg+U3VibWl0dGVkPC90aD5cXG4gICAgICAgIDx0aD5VcGRhdGVkPC90aD5cXG4gICAgICAgIDx0aD5PcGVyYXRpb25zPC90aD5cXG4gICAgICA8L3RyPlxcbiAgICA8L3RoZWFkPlxcbiAgICA8dGJvZHk+XFxuICAgICAgPHRyIG5nLXJlcGVhdD1cXFwic3VibWlzc2lvbiBpbiBfc3VibWlzc2lvbnNcXFwiIGNsYXNzPVxcXCJmb3JtaW8tc3VibWlzc2lvblxcXCIgbmctY2xpY2s9XFxcIiRlbWl0KCdzdWJtaXNzaW9uVmlldycsIHN1Ym1pc3Npb24pXFxcIj5cXG4gICAgICAgIDx0ZCBuZy1yZXBlYXQ9XFxcImNvbXBvbmVudCBpbiBfZm9ybS5jb21wb25lbnRzIHwgZmxhdHRlbkNvbXBvbmVudHNcXFwiIG5nLWlmPVxcXCJ0YWJsZVZpZXcoY29tcG9uZW50KVxcXCI+e3sgZmllbGREYXRhKHN1Ym1pc3Npb24uZGF0YSwgY29tcG9uZW50KSB9fTwvdGQ+XFxuICAgICAgICA8dGQ+e3sgc3VibWlzc2lvbi5jcmVhdGVkIHwgYW1EYXRlRm9ybWF0OidsLCBoOm1tOnNzIGEnIH19PC90ZD5cXG4gICAgICAgIDx0ZD57eyBzdWJtaXNzaW9uLm1vZGlmaWVkIHwgYW1EYXRlRm9ybWF0OidsLCBoOm1tOnNzIGEnIH19PC90ZD5cXG4gICAgICAgIDx0ZD5cXG4gICAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnV0dG9uLWdyb3VwXFxcIiBzdHlsZT1cXFwiZGlzcGxheTpmbGV4O1xcXCI+XFxuICAgICAgICAgICAgPGEgbmctY2xpY2s9XFxcIiRlbWl0KCdzdWJtaXNzaW9uVmlldycsIHN1Ym1pc3Npb24pOyAkZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi14c1xcXCI+PHNwYW4gY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tZXllLW9wZW5cXFwiPjwvc3Bhbj48L2E+Jm5ic3A7XFxuICAgICAgICAgICAgPGEgbmctY2xpY2s9XFxcIiRlbWl0KCdzdWJtaXNzaW9uRWRpdCcsIHN1Ym1pc3Npb24pOyAkZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi14c1xcXCI+PHNwYW4gY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tZWRpdFxcXCI+PC9zcGFuPjwvYT4mbmJzcDtcXG4gICAgICAgICAgICA8YSBuZy1jbGljaz1cXFwiJGVtaXQoJ3N1Ym1pc3Npb25EZWxldGUnLCBzdWJtaXNzaW9uKTsgJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xcXCIgY2xhc3M9XFxcImJ0biBidG4tZGFuZ2VyIGJ0bi14c1xcXCI+PHNwYW4gY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tcmVtb3ZlLWNpcmNsZVxcXCI+PC9zcGFuPjwvYT5cXG4gICAgICAgICAgPC9kaXY+XFxuICAgICAgICA8L3RkPlxcbiAgICAgIDwvdHI+XFxuICAgIDwvdGJvZHk+XFxuICA8L3RhYmxlPlxcbiAgPHBhZ2luYXRpb25cXG4gICAgbmctaWY9XFxcIl9zdWJtaXNzaW9ucy5zZXJ2ZXJDb3VudCA+IHBlclBhZ2VcXFwiXFxuICAgIG5nLW1vZGVsPVxcXCJjdXJyZW50UGFnZVxcXCJcXG4gICAgbmctY2hhbmdlPVxcXCJwYWdlQ2hhbmdlZChjdXJyZW50UGFnZSlcXFwiXFxuICAgIHRvdGFsLWl0ZW1zPVxcXCJfc3VibWlzc2lvbnMuc2VydmVyQ291bnRcXFwiXFxuICAgIGl0ZW1zLXBlci1wYWdlPVxcXCJwZXJQYWdlXFxcIlxcbiAgICBkaXJlY3Rpb24tbGlua3M9XFxcImZhbHNlXFxcIlxcbiAgICBib3VuZGFyeS1saW5rcz1cXFwidHJ1ZVxcXCJcXG4gICAgZmlyc3QtdGV4dD1cXFwiJmxhcXVvO1xcXCJcXG4gICAgbGFzdC10ZXh0PVxcXCImcmFxdW87XFxcIlxcbiAgICA+XFxuICA8L3BhZ2luYXRpb24+XFxuPC9kaXY+XFxuXCJcbiAgICApO1xuXG4gICAgLy8gQSBmb3JtaW8gY29tcG9uZW50IHRlbXBsYXRlLlxuICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2NvbXBvbmVudC5odG1sJyxcbiAgICAgIFwiPG5nLWZvcm0gbmFtZT1cXFwiZm9ybWlvRmllbGRGb3JtXFxcIiBjbGFzcz1cXFwiZm9ybWlvLWNvbXBvbmVudC17eyBjb21wb25lbnQua2V5IH19XFxcIj5cXG4gIDxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgaGFzLWZlZWRiYWNrIGZvcm0tZmllbGQtdHlwZS17eyBjb21wb25lbnQudHlwZSB9fSB7e2NvbXBvbmVudC5jdXN0b21DbGFzc319XFxcIiBpZD1cXFwiZm9ybS1ncm91cC17eyBjb21wb25lbnQua2V5IH19XFxcIiBuZy1jbGFzcz1cXFwieydoYXMtZXJyb3InOiBmb3JtaW9GaWVsZEZvcm1bY29tcG9uZW50LmtleV0uJGludmFsaWQgJiYgIWZvcm1pb0ZpZWxkRm9ybVtjb21wb25lbnQua2V5XS4kcHJpc3RpbmUgfVxcXCIgbmctc3R5bGU9XFxcImNvbXBvbmVudC5zdHlsZVxcXCI+XFxuICAgIDxmb3JtaW8tZWxlbWVudD48L2Zvcm1pby1lbGVtZW50PlxcbiAgPC9kaXY+XFxuPC9uZy1mb3JtPlxcblwiXG4gICAgKTtcblxuICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnZm9ybWlvL2Vycm9ycy5odG1sJyxcbiAgICAgIFwiPGRpdiBuZy1zaG93PVxcXCJmb3JtaW9GaWVsZEZvcm1bY29tcG9uZW50LmtleV0uJGVycm9yICYmICFmb3JtaW9GaWVsZEZvcm1bY29tcG9uZW50LmtleV0uJHByaXN0aW5lXFxcIj5cXG4gIDxwIGNsYXNzPVxcXCJoZWxwLWJsb2NrXFxcIiBuZy1zaG93PVxcXCJmb3JtaW9GaWVsZEZvcm1bY29tcG9uZW50LmtleV0uJGVycm9yLmVtYWlsXFxcIj57eyBjb21wb25lbnQubGFiZWwgfHwgY29tcG9uZW50LmtleSB9fSBtdXN0IGJlIGEgdmFsaWQgZW1haWwuPC9wPlxcbiAgPHAgY2xhc3M9XFxcImhlbHAtYmxvY2tcXFwiIG5nLXNob3c9XFxcImZvcm1pb0ZpZWxkRm9ybVtjb21wb25lbnQua2V5XS4kZXJyb3IucmVxdWlyZWRcXFwiPnt7IGNvbXBvbmVudC5sYWJlbCB8fCBjb21wb25lbnQua2V5IH19IGlzIHJlcXVpcmVkLjwvcD5cXG4gIDxwIGNsYXNzPVxcXCJoZWxwLWJsb2NrXFxcIiBuZy1zaG93PVxcXCJmb3JtaW9GaWVsZEZvcm1bY29tcG9uZW50LmtleV0uJGVycm9yLm51bWJlclxcXCI+e3sgY29tcG9uZW50LmxhYmVsIHx8IGNvbXBvbmVudC5rZXkgfX0gbXVzdCBiZSBhIG51bWJlci48L3A+XFxuICA8cCBjbGFzcz1cXFwiaGVscC1ibG9ja1xcXCIgbmctc2hvdz1cXFwiZm9ybWlvRmllbGRGb3JtW2NvbXBvbmVudC5rZXldLiRlcnJvci5tYXhsZW5ndGhcXFwiPnt7IGNvbXBvbmVudC5sYWJlbCB8fCBjb21wb25lbnQua2V5IH19IG11c3QgYmUgc2hvcnRlciB0aGFuIHt7IGNvbXBvbmVudC52YWxpZGF0ZS5tYXhMZW5ndGggKyAxIH19IGNoYXJhY3RlcnMuPC9wPlxcbiAgPHAgY2xhc3M9XFxcImhlbHAtYmxvY2tcXFwiIG5nLXNob3c9XFxcImZvcm1pb0ZpZWxkRm9ybVtjb21wb25lbnQua2V5XS4kZXJyb3IubWlubGVuZ3RoXFxcIj57eyBjb21wb25lbnQubGFiZWwgfHwgY29tcG9uZW50LmtleSB9fSBtdXN0IGJlIGxvbmdlciB0aGFuIHt7IGNvbXBvbmVudC52YWxpZGF0ZS5taW5MZW5ndGggLSAxIH19IGNoYXJhY3RlcnMuPC9wPlxcbiAgPHAgY2xhc3M9XFxcImhlbHAtYmxvY2tcXFwiIG5nLXNob3c9XFxcImZvcm1pb0ZpZWxkRm9ybVtjb21wb25lbnQua2V5XS4kZXJyb3IubWluXFxcIj57eyBjb21wb25lbnQubGFiZWwgfHwgY29tcG9uZW50LmtleSB9fSBtdXN0IGJlIGhpZ2hlciB0aGFuIHt7IGNvbXBvbmVudC52YWxpZGF0ZS5taW4gLSAxIH19LjwvcD5cXG4gIDxwIGNsYXNzPVxcXCJoZWxwLWJsb2NrXFxcIiBuZy1zaG93PVxcXCJmb3JtaW9GaWVsZEZvcm1bY29tcG9uZW50LmtleV0uJGVycm9yLm1heFxcXCI+e3sgY29tcG9uZW50LmxhYmVsIHx8IGNvbXBvbmVudC5rZXkgfX0gbXVzdCBiZSBsb3dlciB0aGFuIHt7IGNvbXBvbmVudC52YWxpZGF0ZS5tYXggKyAxIH19LjwvcD5cXG4gIDxwIGNsYXNzPVxcXCJoZWxwLWJsb2NrXFxcIiBuZy1zaG93PVxcXCJmb3JtaW9GaWVsZEZvcm1bY29tcG9uZW50LmtleV0uJGVycm9yLmN1c3RvbVxcXCI+e3sgY29tcG9uZW50LmN1c3RvbUVycm9yIH19PC9wPlxcbiAgPHAgY2xhc3M9XFxcImhlbHAtYmxvY2tcXFwiIG5nLXNob3c9XFxcImZvcm1pb0ZpZWxkRm9ybVtjb21wb25lbnQua2V5XS4kZXJyb3IucGF0dGVyblxcXCI+e3sgY29tcG9uZW50LmxhYmVsIHx8IGNvbXBvbmVudC5rZXkgfX0gZG9lcyBub3QgbWF0Y2ggdGhlIHBhdHRlcm4ge3sgY29tcG9uZW50LnZhbGlkYXRlLnBhdHRlcm4gfX08L3A+XFxuPC9kaXY+XFxuXCJcbiAgICApO1xuICB9XG5dKTtcblxucmVxdWlyZSgnLi9jb21wb25lbnRzJyk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXBwKSB7XG4gIHJlcXVpcmUoJy4vc3RvcmFnZS91cmwnKShhcHApO1xuICByZXF1aXJlKCcuL3N0b3JhZ2UvczMnKShhcHApO1xuICByZXF1aXJlKCcuL3N0b3JhZ2UvZHJvcGJveCcpKGFwcCk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXBwKSB7XG4gIGFwcC5jb25maWcoW1xuICAgICdGb3JtaW9QbHVnaW5zUHJvdmlkZXInLFxuICAgICdGb3JtaW9TdG9yYWdlRHJvcGJveFByb3ZpZGVyJyxcbiAgICBmdW5jdGlvbiAoXG4gICAgICBGb3JtaW9QbHVnaW5zUHJvdmlkZXIsXG4gICAgICBGb3JtaW9TdG9yYWdlRHJvcGJveFByb3ZpZGVyXG4gICAgKSB7XG4gICAgICBGb3JtaW9QbHVnaW5zUHJvdmlkZXIucmVnaXN0ZXIoJ3N0b3JhZ2UnLCAnZHJvcGJveCcsIEZvcm1pb1N0b3JhZ2VEcm9wYm94UHJvdmlkZXIuJGdldCgpKTtcbiAgICB9XVxuICApO1xuXG4gIGFwcC5mYWN0b3J5KCdGb3JtaW9TdG9yYWdlRHJvcGJveCcsIFtcbiAgICAnJHEnLFxuICAgICckcm9vdFNjb3BlJyxcbiAgICAnJHdpbmRvdycsXG4gICAgJyRodHRwJyxcbiAgICBmdW5jdGlvbihcbiAgICAgICRxLFxuICAgICAgJHJvb3RTY29wZSxcbiAgICAgICR3aW5kb3csXG4gICAgICAkaHR0cFxuICAgICkge1xuICAgICAgdmFyIGdldERyb3Bib3hUb2tlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZHJvcGJveFRva2VuO1xuICAgICAgICBpZiAoJHJvb3RTY29wZS51c2VyICYmICRyb290U2NvcGUudXNlci5leHRlcm5hbFRva2Vucykge1xuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCgkcm9vdFNjb3BlLnVzZXIuZXh0ZXJuYWxUb2tlbnMsIGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gJ2Ryb3Bib3gnKSB7XG4gICAgICAgICAgICAgIGRyb3Bib3hUb2tlbiA9IHRva2VuLnRva2VuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkcm9wYm94VG9rZW47XG4gICAgICAgIC8vcmV0dXJuIF8ucmVzdWx0KF8uZmluZCgkcm9vdFNjb3BlLnVzZXIuZXh0ZXJuYWxUb2tlbnMsIHt0eXBlOiAnZHJvcGJveCd9KSwgJ3Rva2VuJyk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZTogJ0Ryb3Bib3gnLFxuICAgICAgICBuYW1lOiAnZHJvcGJveCcsXG4gICAgICAgIHVwbG9hZEZpbGU6IGZ1bmN0aW9uKGZpbGUsIHN0YXR1cywgJHNjb3BlKSB7XG4gICAgICAgICAgdmFyIGRlZmVyID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgZGlyID0gJHNjb3BlLmNvbXBvbmVudC5kaXIgfHwgJyc7XG4gICAgICAgICAgdmFyIGRyb3Bib3hUb2tlbiA9IGdldERyb3Bib3hUb2tlbigpO1xuICAgICAgICAgIGlmICghZHJvcGJveFRva2VuKSB7XG4gICAgICAgICAgICBkZWZlci5yZWplY3QoJ1lvdSBtdXN0IGF1dGhlbnRpY2F0ZSB3aXRoIGRyb3Bib3ggYmVmb3JlIHVwbG9hZGluZyBmaWxlcy4nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBCb3RoIFVwbG9hZCBhbmQgJGh0dHAgZG9uJ3QgaGFuZGxlIGZpbGVzIGFzIGFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSB3aGljaCBpcyByZXF1aXJlZCBieSBkcm9wYm94LlxuICAgICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICB2YXIgb25Qcm9ncmVzcyA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgICAgICBzdGF0dXMuc3RhdHVzID0gJ3Byb2dyZXNzJztcbiAgICAgICAgICAgICAgc3RhdHVzLnByb2dyZXNzID0gcGFyc2VJbnQoMTAwLjAgKiBldnQubG9hZGVkIC8gZXZ0LnRvdGFsKTtcbiAgICAgICAgICAgICAgZGVsZXRlIHN0YXR1cy5tZXNzYWdlO1xuICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBvblByb2dyZXNzO1xuXG4gICAgICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlKEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlKSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlZmVyLnJlamVjdCh4aHIucmVzcG9uc2UgfHwgJ1VuYWJsZSB0byB1cGxvYWQgZmlsZScpO1xuICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgeGhyLm9wZW4oJ1BPU1QnLCAnaHR0cHM6Ly9jb250ZW50LmRyb3Bib3hhcGkuY29tLzIvZmlsZXMvdXBsb2FkJyk7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQXV0aG9yaXphdGlvbicsICdCZWFyZXIgJyArIGRyb3Bib3hUb2tlbik7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScpO1xuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0Ryb3Bib3gtQVBJLUFyZycsIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgcGF0aDogJy8nICsgZGlyICsgZmlsZS5uYW1lLFxuICAgICAgICAgICAgICBtb2RlOiAnYWRkJyxcbiAgICAgICAgICAgICAgYXV0b3JlbmFtZTogdHJ1ZSxcbiAgICAgICAgICAgICAgbXV0ZTogZmFsc2VcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgeGhyLnNlbmQoZmlsZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBkb3dubG9hZEZpbGU6IGZ1bmN0aW9uKGV2dCwgZmlsZSkge1xuICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZhciBkcm9wYm94VG9rZW4gPSBnZXREcm9wYm94VG9rZW4oKTtcbiAgICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vYXBpLmRyb3Bib3hhcGkuY29tLzIvc2hhcmluZy9jcmVhdGVfc2hhcmVkX2xpbmtfd2l0aF9zZXR0aW5ncycsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgZHJvcGJveFRva2VuLFxuICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBwYXRoOiBmaWxlLnBhdGhfbG93ZXJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkaXNhYmxlSldUOiB0cnVlXG4gICAgICAgICAgfSkudGhlbihmdW5jdGlvbiBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpIHtcbiAgICAgICAgICAgICR3aW5kb3cub3BlbihyZXNwb25zZS5kYXRhLnVybCwgJ19ibGFuaycpO1xuICAgICAgICAgIH0sIGZ1bmN0aW9uIGVycm9yQ2FsbGJhY2socmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGFsZXJ0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXBwKSB7XG4gIGFwcC5jb25maWcoW1xuICAgICdGb3JtaW9QbHVnaW5zUHJvdmlkZXInLFxuICAgICdGb3JtaW9TdG9yYWdlUzNQcm92aWRlcicsXG4gICAgZnVuY3Rpb24gKFxuICAgICAgRm9ybWlvUGx1Z2luc1Byb3ZpZGVyLFxuICAgICAgRm9ybWlvU3RvcmFnZVMzUHJvdmlkZXJcbiAgICApIHtcbiAgICAgIEZvcm1pb1BsdWdpbnNQcm92aWRlci5yZWdpc3Rlcignc3RvcmFnZScsICdzMycsIEZvcm1pb1N0b3JhZ2VTM1Byb3ZpZGVyLiRnZXQoKSk7XG4gICAgfVxuICBdKTtcblxuICBhcHAuZmFjdG9yeSgnRm9ybWlvU3RvcmFnZVMzJywgW1xuICAgICckcScsXG4gICAgJyR3aW5kb3cnLFxuICAgICdGb3JtaW8nLFxuICAgICdVcGxvYWQnLFxuICAgIGZ1bmN0aW9uKFxuICAgICAgJHEsXG4gICAgICAkd2luZG93LFxuICAgICAgRm9ybWlvLFxuICAgICAgVXBsb2FkXG4gICAgKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZTogJ1MzJyxcbiAgICAgICAgbmFtZTogJ3MzJyxcbiAgICAgICAgdXBsb2FkRmlsZTogZnVuY3Rpb24oZmlsZSwgc3RhdHVzLCAkc2NvcGUpIHtcbiAgICAgICAgICB2YXIgZGVmZXIgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIEZvcm1pby5yZXF1ZXN0KCRzY29wZS5mb3JtaW8uZm9ybVVybCArICcvc3RvcmFnZS9zMycsICdQT1NUJywge1xuICAgICAgICAgICAgbmFtZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgc2l6ZTogZmlsZS5zaXplLFxuICAgICAgICAgICAgdHlwZTogZmlsZS50eXBlXG4gICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgICAgIHVybDogcmVzcG9uc2UudXJsLFxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGRhdGE6IHJlc3BvbnNlLmRhdGFcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmZpbGUgPSBmaWxlO1xuICAgICAgICAgICAgICB2YXIgZGlyID0gJHNjb3BlLmNvbXBvbmVudC5kaXIgfHwgJyc7XG4gICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5rZXkgKz0gZGlyICsgZmlsZS5uYW1lO1xuICAgICAgICAgICAgICB2YXIgdXBsb2FkID0gVXBsb2FkLnVwbG9hZChyZXF1ZXN0KTtcbiAgICAgICAgICAgICAgdXBsb2FkXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAvLyBIYW5kbGUgdXBsb2FkIGZpbmlzaGVkLlxuICAgICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGZpbGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYnVja2V0OiByZXNwb25zZS5idWNrZXQsXG4gICAgICAgICAgICAgICAgICAgIGtleTogcmVxdWVzdC5kYXRhLmtleSxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiByZXNwb25zZS51cmwgKyByZXF1ZXN0LmRhdGEua2V5LFxuICAgICAgICAgICAgICAgICAgICBhY2w6IHJlcXVlc3QuZGF0YS5hY2wsXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IGZpbGUuc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogZmlsZS50eXBlXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgICAgICAgICAgICAvLyBIYW5kbGUgZXJyb3JcbiAgICAgICAgICAgICAgICAgIHZhciBvUGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuICAgICAgICAgICAgICAgICAgdmFyIG9ET00gPSBvUGFyc2VyLnBhcnNlRnJvbVN0cmluZyhyZXNwLmRhdGEsICd0ZXh0L3htbCcpO1xuICAgICAgICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBvRE9NLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdNZXNzYWdlJylbMF0uaW5uZXJIVE1MO1xuICAgICAgICAgICAgICAgICAgZGVmZXIucmVqZWN0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgICAgICAgICAgLy8gUHJvZ3Jlc3Mgbm90aWZ5XG4gICAgICAgICAgICAgICAgICBzdGF0dXMuc3RhdHVzID0gJ3Byb2dyZXNzJztcbiAgICAgICAgICAgICAgICAgIHN0YXR1cy5wcm9ncmVzcyA9IHBhcnNlSW50KDEwMC4wICogZXZ0LmxvYWRlZCAvIGV2dC50b3RhbCk7XG4gICAgICAgICAgICAgICAgICBkZWxldGUgc3RhdHVzLm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZG93bmxvYWRGaWxlOiBmdW5jdGlvbihldnQsIGZpbGUsICRzY29wZSkge1xuICAgICAgICAgIC8vIElmIHRoaXMgaXMgbm90IGEgcHVibGljIGZpbGUsIGdldCBhIHNpZ25lZCB1cmwgYW5kIG9wZW4gaW4gbmV3IHRhYi5cbiAgICAgICAgICBpZiAoZmlsZS5hY2wgIT09ICdwdWJsaWMtcmVhZCcpIHtcbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgRm9ybWlvLnJlcXVlc3QoJHNjb3BlLmZvcm0gKyAnL3N0b3JhZ2UvczM/YnVja2V0PScgKyBmaWxlLmJ1Y2tldCArICcma2V5PScgKyBmaWxlLmtleSwgJ0dFVCcpXG4gICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICR3aW5kb3cub3BlbihyZXNwb25zZS51cmwsICdfYmxhbmsnKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIC8vIElzIGFsZXJ0IHRoZSBiZXN0IHdheSB0byBkbyB0aGlzP1xuICAgICAgICAgICAgICAgIC8vIFVzZXIgaXMgZXhwZWN0aW5nIGFuIGltbWVkaWF0ZSBub3RpZmljYXRpb24gZHVlIHRvIGF0dGVtcHRpbmcgdG8gZG93bmxvYWQgYSBmaWxlLlxuICAgICAgICAgICAgICAgIGFsZXJ0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFwcCkge1xuICBhcHAuY29uZmlnKFtcbiAgICAnRm9ybWlvUGx1Z2luc1Byb3ZpZGVyJyxcbiAgICAnRm9ybWlvU3RvcmFnZVVybFByb3ZpZGVyJyxcbiAgICBmdW5jdGlvbiAoXG4gICAgICBGb3JtaW9QbHVnaW5zUHJvdmlkZXIsXG4gICAgICBGb3JtaW9TdG9yYWdlVXJsUHJvdmlkZXJcbiAgICApIHtcbiAgICAgIEZvcm1pb1BsdWdpbnNQcm92aWRlci5yZWdpc3Rlcignc3RvcmFnZScsICd1cmwnLCBGb3JtaW9TdG9yYWdlVXJsUHJvdmlkZXIuJGdldCgpKTtcbiAgICB9XG4gIF0pO1xuXG4gIGFwcC5mYWN0b3J5KCdGb3JtaW9TdG9yYWdlVXJsJywgW1xuICAgICckcScsXG4gICAgJ1VwbG9hZCcsXG4gICAgZnVuY3Rpb24gKFxuICAgICAgJHEsXG4gICAgICBVcGxvYWRcbiAgICApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlOiAnVXJsJyxcbiAgICAgICAgbmFtZTogJ3VybCcsXG4gICAgICAgIHVwbG9hZEZpbGU6IGZ1bmN0aW9uKGZpbGUsIHN0YXR1cywgJHNjb3BlKSB7XG4gICAgICAgICAgdmFyIGRlZmVyID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBVcGxvYWQudXBsb2FkKHtcbiAgICAgICAgICAgIHVybDogJHNjb3BlLmNvbXBvbmVudC51cmwsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlKHJlc3ApO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAgICAgICBkZWZlci5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgLy8gUHJvZ3Jlc3Mgbm90aWZ5XG4gICAgICAgICAgICAgIHN0YXR1cy5zdGF0dXMgPSAncHJvZ3Jlc3MnO1xuICAgICAgICAgICAgICBzdGF0dXMucHJvZ3Jlc3MgPSBwYXJzZUludCgxMDAuMCAqIGV2dC5sb2FkZWQgLyBldnQudG90YWwpO1xuICAgICAgICAgICAgICBkZWxldGUgc3RhdHVzLm1lc3NhZ2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZG93bmxvYWRGaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAvLyBEbyBub3RoaW5nIHdoaWNoIHdpbGwgY2F1c2UgYSBub3JtYWwgbGluayBjbGljayB0byBvY2N1ci5cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XVxuICApO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxuICAvLyBUaGUgZm9ybWlvIGNsYXNzLlxuICB2YXIgRm9ybWlvID0gcmVxdWlyZSgnZm9ybWlvanMvc3JjL2Zvcm1pby5qcycpO1xuXG4gIC8vIFJldHVybiB0aGUgcHJvdmlkZXIgaW50ZXJmYWNlLlxuICByZXR1cm4ge1xuXG4gICAgLy8gRXhwb3NlIEZvcm1pbyBjb25maWd1cmF0aW9uIGZ1bmN0aW9uc1xuICAgIHNldEJhc2VVcmw6IEZvcm1pby5zZXRCYXNlVXJsLFxuICAgIGdldEJhc2VVcmw6IEZvcm1pby5nZXRCYXNlVXJsLFxuICAgIHJlZ2lzdGVyUGx1Z2luOiBGb3JtaW8ucmVnaXN0ZXJQbHVnaW4sXG4gICAgZ2V0UGx1Z2luOiBGb3JtaW8uZ2V0UGx1Z2luLFxuICAgIHNldERvbWFpbjogZnVuY3Rpb24oZG9tKSB7XG4gICAgICAvLyBSZW1vdmUgdGhpcz9cbiAgICB9LFxuXG4gICAgJGdldDogW1xuICAgICAgJyRyb290U2NvcGUnLFxuICAgICAgJyRxJyxcbiAgICAgIGZ1bmN0aW9uKFxuICAgICAgICAkcm9vdFNjb3BlLFxuICAgICAgICAkcVxuICAgICAgKSB7XG5cbiAgICAgICAgdmFyIHdyYXBRUHJvbWlzZSA9IGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICAgICAgICByZXR1cm4gJHEud2hlbihwcm9taXNlKVxuICAgICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgaWYgKGVycm9yID09PSAnVW5hdXRob3JpemVkJykge1xuICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2Zvcm1pby51bmF1dGhvcml6ZWQnLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChlcnJvciA9PT0gJ0xvZ2luIFRpbWVvdXQnKSB7XG4gICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnZm9ybWlvLnNlc3Npb25FeHBpcmVkJywgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUHJvcGFnYXRlIGVycm9yXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBGb3JtaW8ucmVnaXN0ZXJQbHVnaW4oe1xuICAgICAgICAgIHByaW9yaXR5OiAtMTAwLFxuICAgICAgICAgIC8vIFdyYXAgRm9ybWlvLnJlcXVlc3QncyBwcm9taXNlcyB3aXRoICRxIHNvICRhcHBseSBnZXRzIGNhbGxlZCBjb3JyZWN0bHkuXG4gICAgICAgICAgd3JhcFJlcXVlc3RQcm9taXNlOiB3cmFwUVByb21pc2UsXG4gICAgICAgICAgd3JhcFN0YXRpY1JlcXVlc3RQcm9taXNlOiB3cmFwUVByb21pc2VcbiAgICAgICAgfSwgJ25nRm9ybWlvUHJvbWlzZVdyYXBwZXInKTtcblxuICAgICAgICAvLyBCcm9hZGNhc3Qgb2ZmbGluZSBldmVudHMgZnJvbSAkcm9vdFNjb3BlXG4gICAgICAgIEZvcm1pby5ldmVudHMub25BbnkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGV2ZW50ID0gJ2Zvcm1pby4nICsgdGhpcy5ldmVudDtcbiAgICAgICAgICB2YXIgYXJncyA9IFtdLnNwbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgICAgICAgYXJncy51bnNoaWZ0KGV2ZW50KTtcbiAgICAgICAgICAkcm9vdFNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdC5hcHBseSgkcm9vdFNjb3BlLCBhcmdzKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUmV0dXJuIHRoZSBmb3JtaW8gaW50ZXJmYWNlLlxuICAgICAgICByZXR1cm4gRm9ybWlvO1xuICAgICAgfVxuICAgIF1cbiAgfTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxuICB2YXIgcGx1Z2lucyA9IHt9O1xuXG4gIHJldHVybiB7XG5cbiAgICByZWdpc3RlcjogZnVuY3Rpb24odHlwZSwgbmFtZSwgcGx1Z2luKSB7XG4gICAgICBpZiAoIXBsdWdpbnNbdHlwZV0pIHtcbiAgICAgICAgcGx1Z2luc1t0eXBlXSA9IHt9O1xuICAgICAgfVxuICAgICAgcGx1Z2luc1t0eXBlXVtuYW1lXSA9IHBsdWdpbjtcbiAgICB9LFxuXG4gICAgJGdldDogW1xuICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih0eXBlLCBuYW1lKSB7XG4gICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgIHJldHVybiBwbHVnaW5zW3R5cGVdW25hbWVdIHx8IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHBsdWdpbnNbdHlwZV0gfHwgZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBwbHVnaW5zO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIF1cbiAgfTtcbn07XG4iXX0=
