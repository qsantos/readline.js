CC=uglifyjs
CFLAGS=--wrap readline -m toplevel=true,eval=true -c sequences=true,properties=true,dead_code=true,drop_debugger=true,conditionals=true,comparisons=true,evaluate=true,booleans=true,loops=true,unused=true,hoist_funs=true,if_return=true,join_vars=true,cascade=true,pure_getters=true,drop_console=true
SRC=parens.js text.js kill.js misc.js undo.js history.js search.js readline.js emacs_keymap.js escape.js tty.js complete.js display.js module.js

readline.min.js: $(SRC)
	$(CC) $^ $(CFLAGS) -o $@
