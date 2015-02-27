/*! Copyright (c) 2015 Tristan Cavelier <t.cavelier@free.fr>
    This program is free software. It comes without any warranty, to
    the extent permitted by applicable law. You can redistribute it
    and/or modify it under the terms of the Do What The Fuck You Want
    To Public License, Version 2, as published by Sam Hocevar. See
    http://www.wtfpl.net/ for more details. */

/*jslint indent: 2, evil: true */
/*global HTMLElement, localStorage, setTimeout, document, alert, window, toolbox */

var HELP = document.createElement("div");
HELP.insertAdjacentHTML(
  "beforeend",
  '  <p>This terminal is a simple <span style="color: magenta">Javascript</span> console.</p>' +
    '<p>' +
    '  It shows the return value of what you type. It handles special return values like' +
    '  <span style="color: green">HTMLElement</span> and <span style="color: green">Promise</span>.' +
    '</p>' +
    '<p>' +
    '  The `<code style="color: blue">dir(..)</code>` function shows object properties,' +
    '  it is useful to know what kind of object you are manipulating.' +
    '  (see `<code style="color: blue">dir(ecc)</code>`.)' +
    '</p>' +
    '<p>Use <span style="color: yellow">Ctrl-ArrowUp</span> or <span style="color: yellow">Ctrl-ArrowDown</span> to browse command history</p>' +
    '<p>See source code on <a href="https://github.com/TristanCavelier/apps/tree/master/app/js-terminal">github</a>!</p>'
);

var RET;
var ANS;
var ERR;
var HIST = [];

var help = HELP;

var ecc = new toolbox.ExtendedCancellableChain();
(function () {
  "use strict";

  // Load terminal
  var terminal = document.createElement("div");
  document.body.appendChild(terminal);
  ecc.loop(function () {
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
      var output = document.createElement("div"), pre = document.createElement("pre");
      output.className = "output";
      terminal.appendChild(output);
      HIST[valueIndex] = inputValue;
      return ecc.then(function () {
        RET = window.eval(inputValue);
        return RET;
      }).then(function (eVal) {
        ANS = eVal;
        if (!(eVal instanceof HTMLElement)) {
          pre.textContent = eVal;
          eVal = pre;
        }
        output.appendChild(eVal);
      }).catch(function (e) {
        ERR = e;
        pre.textContent = e;
        output.appendChild(pre);
      });
    });
  });
}());

function dir(obj) {
  "use strict";
  /*jslint forin: true */
  var k, s = [];
  for (k in obj) {
    if (k[0] !== "_") {
      s.push(k);
    }
  }
  return s;
}

function img(src) {
  "use strict";
  var i = document.createElement("img");
  i.src = src;
  return i;
}

function iframe(src) {
  "use strict";
  var i = document.createElement("iframe");
  i.src = src;
  return i;
}

function textareaEdit(uri) {
  "use strict";
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
}

var edit = textareaEdit;

// Load js-terminal-rc from localStorage
try {
  window.eval(localStorage.getItem(".js-terminal-rc"));
} catch (e) {
  ERR = e;
}
