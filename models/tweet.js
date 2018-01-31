const mongoose = require('mongoose');
var tweetSchema = new mongoose.Schema({
    _id: String,
    db_ref: String,
    tweets: [{
        contributors: String,
        created_at: String,
        favorited: Boolean,
        geo: String,
        id: Number,
        id_str: String,
        in_reply_to_screen_name: String,
        in_reply_to_status_id: Number,
        in_reply_to_status_id_str: String,
        in_reply_to_user_id: String,
        in_reply_to_user_id_str: String,
        retweet_count: Number,
        retweeted: Boolean,
        source: String,
        text: String,
        truncated: Boolean,
        user_id_str: String,
        user_lang: String,
        user_location: String,
        user_name: String,
        user_profile_background_image_url: String,
        user_profile_image_url: String,
        user_screen_name: String,
        user_url: String
    }]
  });

const Tweet = module.exports = mongoose.model('Tweet', tweetSchema);
module.exports.getCampaignTweets = (callback, limit) => {
    Tweet.find(callback).limit(limit);
}

module.exports.addTweet = (tweet, callback) => {
	Tweet.create(tweet, callback);
}

module.exports.getTweetByCampaignID = (id, callback) => {
	Tweet.findById(id, callback);
}

// Delete Campaign
module.exports.removeTweet = (id, callback) => {
	var query = {
		_id: id
	};
	Tweet.remove(query, callback);
}

//Additional Twitter API Tweet Object Parameters
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