apps
====

- List of apps
    - [js-terminal](#js-terminal)
    - [code-editor](#code-editor)
- [License](#license)


js-terminal
-----------

### What is it?

It is an embeddable javascript terminal.

[Demo](http://rawgit.com/TristanCavelier/apps/master/app/js-terminal/js-terminal.html)


### Command samples

Show properties and methods of the "*window*" object:

    dir(window)

Show current page text content:

    cat(location.href)

Copy current page content to your server:

    cp(location.href, "http://my.server.com/mycollection/myresource")

Remove a resource:

    rm("http://my.server.com/mycollection/myresource")

Show all current html links:

    links(location.href)


code-editor
-----------

### What is it?

It is a web app to allow to edit text or source code in many language. (Using [CodeMirror][].)

[CodeMirror]: http://codemirror.net/

[Demo](http://rawgit.com/TristanCavelier/apps/master/app/code-editor/index.html)


### How to use?

Shortcuts:

- *Ctrl+;* - Prompt for command, you can type "help" for more information. (The shortcut can be *Ctrl+$* for "azerty" keyboards.)
- *Ctrl+o* - Open a resource
- *Ctrl+s* - Save the resource


### Gist feature

This [example][] will explain how to use!

[example]: http://rawgit.com/TristanCavelier/apps/master/app/code-editor/index.html#data:text/x-markdown;base64,SGVsbG8geW91IQo9PT09PT09PT09CgpEbyB5b3Ugc2VlPyBUaGlzIG1hcmtkb3duIGNhbiBiZSBlZGl0ZWQgdGhhbmsgdG8gYSBjbGFzc2ljIGxpbmshCgpPZiBjb3Vyc2UgeW91IGNhbiBtb2RpZnkgaXQuIFdoZW4geW91IHNhdmUgd2l0aCAqQ3RybCtzKiB0aGUKY29udGVudCBvZiB0aGlzIHJlc291cmNlIHdpbGwgYmUgc2F2ZWQgaW4geW91ciBVUkwgYmFyLgoKVG8gc2hhcmUgeW91ciBjb2RlLCBqdXN0IGNvcHkgdGhlIFVSTCBmcm9tIHRoZSBVUkwgYmFyIGFuZApwYXN0ZSBpdCB0byB5b3VyIGZyaWVuZHMuCgpOaWNlLCBpc24ndCBpdD8KCgoqKkhvdyB0byBzdGFydD8qKgoKLSBGaXJzdCB3YXk6CiAgICAtIE9wZW4gYSBsaW5rIHNoYXJlZCBieSBzb21lb25lIGVsc2UgLT4gW1NlZSBteSBjb2RlIV0oaHR0cDovL3Jhd2dpdC5jb20vVHJpc3RhbkNhdmVsaWVyL2FwcHMvbWFzdGVyL2FwcC9jb2RlLWVkaXRvci9pbmRleC5odG1sI2RhdGE6YXBwbGljYXRpb24vamF2YXNjcmlwdDtiYXNlNjQsWTI5dWMyOXNaUzVzYjJjb0lraGxiR3h2SUhkdmNteGtJaWs3KQotIFNlY29uZCB3YXk6CiAgICAtIE9wZW4gYSBjb2RlIGVkaXRvcgogICAgLSBTYXZlIGFzIGBkYXRhOmAKCi0tLS0tCgpFbmpveSEK


License
-------

WTFPLv2. (See the COPYING file more information.)
