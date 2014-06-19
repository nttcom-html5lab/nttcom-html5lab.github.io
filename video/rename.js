#!/usr/bin/env node
var fs = require('fs');
var length = 56;
for (var i = 0; i < length; i++) {
    var before = 'html5lab__00' + ((length - 1 - i) < 10 ? '0' : '') + (length - 1 - i) + '_レイヤー ' + (i + 1) + '.jpg';
    //var before = 'html5lab_0' + (i < 10 ? '0' : '') + i + '.jpg';
    var after = 'html5lab-0.1.2-' + i + '.jpg';
    fs.renameSync(before, after);
}
