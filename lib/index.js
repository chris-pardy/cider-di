function new_injector(parent) {
  //Provider handling
  var providers = {};

  // Given a name and args finds the provider for the name
  // invokes the provider with the injector, name, and args
  function get() {
    var name = arguments[0];
    if (providers[name]) {
      if (providers[name].is_getting) {
        throw "Circular Dependency Detected";
      }
      providers[name].is_getting = true;
      var callArgs = [];
      callArgs[0] = this;
      callArgs[1] = name;
      for (var i = 1; i < arguments.length; i++) {
        callArgs[1 + i] = arguments[i];
      }
      var val = providers[name].provider.apply(null, callArgs);
      providers[name].is_getting = false;
      return val;
    } else if (parent) {
      return parent.apply(parent, arguments);
    } else {
      throw "No provider available for " + name;
    }
  }

  // Passed to the "modules" that are being defined.
  function binder(name) {
    return {
      to: function(provider) {
        if(providers[name]) {
          throw "A Provider for " + name + " is already defined";
        }
        providers[name] = {
          provider: provider
        };
      }
    };
  };

  // iterate over all the non-parent arguments
  // and invoke them with the binder;
  for (var i = 1; i < arguments.length; i++) {
    arguments[i](binder);
  }

  // the injector that will be returned;
  var injector = function() {
    return get.apply(injector, arguments);
  };
  injector.child = new_injector.bind(null, injector);

  return injector;
}

//Singleton provider wrapper
function singleton(provider) {
  return function() {
    var injector = arguments[0];
    var name = arguments[1];
    if (!injector.__singletons__) {
      injector.__singletons__ = {};
    }
    if (!injector.__singletons__[name]) {
      injector.__singletons__[name] = provider.apply(null, arguments);
    }
    return injector.__singletons__[name];
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
          modules[i](function(name) {
            overriden[name] = true;
            return bind(name);
          });
        }
        //Iterate over all the "overriden" modules and skip the overriden values
        for (var i = 0; i < overrideable.length; i++) {
          overrideable[i](function(name) {
            if (overriden[name]) {
              //already defined give a "no-op";
              return {
                to: function() {}
              };
            } else {
              return bind(name);
            }
          })
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
