function new_injector(parent) {
  //Provider handling
  var providers = {};

  //extension handling
  var extensions = [];

  var deleted = {};

  // Given a name and args finds the provider for the name
  // invokes the provider with the injector, name, and args
  function get() {
    var name = arguments[0];
    if (!deleted[name]) {
      if (providers[name]) {
        if (providers[name].is_getting) {
          throw "Circular Dependency Detected";
        }
        providers[name].is_getting = true;
        var callArgs = [];
        callArgs[0] = this;
        for (var i = 1; i < arguments.length; i++) {
          callArgs[i] = arguments[i];
        }
        var val = providers[name].provider.apply(null, callArgs);
        providers[name].is_getting = false;
        return val;
      } else if (parent) {
        return parent.get.apply(parent.get, arguments);
      }
    }
    throw "No provider available for " + name;
  }

  // Passed to the "modules" that are being defined.
  function binder(name) {
    return {
      to: function(provider) {
        if(getProviders()[name]) {
          throw "A Provider for " + name + " is already defined";
        }
        providers[name] = {
          provider: provider
        };
      }
    };
  };

  // opens up the cider-spi for exension modules
  function binder_extension(extension) {
    extensions.push(extension);
  }

  binder.extension = binder_extension;

  // iterate over all the non-parent arguments
  // and invoke them with the binder;
  var modules = [];
  for (var i = 1; i < arguments.length; i++) {
    modules.push(arguments[i]);
    arguments[i](binder);
  }

  function getProviders() {
    var p = {}
    if (parent) {
      p = parent.getProviders();
    }
    for (var key in providers) {
      if(providers.hasOwnProperty(key)) {
        p[key] = providers[key].provider;
      }
    }
    return p;
  }

  function getModules() {
    var m = []
    if (parent) {
      m = parent.getModules();
    }
    return m.concat(modules);
  }

  function getExtensions() {
    var e = [];
    if (parent) {
      e = parent.getExtensions();
    }
    return e.concat(extensions);
  }

  //Invoke for extension points
  var e = getExtensions();
  for (var i = 0; i < e.length; i++) {
    var extension_point = {
      providers: getProviders(),
      modules: getModules(),
      update_provider: function(name) {
        if (arguments.length > 1) {
          if (!providers[name]) {
            providers[name] = {}
          }
          providers[name].provider = arguments[1];
        } else {
          deleted[name] = true;
        }
      }
    };
    e[i](extension_point);
  }

  // the injector that will be returned;
  var injector = function() {
    return get.apply(injector, arguments);
  };
  injector.child = new_injector.bind(null, {
    get: injector,
    getProviders: getProviders,
    getModules: getModules,
    getExtensions: getExtensions
  });

  return injector;
}

var singleton_counter = 0;

//Singleton provider wrapper
function singleton(provider) {
  var id = singleton_counter;
  singleton_counter++;
  return function() {
    var injector = arguments[0];
    if (!injector.__singletons__) {
      injector.__singletons__ = {};
    }
    if (!injector.__singletons__[id]) {
      injector.__singletons__[id] = provider.apply(null, arguments);
    }
    return injector.__singletons__[id];
  };
}

//Override module wrapper
function override() {
  var overrideable = [];
  for (var i = 0; i < arguments.length; i++) {
    overrideable[i] = arguments[i];
  }
  return {
    with: function() {
      var modules = [];
      for (var i =0; i < arguments.length; i++) {
        modules[i] = arguments[i];
      }
      return function(bind) {
        var overriden = {};
        //start off by passing a wrapped function into all the "with" modules
        for (var i = 0; i < modules.length; i++) {
          var overridding_bind = function(name) {
            overriden[name] = true;
            return bind(name);
          };
          overridding_bind.extnesion = bind.extension;
          modules[i](overridding_bind);
        }
        //Iterate over all the "overriden" modules and skip the overriden values
        for (var i = 0; i < overrideable.length; i++) {
          var overridden_bind = function(name) {
            if (overriden[name]) {
              //already defined give a "no-op";
              return {
                to: function() {}
              };
            } else {
              return bind(name);
            }
          };
          overridden_bind.extension = bind.extension;
          overrideable[i](overridden_bind);
        }
      };
    }
  };
}

// Object of Provider
function obj(providers) {
  return function() {
    var obj = {};
    for (var prop in providers) {
      if (providers.hasOwnProperty(prop)) {
        obj[prop] = providers[prop].apply(null, arguments);
      }
    }
    return obj;
  };
}

// List of provider
function list(providers) {
  return function() {
    var list = [];
    for (var i = 0; i < providers.length; i++) {
      list[i] = providers[i].apply(null,arguments);
    }
    return list;
  }
}

// Alias one binding to another
function alias(other_name) {
  return function(injector) {
    return injector(other_name);
  };
}

// Provider for an instance value
function instance(value) {
  return function () {
    return value;
  };
}

var exports = new_injector.bind(null, null);
exports.singleton = singleton;
exports.override = override;
exports.obj = obj;
exports.list = list;
exports.alias = alias;
exports.instance = instance;

module.exports = exports;
