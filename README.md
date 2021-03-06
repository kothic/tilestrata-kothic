**tilestrata-kothic** is a [Tilestrata](https://github.com/naturalatlas/tilestrata) plugin for rendering tiles using [Kothic](https://github.com/kothic/kothic-node)

[![NPM version][npm-version-image]][npm-url] [![License][license-image]][license-url]  [![Build Status][travis-image]][travis-url]

[npm-url]: https://npmjs.org/package/tilestrata-kothic
[npm-version-image]: http://img.shields.io/npm/v/tilestrata-kothic.svg?style=flat

[license-image]: https://img.shields.io/npm/l/tilestrata-kothic.svg?style=flat
[license-url]: LICENSE

[travis-url]: http://travis-ci.org/kothic/tilestrata-kothic
[travis-image]: http://img.shields.io/travis/kothic/tilestrata-kothic/master.svg?style=flat

This plugin doesn't require any particular data source, but it was designed with
PostgreSQL and PostGIS in mind.

Please consider tilestrata-kothic as a working example rather then box product.

## Usage tutorial

Let's render something simple, e.g. contour lines over a transparent background.

Required prerequisites:
1. Have PostgreSQL + PostGIS installed
2. PostgreSQL database with PostGIS and hstore extensions enabled
3. GDAL tools installed

Download SRTM contours in shape format from OpenDemData http://opendemdata.info/data/srtm_contour/N43E042.zip
```
wget http://opendemdata.info/data/srtm_contour/N43E042.zip
```

Unzip archive
```
unzip N43E042.zip
```

Use OGR2OGR to load shapes to PostgreSQL
```
ogr2ogr -f "PostgreSQL" PG:"host=localhost dbname=%db_name$ user=%psql_user% password=%psql_password" "N43E042/N43E042.shp" -nln contours -overwrite -t_srs EPSG:3857
```

Note: contours example relies on spatial data in EPSG:3857

Run examples/contours-server.js
```
PG_USER=%psql_user% PG_PASSWORD=%psql_password" PG_DB=%db_name$ node examples/contours-server.js
```

Check generated contours in your browser
```
http://localhost:8081/contours/14/10123/5998.png
```

## Additional info
For information about KothicJS see: https://github.com/kothic/kothic-node
