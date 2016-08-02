function cursor_backward(param) {
    cursor_col -= parseInt(param);
    if (cursor_col < 0) {
        cursor_col = 0;
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

escape_sequences = {
    'D': cursor_backward,
    'K': erase_line,
}
