 
// =====================================
// UPLOAD PAGE
// =====================================


// =====================================
// API
// =====================================

const API_URL =
    "http://localhost:5000";


// =====================================
// ELEMENTS
// =====================================

const uploadForm =
    document.getElementById("uploadForm");

const message =
    document.getElementById("message");

const uploadBtn =
    document.getElementById("uploadBtn");

const songInput =
    document.getElementById("song");

const coverInput =
    document.getElementById("cover");

const songName =
    document.getElementById("songName");

const coverName =
    document.getElementById("coverName");

const previewImage =
    document.getElementById("previewImage");

const previewTitle =
    document.getElementById("previewTitle");

const previewArtist =
    document.getElementById("previewArtist");


// =====================================
// SONG FILE SELECT
// =====================================

if (songInput) {

    songInput.addEventListener(
        "change",
        () => {

            const file =
                songInput.files[0];


            if (!file) {

                songName.textContent =
                    "Choose an MP3 file";

                return;

            }


            // Check MP3

            if (
                file.type !==
                    "audio/mpeg" &&
                !file.name
                    .toLowerCase()
                    .endsWith(".mp3")
            ) {

                songName.textContent =
                    "❌ Please select MP3";

                songInput.value = "";

                return;

            }


            songName.textContent =
                file.name;

        }
    );

}


// =====================================
// COVER FILE SELECT
// =====================================

if (coverInput) {

    coverInput.addEventListener(
        "change",
        () => {

            const file =
                coverInput.files[0];


            if (!file) {

                coverName.textContent =
                    "Optional album cover";

                return;

            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                coverName.textContent =
                    "❌ Invalid image";

                coverInput.value = "";

                return;

            }


            coverName.textContent =
                file.name;


            // Image preview

            const reader =
                new FileReader();


            reader.onload =
                (event) => {

                    if (previewImage) {

                        previewImage.src =
                            event.target.result;

                    }

                };


            reader.readAsDataURL(file);

        }
    );

}


// =====================================
// TITLE PREVIEW
// =====================================

const titleInput =
    document.getElementById("title");


if (titleInput) {

    titleInput.addEventListener(
        "input",
        () => {

            previewTitle.textContent =
                titleInput.value ||
                "Your Song";

        }
    );

}


// =====================================
// ARTIST PREVIEW
// =====================================

const artistInput =
    document.getElementById("artist");


if (artistInput) {

    artistInput.addEventListener(
        "input",
        () => {

            previewArtist.textContent =
                artistInput.value ||
                "Artist Name";

        }
    );

}


// =====================================
// MESSAGE
// =====================================

function showMessage(
    text,
    type
) {

    if (!message) return;


    message.textContent =
        text;


    message.className =
        "message " + type;

}


// =====================================
// UPLOAD
// =====================================

if (uploadForm) {

    uploadForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            // =================================
            // GET VALUES
            // =================================

            const title =
                document
                    .getElementById("title")
                    .value
                    .trim();


            const artist =
                document
                    .getElementById("artist")
                    .value
                    .trim();


            const album =
                document
                    .getElementById("album")
                    .value
                    .trim();


            const duration =
                document
                    .getElementById("duration")
                    .value
                    .trim();


            const songFile =
                songInput.files[0];


            const coverFile =
                coverInput.files[0];


            // =================================
            // VALIDATION
            // =================================

            if (!title) {

                showMessage(
                    "❌ Please enter song title",
                    "error"
                );

                return;

            }


            if (!artist) {

                showMessage(
                    "❌ Please enter artist name",
                    "error"
                );

                return;

            }


            if (!songFile) {

                showMessage(
                    "❌ Please select an MP3 song",
                    "error"
                );

                return;

            }


            if (
                !songFile.name
                    .toLowerCase()
                    .endsWith(".mp3")
            ) {

                showMessage(
                    "❌ Only MP3 files are allowed",
                    "error"
                );

                return;

            }


            // =================================
            // FORM DATA
            // =================================

            const formData =
                new FormData();


            formData.append(
                "title",
                title
            );


            formData.append(
                "artist",
                artist
            );


            formData.append(
                "album",
                album
            );


            formData.append(
                "duration",
                duration
            );


            formData.append(
                "song",
                songFile
            );


            if (coverFile) {

                formData.append(
                    "cover",
                    coverFile
                );

            }


            // =================================
            // BUTTON LOADING
            // =================================

            uploadBtn.disabled =
                true;


            uploadBtn.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                <span>
                    Uploading...
                </span>

            `;


            showMessage(
                "⏳ Uploading your song...",
                ""
            );


            // =================================
            // SEND TO BACKEND
            // =================================

            try {

                const response =
                    await fetch(
                        `${API_URL}/api/upload`,
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "Upload response:",
                    data
                );


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Upload failed"
                    );

                }


                // =================================
                // SUCCESS
                // =================================

                showMessage(
                    "✅ Song uploaded successfully! 🎵",
                    "success"
                );


                uploadForm.reset();


                songName.textContent =
                    "Choose an MP3 file";


                coverName.textContent =
                    "Optional album cover";


                previewImage.src =
                    "assets/images/cover8.jpg";


                previewTitle.textContent =
                    "Your Song";


                previewArtist.textContent =
                    "Artist Name";


                // =================================
                // RESET BUTTON
                // =================================

                uploadBtn.disabled =
                    false;


                uploadBtn.innerHTML = `

                    <i class="fa-solid fa-cloud-arrow-up"></i>

                    <span>
                        Upload Song
                    </span>

                `;


                // =================================
                // AUTO REDIRECT
                // =================================

                setTimeout(
                    () => {

                        window.location.href =
                            "index.html";

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "Upload Error:",
                    error
                );


                showMessage(
                    "❌ Upload failed: " +
                    error.message,
                    "error"
                );


                uploadBtn.disabled =
                    false;


                uploadBtn.innerHTML = `

                    <i class="fa-solid fa-cloud-arrow-up"></i>

                    <span>
                        Upload Song
                    </span>

                `;

            }

        }
    );

}

