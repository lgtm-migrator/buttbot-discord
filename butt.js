var config = require('./config');
var _ = require('underscore');
var fs = require('fs');
var winston = require('winston');
var Discord = require( "discord.js" );
var Hypher = require('hypher');
var english = require('hyphenation.en-us');
var validUrl = require('valid-url');
var h = new Hypher(english);
var stopwords = [];

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ level: config.logging_level })
  ]
});

var buttBot = new Discord.Client();

(function init() {
    log("info", "Welcome to ButtBot (Discord Edition)");
    log("info", "Remember! Isaac Buttimov's First Rule of Buttbotics: Don't let buttbot reply to buttbot.");

    // Load all the stop words from file
    stopwords = fs.readFileSync('stopwords').toString().split(/\r\n/);
    log("debug", "Stop words loaded", stopwords);

    // Should we connect to Discord and start buttifying?
    if (config.actuallyButt) {
        buttBot.login( config.bot.username, config.bot.password );
    }

    buttify("test.", function(err, msg) {
        if (!err.failed) {
            log("debug", msg);
        }
    });
})()


buttBot.on( "ready", function() {
    log("info", "Bot connected successfully." );
} );

buttBot.on("message", function(message) {
    // message.content accesses the content of the message as a string.
    // If it is equal to "ping", then the bot should respond with "pong".
    if (config.breakTheFirstRuleOfButtbotics || buttBot.user.id != message.author.id) {
        if (Math.random() > config.chanceToButt) {
            buttify(message.content, function(err, msg) {
                if (!err.failed) {
                    buttBot.sendMessage(message.channel, msg);
                }
            });
        }
    }

});

function buttify(string, callback) {
  var originalString = string;
  var buttdex = [];
  var err = {};

  // Separate the string into an array
  var split = prepareForButtification(string);

  log("debug", "Test Hyphenation", h.hyphenateText(string));

  // Choose words to buttify. Super simple here. Just chance to select random
  // words from the string. Eventually we want to weight them and pick them
  // that way but for now this will work.
  //
  // We also check to make sure this index hasn't been buttified already!
  for (x=0;x < (Math.floor(Math.random()*config.wordsToPossiblyButt) + 1); x++) {
      var rndIndex = Math.floor(Math.random()*split.length);
      var word = split[rndIndex];

      if (!_.contains(buttdex, rndIndex)) {
          split[rndIndex] = subButt(word);
          buttdex.push(rndIndex);
      }

  }
  // Replace words and compare to original string. Determine butting
  // threshold. Did we butt too much? Abandon all hope.

  // Make sure it doesnt match original input string. We had to have
  // buttified at least one thing.
  var final = finishButtification(split);

  if (!didWeActuallyButt(originalString, final)) {
      err = {"failed": true, "msg": "We didn't buttify anything! Abort!"};
  }

  // Output
  return callback(err, final);
}

function subButt(word) {
    var ogWord = word;
    var buttWord = config.meme;

    var punc = word.match(/^([^A-Za-z]*)(.*?)([^A-Za-z]*)$/);

    var pS = punc[1],
        sWord = punc[2],
        pE = punc[3];

    var lcWord = word.toLowerCase();
    // Check if stop word or already a butt or a url
    if (lcWord == config.meme || sWord.toLowerCase() == config.meme || _.contains(stopwords, lcWord) || validUrl.isUri(word)) {
        return ogWord;
    }

    var hyphenated = h.hyphenate(sWord);

    if (hyphenated.length > 1 ) {
        console.log(hyphenated);
        var swapIndex = Math.floor(Math.random()*hyphenated.length);
        hyphenated[swapIndex] = config.meme;

        console.log(hyphenated);
        buttWord = hyphenated.join("");
    }

    return pS + buttWord + pE;
}

function didWeActuallyButt(original, newString) {
    if (original == newString) {
        return false;
    }
    return true;
}

/**
 * Separate string in preparation for butiffication
 *
 * @param  {string} string String input
 * @return {array}        Array. Ready to buttify
 */
function prepareForButtification(string) {
  var original = string;

  var trimmed = string.trim();
  var split = trimmed.split(" ");

  return split;
}

function finishButtification(split) {
    return split.join(" ");
}


function log(level, msg, meta) {
	if (config.logging && config.logging != 0) {

		if (meta) {
			logger.log(level, '[ButtJS] ' + msg, meta);
		} else {
			logger.log(level, '[ButtJS] ' + msg);
		}
	}
}
