// ===========================================================
// FIND A MAGAZINE LIBRARY — map.js
// ===========================================================
//
// IMPORTANT — read this before wiring up the real submission flow:
//
// This file makes the map interactive and makes the submission form
// USABLE, but there is no backend here. Submitted entries are saved
// to this browser's localStorage only — nobody else (including you)
// will see them, and no email gets sent. It's here so the front end
// works end-to-end and can be plugged into a real backend later.
//
// To make submissions actually reach you, you need a small server
// (or serverless function) that:
//   1. Receives the form data + photos (e.g. a POST endpoint)
//   2. Stores it somewhere shared (a database, not localStorage)
//   3. Sends you an email notification (via SendGrid / Postmark / Resend)
//   4. Listens for inbound replies to that email (inbound email parsing —
//      SendGrid Inbound Parse or Postmark Inbound Webhooks are common
//      choices) and flips the entry to "approved" when it sees "YES"
//   5. Serves the list of *approved* libraries back to this page,
//      instead of the hardcoded SAMPLE_LIBRARIES array below
//
// Swap out `loadLibraries()` and `saveSubmission()` below once that
// backend exists — everything else on this page will keep working.

// ---------- sample data (replace with real submissions / API call) ----------
const SAMPLE_LIBRARIES = [
  {
    id: "sample-1",
    name: "New Haven Magazine Library",
    address: "Bradley St & State St, New Haven, CT",
    lat: 41.31175613716038,
    lng: -72.91657512487174,
    description: "The Very First Free Magazine - Located adjacent to the Bradley St Bike Co-op.",
    photos: ["assets/images/libraries/sample-1.svg"]
  },
];

function loadLibraries() {
  // Approved samples + anything a visitor has locally marked "approved"
  // in this browser's demo storage (see saveSubmission below).
  const local = JSON.parse(localStorage.getItem("fml_approved_demo") || "[]");
  return [...SAMPLE_LIBRARIES, ...local];
}

function saveSubmission(entry) {
  // DEMO ONLY: stores to this browser's localStorage so the form has
  // somewhere to put the data. Replace with a real POST to your backend.
  const pending = JSON.parse(localStorage.getItem("fml_pending_demo") || "[]");
  pending.push(entry);
  localStorage.setItem("fml_pending_demo", JSON.stringify(pending));
}

// ---------- map setup ----------
const map = L.map("map", { scrollWheelZoom: true }).setView([25, 10], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 18
}).addTo(map);

const markerLayer = L.layerGroup().addTo(map);

function popupHtml(lib) {
  const photos = (lib.photos || [])
    .map((src, i) => `<img src="${src}" data-lib="${lib.id}" data-index="${i}" alt="Photo of ${lib.name}">`)
    .join("");
  return `
    <div class="popup-card">
      <h3>${lib.name}</h3>
      <p class="popup-address">${lib.address}</p>
      <p class="popup-desc">${lib.description}</p>
      <div class="popup-photos">${photos}</div>
    </div>
  `;
}

function renderMarkers() {
  markerLayer.clearLayers();
  const libs = loadLibraries();
  libs.forEach((lib) => {
    const marker = L.marker([lib.lat, lib.lng]).addTo(markerLayer);
    marker.bindPopup(popupHtml(lib));
    marker.on("popupopen", () => {
      document.querySelectorAll(".popup-photos img").forEach((img) => {
        img.addEventListener("click", () => openLightbox(lib, parseInt(img.dataset.index, 10)));
      });
    });
  });
}

renderMarkers();

// ---------- lightbox ----------
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
let lightboxPhotos = [];
let lightboxIndex = 0;

function openLightbox(lib, index) {
  lightboxPhotos = lib.photos || [];
  lightboxIndex = index;
  updateLightboxImg();
  lightbox.classList.remove("hidden");
}

function updateLightboxImg() {
  lightboxImg.src = lightboxPhotos[lightboxIndex];
  lightboxImg.alt = `Photo ${lightboxIndex + 1} of ${lightboxPhotos.length}`;
}

document.getElementById("lightbox-close").addEventListener("click", () => {
  lightbox.classList.add("hidden");
});

document.getElementById("lightbox-prev").addEventListener("click", () => {
  lightboxIndex = (lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length;
  updateLightboxImg();
});

document.getElementById("lightbox-next").addEventListener("click", () => {
  lightboxIndex = (lightboxIndex + 1) % lightboxPhotos.length;
  updateLightboxImg();
});

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.classList.add("hidden");
});

// ---------- submission flow ----------
const submitToggleBtn = document.getElementById("submit-toggle-btn");
const submitPanel = document.getElementById("submit-panel");
const pickBanner = document.getElementById("pick-banner");
const mapFrame = document.getElementById("map");
const pinCoordsLabel = document.getElementById("pin-coords");
const submitForm = document.getElementById("submit-form");
const cancelBtn = document.getElementById("cancel-submit");
const submitSuccess = document.getElementById("submit-success");
const photoInput = document.getElementById("lib-photos");
const photoPreview = document.getElementById("photo-preview");

let pickedLatLng = null;
let tempMarker = null;
let pickingActive = false;

function enterPickingMode() {
  pickingActive = true;
  mapFrame.classList.add("picking");
  pickBanner.classList.remove("hidden");
  submitToggleBtn.classList.add("hidden");
  submitPanel.classList.remove("hidden");
  submitSuccess.classList.add("hidden");
  map.once("click", handleMapPick);
}

function handleMapPick(e) {
  pickedLatLng = e.latlng;
  pickingActive = false;
  mapFrame.classList.remove("picking");
  pickBanner.classList.add("hidden");

  if (tempMarker) map.removeLayer(tempMarker);
  tempMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
  tempMarker.on("dragend", () => {
    pickedLatLng = tempMarker.getLatLng();
    updatePinLabel();
  });

  updatePinLabel();
}

function updatePinLabel() {
  pinCoordsLabel.textContent = `${pickedLatLng.lat.toFixed(4)}, ${pickedLatLng.lng.toFixed(4)} — drag the pin to adjust`;
}

submitToggleBtn.addEventListener("click", enterPickingMode);

cancelBtn.addEventListener("click", resetSubmitFlow);

function resetSubmitFlow() {
  pickingActive = false;
  mapFrame.classList.remove("picking");
  pickBanner.classList.add("hidden");
  submitPanel.classList.add("hidden");
  submitToggleBtn.classList.remove("hidden");
  submitForm.reset();
  photoPreview.innerHTML = "";
  pinCoordsLabel.textContent = "not set yet — click the map above";
  pickedLatLng = null;
  if (tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
}

// photo previews (client-side only — nothing is uploaded anywhere yet)
photoInput.addEventListener("change", () => {
  photoPreview.innerHTML = "";
  Array.from(photoInput.files).slice(0, 6).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.alt = file.name;
      photoPreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

submitForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!pickedLatLng) {
    pinCoordsLabel.textContent = "please click the map to drop a pin first";
    return;
  }

  const entry = {
    id: `pending-${Date.now()}`,
    name: document.getElementById("lib-name").value.trim(),
    address: document.getElementById("lib-address").value.trim(),
    description: document.getElementById("lib-desc").value.trim(),
    submitterEmail: document.getElementById("lib-email").value.trim(),
    lat: pickedLatLng.lat,
    lng: pickedLatLng.lng,
    photoCount: photoInput.files.length,
    submittedAt: new Date().toISOString(),
    status: "pending"
  };

  saveSubmission(entry);

  submitForm.classList.add("hidden");
  submitSuccess.classList.remove("hidden");

  setTimeout(() => {
    submitForm.classList.remove("hidden");
    resetSubmitFlow();
  }, 3500);
});