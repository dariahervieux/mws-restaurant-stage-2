import * as idb from 'idb';

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Class constructor, opens and stored IDB referense
   */
  constructor() {
    this.dbPromise = DBHelper.openDatabase();
  }


  /**
   * Data API URL
   */
  static get RESTAURANTS_API_URL() {
    const port = 1337; // data server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }


  static openDatabase() {
    // No service worker support =>
    // we don't care about having a database
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open('restaurants-db', 1, function (upgradeDb) {
      var store = upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
      store.createIndex('by-cusine', 'cuisine_type');
      store.createIndex('by-neighborhood', 'neighborhood');
    });
  }

  static fetchRestaurantsFromNetwork() {
    return fetch(DBHelper.RESTAURANTS_API_URL)
      .then(response => response.json());
  }

  /**
 * Database initialization,
 * fill it in with network data if datbase is available and datastore is empty
 */
  initData() {
    if (!this.dbPromise) return;

    return this.dbPromise.then(async function (db) {
      if (!db) return;

      const tx1 = db.transaction('restaurants', 'readwrite');
      const store1 = tx1.objectStore('restaurants');
      const count = await store1.count();

      let transactionPromiseResult = tx1.complete;
      if (count == 0) {
        const restaurants = await DBHelper.fetchRestaurantsFromNetwork();
        if (restaurants) {
          const tx2 = db.transaction('restaurants', 'readwrite');
          const store2 = tx2.objectStore('restaurants');
          restaurants.forEach((resto) => store2.put(resto));
          transactionPromiseResult = tx2.complete;
        }
      }

      return transactionPromiseResult;

    });
  }

  /**
   * Fetch all restaurants.
   */
  fetchRestaurants(callback) {
    if (!this.dbPromise) return;

    this.dbPromise.then(async function (db) {
      if (!db) return;

      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');

      const restaurants = await store.getAll();
      callback(null, restaurants);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  fetchNeighborhoods(callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  fetchCuisines(callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (!restaurant.photograph) {
      return undefined;
    }
    return (`/photos/${restaurant.photograph}`);
  }



  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    if (!google) return;
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    }
    );
    return marker;
  }

}

export default DBHelper;
