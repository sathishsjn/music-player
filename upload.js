import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import { getStorage, ref, uploadBytes, getDownloadURL }
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";



const firebaseConfig = {

PASTE_YOUR_CONFIG_HERE

};



const app = initializeApp(firebaseConfig);


const storage = getStorage(app);



const form =
document.getElementById("uploadForm");


const status =
document.getElementById("status");



form.addEventListener("submit", async(e)=>{


e.preventDefault();


const songFile =
document.getElementById("songFile").files[0];


const coverFile =
document.getElementById("coverImage").files[0];



try{


status.innerHTML="Uploading...";



const songRef =
ref(storage,"songs/"+songFile.name);



await uploadBytes(songRef,songFile);



const songURL =
await getDownloadURL(songRef);



console.log("Song URL:",songURL);



status.innerHTML=
"Song Uploaded Successfully ✅";



}

catch(error){

console.log(error);

status.innerHTML=
"Upload Failed ❌";

}


});
