
const CompileHook = require('compile-hook');
const Falafel = require('falafel');


const hijack = (src) => {
    // add stream.PassThrough to store the variable in code
    var requires = 'var hackerStream = new require(\'stream\').PassThrough();\n';

    // walkthrough the ast of code
    var hacked = Falafel(src, (node) => {
        // export the hackerStream
        if (node.type === 'ExpressionStatement' && node.source().includes('module.exports')) {
            node.update(node.source() + '\n' + 'module.exports.hackerStream = hackerStream;\n');
        }

        if (node.type === "VariableDeclaration" && node.source().includes('result = 1 + 2 + 3')) {
            // save the variable 'result'
            node.update(node.source() + '\n' + 'hackerStream.push(result.toString());\n');
        }
    });

    return requires + hacked.toString();
};

// Place a hook that changes the code on the fly
CompileHook.placeHook((content, filename, done) => {
    if (filename.includes('/target.js')) {
        var hacked = hijack(content);
        done(hacked);
        return
    }

    done();
});

const target = require('./target');
// print variable result value
target.hackerStream.on('data', (chunk) => {
    console.log('hijack result:', chunk.toString());
});
