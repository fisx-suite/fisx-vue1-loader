/**
 * @file 入口模块
 * @author sparklewhy@gmail.com
 */

var vueCompilerCore = require('vue-compiler-core');

function generateHotReloadUpdateCode(id) {
    return '    hotAPI.update("' + id + '", __vue__options__, __vue__options__.template)\n';
}

module.exports = exports = {
    compiler: vueCompilerCore.compiler,
    compile: function (filePath, content, options) {
        var assign = require('object-assign');
        var opts = assign({}, options, {
            scopedCssPrefix: '_v-',
            compileToRender: false,
            postTemplate: require('./lib/template-rewrite'),
            hotReloadUpdateCode: generateHotReloadUpdateCode,
            hostPkgName: require('../package.json').name
        });
        var parser = require('./lib/parser');
        var parts = vueCompilerCore.parse(filePath, content, parser);
        return vueCompilerCore.compile(parts, opts);
    }
};
