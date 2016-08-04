function cursor_position(param) {
    param = param.split(';');

    // set row
    cursor.row = (parseInt(param[0]) || 1)  - 1;
    // clamp
    if (cursor.row < 0) {
        cursor.row = 0;
    }
    if (cursor.row >= screen.length) {
        cursor.row = screen.length - 1;
    }

    var current_line = screen[cursor.row];

    // set column
    cursor.col = (parseInt(param[1]) || 1) - 1;
    // clamp
    if (cursor.col < 0) {
        cursor.col = 0;
    }
    if (cursor.col > current_line.length) {
        cursor.col = current_line.length - 1;
    }
}

function cursor_up(param) {
    cursor.row -= parseInt(param) || 1;
    if (cursor.row < 0) {
        cursor.row = 0;
    }
}

function cursor_down(param) {
    cursor.row += parseInt(param) || 1;
    if (cursor.row >= screen.length) {
        cursor.row = screen.length - 1;
    }
}

function cursor_forward(param) {
    var current_line = screen[cursor.row];
    cursor.col += parseInt(param) || 1;
    if (cursor.col >= current_line.length) {
        cursor.col = current_line.length - 1;
    }
}

function cursor_backward(param) {
    cursor.col -= parseInt(param) || 1;
    if (cursor.col < 0) {
        cursor.col = 0;
    }
}

function save_cursor_state(_) {
    copy(cursor, saved_cursor);
}

function restore_cursor_state(_) {
    copy(saved_cursor, cursor);
}

function erase_display(param) {
    param = parseInt(param) || 0;
    if (param == 0) {
        screen.splice(cursor.row+1);
    } else if (param == 1) {
        for (var i = 0; i < cursor.row; i++) {
            screen[i].splice(0);
        }
    } else if (param == 2) {
        screen = [[]];
    }
}

function erase_line(param) {
    param = parseInt(param) || 0;
    var current_line = screen[cursor.row] || [];
    if (param == 0) {  // clear line from cursor right
        current_line.splice(cursor.col);
    } else if (param == 1) {  // clear line from cursor left
        var stop = cursor.col;
        for (cursor.col = 0; cursor.col <= stop; ) {
            write_char(' ');
        }
    } else if (param == 2) {  // clear entire line
        current_line.splice(0);
    }
}

// terminal attributes
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
        else if (code == 1) { cursor.bold = true; }
        else if (code == 2) { cursor.dim = true; }
        else if (code == 4) { cursor.underline = true; }
        else if (code == 5) { cursor.blinking = true; }
        else if (code == 7) { cursor.reverse = true; }
        else if (code == 8) { cursor.invisible = true; }
        else if (code < 30) { }
        else if (code < 40) { cursor.foreground = code - 30; }
        else if (code < 48) { cursor.background = code - 40; }
    });
}

escape_sequences = {
    'H': cursor_position,
    'f': cursor_position,
    'A': cursor_up,
    'B': cursor_down,
    'C': cursor_forward,
    'D': cursor_backward,
    's': save_cursor_state,
    'u': restore_cursor_state,
    'J': erase_display,
    'K': erase_line,
    'm': set_graphics_mode,
}
