let data = "1\n" +
"00:00:01,000 --> 00:00:04,000\n" +
"Descargados de www.AllSubs.org\n" +
"\n" +
"2\n" +
"00:00:49,581 --> 00:00:52,049\n" +
"Bueno, tienes que escapar, tengo que ir a jugar\n" +
"\n" +
"3\n" +
"00:00:52,084 --> 00:00:55,178\n" +
"Tengo que encontrar un día que está lleno de nada más que sol\n" +
"\n" +
"4\n" +
"00:00:55,220 --> 00:00:57,552\n" +
"Crucero por la calle, moviéndose al compás\n" +
"\n" +
"5\n" +
"00:00:57,589 --> 00:01:00,683\n" +
"Todos los que conoces está teniendo nada más que diversión\n" +
"\n" +
"6\n" +
"00:01:00,726 --> 00:01:03,251\n" +
"Deja todo detras de ti\n" +
"\n" +
"7\n" +
"00:01:03,295 --> 00:01:06,128\n" +
"Siente esas palmeras soplan\n" +
"\n" +
"8\n" +
"00:01:06,165 --> 00:01:09,157\n" +
"\n" +
"\n" +
"9\n" +
"00:01:09,201 --> 00:01:11,829\n" +
"Están fuera de palear la nieve\n" +
"\n" +
"10\n" +
"00:01:11,870 --> 00:01:14,998\n" +
"El tiempo para moverse, pero no seas lento\n" +
"\n" +
"11\n" +
"00:01:15,040 --> 00:01:17,941\n" +
"En sus marcas, prepárate para ir\n";

console.log('Reached here');

function zeroFill( number, width ) {
    width -= number.toString().length;
    if ( width > 0 )
    {
        return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
    }
    return number + ""; // always return a string
}

$(document).ready(function () {
    _captions = parseCaptions(data);
    videoAndSubtitleTracking();
    bindListEventListeners();
    doLoadCaption();
});

let duration_ = 0; // duration of current video
let _current_index = 0; // index of current subtitle
let _current_end_time = 0; // end time of the current caption

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
        let new_caption = _splitCaption(caption);

        if(_captions.length !== 0) {
            console.log(_captions.length);
            let previous_end = _captions[_captions.length - 1].end_;

            if(previous_end !== new_caption.start_) {
                let duration = parseFromSrtTime(new_caption.start_) - parseFromSrtTime(previous_end);
                _captions.push({line_: '', start_: _captions[_captions.length - 1].end_,
                    end_: new_caption.start_, duration_: duration})
            }
        }

        _captions.push(_splitCaption(caption))
    }

    console.log(_captions);

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

    videojs('video_player').on('ready', function() {
        updateHighlightedCaption();
    });

    // listening for event fired when initial duration and dimension
    // information is ready
    videojs('video_player').on('loadedmetadata', function() {
        // keeping track of current video's duration
        duration_ = videojs('video_player').duration();
        _current_index = 0;
        updateHighlightedCaption();
    });

    // listening for event fired when video is paused
    // loads captions for current time in caption editor container
    videojs('video_player').on('pause', function() {
        console.log("Paused");
        doLoadCurrentCaption();
    });

    // updates current subtitle based on time update
    videojs('video_player').on('timeupdate', function () {
        findCurrentCaption(this.currentTime());
    });

    // listening to event fired when video ends
    videojs('video_player').on('ended', function() {
        storeUpdatedCaptions();
    });
}

/*
  Interval to refresh highlighted caption
*/
// setInterval(function () {
//     let current_time_ = videojs('video_player').currentTime();
//     findCurrentCaption(current_time_);
//     if ((current_time_ > _current_end_time)) {
//         updateHighlightedCaption();
//         doLoadCurrentCaption();
//     }
// }, 50);

function findCurrentCaption(time) {
    let timeAccumulator = 0;

    if (isNaN(timeAccumulator) || isNaN(time)) { return null; }


    for (let i = 0; i < _captions.length; i++) {
        console.log(time + " " + parseFromSrtTime(_captions[i].start_) + " " + parseFromSrtTime(_captions[i].end_)) ;
        if ((time * 1000) > parseFromSrtTime(_captions[i].start_) &&
            (time * 1000) < parseFromSrtTime(_captions[i].end_)) {
            console.log('Caption updated');
            _current_index = i;
            doLoadCaption();
            break;
        }
    }

    console.log(_current_index);

    return _captions[_current_index];
}

/**
 *  Updates current caption with new value currently present in
 *  the source field.
 */
function doUpdateCaption() {
    console.log('Reached here');

    _captions[_current_index]['text_'] = document.getElementById('edit_caption').value;

    // updating list
    try {
        let wrapper = document.getElementById("subtitle_list");
        wrapper.innerHTML = '';
        for (let line in _captions) {
            let obj = _captions[line];
            console.log(obj);
            let new_item = document.createElement("a");
            new_item.setAttribute("class", "list-group-item");
            let text = document.createTextNode(obj.text_);
            new_item.appendChild(text);
            wrapper.appendChild(new_item);
        }
    } catch(e) {
        console.error(e);
    }
}

/**
 *  Loads current caption in relevant html container for editing
 */
function doLoadCurrentCaption() {
    let curr_caption_ = findCurrentCaption(videojs('video_player').duration());

    if(curr_caption_ !== null) {
        document.getElementById("original_caption").innerHTML = curr_caption_.text_;
        document.getElementById("original_caption_header").innerHTML = curr_caption_.start_ + " --> " + curr_caption_.end_;
        document.getElementById("edit_caption").innerHTML = "CLICKED!";
    }
}


function doLoadCaption() {
    let curr_caption_ = _captions[_current_index];

    if(curr_caption_ !== null) {
        document.getElementById("original_caption").innerHTML = curr_caption_.text_;
        document.getElementById("original_caption_header").innerHTML = curr_caption_.start_ + " --> " + curr_caption_.end_;
        document.getElementById("edit_caption").setAttribute("value", curr_caption_.text_);
    }
}


function bindListEventListeners() {
    let c_l_items = document.getElementsByClassName("list-group-item");

    // binding list items to listeners
    for(let i = 0; i < c_l_items.length; i++) {
        c_l_items[i].addEventListener("click",  function() {
            _current_index = i; // updating current index
            _current_end_time = _captions[_current_index].end_; // updating current end time

            doLoadCaption();

            console.log(_captions[_current_index]);
        })
    }

    document.getElementById('doParse').addEventListener('click', function() {
        doUpdateCaption()
    });
}


// TODO: Updated current highlighted caption to currently stored values in the
// TODO: _current_index and _current_end_time fields
function updateHighlightedCaption() {
    doLoadCurrentCaption();
}

/**
 * Stores updated captions to new file
 */
function storeUpdatedCaptions() {
    // let file = new File(stringifySrt(), "updated_captions.srt", {type: "text/plain;charset=utf-8"});
    // FileSaver.saveAs(file);
}

