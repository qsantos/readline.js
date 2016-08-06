/* Rough equivalent of search.c and isearch.c */

var _rl_noninc_text;

/* Search non-interactively through the history list.  DIR < 0 means to
   search backwards through the history of previous commands; otherwise
   the search is for commands subsequent to the current position in the
   history list. */
function rl_noninc_search(dir) {
    if (
        _rl_last_func != rl_noninc_forward_search &&
        _rl_last_func != rl_noninc_reverse_search
    ) {
        _rl_noninc_text = rl_line_buffer;
    }

    var index = rl_history_index;
    while (true) {
        if (dir < 0) {
            index--;
            if (index < 0) {
                break;
            }
        } else {
            index++;
            if (index >= rl_history.length) {
                break;
            }
        }

        if (rl_history[index].startsWith(_rl_noninc_text)) {
            rl_history_seek(index);
            break;
        }
    }
}

/************************************************/
/* Bindable commands for incremental searching. */
/************************************************/

//extern int rl_reverse_search_history PARAMS((int, int));
//extern int rl_forward_search_history PARAMS((int, int));


/****************************************************************************/
/* Bindable commands for incremental and non-incremental history searching. */
/****************************************************************************/

//extern int rl_history_search_forward PARAMS((int, int));
//extern int rl_history_search_backward PARAMS((int, int));
//extern int rl_history_substr_search_forward PARAMS((int, int));
//extern int rl_history_substr_search_backward PARAMS((int, int));

/* Search forward through the history list for a string. */
function rl_noninc_forward_search(count, key) {
    rl_noninc_search(count);
}

/* Reverse search the history list for a string. */
function rl_noninc_reverse_search(count, key) {
    rl_noninc_search(-count);
}
