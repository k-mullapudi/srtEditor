console.log('Reached here');

$('#doParse').on('click', function() {
    doUpdateCaption()
});

function zeroFill( number, width ) {
    width -= number.toString().length;
    if ( width > 0 )
    {
        return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
    }
    return number + ""; // always return a string
}

let duration_ = -1; // duration of current video
let _current_index = -1; // index of current subtitle
let _current_end_time = -1; // end time of the current caption

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
        return (line > 1 ? '\n' : '') + [
            line,
            `${parseToSrtTime(caption.start_)} --> ${parseToSrtTime(caption.end_)}`,
            caption.text_
        ].join('\n')
    }).join('\n') + '\n'
}

/**
 * Keeps track of all video and subtitle related functions
 */
function videoAndSubtitleTracking() {

    // listening for event fired when initial duration and dimension
    // information is ready
    videojs('video_player').on('loadedmetadata', function() {
        // keeping track of current video's duration
        duration_ = video.duration();
        _current_index = 0;
    });

    // listening for event fired when video is paused
    // loads captions for current time in caption editor container
    videojs('video_player').on('pause', function() {
        console.log("Paused");
        doLoadCurrentCaption();
    });

    // updates current subtitle based on time update
    videojs('video_player').on('timeupdate', function () {
        console.log(this.currentTime());
        let curr_time_ = video.currentTime();
        let curr_caption_ = _captions[_current_index];
        if((curr_time_ < curr_caption_.start_) || (curr_time_ > curr_caption_.end_)) {
            findCurrentCaption(curr_time_);
            updateHighlightedCaption();
        }
    });

    // listening to event fired when video ends
    videojs('video_player').on('ended', function() {
        storeUpdatedCaptions();
    });
}

/*
  Interval to refresh highlighted caption
*/
setInterval(function () {
    let current_time_ = videojs('video_player').currentTime();
    if (current_time_ > (_current_end_time - duration_) || (current_time_ > _current_end_time)) {
        findCurrentCaption(current_time_);
        updateHighlightedCaption();
    }
}, 50);

function findCurrentCaption(time) {
    let timeAccumulator = 0;
    for (let i = 0; i < _captions.length; i++) {
        if (timeAccumulator > time) {
            console.log('Caption updated');
            _current_end_time = _captions[_current_index];
            break;
        }
        _current_index++;
        timeAccumulator += _captions[_current_index].duration_;
    }

    return _captions[_current_index];
}

/**
 *  Updates current caption with new value currently present in
 *  the source field.
 */
function doUpdateCaption() {
    const current_caption_ = _captions[_current_index]; // getting current caption
    current_caption_.text_ = $("#source").val(); // updating caption

    // updating list
    try {
        let wrapper = $("#subtitle_list");
        wrapper.html('');
        for (let line in _captions) {
            let obj = _captions[line];
            wrapper.append(
                "<a class='list-group-item list-group-item-action flex-column align-items-start'>"
                + "<div class='d-flex w-100 justify-content-between'>" +
                + "<small>" + obj.line + "</small>"
                + "</div>"
                + "<p class=\"mb-1\">" + obj.text + "</p>"
                + "<small>" + obj.startTime + " --> " + obj.endTime + "</small>"
                + "</a>"
            );
        }
    } catch(e) {
        console.error(e);
    }
}

/**
 *  Loads current caption in relevant html container for editing
 */
function doLoadCurrentCaption() {
    let curr_caption_ = findCurrentCaption(video.currentTime());
    document.getElementById("original_caption").innerHTML = curr_caption_.text_;
    document.getElementById("original_caption_header").innerHTML = curr_caption_.start_ + " --> " + curr_caption_.end_;
    document.getElementById("edit_caption").innerHTML = "CLICKED!";
}

// TODO: Updated current highlighted caption to currently stored values in the
// TODO: _current_index and _current_end_time fields
function updateHighlightedCaption() {

}

/**
 * Stores updated captions to new file
 */
function storeUpdatedCaptions() {
    // let file = new File(stringifySrt(), "updated_captions.srt", {type: "text/plain;charset=utf-8"});
    // FileSaver.saveAs(file);
}

