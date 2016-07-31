/* Rough equivalent of display.c */

var code = document.querySelector('#code');
var enableInput = true;

function update() {
    write('\x1b[1K\r' + rl_prompt + rl_line_buffer);
    var d = rl_line_buffer.length - rl_point;
    if (d > 0) {
        write('\x1b[' + d + 'D');
    }
    code.innerHTML = tty2html();
    code.scrollTop = code.scrollHeight;
}

var rl_prompt = "";
var rl_linefunc;
function rl_callback_handler_install(prompt, linefunc) {
    rl_prompt = prompt;
    rl_linefunc = linefunc;
    write(rl_prompt);
    update();
}

code.addEventListener('focus', function(event) {
    document.querySelector('#unfocus_help').style.visibility = 'visible';
});

code.addEventListener('blur', function(event) {
    document.querySelector('#unfocus_help').style.visibility = 'hidden';
});

code.addEventListener('keydown', function(event) {
    if (!enableInput)
        return;

    if (event.key == 'Control' && event.location == 2) {  // right control
        code.blur();
        update();
        event.stopPropagation();
    } else if (event.key == 'V' && event.ctrlKey) {  // Ctrl+Shift+V = pasting
    } else {
        if (rl_handle_event(event)) {
            update();
        }
        event.preventDefault();
    }
});

// https://github.com/liftoff/GateOne/issues/188
code.addEventListener('compositionstart', function(event) {
    enableInput = false;
    event.preventDefault();
});

code.addEventListener('compositionend', function(event) {
    rl_insert_text(event.data);
    update();
    enableInput = true;
    event.preventDefault();
});

code.addEventListener('paste', function(event) {
    rl_insert_text(event.clipboardData.getData("text/plain"));
    update();
    event.preventDefault();
});

code.addEventListener('drop', function(event) {
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
    update();
    event.preventDefault();
});

rl_callback_handler_install('<span style="color:green">$</span> ', write);
code.focus();
