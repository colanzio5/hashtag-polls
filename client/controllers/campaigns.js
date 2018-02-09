var myApp = angular.module('tweet-tracker');

myApp.controller('CampaignsController', ['$scope', '$http', '$location', '$routeParams', function ($scope, $http, $location, $routeParams) {
	console.log('CampaignsController loaded...');

	$scope.getCampaigns = function () {
		$http.get('/api/campaigns').success(function (response) {
			$scope.campaigns = response;
		});
	}

	$scope.getCampaign = function () {
		var id = $routeParams.id;
		$http.get('/api/campaigns/' + id).success(function (response) {
			$scope.campaign = response;
			let now = new Date();
		});
		$http.get('/api/tweets/' + id).success(function (response) {
			$scope.tweets = response.tweets;
			$scope.tweet_count = $scope.tweets.length;
		});
	}

	$scope.export_tweets = function () {
		var s = $scope.tweets
		var jsons=[];
		for (var i=s.length;i--;) jsons[i]=JSON.stringify(s[i]);
		var blob = new Blob( jsons, {
			type: "text/plain;charset=utf-8"
		});
		saveAs(blob, "tweet_list.txt");
	} 

	$scope.addCampaign = function () {
		$http.post('/api/campaigns/', $scope.campaign).success(function (response) {
			window.location.href = '#/campaigns';
		});
	}

	$scope.updateCampaign = function () {
		var id = $routeParams.id;
		$http.put('/api/campaigns/' + id, $scope.campaign).success(function (response) {
			window.location.href = '#/campaigns';
		});
	}

	$scope.removeCampaign = function (id) {
		$http.delete('/api/campaigns/' + id).success(function (response) {});

		$http.delete('/api/tweets/' + id).success(function (response) {
			window.location.href = '#/campaigns';
		});
	}
}]);