const cron = require('node-cron');
const mongoose = require('mongoose')
const Twit = require('twit')

const T = new Twit({
    consumer_key: '3442mFKp54ciOmVUsA5oVOdVT',
    consumer_secret: 'lfNpSyDrShwGTCppH9SYlC9QP3TFQdNXLw7JJUyXMbrBuiusVS',
    access_token: '916052172927787008-JNiH0YAniHRyJ4fwzwvjAlgUwCs3HM3',
    access_token_secret: 'ElpdbAQPucBxUOG5e24p9v0doB5zn2DwUEI1NJg0DsYqx',
});

Campaign = require('../models/campaign');
Tweet = require('../models/tweet');

const db = mongoose.connection;
mongoose.connect('mongodb://localhost/campaign-list');
script();


function script() {

    //run once
    query_campaigns();

    //start chron
    cron.schedule('* * * * *', function () {
        console.log("Chron Job Started!")
        try {
            query_campaigns();
        } catch (e) {
            console.log(e)
        }
    });
}

function query_campaigns() {
    //run immediately 
    Campaign.getCampaigns((err, campaigns) => {
        if (err) {
            console.log(err);
        }
        let now = new Date();

        campaigns.forEach(campaign => {
            //get tweet object for this campaign
            console.log("\n number tweets: " + campaign.number_tweets + " max tweets: " + campaign.max_tweets);
            if((now >= campaign.start_date) && (now >= campaign.end_date) && (campaign.number_tweets <= campaign.max_tweets)) {
                Tweet.getTweetByCampaignID(campaign._id, (err, tweet) => {
                    if (err) throw err;
                    //check if campaign has matching tweet object in database
                    if (tweet === null) {
                        //create new db tweetlist entry if no entry
                        let new_tweet = {
                            "_id": campaign._id,
                            "tweets": []
                        };
                        Tweet.addTweet(new_tweet, (err, tweet) => {
                            if (err) {
                                throw err;
                            }
                            console.log("New Tweet Object Added: " + new_tweet._id);
                            //run search on new tweet object
                            main_search(campaign, tweet);
                        });
                    } else {
                        //current tweet object found, run search on existing tweet object
                        main_search(campaign, tweet);
                    }
                });
            }
        });
    });
}

function main_search(campaign, tweet_list) {
    console.log("(Campaign ID, Tweet ID)::( " + campaign._id + " || " + tweet_list._id + " )");
    let current_tweet_ids = tweet_list.tweets.map(tweet => {
        return tweet.id_str
    });

    T.get('search/tweets', {
        q: campaign.campaign_tags
    }, function (err, data, response) {
        if (err) throw err;
        data.statuses.forEach(tweet => {
            if (!current_tweet_ids.includes(tweet.id_str)) {
                let new_tweet = {
                    contributors: tweet.contributors,
                    created_at: tweet.created_at,
                    favorited: tweet.favorited,
                    geo: tweet.geo,
                    id: tweet.id,
                    id_str: tweet.id_str,
                    in_reply_to_screen_name: tweet.in_reply_to_screen_name,
                    in_reply_to_status_id: tweet.in_reply_to_status_id,
                    in_reply_to_status_id_str: tweet.in_reply_to_status_id_str,
                    in_reply_to_user_id: tweet.in_reply_to_user_id,
                    in_reply_to_user_id_str: tweet.in_reply_to_user_id_str,
                    retweet_count: tweet.retweet_count,
                    retweeted: tweet.retweeted,
                    source: tweet.source,
                    text: tweet.text,
                    truncated: tweet.truncated,
                    user_id_str: tweet.user.id_str,
                    user_lang: tweet.user.lang,
                    user_location: tweet.user.location,
                    user_name: tweet.user.name,
                    user_profile_background_image_url: tweet.user.user_profile_background_image_url,
                    user_profile_image_url: tweet.user.profile_image_url,
                    user_screen_name: tweet.user.screen_name,
                    user_url: tweet.user.url,
                }
                Tweet.findByIdAndUpdate(tweet_list._id, {
                    "$push": {
                        "tweets": new_tweet
                    }
                }, {
                    "new": true,
                    "upsert": true
                }, (err, res) => {
                    if (err) console.log("Tweet Casting Error")
                });
            }
        });
        //all new tweets pulled in, update analytics here
        Tweet.findById(campaign._id, (err, tweet) => {
            console.log("Update to length: " + tweet.tweets.length);
            Campaign.findByIdAndUpdate(campaign._id, {
                $set: {
                    "number_tweets": tweet.tweets.length
                }
            }, (err, res) => {
                if (err) console.log(err);
            });
        });
    });
}