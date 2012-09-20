var fs = require('fs');
var continuation = require('../continuation');

var filename = process.argv[2];

fs.readFile(filename, 'utf-8', function(err, text) {
  var code = continuation.transform(text);
  console.log(code);
});