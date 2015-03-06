/*jslint indent: 2 */
(function (exports) {
  "use strict";

  /*! Copyright (c) 2015 Tristan Cavelier <t.cavelier@free.fr>
      This program is free software. It comes without any warranty, to
      the extent permitted by applicable law. You can redistribute it
      and/or modify it under the terms of the Do What The Fuck You Want
      To Public License, Version 2, as published by Sam Hocevar. See
      http://www.wtfpl.net/ for more details. */

  /*jslint indent: 2, nomen: true */
  /*global Blob, FileReader, ArrayBuffer, Uint8Array, URL, XMLHttpRequest,
           setTimeout, clearTimeout, btoa, atob, document, open, localStorage */

  //////////////////////////////////////////////////

  function mixIn(fromCons, toCons) {
    /*jslint forin: true */
    var k;
    for (k in fromCons.prototype) {
      if (toCons.prototype[k] !== undefined) {
        throw new Error("Property " + k + " of " + toCons.name + " is already defined");
      }
      toCons.prototype[k] = fromCons.prototype[k];
    }
  }
  exports.mixIn = mixIn;

  //////////////////////////////////////////////////

  function wrap(fn, args) {
    return function () {
      return fn.apply(this, [].concat(args, arguments));
    };
  }
  exports.wrap = wrap;

  //////////////////////////////////////////////////

  function arrayBufferToBinaryString(arrayBuffer) {
    var bs = "", ua = new Uint8Array(arrayBuffer), l = ua.length, i;
    for (i = 0; i < l; i += 1) {
      bs += String.fromCharCode(ua[i]);
    }
    return bs;
  }
  exports.arrayBufferToBinaryString = arrayBufferToBinaryString;

  function binaryStringToArrayBuffer(binaryString) {
    var ua = new Uint8Array(binaryString.length), i;
    for (i = 0; i < binaryString.length; i += 1) {
      ua[i] = binaryString.charCodeAt(i);
    }
    return ua.buffer;
  }
  exports.binaryStringToArrayBuffer = binaryStringToArrayBuffer;

  //////////////////////////////////////////////////

  exports.binaryStringToBase64 = btoa;
  exports.base64ToBinaryString = atob;

  function arrayBufferToBase64(arrayBuffer) {
    return btoa(arrayBufferToBinaryString(arrayBuffer));
  }
  exports.arrayBufferToBase64 = arrayBufferToBase64;

  function base64ToArrayBuffer(text) {
    return binaryStringToArrayBuffer(atob(text));
  }
  exports.base64ToArrayBuffer = base64ToArrayBuffer;

  //////////////////////////////////////////////////

  function binaryStringToHexadecimal(binaryString) {
    var r = "", i;
    for (i = 0; i < binaryString.length; i += 1) {
      r += ("0" + binaryString.charCodeAt(i).toString(16)).slice(-2);
    }
    return r;
  }
  exports.binaryStringToHexadecimal = binaryStringToHexadecimal;

  function hexadecimalToBinaryString(text) {
    var r = "", i, c;
    text = text.replace(/\s/g, "");
    if (text.length % 2) {
      text += "0";
    }
    for (i = 0; i < text.length; i += 2) {
      c = (parseInt(text[i], 16) * 0x10) + parseInt(text[i + 1], 16);
      if (isNaN(c)) {
        c = new Error("String contains an invalid character");
        c.name = "InvalidCharacterError";
        c.code = 5;
        throw c;
      }
      r += String.fromCharCode(c);
    }
    return r;
  }
  exports.hexadecimalToBinaryString = hexadecimalToBinaryString;

  function arrayBufferToHexadecimal(arrayBuffer) {
    return binaryStringToHexadecimal(arrayBufferToBinaryString(arrayBuffer));
  }
  exports.arrayBufferToHexadecimal = arrayBufferToHexadecimal;

  function hexadecimalToArrayBuffer(text) {
    return binaryStringToArrayBuffer(hexadecimalToBinaryString(text));
  }
  exports.hexadecimalToArrayBuffer = hexadecimalToArrayBuffer;

  //////////////////////////////////////////////////

  function parseDataURIAsBlob(dataURI) {
    /*jslint regexp: true */
    if (dataURI.slice(0, 5) !== "data:") {
      return null;
    }
    var mimetype, charset, base64 = false, toComma, data;
    data = dataURI.slice(5).replace(/^[^,]*,/, function (match) {
      toComma = match;
      return "";
    });
    if (toComma === undefined) { return null; }
    toComma = toComma.replace(/^\s*([a-z]+\/[a-zA-Z_\-\.\+]+)\s*[;,]/, function (match, group1) {
      /*jslint unparam: true */
      mimetype = group1;
      return ";";
    });
    toComma = toComma.replace(/;\s*charset\s*=\s*([0-9a-z_\-\.]+)\s*[;,]/i, function (match, group1) {
      /*jslint unparam: true */
      charset = group1;
      return ";";
    });
    toComma.replace(/;\s*base64\s*[;,]/i, function () {
      base64 = true;
    });
    data = decodeURIComponent(data);
    if (mimetype && base64) {
      try {
        data = atob(data);
      } catch (ignored) {
        return null;
      }
      data = [].reduce.call(data, function (ua, chr, i) {
        ua[i] = chr.charCodeAt(0);
        return ua;
      }, new Uint8Array(data.length)).buffer;
    }
    if (mimetype) {
      if (charset) {
        charset = ";charset=" + (charset || "US-ASCII");
      }
    } else {
      mimetype = "text/plain";
      charset = ";charset=US-ASCII";
    }
    return new Blob([data], {type: mimetype + (charset || "")});
  }
  exports.parseDataURIAsBlob = parseDataURIAsBlob;

  //////////////////////////////////////////////////

  function range(start, end, step, callback) {
    // function range(start, end, callback)
    // function range(end, callback)
    if (arguments.length > 3) {
      while (start < end) {
        callback(start);
        start += step;
      }
    } else if (arguments.length === 3) {
      while (start < end) {
        step(start);
        start += 1;
      }
    } else if (arguments.length === 2) {
      step = 0;
      while (step < start) {
        end(step);
        step += 1;
      }
    } else {
      throw new Error("range() needs at least two arguments");
    }
  }
  exports.range = range;

  //////////////////////////////////////////////////

  function downloadAs(filename, mimetype, data) {
    /**
     * Allows the user to download `data` as a file which name is defined by
     * `filename`. The `mimetype` will help the browser to choose the associated
     * application to open with.
     *
     * @param  {String} filename The file name.
     * @param  {String} mimetype The data type.
     * @param  {Any} data The data to download.
     */
    data = URL.createObjectURL(new Blob([data], {"type": mimetype}));
    var a = document.createElement("a");
    if (a.download !== undefined) {
      a.download = filename;
      a.href = data;
      //a.textContent = 'Downloading...';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      open(data);
    }
  }
  exports.downloadAs = downloadAs;

  //////////////////////////////////////////////////

  function xmlHttpRequestHeadersToKeyValue(sHeaders) {
    // sHeaders ->
    //   Server:   SimpleHTTP/0.6 Python/3.4.1\r\n
    //   Date: Wed, 04 Jun 2014 14:06:57 GMT   \r\n
    //   Value: hello\r\n     guys  \r\n
    //   Content-Type: application/x-silverlight\r\n
    //   Content-Length: 11240\r\n
    //   Last-Modified: Mon, 03 Dec 2012 23:51:07 GMT\r\n
    //   X-Cache: HIT via me\r\n
    //   X-Cache: HIT via other\r\n
    // Returns ->
    //   { "Server": "SimpleHTTP/0.6 Python/3.4.1",
    //     "Date": "Wed, 04 Jun 2014 14:06:57 GMT",
    //     "Value": "hello guys",
    //     "Content-Type": "application/x-silverlight",
    //     "Content-Length": "11240",
    //     "Last-Modified": "Mon, 03 Dec 2012 23:51:07 GMT",
    //     "X-Cache": "HIT via me, HIT via other" }

    /*jslint regexp: true */
    var result = {}, key, value = "";
    sHeaders.split("\r\n").forEach(function (line) {
      if (line[0] === " " || line[0] === "\t") {
        value += " " + line.replace(/^\s*/, "").replace(/\s*$/, "");
      } else {
        if (key) {
          if (result[key]) {
            result[key] += ", " + value;
          } else {
            result[key] = value;
          }
        }
        key = /^([^:]+)\s*:\s*(.*)$/.exec(line);
        if (key) {
          value = key[2].replace(/\s*$/, "");
          key = key[1];
        }
      }
    });
    return result;
  }
  exports.xmlHttpRequestHeadersToKeyValue = xmlHttpRequestHeadersToKeyValue;

  //////////////////////////////////////////////////

  function Deferred() {
    var it = this;
    it.promise = new Promise(function (resolve, reject) {
      it.resolve = resolve;
      it.reject = reject;
    });
  }
  exports.Deferred = Deferred;

  function CancellableDeferred() {
    // Simple example:
    //   var cd = new CancellableDeferred()
    //   cd.oncancel = function () { cd.reject("CANCELLED"); };
    //   ...do asynchronous code here...
    //   return cd.promise;

    var it = this;
    it.promise = new Promise(function (resolve, reject) {
      it.resolve = resolve;
      it.reject = reject;
    });
    it.promise.cancel = function () {
      // just send a cancel signal

      try { it.oncancel(); } catch (ignore) {}
      return this;
    };
  }
  exports.CancellableDeferred = CancellableDeferred;

  //////////////////////////////////////////////////

  function CancellablePromise(executor, canceller) {
    this._canceller = canceller;
    this._promise = new Promise(executor);
  }

  CancellablePromise.prototype.then = function () {
    return this._promise.then.apply(this._promise, arguments);
  };

  CancellablePromise.prototype["catch"] = function () {
    return this._promise["catch"].apply(this._promise, arguments);
  };

  CancellablePromise.prototype.cancel = function () {
    // just send a cancel signal

    try { this._canceller(); } catch (ignore) {}
    // if not function throw new Error("Cannot cancel this promise."); ?
    return this;
  };

  CancellablePromise.all = function (promises) {
    /**
     *     all(promises): Promise< promises_fulfilment_values >
     *     all(promises): Promise< one_rejected_reason >
     *
     * Produces a promise that is resolved when all the given `promises` are
     * fulfilled. The fulfillment value is an array of each of the fulfillment
     * values of the promise array.
     *
     * If one of the promises is rejected, the `all` promise will be rejected with
     * the same rejected reason, and the remaining unresolved promises recieve a
     * cancel signal.
     *
     * @param  {Array} promises An array of promises
     * @return {Promise} A promise
     */
    var length = promises.length, cancellableDeferred, i, count, results, ended;

    if (length === 0) {
      return Promise.resolve([]);
    }

    function onCancel() {
      if (ended) { return; }
      delete cancellableDeferred.oncancel;
      var j;
      for (j = 0; j < promises.length; j += 1) {
        if (typeof promises[j].cancel === "function") {
          try { promises[j].cancel(); } catch (ignore) {}
        }
      }
    }
    function resolver(i) {
      return function (value) {
        count += 1;
        results[i] = value;
        if (count !== length) { return; }
        delete cancellableDeferred.oncancel;
        cancellableDeferred.resolve(results);
      };
    }
    function rejecter(reason) {
      if (ended) { return; }
      onCancel();
      ended = true;
      cancellableDeferred.reject(reason);
    }

    cancellableDeferred = new CancellableDeferred();
    cancellableDeferred.oncancel = onCancel;
    count = 0;
    results = [];
    for (i = 0; i < length; i += 1) {
      promises[i].then(resolver(i), rejecter);
    }
    return cancellableDeferred.promise;
  };

  CancellablePromise.race = function (promises) {
    /**
     *     race(promises): promise< first_value >
     *
     * Produces a promise that is fulfilled when any one of the given promises is
     * fulfilled. As soon as one of the promises is resolved, whether by being
     * fulfilled or rejected, all the promises receive a cancel signal.
     *
     * @param  {Array} promises An array of promises
     * @return {Promise} A promise
     */
    var length = promises.length, cancellableDeferred, i, ended;

    function onCancel() {
      if (ended) { return; }
      delete cancellableDeferred.oncancel;
      var j;
      for (j = 0; j < promises.length; j += 1) {
        if (typeof promises[j].cancel === "function") {
          promises[j].cancel();
        }
      }
    }
    function resolver(value) {
      if (ended) { return; }
      onCancel();
      cancellableDeferred.resolve(value);
      ended = true;
    }
    function rejecter(reason) {
      if (ended) { return; }
      onCancel();
      cancellableDeferred.reject(reason);
      ended = true;
    }
    cancellableDeferred = new CancellableDeferred();
    cancellableDeferred.oncancel = onCancel;
    for (i = 0; i < length; i += 1) {
      promises[i].then(resolver, rejecter);
    }
  };

  CancellablePromise.spawn = function (generator) {
    /**
     *     spawn(generator): CancellablePromise< returned_value >
     *
     * Use generator function to do asynchronous operations sequentialy using
     * `yield` operator.
     *
     *     spawn(function* () {
     *       try {
     *         var config = yield getConfig();
     *         config.enableSomething = true;
     *         yield sleep(1000);
     *         yield putConfig(config);
     *       } catch (e) {
     *         console.error(e);
     *       }
     *     });
     *
     * @param  {Function} generator A generator function.
     * @return {CancellablePromise} A new cancellable promise
     */
    var promise, cancelled, cancellableDeferred = new CancellableDeferred(), g = generator(), prev, next = {};
    function onCancel() {
      cancelled = true;
      if (promise && typeof promise.cancel === "function") {
        try { promise.cancel(); } catch (ignore) {}
      }
    }
    cancellableDeferred.oncancel = onCancel;
    function rec(method) {
      if (cancelled) {
        return cancellableDeferred.reject(new Error("Cancelled"));
      }
      try {
        next = g[method](prev);
      } catch (e) {
        return cancellableDeferred.reject(e);
      }
      if (next.done) {
        return cancellableDeferred.resolve(next.value);
      }
      promise = next.value;
      if (!promise || typeof promise.then !== "function") {
        // The value is not a thenable. However, the user used `yield`
        // anyway. It means he wants to left hand to another process.
        promise = new Promise.resolve(promise);
      }
      return promise.then(function (value) {
        prev = value;
        rec("next");
      }, function (reason) {
        prev = reason;
        rec("throw");
      });
    }
    rec("next");
    return cancellableDeferred.promise;
  };

  CancellablePromise.sequence = function (array) {
    /**
     *     sequence(thenArray): CancellablePromise< returned_value >
     *
     * An alternative to `CancellablePromise.spawn`, but instead of using a
     * generator function, it uses an array of function like in then chains.
     * This function works with old ECMAScript version.
     *
     *     var config;
     *     sequence([function () {
     *       return getConfig();
     *     }, function (_config) {
     *       config = _config;
     *       config.enableSomething = true;
     *       return sleep(1000);
     *     }, function () {
     *       return putConfig(config);
     *     }, [null, function (e) {
     *       console.error(e);
     *     }]]);
     *
     * @param  {Array} thenArray An array of function.
     * @return {CancellablePromise} A new cancellable promise
     */
    return CancellablePromise.spawn(function () {
      var i = 0, g;
      function exec(f, value) {
        try {
          value = f(value);
          if (i === array.length) {
            return {"done": true, "value": value};
          }
          return {"value": value};
        } catch (e) {
          return g["throw"](e);
        }
      }
      g = {
        "next": function (value) {
          var f;
          while (i < array.length) {
            if (Array.isArray(array[i])) {
              f = array[i][0];
            } else {
              f = array[i];
            }
            if (typeof f === "function") {
              i += 1;
              return exec(f, value);
            }
            i += 1;
          }
          return {"done": true, "value": value};
        },
        "throw": function (value) {
          var f;
          while (i < array.length) {
            if (Array.isArray(array[i])) {
              f = array[i][1];
            }
            if (typeof f === "function") {
              i += 1;
              return exec(f, value);
            }
            i += 1;
          }
          throw value;
        }
      };
      return g;
    });
  };

  exports.CancellablePromise = CancellablePromise;

  //////////////////////////////////////////////////

  function CancellableChain(promise, onDone, onFail, previous) {
    // Can cancel promises with `promise.cancel();`.
    var it = this;
    if (!promise || typeof promise.then !== "function") {
      if (typeof onDone === "function") {
        promise = Promise.resolve(promise);
      } else {
        it._r = Promise.resolve(promise);
        return;
      }
    }
    function _onDone(v) {
      delete it._cf;
      delete it._previous;
      if (it._cancelled) { return; }
      if (typeof onDone !== "function") {
        return v;
      }
      it._value = onDone(v);
      if (it._cancelled) {
        if (it._value && typeof it._value.then === "function" && typeof it._value.cancel === "function") {
          try { it._value.cancel(); } catch (ignore) {}
        }
      }
      return it._value;
    }
    function _onFail(v) {
      delete it._cf;
      delete it._previous;
      if (it._cancelled) { return; }
      if (typeof onFail !== "function") {
        return Promise.reject(v);
      }
      it._value = onFail(v);
      if (it._cancelled) {
        if (it._value && typeof it._value.then === "function" && typeof it._value.cancel === "function") {
          try { it._value.cancel(); } catch (ignore) {}
        }
      }
      return it._value;
    }
    it._previous = previous;
    it._c = new Promise(function (d, f) {
      /*jslint unparam: true */
      it._cf = f;
    });
    it._r = Promise.race([it._c, promise.then(_onDone, _onFail)]);
  }
  CancellableChain.prototype.then = function (onDone, onFail) {
    return new CancellableChain(this._r, onDone, onFail, this);
  };
  CancellableChain.prototype.catch = function (onFail) {
    return this.then(null, onFail);
  };
  CancellableChain.prototype.cancel = function () {
    this._cancelled = true;
    if (typeof this._cf === "function") {
      try { this._cf(new Error("Cancelled")); } catch (ignore) {}
    }
    if (this._value && typeof this._value.then === "function" && typeof this._value.cancel === "function") {
      try { this._value.cancel(); } catch (ignore) {}
    }
    if (this._previous && typeof this._previous.then === "function" && typeof this._previous.cancel === "function") {
      try { this._previous.cancel(); } catch (ignore) {}
    }
  };
  CancellableChain.prototype.detach = function () {
    var p = this.then();
    p.cancel = null;
    return p;
    // return new CancellableChain(this._r);
  };
  exports.CancellableChain = CancellableChain;

  //////////////////////////////////////////////////

  function ExtendedCancellableChain() {
    CancellableChain.apply(this, arguments);
  }
  ExtendedCancellableChain.prototype = Object.create(CancellableChain.prototype);
  ExtendedCancellableChain.prototype.then = function (onDone, onFail) {
    return new ExtendedCancellableChain(this._r, onDone, onFail, this);
  };
  exports.ExtendedCancellableChain = ExtendedCancellableChain;

  function readBlobAsText(blob) {
    var d = new CancellableDeferred(), fr = new FileReader();
    fr.onload = function (ev) { return d.resolve(ev.target.result); };
    fr.onerror = function () { return d.reject(new Error("Unable to read blob as text")); };
    fr.onabort = function () { return d.reject(new Error("Cancelled")); };
    d.oncancel = function () { fr.abort(); };
    fr.readAsText(blob);
    return d.promise;
  }
  exports.readBlobAsText = readBlobAsText;

  function readBlobAsArrayBuffer(blob) {
    var d = new CancellableDeferred(), fr = new FileReader();
    fr.onload = function (ev) { return d.resolve(ev.target.result); };
    fr.onerror = function () { return d.reject(new Error("Unable to read blob as ArrayBuffer")); };
    fr.onabort = function () { return d.reject(new Error("Cancelled")); };
    d.oncancel = function () { fr.abort(); };
    fr.readAsArrayBuffer(blob);
    return d.promise;
  }
  exports.readBlobAsArrayBuffer = readBlobAsArrayBuffer;

  //////////////////////////
  // Revisited statements //
  //////////////////////////

  ExtendedCancellableChain.prototype.while = function (tester, loop) {
    var ecc = new ExtendedCancellableChain();
    return this.then(function (input) {
      var d = new CancellableDeferred(), cancelled, currentPromise;
      d.oncancel = function () {
        cancelled = true;
        currentPromise.cancel(); // can throw, don't care
      };
      function cancel() {
        d.reject(new Error("Cancelled"));
      }
      function wrappedTester() {
        if (cancelled) { return cancel(); }
        return tester(input);
      }
      function wrappedLoop() {
        if (cancelled) { return cancel(); }
        return loop(input);
      }
      function recWithLoop() {
        currentPromise = ecc.then(wrappedTester).then(function (result) {
          if (result) { return ecc.then(wrappedLoop).then(recWithLoop); }
          d.resolve();
        }).then(null, d.reject);
      }
      function recWithoutLoop() {
        currentPromise = ecc.then(wrappedTester).then(function (result) {
          if (result) { return recWithoutLoop(); }
          d.resolve();
        }).then(null, d.reject);
      }
      if (typeof loop === "function") {
        recWithLoop();
      } else {
        recWithoutLoop();
      }
      return d.promise;
    });
  };

  ExtendedCancellableChain.prototype.loop = function (callback) {
    // Infinite loop until error
    return this.while(function () {
      return true;
    }, callback);
  };

  ExtendedCancellableChain.prototype.ifelse = function (tester, onOk, onKo) {
    var input;
    return this.then(function (_input) {
      input = _input;
      return tester(input);
    }).then(function (result) {
      if (result) {
        if (typeof onOk === "function") {
          return onOk(input);
        }
      } else {
        if (typeof onKo === "function") {
          return onKo(input);
        }
      }
    });
  };

  ExtendedCancellableChain.prototype.if = function (tester, callback) {
    return this.ifelse(tester, callback);
  };

  // TODO forRange

  //////////////////////////////////////////
  // Revisited object getters and setters //
  //////////////////////////////////////////

  ExtendedCancellableChain.prototype.get = function (key, _default) {
    return this.then(function (object) {
      if (Array.isArray(key)) {
        key.forEach(function (key) {
          object = object[key];
        });
        if (object === undefined) { return _default; }
        return object;
      }
      object = object[key];
      if (object === undefined) { return _default; }
      return object;
    });
  };

  ExtendedCancellableChain.prototype.getFrom = function (object, key, _default) {
    return this.then(function () {
      if (Array.isArray(key)) {
        key.forEach(function (key) {
          object = object[key];
        });
        if (object === undefined) { return _default; }
        return object;
      }
      object = object[key];
      if (object === undefined) { return _default; }
      return object;
    });
  };

  ExtendedCancellableChain.prototype.set = function (key, value) {
    return this.then(function (object) {
      if (Array.isArray(key)) {
        key.slice(0, -1).reduce(function (prev, key) {
          return prev[key];
        }, object)[key[key.length - 1]] = value;
      }
      object[key] = value;
      return object;
    });
  };

  ExtendedCancellableChain.prototype.setTo = function (object, key) {
    return this.then(function (value) {
      if (Array.isArray(key)) {
        key.slice(0, -1).reduce(function (prev, key) {
          return prev[key];
        }, object)[key[key.length - 1]] = value;
      }
      object[key] = value;
      return object;
    });
  };

  ExtendedCancellableChain.prototype.setDefaults = function (defaults) {
    return this.then(function (object) {
      Object.keys(defaults).forEach(function (key) {
        if (object[key] === undefined) {
          object[key] = defaults[key];
        }
      });
      return object;
    });
  };

  ExtendedCancellableChain.prototype.setDefaultsTo = function (object) {
    return this.then(function (defaults) {
      Object.keys(defaults).forEach(function (key) {
        if (object[key] === undefined) {
          object[key] = defaults[key];
        }
      });
      return object;
    });
  };


  ///////////////////////
  // Revisited methods //
  ///////////////////////

  ExtendedCancellableChain.prototype.split = function (separator, limit) {
    return this.then(function (input) {
      return input.split(separator, limit);
    });
  };

  ExtendedCancellableChain.prototype.slice = function (a, b, c) {
    return this.then(function (input) {
      return input.slice(a, b, c);
    });
  };

  ExtendedCancellableChain.prototype.join = function (separator) {
    return this.then(function (input) {
      return input.join(separator);
    });
  };

  ExtendedCancellableChain.prototype.sort = function (compareFn) {
    return this.then(function (input) {
      return input.sort(compareFn);
    });
  };

  ExtendedCancellableChain.prototype.replace = function (pattern, by) {
    return this.then(function (input) {
      return input.replace(pattern, by);
    });
  };

  ExtendedCancellableChain.prototype.toSlices = function (size) {
    return this.then(function (value) {
      var l = value.length || value.size || 0, slices = [], i;
      for (i = size; i < l; i += size) {
        slices.push(value.slice(i - size, i));
      }
      if (i >= l) { slices.push(value.slice(i - size, l)); }
      return slices;
    });
  };

  ExtendedCancellableChain.prototype.forEach = function (callback) {
    var ecc = new ExtendedCancellableChain();
    return this.then(function (array) {
      if (array.length === 0) { return; }
      var i = 0;
      function wrappedCallback() { return callback(array[i], i, array); }
      function afterCallback() {
        i += 1;
        return i < array.length;
      }
      return ecc.while(function () {
        return ecc.then(wrappedCallback).then(afterCallback);
      }).then(function () { return array; });
    });
  };

  ExtendedCancellableChain.prototype.reduce = function (callback, prev) {
    var ecc = new ExtendedCancellableChain(), args = arguments;
    return this.then(function (array) {
      if (array.length === 0) { return; }
      var i = 0;
      if (args.length < 2) {
        i += 1;
        prev = array[0];
        if (array.length === 1) { return; }
      }
      function wrappedCallback() { return callback(prev, array[i], i, array); }
      function afterCallback(v) {
        prev = v;
        i += 1;
        return i < array.length;
      }
      return ecc.while(function () {
        return ecc.then(wrappedCallback).then(afterCallback);
      }).then(function () { return prev; });
    });
  };

  ExtendedCancellableChain.prototype.map = function (callback) {
    var ecc = new ExtendedCancellableChain(), newArray = [];
    return this.then(function (array) {
      if (array.length === 0) { return newArray; }
      var i = 0;
      function wrappedCallback() { return callback(array[i], i, array); }
      function afterCallback(value) {
        newArray[i] = value;
        i += 1;
        return i < array.length;
      }
      return ecc.while(function () {
        return ecc.then(wrappedCallback).then(afterCallback);
      }).then(function () { return newArray; });
    });
  };

  ExtendedCancellableChain.prototype.remap = function (callback) {
    var ecc = new ExtendedCancellableChain(), _array;
    return this.then(function (array) {
      if (array.length === 0) { return array; }
      _array = array;
      var i = 0;
      function wrappedCallback() { return callback(array[i], i, array); }
      function afterCallback(value) {
        array[i] = value;
        i += 1;
        return i < array.length;
      }
      return ecc.while(function () {
        return ecc.then(wrappedCallback).then(afterCallback);
      }).then(function () { return _array; });
    });
  };

  ExtendedCancellableChain.prototype.filter = function (tester, reverse) {
    // tester can be an object with a `test` method, a function or a simple value
    var _tester = function (value) { return value === tester; },
      newArray = [],
      ecc = new ExtendedCancellableChain();
    reverse = (reverse && reverse.reverse) || reverse === "reverse";
    if (tester) {
      if (typeof tester.test === "function") {
        _tester = function (value) { return tester.test(value); };
      } else if (typeof tester === "function") {
        _tester = tester;
      }
    }
    return this.forEach(function (value, index, array) {
      return ecc.ifelse(
        _tester.bind(null, value, index, array),
        reverse ? null : function () { newArray.push(value); },
        reverse ? function () { newArray.push(value); } : null
      );
    }).then(function () { return newArray; });
  };

  ////////////////////
  // Simple helpers //
  ////////////////////

  ExtendedCancellableChain.prototype.finally = function (fn) {
    return this.then(fn, fn).value(this);
  };

  ExtendedCancellableChain.prototype.value = function (value) {
    return this.then(function () {
      return value;
    });
  };

  ExtendedCancellableChain.prototype.call = function (thisArg, fn) {
    var args = [].slice.call(arguments, 2);
    return this.then(function (input) {
      return fn.apply(thisArg, args.concat([input]));
    });
  };

  ExtendedCancellableChain.prototype.apply = function (thisArg, fn, args) {
    return this.then(function (input) {
      return fn.apply(thisArg, [].concat(args, [input]));
    });
  };

  ///////////////
  // Modifiers //
  ///////////////

  ExtendedCancellableChain.prototype.wrapLines = function (wrap) {
    if (!(wrap > 0)) {
      return this.toText();
    }
    return this.toText().then(function (text) {
      var lines = [];
      text.split("\n").forEach(function (line) {
        while (line) {
          lines.push(line.slice(0, wrap));
          line = line.slice(wrap);
        }
      });
      return lines.join("\n");
    });
  };

  //////////////
  // Encoders //
  //////////////

  ExtendedCancellableChain.prototype.base64 = function () {
    return this.toArrayBuffer().then(arrayBufferToBase64);
  };
  ExtendedCancellableChain.prototype.unbase64 = function () {
    return this.toText().then(base64ToArrayBuffer).toBlob();
  };
  ExtendedCancellableChain.prototype.hex = function () {
    return this.toArrayBuffer().then(arrayBufferToHexadecimal);
  };
  ExtendedCancellableChain.prototype.unhex = function () {
    return this.toText().then(hexadecimalToArrayBuffer).toBlob();
  };

  /////////////
  // Hashers //
  /////////////

  // TODO md5

  /////////////
  // Ciphers //
  /////////////

  // XXX

  ////////////////
  // Converters //
  ////////////////

  ExtendedCancellableChain.prototype.toBlob = function () {
    // TODO if input === undefined, return undefined too ?
    return this.then(function (input) {
      if (input === undefined || input === null) {
        return new Blob([""]);
      }
      if (input instanceof ArrayBuffer || input.buffer instanceof ArrayBuffer) {
        return new Blob([input]);
      }
      if (input instanceof Blob) {
        return input;
      }
      return new Blob([input]);
    });
  };

  ExtendedCancellableChain.prototype.toText = function () {
    // TODO if input === undefined, return undefined too ?
    return this.then(function (input) {
      if (input === undefined || input === null) {
        return "";
      }
      if (typeof input === "string") {
        return input;
      }
      if (input instanceof Blob) {
        return readBlobAsText(input);
      }
      if (input instanceof ArrayBuffer || input.buffer instanceof ArrayBuffer) {
        return readBlobAsText(new Blob([input]));
      }
      return readBlobAsText(new Blob([input]));
    });
  };

  ExtendedCancellableChain.prototype.toArrayBuffer = function () {
    // TODO if input === undefined, return undefined too ?
    return this.then(function (input) {
      if (input === undefined || input === null) {
        return new ArrayBuffer(0);
      }
      if (input instanceof Blob) {
        return readBlobAsArrayBuffer(input);
      }
      if (input instanceof ArrayBuffer) {
        return input;
      }
      if (input.buffer instanceof ArrayBuffer) {
        return input.buffer;
      }
      return readBlobAsArrayBuffer(new Blob([input]));
    });
  };

  ExtendedCancellableChain.prototype.toDataURI = function (contentType) {
    // TODO check contentType with regex?
    // TODO remove /;base64(;|$)/ from contentType?
    return this.base64().then(function (input) {
      if (contentType === undefined) {
        contentType = "application/octet-stream";
      }
      return "data:" + contentType + ";base64," + input;
    });
  };

  ///////////////////////
  // Time manipulators //
  ///////////////////////

  ExtendedCancellableChain.prototype.sleep = function (ms) {
    return this.then(function (input) {
      var d = new CancellableDeferred(), i = setTimeout(d.resolve, ms, input);
      d.oncancel = function () {
        clearTimeout(i);
        d.fail(new Error("Cancelled"));
      };
      return d.promise;
    });
  };

  ExtendedCancellableChain.prototype.never = function () {
    return this.then(function () {
      var d = new CancellableDeferred();
      d.oncancel = function () { d.fail(new Error("Cancelled")); };
      return d.promise;
    });
  };


  /////////////////////////
  // Pop-ups and loggers //
  /////////////////////////

  ExtendedCancellableChain.prototype.log = function (prefix) {
    /*global console */
    return this.then(function (a) {
      if (prefix !== undefined) {
        console.log(prefix, a);
      } else {
        console.log(a);
      }
      return a;
    }, function (e) {
      if (prefix !== undefined) {
        console.error(prefix, e);
      } else {
        console.error(e);
      }
      throw e;
    });
  };

  ExtendedCancellableChain.prototype.alert = function (message) {
    /*global alert */
    return this.then(function (_message) {
      if (message !== undefined) { _message = message; }
      if (_message !== undefined) {
        alert(_message);
      }
      return _message;
    });
  };

  ExtendedCancellableChain.prototype.prompt = function (message, _input) {
    /*global prompt */
    return this.then(function (input) {
      if (message === undefined) { message = ""; }
      if (_input !== undefined) { return prompt(message, _input); }
      if (input !== undefined) { return prompt(message, input); }
      return prompt(message);
    });
  };

  ExtendedCancellableChain.prototype.downloadAs = function () {
    /**
     *     ecc.value(input).downloadAs("myFile", "text/plain");
     *     ecc.value(input).downloadAs({"filename": "myFile", "mimetype": "text/plain"});
     *     ecc.value(input).downloadAs({"filename": "myFile"}, "text/plain");
     *
     * Allows the user to download `input` as a file which name is defined by
     * `filename`. The `mimetype` will help the browser to choose the associated
     * application to open with.
     *
     * @param  {String} filename The file name.
     * @param  {String} mimetype The data type.
     * @return {ExtendedCancellableChain} The input in an extended cancellable chain.
     */
    var args = [].reduce.call(arguments, function (prev, value) {
      var t = typeof value;
      if (prev[t]) { prev[t].push(value); }
      return prev;
    }, {"string": [], "object": []});
    if (!args.object[0]) { args.object[0] = {}; }
    return this.then(function (input) {
      downloadAs(
        args.string.shift() || args.object[0].filename,
        args.string.shift() || args.object[0].mimetype,
        input
      );
      return input;
    });
  };

  //////////////////////
  // URI manipulators //
  //////////////////////

  ExtendedCancellableChain.prototype.ajax = function (param) {
    /**
     *    ecc.ajax({url: location, responseType: "text"}).get("data");
     *    ecc.ajax({url: location}).get("Content-Length");
     *    ecc.value(input).ajax({url: there, method: "put"})
     *
     * Send request with XHR and return a promise. xhr.onload: The promise is
     * resolved when the status code is lower than 400 with a forged response
     * object as resolved value. xhr.onerror: reject with an Error (with status
     * code in status property) as rejected value.
     *
     * @param  {Object} param The parameters
     * @param  {String} param.url The url
     * @param  {String} [param.method="GET"] The request method
     * @param  {String} [param.responseType=""] The data type to retrieve
     * @param  {String} [param.overrideMimeType] The mime type to override
     * @param  {Object} [param.headers] The headers to send
     * @param  {Any} [param.data] The data to send
     * @param  {Boolean} [param.withCredentials] Tell the browser to use
     *   credentials
     * @param  {Object} [param.xhrFields] The other xhr fields to fill
     * @param  {Boolean} [param.getEvent] Tell the method to return the
     *   response event.
     * @param  {Function} [param.beforeSend] A function called just before the
     *   send request. The first parameter of this function is the XHR object.
     * @param  {String} [param.inputKey="data"|"url"] The key to set thank to
     *   the input.
     * @return {ExtendedCancellableChain<Object>} Response object is like { data: .., header1: ..,
     *   header2: .., ... }
     */
    return this.then(function (input) {
      if (param.inputKey === undefined) {
        if (param.data === undefined) {
          param.data = input; // can be disable if param.data = null
        } else if (param.url === undefined && typeof input === "string") {
          param.url = input;
        }
      } else {
        param[param.inputKey] = input;
      }
      var d = new CancellableDeferred(), xhr = new XMLHttpRequest(), k;
      d.oncancel = function () { xhr.abort(); };
      xhr.open((param.method || "GET").toUpperCase(), param.url || param.uri, true);
      xhr.responseType = param.responseType || "";
      if (param.overrideMimeType) {
        xhr.overrideMimeType(param.overrideMimeType);
      }
      if (param.withCredentials !== undefined) {
        xhr.withCredentials = param.withCredentials;
      }
      if (param.headers) {
        for (k in param.headers) {
          if (param.headers.hasOwnProperty(k)) {
            xhr.setRequestHeader(k, param.headers[k]);
          }
        }
      }
      xhr.addEventListener("load", function (e) {
        if (param.getEvent) { return d.resolve(e); }
        var r;
        if (e.target.status < 400) {
          r = xmlHttpRequestHeadersToKeyValue(e.target.getAllResponseHeaders());
          r.data = e.target.response;
          return d.resolve(r);
        }
        r = new Error("request: " + (e.target.statusText || "unknown error"));
        r.status = e.target.status;
        return d.reject(r);
      }, false);
      xhr.addEventListener("error", function (e) {
        if (param.getEvent) { return d.resolve(e); }
        return d.reject(new Error("request: error"));
      }, false);
      xhr.addEventListener("abort", function (e) {
        if (param.getEvent) { return d.resolve(e); }
        return d.reject(new Error("request: aborted"));
      }, false);
      if (param.xhrFields) {
        for (k in param.xhrFields) {
          if (param.xhrFields.hasOwnProperty(k)) {
            xhr[k] = param.xhrFields[k];
          }
        }
      }
      if (typeof param.beforeSend === 'function') {
        param.beforeSend(xhr);
      }
      xhr.send(param.data);
      return d.promise;
    });
  };

  function methodURI(method) {
    return function (uri) {
      var it = this;
      return it.then(function () {
        var _uri = (uri && uri.uri) || uri, tmp = (/^([a-z]+):/).exec(_uri);
        if (tmp) {
          tmp = method +
                tmp[1].slice(0, 1).toUpperCase() + tmp[1].slice(1).toLowerCase() +
                "URI";
          if (typeof it[tmp] === "function") {
            return it[tmp](uri);
          }
          throw new Error("No method " + tmp + " found");
        }
        throw new Error("Cannot find URI method");
      });
    };
  }

  ExtendedCancellableChain.prototype.getURI = methodURI("get");
  ExtendedCancellableChain.prototype.putURI = methodURI("put");
  ExtendedCancellableChain.prototype.deleteURI = methodURI("delete");

  function methodHttpURI(method) {
    return function (uri) {
      var obj = {
        "method": method,
        "responseType": "blob",
        "withCredentials": true
      }, verbose;
      return this.then(function () {
        obj.uri = (uri && uri.uri) || uri;
        if ((uri && uri.verbose) || false) { verbose = true; }
      }).ajax(obj).then(function (e) {
        if (verbose) {
          e.method = method;
          e.uri = obj.uri;
          return e;
        }
        return e.data;
      });
    };
  }

  ExtendedCancellableChain.prototype.getHttpURI = methodHttpURI("GET");
  ExtendedCancellableChain.prototype.putHttpURI = methodHttpURI("PUT");
  ExtendedCancellableChain.prototype.deleteHttpURI = methodHttpURI("DELETE");
  ExtendedCancellableChain.prototype.getHttpsURI = methodHttpURI("GET");
  ExtendedCancellableChain.prototype.putHttpsURI = methodHttpURI("PUT");
  ExtendedCancellableChain.prototype.deleteHttpsURI = methodHttpURI("DELETE");
  ExtendedCancellableChain.prototype.getFileURI = methodHttpURI("GET");

  ExtendedCancellableChain.prototype.getDataURI = function (uri) {
    return this.then(function () {
      var _uri, verbose;
      _uri = (uri && uri.uri) || uri;
      if ((uri && uri.verbose) || false) { verbose = true; }
      if (verbose) {
        verbose = parseDataURIAsBlob(_uri);
        return {
          "method": "GET",
          "uri": _uri,
          "data": verbose,
          "Content-Length": verbose.size,
          "Content-Type": verbose.type
        };
      }
      return parseDataURIAsBlob(_uri);
    });
  };

  ExtendedCancellableChain.prototype.getLocalstorageURI = function (uri) {
    return this.then(function () {
      var v = localStorage.getItem(uri.replace(/^localstorage:/, ""));
      if (v === null) {
        v = new Error("localStorage: Not Found");
        v.status = 404;
        throw v;
      }
      return new Blob([v]);
    });
  };
  ExtendedCancellableChain.prototype.putLocalstorageURI = function (uri) {
    return this.toText().then(function (input) {
      localStorage.setItem(uri.replace(/^localstorage:/, ""), input);
    });
  };
  ExtendedCancellableChain.prototype.deleteLocalstorageURI = function (uri) {
    return this.then(function () {
      localStorage.removeItem(uri.replace(/^localstorage:/, ""));
    });
  };

  ///////////////////////////
  // DOM Elements creators //
  ///////////////////////////

  ExtendedCancellableChain.prototype.promptTextarea = function () {
    // TODO make it act like prompt but with a textarea
    // TODO replace prompt by this function?
    // TODO add option.placeholder
    return this.then(function () {
      var canceller = function () { return; };
      // TODO use cancellable deferred
      return new CancellablePromise(function (done, fail) {
        var textarea = document.createElement("textarea");
        textarea.style.position = "absolute";
        textarea.placeholder = "Press Ctrl+Enter to validate this textarea, or press Escape to invalidate it.";
        textarea.addEventListener("keydown", function thisFun(e) {
          if (e.key === "Esc" || e.key === "Escape" || e.keyIdentifier === "U+001B") {
            textarea.removeEventListener("keydown", thisFun);
            textarea.remove();
            fail(new Error("textarea() exited"));
          } else if ((e.key === "Enter" || e.keyIdentifier === "Enter") && e.ctrlKey === true) {
            textarea.removeEventListener("keydown", thisFun);
            done(textarea.value);
            textarea.remove();
          }
        }, false);
        document.body.insertBefore(textarea, document.body.firstChild);
        canceller = function () { textarea.remove(); };
      }, function () {
        canceller();
      });
    });
  };

  ExtendedCancellableChain.prototype.textarea = function () {
    return this.toText().then(function (text) {
      var t = document.createElement("textarea");
      t.value = text;
      return t;
    });
  };

  ExtendedCancellableChain.prototype.img = function (mime) {
    return this.toDataURL((mime && mime.contentType) || mime || "").then(function (input) {
      var i = document.createElement("img");
      i.src = input;
      return i;
    });
  };

  ExtendedCancellableChain.prototype.iframe = function () {
    return this.toDataURL("text/html").then(function (input) {
      var i = document.createElement("iframe");
      i.src = input;
      return i;
    });
  };

  //////////////////////////////////////////////////

  function BasicStream(next, previous) {
    this._next = next;
    this._previous = previous;
  }
  BasicStream.prototype.next = function () {
    if (this._closed) { return Promise.resolve({done: true}); }
    return this._next();
  };
  BasicStream.prototype.close = function () {
    this._closed = true;
    if (this._previous && typeof this._previous.close === "function") {
      this._previous.close();
    }
  };
  exports.BasicStream = BasicStream;

  //////////////////////////////////////////////////

  function StreamableChain(streamable, previous, onNext) {
    this._streamable = streamable || StreamableChain.ended;
    this._previous = previous;
    this._onNext = onNext;
  }
  StreamableChain.ended = {
    toStream: function () {
      return new BasicStream(function () {
        return Promise.resolve({"done": true});
      });
    }
  };
  StreamableChain.blackHole = {
    push: function () {
      return;
    }
  };
  StreamableChain.prototype.stream = function (onNext) {
    return new StreamableChain(this, this, onNext);
  };
  StreamableChain.prototype.toStream = function () {
    if (typeof this._onNext !== "function") {
      return this._streamable.toStream();
    }
    var stream = this._streamable.toStream();
    return new BasicStream(this._onNext.bind(null, stream), this._streamable.toStream());
  };
  exports.StreamableChain = StreamableChain;

  //////////////////////////////////////////////////

  function ExtendedStreamableChain() {
    StreamableChain.apply(this, arguments);
  }
  ExtendedStreamableChain.prototype = Object.create(StreamableChain.prototype);
  ExtendedStreamableChain.prototype.stream = function (onNext) {
    return new ExtendedStreamableChain(this, this, onNext);
  };
  ExtendedStreamableChain.pipe = function (stream, pushable) {
    var ecc = new ExtendedCancellableChain();
    return ecc.while(function () {
      return ecc.value(stream.next()).then(function (next) {
        if (next.done) { return false; }
        return ecc.value(next.value).call(pushable, pushable.push).value(true);
      });
    }).value(pushable);
  };
  ExtendedStreamableChain.makeBasicStreamer = function (onInit, onNext, onEnd) {
    var vars = {}, ecc = new ExtendedCancellableChain(), first = true, last;
    if (typeof onInit !== "function") { onInit = function () { return; }; }
    if (typeof onNext !== "function") { onNext = function () { return; }; }
    if (typeof onEnd !== "function") { onEnd = function () { return; }; }
    return function rec(stream) {
      if (first) {
        first = false;
        ecc = ecc.call(vars, onInit);
      }
      ecc = ecc.then(function () {
        if (last) { return {"done": true}; }
        return ecc.call(stream, stream.next).then(function (next) {
          if (next.done) {
            last = true;
            return ecc.call(vars, onEnd).then(function (value) {
              if (value === undefined) {
                return {"done": true};
              }
              return {value: value};
            });
          }
          return ecc.call(vars, onNext).then(function (value) {
            if (value === undefined) {
              return rec(stream);
            }
            return {value: value};
          });
        });
      });
      return ecc;
    };
  };
  exports.ExtendedStreamableChain = ExtendedStreamableChain;

  ////////////////
  // Generators //
  ////////////////

  ExtendedStreamableChain.prototype.infinite = function (value) {
    return this.stream(function () {
      return Promise.resolve({value: value});
    });
  };

  ExtendedStreamableChain.prototype.random = function () {
    return this.stream(function () {
      return Promise.resolve({value: Math.random()});
    });
  };

  ExtendedStreamableChain.prototype.counter = function () {
    var count = 0;
    return this.stream(function () {
      count += 1;
      return Promise.resolve({value: count});
    });
  };

  ExtendedStreamableChain.prototype.range = function (end) {
    // TODO function (start, end) {
    // TODO function (start, end, step) {
    var start = -1;
    return this.stream(function () {
      start += 1;
      if (start === end) { return Promise.resolve({done: true}); }
      return Promise.resolve({value: start});
    });
  };

  ///////////////
  // Injecters //
  ///////////////

  ExtendedStreamableChain.prototype.prepend = function (chunk) {
    // TODO chunkList ?
    var done;
    return this.stream(function (stream) {
      if (done) {
        return stream.next();
      }
      done = true;
      return {value: chunk};
    });
  };

  // XXX ExtendedStreamableChain.prototype.append = function (chunk) {

  /////////////
  // Loggers //
  /////////////

  ExtendedStreamableChain.prototype.log = function () {
    var ecc = new ExtendedCancellableChain();
    return this.stream(function (stream) {
      return ecc.value(stream.next()).then(function (next) {
        if (next.done) { return next; }
        console.log(next.value);
        return next;
      });
    });
  };

  ///////////////
  // Modifiers //
  ///////////////

  // XXX ExtendedStreamableChain.prototype.lines = function () {
  // XXX ExtendedStreamableChain.prototype.wrapLines = function () {

  ////////////////
  // Converters //
  ////////////////

  ExtendedStreamableChain.prototype.toBlobs = function () {
    var ecc = new ExtendedCancellableChain();
    return this.stream(function (stream) {
      return ecc.call(stream, stream.next).then(function (next) {
        if (next.done) { return {"done": true}; }
        return ecc.value(next.value).toBlob().then(function (value) {
          return {value: value};
        });
      });
    });
  };
  ExtendedStreamableChain.prototype.toTexts = function () {
    var ecc = new ExtendedCancellableChain();
    return this.stream(function (stream) {
      return ecc.call(stream, stream.next).then(function (next) {
        if (next.done) { return {"done": true}; }
        return ecc.value(next.value).toText().then(function (value) {
          return {value: value};
        });
      });
    });
  };
  ExtendedStreamableChain.prototype.toArrayBuffers = function () {
    var ecc = new ExtendedCancellableChain();
    return this.stream(function (stream) {
      return ecc.call(stream, stream.next).then(function (next) {
        if (next.done) { return {"done": true}; }
        return ecc.value(next.value).toArrayBuffer().then(function (value) {
          return {value: value};
        });
      });
    });
  };
  ExtendedStreamableChain.prototype.toDataURIs = function (contentType) {
    var ecc = new ExtendedCancellableChain();
    return this.stream(function (stream) {
      return ecc.call(stream, stream.next).then(function (next) {
        if (next.done) { return {"done": true}; }
        return ecc.value(next.value).toDataURI(contentType).then(function (value) {
          return {value: value};
        });
      });
    });
  };
  ExtendedStreamableChain.prototype.toDataURI = function (contentType) {
    // TODO check contentType with regex?
    // TODO remove /;base64(;|$)/ from contentType?
    var done;
    return this.base64().stream(function (stream) {
      if (done) {
        return stream.next();
      }
      done = true;
      if (contentType === undefined) {
        contentType = "application/octet-stream";
      }
      return {value: "data:" + contentType + ";base64,"};
    });
  };

  /////////////
  // Filters //
  /////////////

  ExtendedStreamableChain.prototype.filter = function (tester, option) {
    // tester can be an object with a `test` method, a function or a simple value
    var ecc = new ExtendedCancellableChain();
    return this.stream(ExtendedStreamableChain.makeBasicStreamer(function () {
      this.tester = function (value) { return value === tester; };
      this.index = 0;
      this.reverse = (option && option.reverse) || option === "reverse";
      if (tester) {
        if (typeof tester.test === "function") {
          this.tester = function (value) { return tester.test(value); };
        } else if (typeof tester === "function") {
          this.tester = tester;
        }
      }
    }, function (value) {
      /*jslint plusplus: true */
      return ecc.value(this.tester(value, this.index++)).ifelse(function (r) {
        return r;
      }, this.reverse ? null : function () {
        return value;
      }, this.reverse ? function () {
        return value;
      } : null);
    }));
  };

  // XXX ExtendedStreamableChain.prototype.limit = function (start, length) {
  // XXX ExtendedStreamableChain.prototype.grep = function (xxx) {

  //////////////
  // Encoders //
  //////////////

  ExtendedStreamableChain.prototype.base64 = function () {
    return this.toArrayBuffers().stream(ExtendedStreamableChain.makeBasicStreamer(function () {
      this.remaining = "";
    }, function (chunk) {
      chunk = arrayBufferToBinaryString(chunk);
      var tmp;
      if (this.remaining) {
        chunk = this.remaining + chunk;
      }
      if (chunk.length % 3) {
        tmp = chunk.length - (chunk.length % 3);
        this.remaining = chunk.slice(tmp);
        chunk = chunk.slice(0, tmp);
      }
      if (chunk.length > 2) {
        return btoa(chunk);
      }
    }, function () {
      if (this.remaining) {
        return btoa(this.remaining);
      }
    }));
  };

  ExtendedStreamableChain.prototype.unbase64 = function () {
    return this.toTexts().stream(ExtendedStreamableChain.makeBasicStreamer(function () {
      this.remaining = "";
    }, function (chunk) {
      var tmp;
      if (this.remaining) {
        chunk = this.remaining + chunk;
      }
      if (chunk.length % 4) {
        tmp = chunk.length - (chunk.length % 4);
        this.remaining = chunk.slice(tmp);
        chunk = chunk.slice(0, tmp);
      }
      if (chunk.length > 3) {
        return binaryStringToArrayBuffer(atob(chunk));
      }
    }, function () {
      if (this.remaining) {
        return binaryStringToArrayBuffer(atob(this.remaining));
      }
    })).toBlobs();
  };

  ExtendedStreamableChain.prototype.hex = function () {
    return this.toArrayBuffers().stream(ExtendedStreamableChain.makeBasicStreamer(function () {
      return;
    }, function (chunk) {
      if (chunk.byteLength > 0) {
        return binaryStringToHexadecimal(arrayBufferToBinaryString(chunk));
      }
    }, function () {
      return;
    }));
  };

  ExtendedStreamableChain.prototype.unhex = function () {
    return this.toTexts().stream(ExtendedStreamableChain.makeBasicStreamer(function () {
      this.remaining = "";
    }, function (chunk) {
      if (this.remaining) {
        chunk = this.remaining + chunk;
      }
      if (chunk.length % 2) {
        this.remaining = chunk.slice(-1);
        chunk = chunk.slice(0, -1);
      }
      if (chunk.length > 1) {
        return binaryStringToArrayBuffer(hexadecimalToBinaryString(chunk));
      }
    }, function () {
      if (this.remaining) {
        return binaryStringToArrayBuffer(hexadecimalToBinaryString(this.remaining + "0"));
      }
    })).toBlobs();
  };

  /////////////
  // Hashers //
  /////////////

  // XXX md5, sha1, ...

  /////////////
  // Ciphers //
  /////////////

  // XXX

  ///////////////////////
  // Time manipulators //
  ///////////////////////

  // XXX sleep

  /////////////
  // Pullers //
  /////////////

  ExtendedStreamableChain.prototype.pullAllTo = function (pushable) {
    return this.stream(function (stream) {
      return ExtendedStreamableChain.pipe(stream, pushable).value({done: true});
    });
  };

  ExtendedStreamableChain.prototype.blackHole = function () {
    return this.pullAllTo(StreamableChain.blackHole);
  };

  ExtendedStreamableChain.prototype.count = function () {
    var obj = {value: 0}, pushable = {push: function () {
      obj.value += 1;
    }};
    return this.stream(function (stream) {
      if (obj.value) { return Promise.resolve({done: true}); }
      return ExtendedStreamableChain.pipe(stream, pushable).value(obj);
    });
  };

}((function () {
  "use strict";
  /*global exports, window */
  try {
    return exports;
  } catch (ignored) {
    window.toolbox = {};
    return window.toolbox;
  }
}())));
