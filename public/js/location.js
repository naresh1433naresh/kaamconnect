/**
 * KaamConnect Location Utility
 * Handles Geolocation and Reverse Geocoding using Nominatim
 */

const LocationHelper = {
  /**
   * Get current coordinates using Geolocation API
   * @returns {Promise<{lat: number, lng: number}>}
   */
  async getCurrentCoords() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by your browser'));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(new Error(err.message || 'Failed to get location'))
      );
    });
  },

  /**
   * Get address details from coordinates using Nominatim (OpenStreetMap)
   * @param {number} lat 
   * @param {number} lng 
   * @returns {Promise<{city: string, address: string, full: string}>}
   */
  async getAddress(lat, lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.state_district || '';
      const road = addr.road || '';
      const suburb = addr.suburb || addr.neighbourhood || '';
      
      // Construct a cleaner full address
      const parts = [road, suburb, city].filter(p => !!p);
      
      return {
        city: city,
        address: parts.join(', '),
        full: data.display_name
      };
    } catch (err) {
      console.error('Reverse Geocoding failed:', err);
      return { city: '', address: '', full: '' };
    }
  },

  /**
   * Detect location and fill input fields
   * @param {Object} options 
   * @param {string} options.cityInputId 
   * @param {string} options.addressInputId 
   * @param {Function} options.onSuccess callback with {lat, lng, city, address}
   */
  async autoFill(options = {}) {
    try {
      const coords = await this.getCurrentCoords();
      const info = await this.getAddress(coords.lat, coords.lng);
      
      if (options.cityInputId) {
        const el = document.getElementById(options.cityInputId);
        if (el) el.value = info.city;
      }
      
      if (options.addressInputId) {
        const el = document.getElementById(options.addressInputId);
        if (el) el.value = info.address;
      }
      
      if (options.onSuccess) {
        options.onSuccess({ ...coords, ...info });
      }
      
      return { ...coords, ...info };
    } catch (err) {
      console.warn('AutoFill failed:', err);
      throw err;
    }
  }
};

window.LocationHelper = LocationHelper;
