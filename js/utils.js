/*
 this is a Utils functions
 */
var Utils = {
  /**
   convert one of the rgb value to hex
   */
  rgbItemToHex: function rgbItemToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
  },

  /**
   * convert rgb to hex value
   */
  rgbToHex: function rgbToHex(rgb) {
    return this.rgbItemToHex(rgb[0]) + this.rgbItemToHex(rgb[1]) +
      this.rgbItemToHex(rgb[2]);
  },

  /**
   * make a http request for the given url
   */
  httpGet: function httpGet(url) {
    // Create a new promise object.
    return new Promise(function (resolve, reject) {
      var req = new XMLHttpRequest();
      req.open('GET', url);

      req.onload = function () {
        if (req.status == 200) {
          // request success, resolve the promise
          resolve(req.response);
        } else {
          // there is an error from server side, reject it
          reject(Error(req.statusText));
        }
      };

      req.onerror = function () {
        reject(Error('Network Error'));
      };

      // send the request
      req.send();
    });
  }
}