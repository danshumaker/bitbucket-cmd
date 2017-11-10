#!/usr/bin/env node

// Dan Shumaker @ Phase2Technology
// 11-18-2016
// Documentation: https://developer.atlassian.com/bitbucket/api/2/reference/
//  https://api.bitbucket.org/2.0/repositories/i4cdev/voyce-member-site/pullrequests/2283?fields=-links,destination.branch.name

/**
 * ping the reviewers whenever a diff request is created
 * */
var requirejs = require('requirejs');

requirejs.config({
    baseUrl: __dirname
});

requirejs([
    'commander',
    '../lib/config',
    '../lib/auth',
    '../lib/bitbucket/pr',
], function (program, config, auth, pr) {

    program
        .version('v0.3.0');

    program
        .command('pr')
        .description('Operate on Pull Requests')
        .option('-l, --list', 'List only my Open Pull Requests')
        .option('-L, --listall', 'List all Open Pull Requests')
        .option('-r, --merged', 'List Merged Pull Requests')
        .option('-m, --merge <pr_num>', 'Merge Pull Request', String)
        .option('-S, --merge_strategy <Strategy>', 'Merging Strategy for Pull Requests (merge_commit/squash)', String)
        .option('-M, --message <pr_num>', 'Message for merge/creating PR', String)
        .option('-c, --create <title>', 'Create Pull Request', String)
        .option('-s, --source <branch name>', 'Source Branch', String)
        .option('-t, --to <branch name>', 'Destination Branch', String)
        .option('-d, --diff <pr_num>', 'Diff Pull Request', String)
        .option('-p, --patch <pr_num>', 'Patch Pull Request', String)
        .option('-a, --activity <pr_num>', 'Activity on Pull Request', String)
        .option('-A, --approve <pr_num>', 'Approve the  Pull Request', String)
        .option('-D, --decline <pr_num>', 'Decline Pull Request', String)
        .option('-o, --open <pr_num>', 'Open Pull Request in browser', String)
        .action(function (options) {
            auth.setConfig(function (auth) {
                if (auth) {
                    if (options.list) {
                        pr.list(options);
                    }
                    if (options.listall) {
                        pr.list(options);
                    }
                    if (options.create) {
                        pr.create(options);
                    }
                    if (options.decline) {
                        pr.decline(options);
                    }
                    if (options.diff) {
                        pr.diff(options);
                    }
                    if (options.patch) {
                        pr.patch(options);
                    }
                    if (options.activity) {
                        pr.activity(options);
                    }
                    if (options.approve) {
                        pr.approve(options);
                    }
                    if (options.merge) {
                        pr.merge(options);
                    }
                    if (options.open) {
                        pr.open(options);
                    }
                }
            });
        });

    program
        .command('config')
        .description('Change configuration')
        .option('-c, --clear', 'Clear stored configuration')
        .option('-a, --auth', 'List auth settings')
        .option('-u, --url', 'List url')
        .action(function (options) {
            if (options.clear) {
                auth.clearConfig();
            } else {
                auth.setConfig(function (auth) {
                    if (auth) {
                        if (options.auth) {
                            console.log("url :" + config.auth.url);
                            console.log("user:" + config.auth.user);
                        }
                        if (options.url) {
                            console.log(config.auth.url);
                        }
                    } else {
                        auth.setConfig();
                    }
                });
            }
        }).on('--help', function () {
            console.log('  Config Help:');
            console.log();
            console.log('    Bitbucket URL: https://api.bitbucket.org/2.0/repositories/YOURTEAM/YOURREPONAME');
            console.log('    Username: user (for user@foo.bar)');
            console.log('    Password: Your password');
            console.log();
        });

    program.parse(process.argv);

    if (program.args.length === 0) {
        auth.setConfig(function (auth) {
            if (auth) {
                program.help();
            }
        });
    }

});