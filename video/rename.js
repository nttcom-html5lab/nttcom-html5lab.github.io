#!/usr/bin/env node
var fs = require('fs');
for (var i = 0; i < 90; i++) {
    var before = 'html5lab__00' + ((89 - i) < 10 ? '0' : '') + (89 - i) + '_レイヤー ' + (i + 1) + '.jpg';
    //var before = 'html5lab_0' + (i < 10 ? '0' : '') + i + '.jpg';
    var after = 'html5lab_' + i + '.jpg';
    fs.renameSync(before, after);
}
