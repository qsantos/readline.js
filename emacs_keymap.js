/* Ported from emacs_keymaps.c */

function handle_standard_key(key) {
    // printable characters are just inserted
    if (key.length == 1 && key.charCodeAt() >= 32) {
        return rl_insert;
    }

    return {
        'ArrowLeft': rl_backward_char,
        'ArrowRight': rl_forward_char,
        'Backspace': rl_rubout,
        'Delete': rl_delete,
        'End': rl_end_of_line,
        'Home': rl_beg_of_line,
        'Enter': rl_newline,  // see Ctrl+j
    }[key];
}

function handle_ctrl_key(key) {
    return {
        //'@': rl_set_mark,
        'a': rl_beg_of_line,
        'b': rl_backward_char,
        'd': rl_delete,
        'e': rl_end_of_line,
        'f': rl_forward_char,
        //'g': rl_abort,
        'h': rl_rubout,
        //'i': rl_complete,
        'j': rl_newline,
        'k': rl_kill_line,
        //'l': rl_clear_screen,
        'm': rl_newline,
        //'n': rl_get_next_history,
        //'p': rl_get_previous_history,
        'q': rl_quoted_insert,
        //'r': rl_reverse_search_history,
        //'s': rl_forward_search_history,
        't': rl_transpose_chars,
        'u': rl_unix_line_discard,
        'v': rl_quoted_insert,
        'w': rl_unix_word_rubout,
        'y': rl_yank,
        //']': rl_char_search,
        //'_': rl_undo_command,
        'backspace': rl_unix_word_rubout,  // non-standard
    }[key];
}

function handle_meta_key(key) {
    return {
        //' ': rl_set_mark,
        //'#': rl_insert_comment,
        //'&': rl_tilde_expand,
        //'*': rl_insert_completions,
        '-': rl_digit_argument,
        //'.': rl_yank_last_arg,
        '0': rl_digit_argument,
        '1': rl_digit_argument,
        '2': rl_digit_argument,
        '3': rl_digit_argument,
        '4': rl_digit_argument,
        '5': rl_digit_argument,
        '6': rl_digit_argument,
        '7': rl_digit_argument,
        '8': rl_digit_argument,
        '9': rl_digit_argument,
        //'<': rl_beginning_of_history,
        //'=': rl_possible_completions,
        //'>': rl_end_of_history,
        //'?': rl_possible_completions,
        //'\': rl_delete_horizontal_space,
        //'_': rl_yank_last_arg,
        'b': rl_backward_word,
        'c': rl_capitalize_word,
        'd': rl_kill_word,
        'f': rl_forward_word,
        'l': rl_downcase_word,
        //'n': rl_noninc_forward_search,
        //'p': rl_noninc_reverse_search,
        'r': rl_revert_line,
        //'t': rl_transpose_words,
        'u': rl_upcase_word,
        'y': rl_yank_pop,
        //'~': rl_tilde_expand,
        //'backspace': rl_backward_kill_word,
    }[key];
}

function handle_meta_ctrl_key(key) {
    return {
        //'g': rl_abort,
        //'h': rl_backward_kill_word,
        //'i': rl_tab_insert,
        //'j': rl_vi_editing_mode,
        //'m': rl_vi_editing_mode,
        'r': rl_revert_line,
        //'y': rl_yank_nth_arg,
        //'[': rl_complete,
        //']': rl_backward_char_search,
    }[key];
}
