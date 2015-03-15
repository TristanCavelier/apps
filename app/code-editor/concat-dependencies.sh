#!/bin/sh

outjs=dependency-concatenation.js
outcss=dependency-concatenation.css

css() {
    echo "/******************************************************************************/" >> "$outcss"
    echo "/* BEGIN $1 */" >> "$outcss"
    curl -sk "$1" >> "$outcss" || echo "errno: $?, $1"
    echo >> "$outcss"
    echo "/* END $1 */" >> "$outcss"
}
js() {
    echo "////////////////////////////////////////////////////////////////////////////////" >> "$outjs"
    echo "// BEGIN $1" >> "$outjs"
    curl -sk "$1" >> "$outjs" || echo "errno: $?, $1"
    echo >> "$outjs"
    echo "// END $1" >> "$outjs"
}
jsecho() {
    echo "////////////////////////////////////////////////////////////////////////////////" >> "$outjs"
    echo "// BEGIN" >> "$outjs"
    echo "$1" >> "$outjs" || echo "errno: $?, jsecho"
    echo "// END" >> "$outjs"
}

echo -n > "$outcss"
echo -n > "$outjs"

js http://rawgit.com/marijnh/CodeMirror/master/lib/codemirror.js
css http://rawgit.com/marijnh/CodeMirror/master/lib/codemirror.css

css http://rawgit.com/marijnh/CodeMirror/master/theme/3024-day.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/3024-night.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/ambiance-mobile.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/ambiance.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/base16-dark.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/base16-light.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/blackboard.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/cobalt.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/eclipse.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/elegant.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/erlang-dark.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/lesser-dark.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/mbo.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/mdn-like.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/midnight.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/monokai.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/neat.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/neo.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/night.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/paraiso-dark.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/paraiso-light.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/pastel-on-dark.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/rubyblue.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/solarized.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/the-matrix.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/tomorrow-night-eighties.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/twilight.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/vibrant-ink.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/xq-dark.css
css http://rawgit.com/marijnh/CodeMirror/master/theme/xq-light.css

js http://rawgit.com/marijnh/CodeMirror/master/mode/css/css.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/javascript/javascript.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/htmlmixed/htmlmixed.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/xml/xml.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/python/python.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/clike/clike.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/markdown/markdown.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/php/php.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/diff/diff.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/rst/rst.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/stex/stex.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/perl/perl.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/ruby/ruby.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/shell/shell.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/sql/sql.js
js http://rawgit.com/marijnh/CodeMirror/master/mode/go/go.js

js http://rawgit.com/marijnh/CodeMirror/master/keymap/emacs.js
js http://rawgit.com/marijnh/CodeMirror/master/keymap/vim.js
js http://rawgit.com/marijnh/CodeMirror/master/keymap/sublime.js

js http://rawgit.com/marijnh/CodeMirror/master/addon/dialog/dialog.js
css http://rawgit.com/marijnh/CodeMirror/master/addon/dialog/dialog.css
js http://rawgit.com/marijnh/CodeMirror/master/addon/display/fullscreen.js
css http://rawgit.com/marijnh/CodeMirror/master/addon/display/fullscreen.css
js http://rawgit.com/marijnh/CodeMirror/master/addon/edit/matchbrackets.js
js http://rawgit.com/marijnh/CodeMirror/master/addon/edit/closebrackets.js
js http://rawgit.com/marijnh/CodeMirror/master/addon/edit/trailingspace.js
js http://rawgit.com/marijnh/CodeMirror/master/addon/search/searchcursor.js
js http://rawgit.com/marijnh/CodeMirror/master/addon/search/search.js
js http://rawgit.com/marijnh/CodeMirror/master/addon/search/match-highlighter.js
js http://rawgit.com/marijnh/CodeMirror/master/addon/comment/comment.js

# js http://rawgit.com/marijnh/CodeMirror/master/addon/hint/show-hint.js
# css http://rawgit.com/marijnh/CodeMirror/master/addon/hint/show-hint.css
# js http://rawgit.com/marijnh/CodeMirror/master/addon/hint/javascript-hint.js
# js http://rawgit.com/marijnh/CodeMirror/master/addon/hint/css-hint.js
# js http://rawgit.com/marijnh/CodeMirror/master/addon/hint/html-hint.js
# js http://rawgit.com/marijnh/CodeMirror/master/addon/hint/xml-hint.js
# js http://rawgit.com/marijnh/CodeMirror/master/addon/hint/python-hint.js
# js http://rawgit.com/marijnh/CodeMirror/master/addon/hint/sql-hint.js
# js http://rawgit.com/marijnh/CodeMirror/master/addon/hint/anyword-hint.js

js http://rawgit.com/marijnh/CodeMirror/master/addon/lint/lint.js
css http://rawgit.com/marijnh/CodeMirror/master/addon/lint/lint.css
js http://rawgit.com/douglascrockford/JSLint/master/jslint.js
jsecho "var JSHINT = JSLINT;"
js http://rawgit.com/marijnh/CodeMirror/master/addon/lint/javascript-lint.js
js http://rawgit.com/stubbornella/csslint/master/release/csslint.js
js http://rawgit.com/marijnh/CodeMirror/master/addon/lint/css-lint.js
js http://rawgit.com/zaach/jsonlint/79b553fb65c192add9066da64043458981b3972b/lib/jsonlint.js
js http://rawgit.com/marijnh/CodeMirror/master/addon/lint/json-lint.js
js http://rawgit.com/marijnh/CodeMirror/master/addon/lint/yaml-lint.js
jsecho "var exports = undefined;"
