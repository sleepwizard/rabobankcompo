#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var util 	= require('util');
var twitter = require('twitter');
var cronjob = require('cron').CronJob;
var mysql	= require('mysql');

/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;
	//var mysqlCon;
	
    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
	
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;
		
        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
			res.send("<b>Barth steeg DEVVVVVVV</b>");
			
			
			var query = "SELECT * FROM tweets;";
				self.mysqlCon.query(query, function(err, rows, fields) { 
					for(record in rows) {
						res.send('<div class="tweet">');
							res.send(record['data']);
						res.send('</div>');
					}
				});
			
            res.send(self.cache_get('index.html') );
        };
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express.createServer();
		
        //  Add handlers for the app (from the routes).
		for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
		
		//start twitter
		self.twit = new twitter({
			consumer_key: 'rmNjzqzsHdmo2Lb2MRFQhRQlQ',
			consumer_secret: '8W92lkt26PZ2PDconLiDFrgIzlis9GJhCWZrAH3XcjBrTH6Yr1',
			access_token_key: '76448207-tjaql4KtbIb6p5vjRFI5N7mmKW66RXtHTTGfegEL3',
			access_token_secret: 'bfWbwQ9XLs3tEOWUQ7hZxR6Mm1eAddyyjlfib5UTXfZTw'
		});
		
		//start connection mysql
		self.mysqlCon = new mysql.createConnection({
				host     : '127.9.216.2',
				user     : 'adminw6g3t37',
				password : 'zk1v5EZ5YFMr',
				database : 'nodejs',
			}
		);
		
		self.mysqlCon.connect(function(err) {
			console.log(err);
		});
    };
	
	/** 
	 ** Re-index all the tweets in the background
	*/
	self.reindextweets = function(filter) {
		console.log('Start re-index all the tweets containing hashtag #' + filter);
		
		self.twit.verifyCredentials(function (verifyerr, verifydata) {
			if(verifydata) {
				console.log('API-ERROR VERIFY OAUTH ---------->>>>>>>> ');
				console.log(verifydata);
			} else {
				self.twit.get('https://api.twitter.com/1.1/search/tweets.json',  {q:filter} , function(json) {
				//self.twit.search(filter + ' OR #' + filter, function(err, { count: 14 }, data) {
					console.log('Search results:');
					console.log(json);
					//console.log(err);
					
					/*
					try {
						var objJson = JSON.parse(err);
					} catch (e) {
						console.log('ERROR PARSING JSON');
						console.log('ERROR :' + e);
						console.log('B--------------------------------------------------------------------------');
						console.log(err);
						console.log('E--------------------------------------------------------------------------');
						return;
					}*/
					
					//var objJson = err;
					//objJson = objJson["statuses"];
					//json.statuses.foreach(function (entry) {
					
					
					console.log('number of elements: ' + json.lenght);
					console.log('entering loop');
					for(var i=0; i<14; i++) {
					//for(record in json.statuses) {
						console.log('debug...... : ' + json.statuses[i]);
						//console.log('now in loop for: ' + i);
						
						var query = "SELECT * FROM tweets WHERE id = " + json.statuses[i].id;
						var inDB = false;
						
						//get if existing
						self.mysqlCon.query(query, function(err, rows, fields) { 
							for (var i in rows) {
								inDB = true;
							}
						});
						
						//Add record.
						if(inDB == false) {
							query = "INSERT INTO tweets (id, data) VALUES("+ json.statuses[i].id + ", '"+JSON.stringify(json.statuses[i])+"' );";
							console.log('Going to execute following query: ' + query);
							self.mysqlCon.query(query, function(err, rows, fields) { 
								console.log('inserted into database');
							});
						}
						/*
						console.log(entry);	
						
						$data[] = array(
							"id" => $status["id"],
							"data" => JSON.stringify($status)
						);*/
					}
					
					//parse json
					//var arrResult = JSON.parse(err);
					
					//dump result
					/*
					arrResult.forEach(function(entry) {
						var query = "SELECT * FROM tweets WHERE id = " + entry.id;
						var inDB = false;
						
						//get if existing
						self.mysqlCon.query(query, function(err, rows, fields) { 
							for (var i in rows) {
								inDB = true;
							}
						});
						
						//Add record.
						if(inDB == false) {
							query = "INSERT INTO tweets (id, data) VALUES("+ entry.id + ",'"+entry+"');";
							self.mysqlCon.query(query, function(err, rows, fields) { 
								console.log('inserted into database');
							});
						}
						
						console.log(entry);	
					});*/
				});
			}
		});
	};


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

new cronjob('00 */1 * * * *', function(){
	//start now!
    zapp.reindextweets('campzone');
}, null, true, null);