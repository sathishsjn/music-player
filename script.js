const songs = [
  {
    title: "Melody Song",
    artist: "Anirudh Ravichandiran",
    src: "songs/song1.mp3",
    cover: "images/cover1.jpg",
  },
  {
    title: "Therukural",
    artist: "Arivu",
    src: "songs/song2.mp3",
    cover: "images/cover2.jpg",
  },
];

let currentSong = 0;

const audio = document.getElementById("audio");
const cover = document.getElementById("cover");
const title = document.getElementById("title");
const artist = document.getElementById("artist");
const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const progress = document.getElementById("progress");
const playlist = document.getElementById("playlist");
const current = document.getElementById("current");
const duration = document.getElementById("duration");

function loadSong(index) {
  audio.src = songs[index].src;
  cover.src = songs[index].cover;
  title.textContent = songs[index].title;
  artist.textContent = songs[index].artist;
}

loadSong(currentSong);

let isPlaying = false;

function playSong() {
  audio.play();
  isPlaying = true;

  playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
}

function pauseSong() {
  audio.pause();
  isPlaying = false;

  playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
}

playBtn.addEventListener("click", () => {
  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
});

function nextSong() {
  currentSong++;

  if (currentSong >= songs.length) {
    currentSong = 0;
  }

  loadSong(currentSong);
  playSong();
}

function prevSong() {
  currentSong--;

  if (currentSong < 0) {
    currentSong = songs.length - 1;
  }

  loadSong(currentSong);
  playSong();
}

nextBtn.addEventListener("click", nextSong);

prevBtn.addEventListener("click", prevSong);

audio.addEventListener("timeupdate", () => {
  progress.max = audio.duration;

  progress.value = audio.currentTime;

  current.textContent = formatTime(audio.currentTime);

  duration.textContent = formatTime(audio.duration);
});

function formatTime(time) {
  if (isNaN(time)) return "0:00";

  let minutes = Math.floor(time / 60);

  let seconds = Math.floor(time % 60);

  if (seconds < 10) {
    seconds = "0" + seconds;
  }

  return minutes + ":" + seconds;
}

progress.addEventListener("input", () => {
  audio.currentTime = progress.value;
});

function createPlaylist() {
  playlist.innerHTML = "";

  songs.forEach((song, index) => {
    const li = document.createElement("li");

    li.textContent = song.title;

    li.addEventListener("click", () => {
      currentSong = index;

      loadSong(currentSong);

      playSong();
    });

    playlist.appendChild(li);
  });
}

createPlaylist();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => {
        console.log("Offline mode enabled");
      })
      .catch((err) => {
        console.log(err);
      });
  });
}

audio.addEventListener("ended", () => {
  currentSong++;

  if (currentSong >= songs.length) {
    currentSong = 0;
  }

  loadSong(currentSong);
  playSong();
});
