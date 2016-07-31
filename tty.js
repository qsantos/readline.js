/* Terminal emulation */

/* The screen is a list of lines; each line is a list of character with their
 * associated metadata */
var screen = [[]];

/* Adds a character to the screen at the current position */
function write_char(c) {
    var current_line = screen[screen.length-1];
    current_line.push({
        char: c,
    });
}

function write(text) {
    for (var i = 0; i < text.length; i++) {
        var c = text.charAt(i);
        if (c == '\n') {
            screen.push([]);
        // escape sequences
        } else if (c == '\x1b' && text.charAt(i+1) == '[') {
            // extract the parameters and the action
            var j = i + 2
            while (j < text.length && "0123456789;".includes(text.charAt(j))) {
                j++;
            }
            var action = escape_sequences[text.charAt(j)];
            var param = text.substring(i + 2, j);

            // execute the action associated with the escape sequence
            if (action !== undefined) {
                action(param);
                i = j;
            } else {
                write_char(c);
            }
        } else {
            write_char(c);
        }
    }
}

function textclass(class_, text) {
    return '<span class="' + class_ + '">' + text + '</span>';
}

function tty2html() {
    var ret = '';
    for (var row = 0; row < screen.length; row++) {
        var line = screen[row];
        for (var col = 0; col < line.length; col++) {
            var c = line[col].char;
            if (false);
            // html entities
            else if (c == '&')  { ret += '&amp;'; }
            else if (c == '<')  { ret += '&lt;'; }
            else if (c == ' ')  { ret += '&nbsp;'; }
            else if (c == '\t')  { ret += '&nbsp;&nbsp;&nbsp;&nbsp;'; }
            else if (c < ' ') {
                var name = String.fromCharCode(64 + c.charCodeAt());
                ret += textclass('escape', '^' + name);
            } else if (c == '\x7f') {  // delete
                ret += textclass('escape', '^?');
            } else {
                ret += c;
            }
        }
        ret += '<br>';
    }
    return ret;
}
