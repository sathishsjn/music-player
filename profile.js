/* =========================================================
   MUSIC PLAYER — PROFILE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     ELEMENTS
  ========================= */

  const backBtn =
    document.getElementById("backBtn");

  const settingsBtn =
    document.getElementById("settingsBtn");

  const editProfileBtn =
    document.getElementById("editProfileBtn");

  const favoritesBtn =
    document.getElementById("favoritesBtn");

  const recentBtn =
    document.getElementById("recentBtn");

  const settingsMenuBtn =
    document.getElementById("settingsMenuBtn");

  const aboutBtn =
    document.getElementById("aboutBtn");

  const logoutBtn =
    document.getElementById("logoutBtn");

  const homeNav =
    document.getElementById("homeNav");

  const libraryNav =
    document.getElementById("libraryNav");

  const totalSongs =
    document.getElementById("totalSongs");

  const favoriteCount =
    document.getElementById("favoriteCount");

  const recentCount =
    document.getElementById("recentCount");


  /* =========================
     LOAD STATS
  ========================= */

  function loadStats() {

    /* Total songs */

    try {

      const songs =
        JSON.parse(
          localStorage.getItem("allSongs") || "[]"
        );

      if (Array.isArray(songs)) {

        totalSongs.textContent =
          songs.length;

      }

    } catch (error) {

      totalSongs.textContent = "0";

    }


    /* Favorites */

    try {

      const favorites =
        JSON.parse(
          localStorage.getItem("favoriteSongs") || "[]"
        );

      if (Array.isArray(favorites)) {

        favoriteCount.textContent =
          favorites.length;

      }

    } catch (error) {

      favoriteCount.textContent = "0";

    }


    /* Recently played */

    try {

      const recent =
        JSON.parse(
          localStorage.getItem("recentSongs") || "[]"
        );

      if (Array.isArray(recent)) {

        recentCount.textContent =
          recent.length;

      }

    } catch (error) {

      recentCount.textContent = "0";

    }

  }


  /* =========================
     PROFILE DATA
  ========================= */

  function loadProfile() {

    const name =
      localStorage.getItem("profileName");

    const email =
      localStorage.getItem("profileEmail");


    if (name) {

      document.getElementById(
        "profileName"
      ).textContent = name;

    }


    if (email) {

      document.getElementById(
        "profileEmail"
      ).textContent = email;

    }

  }


  /* =========================
     BACK
  ========================= */

  backBtn.addEventListener(
    "click",
    () => {

      if (history.length > 1) {

        history.back();

      } else {

        window.location.href =
          "index.html";

      }

    }
  );


  /* =========================
     SETTINGS
  ========================= */

  function openSettings() {

    alert(
      "Settings page will be available here."
    );

  }

  settingsBtn.addEventListener(
    "click",
    openSettings
  );

  settingsMenuBtn.addEventListener(
    "click",
    openSettings
  );


  /* =========================
     EDIT PROFILE
  ========================= */

  editProfileBtn.addEventListener(
    "click",
    () => {

      const currentName =
        localStorage.getItem("profileName") ||
        "Music Lover";

      const currentEmail =
        localStorage.getItem("profileEmail") ||
        "musicplayer@example.com";


      const name =
        prompt(
          "Enter your name:",
          currentName
        );


      if (name === null) {
        return;
      }


      const email =
        prompt(
          "Enter your email:",
          currentEmail
        );


      if (email === null) {
        return;
      }


      const cleanName =
        name.trim() || "Music Lover";

      const cleanEmail =
        email.trim() ||
        "musicplayer@example.com";


      localStorage.setItem(
        "profileName",
        cleanName
      );

      localStorage.setItem(
        "profileEmail",
        cleanEmail
      );


      loadProfile();

    }
  );


  /* =========================
     FAVORITES
  ========================= */

  favoritesBtn.addEventListener(
    "click",
    () => {

      /*
       * Future:
       * favorites.html
       */

      window.location.href =
        "favorites.html";

    }
  );


  /* =========================
     RECENT
  ========================= */

  recentBtn.addEventListener(
    "click",
    () => {

      /*
       * Future:
       * recent.html
       */

      window.location.href =
        "recent.html";

    }
  );


  /* =========================
     ABOUT
  ========================= */

  aboutBtn.addEventListener(
    "click",
    () => {

      alert(
        "Music Player\n\nYour personal music experience."
      );

    }
  );


  /* =========================
     LOGOUT
  ========================= */

  logoutBtn.addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Are you sure you want to logout?"
        );


      if (!confirmed) {
        return;
      }


      /*
       * IMPORTANT:
       * Do not clear music/player state.
       */

      localStorage.removeItem(
        "profileName"
      );

      localStorage.removeItem(
        "profileEmail"
      );


      window.location.href =
        "index.html";

    }
  );


  /* =========================
     HOME NAV
  ========================= */

  homeNav.addEventListener(
    "click",
    () => {

      window.location.href =
        "index.html";

    }
  );


  /* =========================
     LIBRARY NAV
  ========================= */

  libraryNav.addEventListener(
    "click",
    () => {

      /*
       * Change this later if
       * library.html exists.
       */

      window.location.href =
        "index.html#library";

    }
  );


  /* =========================
     INITIALIZE
  ========================= */

  loadProfile();

  loadStats();

});
