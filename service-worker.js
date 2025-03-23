// service-worker.js

const CACHE_NAME = "pwa-clock-suite-v2";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/icons/clock1.png",
  "/icons/clock2.png",
  "/audio/alarm1.mp3",
  "/audio/alarm2.mp3",
  "/audio/alarm3.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
