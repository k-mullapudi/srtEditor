import zeroFill from 'zero-fill'

let video = videojs('video_player');
let duration_ = -1; // duration of current video
let _current_index = -1; // index of current subtitle

let pattern = /(\d+)\n([\d:,]+)\s+-{2}>\s+([\d:,]+)\n([\s\S]*?(?=\n{2}|$))/gm;
let _regExp = new RegExp(pattern);

// captions for the current video
let _captions = [];

function loadVideo(url) {
    video.src(url); // loading video from url
}

/*
  Splits given data and stores them in _captions
 */
function parseCaptions(data) {
    if(typeof(data) !== "string") throw "Parser only accepts strings.";
    if(data == null) return _captions;

    data = data.replace(/\r\n|\r|\n/g, '\n');

    let caption;

    while((caption = pattern.exec(data)) !== null) {
        _captions.push(_splitCaption(caption))
    }

    return _captions;
}

// credit: https://github.com/gsantiago/subtitle.js/blob/master/lib/toSrtTime.js
function parseToSrtTime(time) {
    if (isNaN(time)) { return time; }

    const date = new Date(0, 0, 0, 0, 0, 0, time);
    const hours = zeroFill(2, date.getHours());
    const minutes = zeroFill(2, date.getMinutes());
    const seconds = zeroFill(2, date.getSeconds());
    const ms = time - ((hours * 3600000) + (minutes * 60000) + (seconds * 1000));

    return `${hours}:${minutes}:${seconds},${zeroFill(3, ms)}`
}

/**
 * Returns srt time parsed to readable time
 */
function parseFromSrtTime(time) {
    const match = time.match(/^(?:(\d{2,}):)?(\d{2}):(\d{2})[,.](\d{3})$/);

    if (!match) {
        throw new Error('Invalid SRT or VTT time format: "' + timestamp + '"')
    }

    const hours = match[1] ? parseInt(match[1], 10) * 3600000 : 0;
    const minutes = parseInt(match[2], 10) * 60000;
    const seconds = parseInt(match[3], 10) * 1000;
    const milliseconds = parseInt(match[4], 10);

    return hours + minutes + seconds + milliseconds;
}

// converting elements in captions array back to srt format
function stringifySrt () {
    return _captions.map((caption, line) => {
        return (line > 0 ? '\n' : '') + [
            line,
            `${parseToSrtTime(caption.start)} --> ${parseToSrtTime(caption.end)}`,
            caption.text
        ].join('\n')
    }).join('\n') + '\n'
}

/*
  Splits each caption into its component line_, start_, end_ and text_.
 */
function _splitCaption(caption) {
    let duration = parseFromSrtTime(caption[3]) - parseFromSrtTime(caption[2]);
    return {
        line_: caption[1],
        start_: caption[2],
        end_: caption[3],
        text_: caption[4],
        duration_: duration
    }
}

/**
 * Keeps track of all video and subtitle related functions
 */
function videoAndSubtitleTracking() {

    video.on('ready', function() {
        // keeping track of current video's duration
        duration_ = video.duration();
        _current_index = 0;
    });

    video.on('pause', function() {
        console.log("Paused");
    });

    // updates current subtitle based on time update
    video.on('timeupdate', function () {
        console.log(this.currentTime());
    });
}

function doUpdateCaption()


function updateHighlightedCaption(time) {
    if(time > _captions[_current_index].start_) {

    }
}

