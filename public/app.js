// Import Firebase SDK modules
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, getDocs, orderBy, query, doc, serverTimestamp } from "firebase/firestore";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyClKWU8bcPm0SDSgIzPdXWdAhtrN_si1dw",
    authDomain: "aduploadapp.firebaseapp.com",
    databaseURL: "https://aduploadapp-default-rtdb.firebaseio.com",
    projectId: "aduploadapp",
    storageBucket: "aduploadapp.firebasestorage.app",
    messagingSenderId: "996357229679",
    appId: "1:996357229679:web:78b783fb43125cc365519a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentPage = 1;
const adsPerPage = 3;

// Toggle Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}

// Authentication: Sign Up
async function signUp() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Account Created!");
    } catch (error) {
        alert(error.message);
    }
}

// Authentication: Sign In
async function signIn() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Logged In!");
    } catch (error) {
        alert(error.message);
    }
}

// Authentication: Sign Out
async function signOutUser() {
    try {
        await signOut(auth);
        alert("Logged Out!");
    } catch (error) {
        alert(error.message);
    }
}

// Track User Status
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("authContainer").style.display = "none";
        document.getElementById("adSection").style.display = "block";
        document.querySelector("button[onclick='signOutUser()']").style.display = "inline";
        loadAds();
    } else {
        document.getElementById("authContainer").style.display = "block";
        document.getElementById("adSection").style.display = "none";
        document.getElementById("adsList").innerHTML = "";
        document.querySelector("button[onclick='signOutUser()']").style.display = "none";
    }
});

// Submit Ads
document.getElementById("adForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    let user = auth.currentUser;
    
    if (!user) return alert("You must be logged in!");

    let adId = document.getElementById("adId").value;
    let businessLink = document.getElementById("businessLink").value;
    let businessDescription = document.getElementById("businessDescription").value;

    try {
        if (adId) {
            const adRef = doc(db, "ads", adId);
            await updateDoc(adRef, {
                link: businessLink,
                description: businessDescription,
                userId: user.uid
            });
            alert("Ad Updated!");
        } else {
            await addDoc(collection(db, "ads"), {
                link: businessLink,
                description: businessDescription,
                userId: user.uid,
                timestamp: serverTimestamp()
            });
            alert("Ad Submitted!");
        }
        document.getElementById("adForm").reset();
        document.getElementById("adId").value = "";
    } catch (error) {
        alert(error.message);
    }
});

// Load Ads with Pagination
async function loadAds(page = 1) {
    let startAt = (page - 1) * adsPerPage;
    let endAt = startAt + adsPerPage;

    try {
        const adsQuery = query(collection(db, "ads"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(adsQuery);
        let ads = snapshot.docs;
        let paginatedAds = ads.slice(startAt, endAt);

        document.getElementById("adsList").innerHTML = "";
        paginatedAds.forEach(doc => {
            let ad = doc.data();
            let user = auth.currentUser;
            let adElement = document.createElement("div");
            adElement.classList.add("card");
            adElement.innerHTML = `
                <a href="${ad.link}" target="_blank">${ad.link}</a>
                <p>${ad.description}</p>
                ${user && user.uid === ad.userId ? `
                <button class="btn btn-warning" onclick="editAd('${doc.id}', '${ad.link}', '${ad.description}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteAd('${doc.id}')">Delete</button>
                ` : ""}
            `;
            document.getElementById("adsList").appendChild(adElement);
        });

        document.getElementById("pageNumber").innerText = page;
        document.getElementById("prevPage").disabled = page === 1;
        document.getElementById("nextPage").disabled = endAt >= ads.length;
    } catch (error) {
        alert("Error loading ads: " + error.message);
    }
}

// Delete Ad
async function deleteAd(adId) {
    try {
        await deleteDoc(doc(db, "ads", adId));
        alert("Ad Deleted!");
        loadAds();
    } catch (error) {
        alert(error.message);
    }
}

// Edit Ad
function editAd(adId, link, description) {
    document.getElementById("adId").value = adId;
    document.getElementById("businessLink").value = link;
    document.getElementById("businessDescription").value = description;
}

// Pagination Controls
document.getElementById("prevPage").addEventListener("click", () => loadAds(--currentPage));
document.getElementById("nextPage").addEventListener("click", () => loadAds(++currentPage));
