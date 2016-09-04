/* Export some functions in a module named `readline`
   (see https://docs.python.org/3/library/readline.html) */

// make sure readline is defined
readline = readline || {};

// first, some useful basic functions

readline.init = readline_init;

// rough callback-based equivalent of Python's input()
readline.input = function(prompt, callback) {
    rl_prompt = prompt;
    rl_linefunc = callback;
    rl_redisplay();
}

// rough equivalent of Python's sys.stdout.write
readline.write = write;

/*************/
/* Init file */
/*************/

//readline.parse_and_bind(string)
//readline.read_init_file([filename])

/***************/
/* Line buffer */
/***************/

/* Return the current contents of the line buffer (rl_line_buffer in the
   underlying library). */
readline.get_line_buffer = function() {
    return rl_line_buffer;
}

/* Insert text into the line buffer at the cursor position. This calls
   rl_insert_text() in the underlying library, but ignores the return value. */
readline.insert_text = rl_insert_text;

/* Change what’s displayed on the screen to reflect the current contents of the
   line buffer. This calls rl_redisplay() in the underlying library. */
readline.redisplay = rl_redisplay;

/****************/
/* History file */
/****************/

/* Load a readline history file, and append it to the history list. The default
   filename is ~/.history. This calls read_history() in the underlying library.
   */
readline.read_history_file = read_history;

/* Save the history list to a readline history file, overwriting any existing
   file. The default filename is ~/.history. This calls write_history() in the
   underlying library. */
readline.write_history_file = write_history;

//readline.append_history_file(nelements[, filename])

/* Set or return the desired number of lines to save in the history file. The
   write_history_file() function uses this value to truncate the history file,
   by calling history_truncate_file() in the underlying library. Negative
   values imply unlimited history file size. */
readline.get_history_length = function() {
    return -1;
}
readline.set_history_length = function(length) {
}

/****************/
/* History list */
/****************/

/* Clear the current history. This calls clear_history() in the underlying
   library. */
readline.clear_history = function() {
    rl_history.splice(0);
}

/* Return the number of items currently in the history. (This is different from
   get_history_length(), which returns the maximum number of lines that will be
   written to a history file.) */
readline.get_current_history_length = function() {
    return rl_history.length;
}

/* Return the current contents of history item at index. The item index is
   one-based. This calls history_get() in the underlying library. */
readline.get_history_item = function(index) {
    return rl_history[index-1];
}

/* Remove history item specified by its position from the history. The position
   is zero-based. This calls remove_history() in the underlying library.*/
readline.remove_history_item = function(pos) {
    rl_history.splice(pos, 1);
    if (rl_history_index > pos) {
        rl_history_index--;
    }
}

/* Replace history item specified by its position with line. The position is
   zero-based. This calls replace_history_entry() in the underlying library. */
readline.replace_history_item = function(pos, line) {
    rl_history[pos] = line;
}

/* Append line to the history buffer, as if it was the last line typed. This
   calls add_history() in the underlying library. */
readline.add_history = function(line) {
    rl_history_append(line);
}

/*****************/
/* Startup hooks */
/*****************/

//readline.set_startup_hook([function])
//readline.set_pre_input_hook([function])

/**************/
/* Completion */
/**************/

/* Set or remove the completer function. If function is specified, it will be
   used as the new completer function; if omitted or None, any completer
   function already installed is removed. The completer function is called as
   function(text, state), for state in 0, 1, 2, ..., until it returns a
   non-string value. It should return the next possible completion starting
   with text.

   The installed completer function is invoked by the entry_func callback
   passed to rl_completion_matches() in the underlying library. The text string
   comes from the first parameter to the rl_attempted_completion_function
   callback of the underlying library. */
readline.set_completer = function(function_) {
    if (function_ === undefined) {
        function_ = rl_completion_default_entry_function;
    }
    rl_completion_entry_function = function_;
}

/* Get the completer function, or None if no completer function has been set.
   */
readline.get_completer = function() {
    if (rl_completion_entry_function == rl_completion_default_entry_function) {
        return null;
    } else {
        return rl_completion_entry_function;
    }
}

//readline.get_completion_type()
//readline.get_begidx()
//readline.get_endidx()

/* Set or get the word delimiters for completion. These determine the start of
   the word to be considered for completion (the completion scope). These
   functions access the rl_completer_word_break_characters variable in the
   underlying library. */
readline.set_completer_delims = function(string) {
    rl_completer_word_break_characters = string;
}
readline.get_completer_delims = function() {
    return rl_completer_word_break_characters;
}

//readline.set_completion_display_matches_hook([function])
