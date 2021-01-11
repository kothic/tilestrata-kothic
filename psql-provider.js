'use strict';

const pg = require('pg');
const SphericalMercator = require('@mapbox/sphericalmercator');
const hstore = require('pg-hstore')();

/**
 **
 ** @param {options.buffer} buffer around the tile in pixels. Default 0
 ** @param {options.generateSQL}:function
 **
 **/
function PsqlProvider(options={}) {
  this.options = Object.assign({
    buffer: 0
  }, options);

  if (typeof(options.generateSQL) !== 'function') {
    throw new Error("options.generateSQL must be a function");
  }

  this.pool = new pg.Pool(options.pgConfig);

  this.pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
  });
}

function transformData(result, bbox) {
  const data = {
    "type": "FeatureCollection",
    "bbox": bbox
  };

  data.features = result.rows.map((row) => {
    if (!row.geojson) {
      return null;
    }
    return {
      "type": "Feature",
      "geometry": JSON.parse(row.geojson),
      "properties": hstore.parse(row.tags)
    };
  }).filter((x) => !!x);

  return data;
}

PsqlProvider.prototype.getTileData = function(bbox, z) {

  let bboxSQL = 'ST_SetSRID(\'BOX(' + bbox[0] + ' ' + bbox[1] + ',' + bbox[2] + ' ' + bbox[3] + ' )\'::box2d, 3857)';
  if (this.options.buffer > 0) {
    bboxSQL = "ST_Expand(" + bboxSQL + ", " + this.options.buffer + ")";
  }

  const sql = this.options.generateSQL(bboxSQL, z);

  return this.pool.query(sql).then(result => {
    return transformData(result, bbox);
  });
}

module.exports = PsqlProvider;
