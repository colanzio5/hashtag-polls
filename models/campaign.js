const mongoose = require('mongoose');
const tweetSchema = mongoose.Schema({
	text: String,
	id_str: String,
	created_at: String
})
const campaignSchema = mongoose.Schema({
	campaign_name: {
		type: String,
		required: true
	},
	campaign_tags: {
		type: String,
		required: true
	},
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
	tweets: [{
		retweeted: Boolean,
		in_reply_to_status_id: Number,
		id_str: String,
		truncated: Boolean,
		in_reply_to_status_id_str: String,
		source: String,
		favorited: Boolean,
		in_reply_to_user_id_str: String,
		created_at: String,
		contributors: String,
		in_reply_to_screen_name: String,

		user_screen_name: String,
		user_id_str: String,
		user_profile_background_image_url: String,
		user_url: String,
		user_name: String,
		user_location: String,
		user_lang: String,
		user_profile_image_url: String,
		// user: {
		// 	profile_background_image_url: String,
		// 	profile_link_color: String,
		// 	description: String,
		// 	screen_name: String,
		// 	id_str: String,
		// 	listed_count: Number,
		// 	profile_background_tile: Boolean,
		// 	profile_sidebar_fill_color: String,
		// 	statuses_count: Number,
		// 	show_all_inline_media: Boolean,
		// 	favourites_count: Number,
		// 	profile_sidebar_border_color: String,
		// 	followers_count: Number,
		// 	url: String,
		// 	contributors_enabled: Boolean,
		// 	geo_enabled: Boolean,
		// 	lang: String,
		// 	time_zone: String,
		// 	created_at: String,
		// 	location: String,
		// 	profile_background_color: String,
		// 	protected: Boolean,
		// 	friends_count: Number,
		// 	name: String,
		// 	follow_request_sent: String,
		// 	following: String,
		// 	profile_use_background_image: String,
		// 	profile_text_color: String,
		// 	profile_image_url: String,
		// 	id: Number,
		// 	verified: Boolean,
		// 	notifications: String,
		// 	utc_offset: Number
		// },
		geo: String,
		retweet_count: Number,
		id: Number,
		in_reply_to_user_id: String,
		text: String
	}]
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