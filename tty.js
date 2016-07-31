/* Terminal emulation */

var written = '';

function write(text) {
    written += text;
}

function textclass(class_, text) {
    return '<span class="' + class_ + '">' + text + '</span>';
}

function escape(text) {
    // html entities
    text = text.replace(/&/g, '&amp;');
    text = text.replace(/</g, '&lt;');
    text = text.replace(/ /g, '&nbsp;');
    text = text.replace(/\n/g, '<br>');

    // non-printable characters
    text = text.replace(/\x1b/g, textclass('escape', '^['));  // escape
    text = text.replace(/[\x00-\x1f]/g, function(c) {
        var name = String.fromCharCode(64 + c.charCodeAt());
        return textclass('escape', '^' + name);
    });
    text = text.replace(/\x7f/g, textclass('escape', '^?'));

    return text;
}

function tty2html() {
    var before = rl_line_buffer.substring(0, rl_point);
    var inner;
    if (rl_point == rl_line_buffer.length) {
        inner = '&nbsp';
    } else {
        inner = escape(rl_line_buffer.charAt(rl_point));
    }
    var inner = textclass('caret', inner);
    var after = rl_line_buffer.substring(rl_point + 1);
    return escape(written) + escape(before) + inner + escape(after);
}
