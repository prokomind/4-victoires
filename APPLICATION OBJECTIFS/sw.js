// 4 Victoires : fonctionne hors ligne. Changer VERSION à chaque mise à jour des fichiers.
var VERSION = "4v-2026-11-21b";
var SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== self.location.origin && !font) return;
  // Affiche tout de suite la copie en cache, et la rafraîchit en arrière-plan.
  e.respondWith(caches.open(VERSION).then(function (cache) {
    var key = req.mode === "navigate" ? "index.html" : req;
    return cache.match(key, { ignoreSearch: req.mode === "navigate" }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === "opaque")) cache.put(key, res.clone());
        return res;
      }).catch(function () { return hit; });
      if (hit) { e.waitUntil(net.catch(function () {})); return hit; }
      return net;
    });
  }));
});
