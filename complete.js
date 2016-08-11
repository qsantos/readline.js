/* Rough equivalent of complete.c */

/******************************/
/* Utils for word completion. */
/******************************/

/* Default entry function. */
function rl_completion_default_entry_function(text, state) {
    // simple example
    return [
        "cd", "echo", "emacs", "firefox", "htop", "ls", "more", "mount",
        "python", "vim",
    ][state];
}

/* Pointer to the generator function for completion_matches. */
var rl_completion_entry_function = rl_completion_default_entry_function;

/* The list of characters that signal a break between words for
   rl_complete_internal. */

// readline version basic version
// var rl_completer_word_break_characters = " \t\n\"\\'`@$><=;|&{(";

// CPython version, much more complete
var rl_completer_word_break_characters = ' \t\n`~!@#$%^&*()-=+[{]}\\|;:\'",<>/?';

/* Up to this many items will be displayed in response to a
   possible-completions call.  After that, we ask the user if
   she is sure she wants to see them all.  A negative value means
   don't ask. */
var rl_completion_query_items = 100;

/* Find the bounds of the current word for completion purposes, and leave
   rl_point set to the beginning of the word. */
function _rl_find_completion_word() {
    for (var i = rl_point; i-- > 0; ) {
        var c = rl_line_buffer.charAt(i);
        if (rl_completer_word_break_characters.indexOf(c) >= 0) {
            return i+1;
        }
    }
    return 0;
}

/* Find the common prefix of the list of matches. */
function compute_lcd_of_matches(matches) {
    for (var i = 0; i < matches[0].length; i++) {
        for (var j = 1; j < matches.length; j++) {
            if (matches[j].charCodeAt(i) != matches[0].charCodeAt(i)) {
                return matches[0].substring(0, i);
            }
        }
    }
    return matches[0];
}

/* Return an Array of strings which is a list of completions for TEXT.

   ENTRY_FUNCTION is a function of two args, and returns a strings.
     The first argument is TEXT.
     The second is a state argument; it should be zero on the first call, and
     non-zero on subsequent calls.  It returns null to the caller when there
     are no more matches.
 */
function rl_completion_matches(text, entry_function) {
    var ret = [];
    var i = 0;
    while (true) {
        var entry = entry_function(text, i);
        if (entry == null) {
            break;
        }

        // check entries, to ease writing of completion functions
        if (entry.startsWith(text)) {
            ret.push(entry);
        }

        i++;
    }
    return ret;
}

/* A convenience function for displaying a list of strings in
   columnar format on readline's output stream.  MATCHES is the list
   of strings. */
function rl_display_match_list(matches) {
    // find length of the widest string
    var lengths = matches.map(function(s){ return s.length; });
    var max = Math.max.apply(null, lengths);
    max += 2;

    // compute the number of matches to print in each line
    var cols = 79;
    var limit = Math.floor(cols / max);
    if (limit < 1) {
        limit = 1;
    }

    matches.sort();

    // temporarily go to next line
    write('\x1b[s');  // save cursor state
    write('\x1b[J');  // clear screen below
    write('\n');  // next line

    // show all the matches
    for (var i = 0; i < matches.length; ) {
        var x = '';
        for (var j = 0; i < matches.length && j < limit; j++, i++) {
            write(matches[i]);
            x += matches[i];
            for (var k = 0; k < max - matches[i].length; k++) {
                write(' ');
                x += ' ';
            }
        }
        write('\n');
    }

    // restore cursor state
    write('\x1b[u');
}

/* Display MATCHES.  We also check
   that the list of matches doesn't exceed the user-settable threshold,
   and ask the user if he wants to see the list if there are more matches
   than RL_COMPLETION_QUERY_ITEMS. */
function display_matches(matches) {
    rl_redisplay();  // avoid a redisplay from clearing out the confirmation

    // if few matches, just print them
    if (rl_completion_query_items <= 0 || matches.length < rl_completion_query_items) {
        rl_display_match_list(matches);
        return;
    }

    // temporarily go to next line
    write('\x1b[s');  // save cursor state
    write('\n');  // next line
    write('\x1b[2K');  // clear line

    // demand confirmation before printing many matches
    write('Display all ' + matches.length + ' possibilities? (y or n)');
    tty_redisplay();
    function yesno(key) {
        // ask until answer is either 'y' or 'n'
        if (key != 'y' && key != 'n') {
            rl_read_key(yesno);
            return;
        }

        // restore screen state
        write('\x1b[2K');  // clear line
        write('\r');  // beginning of line
        write('\x1b[u');  // restore cursor state

        if (key == 'y') {
            rl_display_match_list(matches);
        }
    }
    rl_read_key(yesno);
}

// save information between completions for rotating between the matches
var _rl_completion_state;
var _rl_completion_start;
var _rl_completion_matches;

/******************************************/
/* Bindable commands for word completion. */
/******************************************/

/* Complete the word at or before point.  You have supplied the function
   that does the initial simple matching selection algorithm (see
   rl_completion_matches ()). */
function rl_complete(count, key) {
    if (_rl_last_func != rl_complete) {
        _rl_completion_state = -2;
        _rl_completion_start = _rl_find_completion_word();
        var text = rl_line_buffer.substring(_rl_completion_start, rl_point);
        _rl_completion_matches = (
            rl_completion_matches(text, rl_completion_entry_function)
        );
    }

    // abort if no match is found
    if (_rl_completion_matches.length == 0) {
        return;
    }

    // choose the substitution
    var substitution;
    if (_rl_completion_state == -2) {  // partial completion
        substitution = compute_lcd_of_matches(_rl_completion_matches);
    } else if (_rl_completion_state == -1) {  // list of matches
        display_matches(_rl_completion_matches);
        _rl_completion_state++;
        return;
    } else {  // cycles through matches
        substitution = _rl_completion_matches[_rl_completion_state];
    }

    // apply it
    rl_replace_text(_rl_completion_start, rl_point, substitution);

    _rl_completion_state++;
    if (_rl_completion_state >= _rl_completion_matches.length) {
        _rl_completion_state = 0;
    }
}

/* Insert all of the possible completions. */
function rl_insert_completions(count, key) {
    // find matches
    var start = _rl_find_completion_word();
    var text = rl_line_buffer.substring(start, rl_point);
    var matches = rl_completion_matches(text, rl_completion_entry_function);

    // insert them
    rl_replace_text(start, rl_point, matches.join(' '));
}

function rl_possible_completions(count, key) {
    // find matches
    var start = _rl_find_completion_word();
    var text = rl_line_buffer.substring(start, rl_point);
    var matches = rl_completion_matches(text, rl_completion_entry_function);

    display_matches(matches);
}

//extern int rl_old_menu_complete PARAMS((int, int));
//extern int rl_menu_complete PARAMS((int, int));
//extern int rl_backward_menu_complete PARAMS((int, int));
