#!/usr/bin/env node

// Dan Shumaker @ Phase2Technology
// 11-18-2016
// Documentation: https://developer.atlassian.com/bitbucket/api/2/reference/
// https://developer.atlassian.com/bitbucket/api/2/reference/resource/
//  https://api.bitbucket.org/2.0/repositories/i4cdev/voyce-member-site/pullrequests/2283?fields=-links,destination.branch.name

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
        .version('v0.4.0');

    program
        .command('pr')
        .description('Operate on Pull Requests')
        .option('-l, --list', 'List Open Pull Requests')
        .option('-r, --merged', 'List Merged Pull Requests')
        .option('-m, --merge <pr_num>', 'Merge Pull Request', String)
        .option('-c, --create <title>', 'Create Pull Request', String)
        .option('-d, --destination <title>', 'Destination branch', String)
        .option('-d, --description <description>', 'Description of PR to create', String)
        .option('-s, --source <branch name>', 'Source Branch', String)
        .option('-t, --to <branch name>', 'Destination Branch', String)
        .option('-f, --diff <pr_num>', 'Diff Pull Request', String)
        .option('-d, --decline <pr_num>', 'Decline Pull Request', String)
        .option('-v, --verbose', 'Debugging output')
        .action(function (options) {
            auth.setConfig(function (auth) {
                if (auth) {
                    if (options.list) {
                        pr.list(options);
                    }
                    if (options.create) {
                        pr.create(options);
                    }
                    if (options.decline) {
                        pr.decline(options);
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
            console.log('    Bitbucket URL: https://api.bitbucket.org/2.0/repositories/YOURUSER/YOURREPONAME');
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
