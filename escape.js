function cursor_backward(param) {
    cursor_col -= parseInt(param);
    if (cursor_col < 0) {
        cursor_col = 0;
    }
}

function erase_line(_) {
    var current_line = screen[screen.length-1];
    current_line.splice(0);
}

escape_sequences = {
    'D': cursor_backward,
    'K': erase_line,
}
