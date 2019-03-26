/*global requirejs,define,fs*/
define([
  'commander',
  'fs',
  './config'
], function (program, fs, config) {

  var Auth = {
    cfgPath: config.cfgPath || null,
    fullPath: config.cfgFilePath || null,
    answers: {},

    checkConfig: function () {
      if (fs.existsSync(this.fullPath)) {
        configObject = JSON.parse(fs.readFileSync(this.fullPath, 'utf-8'));

        config.auth = configObject.auth;
        config.reviewers = configObject.reviewers;

        if (!config.reviewers) {
          console.log('Ops! Seems like your ' + this.fullPath + ' is out of date. Please reset you configuration.');
          return false;
        } else {
          return true;
        }

      } else {
        return false;
      }
    },

    ask: function (question, callback, password) {
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
        this.ask('Type the repository subdirectory that comes after this URL: https://api.bitbucket.org/2.0/repositories/\n\nTypical form is username/repo_name or orgname/reponame\nYOU WILL NEED TO HIT ENTER TWICE', function (answer) {
          that.answers.url = 'https://api.bitbucket.org/2.0/repositories/' + answer;

          that.ask('Username: ', function (answer) {
            that.answers.user = answer;

            that.ask('Password: ', function (answer) {
              that.answers.pass = answer;

              that.ask('Reviewers comma separated list (do not include yourself) sample string: ezeedub,dan_shumaker,scodx,bonfil1',  function (answer) {
                that.answers.reviewers = [];
                answer.split(',').forEach( user => that.answers.reviewers.push({ "username": user }));
                process.stdin.destroy();
                that.saveConfig();
                if (callback) {
                  return callback(true);
                }
              });
            }, true);
          });
        });
      }
    },

    clearConfig: function () {
      var that = this;

      if (!fs.existsSync(this.fullPath)) {
        console.log('There is no stored data. Skipping.');
      } else {
        program.confirm('Are you sure? ', function (answer) {
          if (answer) {
            fs.unlinkSync(that.fullPath);
            console.log('Configuration deleted successfully!');
          }
          process.stdin.destroy();
        });
      }
    },

    saveConfig: function () {
      var configFile = {}, auth;

      if (this.answers.url) {
        if (!/\/$/.test(this.answers.url)) {
          this.answers.url += '/';
        }
      }

      if (this.answers.user && this.answers.pass) {
        this.answers.password = this.answers.user + ':' + this.answers.pass;

        auth = {
          url: this.answers.url,
          user: this.answers.user,
          password: Buffer.from(this.answers.password).toString('base64')
        };

        delete this.answers.pass;
      }

      configFile = {
        auth: auth,
        reviewers: this.answers.reviewers
      };

      fs.writeFileSync(this.fullPath, JSON.stringify(configFile, null, 2));
      console.log('Information stored!');
    }
  };

  return Auth;

});
