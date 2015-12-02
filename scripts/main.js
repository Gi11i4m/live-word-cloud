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

wordCloud.constant("strings", {
	WORDS_UNCHANGED_MESSAGE: "Words unchanged"
});

wordCloud.controller('WordCloudController', function($timeout, $interval, $log, wordRepository, strings) {

	var WORDS_CHANGED_MESSAGE =  "Refreshing words...";
	
	this.font = "Impact";
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
		$log.info(WORDS_CHANGED_MESSAGE + "\nWords: " + this.words);
		$('#go').click();
	}

	/* EXECUTION LOOP */
	var wordPoll = $interval(refreshWordsIfChanged, 3000);
});

wordCloud.controller('WordCloudUpdateController', function($log, wordRepository) {

	var WORD_DEFAULT = "";
	var SUBMIT_BUTTON_DEFAULT = "Geef feedback";
	var SUBMIT_BUTTON_ADDING = "Toevoegen...";
	var SUBMIT_BUTTON_SUCCESS = "Bedankt!";
	var RESET_BUTTON_DEFAULT = "Reset";
	var LEGEND_MESSAGE_SUCCESS = "Bedankt voor uw feedback!";
	var LEGEND_MESSAGE_DEFAULT = "Omschrijf de ASWFM in één woord";
	var VALIDATION_PATTERN = /^[A-Za-z]{2,20}$/;
	var VALIDATION_PATTERN_MESSAGE = "zorg dat je woord enkel letters bevat, en niet langer is dan 20 tekens";
	var GENERIC_ERROR_MESSAGE = "Er ging iets mis...";
	var CARD_IMAGE_URL = "images/sfm.png";

	this.word = WORD_DEFAULT;
	this.legendMessage = LEGEND_MESSAGE_DEFAULT;
	this.validationPattern = VALIDATION_PATTERN;
	this.patternMessage = VALIDATION_PATTERN_MESSAGE;
	this.submitButtonValue = SUBMIT_BUTTON_DEFAULT;
	this.resetButtonValue = RESET_BUTTON_DEFAULT;
	this.imagePath = CARD_IMAGE_URL;
	this.isTextfieldDisabled = false;
	this.isSubmitDisabled = false;
	this.isResetVisible = false;
	this.isWordValid = isWordValid;
	this.reset = reset;

	this.submitWord = function() {
		if (isWordValid()) {
			this.isSubmitDisabled = true;
			this.submitButtonValue = SUBMIT_BUTTON_ADDING;
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
		
		this.submitButtonValue = SUBMIT_BUTTON_SUCCESS;
		this.legendMessage = LEGEND_MESSAGE_SUCCESS;
		this.isTextfieldDisabled = true;
		this.isSubmitDisabled = true;
	}
	
	function error(message) {
		var errorMessage = message ? message : GENERIC_ERROR_MESSAGE;
		$log.error(errorMessage);
		
		this.legendMessage = errorMessage;
		this.isSubmitDisabled = false;
		this.submitButtonValue = SUBMIT_BUTTON_DEFAULT;
	}
	
	function reset() {
		this.submitButtonValue = SUBMIT_BUTTON_DEFAULT;
		this.legendMessage = LEGEND_MESSAGE_DEFAULT;
		this.isTextfieldDisabled = false;
		this.isSubmitDisabled = false;
		this.isResetVisible = false;
		this.word = WORD_DEFAULT;
	}
});