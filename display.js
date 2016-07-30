/* Rough equivalent of display.c */

var code = document.querySelector('#code');
var enableInput = true;

function textclass(class_, text) {
    return '<span class="' + class_ + '">' + text + '</span>';
}

function escape(text) {
    // html entities
    text = text.replace(/&/g, '&amp;');
    text = text.replace(/</g, '&lt;');
    text = text.replace(/ /g, '&nbsp;');

    // non-printable characters
    text = text.replace(/\x1b/g, textclass('escape', '^['));  // escape
    text = text.replace(/[\x00-\x1f]/g, function(c) {
        var name = String.fromCharCode(64 + c.charCodeAt());
        return textclass('escape', '^' + name);
    });
    text = text.replace(/\x7f/g, textclass('escape', '^?'));

    return text;
}

var rl_prompt = "";
var rl_linefunc;
function rl_callback_handler_install(prompt, linefunc) {
    rl_prompt = prompt;
    rl_linefunc = linefunc;
    update();
}

function update() {
    var before = rl_line_buffer.substring(0, rl_point);
    var inner;
    if (rl_point == rl_line_buffer.length) {
        inner = '&nbsp';
    } else {
        inner = escape(rl_line_buffer.charAt(rl_point));
    }
    var inner = textclass('caret', inner);
    var after = rl_line_buffer.substring(rl_point + 1);
    code.innerHTML = rl_prompt + escape(before) + inner + escape(after);
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

rl_callback_handler_install('<span style="color:green">$</span> ', alert);
code.focus();
