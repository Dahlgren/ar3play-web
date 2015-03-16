if (!window.dataSources) {
    alert('missing config.js with dataSources definition!');
}
var dataUrl = localStorage.getItem('api-url') || _.map(dataSources)[0] || 'http://' + (document.location.host || 'localhost') + ':12302';

function getQuery() {
    var query = {};
    document.location.search.substr(1).split('&').forEach(function (part) {
        var bits = part.split('=');
        var name = decodeURIComponent(bits[0]), value;
        if (bits[1]) {
            value = decodeURIComponent(bits[1]);
        }
        query[name] = value;
    });
    return query;
}


$(function () {

    var
        world = getQuery().world || 'stratis',
        missions = {},
        dateFormatFunctions = {
            iso8601: function (date) {
                return date.toISOString();
            },
            locale: function (date) {
                return date.toLocaleString();
            }
        },
        dateFormat = localStorage.getItem('date-format') || 'iso8601',
        $time = $('#time'),
        log = function (message) {
            $('#messages').html(message).fadeTo(1000, 0.1);
        },
        currentServerMission = '';

    function timeFormat(ts) {
        return dateFormatFunctions[dateFormat](new Date(ts * 1000));
    }

    function getMission(instanceId) {
        var mission = missions[instanceId];
        if (mission) {
            if (mission.is_streamable || mission.endtime) {
                runner.setMission(mission);
                $('#playing-mission-starttime').text(timeFormat(mission.starttime));
                $('#playing-mission-title').text(missions[instanceId].name);
            } else {
                log(instanceId + ' nicht streambar');
            }
        } else {
            log(instanceId + ' nicht gefunden');
        }
    }

    map.init(world);


    $('#toggle-names').click((function () {
        var isOpen = false;
        return function () {
            map[isOpen ? 'hideMarkers' : 'showMarkers']();
            isOpen = !isOpen;
        };
    }()));

    $.get(dataUrl + '/currentMission', function (currentMission) {
        currentServerMission = currentMission;

        $.get(dataUrl + '/missions', function (data) {
            $('#mission-select').html('<option value="">---</option>\n' + data.map(function (mission) {
                missions[mission.instanceId] = mission;
                return '<option value="' + mission.instanceId + '" ' + (mission.worldname.toLowerCase() !== world ? 'disabled' : '')  + '>' +
                    timeFormat(mission.starttime) + ' : ' + mission.name +
                        ' (' + mission.worldname + ')' +
                    (currentServerMission === mission ? ' LÄUFT' : '') +
                    '</option>';
            }).join('\n'))
        });

    });

    $('#mission-select').change(function () {
        getMission(this.value);
    });

    function sliderChange() {
        var sliderValue = this.value;
        var multiplicator = Math.min(100, Math.pow(sliderValue, 1.5));
        $('#play-multiplicator').text(multiplicator.toFixed(1));
        runner.setSpeed(multiplicator);
    }

    $('#mission-play-speed').change(sliderChange).on('input', sliderChange);

    $('#mission-restart').click(runner.restart);

    runner.onTimechange(function (time) {
        var date = new Date(time * 1000);

        $time.text(date.toISOString());
    });

    runner.onMissionEnd(function () {
        runner.setSpeed(0);
        $('#play-multiplicator').text(0);
        $('#mission-play-speed')[0].value = 0;
        $time.text($time.text() + ' ENDE');
    });

    $('#select-date-format').find('select').change(function () {
        localStorage.setItem('date-format', this.value);
        dateFormat = this.value;
    })[0].value = dateFormat;

    $('#world-select').html(_.map(worlds, function (world, key) {
        return '<option value="' + key + '">' + world.name + '</option>';
    }).join('\n')).change(function () {
        document.location.href = document.location.href.split('?')[0] + '?world=' + this.value;
    })[0].value = world;



    $('#select-api-url').find('select').html(_.map(dataSources, function (val, name) {
        return '<option value="' + val + '">' + name + '</option>';
    }).join('\n')).change(function () {
        localStorage.setItem('api-url', this.value);
        document.location.reload();
    })[0].value = dataUrl;


});
