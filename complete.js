/* Rough equivalent of complete.c */

/******************************/
/* Utils for word completion. */
/******************************/

/* Pointer to the generator function for completion_matches. */
var rl_completion_entry_function = function(text, state) {
    // simple example
    return [
        "cd", "echo", "emacs", "firefox", "htop", "ls", "more", "mount",
        "python", "vim",
    ][state];
}

/* The list of characters that signal a break between words for
   rl_complete_internal. */

// readline version basic version
// var rl_completer_word_break_characters = " \t\n\"\\'`@$><=;|&{(";

// CPython version, much more complete
var rl_completer_word_break_characters = ' \t\n`~!@#$%^&*()-=+[{]}\\|;:\'",<>/?';

/* Find the bounds of the current word for completion purposes, and leave
   rl_point set to the beginning of the word. */
function _rl_find_completion_word() {
    for (var i = rl_point-1; i-- > 0; ) {
        var c = rl_line_buffer.charAt(i);
        if (rl_completer_word_break_characters.indexOf(c) >= 0) {
            return i;
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
    var start = _rl_find_completion_word();
    var text = rl_line_buffer.substring(start, rl_point);
    var matches = rl_completion_matches(text, rl_completion_entry_function);

    // abort if no match is found
    if (matches.length == 0) {
        return;
    }

    rl_replace_text(start, rl_point, compute_lcd_of_matches(matches));
}

//extern int rl_possible_completions PARAMS((int, int));
//extern int rl_insert_completions PARAMS((int, int));
//extern int rl_old_menu_complete PARAMS((int, int));
//extern int rl_menu_complete PARAMS((int, int));
//extern int rl_backward_menu_complete PARAMS((int, int));
