/**
 * @file 入口模块
 * @author sparklewhy@gmail.com
 */

var vueCompilerCore = require('vue-compiler-core');

function generateHotReloadUpdateCode(id) {
    return '    hotAPI.update("' + id + '", __vue__options__, __vue__options__.template)\n';
}

function getPostTemplateHandler(opts) {
    var handler = opts.postTemplate;
    var rewriter = require('./lib/template-rewrite');
    if (typeof handler !== 'function') {
        return rewriter;
    }

    return function () {
        var args = [].slice.apply(arguments);
        var result = rewriter.apply(this, args);
        args[1] = result;
        return handler.apply(this, args);
    };
}

module.exports = exports = {
    compiler: vueCompilerCore.compiler,
    compile: function (filePath, content, options) {
        var assign = require('object-assign');
        var opts = assign({}, options, {
            scopedCssPrefix: options.scopedCssPrefix || '_v-',
            hotReloadUpdateCode: generateHotReloadUpdateCode,
            hostPkgName: require('./package.json').name
        });

        opts.template = assign(opts.template || {}, {
            compileToRender: false,
            postTemplate: getPostTemplateHandler(opts.template || {})
        });
        var parser = require('./lib/parser');
        var parts = vueCompilerCore.parse(filePath, content, parser);
        return vueCompilerCore.compile(parts, opts);
    },
    registerFisParser: vueCompilerCore.registerFisParser,
    registerParser: vueCompilerCore.registerParser
};
