bitbucket-cmd
========

  Dan Shumaker @ Phase2 Technology
  2016-11-18
  
  Bitbucket command line interface  based on https://github.com/germanrcuriel/jira-cmd

  Currently it is able to do these things from the command line: 
  * Store your encrypted bitbucket credentials
  * List pull requests
  * Create pull requets

## Motivation

  As a command line junky, I wanted to be able to create pull requests quickly without having to use bitbucket's browser interface.  I also wanted to be able to list out all pull requests so I could be a more expedient merge master.

## Installation

Install [node.js](http://nodejs.org/).

Then, in your shell type:

    $ npm install -g bitbucket-cmd

## Usage

##### First use

    $ bitbucket
    bitbucket URL: https://bitbucket.org/
    Username: xxxxxx
    Password: xxxxxx
    Information stored!

This saves your credentials (base64 encoded) in your `$HOME/.bitbucket` folder.

##### Help

Usage: bitbucket [options] [command]

  Commands:

    pr 

  Options:

    -h, --help     output usage information
    -V, --version  output the version number

Each command have individual usage help (using --help or -h)

For example the pr command has these options

    -l, --list                  List Open Pull Requests
    -m, --merge <pr_num>        Merge Pull Request
    -c, --create <title>        Create Pull Request
    -s, --source <branch name>  Source Branch
    -t, --to <branch name>      Destination Branch
    -f, --diff <pr_num>         Diff Pull Request
    -d, --decline <pr_num>      Decline Pull Request

Usage:

bitbucket pr -l

The above command will output something like this:
```

 ID    Author        Source                             Destination     Title                                               State  Reviewers    

 3126  wdranvaud     MTIC-1038-map-alpha-sort           release/1.6.16  MTIC-1038 views exposed filter alphabetical sor...  OPEN                
 3125  wdranvaud     MTIC-1038-map-alpha-sort           develop         MTIC-1038 views exposed filter alphabetical sor...  OPEN   ezeedub      
 3120  wdranvaud     MTIC-925-flag-button-fix           release/1.6.16  MTIC-925 fix CSS on marketplace flag as inappro...  OPEN                
 3114  wdranvaud     MTIC-1044-audition-center-sidebar  release/1.6.16  MTIC-1044 display Audition Central on sidebar       OPEN                
 3107  wdranvaud     MTIC-894-question-title-reversed   release/1.6.16  MTIC-894 place title above body of question         OPEN                
 3082  wdranvaud     MTIC-1067-default-publish-locale   release/1.6.16  MTIC-1067 display translated content by default...  OPEN                
 2968  ryan_smylski  feature/MTIE-471--echeck           release/2.0.0   [MTIE-471] - Rounded out xpresspay for e-check ...  OPEN   dan_shumaker 
 3066  ezeedub       feature/MTIE-471--echeck           ecommdevelop    [MTIE-471]  Rounded out xpresspay for e-check p...  OPEN                
```

Usage:

To create a pull request you could do it like this:

```
bitbucket pr -c "test pr" -s feature/MTIE-503-Package-Content -t master
```

It will create a pull request and output something like this:
```
Create Pull Request
Created PR @ https://api.bitbucket.org/2.0/repositories/phase2tech/mti_cms/pullrequests/3127
```


##### Advanced options
Checkout ```~/.bitbucket/config.json``` for more options.

### TODO
  * --diff and --decline are not working properly.
