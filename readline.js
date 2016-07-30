/* Ported from readline.c, text.c and kill.c */

/* Notes

* rubout means delete (backspace)
* yank means paste
* kill means cut
* point = caret
*/


/* Line buffer. */
var rl_line_buffer = ''

/* The current offset in the current input line. */
var rl_point = 0;

/* Insert the next typed character verbatim. */
var _rl_insert_next = false;

/* The current value of the numeric argument specified by the user. */
var rl_numeric_arg = 1;

/* Non-zero if an argument was typed. */
var rl_explicit_arg = false;

/* Temporary value used while generating the argument. */
var rl_arg_sign = 1;

/* The address of the last command function Readline executed. */
var _rl_last_func = undefined;

/* The string marking the beginning of a comment. */
var rl_comment_begin = '#';

/**************/
/* Undo utils */
/**************/

var _rl_undo_list = []
var _rl_undo_group_depth = 0;

/* Remember how to undo something.  Concatenate some undos if that
   seems right. */
function rl_add_undo() {
    if (_rl_undo_group_depth == 0) {
        _rl_undo_list.push([rl_line_buffer, rl_point]);
    }
}

/* Begin a group.  Subsequent undos are undone as an atomic operation. */
function rl_begin_undo_group() {
    rl_add_undo();
    _rl_undo_group_depth++;
}

/* End an undo group started with rl_begin_undo_group (). */
function rl_end_undo_group() {
    _rl_undo_group_depth--;
}

/*****************/
/* History utils */
/*****************/

/* An array of strings.  This is where we store the history. */
var rl_history = [""];

/* The current location of the interactive history pointer. */
var rl_history_index = 0;

/* Seek a line of history by index. */
function rl_history_seek(index) {
    if (index < 0) {
        index = 0;
    } else if (index >= rl_history.length) {
        index = rl_history.length;
    }
    rl_history_index = index;
    rl_line_buffer = rl_history[rl_history_index];
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


/**********************/
/* Text killing utils */
/**********************/

/* Where to store killed text. */
var _rl_kill_ring = [""];

/* Where we are in the kill ring. */
var _rl_kill_index = 0;

/* Non-zero if the previous command was a kill command. */
var _rl_last_command_was_kill = 0;

/* Add TEXT to the kill ring.  If the last command was a kill, the text is
   appended or prepended to the current slot, depending on whether FROM is
   lesser or greater than TO. */
function rl_kill_text(from, to) {
    var append = from < to;
    var text = rl_line_buffer.substring(from, to);
    rl_delete_text(from, to);

    if (!_rl_last_command_was_kill) {
        _rl_kill_index = _rl_kill_ring.length;
        _rl_kill_ring.push(text);
    } else if (append) {
        _rl_kill_index = _rl_kill_ring.length-1;
        _rl_kill_ring[_rl_kill_index] = _rl_kill_ring[_rl_kill_index] + text;
    } else {
        _rl_kill_index = _rl_kill_ring.length-1;
        _rl_kill_ring[_rl_kill_index] = text + _rl_kill_ring[_rl_kill_index];
    }

    _rl_last_command_was_kill = 2;  // decremented once right afterward
}


/***************/
/* Other utils */
/***************/

var _rl_reading_key = false;
var _rl_reading_key_callback;

function rl_read_key(callback) {
    _rl_reading_key = true;
    _rl_reading_key_callback = callback;
}

var _rl_overwrite = false;

function _rl_whitespace(c) {
    return c == ' ' || c == '\t';
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

/* What to do when you abort reading an argument. */
function rl_discard_argument() {
    rl_numeric_arg = 1;
    rl_explicit_arg = false;
    rl_arg_sign = 1;
}

/********************************************/
/* Bindable commands for numeric arguments. */
/********************************************/

/* Start a numeric argument with initial value KEY */
function rl_digit_argument(count, key) {
    if (key == '-') {
        rl_arg_sign = -1;
        return;
    }
    if (rl_explicit_arg) {
        rl_numeric_arg *= 10;
        rl_numeric_arg += parseInt(key);
    } else {
        rl_numeric_arg = parseInt(key);
    }
    rl_explicit_arg = true;
}
//extern int rl_universal_argument PARAMS((int, int));

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
//extern int rl_clear_screen PARAMS((int, int));
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
    // history
    rl_history_index = rl_history.length-1;
    if (rl_line_buffer !== "") {
        rl_history[rl_history_index] = rl_line_buffer;
        rl_history_index += 1;
        rl_history.push("");
    }

    rl_linefunc(rl_line_buffer);
    rl_line_buffer = '';
    rl_point = 0;
    _rl_undo_list = [];
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
    rl_begin_undo_group();

    var quoted = rl_line_buffer.substring(0, rl_point);
    quoted = quoted.replace(/'/g, "'\\''");
    rl_delete_text(0, rl_point);
    rl_beg_of_line(0, 1);
    rl_insert_text("'" + quoted + "'");

    rl_end_undo_group();
}

/* Put the full line between single quotes. */
function rl_quote_full(count, key) {
    rl_begin_undo_group();

    var quoted = rl_line_buffer.quoted.replace(/'/g, "\\'");
    rl_delete_text(0, rl_line_buffer.length);
    rl_insert_text("'" + quoted + "'");

    rl_end_undo_group();
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
    rl_delete_text(start, stop);
    rl_insert_text(op(extract));

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

/**********************************************************************/
/* Bindable commands for readline's interface to the command history. */
/**********************************************************************/

/* Go to the start of the history. */
function rl_beginning_of_history(count, key) {
    rl_history_seek(0);
}

/* Go to the end of the history.  (The current line). */
function rl_end_of_history(count, key) {
    rl_history_seek(rl_history.length-1);
}

/* Move down to the next history line. */
function rl_get_next_history(count, key) {
    rl_history_seek(rl_history_index + count);
}

/* Make the previous item of history the current line. */
function rl_get_previous_history(count, key) {
    rl_history_seek(rl_history_index - count);
}

/*******************************************************/
/* Bindable commands for managing the mark and region. */
/*******************************************************/

//extern int rl_set_mark PARAMS((int, int));
//extern int rl_exchange_point_and_mark PARAMS((int, int));

/************************************************************/
/* Bindable commands to set the editing mode (emacs or vi). */
/************************************************************/

//extern int rl_vi_editing_mode PARAMS((int, int));
//extern int rl_emacs_editing_mode PARAMS((int, int));

/*********************************************************************/
/* Bindable commands to change the insert mode (insert or overwrite) */
/*********************************************************************/

function rl_overwrite_mode(count, key) {
    if (!rl_explicit_arg) {
        _rl_overwrite = ! _rl_overwrite;
    } else if (count > 0) {
        _rl_overwrite = true;
    } else {
        _rl_overwrite = false;
    }
}

/************************************************/
/* Bindable commands for managing key bindings. */
/************************************************/

//extern int rl_re_read_init_file PARAMS((int, int));
//extern int rl_dump_functions PARAMS((int, int));
//extern int rl_dump_macros PARAMS((int, int));
//extern int rl_dump_variables PARAMS((int, int));

/******************************************/
/* Bindable commands for word completion. */
/******************************************/

//extern int rl_complete PARAMS((int, int));
//extern int rl_possible_completions PARAMS((int, int));
//extern int rl_insert_completions PARAMS((int, int));
//extern int rl_old_menu_complete PARAMS((int, int));
//extern int rl_menu_complete PARAMS((int, int));
//extern int rl_backward_menu_complete PARAMS((int, int));

/*******************************************************************************/
/* Bindable commands for killing and yanking text, and managing the kill ring. */
/*******************************************************************************/

/* Delete the word at point, saving the text in the kill ring. */
function rl_kill_word(count, key) {
    var start = rl_point;
    rl_forward_word(count, key);
    rl_kill_text(start, rl_point);
}

/* Rubout the word before point, placing it on the kill ring. */
function rl_backward_kill_word(count, key) {
    rl_kill_word(-count, key);
}

/* Kill from here to the end of the line.  If COUNT is negative, kill
   back to the line start instead. */
function rl_kill_line(count, key) {
    if (count < 0) {
        rl_backward_kill_line(-count, key);
        return;
    }

    rl_kill_text(rl_point, rl_line_buffer.length);
}

/* Kill backwards to the start of the line.  If DIRECTION is negative, kill
   forwards to the line end instead. */
function rl_backward_kill_line(count, key) {
    if (count < 0) {
        rl_kill_line(-count, key);
        return;
    }

    rl_kill_text(rl_point, 0);
}

/* Kill the whole line, no matter where point is. */
function rl_kill_full_line(count, key) {
    rl_kill_text(0, rl_line_buffer.length);
}

/* This does what C-w does in Unix.  We can't prevent people from
   using behaviour that they expect. */
function rl_unix_word_rubout(count, key) {
    var stop = rl_point;
    rl_backward_word(count, 0);
    rl_kill_text(stop, rl_point);
}
//extern int rl_unix_filename_rubout PARAMS((int, int));

/* Here is C-u doing what Unix does.  You don't *have* to use these
   key-bindings.  We have a choice of killing the entire line, or
   killing from where we are to the start of the line.  We choose the
   latter, because if you are a Unix weenie, then you haven't backspaced
   into the line at all, and if you aren't, then you know what you are
   doing. */
function rl_unix_line_discard(count, key) {
    rl_kill_line(count, key);
}
//extern int rl_copy_region_to_kill PARAMS((int, int));
//extern int rl_kill_region PARAMS((int, int));
//extern int rl_copy_forward_word PARAMS((int, int));
//extern int rl_copy_backward_word PARAMS((int, int));

/* Yank back the last killed text.  This ignores arguments. */
function rl_yank(count, key) {
    if (_rl_kill_ring.length >= 0) {
        rl_insert_text(_rl_kill_ring[_rl_kill_index], count);
    }
}

/* If the last command was yank, or yank_pop, and the text just
   before point is identical to the current kill item, then
   delete that text from the line, rotate the index down, and
   yank back some other text. */
/* Replace previously yanked text by the previous in the kill ring. */
function rl_yank_pop(count, key) {
    if (_rl_last_func != rl_yank && _rl_last_func != rl_yank_pop) {
        return;
    }

    rl_undo_command(1, 0);
    _rl_kill_index--;
    if (_rl_kill_index < 0) {
        _rl_kill_index = _rl_kill_ring.length - 1;
    }

    rl_yank(1, 0);
}

/* Yank the COUNTh argument from the previous history line, skipping
   HISTORY_SKIP lines before looking for the `previous line'. */
function rl_yank_nth_arg(count, key, history_skip) {
    history_skip = history_skip === undefined ? 0 : history_skip;
    var line = rl_history[rl_history_index-1 - history_skip];
    if (line === undefined) {
        return false;
    }
    var args = rl_args_extract(count, count, line);
    rl_insert_text(args);
    return true;
}

var _rl_history_skip;
var _rl_count_passed;
var _rl_direction;
var _rl_undo_needed;

/* Yank the last argument from the previous history line.  This `knows'
   how rl_yank_nth_arg treats a count of `$'.  With an argument, this
   behaves the same as rl_yank_nth_arg. */
function rl_yank_last_arg (count, key) {
    if (_rl_last_func != rl_yank_last_arg) {
        _rl_history_skip = 0;
        _rl_count_passed = rl_explicit_arg ? count : '$';
        _rl_direction = 1;
    } else {
        // cancel previous call
        if (_rl_undo_needed) {
            rl_undo_command(1, 0);
        }
        // change direction if needed
        if (count < 0) {
            _rl_direction = -_rl_direction;
        }
        // go back further in history
        _rl_history_skip += _rl_direction;
        if (_rl_history_skip < 0) {
            _rl_history_skip = 0;
        }
    }

    _rl_undo_needed = rl_yank_nth_arg(_rl_count_passed, key, _rl_history_skip);
}

/* Not available unless __CYGWIN__ is defined. */
//extern int rl_paste_from_clipboard PARAMS((int, int));

/************************************************/
/* Bindable commands for incremental searching. */
/************************************************/

//extern int rl_reverse_search_history PARAMS((int, int));
//extern int rl_forward_search_history PARAMS((int, int));

/*************************************/
/* Bindable keyboard macro commands. */
/*************************************/

//extern int rl_start_kbd_macro PARAMS((int, int));
//extern int rl_end_kbd_macro PARAMS((int, int));
//extern int rl_call_last_kbd_macro PARAMS((int, int));
//extern int rl_print_last_kbd_macro PARAMS((int, int));

/***************************/
/* Bindable undo commands. */
/***************************/

/* Revert the current line to its previous state. */
function rl_revert_line(count, key) {
    rl_line_buffer = _rl_undo_list[0];
    _rl_undo_list = [];
}

/* Do some undoing of things that were done. */
function rl_undo_command(count, key) {
    if (count < 0) {
        return;
    }

    var undo;
    for (var _ = 0; _ < count; _++) {
        if (_rl_undo_list.length == 0) {
            return;
        }
        undo = _rl_undo_list.pop();
    }
    rl_line_buffer = undo[0];
    rl_point = undo[1];
}

/**************************************/
/* Bindable tilde expansion commands. */
/**************************************/

//extern int rl_tilde_expand PARAMS((int, int));

/***************************************/
/* Bindable terminal control commands. */
/***************************************/

//extern int rl_restart_output PARAMS((int, int));
//extern int rl_stop_output PARAMS((int, int));

/************************************/
/* Miscellaneous bindable commands. */
/************************************/

//extern int rl_abort PARAMS((int, int));
//extern int rl_tty_status PARAMS((int, int));

/****************************************************************************/
/* Bindable commands for incremental and non-incremental history searching. */
/****************************************************************************/

//extern int rl_history_search_forward PARAMS((int, int));
//extern int rl_history_search_backward PARAMS((int, int));
//extern int rl_history_substr_search_forward PARAMS((int, int));
//extern int rl_history_substr_search_backward PARAMS((int, int));
//extern int rl_noninc_forward_search PARAMS((int, int));
//extern int rl_noninc_reverse_search PARAMS((int, int));
//extern int rl_noninc_forward_search_again PARAMS((int, int));
//extern int rl_noninc_reverse_search_again PARAMS((int, int));

/********************************************************************/
/* Bindable command used when inserting a matching close character. */
/********************************************************************/

//extern int rl_insert_close PARAMS((int, int));

/*******************************************************/
/* Not available unless READLINE_CALLBACKS is defined. */
/*******************************************************/

//extern void rl_callback_handler_install PARAMS((const char *, rl_vcpfunc_t *));
//extern void rl_callback_read_char PARAMS((void));
//extern void rl_callback_handler_remove PARAMS((void));

/****************************************************************************/
/* Things for vi mode. Not available unless readline is compiled -DVI_MODE. */
/****************************************************************************/

/******************************/
/* VI-mode bindable commands. */
/******************************/

//extern int rl_vi_redo PARAMS((int, int));
//extern int rl_vi_undo PARAMS((int, int));
//extern int rl_vi_yank_arg PARAMS((int, int));
//extern int rl_vi_fetch_history PARAMS((int, int));
//extern int rl_vi_search_again PARAMS((int, int));
//extern int rl_vi_search PARAMS((int, int));
//extern int rl_vi_complete PARAMS((int, int));
//extern int rl_vi_tilde_expand PARAMS((int, int));
//extern int rl_vi_prev_word PARAMS((int, int));
//extern int rl_vi_next_word PARAMS((int, int));
//extern int rl_vi_end_word PARAMS((int, int));
//extern int rl_vi_insert_beg PARAMS((int, int));
//extern int rl_vi_append_mode PARAMS((int, int));
//extern int rl_vi_append_eol PARAMS((int, int));
//extern int rl_vi_eof_maybe PARAMS((int, int));
//extern int rl_vi_insertion_mode PARAMS((int, int));
//extern int rl_vi_insert_mode PARAMS((int, int));
//extern int rl_vi_movement_mode PARAMS((int, int));
//extern int rl_vi_arg_digit PARAMS((int, int));
//extern int rl_vi_change_case PARAMS((int, int));
//extern int rl_vi_put PARAMS((int, int));
//extern int rl_vi_column PARAMS((int, int));
//extern int rl_vi_delete_to PARAMS((int, int));
//extern int rl_vi_change_to PARAMS((int, int));
//extern int rl_vi_yank_to PARAMS((int, int));
//extern int rl_vi_rubout PARAMS((int, int));
//extern int rl_vi_delete PARAMS((int, int));
//extern int rl_vi_back_to_indent PARAMS((int, int));
//extern int rl_vi_first_print PARAMS((int, int));
//extern int rl_vi_char_search PARAMS((int, int));
//extern int rl_vi_match PARAMS((int, int));
//extern int rl_vi_change_char PARAMS((int, int));
//extern int rl_vi_subst PARAMS((int, int));
//extern int rl_vi_overstrike PARAMS((int, int));
//extern int rl_vi_overstrike_delete PARAMS((int, int));
//extern int rl_vi_replace PARAMS((int, int));
//extern int rl_vi_set_mark PARAMS((int, int));
//extern int rl_vi_goto_mark PARAMS((int, int));

/******************************/
/* VI-mode utility functions. */
/******************************/

//extern int rl_vi_check PARAMS((void));
//extern int rl_vi_domove PARAMS((int, int *));
//extern int rl_vi_bracktype PARAMS((int));

//extern void rl_vi_start_inserting PARAMS((int, int, int));

/****************************************************************/
/* VI-mode pseudo-bindable commands, used as utility functions. */
/****************************************************************/

//extern int rl_vi_fWord PARAMS((int, int));
//extern int rl_vi_bWord PARAMS((int, int));
//extern int rl_vi_eWord PARAMS((int, int));
//extern int rl_vi_fword PARAMS((int, int));
//extern int rl_vi_bword PARAMS((int, int));
//extern int rl_vi_eword PARAMS((int, int));



var force_next_meta = false;
function rl_handle_event(event) {
    // ignore Shift, Control, Alt and AltGraph by themselves
    if (['Shift', 'Control', 'Alt', 'AltGraph'].indexOf(event.key) >= 0) {
        return;
    }

    // since Meta (altKey) basically just escapes keys,
    // we will pretend that Escape is a sticky Meta
    var altKey = event.altKey;
    if (force_next_meta) {
        altKey = true;
        force_next_meta = false;
    } else if (event.key == 'Escape') {
        force_next_meta = true;
    }

    if (_rl_reading_key) {
        _rl_reading_key = false;
        _rl_reading_key_callback(event.key);
        return true;
    }

    var count = rl_numeric_arg * rl_arg_sign;
    count = Math.min(count, 1000000);

    if (_rl_insert_next) {
        var text;
        if (altKey && event.ctrlKey) {
            // technically, \x1b/escape/meta/alt is inserted
            // and the Ctrl+key combination is executed;
            // this is uncanny so we'll skip that part
            rl_insert(count, '\x1b');
        } else if (altKey) {
            rl_insert(count, '\x1b');
            rl_insert(1, event.key);
        } else if (event.ctrlKey) {
            if (event.key == '?') {  // ^?
                rl_insert(count, '\x7f');
            } else if (event.key >= '@') {
                var code = event.key.toUpperCase().charCodeAt() - 64;
                var c = String.fromCharCode(code);
                rl_insert(count, c);
            } else {
                rl_insert(count, event.key);
            }
        } else {
            rl_insert(count, event.key);
        }
        _rl_insert_next = false;
        rl_discard_argument();
        return true;
    }

    // dispatch
    var action;
    var folded = event.key.toLowerCase();
    if (altKey) {
        if (event.ctrlKey) {
            action = handle_meta_ctrl_key(folded);
        } else {
            action = handle_meta_key(folded);
        }
    } else if (event.ctrlKey) {
        action = handle_ctrl_key(folded);
    } else {
        action = handle_standard_key(event.key);
    }
    if (action !== undefined) {
        action(count, event.key);
        _rl_last_func = action;
        if (_rl_last_command_was_kill > 0) {
            _rl_last_command_was_kill--;
        }
        if (action !== rl_digit_argument) {
            rl_discard_argument();
        }
        return true;
    }
    return false;
}
