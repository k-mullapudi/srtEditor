let express = require('express');
let jsdom = require('jsdom');
let fs = require('fs');

const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;

global.document = document;

let jQuery = require('jquery')(window);
let router = express.Router();

let text_;
let captions_ = [];

fs.readFile(process.cwd() + '/routes/subtitles.srt', 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }

    let pattern = /(\d+)\n([\d:,]+)\s+-{2}>\s+([\d:,]+)\n([\s\S]*?(?=\n{2}|$))/gm;
    let _regExp;

    let init = function() {
        _regExp = new RegExp(pattern);
    };

    text_ = data; // loading text
    text_ = text_.replace(/\r\n|\r|\n/g, '\n');

    while ((matches = pattern.exec(text_)) != null) {
        captions_.push(getText(matches));
    }

    init();

    console.log("Contents loaded...");
});

let getText = function(caption) {
    return {
        text: caption[4]
    }
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { text: text_,  captions: captions_});
});

router.get('/parse', function(req, res) {
    res.render('index', { text: text_,  captions: captions_, current_caption: "Lo siento."});
});

module.exports = router;

console.log("Reading contents...");

/* https://stackoverflow.com/questions/33145762/parse-a-srt-file-with-jquery-javascript/33147421 */
let PF_SRT = function() {
    let pattern = /(\d+)\n([\d:,]+)\s+-{2}>\s+([\d:,]+)\n([\s\S]*?(?=\n{2}|$))/gm;
    let _regExp;

    let init = function() {
        _regExp = new RegExp(pattern);
    };

    let parse = function(f) {
        if (typeof(f) !== "string") {
            throw "Sorry, Parser accept string only.";
        }

        let result = [];

        if (f == null)
            return _subtitles;

        f = f.replace(/\r\n|\r|\n/g, '\n');

        while ((matches = pattern.exec(f)) != null) {
            result.push(toLineObj(matches));
        }
        return result;
    };

    let toLineObj = function(group) {
        return {
            line: group[1],
            startTime: group[2],
            endTime: group[3],
            text: group[4]
        };
    };

    init();

    return {
        parse: parse
    }
}();

let parseData = function() {
    console.log('Requested parsing');

    try {
        // let text = $("#source").val();
        let result = PF_SRT.parse(text_);
        let wrapper = jQuery("#result tbody");
        wrapper.html('');
        for (let line in result) {
            let obj = result[line];
            wrapper.append("<tr><td>" + obj.line + "</td><td>" + obj.startTime + "</td><td>" + obj.endTime + "</td><td>" + obj.text + "</td></tr>");
        }
    } catch (e) {
        console.error(e);
    }

    console.log('Parsing completed');
};
