/* Ported from readline.c, text.c and kill.c */

/* Notes

* rubout means delete (backspace)
* yank means paste
* kill means cut
* point = caret

* mark is automatically set at every kill in emacs mode
* mark is automatically set at every yank
*/


/* Line buffer. */
var rl_line_buffer = ''

/* The current offset in the current input line. */
var rl_point = 0;

/* The mark, or saved cursor position. */
var rl_mark = 0;

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

var _rl_reading_key = false;
var _rl_reading_key_callback;
function rl_read_key(callback) {
    _rl_reading_key = true;
    _rl_reading_key_callback = callback;
}

function _rl_whitespace(c) {
    return c == ' ' || c == '\t';
}

/* Insert a raw character. For now, it is passed as a Javascript event. */
function rl_raw_insert(event, count) {
    if (event.key.length > 1) {
        if (event.key == 'Escape') {
            rl_insert(count, '\x1b');
        } else if (event.key == 'Backspace') {
            rl_insert(count, '\x7f');
        }
        return;
    }

    var text;
    if (event.altKey && event.ctrlKey) {
        // technically, \x1b/escape/meta/alt is inserted
        // and the Ctrl+key combination is executed;
        // this is uncanny so we'll skip that part
        rl_insert(count, '\x1b');
    } else if (event.altKey) {
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
}

var force_next_meta = false;
function rl_handle_event(event) {
    // ignore Shift, Control, Alt and AltGraph by themselves
    if (['Shift', 'Control', 'Alt', 'AltGraph'].indexOf(event.key) >= 0) {
        return;
    }

    if (_rl_reading_key) {
        _rl_reading_key = false;
        _rl_reading_key_callback(event.key);
        return true;
    }

    var count = rl_numeric_arg * rl_arg_sign;
    count = Math.min(count, 1000000);

    // raw character insertion
    if (_rl_insert_next) {
        _rl_insert_next = false;
        rl_raw_insert(event, count);
        rl_discard_argument();
        return true;
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
