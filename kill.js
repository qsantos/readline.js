/* Rough equivalent of kill.c */

/**********************/
/* Text killing utils */
/**********************/

/* Where to store killed text. */
var _rl_kill_ring = [""];

/* Where we are in the kill ring. */
var _rl_kill_index = 0;

/* Non-zero if the previous command was a kill command. */
var _rl_last_command_was_kill = 0;

/* Add part of line between FROM and TO to the kill ring.  If the last command
   was a kill, the text is appended or prepended to the current slot, depending
   on whether FROM is lesser or greater than TO. */
function _rl_copy_to_kill_ring(from, to) {
    var text = rl_line_buffer.substring(from, to);

    if (!_rl_last_command_was_kill) {
        _rl_kill_index = _rl_kill_ring.length;
        _rl_kill_ring.push(text);
    } else if (from < to) {
        _rl_kill_index = _rl_kill_ring.length-1;
        _rl_kill_ring[_rl_kill_index] = _rl_kill_ring[_rl_kill_index] + text;
    } else {
        _rl_kill_index = _rl_kill_ring.length-1;
        _rl_kill_ring[_rl_kill_index] = text + _rl_kill_ring[_rl_kill_index];
    }

    _rl_last_command_was_kill = 2;  // decremented once right afterward
}

function rl_kill_text(from, to) {
    _rl_copy_to_kill_ring(from, to);
    rl_delete_text(from, to);
    rl_mark = rl_point;
}


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

/* Copy the text in the region to the kill ring. */
function rl_copy_region_to_kill(count, key) {
    _rl_copy_to_kill_ring(rl_point, rl_mark);
}

/* Kill the text between the point and mark. */
function rl_kill_region(count, key) {
    _rl_copy_to_kill_ring(rl_point, rl_mark);
    rl_delete_text(rl_point, rl_mark);
    // different from rl_kill_text: rl_mark is not updated
}

/* Copy COUNT words forward to the kill ring. */
function rl_copy_forward_word (count, key) {
    var orig = rl_point;

    rl_forward_word(count, 0);
    var stop = rl_point;
    rl_backward_word(count, 0);
    _rl_copy_to_kill_ring(rl_point, stop);

    rl_point = orig;
}

/* Copy COUNT words backward to the kill ring. */
function rl_copy_backward_word (count, key) {
    rl_copy_forward_word(-count, key);
}

/* Yank back the last killed text.  This ignores arguments. */
function rl_yank(count, key) {
    rl_mark = rl_point;
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
    rl_mark = rl_point;
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
