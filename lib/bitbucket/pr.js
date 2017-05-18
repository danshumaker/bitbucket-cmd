/*global requirejs,console,define,fs*/
// Dan Shumaker
// Documentation: https://developer.atlassian.com/bitbucket/api/2/reference/
define([
	'superagent',
	'cli-table',
	'moment',
	'../../lib/config'
], function (request, Table, moment, config) {

	var pullrequest = {
		query: null,
		table: null,

		list: function (options) {
			this.query = 'pullrequests?fields=%2Bvalues.reviewers.username,values.id,values.title,values.state,values.destination.branch.name,values.source.branch.name,values.author.username';
			if (options.merged) {
				this.query = 'pullrequests?q=state+%3D+%22MERGED%22&fields=%2Bvalues.reviewers.username,values.id,values.title,values.state,values.destination.branch.name,values.source.branch.name,values.author.username&pagelen=50';
			}
			var that = this, i = 0;
			request
				.get(config.auth.url + this.query)
				.set('Content-Type', 'application/json')
				.set('Authorization', 'Basic ' + config.auth.token)
				.end(function (res) {
					if (!res.ok) {
						return console.log((res.body.errorMessages || [res.error]).join('\n'));
					}

					that.pull_requests = res.body.values;
					that.table = new Table({
						head: ['ID', 'Author', 'Source', 'Destination', 'Title','State', 'Reviewers']
						, chars: {
							'top': ''
							, 'top-mid': ''
							, 'top-left': ''
							, 'top-right': ''
							, 'bottom': ''
							, 'bottom-mid': ''
							, 'bottom-left': '' 
							, 'bottom-right': ''
							, 'left': ''
							, 'left-mid': ''
							, 'mid': ''
							, 'mid-mid': ''
							, 'right': ''
							, 'right-mid': ''
						}
						, style: {
							'padding-left': 1
							, 'padding-right': 1
							, head: ['cyan']
							, compact : true
						}
					});

					for (i = 0; i < that.pull_requests.length; i += 1) {
						title = that.pull_requests[i].title;
						//console.log(that.pull_requests[i]);
						reviewers = that.pull_requests[i].reviewers.map(function(elem){ return elem.username; }).join(",");
						//reviewers = that.pull_requests[i];
						//reviewers = "N/A";

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
			console.log("merge");
		},

		create: function (options) {
			this.query = 'pullrequests';
			var that = this;
			console.log("Create Pull Request");
			if (config.options.default_reviewers) {
				json_package = {
					"destination": { "branch": { "name": options.to } } , 
					"source": { "branch": { "name" : options.source }}, 
					"title": options.create,
					"description": options.description,
					"reviewers": config.options.default_reviewers } ;
			} else {
				json_package = {
					"destination": { "branch": { "name": options.to } } , 
					"source": { "branch": { "name" : options.source }}, 
					"title": options.create,
					"description": options.description,
				}
			}
			//console.log(json_package);
			request
				.post(config.auth.url + this.query)
				.send( json_package )
				.set('Content-Type', 'application/json')
				.set('Authorization', 'Basic ' + config.auth.token)
				.end(function (res) {
					if (!res.ok) {
						return console.log((res.body.errorMessages || [res.error]).join('\n'));
					}
					console.log("Created PR @ " + res.body.links.self.href);
				});
		},
		decline: function (options) {
			this.query = 'pullrequests/' + options.decline + '/decline' ;
			console.log(this.query);
			console.log("Declining PR " + options.decline);
			request
				.post(config.auth.url + this.query)
				.set('Authorization', 'Basic ' + config.auth.token)
				.end(function (res) {
					if (!res.ok) {
						return console.log((res.body.errorMessages || [res.error]).join('\n'));
					}
					console.log("Declined PR " + options.decline);
				});
		},

	};
	return pullrequest;

});

