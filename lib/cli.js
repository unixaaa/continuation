var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var commander = require('commander');
var meta = require('../package.json');

var options = {
  compileMark: false
};

var cacheDefaultPath = '/tmp/continuation';

var initialize = function () {
  commander.version(meta.version);
  commander.usage('[options] <file.js/file.coffee/file.ls> [arguments]');
  commander.option('-p, --print', 'compile script file and print it');
  commander.option('-o, --output <filename>', 'compile script file and save as <filename>');
  commander.option('-e, --explicit', 'compile only if "use continuation" is explicitly declared');
  commander.option('-c, --cache [directory]', 'run and cache compiled sources to [directory], by default [directory] is ' + cacheDefaultPath);
  commander.option('-v, --verbose', 'print verbosal information to stderr');
  commander.parse(process.argv);
};

var main = exports.main =  function () {
  initialize();
  
  var filename = commander.args[0];
  if (commander.explicit) {
    options.compileMark = true;
  }
  if (commander.cache) {
    options.cache = commander.cache;
    if (options.cache === true) {
      options.cache = cacheDefaultPath;
    }
  }
  if (commander.verbose) {
    options.verbose = true;
  }
  
  try {
    if (!filename) throw new Error('You should specify a script file.');
    filename = fs.realpathSync(filename);
  } catch (e) {
    console.error(e.toString());
    console.error(commander.helpInformation());
    process.exit(-1);
  }
  var code = compile(filename);
  
  var print = false;
  if (commander.print)
    print = true;
  if (commander.output)
    print = true;

  if (print) {
    outputCode(code);
  } else {
    runCode(code, filename);
  }
};

var outputCode = function (code) {
  if (commander.output) {
    fs.writeFile(commander.output, code, function (err) {
      if (err) {
        console.error(err.stack);
      }
    });
  } else {
    console.log(code);
  }
};

var runCode = function (code, filename) {
  //Set current module information
  var mainModule = require.main;
  mainModule.filename = filename;
  mainModule.moduleCache = {};
  mainModule.children = [];
  mainModule.paths = calculatePaths(filename);
  
  //Register require handler
  require.extensions['.js'] = execute;
  require.extensions['.coffee'] = execute;
  require.extensions['.ls'] = execute;
  
  //Generate program arguments
  var args = commander.args.slice(1);
  process.argv = [process.argv[0], filename].concat(args);
  
  //Run
  mainModule._compile(code, filename);
};

var compile = function (filename) {
  var continuation = require('../continuation');
  
  if (options.verbose) {
    console.error('Load ' + filename);
  }
  
  if (options.cache) {
    code = readCache(filename);
    if (code !== null) {
      if (options.verbose) {
        console.error('Cache hit');
      }
      return code;
    }
  }
  
  var code = fs.readFileSync(filename, 'utf-8');
  
  try {
    var ext = path.extname(filename);
    if (ext === '.coffee') {
      //Coffee-script support
      coffeescript = require('coffee-script');
      code = coffeescript.compile(code);
    } else if (ext === '.ls') {
      //LiveScript support
      var livescript = require('LiveScript');
      code = livescript.compile(code);
    }
    code = continuation.compile(code, options);
  } catch (err) {
    console.error('In file', filename);
    console.error(err.stack);
    process.exit(-1);
  }
  
  if (options.cache) {
    if (options.verbose) {
      console.error('Cache updated');
    }
    writeCache(filename, code);
  }
  
  return code;
};

var execute = function (module, filename) {
  global.currentFilename = filename;
  var code = compile(filename);
  module._compile(code, filename);
};

var calculatePaths = function (filename) {
  var paths = [];
  var pathSec = path.dirname(filename).split(path.sep);
  while (pathSec.length > 0) {
    var modulePath = pathSec.join(path.sep);
    modulePath += path.sep + 'node_modules';
    paths.push(modulePath);
    pathSec.pop();
  }
  return paths;
};

var getCachedFilePath = function (filename) {
  return path.join(options.cache, filename + '_c.js');
};

var readCache = function (filename) {
  var cachedFilePath = getCachedFilePath(filename);
  var exists = fs.existsSync(cachedFilePath);
  if (!exists) {
    return null;
  }
  
  var stat = fs.lstatSync(cachedFilePath);
  var cacheMtime = stat.mtime;
  var stat = fs.lstatSync(filename);
  var sourceMtime = stat.mtime;
  
  if (sourceMtime > cacheMtime) {
    return null;
  }
  
  return fs.readFileSync(cachedFilePath, 'utf-8');
};

var writeCache = function (filename, code) {
  var cachedFilePath = getCachedFilePath(filename);
  mkdirp.sync(path.dirname(cachedFilePath), 0777);
  fs.writeFileSync(cachedFilePath, code);
};