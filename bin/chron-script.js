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

    function query_campaigns() {
        //run immediately 
        Campaign.getCampaigns((err, campaigns) => {
            if (err)
                console.log(err);
            let now = new Date();
            campaigns.forEach(campaign => {

                console.log("CAMPAIGN DETAILS: name + (startdate, enddate, now, maxtweets, startdate >? now, enddate <? now")
                console.log(campaign.campaign_name + "(" + campaign.start_date + ", " + campaign.end_date + ", " + now + ", " + (campaign.start_date >= now) + ", " + (campaign.end_date <= now) + ")");
    
                //here we determin if a campaign has reached a tweet limit or date limit
                // return if expired or invalid
                if ( typeof campaign.max_tweets !== 'undefined' && campaign.max_tweets ){
                    if(campaign.max_tweets <= campaign.number_tweets){ 
                        console.log('err: max');
                        return; 
                    }
                }
                if ( typeof campaign.start_date !== 'undefined' && campaign.start_date ){
                    if(campaign.start_date >= now){ 
                        console.log('err: start')
                        return; 
                    }
                }
                if ( typeof campaign.end_date !== 'undefined' && campaign.end_date ){
                    if(campaign.end_date <= now){ 
                        console.log('err: end')
                        return; 
                    }
                }
    
                //if not invalid continue with search
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
                            if (err) throw err;
                            try {
                                main_search(campaign, tweet);
                            } catch (err) {
                                console.log(err);
                            }
                        });
                    } else {
                        //otherwise campaign has tweet-list object, use likewise
                        try {
                            main_search(campaign, tweet);
                        } catch (err) {
                            console.log(err);
                        }
                    }
                });
            });
        });
    }
    
    function main_search(campaign, tweet_list) {
    
        //get list of tweets currently associated with campaign
        let current_tweet_ids = tweet_list.tweets.map(tweet => {
            return tweet.id_str
        });
    
        //run a search using the campaign's tags
        T.get('search/tweets', {
            q: campaign.campaign_tags,
        }, function (err, data, response) {
            if (err) console.log(err);
    
            //cycle through list of tweets returned from search,
            //add new tweets (not listed in current_tweet_ids) to campaign's tweet list
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
                        if (err) throw err;
                    });
                }
            });
    
            //all new tweets pulled in, update analytics here
            Tweet.findById(campaign._id, (err, tweet) => {
                Campaign.findByIdAndUpdate(campaign._id, {
                    $set: {
    
                        //length of tweets array after new tweets added
                        "number_tweets": tweet.tweets.length
                    }
                }, (err, res) => {
                    if (err) throw err;
                });
            });
        });
    }
}

