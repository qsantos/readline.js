/* Rough equivalent of text.c */

/* The string marking the beginning of a comment. */
var rl_comment_begin = '#';

/* Insert a string of text into the line at point.  This is the only
   way that you should do insertion. */
function rl_insert_text(text, count) {
    rl_add_undo();
    count = count === undefined ? 1 : count;

    var before = rl_line_buffer.substring(0, rl_point);
    var after = rl_line_buffer.substring(rl_point);
    rl_line_buffer = before;
    for (var _ = 0; _ < count; _++) {
        rl_line_buffer += text;
        rl_point += text.length;
    }
    rl_line_buffer += after;
}


/* Delete the string between FROM and TO.  FROM is inclusive, TO is not.
   Returns the number of characters deleted. */
function rl_delete_text(from, to) {
    if (from > to) {
        rl_delete_text(to, from);
        return;
    }

    rl_add_undo();
    rl_line_buffer = rl_line_buffer.substring(0, from) + rl_line_buffer.substring(to);

    // move point
    if (rl_point > to) {
        rl_point -= to - from;
    } else if (rl_point > from) {
        rl_point = from;
    }
}

/* Replace the contents of the line buffer between START and END with
   TEXT.  The operation is undoable. */
function rl_replace_text(start, end, text) {
    var orig_point = rl_point;

    rl_begin_undo_group();
    rl_delete_text(start, end);
    rl_point = start;
    rl_insert_text(text);
    rl_end_undo_group();

    rl_point = orig_point;
}


/********************************************/
/* Bindable commands for moving the cursor. */
/********************************************/

/* Move forward COUNT characters. */
function rl_forward_char(count, key) {
    if (count < 0) {
        rl_backward_char(-count, key);
        return;
    }

    rl_point += count;
    if (rl_point > rl_line_buffer.length) {
        rl_point = rl_line_buffer.length;
    }
}

/* Move backward COUNT characters. */
function rl_backward_char(count, key) {
    if (count < 0) {
        rl_forward_char(-count, key);
        return;
    }

    rl_point -= count;
    if (rl_point < 0) {
        rl_point = 0;
    }
}

/* Move to the beginning of the line. */
function rl_beg_of_line(count, key) {
    rl_point = 0;
}

/* Move to the end of the line. */
function rl_end_of_line(count, key) {
    rl_point = rl_line_buffer.length;
}

/* Move forward a word.  We do what Emacs does.  Handles multibyte chars. */
function rl_forward_word(count, key) {
    if (count < 0) {
        rl_backward_word(-count, key);
        return;
    }

    for (var _ = 0; _ < count; _++) {
        /* If we are not in a word, move forward until we are in one.
           Then, move forward until we hit a non-alphabetic character. */
        while (rl_point < rl_line_buffer.length) {
            if (rl_line_buffer[rl_point] != ' ') {
                break;
            }
            rl_point++;
        }
        while (rl_point < rl_line_buffer.length) {
            if (rl_line_buffer[rl_point] == ' ') {
                break;
            }
            rl_point++;
        }
    }
}

/* Move backward a word.  We do what Emacs does.  Handles multibyte chars. */
function rl_backward_word(count, key) {
    if (count < 0) {
        rl_forward_word(-count, key);
        return;
    }

    for (var _ = 0; _ < count; _++) {
        /* Like rl_forward_word (), except that we look at the characters
           just before point. */
        while (rl_point > 0) {
            if (rl_line_buffer[rl_point-1] != ' ') {
                break;
            }
            rl_point--;
        }
        while (rl_point > 0) {
            if (rl_line_buffer[rl_point-1] == ' ') {
                break;
            }
            rl_point--;
        }
    }
}
//extern int rl_refresh_line PARAMS((int, int));

/* C-l typed to a line without quoting clears the screen, and then reprints
   the prompt and the current input line.  Given a numeric arg, redraw only
   the current line. */
function rl_clear_screen(count, key) {
    write('\x1b[2J\x1b[H');
}
//extern int rl_skip_csi_sequence PARAMS((int, int));
//extern int rl_arrow_keys PARAMS((int, int));


/******************************************************/
/* Bindable commands for inserting and deleting text. */
/******************************************************/

/* Insert a character. */
function rl_insert(count, key) {
    if (_rl_overwrite) {
        rl_delete(count, 0);
    }
    rl_insert_text(key, count);
}

/* Insert a new line. */
function rl_insert_newline(count, key) {
    rl_insert(count, '\n');
}

/* Insert a raw character (e.g. ^A) */
function rl_quoted_insert(count, key) {
    _rl_insert_next = true;
}

/* Insert a tab character. */
function rl_tab_insert(count, key) {
    rl_insert(count, '\t');
}

/* What to do when a NEWLINE is pressed.  We accept the whole line. */
function rl_newline(count, key) {
    rl_history_append();
    write('\n');
    rl_linefunc(rl_line_buffer + '\n');

    rl_line_buffer = '';
    rl_point = 0;
    rl_mark = 0;
    _rl_undo_list = [];
    write(rl_prompt);
}

//extern int rl_do_lowercase_version PARAMS((int, int));

/* Rubout the character behind point. */
function rl_rubout(count, key) {
    if (count < 0) {
        rl_delete(-count, key);
        return;
    }

    count = Math.min(rl_point, count);
    if (rl_explicit_arg) {
        rl_kill_text(rl_point, rl_point - count);
    } else {
        rl_delete_text(rl_point, rl_point - count);
    }
}

/* Delete the character under the cursor.  Given a numeric argument,
   kill that many characters instead. */
function rl_delete(count, key) {
    if (count < 0) {
        rl_rubout(-count, key);
        return;
    }

    if (rl_explicit_arg) {
        rl_kill_text(rl_point, rl_point + count);
    } else {
        rl_delete_text(rl_point, rl_point + count);
    }
}

/* Delete the character under the cursor, unless the insertion
   point is at the end of the line, in which case the character
   behind the cursor is deleted.  COUNT is obeyed and may be used
   to delete forward or backward that many characters. */
function rl_rubout_or_delete(count, key) {
    if (rl_point == rl_line_buffer.length) {
        rl_rubout(count, key);
    } else {
        rl_delete(count, key);
    }
}

/* Delete all spaces and tabs around point. */
function rl_delete_horizontal_space(count, key) {
    var start = rl_point;
    while (start > 0 && _rl_whitespace(rl_line_buffer[start-1])) {
        start--;
    }
    var stop = rl_point;
    while (stop < rl_line_buffer.length && _rl_whitespace(rl_line_buffer[stop])) {
        stop++;
    }
    rl_delete_text(start, stop);
}
//extern int rl_delete_or_show_completions PARAMS((int, int));

/* Turn the current line into a comment in shell history.
   A K*rn shell style function. */
function rl_insert_comment(count, key) {
    rl_beg_of_line(1, key);

    var check_start = rl_explicit_arg || rl_arg_sign == -1;
    if (check_start && rl_line_buffer.startsWith(rl_comment_begin)) {
        rl_delete_text(rl_point, rl_comment_begin.length);
    } else {
        rl_insert_text(rl_comment_begin);
    }

    rl_newline (1, '\n');
}

/* Put the beginning of the line between single quotes. */
function rl_quote(count, key) {
    var quoted = rl_line_buffer.substring(0, rl_point);
    quoted = quoted.replace(/'/g, "'\\''");
    rl_replace_text(0, rl_point, "'" + quoted + "'");
}

/* Put the full line between single quotes. */
function rl_quote_full(count, key) {
    var quoted = rl_line_buffer.quoted.replace(/'/g, "\\'");
    rl_replace_text(0, rl_line_buffer.length, "'" + quoted + "'");
}


/****************************************/
/* Bindable commands for changing case. */
/****************************************/

/* Uppercase the word at point. */
function rl_upcase_word(count, key) {
    rl_change_case(count, String.toUpperCase);
}

/* Lowercase the word at point. */
function rl_downcase_word(count, key) {
    rl_change_case(count, String.toLowerCase);
}

/* Upcase the first letter, downcase the rest. */
function CapCase(text) {
    return text.split(" ").map(function(word) {
        return word.charAt(0).toUpperCase() + word.substring(1);
    }).join(" ");
}
function rl_capitalize_word(count, key) {
    rl_change_case(count, CapCase);
}

function rl_change_case(count, op) {
    rl_begin_undo_group();

    var start = rl_point;
    rl_forward_word(count, 0);
    var stop = rl_point;

    if (count < 0) {
        // rl_forward_word went backward
        var tmp = start;
        start = stop;
        stop = tmp;
    }

    var extract = rl_line_buffer.substring(start, stop);
    rl_replace_text(start, stop, op(extract));

    rl_end_undo_group();
}


/***********************************************************/
/* Bindable commands for transposing characters and words. */
/***********************************************************/

//extern int rl_transpose_words PARAMS((int, int));

/* Transpose the characters at point.  If point is at the end of the line,
   then transpose the characters before point. */
function rl_transpose_chars(count, key) {
    if (rl_line_buffer.length < 2) {
        return;
    }

    if (count < 0) {
        // apparently not supported by readline
        return;
    }

    if (rl_point == 0) {
        return;
    }

    rl_begin_undo_group();

    // transpose = moving the character to the right
    var c = rl_line_buffer[rl_point-1];
    rl_rubout(1, 0);
    rl_forward_char(count, 0);
    rl_insert(1, c);

    rl_end_undo_group();
}


/**************************************************/
/* Bindable commands for searching within a line. */
/**************************************************/

/* Search forward for a character read from the current input stream. */
function rl_char_search(count, key) {
    if (count < 0) {
        rl_backward_char_search(-count, key);
        return;
    }

    rl_read_key(function(key) {
        while (rl_point < rl_line_buffer.length) {
            rl_point++;
            if (rl_line_buffer[rl_point] == key) {
                break;
            }
        }
    });
}

/* Search backward for a character read from the current input stream. */
function rl_backward_char_search(count, key) {
    if (count < 0) {
        rl_backward_char_search(-count, key);
        return;
    }

    rl_read_key(function(key) {
        while (rl_point > 0) {
            rl_point--;
            if (rl_line_buffer[rl_point] == key) {
                break;
            }
        }
    });
}

/* Go to the match of the next parenthesis. (non-standard) */
function rl_maching_paren(count, key) {
    var i = find_matching_paren(rl_line_buffer, rl_point);
    if (i >= 0) {
        rl_point = i;
    }
}


/*******************************************************/
/* Bindable commands for managing the mark and region. */
/*******************************************************/

/* A bindable command to set the mark. */
function rl_set_mark(count, key) {
    if (rl_explicit_arg) {
        rl_mark = count;
    } else {
        rl_mark = rl_point;
    }
}

/* Exchange the position of mark and point. */
function rl_exchange_point_and_mark(count, key) {
    var tmp = rl_mark;
    rl_mark = rl_point;
    rl_point = tmp;
}
