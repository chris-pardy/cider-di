module.exports = function(factory) {
  var p = {
    __type: 'provider',
    factory: factory,
    dependencies: []
  };

  p.singleton = function() {
    var factory = p.factory;
    var instance = null;
    p.factory = function() {
      if (!instance) {
        instance = factory.apply(null,arguments);
      }
      return instance;
    };
    return p;
  };

  p.bind = function() {
    for (var i = 0; i < arguments.length; i++) {
      p.dependencies.push(arguments[i]);
    }
    return p;
  }

  return p;
};
