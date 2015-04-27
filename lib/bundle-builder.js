/*jslint indent: 2 */
(function script() {
  "use strict";
  /*! Copyright (c) 2015 Tristan Cavelier <t.cavelier@free.fr>
      This program is free software. It comes without any warranty, to
      the extent permitted by applicable law. You can redistribute it
      and/or modify it under the terms of the Do What The Fuck You Want
      To Public License, Version 2, as published by Sam Hocevar. See
      http://www.wtfpl.net/ for more details. */

  /*global window, document, console, Blob,
           exports, toolbox */
  var bundleBuilder = {}, ecc = new toolbox.ExtendedCancellableChain();
  if (typeof exports === "object" && exports !== null) {
    bundleBuilder = exports;
  } else if (typeof window === "object" && window !== null) {
    window.bundleBuilder = bundleBuilder;
  }
  bundleBuilder.toScript = function () {
    return "/*jslint indent: 2 */\n(" + script.toString() + "());\n";
  };

  toolbox.ExtendedCancellableChain.prototype.getStringURI = function (uri) {
    return this.then(function () {
      return new Blob(uri.replace(/^string:/, ""), {"type": "text/plain"});
    });
  };

  bundleBuilder.build = function (param) {
    /*
    param example: {
      "logInto": "body",
      "jsDestination": "https://my.domain.com/dev/my-app-bundle.js",
      "cssDestination": "https://my.domain.com/dev/my-app-bundle.css",
      "appCacheDestination": "https://my.domain.com/dev/my-app-bundle.appcache",
      "jsList": [
        "https://rawgit.com/douglascrockford/JSLint/master/jslint.js",
        "https://my.domain.com/dev/my-app.js"
      ],
      "cssList": [
        "https://my.domain.com/dev/my-app.css"
      ],
      "appCacheList": [
        "https://rawgit.com/me/apps/master/my-app-bundle.js",
        "https://rawgit.com/me/apps/master/my-app-bundle.css",
        "https://rawgit.com/me/apps/master/logo.png"
      ]
    };
    */
    var logInto = param.logInto, jsBlob, cssBlob;
    if (typeof logInto === "string") {
      logInto = document.querySelector(logInto);
    }
    function log(v) {
      console.log(v);
      if (logInto) {
        var pre = document.createElement("pre");
        pre.textContent = v;
        logInto.appendChild(pre);
      }
      return v;
    }
    function error(e) {
      console.error(e);
      if (logInto) {
        var pre = document.createElement("pre");
        pre.textContent = e;
        pre.style.color = "red";
        logInto.appendChild(pre);
      }
      throw e;
    }

    ecc.value(param).json(null, 2).then(log).confirm("Run build?").then(function (answer) {
      if (!answer) {
        throw "Aborted";
      }
      log("starting");
      return param.jsList;
    }).forEach(function (uri, i, array) {
      log("getting " + uri);
      return ecc.getURI(uri).then(function (blob) {
        return new Blob([
          "//////////////////////////////////////////////////////////////////////\n// BEGIN " + uri + "\n",
          blob,
          "// END " + uri + "\n"
        ]);
      }).setTo(array, i);
    }).then(function (blobList) {
      jsBlob = new Blob(blobList);
      return param.cssList;
    }).forEach(function (uri, i, array) {
      log("getting " + uri);
      return ecc.getURI(uri).then(function (blob) {
        return new Blob([
          "/********************************************************************/\n/* BEGIN " + uri + " */\n",
          blob,
          "/* END " + uri + " */\n"
        ]);
      }).setTo(array, i);
    }).then(function (blobList) {
      cssBlob = new Blob(blobList);
      log("putting " + param.jsDestination);
      return jsBlob;
    }).putURI(param.jsDestination).then(function () {
      log("putting " + param.cssDestination);
      return cssBlob;
    }).putURI(param.cssDestination).then(function () {
      log("putting " + param.appCacheDestination);
      return new Blob(["CACHE MANIFEST\n" +
                       "#" + toolbox.generateUUID() + "\n" +
                       "NETWORK:\n*\nCACHE:\n" +
                       param.appCacheList.join("\n") + "\n"]);
    }).putURI(param.appCacheDestination).value("Success!").then(log, error);
  };

  return bundleBuilder;
}());
