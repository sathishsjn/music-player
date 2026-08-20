/* =========================================================
   MUSIC PLAYER SETTINGS
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const backBtn = document.getElementById("backBtn");

const autoplay = document.getElementById("autoplay");

const resumePlayback = document.getElementById("resumePlayback");

const rememberSong = document.getElementById("rememberSong");

const darkMode = document.getElementById("darkMode");

const compactMode = document.getElementById("compactMode");

const clearFavorites = document.getElementById("clearFavorites");

const clearPlayerData = document.getElementById("clearPlayerData");

const toast = document.getElementById("toast");


/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {
  autoplay: true,
  resumePlayback: true,
  rememberSong: true,
  darkMode: true,
  compactMode: false,
};


/* =========================================================
   LOAD SETTINGS
========================================================= */

function getSettings() {

  try {

    const saved = localStorage.getItem("musicPlayerSettings");

    if (!saved) {
      return {
        ...DEFAULT_SETTINGS,
      };
    }

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(saved),
    };

  } catch (error) {

    console.warn(
      "Unable to load settings:",
      error
    );

    return {
      ...DEFAULT_SETTINGS,
    };
  }
}


/* =========================================================
   SAVE SETTINGS
========================================================= */

function saveSettings(settings) {

  try {

    localStorage.setItem(
      "musicPlayerSettings",
      JSON.stringify(settings)
    );

  } catch (error) {

    console.warn(
      "Unable to save settings:",
      error
    );
  }
}


/* =========================================================
   UPDATE UI
========================================================= */

function updateSettingsUI(settings) {

  autoplay.checked = settings.autoplay;

  resumePlayback.checked =
    settings.resumePlayback;

  rememberSong.checked =
    settings.rememberSong;

  darkMode.checked =
    settings.darkMode;

  compactMode.checked =
    settings.compactMode;
}


/* =========================================================
   CHANGE SETTING
========================================================= */

function updateSetting(key, value) {

  const settings = getSettings();

  settings[key] = value;

  saveSettings(settings);

  showToast("Setting updated");

  applySettings(settings);
}


/* =========================================================
   APPLY SETTINGS
========================================================= */

function applySettings(settings) {

  /*
   * Dark mode
   */

  if (settings.darkMode) {

    document.documentElement.removeAttribute(
      "data-theme"
    );

  } else {

    document.documentElement.setAttribute(
      "data-theme",
      "light"
    );
  }


  /*
   * Compact mode
   */

  document.body.classList.toggle(
    "compact-mode",
    settings.compactMode
  );
}


/* =========================================================
   TOGGLE EVENTS
========================================================= */

autoplay.addEventListener(
  "change",
  () => {

    updateSetting(
      "autoplay",
      autoplay.checked
    );

  }
);


resumePlayback.addEventListener(
  "change",
  () => {

    updateSetting(
      "resumePlayback",
      resumePlayback.checked
    );

  }
);


rememberSong.addEventListener(
  "change",
  () => {

    updateSetting(
      "rememberSong",
      rememberSong.checked
    );

  }
);


darkMode.addEventListener(
  "change",
  () => {

    updateSetting(
      "darkMode",
      darkMode.checked
    );

  }
);


compactMode.addEventListener(
  "change",
  () => {

    updateSetting(
      "compactMode",
      compactMode.checked
    );

  }
);


/* =========================================================
   CLEAR FAVORITES
========================================================= */

clearFavorites.addEventListener(
  "click",
  () => {

    const confirmed = confirm(
      "Remove all favorite songs?"
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      "favoriteSongs"
    );

    showToast(
      "Favorites cleared"
    );
  }
);


/* =========================================================
   CLEAR PLAYER DATA
========================================================= */

clearPlayerData.addEventListener(
  "click",
  () => {

    const confirmed = confirm(
      "Clear saved player data?"
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      "currentSongIndex"
    );

    localStorage.removeItem(
      "selectedSong"
    );

    localStorage.removeItem(
      "currentPlaybackTime"
    );

    localStorage.removeItem(
      "playerAutoPlay"
    );

    showToast(
      "Player data cleared"
    );
  }
);


/* =========================================================
   BACK BUTTON
========================================================= */

backBtn.addEventListener(
  "click",
  () => {

    if (window.history.length > 1) {

      window.history.back();

    } else {

      window.location.href =
        "index.html";
    }

  }
);


/* =========================================================
   TOAST
========================================================= */

let toastTimer;

function showToast(message) {

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

    },
    2200
  );
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const settings =
      getSettings();

    updateSettingsUI(settings);

    applySettings(settings);

  }
);
