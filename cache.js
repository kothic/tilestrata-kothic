'use strict';
/*
Cache representation for metatile rendering result 
 */

function Cache(options) {
  this.options = Object.assign({
    lockTimeoutMs: 60000,
    waitTimeoutMs: 60000,
    ttlMs: 60000
  }, options);

  this.callbacks = {};
  this.results = {};
  this.locks = {};
}

Cache.prototype.has = function(key) {
  const hit = !!this.locks[key] || !!this.results[key];
  return hit;
}

Cache.prototype.take = function(key, callback) {
  if (this.results[key]) {
    callback(null, this.results[key]);
    delete this.results[key];
    delete this.locks[key];
    return;
  }

  //TODO: Check multiple callbacks
  if (this.callbacks[key]) {
    this.callbacks[key]("Callback was overriden")
  }
  this.callbacks[key] = callback;

  const cache = this;
  setTimeout(() => {
    if (cache.callbacks[key]) {
      cache.callbacks[key]("Timeout reached without answer");
      delete cache.callbacks[key];
    }
  }, this.options.waitTimeoutMs);
}

Cache.prototype.lock = function(key) {
  this.locks[key] = true;

  const cache = this;
  setTimeout(() => {
    delete cache.locks[key];
  }, this.options.lockTimeout);
}

Cache.prototype.put = function(key, data) {
  if (this.callbacks[key]) {
    this.callbacks[key](null, data);
    delete this.callbacks[key];
  } else {
    this.results[key] = data;
  }

  const cache = this;
  setTimeout(() => {
    delete cache.results[key];
  }, this.options.ttl);
}

module.exports = Cache;
