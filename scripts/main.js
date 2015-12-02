/* global angular */
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

wordCloud.service("strings", function() {
	this.WORDS_UNCHANGED_MESSAGE = "No words changed";
	this.WORDS_CHANGED_MESSAGE = "Refreshing words...";
	this.WORD_DEFAULT = "";
	this.SUBMIT_BUTTON_DEFAULT = "Geef feedback";
	this.SUBMIT_BUTTON_ADDING = "Toevoegen...";
	this.SUBMIT_BUTTON_SUCCESS = "Bedankt!";
	this.RESET_BUTTON_DEFAULT = "Reset";
	this.LEGEND_MESSAGE_SUCCESS = "Bedankt voor uw feedback!";
	this.LEGEND_MESSAGE_DEFAULT = "Omschrijf de ASWFM in één woord";
	this.VALIDATION_PATTERN = /^[A-Za-z]{2,20}$/;
	this.VALIDATION_PATTERN_MESSAGE = "zorg dat je woord enkel letters bevat, en niet langer is dan 20 tekens";
	this.GENERIC_ERROR_MESSAGE = "Er ging iets mis...";
	this.CARD_IMAGE_URL = "images/sfm.png";
	this.FONT = "Impact";
	
});

wordCloud.controller('WordCloudController', function($timeout, $interval, $log, wordRepository, strings) {

	this.font = strings.FONT;
	this.angleCount = 7;
	this.angleFrom = -90;
	this.angleTo = 90;
	this.numberOfWords = 300;
	this.oneWordPerLine = false;

	function refreshWordsIfChanged() {
		wordRepository.getWordString(function(wordString) {
			if (this.words !== wordString) {
				this.words = wordString;
				$timeout(refreshWords, 100);
			} else {
				$log.info(strings.WORDS_UNCHANGED_MESSAGE + "\nWords: " + this.words);
			}
		}, $log.error);
	}

	function refreshWords() {
		$log.info(strings.WORDS_CHANGED_MESSAGE + "\nWords: " + this.words);
		$('#go').click();
	}

	/* EXECUTION LOOP */
	wordPoll = $interval(refreshWordsIfChanged, 3000);
});

wordCloud.controller('WordCloudUpdateController', function($log, wordRepository, strings) {
	this.word = strings.WORD_DEFAULT;
	this.legendMessage = strings.LEGEND_MESSAGE_DEFAULT;
	this.validationPattern = strings.VALIDATION_PATTERN;
	this.patternMessage = strings.VALIDATION_PATTERN_MESSAGE;
	this.submitButtonValue = strings.SUBMIT_BUTTON_DEFAULT;
	this.resetButtonValue = strings.RESET_BUTTON_DEFAULT;
	this.imagePath = strings.CARD_IMAGE_URL;
	this.isTextfieldDisabled = false;
	this.isSubmitDisabled = false;
	this.isResetVisible = false;
	this.isWordValid = isWordValid;
	this.reset = reset;

	this.submitWord = function() {
		if (isWordValid()) {
			this.isSubmitDisabled = true;
			this.submitButtonValue = strings.SUBMIT_BUTTON_ADDING;
			wordRepository.adWord(this.word.trim(), success, error);
		} else {
			error(this.patternMessage);
		}
	};
	
	this.enterSubmit = function(event) {
		if (event.keyCode === 13)
			this.submitWord();
	}
	
	function isWordValid() {
		return this.word && this.validationPattern.test(this.word);
	};
	
	function success(response) {
		$log.info(response);
		
		this.submitButtonValue = strings.SUBMIT_BUTTON_SUCCESS;
		this.legendMessage = strings.LEGEND_MESSAGE_SUCCESS;
		this.isTextfieldDisabled = true;
		this.isSubmitDisabled = true;
	}
	
	function error(message) {
		var errorMessage = message ? message : strings.GENERIC_ERROR_MESSAGE;
		$log.error(errorMessage);
		
		this.legendMessage = errorMessage;
		this.isSubmitDisabled = false;
		this.submitButtonValue = strings.SUBMIT_BUTTON_DEFAULT;
	}
	
	function reset() {
		this.submitButtonValue = strings.SUBMIT_BUTTON_DEFAULT;
		this.legendMessage = strings.LEGEND_MESSAGE_DEFAULT;
		this.isTextfieldDisabled = false;
		this.isSubmitDisabled = false;
		this.isResetVisible = false;
		this.word = strings.WORD_DEFAULT;
	}
});