var songs = [
    {
        title: "Tell Me The Truth",
        artist: "Denys Brodovskyi",
        url: "assets/audio/tell-me-the-truth-260010.mp3",
        art: "assets/images/tell-me-the-truth.png",
        creditUrl: "https://pixabay.com/users/denys_brodovskyi-26932554/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=260010"
    },
    {
        title: "Lost in Dreams (abstract chill downtempo cinematic future beats)",
        artist: "Alehandro Vodnik",
        url: "assets/audio/lost-in-dreams-abstract-chill-downtempo-cinematic-future-beats-270241.mp3",
        art: "assets/images/lost-in-dreams.jpg",
        creditUrl: "https://pixabay.com/users/kulakovka-47183261/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=270241"
    },
    {
        title: "Spinning Head",
        artist: "Gvidon Levkin/Bardyuzha",
        url: "assets/audio/spinning-head-271171.mp3",
        art: "assets/images/spinning-head.png",
        creditUrl: "https://pixabay.com/users/gvidon-25326719/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=271171"
    },
    {
        title: "Alone",
        artist: "Bohdan Kuzmin",
        url: "assets/audio/alone-296348.mp3",
        art: "assets/images/alone.jpg"
    },
    {
        title: "Kugelsicher by TremoxBeatz",
        artist: "TremoxBeatz",
        url: "assets/audio/kugelsicher-by-tremoxbeatz-302838.mp3",
        art: "assets/images/kugelsicher-by-tremoxbeatz.jpg"
    },
    {
        title: "Gardens - Stylish Chill",
        artist: "penguinmusic",
        url: "assets/audio/kugelsicher-by-tremoxbeatz-302838.mp3",
        art: "assets/images/penguinmusic.png"
    }
];

var audioContext = new (window.AudioContext || window.webkitAudioContext)();
var analyzer = audioContext.createAnalyser();
var audioElement = new Audio();
var source = null;
var isPlaying = false;
var currentSongIndex = 0;
var chart = null, visualizerChartContainer = null;

analyzer.fftSize = 256;
var bufferLength = analyzer.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);

var playPauseBtn = document.getElementById('playPauseBtn');
var progressBar = document.getElementById('progressBar');
var progress = document.getElementById('progress');
var currentTimeEl = document.getElementById('currentTime');
var durationEl = document.getElementById('duration');
var volumeSlider = document.getElementById('volumeSlider');
var muteBtn = document.getElementById('muteBtn');
var playlistEl = document.getElementById('playlist');
var songTitleEl = document.getElementById('songTitle');
var songArtistEl = document.getElementById('songArtist');
var songArtistCreditEl = document.getElementById('songArtistCredit');

function init() {
    setupPlaylist();
    initializeChart();
    setupAudio(songs[0].url);
    updateSongInfo(0);
    setupEventListeners();
}

function setupPlaylist() {
    playlistEl.innerHTML = songs.map((song, index) => `
        <div class="song-item ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="${song.art}" alt="${song.title}" class="album-art">
            <div>
                <h4>${song.title}</h4>
                <p>${song.artist}</p>
            </div>
        </div>
    `).join('');
}

function initializeChart() {
    chart = new CanvasJS.Chart("chartContainer", {
        backgroundColor: "transparent",
        interactivityEnabled: false,    
        axisX: {
            gridThickness: 0,
            lineThickness: 0,
            tickLength: 0,
            labelFormatter: () => ""
        },
        axisY: {
            gridThickness: 0,
            lineThickness: 0,
            tickLength: 0,
            labelFormatter: () => ""
        },
        data: [{
            type: "rangeArea",
            color: "#404040",
            fillOpacity: 1,
            dataPoints: []
        }, {
            type: "rangeArea",
            color: getPrimaryColor(),
            fillOpacity: 1,
            dataPoints: []
        }]
    });
    chart.render();

    visualizerChart = new CanvasJS.Chart("visualizerChartContainer", {
        backgroundColor: "transparent",
        interactivityEnabled: false,
        axisX: {
            gridThickness: 0,
            lineThickness: 0,
            tickLength: 0,
            labelFormatter: () => "",
        },
        axisY: {
            gridThickness: 0,
            lineThickness: 0,
            tickLength: 0,
            labelFormatter: () => "",

        },
        data:[{
            color: getPrimaryColor(),
            dataPoints: []
        }]
    });
    visualizerChart.render();
}

function getPrimaryColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--primary') || "#2ecc71";
}

function updateVisualization(url) {
    var margin = 10,
    chunkSize = 500,
    height = chart.get("height"),
    scaleFactor = (height - margin * 2) / 2;

    fetch(url)
        .then(function (response) {
            return response.arrayBuffer();
        })
        .then(function (arrayBuffer) {
            
            audioContext.decodeAudioData(arrayBuffer, function (buffer) {
                chart.options.data[0].dataPoints = [];
                float32Array = buffer.getChannelData(0);
                var array = [],
                    i = 0,
                    length = float32Array.length;

                while (i < length) {
                    array.push(
                        float32Array.slice(i, (i += chunkSize)).reduce(function (total, value) {
                            return Math.max(total, Math.abs(value));
                        })
                    );
                }
                var min = Infinity, max = -Infinity;
                for (var index in array) {
                    if(height / 2 - array[index] * scaleFactor < min) min = height / 2 - array[index] * scaleFactor;
                    if(height / 2 + array[index] * scaleFactor > max) max = height / 2 + array[index] * scaleFactor;
                    chart.options.data[0].dataPoints.push({
                        x: margin + Number(index),
                        y: [
                            height / 2 - array[index] * scaleFactor,
                            height / 2 + array[index] * scaleFactor
                        ]
                    });
                }

                chart.axisY[0].set("minimum", min, false);
                chart.axisY[0].set("maximum", max);
            });
            animate();
        })
        .catch(function (error) {
            console.error('Error:', error);
        });

}

function animate() {
    var bufferLength = analyzer.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    analyzer.getByteFrequencyData(dataArray);

    var chartData = [];
    for (let i = 0; i < 60; i++) {
        chartData.push({ y: dataArray[i], label: i.toString() });
    }

    visualizerChart.options.data[0].dataPoints = chartData;
    visualizerChart.render();
    animationId = requestAnimationFrame(animate);
}

function setupAudio(url) {
    if (!source) {
        source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyzer);
        analyzer.connect(audioContext.destination);
    }

    audioElement.src = url;

    amplitudeArray = new Uint8Array(analyzer.frequencyBinCount);
    updateVisualization(url);
}

function setupEventListeners() {
    playPauseBtn.addEventListener('click', async () => {
        if (audioContext.state === 'suspended') await audioContext.resume();

        if (isPlaying) {
            audioElement.pause();
            isPlaying = !isPlaying;
        } else {
            audioElement.play();
            isPlaying = !isPlaying;
        }
        playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
    });

    progressBar.addEventListener('click', (e) => {
        var rect = progressBar.getBoundingClientRect();
        var pos = (e.clientX - rect.left) / rect.width;
        audioElement.currentTime = pos * audioElement.duration;
    });

    audioElement.addEventListener('timeupdate', () => {
        var progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
        progress.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(audioElement.currentTime);
        
        var dps = chart.data[0].dataPoints.slice(0, Math.ceil(progressPercent / 100 * chart.data[0].dataPoints.length));
        chart.data[1].set("dataPoints", dps);
    });

    volumeSlider.addEventListener('input', (e) => {
        audioElement.volume = e.target.value;
        muteBtn.textContent = e.target.value == 0 ? '🔇' : '🔊';
    });

    muteBtn.addEventListener('click', () => {
        audioElement.muted = !audioElement.muted;
        muteBtn.textContent = audioElement.muted ? '🔇' : '🔊';
        volumeSlider.value = audioElement.muted ? 0 : audioElement.volume;
    });

    audioElement.addEventListener('ended', () => {
        toggleSong(true);
    });
    prevBtn.addEventListener('click', () => {
        toggleSong(false);
    });
    nextBtn.addEventListener('click', () => {
        toggleSong(true);
    });
    audioElement.addEventListener('loadedmetadata', function () {
        durationEl.innerText = formatDuration(audioElement.duration);
    });

    playlistEl.addEventListener('click', (e) => {
        var songItem = e.target.closest('.song-item');
        if (songItem) {
            currentSongIndex = parseInt(songItem.dataset.index);
            updateSongInfo(currentSongIndex);
            setupAudio(songs[currentSongIndex].url);
        
            audioElement.play();
            playPauseBtn.textContent = '⏸';
            isPlaying = true;

            document.querySelectorAll('.song-item').forEach(item =>
                item.classList.remove('active'));

            songItem.classList.add('active');
        }
    });
}

function formatTime(seconds) {
    var minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateSongInfo(index) {
    songTitleEl.textContent = songs[index].title;
    songArtistEl.textContent = songs[index].artist;
    songArtistCreditEl.href = songs[index].creditUrl;
    document.querySelector('.current-song .album-art').src = songs[index].art;
}

function toggleSong(next) {
    currentSongIndex = (next ? (currentSongIndex + 1) : ((currentSongIndex - 1 + songs.length))) % songs.length;
    updateSongInfo(currentSongIndex);
    setupAudio(songs[currentSongIndex].url);
    audioElement.play();
    isPlaying = true;
    playPauseBtn.textContent = '⏸';

    document.querySelectorAll('.song-item').forEach((item, index) => {
        item.classList.remove('active')
    });
    document.querySelectorAll('.song-item')[currentSongIndex].classList.add('active');
}

function formatDuration(durationInSeconds) {
    var hours = Math.floor(durationInSeconds / 3600);
    var minutes = Math.floor((durationInSeconds % 3600) / 60);
    var seconds = Math.floor(durationInSeconds % 60);

    var formattedHours = hours > 0 ? (hours < 10 ? '0' + hours : hours) + ':' : '';
    var formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    var formattedSeconds = seconds < 10 ? '0' + seconds : seconds;

    return formattedHours + formattedMinutes + ':' + formattedSeconds;
}

document.getElementById("visualizerType").addEventListener("change", function (e) {
    var selectedValue = e.target.value;
    if (visualizerChart && visualizerChart.data && visualizerChart.data[0]) {
        visualizerChart.data[0].set("type", selectedValue);
    }
});

init();