/**
 * @file 模板重写：添加 scope 样式的属性信息
 * @author sparklewhy@gmail.com
 */

var parse5 = require('parse5');

function walk(tree, fn) {
    if (tree.childNodes) {
        tree.childNodes.forEach(function (node) {
            var isTemplate = node.tagName === 'template';
            if (!isTemplate) {
                fn(node);
            }

            if (node.content) {
                walk(node.content, fn);
            }
            else {
                walk(node, fn);
            }
        });
    }
}

/**
 * Add attribute to template
 *
 * @param {string} filePath the file path
 * @param {string} html the content of template
 * @param {Object} options rewrite options
 * @return {string}
 */
module.exports = function (filePath, html, options) {
    var id = options.id;
    var tree = parse5.parseFragment(html);
    walk(tree, function (node) {
        if (node.attrs) {
            node.attrs.push({
                name: id,
                value: ''
            });
        }
    });

    return parse5.serialize(tree);
};
