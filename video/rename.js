#!/usr/bin/env node
var fs = require('fs');
var length = 58;
for (var i = 0; i < length; i++) {
    var before = 'html5lab-0.1.3-_00' + ((length - 1 - i) < 10 ? '0' : '') + (length - 1 - i) + '_レイヤー ' + (i + 1) + '.jpg';
    var after = 'html5lab-0.1.3-' + i + '.jpg';
    fs.renameSync(before, after);
}
