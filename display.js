/* Rough equivalent of display.c */

var tty = document.querySelector('#tty');
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing
var isComposing = false;

var rl_previous_point;
var rl_previous_prompt;
var rl_previous_line_buffer = '';
var rl_previous_message_buffer = '';
function rl_redisplay() {
    // check whether we really need to redraw
    if (
        rl_point == rl_previous_point &&
        rl_prompt == rl_previous_prompt &&
        rl_line_buffer == rl_previous_line_buffer &&
        rl_message_buffer == rl_previous_message_buffer
    ) {
        tty_redisplay();
        return;
    }

    // reset all lines used by readline

    // message buffer
    if (rl_previous_message_buffer) {
        write('\x1b[B');  // cursor down
        write('\x1b[2K');  // erase full line
        write('\x1b[A');  // cursor up
    }

    // line buffer
    var newlines = (rl_previous_line_buffer.match(/\n/g) || []).length;
    for (var i = 0; i < newlines; i++) {
        write('\x1b[2K');  // erase full line
        write('\x1b[A');  // cursor up
    }
    write('\x1b[2K');  // erase full line

    // reset cursor
    write('\r');  // cursor to beginning of line
    write('\x1b[m');  // reset display mode attributes

    // print prompt, line and message
    write(rl_prompt + rl_line_buffer);
    if (rl_message_buffer) {
        write('\x1b[s');  // save cursor state
        write('\n');  // next line
        write('\x1b[m');  // reset attributes
        write(rl_message_buffer);
        write('\x1b[u');  // restore cursor state
    }

    // position tty's cursor at readline's caret
    var d = rl_line_buffer.length - rl_point;
    if (d > 0) {
        write('\x1b[' + d + 'D');  // cursor backward d times
    }

    tty_redisplay();

    rl_previous_point = rl_point;
    rl_previous_prompt = rl_prompt;
    rl_previous_line_buffer = rl_line_buffer;
    rl_previous_message_buffer = rl_message_buffer;
}

var rl_prompt = "";
var rl_linefunc;
function rl_callback_handler_install(prompt, linefunc) {
    rl_prompt = prompt;
    rl_linefunc = linefunc;
    rl_redisplay();
}

tty.addEventListener('focus', function(event) {
    document.querySelector('#unfocus_help').style.visibility = 'visible';
});

tty.addEventListener('blur', function(event) {
    document.querySelector('#unfocus_help').style.visibility = 'hidden';
});

tty.addEventListener('keydown', function(event) {
    if (isComposing) {
        return;
    }

    if (event.key == 'Control' && event.location == 2) {  // right control
        tty.blur();
        rl_redisplay();
        event.stopPropagation();
    } else if (event.key == 'V' && event.ctrlKey) {  // Ctrl+Shift+V = pasting
    } else if (!event.ctrlKey && !event.altKey && event.key.length == 1) {
        // on Firefox, compositionstart is preceded by the keydown of the first
        // typed character; to prevent this, we delay the handling of simple
        // printable characters to keypress, which is not fired before a
        // composititonstart
    } else if (rl_handle_event(event)) {
        rl_redisplay();
        // on Chromium, catching all key presses prevents compositions; thus,
        // we only catch key presses that are actually used by readline
        event.preventDefault();
    }
});

// handle simple printable characters
tty.addEventListener('keypress', function(event) {
    if (isComposing) {
        return;
    }

    // Ctrl+Shift+V = pasting
    if (event.key == 'V' && event.ctrlKey) {
        return;
    }

    if (rl_handle_event(event)) {
        rl_redisplay();
    }
    event.preventDefault();
});

// https://github.com/liftoff/GateOne/issues/188
tty.addEventListener('compositionstart', function(event) {
    isComposing = true;
    rl_redisplay();
    event.preventDefault();
});

tty.addEventListener('compositionend', function(event) {
    isComposing = false;
    event.preventDefault();

    if (!event.data) {
        return;
    }

    var count = rl_numeric_arg * rl_arg_sign;
    count = Math.min(count, 1000000);

    rl_insert_text(event.data, count);

    _rl_last_func = null;
    if (_rl_last_command_was_kill > 0) {
        _rl_last_command_was_kill--;
    }
    rl_discard_argument();

    // on Chromium, the insertion of the composition happens *after*
    // compositionend; to avoid it from being inserted regardless, we postpone
    // the refresh of the screen until this has taken place, using a 0 ms delay
    setTimeout(rl_redisplay, 0);
});

tty.addEventListener('paste', function(event) {
    rl_insert_text(event.clipboardData.getData("text/plain"));
    rl_redisplay();
    event.preventDefault();
});

tty.addEventListener('drop', function(event) {
    var data = event.dataTransfer;
    var text;
    if (data.types.contains("text/x-moz-url")) { // file
        text = data.getData("text/x-moz-url");
        // strip file:// prefix
        if (text.startsWith("file://")) {
            text = text.substring(7);
        }
    } else if (data.types.contains("text/x-moz-text-internal")) {  // tab
        text = data.getData("text/x-moz-text-internal");
    } else { // Other
        text = data.getData("text/plain");
    }
    rl_insert_text(text);
    rl_redisplay();
    event.preventDefault();
});

var PS1 = '\x1b[32m$\x1b[m ';
rl_callback_handler_install(PS1, write);
tty.focus();
