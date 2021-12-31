const tilestrata = require('tilestrata');
const strata = tilestrata();
const path = require("path");


const tilestrataKothic = require('tilestrata-kothic');

const SQL_TMPL = "SELECT osm_id as id,  " +
                  "tags AS tags, " +
                  "ST_AsGeoJSON(ST_SnapToGrid(ST_Intersection(geometry, {bbox}), 1)) AS geojson " +
                  "FROM public.osm_all " +
                  "WHERE ST_Intersects(geometry, {bbox})";

strata.layer('osm', {minZoom: 12, maxZoom: 18})
  .route('*.png')
  .use(tilestrataKothic({
     psql: {
        generateSQL: function(bbox, zoom) {
          return SQL_TMPL.replace(/\{bbox\}/g, bbox);
        },
        pgConfig: {
          user: process.env.PG_USER || 'contours',
          password: process.env.PG_PASSWORD || 'contours',
          host: 'localhost',
          port: '5432',
          database: process.env.PG_DB || 'osm',
          connectionTimeoutMillis: 10000
        },
        buffer: 16
      },
      mapcssFile: path.resolve(__dirname, "contours.mapcss")
    }));

strata.listen(8081);
