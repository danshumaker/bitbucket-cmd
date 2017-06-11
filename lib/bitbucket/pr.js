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
    'simple-git'
], function (request, Table, moment, path, config, git) {
     
     function getConfig(){
       var currentPath = process.cwd();
       var currentConfig = config.repo_level[currentPath] || config.default;
       var endPoint = [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
       var finalUrl = currentConfig.auth.url + endPoint;
       var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
       var viewUrl = BASE_URL + endPoint;
       return {
         currentPath: currentPath,
         currentConfig: currentConfig,
         endPoint: endPoint,
         finalUrl: finalUrl,
         finalToken: finalToken,
         viewUrl: viewUrl
       };
     }
    var pullrequest = {
        list: function (options) {
          var conf = getConfig();
            var query = 'pullrequests?fields=%2Bvalues.reviewers.username,values.id,values.title,values.state,values.destination.branch.name,values.source.branch.name,values.author.username';
            if (options.merged) {
              query = 'pullrequests?q=state+%3D+%22MERGED%22&fields=%2Bvalues.reviewers.username,values.id,values.title,values.state,values.destination.branch.name,values.source.branch.name,values.author.username&pagelen=50';
            }
            var pullrequests, table;
            i = 0;
            request
                .get(conf.finalUrl + query)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    var pull_requests = res.body.values;
                    table = new Table({
                        head: ['ID', 'Author', 'Source', 'Destination', 'Title', 'State', 'Reviewers', 'Url'],
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

                    for (i = 0; i < pull_requests.length; i += 1) {
                        title = pull_requests[i].title;
                        reviewers = pull_requests[i].reviewers.map(function (elem) {
                            return elem.username;
                        }).join(",");

                        if (title.length > 50) {
                            title = title.substr(0, 47) + '...';
                        }
                        table.push([
                            pull_requests[i].id,
                            pull_requests[i].author.username,
                            pull_requests[i].source.branch.name,
                            pull_requests[i].destination.branch.name,
                            title,
                            pull_requests[i].state,
                            reviewers,
                            conf.viewUrl + 'pull-requests/' + pull_requests[i].id
                        ]);
                    }

                    if (pull_requests.length > 0) {
                        console.log(table.toString());
                    } else {
                        console.log('No pull_requests');
                    }
                });
        },

        //MERGE POST https://api.bitbucket.org/2.0/repositories/dan_shumaker/backup_tar_test/pullrequests/3/merge
        merge: function (options) {
          var conf = getConfig();          
            var query;
            query = 'pullrequests/' + options.merge + '/merge';
            console.log("merge");
            var json_package = {
                close_source_branch: true,
                message: options.message,
                //type: what should be here
                merge_strategy: options.merge_strategy || 'squash'
            }
            console.log(conf.finalUrl + query)
            request
                .post(conf.finalUrl + query)
                .send(json_package)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Merged PR @ " + res.body.links.self.href);
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
                git(conf.currentPath).push(remoteBranch, sourceBranch, function (err, pushRes) {
                    console.log('pushing the branch to origin');
                    if (err) {
                        return console.log('error pushing branch to origin');
                    }
                    query = 'pullrequests';
                    console.log("Create Pull Request");
                  var json_package;
                    if (conf.currentConfig.reviewers) {
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
                            "description": options.description,
                            "reviewers": conf.currentConfig.reviewers
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
                            "description": options.description,
                            "reviewers": conf.currentConfig.reviewers
                        }
                    }
                    console.log(conf.finalUrl + query, json_package)
                    request
                        .post(conf.finalUrl + query)
                        .send(json_package)
                        .set('Content-Type', 'application/json')
                        .set('Authorization', 'Basic ' + conf.finalToken)
                        .end(function (res) {
                            if (!res.ok) {
                                return console.log((res.body.errorMessages || [res.error]).join('\n'));
                            }
                            console.log("Created PR @ " + res.body.links.self.href);
                        });
                });
            });
        },
        decline: function (options) {
          var conf = getConfig();
            var query;
            query = 'pullrequests/' + options.decline + '/decline';
            console.log(query);
            console.log("Declining PR " + options.decline);

            request
                .post(conf.finalUrl + query)
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Declined PR " + options.decline);
                });
        },
                
        approve: function (options) {
          var conf = getConfig();
            var query;
            query = 'pullrequests/' + options.approve + '/approve';
            console.log(query);
            console.log("Declining PR " + options.approve);
            request
                .post(conf.finalUrl + query)
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Approved PR " + options.approve);
                });
        },
        diff: function (options) {
          var conf = getConfig();
            var query = 'pullrequests/' + options.diff + '/diff';
            console.log(conf.finalUrl + query);
            console.log("Diffing PR " + options.diff);

            request
                .get(conf.finalUrl + query)
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Diff PR ", res.text);
                });
        },

      patch: function (options) {
        var conf = getConfig();
          var query;
        query = 'pullrequests/' + options.patch + '/patch';
            console.log(conf.finalUrl + query);
            console.log("Patching PR " + options.patch);

            request
                .get(conf.finalUrl + this.query)
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Patch PR " + res.text);
                });
        },

        activity: function (options) {
          var conf = getConfig();
          var query = 'pullrequests/' + options.activity + '/activity';
          var table;
            console.log(conf.finalUrl + query);
            console.log("Activitying PR " + options.activity);
            request
                .get(conf.finalUrl + query)
                .set('Authorization', 'Basic ' + conf.finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Activity PR " + options.activity);
              table = new Table({
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
                    if (res && res.text) {
                        res.text = JSON.parse(res.text);
                        res.text.values.forEach(function (eachValue) {
                            if (eachValue.comment && eachValue.comment.content && eachValue.comment.content.raw && eachValue.comment.user && eachValue.comment.user.username) {
                                table.push([eachValue.comment.content.raw, eachValue.comment.user.username]);
                            }
                        });
                        console.log(table.toString());
                    }
                });
        }
    };
    return pullrequest;

});