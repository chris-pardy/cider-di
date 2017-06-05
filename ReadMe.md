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

## API
<a name="cider"><h3>cider([...modules])</h3></a>
* `modules` [function](#module)

Takes 0 or more functions which act as module definitions, each module is passed
an argument `bind` which is used to declare dependencies. Returns an [`injector`](#injector).

<a name="singleton"><h3>cider.singleton(provider)</h3></a>
* `provider` [function](#provider)

Given a provider function ensures that the function is only called once for each
injector instance that it's used from. Returns a [`provider`](#provider).
```
bind('my_service').to(cider.singleton((inject) => new service(inject('dependency'))));
```

<a name="instance"><h3>cider.instance(value)</h3></a>
* `value` any

Given a value create a provider that will provide that value. Returns a [`provider`](#provider).
```
bind('should_run').to(cider.instance(false));
```

<a name="alias"><h3>cider.alias(name)</h3></a>
* `name` string

Given a name creates a provider that provides the value bound to that name.
This acts as a way to alias bindings. Returns a [`provider`](#provider).
```
bind('database').to(cider.alias('postgres'));
```

<a name="list"><h3>cider.list(providers)</h3></a>
* `providers` array of [provider](#provider)

Given an array of providers creates a provider that returns a list of the bound
values, maintaining order. Returns a [`provider`](#provider).
```
bind('options').to(cider.list([
  cider.alias('should_run'),
  cider.alias('is_production')
]));
```

<a name="obj"><h3>cider.obj(providers)</h3></a>
* `providers` Object of [provider](#provider)

Given an object containing a mapping of keys to providers, creates a provider that
returns an object with the bound values mapped to the keys. Returns a [`provider`](#provider).
```
bind('options').to(cider.obj({
    should_run: cider.alias('should_run'),
    is_production: cider.alias('is_production')
}));
```

<a name="override"><h3>cider.override([...override_modules]).with([...with_modules])</h3></a>
* `override_modules` [function](#module)
* `with_modules` [function](#module)

Given 2 sets of modules allows `with_modules` to define bindings that have already
been defined by the `override_modules` overriding these values. Returns a [`module`](#module).
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

<a name="injector"><h3>injector(name[,...args])</h3></a>
* `name` string
* `args` any

Given a name resolve the provider bound to the name and invoke it with the given args.
Returns the result of the provider.
```
const db = injector('database',table_name);
```

<a name="child"><h3>injector.child([...modules])</h3></a>
* `modules` [function](#module)

Creates a child injector, with new modules. Providers bound for the child injector
are only accessible from the child injector, but providers bound for a parent injector
are available through the child. Singletons bound to the child are scoped to the child.
Returns an [`injector`](#injector).
```
function add_injector(req,resp,next) {
  if(!req.injector) {
    req.injector = injector.child(requestModule);
  }
  next();
}
```

<a name="bind"><h3><em>bind</em>(name).to(provider)</h3></a>
* `name` string
* `provider` [function](#provider)

Specify a binding from the `name` to the `provider`.
```
function module (bind) {
    bind('my_service').to((inject) => new service(inject('database')));
}
```

<a name="module"><h3><em>module</em>(bind)</h3></a>
* `bind` [function](#bind)

A module is simply a function that takes a single argument, `bind`.

<a name="provider"><h3><em>provider</em>([inject[,...args]])</h3></a>
* `inject` [function](#injector)
* `args` any

A provider is a function that takes an inject function and any additional arguments
that were passed when the binding was requested. The inject function is an injector
and can be used to fetch dependency from the provider.

## SPI
The SPI provides for extensions to cider.

<a name="extension"><h3><em>bind</em>.extension(extension)</h3></a>
* `extension` [function](#extension_function)

Provides a hook for registering an extension to cider.
```
function module(bind) {
  bind.extension(function(extension_point) {
    ...
  });
}
```

<a name="extension_function"><h3><em>extension_function</em>(extension_point)</h3></a>
* `extension_point` Object [ExtensionPoint](#extension_point)

An extension function is invoked when the injector is constructed. It's passed an extension point
object that provides hooks for extensions.

<a name="extension_point"><h3>ExtensionPoint</h3></a>
<a name="extension_point_providers"><h4>ExtensionPoint.providers</h4></a>
An object containing the name to provider mapping for injector and it's parents.

<a name="extension_point_modules"><h4>ExtensionPoint.modules</h4></a>
An object containing the modules that were registered for the injector and it's parents.

<a name="extension_point_update_provider"><h4>ExtensionPoint.update_provider(name[,provider])</h4></a>
* `name` string
* `provider` [function](#provider)

Update the provider binding. If a provider is given then the binding is either created, or updated.
If no provider is provided then the provider is removed.
```
function module(bind) {
  bind.extension(function(extension_point){
    extension_point.update_provider('update_or_replace',cider.instance(true));
    extension_point.update_provider('delete');
  });
}
```

### SPI and child injectors
An extension is invoked once for each injector construction, therefore an extension may be invoked multiple times if child injectors are created. 
