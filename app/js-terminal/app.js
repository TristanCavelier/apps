/*jslint indent: 2 */
(function (bootstrap) {
  "use strict";
  /*global window, toolbox */
  var defaultParameters = {
    "defaultToolbox": toolbox, // default toolbox
    "exportTo": window, // default throws
    "root": "body", // default throws
    "rc": "localstorage:.js-terminal-rc", // defaults empty

    "exportHelp": true, // default false
    "helpName": "help", // default "HELP"
    "exportHelpTo": window, // default @exportTo

    "exportHelpers": true, // default false
    "extendedCancellableChainName": "ecc", // default "ecc"
    "extendedStreamableChainName": "esc", // default "esc"
    "exportHelpersTo": window, // default @exportTo

    "exportCommandHistory": true, // default false
    "commandHistoryName": "HIST", // default "HIST"
    "exportCommandHistoryTo": window, // default "HIST"

    "exportReturnedValues": true, // default false
    "exportReturnedValuesTo": window, // default @exportTo

    "exportFunctions": true, // default false
    "exportFunctionsTo": window // default @exportTo
  };
  if (window.document.body) {
    return bootstrap(defaultParameters);
  }
  window.addEventListener("load", function rec() {
    window.removeEventListener("load", rec);
    bootstrap(defaultParameters);
  });
}(function (param) {
  "use strict";
  /*! Copyright (c) 2015 Tristan Cavelier <t.cavelier@free.fr>
      This program is free software. It comes without any warranty, to
      the extent permitted by applicable law. You can redistribute it
      and/or modify it under the terms of the Do What The Fuck You Want
      To Public License, Version 2, as published by Sam Hocevar. See
      http://www.wtfpl.net/ for more details. */

  /*jslint indent: 2 */
  /*global HTMLElement, localStorage, setTimeout, document, alert, window, toolbox */

  var tmp, tmp2,
    tb = param.defaultToolbox || toolbox,
    ecc = new tb.ExtendedCancellableChain(),
    esc = new tb.ExtendedStreamableChain(),
    HIST = [],
    terminal = param.root,
    exports = param.exportTo,
    returnedValues = param.exportReturnedValues && (param.exportReturnedValuesTo || exports);

  if (typeof exports !== "object" && exports === null) {
    throw new Error("Parameter exportTo should be an object");
  }
  if (terminal === undefined) {
    throw new Error("Parameter root should be defined");
  }


  if (param.exportCommandHistory) {
    (param.exportCommandHistoryTo || exports)[param.commandHistoryName || "HIST"] = HIST;
  }


  if (param.exportHelp) {
    tmp = param.exportHelpTo || exports;
    tmp2 = param.helpName || "HELP";
    tmp[tmp2] = document.createElement("div");
    tmp[tmp2].insertAdjacentHTML(
      "beforeend",
      '  <p>This terminal is a simple <span style="color: magenta">Javascript</span> console.</p>' +
        '<p>' +
        '  It shows the return value of what you type. It handles special return values like' +
        '  <span style="color: green">HTMLElement</span> and <span style="color: green">Promise</span>.' +
        '</p>' +
        '<p>' +
        '  The `<code style="color: blue">dir(..)</code>` function shows object properties,' +
        '  it is useful to know what kind of object you are manipulating.' +
        '  (see `<code style="color: blue">dir(window)</code>`.)' +
        '</p>' +
        '<p>Use <span style="color: yellow">Ctrl-ArrowUp</span> or <span style="color: yellow">Ctrl-ArrowDown</span> to browse command history</p>' +
        '<p>See source code on <a href="https://github.com/TristanCavelier/apps/tree/master/app/js-terminal">github</a>!</p>'
    );
  }


  if (param.exportHelpers) {
    tmp = param.exportHelpersTo || exports;
    tmp2 = param.extendedCancellableChainName || "ecc";
    tmp[tmp2] = ecc;
    tmp2 = param.extendedStreamableChainName || "esc";
    tmp[tmp2] = esc;
  }


  function termEval(text) {
    /*jslint evil: true */
    return window.eval(text);
  }


  if (param.exportFunctions) {
    tmp = param.exportFunctionsTo || exports;

    tmp.termEval = termEval;

    tmp.dir = function (obj) {
      /*jslint forin: true */
      var k, s = [];
      for (k in obj) {
        if (k[0] !== "_") {
          s.push(k);
        }
      }
      return s;
    };

    tmp.img = function (src) {
      var i = document.createElement("img");
      i.src = src;
      return i;
    };

    tmp.iframe = function (src) {
      var i = document.createElement("iframe");
      i.src = src;
      return i;
    };

    tmp.textarea = function (value) {
      var t = document.createElement("textarea");
      if (value !== undefined) { t.value = value; }
      return t;
    };

    tmp.textareaEdit = function (uri) {
      /*jslint vars: true */
      var root = document.createElement("div");
      var textarea = document.createElement("textarea");
      var saveButton = document.createElement("button");
      var stateSpan = document.createElement("span");
      var titleSpan = document.createElement("span");
      var exitButton = document.createElement("button");
      stateSpan.textContent = " - Loading ";
      ecc.getURI(uri).toText().setTo(textarea, "value").then(function () {
        root.appendChild(textarea);
        stateSpan.textContent = "";
      }, function (error) {
        if (error && error.status === 404) {
          root.appendChild(textarea);
          stateSpan.textContent = " - New resource ";
          return;
        }
        alert(error);
      });
      saveButton.textContent = "Save";
      saveButton.addEventListener("click", function () {
        stateSpan.textContent = "- Saving ";
        textarea.readOnly = true;
        ecc.value(textarea.value).putURI(uri).catch(alert).then(function () {
          textarea.readOnly = false;
          stateSpan.textContent = "";
        });
      });
      titleSpan.textContent = " textarea editor - <" + uri + "> ";
      exitButton.textContent = "Close";
      exitButton.addEventListener("click", root.remove.bind(root));
      root.appendChild(saveButton);
      root.appendChild(titleSpan);
      root.appendChild(stateSpan);
      root.appendChild(exitButton);
      return root;
    };

    tmp.edit = tmp.textareaEdit;

    tmp.showLinks = function (uri) {
      return ecc.getURILinks(uri).then(tb.linksToHTMLElement);
    };

    tmp.links = tmp.showLinks;
  }


  // Load terminal element
  if (!(terminal instanceof HTMLElement)) {
    terminal = document.querySelector(terminal);
  }


  tmp = ecc;
  tmp2 = param.rc;
  // Load rc
  if (tmp2) {
    tmp = tmp.then(function () {
      return ecc.getURI(tmp2).catch(function (reason) {
        if (returnedValues) { returnedValues.ERR = reason; }
        if (reason && reason.status !== 404) {
          alert(reason);
        }
        return "";
      });
    }).call(null, termEval).catch(function (reason) {
      if (returnedValues) { returnedValues.ERR = reason; }
      alert(reason);
    });
  }
  tmp.loop(function () {
    var historyIndex = HIST.length, valueIndex = HIST.length;
    HIST[valueIndex] = "";
    return ecc.then(function () {
      var input = document.createElement("textarea"), validate = document.createElement("button");
      input.className = "prompt";
      input.placeholder = "> Type your command here. Type `help` for more information.";
      input.setAttribute("rows", 1);
      setTimeout(function () { input.focus(); });
      terminal.appendChild(input);
      validate.textContent = "Execute";
      validate.className = "prompt-button";
      terminal.appendChild(validate);
      return new Promise(function (done) {
        function historyUp() {
          if (historyIndex === HIST.length - 1) {
            HIST[valueIndex] = input.value;
          }
          if (historyIndex > 0) {
            historyIndex -= 1;
            input.value = HIST[historyIndex];
          }
        }
        function historyDown() {
          if (historyIndex < HIST.length - 1) {
            historyIndex += 1;
            input.value = HIST[historyIndex];
          }
        }
        function updatePrompt() {
          input.setAttribute("rows", input.value.split("\n").length || 1);
        }
        function submit() {
          /*global onKeyDown */
          if (input.value === "") { return; }
          input.removeEventListener("keydown", onKeyDown);
          input.setAttribute("class", input.getAttribute("class") + " disabled");
          input.disabled = true;
          validate.removeEventListener("click", submit);
          validate.remove();
          done(input.value);
        }
        function onKeyDown(ev) {
          setTimeout(updatePrompt);
          if (ev.ctrlKey) {
            if (ev.key === "ArrowUp" || ev.key === "Up" || ev.keyIdentifier === "Up") {
              historyUp();
            } else if (ev.key === "ArrowDown" || ev.key === "Down" || ev.keyIdentifier === "Down") {
              historyDown();
            }
          }
          if (ev.key === "Enter" || ev.keyIdentifier === "Enter") {
            if (!ev.shiftKey) {
              ev.preventDefault();
              submit();
            }
          }
        }
        validate.addEventListener("click", submit);
        input.addEventListener("keydown", onKeyDown);
      });
    }).then(function (inputValue) {
      var output = document.createElement("div");
      output.className = "output";
      terminal.appendChild(output);
      HIST[valueIndex] = inputValue;
      return ecc.then(function () {
        var RET = termEval(inputValue);
        if (returnedValues) { returnedValues.RET = RET; }
        return RET;
      }).then(function (eVal) {
        var pre;
        if (returnedValues) { returnedValues.ANS = eVal; }
        if (eVal instanceof HTMLElement) {
          output.appendChild(eVal);
          return;
        }
        if (eVal && typeof eVal.toStream === "function") {
          return tb.ExtendedStreamableChain.pipe(eVal.toStream(), {push: function (pushed) {
            var span;
            if (pushed instanceof HTMLElement) {
              output.appendChild(pushed);
              pre = null;
            } else {
              if (!pre) {
                pre = document.createElement("pre");
                output.appendChild(pre);
              }
              span = document.createElement("span");
              span.textContent = pushed;
              pre.appendChild(span);
            }
          }});
        }
        pre = document.createElement("pre");
        pre.textContent = eVal;
        output.appendChild(pre);
      }).catch(function (e) {
        var pre = document.createElement("pre");
        if (returnedValues) { returnedValues.ERR = e; }
        pre.textContent = e;
        pre.style.color = "red";
        output.appendChild(pre);
      });
    });
  });

}));
