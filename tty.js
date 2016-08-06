/* Terminal emulation */

/* The screen is a list of lines; each line is a list of character with their
 * associated metadata */
var screen = [[]];

function copy(object, dst) {
    var dst = dst !== undefined ? dst : {};
    for (var i in object) {
        dst[i] = object[i];
    }
    return dst;
}

var cursor = {
    row: 0,
    col: 0,
};

var null_attributes = {
    foreground: null,
    background: null,
    bold: 0,
    dim: 0,
    underline: 0,
    blinking: 0,
    reverse: 0,
    invisible: 0,
};

function reset_attributes() {
    copy(null_attributes, cursor);
}
reset_attributes();
var saved_cursor = copy(cursor);

/* An empty char to end at the end of the current line, to show the cursor */
var empty_char = {
    char: ' ',
    classes: [],
};

/* Adds a character to the screen at the current position */
function write_char(c) {
    // collect active classes depending on attributes
    var classes = [];
    if (cursor.reverse) {
        var tmp = cursor.foreground || 9;
        cursor.foreground = cursor.background || 0;
        cursor.background = tmp;
        classes.push('tty_foreground_' + cursor.foreground);
        classes.push('tty_background_' + cursor.background);
    } else {
        if (cursor.foreground != null) { classes.push('tty_foreground_' + cursor.foreground); }
        if (cursor.background != null) { classes.push('tty_background_' + cursor.background); }
    }
    if (cursor.bold)      { classes.push('tty_bold'); }
    if (cursor.dim)       { classes.push('tty_dim'); }
    if (cursor.underline) { classes.push('tty_underscore'); }
    if (cursor.blinking)  { classes.push('tty_blinking'); }
    if (cursor.invisible) { classes.push('tty_invisible'); }

    // ensure the grid cell exists
    while (cursor.row >= screen.length) {
        screen.push([]);
    }
    var current_line = screen[cursor.row];
    while (cursor.col >= current_line.length) {
        current_line.push(empty_char);
    }

    // add character
    current_line[cursor.col] = {
        char: c,
        classes: classes,
    };
    cursor.col++;
}

function write(text) {
    for (var i = 0; i < text.length; i++) {
        var c = text.charAt(i);
        if (c == '\n') {
            cursor.col = 0;
            cursor.row++;
            if (cursor.row >= screen.length) {
                screen.push([]);
            }
        } else if (c == '\r') {
            cursor.col = 0;
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
            if (row == cursor.row && col == cursor.col) {
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

function tty2text() {
    var ret = '';
    for (var row = 0; row < screen.length; row++) {
        var line = screen[row];
        for (var col = 0; col < line.length; col++) {
            var cell = line[col];
            var c = cell.char;

            if (c < ' ') {  // non-printable characters
                var name = String.fromCharCode(64 + c.charCodeAt());
                ret += '^' + name;
            } else if (c == '\x7f') {  // delete
                ret += '^?';
            } else {
                ret += c;
            }
        }
        if (row < screen.length - 1) {
            ret += '\n';
        }
    }
    return ret;
}

function tty_redisplay() {
    if (tty.tagName == 'TEXTAREA') {
        tty.value = tty2text();
    } else {
        tty.innerHTML = tty2html();
    }
    tty.scrollTop = tty.scrollHeight;
}
