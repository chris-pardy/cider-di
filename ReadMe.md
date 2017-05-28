[![Build Status](https://travis-ci.org/chris-pardy/cider-di.svg?branch=master)](https://travis-ci.org/chris-pardy/cider-di)
# cider
Super simple dependency injection.

## Installation
```npm install --save cider-di```

## Use
```
const service = require('./service');
const database = require('./database');
const cider = require('cider-di');
const injector = cider(
  (bind) => {
    bind('service').to(cider.singleton((inject) => new service(inject('database'))));
  }, (bind) => {
    bind('database').to(cider.singleton((inject) => new database()));
  });
const my_service = injector('service');
```
Cider uses named bindings to create a map of name to provider function.
Each provider function is supplied an injector which can be used to fetch dependencies.

## Components
### cider([...modules])
* `modules` [function](#modulebind)

Takes 0 or more functions which act as module definitions, each module is passed
an argument `bind` which is used to declare dependencies. Returns an `injector`.

### cider.singleton(provider)
* `provider` [function](#providerinjectnameargs)

Given a provider function ensures that the function is only called once for each
injector instance that it's used from. Returns a `provider`.
```
bind('my_service').to(cider.singleton((inject) => new service(inject('dependency'))));
```

### cider.instance(value)
* `value` any

Given a value create a provider that will provide that value. Returns a `provider`.
```
bind('should_run').to(cider.instance(false));
```

### cider.alias(name)
* `name` string

Given a name creates a provider that provides the value bound to that name.
This acts as a way to alias bindings. Returns a `provider`.
```
bind('database').to(cider.alias('postgres'));
```

### cider.list(providers)
* `providers` array of [providers](#providerinjectnameargs)

Given an array of providers creates a provider that returns a list of the bound
values, maintaining order. Returns a `provider`.
```
bind('options').to(cider.list([
  cider.alias('should_run'),
  cider.alias('is_production')
]));
```

### cider.obj(providers)
* `providers` Object of [providers](#providerinjectnameargs)

Given an object containing a mapping of keys to providers, creates a provider that
returns an object with the bound values mapped to the keys. Returns a `provider`.
```
bind('options').to(cider.obj({
    should_run: cider.alias('should_run'),
    is_production: cider.alias('is_production')
}));
```

### cider.override([...override_modules]).with([...with_modules])
* `override_modules` [function](#modulebind)
* `with_modules` [function](#modulebind)

Given 2 sets of modules allows `with_modules` to define bindings that have already
been defined by the `override_modules` overriding these values. Returns a `module`.
```
const my_module = (bind) => { bind('is_production').to(cider.instance(true)); };
const injector = cider(cider.override(
    my_module, your_module
  ).with(
    (bind) => {
        bind('is_production').to(cider.instance(false));
    })
  );
```

### injector(name[,...args])
* `name` string
* `args` any

Given a name resolve the provider bound to the name and invoke it with the given args.
Returns the result of the provider.
```
const db = injector('database',table_name);
```

### injector.child([...modules])
* `modules` [function](#modulebind)

Creates a child injector, with new modules. Providers bound for the child injector
are only accessible from the child injector, but providers bound for a parent injector
are available through the child. Singletons bound to the child are scoped to the child.
Returns an `injector`
```
function add_injector(req,resp,next) {
  if(!req.injector) {
    req.injector = injector.child(requestModule);
  }
  next();
}
```

### *bind*(name).to(provider)
* `name` string
* `provider` [function](#providerinjectnameargs)

Specify a binding from the `name` to the `provider`.
```
function module (bind) {
    bind('my_service').to((inject) => new service(inject('database')));
}
```

### *module*(bind)
* `bind` [function](#bindnametoprovider)

A module is simply a function that takes a single argument, `bind`.

### *provider*([inject[,name[,...args]]])
* `inject` [function](#injectornameargs)
* `name` string
* `args` any

A provider is a function that takes an inject function, the name of the binding
to provide and any additional arguments that were passed when the binding was requested.
The inject function is an injector and can be used to fetch dependency from the provider.
