/*global requirejs,console,define,fs*/
// Dan Shumaker
// Documentation: https://developer.atlassian.com/bitbucket/api/2/reference/

/**
 * move starting repeating code of every function to common place
 * merge support
 * browse pull requests in browser option [directly open pull request in browser]
 * * by opening https://bitbucket.org/paytmteam/market-commission/pull-requests/8/
 * running git commands from bitbucket-cmd so as to have seemless experience
 * * push a new branch to origin and automatically raise the diff from that branch and master
 * * applying patch of a PR from master to new branch
 * * viewing the diff in meld or any other visual utility
 * raising PR with reviewers is failing currently
 * */
define([
    'superagent',
    'cli-table',
    'moment',
    'path',
    '../../lib/config'
], function (request, Table, moment, path, config) {
     
    var pullrequest = {
        query: null,
        table: null,
        list: function (options) {
          var currentPath = process.cwd();
          var currentConfig = config.repo_level[currentPath] || config.default;
          var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
          var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
          
            this.query = 'pullrequests?fields=%2Bvalues.reviewers.username,values.id,values.title,values.state,values.destination.branch.name,values.source.branch.name,values.author.username';
            if (options.merged) {
                this.query = 'pullrequests?q=state+%3D+%22MERGED%22&fields=%2Bvalues.reviewers.username,values.id,values.title,values.state,values.destination.branch.name,values.source.branch.name,values.author.username&pagelen=50';
            }
            var that = this,
                i = 0;
            request
                .get(finalUrl+this.query)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
              
                    that.pull_requests = res.body.values;
                    that.table = new Table({
                        head: ['ID', 'Author', 'Source', 'Destination', 'Title', 'State', 'Reviewers'],
                        chars: {
                            'top': '',
                            'top-mid': '',
                            'top-left': '',
                            'top-right': '',
                            'bottom': '',
                            'bottom-mid': '',
                            'bottom-left': '',
                            'bottom-right': '',
                            'left': '',
                            'left-mid': '',
                            'mid': '',
                            'mid-mid': '',
                            'right': '',
                            'right-mid': ''
                        },
                        style: {
                            'padding-left': 1,
                            'padding-right': 1,
                            head: ['cyan'],
                            compact: true
                        }
                    });

                    for (i = 0; i < that.pull_requests.length; i += 1) {
                        title = that.pull_requests[i].title;
                        reviewers = that.pull_requests[i].reviewers.map(function (elem) {
                            return elem.username;
                        }).join(",");

                        if (title.length > 50) {
                            title = title.substr(0, 47) + '...';
                        }
                        that.table.push([
                            that.pull_requests[i].id,
                            that.pull_requests[i].author.username,
                            that.pull_requests[i].source.branch.name,
                            that.pull_requests[i].destination.branch.name,
                            title,
                            that.pull_requests[i].state,
                            reviewers
                        ]);
                    }

                    if (that.pull_requests.length > 0) {
                        console.log(that.table.toString());
                    } else {
                        console.log('No pull_requests');
                    }
                });
        },

        //MERGE POST https://api.bitbucket.org/2.0/repositories/dan_shumaker/backup_tar_test/pullrequests/3/merge
        merge: function (options) {
          var currentPath = process.cwd();
          var currentConfig = config.repo_level[currentPath] || config.default;
          var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
          var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
          finalUrl += this.query;
          console.log("merge");
          var json_package = {
              close_source_branch: true,
              message: options.message,
              //type: what should be here
              merge_strategy: ['merge_commit', 'squash']
          }
            request
                .post(finalUrl+this.query)
                .send(json_package)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Created PR @ " + res.body.links.self.href);
                });

        },

        create: function (options) {
          var currentPath = process.cwd();
          var currentConfig = config.repo_level[currentPath] || config.default;
          var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
          var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
            this.query = 'pullrequests';
            var that = this;
            console.log("Create Pull Request");
            if (currentConfig.reviewers) {
                json_package = {
                    "destination": {
                        "branch": {
                            "name": options.to
                        }
                    },
                    "source": {
                        "branch": {
                            "name": options.source
                        }
                    },
                    "title": options.create,
                    "description": options.description
                    // "reviewers": currentConfig.reviewers
                };
            } else {
                json_package = {
                    "destination": {
                        "branch": {
                            "name": options.to
                        }
                    },
                    "source": {
                        "branch": {
                            "name": options.source
                        }
                    },
                    "title": options.create,
                    "description": options.description
                }
            }
          console.log(finalUrl+this.query,json_package)
            request
                .post(finalUrl+this.query)
                .send(json_package)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + finalToken)
                .end(function (res) {
              console.log(res)
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Created PR @ " + res.body.links.self.href);
                });
        },
        decline: function (options) {
          var currentPath = process.cwd();
          var currentConfig = config.repo_level[currentPath] || config.default;
          var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
          var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
            this.query = 'pullrequests/' + options.decline + '/decline';
            console.log(this.query);   
            console.log("Declining PR " + options.decline);

            request
                .post(finalUrl+this.query)
                .set('Authorization', 'Basic ' + finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Declined PR " + options.decline);
                });
        },
      diff: function (options){
          var currentPath = process.cwd();
          var currentConfig = config.repo_level[currentPath] || config.default;
          var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
          var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
            this.query = 'pullrequests/' + options.diff + '/diff';
            console.log(finalUrl+this.query);   
            console.log("Diffing PR " + options.diff);

            request
                .get(finalUrl+this.query)
                .set('Authorization', 'Basic ' + finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Diff PR " , res.text);
                });
        
      },

      patch: function (options){
        var currentPath = process.cwd();
        var currentConfig = config.repo_level[currentPath] || config.default;
        var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
        var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
        this.query = 'pullrequests/' + options.patch + '/patch';
        console.log(finalUrl+this.query);   
        console.log("Patching PR " + options.patch);

        request
        .get(finalUrl+this.query)
        .set('Authorization', 'Basic ' + finalToken)
        .end(function (res) {
          if (!res.ok) {
            return console.log((res.body.errorMessages || [res.error]).join('\n'));
          }
          console.log("Patch PR " + res.text);
        });        
      },

      activity: function (options){
        var that = this;
        var currentPath = process.cwd();
        var currentConfig = config.repo_level[currentPath] || config.default;
        var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
        var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
        this.query = 'pullrequests/' + options.activity + '/activity';
        console.log(finalUrl+this.query);   
        console.log("Activitying PR " + options.activity);
        request
        .get(finalUrl+this.query)
        .set('Authorization', 'Basic ' + finalToken)
        .end(function (res) {
          if (!res.ok) {
            return console.log((res.body.errorMessages || [res.error]).join('\n'));
          }
          console.log("Activity PR "+options.activity);
          that.table = new Table({
            head: ['Content', 'User'],
            chars: {
              'top': '',
              'top-mid': '',
              'top-left': '',
              'top-right': '',
              'bottom': '',
              'bottom-mid': '',
              'bottom-left': '',
              'bottom-right': '',
              'left': '',
              'left-mid': '',
              'mid': '',
              'mid-mid': '',
              'right': '',
              'right-mid': ''
            },
            style: {
              'padding-left': 1,
              'padding-right': 1,
              head: ['cyan'],
              compact: true
            }
          });
          if(res && res.text){
            res.text = JSON.parse(res.text);
            res.text.values.forEach(function(eachValue){
              if(eachValue.comment && eachValue.comment.content && eachValue.comment.content.raw && eachValue.comment.user && eachValue.comment.user.username){
                that.table.push([eachValue.comment.content.raw,eachValue.comment.user.username]);
              }
            });
            console.log(that.table.toString());
          }          
        });
      }


    };
    return pullrequest;

});