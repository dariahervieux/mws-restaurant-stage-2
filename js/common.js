export default function registerServiceWorker() {
  if (!navigator.serviceWorker) return;

  window.addEventListener('load', function () {
    if (navigator.serviceWorker.controller) {
      console.log("Page is already controlled");
      return;
    }
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(reg => {
      console.info("SW is successfully registered");
    });
  });
}

