/* eslint-env browser */
import registerServiceWorker from './common.js';
import DBHelper from './dbhelper.js';

/**DBHelper instance  */
let dbHelper;

/**
 * Register SW for current page
 */
registerServiceWorker();

/**
 * Initialize Google map on script load callback.
 */
window.initMap = () => {
  if (typeof google === "undefined") {
    console.error('google is not defined!');
    return;
  }
  const loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  // Set title on map iframe once map has loaded
  self.map.addListener('tilesloaded', () => {
    const mapFrame = document.querySelector('#map iframe');
    mapFrame.setAttribute('title', 'Google map with restaurant locations');
  }
  );
  addMarkersToMap();
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

/** Configure intersection observer as soon as initial HTML is ready */
let setUpImgIntersectionObserver = () => {
  //make an Array of images
  var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
  if ( !window.IntersectionObserver) return;

  if(self.lazyImageObserver) self.lazyImageObserver.disconnect();
  else {
    self.lazyImageObserver = new IntersectionObserver( entries => {
      entries.forEach( entry => {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImage.classList.remove("lazy");
          self.lazyImageObserver.unobserve(lazyImage);
        }
      });
    });
  }

  lazyImages.forEach(lazyImage => self.lazyImageObserver.observe(lazyImage));
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is fully loaded.
 */
window.addEventListener('load', () => {
  dbHelper = new DBHelper();
  dbHelper.initData()
    .then(() => {
      fetchNeighborhoods();
      fetchCuisines();
      self.updateRestaurants();
    });
});

/**
 * Update page and map for current restaurants.
 * In Window scope
 */
window.updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  dbHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
    .then((restaurants) => {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      setUpImgIntersectionObserver();
    });
}


/**
 * Fetch all neighborhoods and set their HTML.
 */
let fetchNeighborhoods = () => {
  dbHelper.fetchNeighborhoods()
    .then(neighborhoods => {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    })
    .catch(error => console.error(error));
}

/**
 * Set neighborhoods HTML.
 */
let fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
let fetchCuisines = () => {
  dbHelper.fetchCuisines()
    .then(cuisines => {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    })
    .catch(error => console.error(error));
}

/**
 * Set cuisines HTML.
 */
let fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}


/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
let resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(m => m.setMap(null));
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
let fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create img element :
 *	<img
 *	 src=${url/photo_name}_500.webp alt="<name> restaurant"
 *	 sizes="(min-width: 800px) 210px, 28vw"
 *	 srcset="${url/photo_name}_160.webp 200w,
 *				    ${url/photo_name}_200.webp 200w"
 *  >
 */
let createRestaurantImageDomElement = (restaurant) => {
  const image = document.createElement('img');
  image.className = 'restaurant-img';

  const defaultRestImageUrl = DBHelper.imageUrlForRestaurant(restaurant);
  if (defaultRestImageUrl) {
    const imageUrlWithoutExtention = defaultRestImageUrl.replace(/\.[^/.]+$/, "");
    image.sizes = "28vw";
    image.dataset.src = `${imageUrlWithoutExtention}_250.webp`;
    image.dataset.srcset = `${imageUrlWithoutExtention}_250.webp 250w, ${imageUrlWithoutExtention}_150.webp 150w`;
    image.classList.add('lazy');
  } else {
    image.src = `img/image_not_available.png`;
  }
  image.alt = `${restaurant.name} restaurant`;
  return image;
}

/**
 * Create restaurant HTML.
 */
let createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  li.append(createRestaurantImageDomElement(restaurant));

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
let addMarkersToMap = (restaurants = self.restaurants) => {
  if (typeof google === "undefined") {
    console.info('no google maps defined yet!');
    return;
  }

  if (!restaurants) return;

  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
