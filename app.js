const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

app.use(express.static(__dirname + '/client'));
app.use(bodyParser.json());

Campaign = require('./models/campaign');

// Connect to Mongoose
mongoose.connect('mongodb://localhost/campaign-list');
var db = mongoose.connection;

app.get('/', (req, res) => {
	res.send('Please use /api/campaigns');
});

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
	console.log(campaign)
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