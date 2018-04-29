import DBHelper from './dbhelper.js';

let restaurants,
  neighborhoods,
  cuisines;
let map;
let markers = [];

/**DBHelper instance  */
let dbHelper;


/**
 * Register SW for current page
 */
registerServiceWorker();

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  dbHelper = new DBHelper();
  dbHelper.initData()
  .then( () => {
    fetchNeighborhoods();
    fetchCuisines();
    self.updateRestaurants();
  });
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
let fetchNeighborhoods = () => {
  dbHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
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
  dbHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
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
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
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
}

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

  dbHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
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
  if(self.markers) {
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
 *	 src=${url/photo_name}_500.jpg alt="<name> restaurant"
 *	 sizes="(min-width: 800px) 210px, 28vw"
 *	 srcset="${url/photo_name}_160.jpg 200w,
 *				    ${url/photo_name}_200.jpg 200w"
 *  >
 */
let createRestaurantImageDomElement = (restaurant) => {
  const image = document.createElement('img');
  image.className = 'restaurant-img'; 

  const defaultRestImageUrl = DBHelper.imageUrlForRestaurant(restaurant);
  if(defaultRestImageUrl) {
    const imageUrlWithoutExtention =  defaultRestImageUrl.replace(/\.[^/.]+$/, "");
    image.sizes ="28vw";
    image.src = `${imageUrlWithoutExtention}_250.jpg`;
    image.srcset = `${imageUrlWithoutExtention}_250.jpg 250w, ${imageUrlWithoutExtention}_150.jpg 150w`; 
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
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
let addMarkersToMap = (restaurants = self.restaurants) => {
  if(!google) return;

  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
