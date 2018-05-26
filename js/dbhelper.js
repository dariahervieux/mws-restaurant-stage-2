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
  fetchRestaurants() {
    if (!this.dbPromise) return [];

    return this.dbPromise.then(function (db) {
      if (!db) return [];

      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');

      return store.getAll();
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  fetchRestaurantById(id) {
    if (!this.dbPromise) return;
    
    return this.dbPromise.then(function (db) {
      if (!db) return;

      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');

      return store.get(parseInt(id));
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  fetchRestaurantByCuisine(cuisine) {
    if (!this.dbPromise) return;
    return this.dbPromise.then(function (db) {
      if (!db)  return;
      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');
      const cusineIdx = store.index('by-cusine');
      return cusineIdx.getAll(cuisine);     
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  fetchRestaurantByNeighborhood(neighborhood) {
    if (!this.dbPromise) return;
    return this.dbPromise.then(function (db) {
      if (!db)  return;
      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');
      const cusineIdx = store.index('by-neighborhood');
      return cusineIdx.getAll(neighborhood);     
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  async fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    if (cuisine != 'all') { // filter by cuisine
      return this.fetchRestaurantByCuisine(cuisine)
        .then(restaurantsByCusine => {
          if (neighborhood != 'all') { // filter by neighborhood
            restaurantsByCusine = restaurantsByCusine.filter(r => r.neighborhood == neighborhood);
          }
          return restaurantsByCusine;
        });
    }
    if (neighborhood != 'all') { // filter by neighborhood
      return this.fetchRestaurantByNeighborhood(neighborhood);
    }
    return this.fetchRestaurants();
  }

  /**
   * Fetch all neighborhoods.
   * Returns a Promise.
   */
  fetchNeighborhoods() {
    return this.getUniqueValuesFromIndex('by-neighborhood', 'neighborhood');
  }

  /**
   * Fetch all cuisines.
   * Returns a Promise.
   */
  fetchCuisines() {
    return this.getUniqueValuesFromIndex('by-cusine', 'cuisine_type');
  }


  getUniqueValuesFromIndex(indexName, indexedFieldName) {
    if (!this.dbPromise) return;
    return this.dbPromise.then(async function (db) {
      if (!db)
        return;
      const uniqueValues = [];
      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');
      const cusineIdx = store.index(indexName);
      let nextValue = null;
      return cusineIdx.openCursor().then(function cursorIterate(cursor) {
        if (!cursor)
          return uniqueValues;
        const value = cursor.value[indexedFieldName];
        if (nextValue != value) {
          uniqueValues.push(cursor.value[indexedFieldName]);
          nextValue = cursor.value[indexedFieldName];
        }
        return cursor.continue().then(cursorIterate);
      });
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
