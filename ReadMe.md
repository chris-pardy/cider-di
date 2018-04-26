[![Build Status](https://travis-ci.org/chris-pardy/cider-di.svg?branch=master)](https://travis-ci.org/chris-pardy/cider-di)
# cider
Super simple dependency inversion/injection for javascript.

## Installation
```npm install --save cider-di```

## Use
```
const service = require('./service');
const database = require('./database');
const cider = require('cider-di');
const injector = cider.createInjector({
  service: cider.singleton(
    ({database}) => new service(database)
  ),
  database: cider.singleton(
    () => new database()
  )
});
const my_service = injector.dependencies.service;
```
Cider uses named bindings to create a map of name to *binding* function.
Each *binding* function is supplied 3 values.
* dependencies - an object where each key corresponds to provided value.
* providers - an object where each key corresponds to a *provider*.
* context - a javascript object that can be used for providers to communicate with each other.

## Components
### cider.createInjector(module)
* `module` [function](#Module)

Returns [`injector`](#Injector)

Takes 0 or more functions which act as module definitions, each module is passed an argument `bind` which is used to declare dependencies.

### cider.singleton(binding)
* `binding` [binding](#Bindingdependenciesproviderscontext)

Returns [binding](#Bindingdependenciesproviderscontext)

Given a binding function ensures that the function is only called once for each injector instance that it's used from.
```
my_service: cider.singleton(
  ({dependency}) => new service(dependency)
)
```

### cider.instance(value)
* `value` any

Returns [`binding`](#Bindingdependenciesproviderscontext)

Given a value create a binding that will provide that value.
```
should_run: cider.instance(false)
```

### cider.alias(name)
* `name` string

Returns [`binding`](#Bindingdependenciesproviderscontext)

Given a name creates a binding that provides the value bound to that name. This acts as a way to alias bindings. Note that tags won't be transferred.
```
database: cider.alias('postgres')
```

### cider.tagged(tags, binding)
* `tags` string[],
* binding [`binding`](#Bindingdependenciesproviderscontext)

Returns [`binding`](#Bindingdependenciesproviderscontext)

Given a set of tags and a binding, returns a binding with the given set of tags appended to the tags on the given binding.
```
  stripe_processor: cider.tagged(
    ['payment_processor'],
    cider.singleton(
      () => new Stripe()
    )
  )
```

### Module
#### properties
* [`name` string] [`binding`](#Bindingdependenciesproviderscontext)

A module is a standard javascript object with a name mapped to a binding.
```
module.exports = {
  database: () => new Database(),
  service: cider.singleton(
    ({database}) => new Service(database)
  )
}
```

### Binding(dependencies,providers,context)
* `dependencies` [object](#Dependencies)
* `providers` [object](#Providers)
* context object
#### properties
* `tags` optional string[]

Returns any

A binding is given 3 values that can be used to get dependencies, and retuns the value of the dependency.
```
 some_binding: ({database},{query}, context) => {
   if (context.should_run_query) {
     return database.execute(query());
   }
   return null;
 }
```

### Dependencies
#### properties
* [`name` string] any

Map of binding name to value;

### Providers
#### properties
* [`name` string] [`provider`](#provider)

Map of binding name to provider;

### Injector
#### properties
* `dependencies` [object](#Dependencies)
* `providers` [object](#Providers)
* `context` object

Injectors hold all the dependency mappings.
```
const db = injector.dependencies.database;
```

### provider()
#### properties
* `tags` string[]

Returns any

A function that when called supplies the value as a result of invoking the corresponding binding. The tags (if any) that were defined by the corresponding binding will be available on the provider

## Philosophy
While cider borrowers some terminology from popular Java DI frameworks like Guice it's designed from the ground up to take advantage of javascript features. Primarily this takes the form of using object destructuring in function arguments rather than attempting to provide some form of function annotation.

The [`dependencies`](#Dependencies) parameter that is passed to a binding uses property getters to lazily resolve the dependency chain. Cider does simple cycle detection whenever a dependency is being resolved, this prevents cases of circular dependencies.

The [`providers`](#Providers) parameter contains the same keys as `dependencies` however each value is a function. The result of invoking the function is the same as getting the value of a property on `dependencies`. A Provider should be used whenever possible to lazily initialize a dependency, doing so allows for what would otherwise be unacceptable circular references.
