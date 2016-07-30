/* Rough equivalent of hist*.c */

/*****************/
/* History utils */
/*****************/

/* An array of strings.  This is where we store the history. */
var rl_history = [];

/* The current location of the interactive history pointer. */
var rl_history_index = 0;

/* Add a line to the history. */
function rl_history_append() {
    if (rl_line_buffer !== "") {
        rl_history.push(rl_line_buffer);
    }
    rl_history_index = rl_history.length;
}

/* Seek a line of history by index. */
function rl_history_seek(index) {
    if (index < 0) {
    } else if (index >= rl_history.length) {
        rl_history_index = rl_history.length;
        rl_line_buffer = "";
    } else {
        rl_history_index = index;
        rl_line_buffer = rl_history[rl_history_index];
    }
    rl_end_of_line();
}

/* Tokenize a string (bash style). */
function rl_tokenize(string) {
    var tokens = [""];
    var in_quotes = false;
    var escaped = false;
    for (var i = 0; i < string.length; i++) {
        var c = string.charAt(i);
        if (escaped) {
            escaped = false;
        } else if (in_quotes == '"') {
            if (c == '\\') {
                escaped = true;
            } if (c == in_quotes) {
                in_quotes = false;
            }
        } else if (in_quotes == "'") {
            if (c == in_quotes) {
                in_quotes = false;
            }
        } else if (c == '\\') {
            escaped = true;
        } else if (c == '"' || c == "'") {
            in_quotes = c;
        } else if (_rl_whitespace(c)) {
            if (tokens[tokens.length-1] !== "") {
                tokens.push("");
            }
            continue;
        }
        tokens[tokens.length-1] += c;
    }
    return tokens;
}

/* Extract the args specified, starting at FIRST, and ending at LAST.
   The args are taken from STRING.  If either FIRST or LAST is < 0,
   then make that arg count from the right (subtract from the number of
   tokens, so that FIRST = -1 means the next to last token on the line).
   If LAST is `$' the last arg from STRING is used. */
function rl_args_extract(first, last, string) {
    var tokens = rl_tokenize(string);
    if (first < 0) {
        first += tokens.length-1;
    } else if (first == '$') {
        first = tokens.length-1;
    }
    if (last < 0) {
        last += tokens.length-1;
    } else if (last == '$') {
        last = tokens.length-1;
    }
    return tokens.slice(first, last+1).join(" ");
}
