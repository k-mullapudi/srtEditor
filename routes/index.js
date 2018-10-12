let express = require('express');
let jsdom = require('jsdom');
let fs = require('fs');

const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
let jQuery = require('jquery')(window);
let router = express.Router();

global.document = document;

module.exports = router;

let captions_ = [];

/**
 * Reading initial subtitles from .srt
 */
fs.readFile(process.cwd() + '/routes/subtitles.srt', 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }
    captions_ = SRT_PARSER.parse(data);
    console.log("Contents loaded...");
});

/**
 * Helper function to break down each entry in .srt file
 * @param caption
 * @returns {{line: *, startTime: *, endTime: *, text: *}}
 */
let getText = function(caption) {
    return {
        line: caption[1],
        startTime: caption[2],
        endTime: caption[3],
        text: caption[4]
    }
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { captions: captions_});
});

console.log("Reading contents...");

let SRT_PARSER = function() {
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
            return result;

        f = f.replace(/\r\n|\r|\n/g, '\n');

        while ((captions = pattern.exec(f)) != null) {
            result.push(getText(captions));
        }

        return result;
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
        let result = SRT_PARSER.parse(text_);
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
