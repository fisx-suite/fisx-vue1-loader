var expect = require('expect.js');
var loader = require('../../index');
var fs = require('fs');

describe('Vue2 Loader', function () {
    it('should compile', function () {
        var filePath = 'test/fixtures/App.vue';
        var content = fs.readFileSync(filePath).toString();
        var result = loader.compile(filePath, content, {
            script: {
                lang: 'babel'
            },
            sourceMap: true
        });
        console.log(result);
    });
});
