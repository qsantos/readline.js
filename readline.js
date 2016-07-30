/* Ported from readline.c, text.c and kill.c */


/****************/
/* Line buffer. */
/****************/

var rl_line_buffer = ''

/*************************************************/
/* The current offset in the current input line. */
/*************************************************/

var rl_point = 0;

var latestCut = '';
var secondLatestCut = '';

function prevWordStop() {
    var i = rl_point;
    while (i > 0 && rl_line_buffer[i-1] == ' ') {
        i--;
    }
    while (i > 0 && rl_line_buffer[i-1] != ' ') {
        i--;
    }
    return i;
}

function nextWordStop() {
    var i = rl_point;
    while (i < rl_line_buffer.length && rl_line_buffer[i-1] == ' ') {
        i++;
    }
    while (i < rl_line_buffer.length && rl_line_buffer[i-1] != ' ') {
        i++;
    }
    return i;
}

function rl_delete_text(start, stop) {
    secondLatestCut = latestCut;
    latestCut = rl_line_buffer.substring(start, stop);
    rl_line_buffer = rl_line_buffer.substring(0, start) + rl_line_buffer.substring(stop);
}

function rl_insert_text(text) {
    var before = rl_line_buffer.substring(0, rl_point);
    var after = rl_line_buffer.substring(rl_point);
    rl_line_buffer = before + text + after;
    rl_point += text.length;
}


/********************************************/
/* Bindable commands for numeric arguments. */
/********************************************/

//extern int rl_digit_argument PARAMS((int, int));
//extern int rl_universal_argument PARAMS((int, int));

/********************************************/
/* Bindable commands for moving the cursor. */
/********************************************/

function rl_forward_char(count, key) {
    rl_point += 1;
    if (rl_point > rl_line_buffer.length) {
        rl_point = rl_line_buffer.length;
    }
}
function rl_backward_char(count, key) {
    rl_point -= 1;
    if (rl_point < 0) {
        rl_point = 0;
    }
}
function rl_beg_of_line(count, key) {
    rl_point = 0;
}
function rl_end_of_line(count, key) {
    rl_point = rl_line_buffer.length;
}
function rl_forward_word(count, key) {
    rl_point = nextWordStop();
}
function rl_backward_word(count, key) {
    rl_point = prevWordStop();
}
//extern int rl_refresh_line PARAMS((int, int));
//extern int rl_clear_screen PARAMS((int, int));
//extern int rl_skip_csi_sequence PARAMS((int, int));
//extern int rl_arrow_keys PARAMS((int, int));

/******************************************************/
/* Bindable commands for inserting and deleting text. */
/******************************************************/

function rl_insert(count, key) {
    rl_insert_text(key);
}
//extern int rl_quoted_insert PARAMS((int, int));
//extern int rl_tab_insert PARAMS((int, int));
function rl_newline(count, key) {
    rl_linefunc(rl_line_buffer);
    rl_line_buffer = '';
    rl_point = 0;
}
//extern int rl_do_lowercase_version PARAMS((int, int));
function rl_rubout(count, key) {
    if (rl_point > 0) {
        var before = rl_line_buffer.substring(0, rl_point - 1);
        var after = rl_line_buffer.substring(rl_point);
        rl_line_buffer = before + after;
        rl_point -= 1;
    }
}
function rl_delete(count, key) {
    var before = rl_line_buffer.substring(0, rl_point);
    var after = rl_line_buffer.substring(rl_point+1);
    rl_line_buffer = before + after;
}
//extern int rl_rubout_or_delete PARAMS((int, int));
//extern int rl_delete_horizontal_space PARAMS((int, int));
//extern int rl_delete_or_show_completions PARAMS((int, int));
//extern int rl_insert_comment PARAMS((int, int));

/****************************************/
/* Bindable commands for changing case. */
/****************************************/

//extern int rl_upcase_word PARAMS((int, int));
//extern int rl_downcase_word PARAMS((int, int));
function rl_capitalize_word(count, key) {
    // note: actually incorrect, but CPython behaves that way too
    var c = rl_line_buffer[rl_point];
    rl_delete();
    rl_insert_text(c.toUpperCase());
    rl_point = nextWordStop();
}

/***********************************************************/
/* Bindable commands for transposing characters and words. */
/***********************************************************/

//extern int rl_transpose_words PARAMS((int, int));
//extern int rl_transpose_chars PARAMS((int, int));

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

function rl_kill_word(count, key) {
    var next = nextWordStop();
    rl_delete_text(rl_point, next);
}
//extern int rl_backward_kill_word PARAMS((int, int));
function rl_kill_line(count, key) {
    rl_line_buffer = rl_line_buffer.substring(0, rl_point);
}
//extern int rl_backward_kill_line PARAMS((int, int));
//extern int rl_kill_full_line PARAMS((int, int));
function rl_unix_word_rubout(count, key) {
    var prev = prevWordStop();
    rl_delete_text(prev, rl_point);
    rl_point = prev;
}
//extern int rl_unix_filename_rubout PARAMS((int, int));
function rl_unix_line_discard(count, key) {
    rl_line_buffer = rl_line_buffer.substring(rl_point);
    rl_point = 0;
}
//extern int rl_copy_region_to_kill PARAMS((int, int));
//extern int rl_kill_region PARAMS((int, int));
//extern int rl_copy_forward_word PARAMS((int, int));
//extern int rl_copy_backward_word PARAMS((int, int));
function rl_yank(count, key) {
    rl_insert_text(latestCut);
}
function rl_yank_pop(count, key) {
    rl_insert_text(secondLatestCut);
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
