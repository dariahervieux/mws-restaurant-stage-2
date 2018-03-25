var staticCacheName = 'mws-restaurant-static-v1';
var contentImgsCache = 'mws-restaurant-imgs';
var allCaches = [
  staticCacheName,
  contentImgsCache
];

//cache all static resources
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        'data/restaurants.json', //for now its static
        'js/common.js',
        'js/main.js',
        'js/restaurant_info.js',
        'js/dbhelper.js',
        'css/styles.css',
        'css/responsive.css',
        'css/responsive-details.css',
        'img/image_not_available.png',
        'index.html',
        'restaurant.html'
      ]);
    })
  );
});

//delete old caches if any
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('mws-restaurant-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/index.html'));
      return;
    }

    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match('/restaurant.html'));
      return;
    }

    if (requestUrl.pathname.startsWith('/photos/')) {
      event.respondWith(servePhoto(event.request));
      return;
    }    
  }
  //default - get from cache then fetch if not found
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || 
        fetch(event.request).catch(error => {
          console.error('Network error', error);
          // return new Response('No content available',
          //         {headers: {'Content-Type': 'text/html'}}
          // );
          throw error;
        });
    })
  );
});


async function servePhoto(request) {
  //cut off the _<number> prefix
  var storageUrl = request.url.replace(/_\d+\.jpg$/, '');

  const cache = await caches.open(contentImgsCache);

  const cachedImage =  await cache.match(request);

  if (cachedImage) return cachedImage;

  const cachedAnySizeImagePromise = cache.match(storageUrl);
  const networkImagePromise = fetch(request);

  const cachedAnySizeImage = await cachedAnySizeImagePromise;

  let toReturn = cachedAnySizeImage;
  let errorToThrow = null;
  try {
    const networkImage = await networkImagePromise;
    
    //if image "any size" doesn't exist in cache - store it
    if(!cachedAnySizeImage) {
      cache.put(storageUrl, networkImage.clone());
    }
    //store the requested image in cache
    cache.put(request, networkImage.clone());
    toReturn = networkImage;
  } catch (error) {
    console.log('There has been a problem with the fetch operation: ', error.message);
    errorToThrow = error;
  }

  if(toReturn) {
    return toReturn;
  }

  throw errorToThrow;
}
