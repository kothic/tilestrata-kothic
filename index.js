'use strict';

const {performance, PerformanceObserver} = require('perf_hooks');
const fs = require('fs');
const path = require("path");

const Kothic = require("kothic");
const { createCanvas, loadImage } = require('canvas')

const SphericalMercator = require('@mapbox/sphericalmercator');

const Cache = require("./cache");

const PsqlProvider = require('./psql-provider')

function defautOptions(options, defaultOptions) {
  return
}

function renderer(provider, options={}) {
	options = Object.assign({
		metatile: 4,
		tileSize: 256,
		cache: {
			lockTimeoutMs: 60000,
	    ttlMs: 60000
		},
    kothic: {
      gallery: {
        //TODO: Implement icons loading
        loadImage: () => null
      }
    }
	}, options);;

  const projection = new SphericalMercator({ size: options.tileSize });

	const cache = new Cache(options.cache);

  let kothic;

	/**
	 * Initializes the layer config and the PostgreSQL datasource.
	 *
	 * @param {TileServer} server
	 * @param {function} callback(err, fn)
	 * @return {void}
	 */
	function initialize(server, callback) {
    const mapcssFile = path.resolve(options.mapcssFile)

    if (!fs.existsSync(mapcssFile)) {
      return callback("Cannot load MapCSS style " + options.mapcssFile)
    }

    const css = fs.readFile(mapcssFile, (err, buffer) => {
      kothic = new Kothic(buffer.toString(), options.kothic);

      console.log("Kothic initialized");
      callback();
    });
	}

  /**
	 * Creates a tile and returns the result as a GeoJSON Tile,
	 * plus the headers that should accompany it.
	 *
	 * @param {TileServer} server
	 * @param {TileRequest} tile
	 * @param {function} callback(err, buffer, headers)
	 * @return {void}
	 */
	function serve(server, tile, callback) {
    performance.mark("start_tile")
		const key = "" + tile.z + "," + tile.x + "," + tile.y;

		if (cache.has(key)) {
			cache.take(key, (err, value) => {
				callback(err, value, {'Content-Type': 'image/png'});
			});
			return;
		}

		const metatile = calculateMetatile(tile);
		metatile.tiles.forEach((singleTile) => {
			const [key, sx, sy] = singleTile;
			cache.lock(key);
		})

    performance.mark("get_tile_data")
		provider.getTileData(metatile.bbox, tile.z).then(data => {
      performance.measure("Get tile data", "get_tile_data")
      //TODO: Test performance and try to reuse canvas
			const metaCanvas = createCanvas(metatile.width, metatile.height);

      performance.mark("rendering")
      return render(metaCanvas, data, tile.z);
    }).then((metaCanvas) => {
      performance.measure("Rendering", "rendering")
      performance.mark("split_metatile")
      splitMetatile(metatile, metaCanvas);

      performance.measure("Split metatile", "split_metatile")
      cache.take(key, (err, value) => {
        performance.measure("Tile rendering", "start_tile")
        callback(err, value, {'Content-Type': 'image/png'});
      });
    }).catch(error => {
      console.error(error);
      callback(error);
    });
	}


  function render(canvas, data, z) {
    return new Promise((resolve, reject) => {
      kothic.render(canvas, data, z, (err) => {
        if (err) {
          return reject(err);
        }
        resolve(canvas);
      });
    });
  }

	function splitMetatile(metatile, metaCanvas) {
		const canvas = createCanvas(options.tileSize, options.tileSize);
		let ctx = canvas.getContext('2d');

		let ctxMeta = metaCanvas.getContext('2d');
		metatile.tiles.forEach(singleTile => {
			const [key, sx, sy] = singleTile;
			const data = ctxMeta.getImageData(sx, sy, options.tileSize, options.tileSize);
			ctx.putImageData(data, 0, 0);

			cache.put(key, canvas.toBuffer());
		});
	}

	function calculateMetatile(tile) {
		const z = tile.z;
		const total = 1 << z;

		// Make sure we start at a metatile boundary.
		const x = tile.x - (tile.x % options.metatile);
		const y = tile.y - (tile.y % options.metatile);

		const metaWidth  = Math.min(options.metatile, total, total - x);
		const metaHeight = Math.min(options.metatile, total, total - y);

		// Generate all tile coordinates that are within the metatile.
		let tiles = [];
		let bbox = [Infinity, Infinity, -Infinity, -Infinity];
		for (var dx = 0; dx < metaWidth; dx++) {
			for (var dy = 0; dy < metaHeight; dy++) {
				const key = "" + z + "," + (x + dx) + "," + (y + dy);

				tiles.push([ key, dx * options.tileSize, dy * options.tileSize]);
				let newBbox = projection.bbox(x + dx, y + dy, z, false, '900913').map(Math.round);

				bbox[0] = Math.min(bbox[0], newBbox[0]);
				bbox[1] = Math.min(bbox[1], newBbox[1]);
				bbox[2] = Math.max(bbox[2], newBbox[2]);
				bbox[3] = Math.max(bbox[3], newBbox[3]);
			}
		}

		return {
			width: metaWidth * options.tileSize,
			height: metaHeight * options.tileSize,
			x: x,
			y: y,
			tiles: tiles,
			bbox: bbox
		};
	}

	return {
		name: 'kothic',
		init: initialize,
		serve: serve
	};
};

module.exports = {
  renderer,
  PsqlProvider
}
