const mongoose = require('mongoose');
const Tweet = require('./tweet')

const campaignSchema = mongoose.Schema({
	campaign_name: {
		type: String,
		required: true
	},
	campaign_tags: [{
		type: String,
		required: true
	}],
	start_date: {
		type: Date,
		default: Date.now
	},
	end_date: {
		type: Date,
		required: false
	},
	number_tweets: {
		type: String,
		required: false
	},
	tweet_db_id: String
});
const Campaign = module.exports = mongoose.model('Campaign', campaignSchema);

// Get Campaigns
module.exports.getCampaigns = (callback, limit) => {
	Campaign.find(callback).limit(limit);
}

// Get Campaign
module.exports.getCampaignByID = (id, callback) => {
	Campaign.findById(id, callback);
}

// Add Campaign
module.exports.addCampaign = (campaign, callback) => {
	campaign.campaign_tags = campaign.campaign_tags.split(',');
	Campaign.create(campaign, callback);
}

// Update Campaign
module.exports.updateCampaign = (id, campaign, options, callback) => {
	var query = {
		_id: id
	};
	var update = {
		campaign_name: campaign.campaign_name,
		campaign_tags: campaign.campaign_tags,
		start_date: campaign.start_date,
		end_date: campaign.end_date,
		number_tweets: campaign.number_tweets
	}
	Campaign.findOneAndUpdate(query, update, options, callback);
}

// Delete Campaign
module.exports.removeCampaign = (id, callback) => {
	var query = {
		_id: id
	};
	Campaign.remove(query, callback);
}