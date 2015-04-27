/*jslint indent: 2 */
(function run(now) {
  "use strict";
  /*global window, document, toolbox, jsTerminal */
  if (!now) {
    if (document.body) {
      return run(true) && null;
    }
    return window.addEventListener("load", run) && null;
  }

  window.help = document.createElement("div");
  window.help.innerHTML = jsTerminal.help;

  Object.keys(jsTerminal.commands).forEach(function (commandName) {
    window[commandName] = jsTerminal.commands[commandName];
  });

  jsTerminal.create({
    "root": "body",
    "rc": "localstorage:.js-terminal-rc", // optional
    "onError": function (reason) { window.ERR = reason; }, // optional
    "onValue": function (value) { window.RET = value; }, // optional
    "onAnswer": function (answer) { window.ANS = answer; } // optional
  });

}());
