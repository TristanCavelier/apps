/*jslint indent: 2 */
(function (bootstrap) {
  "use strict";
  /*global window */
  if (window.document.body) {
    return bootstrap(0);
  }
  window.addEventListener("load", function rec() {
    window.removeEventListener("load", rec);
    bootstrap(0);
  });
}(function (param) {
  "use strict";
  /*! Copyright (c) 2015 Tristan Cavelier <t.cavelier@free.fr>
      This program is free software. It comes without any warranty, to
      the extent permitted by applicable law. You can redistribute it
      and/or modify it under the terms of the Do What The Fuck You Want
      To Public License, Version 2, as published by Sam Hocevar. See
      http://www.wtfpl.net/ for more details. */

  /*jslint indent: 2, vars: true, nomen: true */
  /*global window, document, location, alert, prompt, confirm, setTimeout,
           toolbox, CodeMirror */

  var originalPageTitle = document.title;

  ///////////
  // Tools //
  ///////////

  // Object.keys(CodeMirror.mimeModes).map(function (mime) { return '"' + CodeMirror.mimeModes[mime] + '": "' + mime + '"'; }).join(",\n")
  var modeMimes = {
    "undefined": "text/plain",
    "null": "text/plain",
    "css": "text/css",
    "javascript": "application/javascript",
    "htmlmixed": "text/html",
    "xml": "application/xml",
    "python": "text/x-python",
    "clike": "text/x-c",
    "java": "text/x-java",
    "csharp": "text/x-csharp",
    "scala": "text/x-scala",
    "markdown": "text/x-markdown",
    "php": "text/x-php",
    "diff": "text/x-diff",
    "rst": "text/x-rst",
    "stex": "text/x-stex",
    "perl": "text/x-perl",
    "ruby": "text/x-ruby",
    "shell": "text/x-sh",
    "sql": "text/x-sql",
    "go": "text/x-go"
  };

  var modeShortcuts = {
    "c": "clike",
    "c++": "clike",
    "c#": "csharp",
    "html": "htmlmixed",
    "js": "javascript",
    "md": "markdown",
    "py": "python",
    "sh": "shell"
  };

  function randomChoose(array) {
    return array[parseInt(Math.random() * array.length, 10)];
  }

  function generateTitleFromURI(uri) {
    /*jslint regexp: true */
    return uri.replace(/^([a-z]+:)?((?:[^\/]*\/)*)([^\/]*)$/, function (match, protocol, dirname, basename) {
      /*jslint unparam: true */
      if (basename) {
        return basename + " (" + (protocol || "") + dirname + ") - " + originalPageTitle;
      }
      return (protocol || "") + dirname + " - " + originalPageTitle;
    });
  }

  //////////
  // Init //
  //////////

  var editorURI, editorTextarea, editor, commands = {}, ecc = new toolbox.ExtendedCancellableChain();
  editorURI = param.uri || window.location.hash.slice(1);
  if (param.textarea) {
    editorTextarea = param.textarea;
  } else {
    editorTextarea = document.createElement("textarea");
    document.body.appendChild(editorTextarea);
  }
  // XXX onbeforeunload if (modified) { return "are you sure?"; }


  //////////////////
  // Set commands //
  //////////////////

  function commandPrompt(cm) {
    // XXX allow the use of space character (like in bash interpreter)
    var text = prompt("Command (type `help` to get a list of commands)"), args;
    if (text) {
      args = text.split(/\s+/);
      commands[args[0]](cm, args);
    }
  }

  commands["help doc"] = "Shows this help.";
  commands.help = function () {
    alert(Object.keys(commands).reduce(function (prev, curr) {
      if (curr.indexOf(" ") !== -1) {
        return prev;
      }
      prev += curr;
      if (commands[curr + " doc"]) {
        prev += "\t\t\t" + commands[curr + " doc"];
      }
      return prev + "\n";
    }, ""));
  };
  commands["open doc"] = "Loads and edit an URI data.";
  commands.open = function (cm, args) {
    if (cm.getOption("readOnly")) {
      alert("Cannot open any resource right now. Please try later.");
      return;
    }
    cm.setOption("readOnly", true);
    if (!args[1]) { args[1] = prompt("Open URI:", editorURI); }
    if (!args[1]) {
      cm.setOption("readOnly", false);
      return alert("Empty URI, aborting.");
    }
    document.title = "Loading... " + generateTitleFromURI(args[1]);
    var mimetype;
    return ecc.getURI(args[1]).then(function (blob) {
      mimetype = blob.type;
      return blob;
    }).toText().catch(function (reason) {
      if (reason && reason.status === 404) {
        if (confirm("URI not found, would you like to edit it anyway?")) {
          return "";
        }
      }
      return Promise.reject(reason);
    }).then(function (text) {
      editorURI = args[1];
      location.hash = "#" + args[1];
      cm.setValue(text);
      cm.setOption("mode", mimetype || "text");
      document.title = generateTitleFromURI(editorURI);
    }).catch(alert).then(function () {
      cm.setOption("readOnly", false);
    });
  };
  commands["saveAs doc"] = "Save the current data to another URI.";
  commands.saveAs = function (cm, args) {
    if (cm.getOption("readOnly")) {
      alert("Cannot save resource right now. Please try later.");
      return;
    }
    cm.setOption("readOnly", true);
    if (!args[1]) { args[1] = prompt("Save as URI:", editorURI); }
    if (!args[1]) {
      cm.setOption("readOnly", false);
      return alert("Empty URI, aborting.");
    }
    document.title = "Saving... " + generateTitleFromURI(args[1]);
    return ecc.value(cm.getValue()).putURI(args[1]).then(function () {
      editorURI = args[1];
      location.hash = "#" + args[1];
    }).catch(alert).then(function () {
      document.title = generateTitleFromURI(editorURI);
      cm.setOption("readOnly", false);
    });
  };
  commands["save doc"] = "Save the current data to the current URI.";
  commands.save = function (cm) {
    return commands.saveAs(cm, ["save", editorURI]);
  };
  commands["download doc"] = "Open download pop-up.";
  commands.download = function (cm) {
    var filename = prompt("Filename:");
    if (!filename) { return alert("Empty filename, aborting."); }
    toolbox.downloadAs(filename, cm.getValue(), "application/octet-stream");
  };
  commands["mode doc"] = "{javascript|html|python|...}";
  commands.mode = function (cm, args) {
    cm.setOption("mode", modeShortcuts[args[1]] || args[1]);
    cm.setOption("lint", false);
    if (CodeMirror.lint[cm.getOption("mode")]) {
      setTimeout(function () { cm.setOption("lint", true); });
    }
  };
  commands["keyMap doc"] = "{default|krx|emacs|vim}";
  commands.keyMap = function (cm, args) {
    cm.setOption("keyMap", args[1] || "default");
  };
  commands["theme doc"] = "{default|random|rubyblue|monokai|blackboard|...}";
  commands.theme = function (cm, args) {
    if (args[1] === "random") {
      cm.setOption("theme", randomChoose(["3024-night", "monokai", "blackboard", "rubyblue", "cobalt"]));
      return;
    }
    cm.setOption("theme", args[1] || "default");
  };
  commands["tab-size doc"] = "Set tab-size (int).";
  commands["tab-size"] = function (cm, args) {
    var i = parseInt(args[1], 10);
    if (isFinite(i)) {
      cm.setOption("tabSize", i);
    }
  };
  /*jslint evil: true */
  commands["eval doc"] = "Eval entire text as javascript /!\\ POTENTIALY DANGEROUS";
  commands.eval = function (cm) {
    window.eval(cm.getValue());
  };
  /*jslint evil: false */

  /*
    lint: function (cm) {
      // Why two setTimeout? because the first sometimes doesn't works... =)
      function tryToEnableLint() {
        try {
          cm.setOption("lint", false);
          cm.setOption("lint", true);
        } catch (ignore) {}
      }
      root.setTimeout(tryToEnableLint);
      root.setTimeout(tryToEnableLint);
    },
    "remove-trailing-spaces": function (cm) {
      var position = cm.getCursor();
      cm.setValue(cm.getValue().replace(/[ \t]+(\r)?\n/g, '$1\n'));
      cm.setCursor(position);
    },
    "view-as-svg": function (cm) {
      var svg_update_ident, svg_img = root.document.createElement("img");
      root.document.body.appendChild(svg_img);
      cm.setOption("fullScreen", false);
      function updateSvg() {
        svg_img.setAttribute(
          "src",
          "data:image/svg+xml;base64," + btoa(toolbox.stringToBinaryString(cm.getValue())
        );
      }
      cm.on("change", function () {
        root.clearTimeout(svg_update_ident);
        svg_update_ident = root.setTimeout(updateSvg, 200);
      });
      updateSvg();
    }
  */


  /////////////////
  // Init editor //
  /////////////////

  CodeMirror.commands.save = function (cm) { commands.save(cm, ["save"]); };
  CodeMirror.keyMap.default.F3 = "findNext";
  CodeMirror.keyMap.default["Shift-F3"] = "findPrev";
  CodeMirror.lint["application/javascript"] = CodeMirror.lint.javascript;
  CodeMirror.lint["application/json"] = CodeMirror.lint.json;
  CodeMirror.lint["text/css"] = CodeMirror.lint.css;

  editor = CodeMirror.fromTextArea(editorTextarea, {
    readOnly: false,

    // http://codemirror.net/doc/manual.html#addons
    // addon/edit/matchbrackets.js
    matchBrackets: true,
    // addon/edit/closebrackets.js
    autoCloseBrackets: false,
    // addon/edit/trailingspace.js
    showTrailingSpace: true,
    // addon/display/fullscreen.{js,css}
    fullScreen: true, // start full screen

    // http://codemirror.net/doc/manual.html#config

    keyMap: "krx", // default "default"
    showCursorWhenSelecting: true,

    extraKeys: {
      "Ctrl-O": function (cm) {
        setTimeout(commands.open, 0, cm, ["open"]);
      },
      "Alt-;": commandPrompt,
      "Alt-:": commandPrompt,
      "Shift-Alt-;": commandPrompt,
      "Shift-Alt-:": commandPrompt
    },

    lineNumbers: true, // default false

    tabSize: 2, // default 4
    smartIndent: true, // default true
    indentWithTabs: false, // default false

    lint: false,
    gutters: ["CodeMirror-lint-markers"],

    autofocus: true, // default false
    theme: "rubyblue", // default "default"
    mode: "text"
  });

  if (location.hash) {
    commands.open(editor, ["open", location.hash.slice(1)]);
  }

  window.editor = editor;


  //////////////////////
  // Add gist feature //
  //////////////////////

  // try to save to "data:"
  toolbox.ExtendedCancellableChain.prototype.putDataURI = function () {
    var editorMode = editor.getOption("mode") || "text/plain", mimetype = toolbox.parseContentType(editorMode);
    if (mimetype.match === mimetype.input) {
      mimetype = editorMode;
    } else {
      mimetype = modeMimes[editorMode] || "text/plain";
    }
    this.toDataURI(mimetype).then(function (dataURI) {
      location.hash = "#" + dataURI;
    });
    return;
  };

}));
