var wordCloud = angular.module('wordCloud', ['ngMaterial']);

wordCloud.factory('wordRepository', function($http) {
	var wordCloudDatabaseUrl = 'https://gi11i4m.cloudant.com/word-cloud';
	var wordCloudDocumentId = '/words';
	
	return {
		getWordString : function(successCallback, errorCallback) {
			$http.get(wordCloudDatabaseUrl + wordCloudDocumentId).success(function(document) {
				successCallback(document.words.join(" ").toUpperCase());
			}).error(errorCallback);
		},
		adWord : function(word, successCallback, errorCallback) {
			$http.get(wordCloudDatabaseUrl + wordCloudDocumentId).success(function(data) {
				var wordDocument = data;
				wordDocument.words.push(word);
				$http.put(wordCloudDatabaseUrl + wordCloudDocumentId, wordDocument).success(successCallback).error(errorCallback);			
			}, errorCallback);
		}
	};
});

wordCloud.controller('WordCloudController', function($scope, $timeout, $interval, wordRepository) {

	$scope.font = "Impact";
	$scope.angleCount = 7;
	$scope.angleFrom = -90;
	$scope.angleTo = 90;
	$scope.numberOfWords = 300;
	$scope.oneWordPerLine = false;

	function refreshWordsIfChanged() {
		wordRepository.getWordString(function(wordString) {
			if ($scope.words !== wordString) {
				$scope.words = wordString;
				$timeout(refreshWords, 100);
			} else {
				console.log("Words unchanged" + "\nWords: " + $scope.words);
			}
		}, logError);
	}

	function refreshWords() {
		console.log("Refreshing words..." + "\nWords: " + $scope.words);
		$('#go').click();
	}

	function logError(error) {
		console.log(error);
	}

	/* EXECUTION LOOP */
	wordPoll = $interval(refreshWordsIfChanged, 3000);
});

wordCloud.controller('WordCloudUpdateController', function($scope, wordRepository) {

	var localStorageCounterName = "wordUpdateCount";
	var defaultSubmitButtonValue = "Geef feedback";

	$scope.word = "";
	$scope.legendMessage = "Omschrijf de ASWFM in één woord!";
	$scope.validationPattern = /^[A-Za-z]{2,20}$/;
	$scope.patternMessage = "zorg dat je woord enkel letters bevat, en niet langer is dan 20 tekens";
	$scope.submitButtonValue = defaultSubmitButtonValue;
	$scope.imagePath = "images/sfm.png";
	$scope.isTextfieldDisabled = false;
	$scope.isSubmitDisabled = false;

	$scope.submitWord = function() {
		if (hasReachedMaxTries() && isSmartphone()) {
			error("max_tries_reached", "3x feedback is genoeg ;)");
		} else if ($scope.validationPattern.test($scope.word)) {
			$scope.isSubmitDisabled = true;
			$scope.submitButtonValue = "Toevoegen...";
			updateLocalStorage();
			wordRepository.adWord($scope.word.trim(), success, error);
		} else {
			error("word_pattern_error", $scope.patternMessage);
		}
	};
	
	$scope.isWordValid = function() {
		return $scope.word !== null && $scope.word !== undefined && $scope.validationPattern.test($scope.word);
	};
	
	function success(response) {
		console.log(response);
		
		$scope.submitButtonValue = "Bedankt!";
		$scope.legendMessage = "Bedankt voor uw feedback!";
		$scope.isTextfieldDisabled = true;
		$scope.isSubmitDisabled = true; 
	}
	
	function error(error, message) {
		var errorMessage = (message === -1 || message === null || message === undefined) ? "er ging iets mis..." : message;
		$scope.legendMessage = "Error: " + errorMessage;
		$scope.isSubmitDisabled = false;
		$scope.submitButtonValue = defaultSubmitButtonValue;
	}
	
	function updateLocalStorage() {
		var updateCount = localStorage.getItem(localStorageCounterName);
		
		if (updateCount)
			localStorage.setItem(localStorageCounterName, parseInt(updateCount)+1);
		else
			localStorage.setItem(localStorageCounterName, 1);
	}
	
	function hasReachedMaxTries() {
		return localStorage.getItem(localStorageCounterName) >= 3;
	}
	
	function isSmartphone() {
		return navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i);
	}

});