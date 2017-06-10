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

var BASE_URL = 'https://bitbucket.org/';
define([
    'superagent',
    'cli-table',
    'moment',
    'path',
    '../../lib/config',
    'simple-git'
], function (request, Table, moment, path, config, git) {

    var pullrequest = {
        list: function (options) {
            var currentPath = process.cwd();
            var currentConfig = config.repo_level[currentPath] || config.default;
            var endPoint = [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
            var finalUrl = currentConfig.auth.url + endPoint;
            var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
            var viewUrl = BASE_URL + endPoint;
            var query = 'pullrequests?fields=%2Bvalues.reviewers.username,values.id,values.title,values.state,values.destination.branch.name,values.source.branch.name,values.author.username';
            if (options.merged) {
                this.query = 'pullrequests?q=state+%3D+%22MERGED%22&fields=%2Bvalues.reviewers.username,values.id,values.title,values.state,values.destination.branch.name,values.source.branch.name,values.author.username&pagelen=50';
            }
            var pullrequests, table;
            i = 0;
            request
                .get(finalUrl + query)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + finalToken)
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
                            viewUrl + 'pull-requests/' + pull_requests[i].id
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
            var currentPath = process.cwd();
            var currentConfig = config.repo_level[currentPath] || config.default;
            var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
            var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
            var query;
            query = 'pullrequests/' + options.merge + '/merge';
            console.log("merge");
            var json_package = {
                close_source_branch: true,
                message: options.message,
                //type: what should be here
                merge_strategy: options.merge_strategy || 'squash'
            }
            console.log(finalUrl + query)
            request
                .post(finalUrl + query)
                .send(json_package)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Merged PR @ " + res.body.links.self.href);
                });
        },

        create: function (options) {
            var currentPath = process.cwd();
            var currentConfig = config.repo_level[currentPath] || config.default;
            var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
            var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
            git(currentPath).status(function (err, info) {
                console.log('running git status for current branch');
                if (err) {
                    return console.log('error gettting current branch');
                }
                var sourceBranch, destBranch, remoteBranch;

                sourceBranch = options.from || info.current;
                destBranch = options.to || 'master';
                remoteBranch = 'origin'
                var query;
                git(currentPath).push(remoteBranch, sourceBranch, function (err, pushRes) {
                    console.log('pushing the branch to origin');
                    if (err) {
                        return console.log('error pushing branch to origin');
                    }
                    query = 'pullrequests';
                    console.log("Create Pull Request");
                    if (currentConfig.reviewers) {
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
                            "reviewers": currentConfig.reviewers
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
                            "reviewers": currentConfig.reviewers
                        }
                    }
                    console.log(finalUrl + query, json_package)
                    request
                        .post(finalUrl + query)
                        .send(json_package)
                        .set('Content-Type', 'application/json')
                        .set('Authorization', 'Basic ' + finalToken)
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
            var currentPath = process.cwd();
            var currentConfig = config.repo_level[currentPath] || config.default;
            var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
            var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
            var query;
            query = 'pullrequests/' + options.decline + '/decline';
            console.log(query);
            console.log("Declining PR " + options.decline);

            request
                .post(finalUrl + query)
                .set('Authorization', 'Basic ' + finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Declined PR " + options.decline);
                });
        },
        approve: function (options) {
            var currentPath = process.cwd();
            var currentConfig = config.repo_level[currentPath] || config.default;
            var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
            var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
            var query;
            query = 'pullrequests/' + options.approve + '/approve';
            console.log(query);
            console.log("Declining PR " + options.approve);

            request
                .post(finalUrl + query)
                .set('Authorization', 'Basic ' + finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Approved PR " + options.approve);
                });
        },
        diff: function (options) {
            var currentPath = process.cwd();
            var currentConfig = config.repo_level[currentPath] || config.default;
            var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
            var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
            var query = 'pullrequests/' + options.diff + '/diff';
            console.log(finalUrl + query);
            console.log("Diffing PR " + options.diff);

            request
                .get(finalUrl + query)
                .set('Authorization', 'Basic ' + finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Diff PR ", res.text);
                });
        },

        patch: function (options) {
            var currentPath = process.cwd();
            var currentConfig = config.repo_level[currentPath] || config.default;
            var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
            var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
            var query;
            this.query = 'pullrequests/' + options.patch + '/patch';
            console.log(finalUrl + this.query);
            console.log("Patching PR " + options.patch);

            request
                .get(finalUrl + this.query)
                .set('Authorization', 'Basic ' + finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Patch PR " + res.text);
                });
        },

        activity: function (options) {
            var currentPath = process.cwd();
            var currentConfig = config.repo_level[currentPath] || config.default;
            var finalUrl = currentConfig.auth.url + [currentConfig.auth.team, currentConfig.auth.repo_name, ''].join('/');
            var finalToken = new Buffer(currentConfig.auth.token).toString('base64');
            this.query = 'pullrequests/' + options.activity + '/activity';
            console.log(finalUrl + this.query);
            console.log("Activitying PR " + options.activity);
            request
                .get(finalUrl + this.query)
                .set('Authorization', 'Basic ' + finalToken)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    console.log("Activity PR " + options.activity);
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
                    if (res && res.text) {
                        res.text = JSON.parse(res.text);
                        res.text.values.forEach(function (eachValue) {
                            if (eachValue.comment && eachValue.comment.content && eachValue.comment.content.raw && eachValue.comment.user && eachValue.comment.user.username) {
                                that.table.push([eachValue.comment.content.raw, eachValue.comment.user.username]);
                            }
                        });
                        console.log(that.table.toString());
                    }
                });
        }
    };
    return pullrequest;

});