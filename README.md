tilestrata-kothic is a Tilestrata plugin for rendering tiles using KothicJS

This plugin doesn't require any particular data source, but it was designed with
PostgreSQL and PostGIS in mind.

Please consider tilestrata-kothic as a working example rather then box product.

== Usage tutorial

Let's render something simple, e.g. contour lines over a transparent background.

Required prerequisites:
# Have PostgreSQL + PostGIS installed
# PostgreSQL database with PostGIS and hstore extensions enabled
# GDAL tools installed

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

== Additional info
For information about KothicJS see: https://github.com/kothic/kothic-node
