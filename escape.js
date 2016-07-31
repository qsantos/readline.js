function erase_line(_) {
    var current_line = screen[screen.length-1];
    current_line.splice(0);
}

escape_sequences = {
    'K': erase_line,
}
