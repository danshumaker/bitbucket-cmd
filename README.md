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
    -M, --message <pr_num>           Message for merge/creating PR
    -c, --create <title>             Create Pull Request
    -s, --source <branch name>       Source Branch
    -t, --to <branch name>           Destination Branch
    -d, --diff <pr_num>              Diff Pull Request
    -p, --patch <pr_num>             Patch Pull Request
    -a, --activity <pr_num>          Activity on Pull Request
    -A, --approve <pr_num>           Approve the  Pull Request
    -D, --decline <pr_num>           Decline Pull Request

```
Usage:

bitbucket pr -l

The above command will output something like this:
```
 ID  Author              Source                   Destination  Title                                              State  Reviewers                           Url                                                               

 8   palash-paytm        test_branch              master       MC trimming before checking for approval           OPEN                                       https://bitbucket.org/teamname/repo-name/pull-requests/8 
               
```

Usage:

To create a pull request you could do it like this:

* it will create a push the current branch to origin and create a pull request with current branch as source and master as destination branch  
```
	bitbucket pr -c "test pr" 
```

* to create pull request from source [feature/MTIE-503-Package-Content] and destination brach [master]. run the command
```
bitbucket pr -c "test pr" -s feature/MTIE-503-Package-Content -t master
```

  It will create a pull request and output something like given below. you can click the url to open the pull request in browser.
```
	Created PR @ https://bitbucket.org/teamname/repo-name/pull-requests/8
```

* to approve a pull request with pull request id 8
```
bitbucket pr -A 8
```

* to decline a pull request with pull request id 8
```
bitbucket pr -D 8
```

* to view the diff present in the pull request, all you have to do is given below. And it will print the diff on the screen.
```
bitbucket pr -d 8
```

* to view the comment activity done on the pull request. 
```
bitbucket pr -a 8
	* and it will show the comments made by the users
```

##### Advanced options
Checkout ```~/.bitbucketconfigrc``` for more options.

### TODO
	* showing diff more gracefully
	* allowing to patch the
