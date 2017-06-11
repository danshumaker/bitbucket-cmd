[bitbucket-cmd](https://www.npmjs.com/package/bitbucket-cmd)
========

  Bitbucket command line interface  based on https://github.com/germanrcuriel/jira-cmd

  Currently it is able to do these things from the command line: 
  * Store your encrypted bitbucket credentials
  * pull requests
	* Create pull requets
	* List all pull requests
	* Approve pull request
	* Merge pull request
	* Decline pull request
	* Show all activity in a pull request	

## Motivation

  As a command line junky, I wanted to be able to create pull requests quickly without having to use bitbucket's browser interface.  I also wanted to be able to list out all pull requests so I could be a more expedient merge master.

## Installation

Install [node.js](http://nodejs.org/).

Then, in your shell type:

	$ npm install -g bitbucket-cmd

## Usage

##### First use

    $ bitbucket
 
It will prompte you for the repositories subdirectory url.  It auto-supplies the proper bitbucket api URL prefix

    Team subdir URL: https://api.bitbucket.org/2.0/repositories/+
  * now enter the teamname for Eg. phase2tech
  * repo name is automatically picked from current working directory

Type in your repo name here (for example `phase2tech/bla_dev_vm`) and then hit return a couple times for the username prompt

    Username: xxxxxx
    Password: xxxxxx

Once you hit enter after the password then you should get this message:

    Information stored!

This saves your credentials in the [home directory](https://github.com/danshumaker/bitbucket-cmd/pull/2) in a config rc `~/.bitbucketconfigrc` file.

#### Reviewers

Please note that the "reviewers" section is added to the config file.  I've added check to see if this section is empty and just submit PR's without reviewers if necessary.  However it is sensitive.  Valid default reviewer syntax is as follows:

```
{
"default": {
    "auth": {
      "url": "https://api.bitbucket.org/2.0/repositories/",
      "user": "palash-paytm",
      "token": "palash-paytm:CLIENT_SECRET_KEY_YOU_ENTERED",
      "team": "paytmteam",
      "repo_name": "repo-name"
    },
    "reviewers": [
      		   {
		    "username": "rohit-prajapati-paytm"
		   }
      ]
  },
  "repo_level": {
    "/home/palashkulshreshtha/Documents/programs/mygit/repo-name": {
      "reviewers": [
      		   {
		    "username": "rohit-prajapati-paytm"
		   }
      ],
      "auth": {
        "url": "https://api.bitbucket.org/2.0/repositories/",
        "user": "palash-paytm",
        "token": "palash-paytm:CLIENT_SECRET_KEY_YOU_ENTERED",
        "team": "paytmteam",
        "repo_name": "merchant-payout"
      }
    }
  }
}
```

or an empty options section like this:
```
{
"default": {
    "auth": {
      "url": "https://api.bitbucket.org/2.0/repositories/",
      "user": "palash-paytm",
      "token": "palash-paytm:CLIENT_SECRET_KEY_YOU_ENTERED",
      "team": "paytmteam",
      "repo_name": "repo-name"
    },
    "reviewers": []
  },
  "repo_level": {
    "/home/palashkulshreshtha/Documents/programs/mygit/repo-name": {
      "reviewers": [],
      "auth": {
        "url": "https://api.bitbucket.org/2.0/repositories/",
        "user": "palash-paytm",
        "token": "palash-paytm:CLIENT_SECRET_KEY_YOU_ENTERED",
        "team": "paytmteam",
        "repo_name": "merchant-payout"
      }
    }
  }
}

```
or a list of reviewers like this:
```
{
"default": {
    "auth": {
      "url": "https://api.bitbucket.org/2.0/repositories/",
      "user": "palash-paytm",
      "token": "palash-paytm:CLIENT_SECRET_KEY_YOU_ENTERED",
      "team": "paytmteam",
      "repo_name": "repo-name"
    },
    "reviewers": [
      		   {
		    "username": "rohit-prajapati-paytm"
		   },
		   {
		    "username": "dheerajbatra-paytm"
		   }
      ]
  },
  "repo_level": {
    "/home/palashkulshreshtha/Documents/programs/mygit/repo-name": {
      "reviewers": [
      		   {
		    "username": "rohit-prajapati-paytm"
		   },{
		    "username": "dheerajbatra-paytm"
		   }
      ],
      "auth": {
        "url": "https://api.bitbucket.org/2.0/repositories/",
        "user": "palash-paytm",
        "token": "palash-paytm:CLIENT_SECRET_KEY_YOU_ENTERED",
        "team": "paytmteam",
        "repo_name": "merchant-payout"
      }
    }
  }
}

```

Beware-of-the-json-death-by-brackets-syntax: Nested objects are a bitch - not much I can do about that. 

##### Help

Usage: bitbucket [options] [command]

  Commands:

    pr 

  Options:

    -h, --help     output usage information
    -V, --version  output the version number

Each command have individual usage help (using --help or -h), so `bitbucket pr -h` will give pr specific help. 

For example the pr command has these options

```
  Usage: pr [options]

  Options:

    -h, --help                       output usage information
    -l, --list                       List Open Pull Requests
    -r, --merged                     List Merged Pull Requests
    -m, --merge <pr_num>             Merge Pull Request
    -S, --merge_strategy <Strategy>  Merging Strategy for Pull Requests (merge_commit/squash)
    -M, --message <pr_num>           Message for merge/something else
    -c, --create <title>             Create Pull Request
    -d, --description <description>  Description of PR to create
    -s, --source <branch name>       Source Branch
    -t, --to <branch name>           Destination Branch
    -f, --diff <pr_num>              Diff Pull Request
    -p, --patch <pr_num>             Patch Pull Request
    -a, --activity <pr_num>          Activity on Pull Request
    -A, --approve <pr_num>           Approve the  Pull Request
    -d, --decline <pr_num>           Decline Pull Request

```
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
bitbucket pr -c "test pr" 
  * it will create a push the current branch to origin and create a pull request with current branch as source and master as destination branch
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
  * Allow config to handle multiple repos - currently this is done by creating a subdirectory in the current directory but ideally I'd like to have
	* a -cf cli option for the location of the config.json file.
