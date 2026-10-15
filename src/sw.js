// Offline support: keep the app shell cached, refresh it in the background.
const CACHE = "welli-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Pages: try the network first so updates show on the next open; fall back to the cache offline.
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; }).catch(() => caches.match(e.request).then(hit => hit || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(res => { if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const id = e.notification.data && e.notification.data.id, action = e.action;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    if (action && id) {
      if (cs.length) { cs.forEach(c => c.postMessage({ type: "remind", action, id })); return action === "done" ? undefined : cs[0].focus(); }
      return self.clients.openWindow(`./?remind=${action}&id=${id}`);
    }
    return cs.length ? cs[0].focus() : self.clients.openWindow("./");
  }));
});
// Reminders sent by the server (supabase/functions/remind) while the app is closed.
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { }
  const a = d.a || ["Done", "Snooze"];
  e.waitUntil(self.registration.showNotification(d.title || "Welli", { body: d.body || "", tag: d.id || "welli", icon: "icon-192.png", badge: "icon-192.png", data: { id: d.id }, actions: d.id ? [{ action: "done", title: a[0] }, { action: "snooze", title: a[1] }] : [] }));
});
