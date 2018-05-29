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

window.addGMapsToDom = () => {
  let scriptAdded = !!self.scriptAdded;
  if (!scriptAdded) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://maps.googleapis.com/maps/api/js?' +
      'key=AIzaSyCVSdM77QDajKL5gqlQO1knGXw4N_Px_gU&libraries=places&callback=window.initMap';
    document.body.appendChild(script);
    self.scriptAdded = true;
  }
}
if (window.innerWidth > 600) {
  window.addGMapsToDom();
  self.scriptAdded = true;
}

