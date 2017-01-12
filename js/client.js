// Edit me. Feel free to create additional .js files.
'use strict';

(function (window, document, app) {

  /* svg url is used to fetch svg from server */
  var svgUrl = '/color/';
  var mainUrl = window.URL || window.webkitURL;

  /**
   * Calculate average rgb / tile. Then draw it on a canvas dom
   */
  function getAverageRgbPerTile(image) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = image.width / TILE_WIDTH;
    canvas.height = image.height / TILE_HEIGHT;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return ctx;
  };

  /**
   * get tiles meta data from the given original image
   *
   */
  function getTilesMetaData(originalImage) {
    var res = [];
    var context = getAverageRgbPerTile(originalImage);
    var num_tiles_x = originalImage.width / TILE_WIDTH;
    var num_ties_y = originalImage.height / TILE_HEIGHT;
    var data = context.getImageData(0, 0, num_tiles_x, num_ties_y).data;
    var i = 0;
    for (var row = 0; row < num_ties_y; row++) {
      for (var col = 0; col < num_tiles_x; col++) {
        res.push(new Tile(data.subarray(i * 4, i * 4 + 3), col, row));
        i++;
      }
    }
    return res;
  };

  /**
   * Create a canvas element and draw it on the screen
   */
  function renderMosiacImage(image) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;

    var chunkSize = image.width / TILE_WIDTH;
    var tilesMetadata = getTilesMetaData(image);
    var chunks = tilesMetadata.splice(0, chunkSize);
    var promises = [];
    // create promise object for each tile in order to improve performance
    while (chunks.length > 0) {
      promises.push(
        Promise.all(chunks.map(function (data) {
          return requestSVGData(data);
        })));
      chunks = tilesMetadata.splice(0, chunkSize);
    }
    renderEachRowFromPromise(context, promises);
    return canvas;
  };

  function renderEachRowFromPromise(context, promises) {
    // Base case.
    if (promises.length === 0) return;
    promises.shift().then(function (results) {
      results.forEach(function (result) {
        renderSVGTile(context, result.svg, {x: result.x, y: result.y});
      });
      renderEachRowFromPromise(context, promises);
    });
  };
  /**
   * create svg blob object
   */
  function createSVGBlob(svg) {
    var svgBlob = new Blob([svg], {type: 'image/svg+xml;charset=utf-8'});
    return mainUrl.createObjectURL(svgBlob);
  };

  function renderSVGTile(ctx, svg, pos) {
    var img = new Image();
    var url = createSVGBlob(svg);
    img.onload = function () {
      try {
        ctx.drawImage(img, pos.x, pos.y);
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        mainUrl.revokeObjectURL(url);
      } catch (e) {
        throw new Error('Could not render image' + e);
      }
    };
    img.src = url;
  };

  /**
   * get svg data through http
   */
  function requestSVGData(data) {
    return Utils.httpGet(svgUrl + data.hex)
      .then(function (svg) {
        return {svg: svg, x: data.x, y: data.y};
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  function handleFileUpload(callback) {
    var img = new Image();
    img.src = window.URL.createObjectURL(this);
    img.onload = function () {
      callback(this);
    }
  };

  function Tile(pixelData, x, y) {
    this.hex = Utils.rgbToHex(pixelData);
    this.x = x * TILE_WIDTH;
    this.y = y * TILE_HEIGHT;
  };

  function drop(ev){
    console.log(ev);
  }

  app.run = function run() {
    var inputElement = document.getElementById('input');
    var ul = document.getElementById('image-list');
    var li = document.createElement('li');
    ul.appendChild(li);
    inputElement.addEventListener('change', function () {
      handleFileUpload.call(
        this.files[0], function (image) {
          li.appendChild(image);
          var canvas = renderMosiacImage(image);
          li.appendChild(canvas);
        });
    }, false);
  };

})(window, document, window.app || (window.app = {}));