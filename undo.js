/* Rough equivalent of undo.c */

/**************/
/* Undo utils */
/**************/

var _rl_undo_list = []
var _rl_undo_group_depth = 0;

/* Remember how to undo something.  Concatenate some undos if that
   seems right. */
function rl_add_undo() {
    if (_rl_undo_group_depth == 0) {
        _rl_undo_list.push([rl_line_buffer, rl_point]);
    }
}

/* Begin a group.  Subsequent undos are undone as an atomic operation. */
function rl_begin_undo_group() {
    rl_add_undo();
    _rl_undo_group_depth++;
}

/* End an undo group started with rl_begin_undo_group (). */
function rl_end_undo_group() {
    _rl_undo_group_depth--;
}

/***************************/
/* Bindable undo commands. */
/***************************/

/* Revert the current line to its previous state. */
function rl_revert_line(count, key) {
    rl_line_buffer = _rl_undo_list[0];
    _rl_undo_list = [];
}

/* Do some undoing of things that were done. */
function rl_undo_command(count, key) {
    if (count < 0) {
        return;
    }

    var undo;
    for (var _ = 0; _ < count; _++) {
        if (_rl_undo_list.length == 0) {
            return;
        }
        undo = _rl_undo_list.pop();
    }
    rl_line_buffer = undo[0];
    rl_point = undo[1];
}
