/* Ported from readline.c, text.c and kill.c */


/****************/
/* Line buffer. */
/****************/

var rl_line_buffer = ''

/*************************************************/
/* The current offset in the current input line. */
/*************************************************/

var rl_point = 0;

/* Insert the next typed character verbatim. */
var rl_insert_next = false;

/* The current value of the numeric argument specified by the user. */
var rl_numeric_arg = 1;

/* Non-zero if an argument was typed. */
var rl_explicit_arg = false;

/* Temporary value used while generating the argument. */
var rl_arg_sign = 1;


var latestCut = '';
var secondLatestCut = '';

function rl_kill_text(from, to) {
    rl_line_buffer = rl_line_buffer.substring(0, from) + rl_line_buffer.substring(to);
    if (rl_point > to) {
        rl_point -= to - from;
    } else if (rl_point > from) {
        rl_point = from;
    }
}

/* Delete the string between FROM and TO.  FROM is inclusive, TO is not.
   Returns the number of characters deleted. */
function rl_delete_text(start, stop) {
    secondLatestCut = latestCut;
    latestCut = rl_line_buffer.substring(start, stop);
    rl_kill_text(start, stop);
}

/* Insert a string of text into the line at point.  This is the only
   way that you should do insertion. */
function rl_insert_text(text, count) {
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
    rl_point += 1;
    if (rl_point > rl_line_buffer.length) {
        rl_point = rl_line_buffer.length;
    }
}

/* Move backward COUNT characters. */
function rl_backward_char(count, key) {
    rl_point -= 1;
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

/* Move backward a word.  We do what Emacs does.  Handles multibyte chars. */
function rl_backward_word(count, key) {
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
//extern int rl_refresh_line PARAMS((int, int));
//extern int rl_clear_screen PARAMS((int, int));
//extern int rl_skip_csi_sequence PARAMS((int, int));
//extern int rl_arrow_keys PARAMS((int, int));

/******************************************************/
/* Bindable commands for inserting and deleting text. */
/******************************************************/

/* Insert a character. */
function rl_insert(count, key) {
    rl_insert_text(key, count);
}

/* Insert a raw character (e.g. ^A) */
function rl_quoted_insert(count, key) {
    rl_insert_next = true;
}
//extern int rl_tab_insert PARAMS((int, int));

/* What to do when a NEWLINE is pressed.  We accept the whole line. */
function rl_newline(count, key) {
    rl_linefunc(rl_line_buffer);
    rl_line_buffer = '';
    rl_point = 0;
}

//extern int rl_do_lowercase_version PARAMS((int, int));

/* Rubout the character behind point. */
function rl_rubout(count, key) {
    if (count < 0) {
        rl_delete(-count, key);
        return;
    }

    count = Math.min(count, rl_point);
    var before = rl_line_buffer.substring(0, rl_point - count);
    var after = rl_line_buffer.substring(rl_point);
    rl_line_buffer = before + after;
    rl_point -= count;
}

/* Delete the character under the cursor.  Given a numeric argument,
   kill that many characters instead. */
function rl_delete(count, key) {
    if (count < 0) {
        rl_rubout(-count, key);
        return;
    }

    var before = rl_line_buffer.substring(0, rl_point);
    var after = rl_line_buffer.substring(rl_point+count);
    rl_line_buffer = before + after;
}

//extern int rl_rubout_or_delete PARAMS((int, int));
//extern int rl_delete_horizontal_space PARAMS((int, int));
//extern int rl_delete_or_show_completions PARAMS((int, int));
//extern int rl_insert_comment PARAMS((int, int));

/****************************************/
/* Bindable commands for changing case. */
/****************************************/

/* Uppercase the word at point. */
function rl_upcase_word(count, key) {
    var start = rl_point;
    rl_forward_word(count, 0);
    var stop = rl_point;

    var word = rl_line_buffer.substring(start, stop);
    rl_kill_text(start, stop);
    rl_insert_text(word.toUpperCase());
}

/* Lowercase the word at point. */
function rl_downcase_word(count, key) {
    var start = rl_point;
    rl_forward_word(count, 0);
    var stop = rl_point;

    var word = rl_line_buffer.substring(start, stop);
    rl_kill_text(start, stop);
    rl_insert_text(word.toLowerCase());
}

/* Upcase the first letter, downcase the rest. */
function rl_capitalize_word(count, key) {
    // note: actually incorrect, but CPython behaves that way too
    var c = rl_line_buffer[rl_point];
    rl_delete();
    rl_insert_text(c.toUpperCase());
    rl_forward_char(1, 0);
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

    if (rl_point == 0) {
        return;
    }

    rl_forward_char();

    var char_1 = rl_line_buffer[rl_point-1];
    var char_2 = rl_line_buffer[rl_point-2];
    rl_rubout();
    rl_rubout();
    rl_insert_text(char_1 + char_2);
}

/**************************************************/
/* Bindable commands for searching within a line. */
/**************************************************/

//extern int rl_char_search PARAMS((int, int));
//extern int rl_backward_char_search PARAMS((int, int));

/**********************************************************************/
/* Bindable commands for readline's interface to the command history. */
/**********************************************************************/

//extern int rl_beginning_of_history PARAMS((int, int));
//extern int rl_end_of_history PARAMS((int, int));
//extern int rl_get_next_history PARAMS((int, int));
//extern int rl_get_previous_history PARAMS((int, int));

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

//extern int rl_overwrite_mode PARAMS((int, int));

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
    rl_delete_text(start, rl_point);
}
//extern int rl_backward_kill_word PARAMS((int, int));

/* Kill from here to the end of the line.  If COUNT is negative, kill
   back to the line start instead. */
function rl_kill_line(count, key) {
    rl_line_buffer = rl_line_buffer.substring(0, rl_point);
}
//extern int rl_backward_kill_line PARAMS((int, int));
//extern int rl_kill_full_line PARAMS((int, int));

/* This does what C-w does in Unix.  We can't prevent people from
   using behaviour that they expect. */
function rl_unix_word_rubout(count, key) {
    var stop = rl_point;
    rl_backward_word(count, 0);
    rl_delete_text(rl_point, stop);
}
//extern int rl_unix_filename_rubout PARAMS((int, int));

/* Here is C-u doing what Unix does.  You don't *have* to use these
   key-bindings.  We have a choice of killing the entire line, or
   killing from where we are to the start of the line.  We choose the
   latter, because if you are a Unix weenie, then you haven't backspaced
   into the line at all, and if you aren't, then you know what you are
   doing. */
function rl_unix_line_discard(count, key) {
    rl_line_buffer = rl_line_buffer.substring(rl_point);
    rl_point = 0;
}
//extern int rl_copy_region_to_kill PARAMS((int, int));
//extern int rl_kill_region PARAMS((int, int));
//extern int rl_copy_forward_word PARAMS((int, int));
//extern int rl_copy_backward_word PARAMS((int, int));

/* Yank back the last killed text.  This ignores arguments. */
function rl_yank(count, key) {
    rl_insert_text(latestCut, count);
}

/* If the last command was yank, or yank_pop, and the text just
   before point is identical to the current kill item, then
   delete that text from the line, rotate the index down, and
   yank back some other text. */
function rl_yank_pop(count, key) {
    rl_insert_text(secondLatestCut, count);
}
//extern int rl_yank_nth_arg PARAMS((int, int));
//extern int rl_yank_last_arg PARAMS((int, int));
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
    rl_line_buffer = '';
    rl_point = 0;
}
//extern int rl_undo_command PARAMS((int, int));

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



function rl_handle_event(event) {
    var count = rl_numeric_arg * rl_arg_sign;
    count = Math.min(count, 1000000);

    if (rl_insert_next) {
        // still ignore Ctrl, Alt, Shift by themselves
        if (event.key.length > 1) {
            return false;
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
        rl_insert_next = false;
        rl_discard_argument();
        return true;
    }

    // dispatch
    var action;
    var folded = event.key.toLowerCase();
    if (event.altKey) {
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
        if (action !== rl_digit_argument) {
            rl_discard_argument();
        }
        return true;
    }
    return false;
}
