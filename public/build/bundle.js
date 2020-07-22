
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

    const file = "src/App.svelte";

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
    	let div1;
    	let div0;
    	let t11;
    	let footer;
    	let p1;
    	let t12;
    	let t13;
    	let mounted;
    	let dispose;

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
    			div1 = element("div");
    			div0 = element("div");
    			t11 = space();
    			footer = element("footer");
    			p1 = element("p");
    			t12 = text("Created by ");
    			t13 = text(/*fullName*/ ctx[4]);
    			set_style(h2, "color", /*favColor*/ ctx[0]);
    			attr_dev(h2, "class", "svelte-watzbd");
    			add_location(h2, file, 20, 1, 347);
    			set_style(p0, "color", /*favColor*/ ctx[0]);
    			add_location(p0, file, 21, 1, 397);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file, 23, 1, 508);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "255");
    			add_location(input1, file, 25, 9, 565);
    			attr_dev(li0, "class", "svelte-watzbd");
    			add_location(li0, file, 25, 2, 558);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "min", "0");
    			attr_dev(input2, "max", "255");
    			add_location(input2, file, 26, 9, 636);
    			attr_dev(li1, "class", "svelte-watzbd");
    			add_location(li1, file, 26, 2, 629);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "min", "0");
    			attr_dev(input3, "max", "255");
    			add_location(input3, file, 27, 9, 709);
    			attr_dev(li2, "class", "svelte-watzbd");
    			add_location(li2, file, 27, 2, 702);
    			add_location(ul, file, 24, 1, 551);
    			attr_dev(div0, "class", "color svelte-watzbd");
    			set_style(div0, "background", "rgb(" + /*red*/ ctx[1] + "," + /*green*/ ctx[2] + "," + /*blue*/ ctx[3] + ")");
    			add_location(div0, file, 30, 2, 803);
    			attr_dev(div1, "class", "colors svelte-watzbd");
    			add_location(div1, file, 29, 1, 780);
    			attr_dev(p1, "id", "message");
    			attr_dev(p1, "class", "svelte-watzbd");
    			add_location(p1, file, 33, 2, 894);
    			attr_dev(footer, "class", "svelte-watzbd");
    			add_location(footer, file, 32, 1, 883);
    			attr_dev(main, "class", "svelte-watzbd");
    			add_location(main, file, 19, 0, 339);
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
    			set_input_value(input1, /*red*/ ctx[1]);
    			append_dev(ul, t6);
    			append_dev(ul, li1);
    			append_dev(li1, t7);
    			append_dev(li1, input2);
    			set_input_value(input2, /*green*/ ctx[2]);
    			append_dev(ul, t8);
    			append_dev(ul, li2);
    			append_dev(li2, t9);
    			append_dev(li2, input3);
    			set_input_value(input3, /*blue*/ ctx[3]);
    			append_dev(main, t10);
    			append_dev(main, div1);
    			append_dev(div1, div0);
    			append_dev(main, t11);
    			append_dev(main, footer);
    			append_dev(footer, p1);
    			append_dev(p1, t12);
    			append_dev(p1, t13);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[8])
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

    			if (dirty & /*red*/ 2 && to_number(input1.value) !== /*red*/ ctx[1]) {
    				set_input_value(input1, /*red*/ ctx[1]);
    			}

    			if (dirty & /*green*/ 4 && to_number(input2.value) !== /*green*/ ctx[2]) {
    				set_input_value(input2, /*green*/ ctx[2]);
    			}

    			if (dirty & /*blue*/ 8 && to_number(input3.value) !== /*blue*/ ctx[3]) {
    				set_input_value(input3, /*blue*/ ctx[3]);
    			}

    			if (dirty & /*red, green, blue*/ 14) {
    				set_style(div0, "background", "rgb(" + /*red*/ ctx[1] + "," + /*green*/ ctx[2] + "," + /*blue*/ ctx[3] + ")");
    			}

    			if (dirty & /*fullName*/ 16) set_data_dev(t13, /*fullName*/ ctx[4]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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
    	let favColor = "Red";

    	const changeColor = () => {
    		$$invalidate(0, favColor = "Purple");
    	};

    	let red = 0;
    	let green = 0;
    	let blue = 0;

    	//Access value of input
    	const handleInput = param => {
    		$$invalidate(0, favColor = param.target.value);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function input0_input_handler() {
    		favColor = this.value;
    		$$invalidate(0, favColor);
    	}

    	function input1_input_handler() {
    		red = to_number(this.value);
    		$$invalidate(1, red);
    	}

    	function input2_input_handler() {
    		green = to_number(this.value);
    		$$invalidate(2, green);
    	}

    	function input3_input_handler() {
    		blue = to_number(this.value);
    		$$invalidate(3, blue);
    	}

    	$$self.$capture_state = () => ({
    		firstName,
    		lastName,
    		favColor,
    		changeColor,
    		red,
    		green,
    		blue,
    		handleInput,
    		fullName
    	});

    	$$self.$inject_state = $$props => {
    		if ("firstName" in $$props) $$invalidate(9, firstName = $$props.firstName);
    		if ("lastName" in $$props) $$invalidate(10, lastName = $$props.lastName);
    		if ("favColor" in $$props) $$invalidate(0, favColor = $$props.favColor);
    		if ("red" in $$props) $$invalidate(1, red = $$props.red);
    		if ("green" in $$props) $$invalidate(2, green = $$props.green);
    		if ("blue" in $$props) $$invalidate(3, blue = $$props.blue);
    		if ("fullName" in $$props) $$invalidate(4, fullName = $$props.fullName);
    	};

    	let fullName;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 $$invalidate(4, fullName = `${firstName} ${lastName}`);

    	return [
    		favColor,
    		red,
    		green,
    		blue,
    		fullName,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
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
