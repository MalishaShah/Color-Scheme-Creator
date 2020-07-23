
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.24.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (54:2) {#each colors as color}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let button;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[11](/*color*/ ctx[15], ...args);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Delete";
    			t2 = space();
    			attr_dev(div0, "class", "block svelte-1i3z0hy");
    			set_style(div0, "background", "rgb(" + /*color*/ ctx[15].red + "," + /*color*/ ctx[15].green + "," + /*color*/ ctx[15].blue + ")");
    			add_location(div0, file, 55, 3, 1375);
    			attr_dev(button, "class", "delete");
    			add_location(button, file, 56, 4, 1498);
    			attr_dev(div1, "class", "contain");
    			add_location(div1, file, 54, 3, 1348);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, button);
    			append_dev(div1, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						div0,
    						"click",
    						function () {
    							if (is_function(/*updateId*/ ctx[4](/*color*/ ctx[15].id))) /*updateId*/ ctx[4](/*color*/ ctx[15].id).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button, "click", click_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*colors*/ 2) {
    				set_style(div0, "background", "rgb(" + /*color*/ ctx[15].red + "," + /*color*/ ctx[15].green + "," + /*color*/ ctx[15].blue + ")");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(54:2) {#each colors as color}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h2;
    	let t0;
    	let t1;
    	let p0;
    	let t2;
    	let t3;
    	let input0;
    	let t4;
    	let ul;
    	let li0;
    	let t5;
    	let input1;
    	let t6;
    	let li1;
    	let t7;
    	let input2;
    	let t8;
    	let li2;
    	let t9;
    	let input3;
    	let t10;
    	let div;
    	let t11;
    	let button;
    	let t13;
    	let footer;
    	let p1;
    	let t14;
    	let t15;
    	let mounted;
    	let dispose;
    	let each_value = /*colors*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			t0 = text("Color Schemer");
    			t1 = space();
    			p0 = element("p");
    			t2 = text("What is your favorite color?");
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			ul = element("ul");
    			li0 = element("li");
    			t5 = text("R: ");
    			input1 = element("input");
    			t6 = space();
    			li1 = element("li");
    			t7 = text("G: ");
    			input2 = element("input");
    			t8 = space();
    			li2 = element("li");
    			t9 = text("B: ");
    			input3 = element("input");
    			t10 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t11 = space();
    			button = element("button");
    			button.textContent = "Add a color block";
    			t13 = space();
    			footer = element("footer");
    			p1 = element("p");
    			t14 = text("Created by ");
    			t15 = text(/*fullName*/ ctx[3]);
    			set_style(h2, "color", /*favColor*/ ctx[0]);
    			attr_dev(h2, "class", "svelte-1i3z0hy");
    			add_location(h2, file, 42, 1, 813);
    			set_style(p0, "color", /*favColor*/ ctx[0]);
    			add_location(p0, file, 43, 1, 863);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file, 45, 1, 974);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "255");
    			add_location(input1, file, 48, 9, 1032);
    			attr_dev(li0, "class", "svelte-1i3z0hy");
    			add_location(li0, file, 48, 2, 1025);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "min", "0");
    			attr_dev(input2, "max", "255");
    			add_location(input2, file, 49, 9, 1120);
    			attr_dev(li1, "class", "svelte-1i3z0hy");
    			add_location(li1, file, 49, 2, 1113);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "min", "0");
    			attr_dev(input3, "max", "255");
    			add_location(input3, file, 50, 9, 1210);
    			attr_dev(li2, "class", "svelte-1i3z0hy");
    			add_location(li2, file, 50, 2, 1203);
    			add_location(ul, file, 47, 1, 1018);
    			attr_dev(div, "class", "blocks svelte-1i3z0hy");
    			add_location(div, file, 52, 1, 1298);
    			add_location(button, file, 60, 1, 1605);
    			attr_dev(p1, "id", "message");
    			attr_dev(p1, "class", "svelte-1i3z0hy");
    			add_location(p1, file, 62, 2, 1672);
    			attr_dev(footer, "class", "svelte-1i3z0hy");
    			add_location(footer, file, 61, 1, 1661);
    			attr_dev(main, "class", "svelte-1i3z0hy");
    			add_location(main, file, 41, 0, 805);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(h2, t0);
    			append_dev(main, t1);
    			append_dev(main, p0);
    			append_dev(p0, t2);
    			append_dev(main, t3);
    			append_dev(main, input0);
    			set_input_value(input0, /*favColor*/ ctx[0]);
    			append_dev(main, t4);
    			append_dev(main, ul);
    			append_dev(ul, li0);
    			append_dev(li0, t5);
    			append_dev(li0, input1);
    			set_input_value(input1, /*colors*/ ctx[1][/*activeId*/ ctx[2]].red);
    			append_dev(ul, t6);
    			append_dev(ul, li1);
    			append_dev(li1, t7);
    			append_dev(li1, input2);
    			set_input_value(input2, /*colors*/ ctx[1][/*activeId*/ ctx[2]].green);
    			append_dev(ul, t8);
    			append_dev(ul, li2);
    			append_dev(li2, t9);
    			append_dev(li2, input3);
    			set_input_value(input3, /*colors*/ ctx[1][/*activeId*/ ctx[2]].blue);
    			append_dev(main, t10);
    			append_dev(main, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(main, t11);
    			append_dev(main, button);
    			append_dev(main, t13);
    			append_dev(main, footer);
    			append_dev(footer, p1);
    			append_dev(p1, t14);
    			append_dev(p1, t15);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[9]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[10]),
    					listen_dev(button, "click", /*newBlock*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*favColor*/ 1) {
    				set_style(h2, "color", /*favColor*/ ctx[0]);
    			}

    			if (dirty & /*favColor*/ 1) {
    				set_style(p0, "color", /*favColor*/ ctx[0]);
    			}

    			if (dirty & /*favColor*/ 1 && input0.value !== /*favColor*/ ctx[0]) {
    				set_input_value(input0, /*favColor*/ ctx[0]);
    			}

    			if (dirty & /*colors, activeId*/ 6 && to_number(input1.value) !== /*colors*/ ctx[1][/*activeId*/ ctx[2]].red) {
    				set_input_value(input1, /*colors*/ ctx[1][/*activeId*/ ctx[2]].red);
    			}

    			if (dirty & /*colors, activeId*/ 6 && to_number(input2.value) !== /*colors*/ ctx[1][/*activeId*/ ctx[2]].green) {
    				set_input_value(input2, /*colors*/ ctx[1][/*activeId*/ ctx[2]].green);
    			}

    			if (dirty & /*colors, activeId*/ 6 && to_number(input3.value) !== /*colors*/ ctx[1][/*activeId*/ ctx[2]].blue) {
    				set_input_value(input3, /*colors*/ ctx[1][/*activeId*/ ctx[2]].blue);
    			}

    			if (dirty & /*deleteClick, colors, updateId*/ 50) {
    				each_value = /*colors*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*fullName*/ 8) set_data_dev(t15, /*fullName*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let firstName = "Malisha";
    	let lastName = "Shah";
    	let favColor = "Black";

    	//Changes color of paragraph and header text
    	const handleInput = param => {
    		$$invalidate(0, favColor = param.target.value);
    	};

    	let colors = [{ red: 0, green: 0, blue: 0, id: 0 }];

    	//Keeps track of the most most recent clicked block
    	let activeId = 0;

    	const updateId = id => {
    		$$invalidate(2, activeId = id);
    	};

    	const deleteClick = id => {
    		$$invalidate(1, colors = colors.filter(color => color.id !== id));

    		for (let i = 0; i < colors.length; i++) {
    			$$invalidate(1, colors[i].id = i, colors);
    		}

    		$$invalidate(1, colors);
    		console.log(colors);
    	};

    	const newBlock = () => {
    		let id = colors.length;
    		let color = { red: 0, green: 0, blue: 0, id };
    		$$invalidate(1, colors = [...colors, color]);
    		console.log(colors);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function input0_input_handler() {
    		favColor = this.value;
    		$$invalidate(0, favColor);
    	}

    	function input1_input_handler() {
    		colors[activeId].red = to_number(this.value);
    		$$invalidate(1, colors);
    		$$invalidate(2, activeId);
    	}

    	function input2_input_handler() {
    		colors[activeId].green = to_number(this.value);
    		$$invalidate(1, colors);
    		$$invalidate(2, activeId);
    	}

    	function input3_input_handler() {
    		colors[activeId].blue = to_number(this.value);
    		$$invalidate(1, colors);
    		$$invalidate(2, activeId);
    	}

    	const click_handler = color => deleteClick(color.id);

    	$$self.$capture_state = () => ({
    		firstName,
    		lastName,
    		favColor,
    		handleInput,
    		colors,
    		activeId,
    		updateId,
    		deleteClick,
    		newBlock,
    		fullName
    	});

    	$$self.$inject_state = $$props => {
    		if ("firstName" in $$props) $$invalidate(12, firstName = $$props.firstName);
    		if ("lastName" in $$props) $$invalidate(13, lastName = $$props.lastName);
    		if ("favColor" in $$props) $$invalidate(0, favColor = $$props.favColor);
    		if ("colors" in $$props) $$invalidate(1, colors = $$props.colors);
    		if ("activeId" in $$props) $$invalidate(2, activeId = $$props.activeId);
    		if ("fullName" in $$props) $$invalidate(3, fullName = $$props.fullName);
    	};

    	let fullName;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 $$invalidate(3, fullName = `${firstName} ${lastName}`);

    	return [
    		favColor,
    		colors,
    		activeId,
    		fullName,
    		updateId,
    		deleteClick,
    		newBlock,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
