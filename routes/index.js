var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

console.log('\nBinding index.js...');
console.log('Setting up parser function... ');

let jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

let $ = jQuery = require('jquery')(window);

/* https://stackoverflow.com/questions/33145762/parse-a-srt-file-with-jquery-javascript/33147421 */
let PF_SRT = function() {
    var pattern = /(\d+)\n([\d:,]+)\s+-{2}\>\s+([\d:,]+)\n([\s\S]*?(?=\n{2}|$))/gm;
    var _regExp;

    var init = function() {
        _regExp = new RegExp(pattern);
    };
    var parse = function(f) {
        if (typeof(f) != "string")
            throw "Sorry, Parser accept string only.";

        var result = [];
        if (f == null)
            return _subtitles;

        f = f.replace(/\r\n|\r|\n/g, '\n')

        while ((matches = pattern.exec(f)) != null) {
            result.push(toLineObj(matches));
        }
        return result;
    }
    var toLineObj = function(group) {
        return {
            line: group[1],
            startTime: group[2],
            endTime: group[3],
            text: group[4]
        };
    }
    init();
    return {
        parse: parse
    }
}();

$(function() {
    $("#doParse").click(function() {
        console.log('Requested parsing');
        try {
            var text = $("#source").val();
            var result = PF_SRT.parse(text);
            var wrapper = $("#result tbody");
            wrapper.html('');
            for (var line in result) {
                var obj = result[line];
                wrapper.append("<tr><td>" + obj.line + "</td><td>" + obj.startTime + "</td><td>" + obj.endTime + "</td><td>" + obj.text + "</td></tr>");
            }
        } catch (e) {
            alert(e);
        }
    });
});