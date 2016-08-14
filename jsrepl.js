/* Completer function for Javascript. */
readline.set_completer(function(text, state) {
    // sum up: evaluate as much of text as possible;
    //         list matching properties of result

    // do not evaluate methods
    if (text.lastIndexOf('(') >= 0) {
        return null;
    }

    // we try to evaluate before the last dot
    // and complete the part after it
    var lastDot = text.lastIndexOf('.');

    var prepend;  // what do add back before property name (until dot)
    var prefix;  // the prefix of the property name (after dot)
    var parent;  // object whose we list child properties

    if (lastDot >= 0) {
        prepend = text.substring(0, lastDot+1);
        prefix = text.substring(lastDot + 1);
        var bla = text.substring(0, lastDot);
        try {
            // sure, eval is bad, but it's a REPL anyway
            parent = eval(bla);
        } catch (err) {
            return null;
        }
    } else {
        prepend = '';
        prefix = text;
        parent = window;  // window is Javascript's globals()
    }

    // just to be clear, we do not handle numbers, strings, functions, ...
    if (typeof parent != "object") {
        return null;
    }

    // return the state-th property with matching prefix
    var i = 0;
    for (var property in parent) {
        if (!property.startsWith(prefix)) {
            continue;
        }

        if (i == state) {
            return prepend + property;
        }
        i++;
    }
    return null;
});

/* Try to stringify stuff. */
function stringify(stuff) {
    var type = typeof stuff;
    if (type == "function" || type == "number") {
        return String(stuff);
    } else {
        return JSON.stringify(stuff);
    }
}

readline.input('\x1b[32m>\x1b[m ', function(line) {
    try {
        var res = eval(line);
        if (res !== undefined) {
            readline.write(stringify(res) + '\n');
            // set _ to last returned value
            window._ = res;
        }
    } catch (err) {
        readline.write('Traceback (most recent call last):\n');

        // get the stack trace
        var stack = err.stack;
        // put the stack into a list
        stack = stack.trim().split('\n').reverse();
        // remove internal calls from stack trace
        stack = stack.slice(4);
        // reformat like in CPython
        var depth = 0;
        stack = stack.map(function(line) {
            // parse a line in the stack trace
            var match = line.match(/^(.*?)@https?:\/?\/?.*?\/(.*):([0-9]*):[0-9]*?/);
            if (!match) {
                return line;
            }

            // extract information
            var function_name = match[1] || '<lambda>';
            // proper name for context of first call
            depth += 1;
            if (depth == 1) {
                function_name = '<module>';
            }
            var filename = match[2];
            // special handling for everything from TTY
            if (filename.startsWith('jsrepl.js line')) {
                filename = '<stdin>';
            }
            var line_number = match[3];

            // format information CPython-style
            return 'File "' + filename + '", line ' + line_number + ', in ' + function_name;
        });
        // display the stack
        readline.write('    ' + stack.join('\n    ') + '\n');

        // display the error message
        readline.write('\x1b[1;31m' + err.name + '\x1b[m: ' + err.message + '\n');
    }
});
