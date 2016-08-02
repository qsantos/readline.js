/* Terminal emulation */

/* The screen is a list of lines; each line is a list of character with their
 * associated metadata */
var screen = [[]];
var cursor_row = 0;
var cursor_col = 0;

/* An empty char to end at the end of the current line, to show the cursor */
var empty_char = {
    char: ' ',
    classes: [],
};

/* Adds a character to the screen at the current position */
function write_char(c) {
    // ensure the grid cell exists
    while (cursor_row >= screen.length) {
        screen.push([]);
    }
    var current_line = screen[cursor_row];
    while (cursor_col >= current_line.length) {
        current_line.push(empty_char);
    }

    // add character
    current_line[cursor_col] = {
        char: c,
        classes: [],
    };
    cursor_col++;
}

function write(text) {
    for (var i = 0; i < text.length; i++) {
        var c = text.charAt(i);
        if (c == '\n') {
            cursor_col = 0;
            cursor_row++;
            if (cursor_row >= screen.length) {
                screen.push([]);
            }
        } else if (c == '\r') {
            cursor_col = 0;
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
        var line = screen[row].concat(empty_char);
        for (var col = 0; col < line.length; col++) {
            var cell = line[col];
            var c = cell.char;

            // set up the decoration for the current character
            var classes = cell.classes;
            if (row == cursor_row && col == cursor_col) {
                classes = classes.concat(['tty_cursor']);
            }
            if (classes.length != 0) {
                ret += '<span class="' + classes.join(' ') + '">';
            }

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

            // close decorations for the current character
            if (classes.length != 0) {
                ret += '</span>';
            }
        }
        ret += '<br>';
    }
    return ret;
}
