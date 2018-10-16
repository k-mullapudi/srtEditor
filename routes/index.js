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

let text_ = "";
let captions_ = [];

/**
 * Reading initial subtitles from .srt
 */
fs.readFile(process.cwd() + '/routes/subtitles.srt', 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }
    text_ = data;
    captions_ = [{line: 1, startTime: "00:00:00", endTime: "00:00:05", text_: "Lorem Ipsum" }];
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
  res.render('index', { text: text_, captions: captions_});
});

console.log("Reading contents...");
