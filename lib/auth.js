/*global requirejs,define,fs*/
/**
 * support for filling default auth data while prompting for new repo
 * */
define([
  'commander',
  'fs',
  'rc',
  'path',
  './config'
], function (program, fs, rc, path, config) {

  var Auth = {
    answers: {},

    checkConfig: function () {
      var rcConfig = rc('bitbucketconfig');
      if(!rcConfig.repo_level ){
        console.log('Ops! Seems like your ' + this.fullPath + ' is out of date. Please reset you configuration.');
        return false;
      } else if (!rcConfig.repo_level[process.cwd()]) {
        console.log('Seems like your ' + process.cwd() + ' is not yet configured. Please set your configuration.');
        return false;
      }else{
        Object.keys(rcConfig).forEach(function(eachKey){
          config[eachKey] = rcConfig[eachKey];
        });
        return true;
      }
    },

    ask: function (question, callback, password, nonMandatory) {
      var that = this;
      if (password) {
        program.password(question, function (answer) {
          if (answer.length > 0) {
            callback(answer);
          } else {
            that.ask(question, callback, true);
          }
        });
      } else {
        program.prompt(question, function (answer) {
          if (answer.length > 0) {
            callback(answer);
          } else if(nonMandatory) {
            return callback();
          } else {
            that.ask(question, callback);
          }
        });
      }
    },

    setConfig: function (callback) {
      var that = this;
      if (this.checkConfig()) {
        return callback(true);
      } else {
        this.ask('Team subdir URL: https://api.bitbucket.org/2.0/repositories/+',  function (answer) {
          that.answers.team = answer;
          that.answers.url = 'https://api.bitbucket.org/2.0/repositories/';
          that.ask('Username: ', function (answer) {
            that.answers.user = answer;
            that.ask('Password: ', function (answer) {
              that.answers.pass = answer;
              process.stdin.destroy();
              that.saveConfig();
              if (callback) {
                return callback(true);
              }
            }, true);
          });
        });
      }
    },

    clearConfig: function () {
      var that = this;
      var rcConfig = rc('bitbucketconfig');
      if (!fs.existsSync(rcConfig.config)) {
        console.log('There is no stored data. Skipping.');
      } else {
        program.confirm('Are you sure you want to delete config at location '+rcConfig.config+'? ', function (answer) {
          if (answer) {
            fs.unlinkSync(rcConfig.config);
            console.log('Configuration deleted successfully!');
          }
          process.stdin.destroy();
        });
      }
    },

    saveConfig: function () {
      var configFile = rc('bitbucketconfig');
      var auth;
      if (this.answers.url) {
        if (!/\/$/.test(this.answers.url)) {
          this.answers.url += '/';
        }
      }
      if (this.answers.user && this.answers.pass) {
        this.answers.token = this.answers.user + ':' + this.answers.pass;
        auth = {
          url: this.answers.url,
          user: this.answers.user,
          token: this.answers.token,
          team: this.answers.team,
          repo_name: path.basename(process.cwd())
        };
        delete this.answers.pass;
      }
      configFile.default = configFile.default || {};
      configFile.default.auth = configFile.default.auth || auth;
      configFile.default.reviewers = configFile.default.reviewers || [{username:"danielnv18"},{ username:"jmsv23"}];
      configFile.repo_level = configFile.repo_level || {};
      var configPath = path.join(config.getHomePath(),'.'+'bitbucketconfig'+'rc');
      configFile.repo_level[process.cwd()] = {
        reviewers: [{username:"danielnv18"},{ username:"jmsv23"}],
        auth: auth
      };
      fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2));
      console.log('Information stored!');
      this.checkConfig();
    }
  };
  return Auth;

});
