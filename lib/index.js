var provider = require('./provider.js');

function binder(parent) {
  var providers = {
    __parent: parent
  };

  function to(name, factory) {
    if (typeof factory === 'string') {
      providers[name] = {
        aliasOf: factory
      };
    } else {
      if (!factory.__type || factory.__type != 'provider') {
        factory = provider(factory);
      }
      providers[name] = {
        provider: factory,
        initializing: false
      };
    }
  }

  var b = {
    provides: provider,
    bind: function(name) {
      return {
        to: function(factory) {
          to(name, factory);
        },
        toInstance: function(instance) {
          to(name, function() {
            return instance
          });
        }
      };
    }
  };

  for (var i = 1; i < arguments.length; i++) {
    arguments[i](b);
  }

  function get(name) {
    var provider = null;
    var ps = providers
    while(!ps[name] && ps.__parent != null) {
      ps = ps.__parent;
    }
    if(!ps[name]) {
      throw 'No provider named ' + name;
    }
    if (ps[name].aliasOf) {
      return get(providers[name].aliasOf);
    }
    if (ps[name].initializing) {
      throw 'Circular provider reference';
    }
    ps[name].initializing = true;
    var provider = ps[name].provider;
    var value = provider.factory.apply(null,
      provider.dependencies.map(function(name) {
        return get(name);
      })
    );
    ps[name].initializing = false;
    return value;
  }

  get.child = binder.bind(null, providers);

  return get;
}

module.exports = binder.bind(null, null);
