var myApp = angular.module('tweet-tracker',['ngRoute']);

myApp.config(function($routeProvider){
	$routeProvider.when('/', {
		controller:'CampaignsController',
		templateUrl: 'views/home.html'
	})
	.when('/campaigns', {
		controller:'CampaignsController',
		templateUrl: 'views/campaigns.html'
	})
	.when('/campaigns/details/:id',{
		controller:'CampaignsController',
		templateUrl: 'views/campaign_details.html'
	})
	.when('/campaigns/add',{
		controller:'CampaignsController',
		templateUrl: 'views/add_campaign.html'
	})
	.when('/campaigns/edit/:id',{
		controller:'CampaignsController',
		templateUrl: 'views/edit_campaign.html'
	})
	.otherwise({
		redirectTo: '/'
	});
});