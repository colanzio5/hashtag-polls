const cron = require('node-cron');
const mongoose = require('mongoose')
const Twit = require('twit')
const keys = require('./bin/creds.js');

const T = new Twit({
    consumer_key: keys.twitterCreds.consumer_key,
    consumer_secret: keys.twitterCreds.consumer_secret,
    access_token: keys.twitterCreds.access_token,
    access_token_secret: keys.twitterCreds.access_token_secret,
});

Campaign = require('./models/campaign');
const db = mongoose.connection;
mongoose.connect('mongodb://localhost/campaign-list');


//run immediately 
Campaign.getCampaigns((err, campaigns) => {
    if (err)
        throw err;
    campaigns.forEach(campaign => {
        try {
            search_for_tweets(campaign);
        } catch (error) {
            console.log("error encountered");
        }
    });
});

//run every minute
cron.schedule('* * * * *', function () {
    console.log("Chron Job Started!")
    Campaign.getCampaigns((err, campaigns) => {
        if (err)
            throw err;
        campaigns.forEach(campaign => {
            try {
                search_for_tweets(campaign);
            } catch (error) {
                console.log("error encountered");
            }
        });
    });
});

//main search using twit api - writes new tweets to db
function search_for_tweets(campaign) {
    console.log("\nsearch ran for " + campaign.campaign_name + ": ids/tags : " + campaign.campaign_tags);
    let current_tweet_ids = campaign.tweets.map(tweet => {
        return tweet.id_str
    });

    T.get('search/tweets', {
        q: campaign.campaign_tags
    }, function (err, data, response) {

        data.statuses.forEach(tweet => {
            if (!current_tweet_ids.includes(tweet.id_str)) {
                Campaign.update({
                        "_id": campaign._id
                    }, {
                        "$push": {
                            "tweets": {
                                retweeted: tweet.retweeted,
                                in_reply_to_status_id: tweet.in_reply_to_status_id,
                                id_str: tweet.id_str,
                                truncated: tweet.truncated,
                                in_reply_to_status_id_str: tweet.in_reply_to_status_id_str,
                                source: tweet.source,
                                favorited: tweet.favorited,
                                in_reply_to_user_id_str: tweet.in_reply_to_user_id_str,
                                created_at: tweet.created_at,
                                contributors: tweet.contributors,
                                in_reply_to_screen_name: tweet.in_reply_to_screen_name,

                                user_screen_name: tweet.user.screen_name,
                                user_id_str: tweet.user.id_str,
                                user_profile_background_image_url: tweet.user.user_profile_background_image_url,
                                user_url: tweet.user.url,
                                user_name: tweet.user.name,
                                user_location: tweet.user.location,
                                user_lang: tweet.user.lang,
                                user_profile_image_url: tweet.user.profile_image_url,
                                // user: {
                                //     profile_background_image_url: tweet.user.profile_background_color,
                                //     profile_link_color: tweet.user.profile_link_color,
                                //     description: tweet.user.description,
                                //     screen_name: tweet.user.screen_name,
                                //     id_str: tweet.user.id_str,
                                //     listed_count: tweet.user.listed_count,
                                //     profile_background_tile: tweet.user.profile_background_tile,
                                //     profile_sidebar_fill_color: tweet.user.profile_sidebar_fill_color,
                                //     statuses_count: tweet.user.statuses_count,
                                //     show_all_inline_media: tweet.user.show_all_inline_media,
                                //     favourites_count: tweet.user.favourites_count,
                                //     profile_sidebar_border_color: tweet.user.profile_sidebar_border_color,
                                //     followers_count: tweet.user.followers_count,
                                //     url: tweet.user.url,
                                //     contributors_enabled: tweet.user.contributors_enabled,
                                //     geo_enabled: tweet.user.geo_enabled,
                                //     lang: tweet.user.lang,
                                //     time_zone: tweet.user.time_zone,
                                //     created_at: tweet.user.created_at,
                                //     location: tweet.user.location,
                                //     profile_background_color: tweet.user.profile_background_color,
                                //     protected: tweet.user.protected,
                                //     friends_count: tweet.user.friends_count,
                                //     name: tweet.user.name,
                                //     follow_request_sent: tweet.user.follow_request_sent,
                                //     following: tweet.user.following,
                                //     profile_use_background_image: tweet.user.profile_use_background_image,
                                //     profile_text_color: tweet.user.profile_text_color,
                                //     profile_image_url: tweet.user.profile_image_url,
                                //     id: tweet.user.id,
                                //     verified: tweet.user.verified,
                                //     notifications: tweet.user.notifications,
                                //     utc_offset: tweet.user.utc_offset
                                // },
                                geo: tweet.geo,
                                retweet_count: tweet.retweet_count,
                                id: tweet.id,
                                in_reply_to_user_id: tweet.in_reply_to_user_id,
                                text: tweet.text
                            }
                        }
                    },
                    function (err, callback) {
                        if (err) console.log(err)
                    });
            }
        });
    })
}