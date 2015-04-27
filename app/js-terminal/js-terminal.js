/*jslint indent: 2 */
(function script() {
  "use strict";
  /*! Copyright (c) 2015 Tristan Cavelier <t.cavelier@free.fr>
      This program is free software. It comes without any warranty, to
      the extent permitted by applicable law. You can redistribute it
      and/or modify it under the terms of the Do What The Fuck You Want
      To Public License, Version 2, as published by Sam Hocevar. See
      http://www.wtfpl.net/ for more details. */

  /*global window, document, HTMLElement, alert, setTimeout,
           toolbox, exports */
  var jsTerminal = {}, ecc = new toolbox.ExtendedCancellableChain();
  if (typeof exports === "object" && exports !== null) {
    jsTerminal = exports;
  } else if (typeof window === "object" && window !== null) {
    window.jsTerminal = jsTerminal;
  }
  jsTerminal.toScript = function () {
    return "/*jslint indent: 2 */\n(" + script.toString() + "());\n";
  };

  jsTerminal.help =
    '<p>This terminal is a simple <span style="color: magenta">Javascript</span> console.</p>' +
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
    '<p>See source code on <a href="https://github.com/TristanCavelier/apps/tree/master/app/js-terminal">github</a>!</p>';

  function termEval(text) {
    /*jslint evil: true */
    return window.eval(text);
  }
  jsTerminal.termEval = termEval;

  jsTerminal.commands = {};

  jsTerminal.commands.dir = function (obj) {
    /*jslint forin: true */
    var k, s = [];
    for (k in obj) {
      if (k[0] !== "_") {
        s.push(k);
      }
    }
    return s;
  };

  jsTerminal.commands.cat = function () {
    // cat(uri1, uri2, ...)
    return ecc.value([].slice.call(arguments)).forEach(function (uri, i, array) {
      return ecc.getURI(uri).toText().setTo(array, i);
    }).join("");
  };

  jsTerminal.commands.rm = function () {
    // rm(uri1, uri2, ...)
    return ecc.value([].slice.call(arguments)).forEach(function (uri) {
      return ecc.deleteURI(uri);
    }).join("");
  };

  jsTerminal.commands.cp = function (src, dest) {
    return ecc.getURI(src).putURI(dest).toText();
  };

  jsTerminal.commands.showLinks = function (uri) {
    return ecc.getURILinks(uri).then(toolbox.linksToHTMLElement);
  };

  jsTerminal.commands.links = jsTerminal.commands.showLinks;

  jsTerminal.commands.textareaEdit = function (uri) {
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
      return ecc.alert(error);
    });
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", function () {
      stateSpan.textContent = " - Saving ";
      textarea.readOnly = true;
      ecc.value(textarea.value).putURI(uri).catch(ecc.alert.bind(ecc)).then(function () {
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

  jsTerminal.commands.edit = jsTerminal.commands.textareaEdit;

  jsTerminal.commands.img = function (src) {
    var i = document.createElement("img");
    i.src = src;
    return i;
  };

  jsTerminal.commands.iframe = function (src) {
    var i = document.createElement("iframe");
    i.src = src;
    return i;
  };

  jsTerminal.commands.textarea = function (value) {
    var t = document.createElement("textarea");
    if (value !== undefined) { t.value = value; }
    return t;
  };

  jsTerminal.create = function (param) {
    var rc = param.rc || null, root = param.root, historyList = [],
      onError = param.onError, onValue = param.onValue, onAnswer = param.onAnswer,
      tmp;
    if (typeof root === "string") {
      root = document.querySelector(root);
    }

    tmp = ecc;
    // load rc
    if (rc) {
      tmp = tmp.then(function () {
        return ecc.getURI(rc).catch(function (reason) {
          if (typeof onError === "function") { try { onError(reason); } catch (ignore) {} }
          if (reason && reason.status !== 404) {
            alert(reason);
          }
          return "";
        });
      }).call(null, termEval).catch(function (reason) {
        if (typeof onError === "function") { try { onError(reason); } catch (ignore) {} }
        alert(reason);
      });
    }

    tmp.loop(function () {
      var historyIndex = historyList.length, valueIndex = historyList.length;
      historyList[valueIndex] = "";
      return ecc.then(function () {
        var input = document.createElement("textarea"), validate = document.createElement("button");
        input.className = "prompt";
        input.placeholder = "> Type your command here. Type `help` for more information.";
        input.setAttribute("rows", 1);
        setTimeout(function () { input.focus(); });
        root.appendChild(input);
        validate.textContent = "Execute";
        validate.className = "prompt-button";
        root.appendChild(validate);
        return new Promise(function (done) {
          function historyUp() {
            if (historyIndex === historyList.length - 1) {
              historyList[valueIndex] = input.value;
            }
            if (historyIndex > 0) {
              historyIndex -= 1;
              input.value = historyList[historyIndex];
            }
          }
          function historyDown() {
            if (historyIndex < historyList.length - 1) {
              historyIndex += 1;
              input.value = historyList[historyIndex];
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
        root.appendChild(output);
        historyList[valueIndex] = inputValue;
        return ecc.then(function () {
          var RET = termEval(inputValue);
          if (typeof onValue === "function") { try { onValue(RET); } catch (ignore) {} }
          return RET;
        }).then(function (eVal) {
          var pre;
          if (typeof onAnswer === "function") { try { onAnswer(eVal); } catch (ignore) {} }
          if (eVal instanceof HTMLElement) {
            output.appendChild(eVal);
            return;
          }
          if (eVal && typeof eVal.toStream === "function") {
            return toolbox.ExtendedStreamableChain.pipe(eVal.toStream(), {push: function (pushed) {
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
          if (typeof onError === "function") { try { onError(e); } catch (ignore) {} }
          pre.textContent = e;
          pre.style.color = "red";
          output.appendChild(pre);
        });
      });
    });
  };


  return jsTerminal;
}());