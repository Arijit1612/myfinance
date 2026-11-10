const CACHE = "my-finance-v2";
const FILES = ["./", "index.html", "store.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Only the app's own files and the Firebase script files are cached. Database traffic is never touched.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  const mine = u.origin === location.origin;
  const sdk = u.origin === "https://www.gstatic.com" && u.pathname.startsWith("/firebasejs/");
  if (!mine && !sdk) return;
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request).then((m) => m || (mine ? caches.match("index.html") : Response.error())))
  );
});
