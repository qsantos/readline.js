/* Rough equivalent of search.c and isearch.c */

var _rl_noninc_text;

/* Search through the history looking for an interactively typed string.
   This is analogous to i-search.  We start the search in the current line.
   DIRECTION is which direction to search; >= 0 means forward, < 0 means
   backwards. */
function rl_search_history(direction) {
    rl_redisplay();  // avoid a redisplay from clearing out the prompt

    var pattern = '';
    var match = '';
    function redisplay() {
        // first set the line buffer to the first history match
        var index = rl_history_index;
        while (true) {
            // next history entry
            if (direction < 0) {
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
            var line = rl_history[index];

            // search for a match
            var offset = line.indexOf(pattern);
            if (offset < 0) {
                continue;
            }
            match = line;

            // found one! let us alter the line buffer
            var decorated = '';
            decorated += line.substring(0, offset);
            decorated += '\x1b[4m';  // underline
            decorated += line.substring(offset, offset + pattern.length);
            decorated += '\x1b[m';  // reset attributes
            decorated += line.substring(offset + pattern.length);
            rl_line_buffer = decorated;
            rl_point = decorated.length;
            rl_redisplay();
            break;
        }

        // now we show the prompt

        // temporarily go to next line
        write('\x1b[s');  // save cursor state
        write('\n');  // next line
        write('\x1b[2K');  // clear line

        if (direction < 0) {
            write('bck');
        } else {
            write('fwd');
        }
        write('-i-search: ' + pattern + '_');
        write('\x1b[u');  // restore cursor state
    }
    redisplay();

    function type(key) {
        if (key.length == 1 && key >= ' ') {
            pattern += key;
            redisplay();
            rl_read_key(type);
        } else if (key == 'Backspace') {
            pattern = pattern.substring(0, pattern.length-1);
            redisplay();
            rl_read_key(type);
        } else {
            write('\x1b[s');  // save cursor state
            write('\n');  // next line
            write('\x1b[2K');  // clear line
            write('\x1b[u');  // restore cursor state
            rl_line_buffer = match;
            rl_point = match.length;
        }
    }
    rl_read_key(type);
}

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

/* Search backwards through the history looking for a string which is typed
   interactively.  Start with the current line. */
function rl_reverse_search_history(count, key) {
    rl_search_history(-count, key);
}

/* Search forwards through the history looking for a string which is typed
   interactively.  Start with the current line. */
function rl_forward_search_history(count, key) {
    rl_search_history(count, key);
}


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
