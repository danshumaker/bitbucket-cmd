/*global path*/
define([
  'path',
  'fs'
], function (path,fs) {

  cfile = getCfgFile();

  if (fs.existsSync(cfile)) {
    return {
      cfgPath: path.basename(cfile),
      cfgFilePath: cfile,
      auth: {},
      options: {}
    };
  }
  return createCfgFile();

  function createCfgFile() {
    currentwd = process.cwd();
    console.log("\n\nDid not find config file from BITBUCKET_CONFIG environment variable or " + currentwd + "/.bitbucket-cmd/config.json.\nSetting one up in "+  currentwd + "/.bitbucket-cmd/config.json\n");
    cfile = currentwd + '/.bitbucket-cmd/config.json';
    if (! fs.existsSync(currentwd + '/.bitbucket-cmd')) {
      fs.mkdir(currentwd + '/.bitbucket-cmd', function(e) { console.log(e)} );
    }
    return {
      cfgPath: path.basename(cfile),
      cfgFilePath: cfile,
      auth: {},
      options: {}
    };
  }

  function getCfgFile() {
    cfile = process.env['BITBUCKET_CONFIG'];

    if (fs.existsSync(cfile)) {
      return cfile;
    } else {
      cwd_config = process.cwd() + '/.bitbucket-cmd/config.json';
      if (fs.existsSync(cwd_config)) {
        return cwd_config;
      } else {
        return false;
      }
    }
  }

});
