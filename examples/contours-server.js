const { PerformanceObserver } = require('perf_hooks');

const path = require("path");

const tilestrata = require('tilestrata');
const strata = tilestrata();

const tilestrataPostGISGeoJSON = require('tilestrata-kothic');

const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((item) => {
    console.log(item.name, (item.duration).toFixed(2) + "ms");
  });
});
observer.observe({ entryTypes: ['function', 'measure'] });

const SQL_TMPL = "SELECT elevation as id,  " +
                  "hstore(ARRAY['ele', elevation::text]) AS tags, " +
                  "ST_AsGeoJSON(ST_SnapToGrid(ST_Intersection(wkb_geometry, {bbox}), 1)) AS geojson " +
                  "FROM public.contours " +
                  "WHERE elevation % {interval} = 0 AND ST_Intersects(wkb_geometry, {bbox})";

strata.layer('contours', {minZoom: 12, maxZoom: 18})
  .route('*.png')
    .use(tilestrataPostGISGeoJSON({
      psql: {
        generateSQL: function(bbox, zoom) {
          let interval;
          if (zoom >= 16) {
            interval = 10;
          } else if (zoom >= 14) {
            interval = 50;
          } else if (zoom >= 12) {
            interval = 100;
          } else {
            interval = 1000;
          }

          return SQL_TMPL
            .replace(/\{bbox\}/g, bbox)
            .replace(/\{interval\}/g, interval);
        },
        pgConfig: {
          user: process.env.PG_USER || 'contours',
          password: process.env.PG_PASSWORD || 'contours',
          host: 'localhost',
          port: '5432',
          database: process.env.PG_DB || 'contours',
          connectionTimeoutMillis: 10000
        }
      },
      kothic: {
        gallery: {
          //TODO: Implement icons loading
          loadImage: () => null
        }
      },
      mapcssFile: path.resolve(__dirname, "contours.mapcss")
    }));



strata.listen(8081);
