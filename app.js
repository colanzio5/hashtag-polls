const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const winston = require('winston')

var logger = new (winston.Logger)({
	transports: [
	  new (winston.transports.Console)({ json: false, timestamp: true }),
	  new winston.transports.File({ filename: __dirname + '/debug.log', json: false })
	],
	exceptionHandlers: [
	  new (winston.transports.Console)({ json: false, timestamp: true }),
	  new winston.transports.File({ filename: __dirname + '/exceptions.log', json: false })
	],
	exitOnError: false
  });

app.use(express.static(__dirname + '/client'));
app.use(bodyParser.json());

Campaign = require('./models/campaign');
Tweet = require('./models/tweet')

// Connect to Mongoose
mongoose.connect('mongodb://localhost/campaign-list');
var db = mongoose.connection;

/**
 * TWEET LIST API
 */
app.get('/api/tweets', (req, res) => {
	Tweet.getCampaignTweets((err, tweet) => {
		if (err)
			throw err;
		res.json(tweet);
	});
});

app.get('/api/tweets/:_id', (req, res) => {
	Tweet.getTweetByCampaignID(req.params._id, (err, tweet) => {
		if (err)
			throw err;
		res.json(tweet);
	});
});

app.post('/api/tweets', (req, res) => {
	var tweet = req.body;
	Tweet.addTweet(tweet, (err, tweet) => {
		if (err) {
			throw err;
		}
		res.json(tweet);
	});
});

app.delete('/api/tweets/:_id', (req, res) => {
	var id = req.params._id;
	Tweet.removeTweet(id, (err, tweet) => {
		if (err) {
			throw err;
		}
		res.json(tweet);
	});
});


/**
 * CAMPAIGN LIST API
 */
app.get('/api/campaigns', (req, res) => {
	Campaign.getCampaigns((err, campaigns) => {
		if (err)
			throw err;
		res.json(campaigns);
	});
});

app.get('/api/campaigns/:_id', (req, res) => {
	Campaign.getCampaignByID(req.params._id, (err, campaign) => {
		if (err)
			throw err;
		res.json(campaign);
	});
});

app.post('/api/campaigns', (req, res) => {
	var campaign = req.body;

	Campaign.addCampaign(campaign, (err, campaign) => {
		if (err) {
			throw err;
		}
		res.json(campaign);
	});
});

app.put('/api/campaigns/:_id', (req, res) => {
	var id = req.params._id;
	var campaign = req.body;
	Campaign.updateCampaign(id, campaign, {}, (err, campaign) => {
		if (err) {
			throw err;
		}
		res.json(campaign);
	});
});

app.delete('/api/campaigns/:_id', (req, res) => {
	var id = req.params._id;
	Campaign.removeCampaign(id, (err, campaign) => {
		if (err) {
			throw err;
		}
		res.json(campaign);
	});
});

app.listen(3000);
console.log('Running on port 3000...');