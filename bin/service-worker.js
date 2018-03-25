const cron = require('node-cron');
const mongoose = require('mongoose');
const Twit = require('twit');
const Freq = require('wordfrequenter');
const sentiment = require('sentiment');
const sw = require('stopwords');


//Connect to twitter API
const T = new Twit({
    consumer_key: '3442mFKp54ciOmVUsA5oVOdVT',
    consumer_secret: 'lfNpSyDrShwGTCppH9SYlC9QP3TFQdNXLw7JJUyXMbrBuiusVS',
    access_token: '916052172927787008-JNiH0YAniHRyJ4fwzwvjAlgUwCs3HM3',
    access_token_secret: 'ElpdbAQPucBxUOG5e24p9v0doB5zn2DwUEI1NJg0DsYqx',
});

//Require Campaign and Tweet Models
Campaign = require('../models/campaign');
Tweet = require('../models/tweet');

//Connect to MongoDB
const db = mongoose.connection;
mongoose.connect('mongodb://localhost/campaign-list');
//End Init

//Begin Service Worker On Start
main();
cron.schedule('* * * * *', function () {
    console.log("Chron Job Started!");
    try {
        main()
    } catch (e) {
        console.log(e);
    }
});

//main src
function main() {
    Campaign.find().exec()
        .then(campaigns => {
            campaigns.forEach(campaign => {

                //Determine if Campaign is Valid (return if invalid)
                let now = new Date();
                if (typeof campaign.max_tweets !== 'undefined' && campaign.max_tweets) {
                    console.log(campaign.max_tweets + " | " + campaign.number_tweets)
                    if (campaign.max_tweets <= campaign.number_tweets) {
                        return;
                    }
                }
                if (typeof campaign.start_date !== 'undefined' && campaign.start_date) {
                    if (campaign.start_date >= now) {
                        return;
                    }
                }
                if (typeof campaign.end_date !== 'undefined' && campaign.end_date) {
                    if (campaign.end_date <= now) {
                        return;
                    }
                }

                console.log("valid campaign: " + campaign.campaign_name)
                
                searchForTweets(campaign)
                    .then(res => {
                        console.log(res);
                    })
                    .catch(err => {
                        console.log(err)
                    });

                updateTweetCount(campaign)
                    .then(res => {
                        console.log(res);
                    })
                    .catch(err => {
                        console.log(err)
                    });
                
                updateAnalytics(campaign)
                    .then(res => {
                        console.log(res);
                    })
                    .catch(err => {
                        console.log(err)
                    });

                
            });
        });

}

//Searches and Updates Tweets for A Campaign
function searchForTweets(campaign) {
    return new Promise((resolve, reject) => {
        try {
            //get current list of campaign tweets
            let current_tweets = [];
            Tweet.find({
                _campaignid: campaign._id
            }, (err, res) => {
                current_tweets = res.map(tweet => {
                    return tweet.id_str
                });
            });

            //run a search using the campaign's tags
            T.get('search/tweets', {
                q: campaign.campaign_tags,
                tweet_mode: 'extended'
            }, (error, data, response) => {
                if(error){
                    reject(error);
                }
                //cycle through list of tweets returned from search,d
                //add new tweets (not listed in current_tweet_ids) to campaign's tweet list
                if(data){
                    data.statuses.forEach(tweet => {
                        let sent = sentiment(tweet.full_text.replace(/RT\s*@[^:]*:/g, ''));
                        let new_tweet = {
                            contributors: tweet.contributors,
                            created_at: tweet.created_at,
                            favorited: tweet.favorited,
                            geo: tweet.geo,
                            _id: tweet.id_str + campaign._id,
                            _campaignid: campaign._id,
                            id_str: tweet.id_str,
                            in_reply_to_screen_name: tweet.in_reply_to_screen_name,
                            in_reply_to_status_id: tweet.in_reply_to_status_id,
                            in_reply_to_status_id_str: tweet.in_reply_to_status_id_str,
                            in_reply_to_user_id: tweet.in_reply_to_user_id,
                            in_reply_to_user_id_str: tweet.in_reply_to_user_id_str,
                            retweet_count: tweet.retweet_count,
                            retweeted: tweet.retweeted,
                            source: tweet.source,
                            text: tweet.full_text,
                            truncated: tweet.truncated,
                            user_id_str: tweet.user.id_str,
                            user_lang: tweet.user.lang,
                            user_location: tweet.user.location,
                            user_name: tweet.user.name,
                            user_profile_background_image_url: tweet.user.user_profile_background_image_url,
                            user_profile_image_url: tweet.user.profile_image_url,
                            user_screen_name: tweet.user.screen_name,
                            user_url: tweet.user.url,
                            sentiment: {
                                score: sent.score,
                                comparative: sent.comparative,
                                tokens: sent.tokens,
                                words: sent.words,
                                positive: sent.positive,
                                negative: sent.negative,
                            }
                        }
                        if (!current_tweets.includes(new_tweet._id)) {
                            let nt = new Tweet(new_tweet);
                            nt.save((res, error) => {
                                if (error)  reject("Tweet search error: " + error);
                            });
                        }
                    });
                }

            });

            resolve(campaign.campaign_name + ": tweets updated");
        } catch (error) {
            reject("Tweet search error: " + error);
        }
    });
}

function updateTweetCount(campaign) {
    return new Promise((resolve, reject) => {
        try {
            let numberTweets = 0;
            Tweet.find({
                    _campaignid: campaign._id
                })
                .then(tweets => {
                    numberTweets = tweets.length;
                }).then(() => {


                    Campaign.findByIdAndUpdate(campaign._id, {
                        $set: {
                            //length of tweets array after new tweets added
                            "number_tweets": numberTweets,
                        }
                    }, (err, res) => {
                        if (err) reject(err);
                        resolve(campaign.campaign_name + ": word count updated");
                    });
                }).catch(err => reject(err));
        } catch (error) {
            reject(campaign.campaign_name + ": word count error!");
        }
    });
}

//Updates Analytics for A Campaign
function updateAnalytics(campaign) {
    return new Promise((resolve, reject) => {
        try {
            let allCampaignText = [];
            let numberTweets = 0;

            Tweet.find({
                    _campaignid: campaign._id
                })
                .then(tweets => {
                    allCampaignText = tweets.map(tweet => {
                        return tweet.text;
                    });
                    numberTweets = allCampaignText.length;

                }).then(() => {
                    let parsedWordCountText = allCampaignText.join(' ').replace(/[^a-z0-9]/gmi, " ").replace(/\s+/g, " ").removeStopWords().toLowerCase();
                    let wf = new Freq(parsedWordCountText.split(' '));
                    wf.set('string');

                    Campaign.findByIdAndUpdate(campaign._id, {
                        $set: {
                            //length of tweets array after new tweets added
                            "number_tweets": numberTweets,
                            "frequent_words": wf.list().slice(Math.max(wf.list().length - 100, 1)),
                        }
                    }, (err, res) => {
                        if (err) reject(err);
                        resolve(campaign.campaign_name + ": analytics updated");
                    });
                }).catch(err => reject(err));
        } catch (error) {
            reject(campaign.campaign_name + ": analytics error!");
        }
    });
}

//Script Methods
String.prototype.removeStopWords = function () {
    var x;
    var y;
    var word;
    var stop_word;
    var regex_str;
    var regex;
    var cleansed_string = this.valueOf();
    var stop_words = new Array(
        //custom stop words
        'rt',
        'RT',
        're',
        'co',
        'https',
        've',
        'ing',

        //generic stop words
        'a',
        'about',
        'above',
        'across',
        'after',
        'again',
        'against',
        'all',
        'almost',
        'alone',
        'along',
        'already',
        'also',
        'although',
        'always',
        'among',
        'an',
        'and',
        'another',
        'any',
        'anybody',
        'anyone',
        'anything',
        'anywhere',
        'are',
        'area',
        'areas',
        'around',
        'as',
        'ask',
        'asked',
        'asking',
        'asks',
        'at',
        'away',
        'b',
        'back',
        'backed',
        'backing',
        'backs',
        'be',
        'became',
        'because',
        'become',
        'becomes',
        'been',
        'before',
        'began',
        'behind',
        'being',
        'beings',
        'best',
        'better',
        'between',
        'big',
        'both',
        'but',
        'by',
        'c',
        'came',
        'can',
        'cannot',
        'case',
        'cases',
        'certain',
        'certainly',
        'clear',
        'clearly',
        'come',
        'could',
        'd',
        'did',
        'differ',
        'different',
        'differently',
        'do',
        'does',
        'done',
        'down',
        'down',
        'downed',
        'downing',
        'downs',
        'during',
        'e',
        'each',
        'early',
        'either',
        'end',
        'ended',
        'ending',
        'ends',
        'enough',
        'even',
        'evenly',
        'ever',
        'every',
        'everybody',
        'everyone',
        'everything',
        'everywhere',
        'f',
        'face',
        'faces',
        'fact',
        'facts',
        'far',
        'felt',
        'few',
        'find',
        'finds',
        'first',
        'for',
        'four',
        'from',
        'full',
        'fully',
        'further',
        'furthered',
        'furthering',
        'furthers',
        'g',
        'gave',
        'general',
        'generally',
        'get',
        'gets',
        'give',
        'given',
        'gives',
        'go',
        'going',
        'good',
        'goods',
        'got',
        'great',
        'greater',
        'greatest',
        'group',
        'grouped',
        'grouping',
        'groups',
        'h',
        'had',
        'has',
        'have',
        'having',
        'he',
        'her',
        'here',
        'herself',
        'high',
        'high',
        'high',
        'higher',
        'highest',
        'him',
        'himself',
        'his',
        'how',
        'however',
        'i',
        'if',
        'important',
        'in',
        'interest',
        'interested',
        'interesting',
        'interests',
        'into',
        'is',
        'it',
        'its',
        'itself',
        'j',
        'just',
        'k',
        'keep',
        'keeps',
        'kind',
        'knew',
        'know',
        'known',
        'knows',
        'l',
        'large',
        'largely',
        'last',
        'later',
        'latest',
        'least',
        'less',
        'let',
        'lets',
        'like',
        'likely',
        'long',
        'longer',
        'longest',
        'm',
        'made',
        'make',
        'making',
        'man',
        'many',
        'may',
        'me',
        'member',
        'members',
        'men',
        'might',
        'more',
        'most',
        'mostly',
        'mr',
        'mrs',
        'much',
        'must',
        'my',
        'myself',
        'n',
        'necessary',
        'need',
        'needed',
        'needing',
        'needs',
        'never',
        'new',
        'new',
        'newer',
        'newest',
        'next',
        'no',
        'nobody',
        'non',
        'noone',
        'not',
        'nothing',
        'now',
        'nowhere',
        'number',
        'numbers',
        'o',
        'of',
        'off',
        'often',
        'old',
        'older',
        'oldest',
        'on',
        'once',
        'one',
        'only',
        'open',
        'opened',
        'opening',
        'opens',
        'or',
        'order',
        'ordered',
        'ordering',
        'orders',
        'other',
        'others',
        'our',
        'out',
        'over',
        'p',
        'part',
        'parted',
        'parting',
        'parts',
        'per',
        'perhaps',
        'place',
        'places',
        'point',
        'pointed',
        'pointing',
        'points',
        'possible',
        'present',
        'presented',
        'presenting',
        'presents',
        'problem',
        'problems',
        'put',
        'puts',
        'q',
        'quite',
        'r',
        'rather',
        'really',
        'right',
        'right',
        'room',
        'rooms',
        's',
        'said',
        'same',
        'saw',
        'say',
        'says',
        'second',
        'seconds',
        'see',
        'seem',
        'seemed',
        'seeming',
        'seems',
        'sees',
        'several',
        'shall',
        'she',
        'should',
        'show',
        'showed',
        'showing',
        'shows',
        'side',
        'sides',
        'since',
        'small',
        'smaller',
        'smallest',
        'so',
        'some',
        'somebody',
        'someone',
        'something',
        'somewhere',
        'state',
        'states',
        'still',
        'still',
        'such',
        'sure',
        't',
        'take',
        'taken',
        'than',
        'that',
        'the',
        'their',
        'them',
        'then',
        'there',
        'therefore',
        'these',
        'they',
        'thing',
        'things',
        'think',
        'thinks',
        'this',
        'those',
        'though',
        'thought',
        'thoughts',
        'three',
        'through',
        'thus',
        'to',
        'today',
        'together',
        'too',
        'took',
        'toward',
        'turn',
        'turned',
        'turning',
        'turns',
        'two',
        'u',
        'under',
        'until',
        'up',
        'upon',
        'us',
        'use',
        'used',
        'uses',
        'v',
        'very',
        'w',
        'want',
        'wanted',
        'wanting',
        'wants',
        'was',
        'way',
        'ways',
        'we',
        'well',
        'wells',
        'went',
        'were',
        'what',
        'when',
        'where',
        'whether',
        'which',
        'while',
        'who',
        'whole',
        'whose',
        'why',
        'will',
        'with',
        'within',
        'without',
        'work',
        'worked',
        'working',
        'works',
        'would',
        'x',
        'y',
        'year',
        'years',
        'yet',
        'you',
        'young',
        'younger',
        'youngest',
        'your',
        'yours',
        'z'
    )

    // Split out all the individual words in the phrase
    words = cleansed_string.match(/[^\s]+|\s+[^\s+]$/g)

    // Review all the words
    for (x = 0; x < words.length; x++) {
        // For each word, check all the stop words
        for (y = 0; y < stop_words.length; y++) {
            // Get the current word
            word = words[x].replace(/\s+|[^a-z]+/ig, ""); // Trim the word and remove non-alpha

            // Get the stop word
            stop_word = stop_words[y];

            // If the word matches the stop word, remove it from the keywords
            if (word.toLowerCase() == stop_word) {
                // Build the regex
                regex_str = "^\\s*" + stop_word + "\\s*$"; // Only word
                regex_str += "|^\\s*" + stop_word + "\\s+"; // First word
                regex_str += "|\\s+" + stop_word + "\\s*$"; // Last word
                regex_str += "|\\s+" + stop_word + "\\s+"; // Word somewhere in the middle
                regex = new RegExp(regex_str, "ig");

                // Remove the word from the keywords
                cleansed_string = cleansed_string.replace(regex, " ");
            }
        }
    }
    return cleansed_string.replace(/^\s+|\s+$/g, "");
}