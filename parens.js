/* Rough equivalent of parens.c */

/* Parens and their matches. */
var open_parens = ['(', '<', '[', '{'];
var close_parens = [')', '>', ']', '}'];

/* Given an opening parenthesis, look for its match/ */
function find_matching_close(string, i, type) {
    var open = open_parens[type];
    var close = close_parens[type];

    var depth = 0;
    while (i < string.length) {
        var c = string.charAt(i);
        if (c == open) {
            depth++;
        } else if (c == close) {
            depth--;
            if (depth == 0) {
                return i;
            }
        }
        i++;
    }

    return -1;
}

/* Given a closing parenthesis, look for its match. */
function find_matching_open(string, i, type) {
    var open = open_parens[type];
    var close = close_parens[type];

    var depth = 0;
    while (i >= 0) {
        var c = string.charAt(i);
        if (c == close) {
            depth++;
        } else if (c == open) {
            depth--;
            if (depth == 0) {
                return i;
            }
        }
        i--;
    }

    return -1;
}

/* Look for the match of the next parenthesis. */
function find_matching_paren(string, i) {
    // look for next parenthesis character, then find match
    while (i < string.length) {
        var c = string.charAt(i);
        var type;

        type = open_parens.indexOf(c);
        if (type >= 0) {
            return find_matching_close(string, i, type);
        }

        type = close_parens.indexOf(c);
        if (type >= 0) {
            return find_matching_open(string, i, type);
        }

        i++;
    }

    return -1;
}
