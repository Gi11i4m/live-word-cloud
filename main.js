var wordCloud = angular.module('wordCloud', []);

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

	$scope.title = "Cegeka ASFM Feedback Word Cloud";
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

	$scope.title = "Cegeka ASFM Feedback";
	$scope.word = "";
	$scope.legendMessage = "Beschrijf de ASWFM in één woord!";
	$scope.validationPattern = /^[A-Za-z\-]{2,20}$/;
	$scope.submitButtonValue = "Geef feedback";
	$scope.isTextfieldDisabled = false;
	$scope.isSubmitDisabled = false;
	var localStorageCounterName = "wordUpdateCount";

	$scope.submitWord = function() {
		if (hasReachedMaxTries()) {
			error("reached_max_tries", "3x feedback is genoeg ;)");
		} else if ($scope.validationPattern.test($scope.word)) {
			updateLocalStorage();
			wordRepository.adWord($scope.word.trim(), success, error);
		} else {
			error("update_error", "Mislukt. Zorg dat je verbinding hebt en dat je woord enkel letters en '-' bevat, en niet langer is dan 20 tekens.");
		}
	};
	
	$scope.isWordValid = function() {
		return $scope.word !== null && $scope.word !== undefined && $scope.validationPattern.test($scope.word);
	};
	
	function success(response) {
		console.log(response);
		
		$scope.submitButtonValue = "Done!";
		$scope.legendMessage = "Bedankt voor uw feedback!";
		$scope.isTextfieldDisabled = true;
		$scope.isSubmitDisabled = true; 
	}
	
	function error(error, message) {
		console.log(error);
		alert(message);
	}
	
	function updateLocalStorage() {
		var updateCount = localStorage.getItem(localStorageCounterName);
		
		if (updateCount)
			localStorage.setItem(localStorageCounterName, parseInt(updateCount)+1);
		else
			localStorage.setItem(localStorageCounterName, 1);
	}
	
	function hasReachedMaxTries() {
		return false;
		// localStorage.getItem(localStorageCounterName) >= 3;
	}
	
});
