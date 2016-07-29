/* Rough equivalent of display.c */

var code = document.querySelector('#code');
var enableInput = true;

function escape(text) {
    // non-printable characters
    text = text.replace(/\x1b/g, '^[');  // escape
    text = text.replace(/[\x00-\x1f]/g, function(c) {
        return '^' + String.fromCharCode(64 + c.charCodeAt());
    });
    text = text.replace(/\x7f/g, '^?');

    // html entities
    text = text.replace(/&/g, '&amp;');
    text = text.replace(/</g, '&lt;');
    text = text.replace(/ /g, '&nbsp;');

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
    var inner = '<span class="caret">' + inner + '</span>';
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

    if (event.key == 'Escape') {
        code.blur();
    } else {
        rl_handle_event(event);
    }

    update();
    event.preventDefault();
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

rl_callback_handler_install('<span style="color:green">$</span> ', alert);
code.focus();
