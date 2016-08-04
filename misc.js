/* Rough equivalent of misc.c */

/* Whether to insert or overwrite previous characters. */
var _rl_overwrite = false;

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
        rl_arg_sign *= -1;
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


/**********************************************************************/
/* Bindable commands for readline's interface to the command history. */
/**********************************************************************/

/* Go to the start of the history. */
function rl_beginning_of_history(count, key) {
    rl_history_seek(0);
}

/* Go to the end of the history.  (The current line). */
function rl_end_of_history(count, key) {
    rl_history_seek(rl_history.length);
}

/* Move down to the next history line. */
function rl_get_next_history(count, key) {
    rl_history_seek(rl_history_index + count);
}

/* Make the previous item of history the current line. */
function rl_get_previous_history(count, key) {
    rl_history_seek(rl_history_index - count);
}


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
