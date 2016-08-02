function cursor_position(param) {
    param = param.split(';');

    // set row
    cursor_row = (parseInt(param[0]) || 1)  - 1;
    // clamp
    if (cursor_row < 0) {
        cursor_row = 0;
    }
    if (cursor_row >= screen.length) {
        cursor_row = screen.length - 1;
    }

    var current_line = screen[cursor_row];

    // set column
    cursor_col = (parseInt(param[1]) || 1) - 1;
    // clamp
    if (cursor_col < 0) {
        cursor_col = 0;
    }
    if (cursor_col > current_line.length) {
        cursor_col = current_line.length - 1;
    }
}

function cursor_up(param) {
    cursor_row -= parseInt(param) || 1;
    if (cursor_row < 0) {
        cursor_row = 0;
    }
}

function cursor_down(param) {
    cursor_row += parseInt(param) || 1;
    if (cursor_row >= screen.length) {
        cursor_row = screen.length - 1;
    }
}

function cursor_forward(param) {
    var current_line = screen[cursor_row];
    cursor_col += parseInt(param) || 1;
    if (cursor_col >= current_line.length) {
        cursor_col = current_line.length - 1;
    }
}

function cursor_backward(param) {
    cursor_col -= parseInt(param) || 1;
    if (cursor_col < 0) {
        cursor_col = 0;
    }
}

var saved_cursor = {row: 0, col: 0};

function save_cursor_position(_) {
    saved_cursor.row = cursor_row;
    saved_cursor.col = cursor_col;
}

function restore_cursor_position(_) {
    cursor_row = saved_cursor.row;
    cursor_col = saved_cursor.col;
}

function erase_display(param) {
    param = parseInt(param) || 0;
    if (param == 0) {
        screen.splice(cursor_row+1);
    } else if (param == 1) {
        for (var i = 0; i < cursor_row; i++) {
            screen[i].splice(0);
        }
    } else if (param == 2) {
        screen = [[]];
    }
}

function erase_line(param) {
    param = parseInt(param) || 0;
    var current_line = screen[cursor_row] || [];
    if (param == 0) {  // clear line from cursor right
        current_line.splice(cursor_col);
    } else if (param == 1) {  // clear line from cursor left
        var stop = cursor_col;
        for (cursor_col = 0; cursor_col <= stop; ) {
            write_char(' ');
        }
    } else if (param == 2) {  // clear entire line
        current_line.splice(0);
    }
}

// terminal attributes
var foreground, background;
var bold, dim, underline, blinking, reverse, invisible;
function reset_attributes() {
    foreground = background = null;
    bold = dim = underline = blinking = reverse = invisible = false;
}
function set_graphics_mode(attributes) {
    if (!attributes) {
        reset_attributes();
        return;
    }

    // parse attributes to set
    attributes.split(';').forEach(function(attribute) {
        var code = parseInt(attribute);
        if (false);
        else if (attribute == '') { reset_attributes(); }
        else if (code == 0) { reset_attributes(); }
        else if (code == 1) { bold = true; }
        else if (code == 2) { dim = true; }
        else if (code == 4) { underline = true; }
        else if (code == 5) { blinking = true; }
        else if (code == 7) { reverse = true; }
        else if (code == 8) { invisible = true; }
        else if (code < 30) { }
        else if (code < 40) { foreground = code - 30; }
        else if (code < 48) { background = code - 40; }
    });
}

escape_sequences = {
    'H': cursor_position,
    'f': cursor_position,
    'A': cursor_up,
    'B': cursor_down,
    'C': cursor_forward,
    'D': cursor_backward,
    's': save_cursor_position,
    'u': restore_cursor_position,
    'J': erase_display,
    'K': erase_line,
    'm': set_graphics_mode,
}
