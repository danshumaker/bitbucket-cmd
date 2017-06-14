/*global requirejs,console,define,fs*/
// Dan Shumaker
// Documentation: https://developer.atlassian.com/bitbucket/api/2/reference/

var BASE_URL = 'https://bitbucket.org/';
define([
    'superagent',
    'cli-table',
    'moment',
    'path',
    '../../lib/config',
    'simple-git',
     'colors',
     'openurl'
], function (request, Table, moment, path, config, git, colors, openurl) {
     
     function getConfig(type,prId){
       var currentPath = process.cwd();
       var currentConfig = config.repo_level[currentPath] || config.default;
       var endPoint = [currentConfig.auth.team, currentConfig.auth.repo_name].join('/');
       var finalUrl = currentConfig.auth.url + endPoint;
       var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
       var viewUrl = BASE_URL + endPoint;
       var urlArr = [];
       if (prId){
         urlArr.push(prId);         
       }
       if (type){
         urlArr.push(type.toLowerCase());
       }
       viewUrl = [viewUrl, 'pull-requests', urlArr.join('/')].join('/');
       finalUrl = [finalUrl, 'pullrequests', urlArr.join('/')].join('/');
       return {
         username: currentConfig.auth.user,
         default: config.default,
         currentPath: currentPath,
         currentConfig: currentConfig,
         endPoint: endPoint,
         finalUrl: finalUrl,
         finalToken: finalToken,
         viewUrl: viewUrl
       };
     }

     function getPullRequests(options, callback){
       var conf = getConfig();
       var query = '?fields=%2Bvalues.reviewers.username,values.id,values.title,values.state,values.destination.branch.name,values.source.branch.name,values.author.username';
            if (options.merged) {
              query = '?q=state+%3D+%22MERGED%22&fields=%2Bvalues.reviewers.username,values.id,values.title,values.state,values.destination.branch.name,values.source.branch.name,values.author.username&pagelen=50';
            }
            var pullrequests, table;
            i = 0;
            console.log(conf.finalUrl+query)
            request
            .get(conf.finalUrl + query)
            .set('Content-Type', 'application/json')
            .set('Authorization', 'Basic ' + conf.finalToken)
            .end(function (res) {
              if (!res.ok) {
                return callback(res.body.errorMessages || [res.error].join('\n'));
              }
              var pull_requests = res.body.values;
              return callback(null, pull_requests);
            });
     }
     
    var pullrequest = {
      list: function (options) {
        var conf =  getConfig();
          git(conf.currentPath).status(function(err, statusRes){
            if(err){
              console.log('Can not get current working directory status');
              return ;
            }
            var currentBranch = statusRes.current;
            
            getPullRequests(options, function(err, pull_requests){
              if(err){
                return console.log(err);              
              }
              table = new Table({
                head: ['ID', 'Author', 'Source', 'Destination', 'Title', 'State', 'Reviewers', 'Url'],
                chars: {
                  'top': '═' ,
                  'top-mid': '╤' ,
                  'top-left': '╔' ,
                  'top-right': '╗',
                  'bottom': '═' ,
                  'bottom-mid': '╧' ,
                  'bottom-left': '╚' ,
                  'bottom-right': '╝',
                  'left': '║' ,
                  'left-mid': '╟' ,
                  'mid': '─' ,
                  'mid-mid': '┼',
                  'right': '║' ,
                  'right-mid': '╢' ,
                  'middle': '│'
                },
                style: {
                  'padding-left': 1,
                  'padding-right': 1,
                  head: ['cyan']
                }
              });

              for (i = 0; i < pull_requests.length; i += 1) {
                if(options.list && pull_requests[i].author.username !== conf.username){
                  continue;
                }
                title = pull_requests[i].title;
                reviewers = pull_requests[i].reviewers.map(function (elem) {
                              return elem.username;
                            }).join(",");

                if (title.length > 50) {
                  title = title.substr(0, 47) + '...';
                }
                var color = i % 2==0? 'blue': 'yellow';
                if(currentBranch === pull_requests[i].source.branch.name){
                  pull_requests[i].source.branch.name = '* '+pull_requests[i].source.branch.name.grey;
                }
                table.push([
                  pull_requests[i].id.toString()[color],
                  pull_requests[i].author.username[color],
                  pull_requests[i].source.branch.name[color],
                  pull_requests[i].destination.branch.name[color],
                  title[color],
                  pull_requests[i].state[color],
                  reviewers[color],
                  getConfig(null, pull_requests[i].id).viewUrl[color].underline.red
                ]);
              }
              if (pull_requests.length > 0) {
                console.log(table.toString());
              } else {
                console.log('No pull_requests');
              }
            });
          });
        },

        //MERGE POST https://api.bitbucket.org/2.0/repositories/dan_shumaker/backup_tar_test/pullrequests/3/merge
        merge: function (options) {
          var conf = getConfig('MERGE', options.merge);
          var remoteBranch = 'origin';
            console.log("merge");
            var json_package = {
                close_source_branch: true,
                message: options.message,
                //type: what should be here
                merge_strategy: options.merge_strategy || 'squash'
            }
            console.log(conf.finalUrl)
            request
                .post(conf.finalUrl)
                .send(json_package)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Merged PR @ " + res.body.links.self.href);
              //pulling destination branch after successful merge
              if(res.body && res.body.destination && res.body.destination.branch && res.body.destination.branch.name){
                var destBranch = res.body.destination.branch.name
                git(currentPath).pullFromTo(remoteBranch, destBranch, function(err, pull){
                  console.log('pulling '+remoteBranch+'/'+destBranch);
                  if(err){
                    console.log('error pulling '+remoteBranch+'/'+destBranch);
                    console.log(err);
                    return ;
                  }
                });
              }else{
                return;
              }
            });

        },

      create: function (options) {
        var conf = getConfig();                    
        git(conf.currentPath).status(function (err, info) {
          console.log('running git status for current branch');
          if (err) {
            return console.log('error gettting current branch');
          }
          var sourceBranch, destBranch, remoteBranch;
          sourceBranch = options.from || info.current;
          destBranch = options.to || 'master';
          remoteBranch = 'origin'
          var query;
          git(conf.currentPath).pull(remoteBranch, destBranch, function (err, masterPullRes){
            console.log(masterPullRes);
            console.log('pulling '+remoteBranch+'/'+destBranch);
            if(err){
              return console.log('error pulling '+remoteBranch+'/'+destBranch);
            }
            git(conf.currentPath).mergeFromTo(destBranch, sourceBranch, function (err, mergeRes){
              console.log('merging '+destBranch+' to '+sourceBranch);
              if(err){
                console.log('error merging '+destBranch+' to '+sourceBranch);
                console.log(err);
                return ;
              }
              git(conf.currentPath).push(remoteBranch, sourceBranch, function (err, pushRes) {                  
                console.log('pushing the branch to origin');
                if (err) {
                  return console.log('error pushing branch to origin');
                }
                query = 'pullrequests';
                console.log("Create Pull Request");
                var reviewers = conf.currentConfig.reviewers.length ? conf.currentConfig.reviewers : conf.default.reviewers;
                var json_package;
                json_package = {
                  "destination": {
                    "branch": {
                      "name": destBranch
                    }
                  },
                  "source": {
                    "branch": {
                        "name": sourceBranch
                    }
                  },
                  "title": options.create,
                  "description": options.message,
                  "reviewers": reviewers
                };
                console.log(conf.finalUrl, json_package)
                request
                .post(conf.finalUrl)
                .send(json_package)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                  if (!res.ok) {
                    console.log(res.text);
                    return console.log((res.body.errorMessages || [res.error]).join('\n'));
                  }
                  console.log("\n\nView PR @ " + getConfig(null, res.body.id).viewUrl);                      
                });
              });
            });
          });               
        });
      },

        decline: function (options) {
          var conf = getConfig('DECLINE', options.decline);
            console.log("Declining PR " + options.decline);
            request
                .post(conf.finalUrl)
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Declined PR " + options.decline);
                });
        },
                
        approve: function (options) {
          var conf = getConfig('APPROVE', options.approve);
            console.log("Approving PR " + options.approve);
            request
                .post(conf.finalUrl)
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Approved PR " + options.approve);
                });
        },
              
        diff: function (options) {
          var conf = getConfig('DIFF', options.diff);
            console.log(conf.finalUrl);
            console.log("Diffing PR " + options.diff);
            request
                .get(conf.finalUrl)
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Diff PR ", res.text);
                });
        },

      patch: function (options) {
        var conf = getConfig('PATCH', options.patch);
            console.log(conf.finalUrl);
            console.log("Patching PR " + options.patch);
            request
                .get(conf.finalUrl)
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Patch PR " + res.text);
                });
        },

        activity: function (options) {
          var conf = getConfig('ACTIVITY', options.activity);
          var table;
            console.log(conf.finalUrl);
            console.log("Activitying PR " + options.activity);
            request
                .get(conf.finalUrl)
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Activity PR " + options.activity);
              table = new Table({
                        head: ['Content', 'User'],
                        chars: {
                          'top': '═' ,
                          'top-mid': '╤' ,
                          'top-left': '╔' ,
                          'top-right': '╗',
                          'bottom': '═' ,
                          'bottom-mid': '╧' ,
                          'bottom-left': '╚' ,
                          'bottom-right': '╝',
                          'left': '║' ,
                          'left-mid': '╟' ,
                          'mid': '─' ,
                          'mid-mid': '┼',
                          'right': '║' ,
                          'right-mid': '╢' ,
                          'middle': '│'
                        },
                        style: {
                            'padding-left': 1,
                            'padding-right': 1,
                            head: ['cyan'],
                            compact: true
                        }
                    });
                    if (res && res.text) {
                        res.text = JSON.parse(res.text);
                        res.text.values.forEach(function (eachValue,index) {
                          var color = index % 2 ? 'yellow' : 'blue';
                            if (eachValue.comment && eachValue.comment.content && eachValue.comment.content.raw && eachValue.comment.user && eachValue.comment.user.username) {
                                table.push([eachValue.comment.content.raw[color], eachValue.comment.user.username[color]]);
                            }
                        });
                        console.log(table.toString());
                    }
                });
        },

      open: function (options) {
        var conf = getConfig(null, options.open);
        openurl.open(conf.viewUrl);
      }                              
    };
    return pullrequest;

});