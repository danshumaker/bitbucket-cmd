/*global path*/
define([
  'path'
], function (path) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
  return {
    getHomePath: getHomePath
  };
  function getHomePath () {
    var systemHomePath = process.env[(process.platform == 'win32') ? 'HOMEPATH' : 'HOME'];
    return systemHomePath;
  }
});
