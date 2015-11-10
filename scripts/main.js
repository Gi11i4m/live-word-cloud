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

wordCloud.factory('logger', function() {
	
	return {
		logInfo : function(toLog) {
			console.log("INFO", toLog);
		},
		logError : function(toLog) {
			console.log("ERROR", toLog);
		}
	};
});

wordCloud.controller('WordCloudController', function($scope, $timeout, $interval, wordRepository, logger) {

	var WORDS_UNCHANGED_MESSAGE = "Words unchanged";
	var WORDS_CHANGED_MESSAGE =  "Refreshing words...";
	
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
				logger.logInfo(WORDS_UNCHANGED_MESSAGE + "\nWords: " + $scope.words);
			}
		}, logger.logError);
	}

	function refreshWords() {
		logger.logInfo(WORDS_CHANGED_MESSAGE + "\nWords: " + $scope.words);
		$('#go').click();
	}

	/* EXECUTION LOOP */
	wordPoll = $interval(refreshWordsIfChanged, 3000);
});

wordCloud.controller('WordCloudUpdateController', function($scope, wordRepository, logger) {

	var LOCAL_STORAGE_COUNTER_NAME = "wordUpdateCount";
	var SUBMIT_BUTTON_DEFAULT = "Geef feedback";
	var SUBMIT_BUTTON_ADDING = "Toevoegen...";
	var SUBMIT_BUTTON_SUCCESS = "Bedankt!";
	var LEGEND_MESSAGE_SUCCESS = "Bedankt voor uw feedback!";
	var LEGEND_MESSAGE_DEFAULT = "Omschrijf de ASWFM in één woord";
	var VALIDATION_PATTERN = /^[A-Za-z]{2,20}$/;
	var VALIDATION_PATTERN_MESSAGE = "zorg dat je woord enkel letters bevat, en niet langer is dan 20 tekens";
	var MAX_TRIES_REACHED_MESSAGE = "3x feedback is genoeg ☺";
	var GENERIC_ERROR_MESSAGE = "Er ging iets mis...";
	var CARD_IMAGE_URL = "images/sfm.png";

	$scope.word = "";
	$scope.legendMessage = LEGEND_MESSAGE_DEFAULT;
	$scope.validationPattern = VALIDATION_PATTERN;
	$scope.patternMessage = VALIDATION_PATTERN_MESSAGE;
	$scope.submitButtonValue = SUBMIT_BUTTON_DEFAULT;
	$scope.imagePath = CARD_IMAGE_URL;
	$scope.isTextfieldDisabled = false;
	$scope.isSubmitDisabled = false;
	$scope.isWordValid = isWordValid;

	$scope.submitWord = function() {
		if (hasReachedMaxTries() && isSmartphone()) {
			error(MAX_TRIES_REACHED_MESSAGE);
		} else if (isWordValid()) {
			$scope.isSubmitDisabled = true;
			$scope.submitButtonValue = SUBMIT_BUTTON_ADDING;
			updateLocalStorage();
			wordRepository.adWord($scope.word.trim(), success, error);
		} else {
			error($scope.patternMessage);
		}
	};
	
	function isWordValid() {
		return $scope.word && $scope.validationPattern.test($scope.word);
	};
	
	function success(response) {
		logger.logInfo(response);
		
		$scope.submitButtonValue = SUBMIT_BUTTON_SUCCESS;
		$scope.legendMessage = LEGEND_MESSAGE_SUCCESS;
		$scope.isTextfieldDisabled = true;
		$scope.isSubmitDisabled = true; 
	}
	
	function error(message) {
		var errorMessage = message ? message : GENERIC_ERROR_MESSAGE;
		logger.logError(errorMessage);
		
		$scope.legendMessage = errorMessage;
		$scope.isSubmitDisabled = false;
		$scope.submitButtonValue = SUBMIT_BUTTON_DEFAULT;
	}
	
	function updateLocalStorage() {
		var updateCount = localStorage.getItem(LOCAL_STORAGE_COUNTER_NAME);
		updateCount ? localStorage.setItem(LOCAL_STORAGE_COUNTER_NAME, parseInt(updateCount) + 1) : localStorage.setItem(LOCAL_STORAGE_COUNTER_NAME, 1);
	}
	
	function hasReachedMaxTries() {
		return localStorage.getItem(LOCAL_STORAGE_COUNTER_NAME) >= 3;
	}
	
	function isSmartphone() {
		return window.innerWidth < 600;
	}
});