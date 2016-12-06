/**
 * @file vue 单文件组件的解析器
 * @author sparklewhy@gmail.com
 */

var parse5 = require('parse5');
var path = require('path');
var validateTemplate = require('vue-template-validator');
var assign = require('object-assign');

/**
 * Ensure there's only one template node.
 *
 * @param {Fragment} fragment
 * @return {Boolean}
 */

function validateNodeCount(fragment) {
    var tplCount = 0;
    var scriptCount = 0;
    fragment.childNodes.forEach(function (node) {
        var name = node.nodeName;
        if (name === 'template') {
            tplCount++;
        }
        else if (name === 'script') {
            scriptCount++;
        }
    });
    return tplCount <= 1 || scriptCount <= 1;
}

/**
 * Check if a style node is scoped.
 *
 * @param {Node} node the node to check
 * @return {boolean}
 */
function isScoped(node) {
    return node.attrs && node.attrs.some(function (attr) {
        return attr.name === 'scoped';
    });
}

/**
 * get the specified node attribute value
 *
 * @param {Node} node the node to find
 * @param {string} attrName the attr name to find
 * @return {string|undefined}
 */
function getAttrValue(node, attrName) {
    if (node.attrs) {
        var i = node.attrs.length;
        while (i--) {
            var attr = node.attrs[i];
            if (attr.name === attrName) {
                return attr.value;
            }
        }
    }
}

function getAttrMap(node) {
    if (!node.attrs) {
        return {};
    }

    var attrMap = {};
    var i = node.attrs.length;
    while (i--) {
        var attr = node.attrs[i];
        attrMap[attr.name] = attr.value;
    }
    return attrMap;
}

/**
 * Get the lang attribute of a parse5 node.
 *
 * @param {Node} node the node to find
 * @return {string|undefined}
 */
function getLang(node) {
    return getAttrValue(node, 'lang');
}

/**
 * Get src import for a node, relative to the filePath if
 * available. Using readFileSync for now since this is a
 * rare use case.
 *
 * @param {Node} node the node to find
 * @return {string|undefined}
 */
function getSrc(node) {
    return getAttrValue(node, 'src');
}

function padBeforeContent(node) {
    // var startLine = node.startTag && node.startTag.line;
    // var endLine = node.endTag && node.endTag.line;
    var lines = '';
    for (var i = node.__location.line; i > 0; i--) {
        lines += '\n';
    }
    return lines;
}


/**
 * Extract the raw content of the given node.
 * This is more reliable because if the user uses a template language
 * that would confuse parse5 (e.g. ejs), the serialization result
 * would be different from original.
 *
 * @param {Node} node the node to extract
 * @param {string} source the source content
 * @param {string} type the type of the node content
 * @return {Object}
 */
function getRawContent(node, source, type) {
    var src = getSrc(node);
    var lang = getLang(node);
    var attrs = getAttrMap(node);
    var result = {
        src: src,
        type: type,
        lang: lang,
        attrs: attrs
    };

    var childNodes;
    if (type === 'template') {
        childNodes = node.content.childNodes;
    }
    else {
        childNodes = node.childNodes;
    }

    var len = childNodes.length;
    if (!len) {
        result.content = padBeforeContent(node);
        return result;
    }

    var start = childNodes[0].__location.startOffset;
    var end = childNodes[len - 1].__location.endOffset;
    return assign(result, {
        start: start,
        end: end,
        content: padBeforeContent(node) + source.slice(start, end).replace((/^(\r?\n)+/), '')
    });
}

/**
 * 解析 单文件 vue 组件
 *
 * @param {string} fileName 文件名
 * @param {string} content 文件内容
 * @return {Object}
 */
function parse(fileName, content) {
    // parse the file into an HTML tree
    var fragment = parse5.parseFragment(content, {locationInfo: true});
    // check node numbers
    if (!validateNodeCount(fragment)) {
        throw new Error(
            'Only one script tag and one template tag allowed per *.vue file.'
        );
    }

    var styles = [];
    var resolvedParts = {
        styles: styles,
        template: null,
        script: null,
        filePath: fileName,
        content: content
    };
    fragment.childNodes.map(function (node) {
        switch (node.nodeName) {
            case 'template':
                var template = getRawContent(node, content, 'template');
                resolvedParts.template = template;

                if (!template.lang) {
                    var warnings = validateTemplate(node.content, content);
                    if (warnings) {
                        var relativePath = path.relative(process.cwd(), fileName);
                        warnings.forEach(function (msg) {
                            console.warn('\n  Error in '
                                    + relativePath + ':\n' + msg);
                        });
                    }
                }
                break;
            case 'style':
                var style = getRawContent(node, content, 'style');
                style.scoped = isScoped(node);
                styles.push(style);
                break;
            case 'script':
                var script = getRawContent(node, content, 'script');
                resolvedParts.script = script;
                break;
        }
    });

    return resolvedParts;
}

module.exports = exports = parse;
