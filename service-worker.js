const CACHE_NAME = "nail-booking-board-20260529-9";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=20260529-9",
  "./app.js?v=20260529-9",
  "./manifest.webmanifest",
  "./icons/apple-touch-icon-minimal.png",
  "./icons/app-icon-minimal-192.png",
  "./icons/app-icon-minimal-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
