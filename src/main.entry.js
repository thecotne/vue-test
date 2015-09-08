var clone = require('vue/src/parsers/template').clone;
var content = require('vue/src/element-directives/content');
var R = require('ramda');

/**
 * Extract qualified content nodes from a node list.
 *
 * @param {NodeList} nodes
 * @param {Element} parent
 * @param {Boolean} main
 * @return {DocumentFragment}
 */

function extractFragment (nodes, parent, main) {
    var frag = document.createDocumentFragment()
    for (var i = 0, l = nodes.length; i < l; i++) {
        var node = nodes[i]
        // if this is the main outlet, we want to skip all
        // previously selected nodes;
        // otherwise, we want to mark the node as selected.
        // clone the node so the original raw content remains
        // intact. this ensures proper re-compilation in cases
        // where the outlet is inside a conditional block
        if (main && !node.__v_selected) {
            frag.appendChild(clone(node))
        } else if (!main && node.parentNode === parent) {
            node.__v_selected = true
            frag.appendChild(clone(node))
        }
    }
    return frag
}

content.bind = function () {
    var vm = this.vm;
    var host = vm;

    // we need find the content context, which is the
    // closest non-inline-repeater instance.
    while (host.$options._repeat) {
        host = host.$parent;
    }
    var raw = host.$options._content;
    var content;
    if (!raw) {
        this.fallback();
        return;
    }
    var _with = this._checkParam('with-local-scope');
    if (_with !== null) {
        var context = vm;
    } else {
        var context = host._context;
    }
    var selector = this._checkParam('select');
    if (!selector) {
        // Default content
        var self = this;
        var compileDefaultContent = function () {
            self.compile(
                extractFragment(raw.childNodes, raw, true),
                context,
                vm
            );
        }
        if (!host._isCompiled) {
            // defer until the end of instance compilation,
            // because the default outlet must wait until all
            // other possible outlets with selectors have picked
            // out their contents.
            host.$once('hook:compiled', compileDefaultContent);
        } else {
            compileDefaultContent();
        }
    } else {
        // select content
        var nodes = raw.querySelectorAll(selector);
        if (nodes.length) {
            content = extractFragment(nodes, raw);
            if (content.hasChildNodes()) {
                this.compile(content, context, vm);
            } else {
                this.fallback();
            }
        } else {
            this.fallback();
        }
    }
};


Vue.elementDirective('content', content);


Vue.component('my-list', {
    template: '#my-list',
    props: {
        list: {
            required: true,
        }
    }
});


var vm = new Vue({
    el: '#app',
    data: {
        item: {
            name: 'here',
        },
        list: [
            {
                name: 'cotne'
            }, {
                name: 'jon'
            }
        ]
    }
});
