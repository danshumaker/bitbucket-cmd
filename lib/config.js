/*global path*/
define([
  'path'
], function (path) {

  return {
    cfgPath: path.basename(getCfgFile()),
    cfgFilePath: getCfgFile(),
    auth: {},
    options: {}
  };

  function getCfgFile() {
    return process.env['BITBUCKET_CONFIG'];
  }
});
