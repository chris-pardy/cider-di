Super simple dependency injection for javascript.

## Standard Use
Import cider:
`var cider = require('cider-di');`

Then create an injector with specified module functions:
`var injector = cider(... module functions ...);`

Then get dependencies from the injector:
`var service = injector('my_service');`

Use module functions to define bindings:
```
function module(bind) {
  bind('my_service').to(... providers ...);
}
```

Providers take an inject, name, and pass through args:
```
function my_service_provider(injector, name, other_arg) {
  var other_service = injector('your_service');
  return my_service_constructor(other_arg, other_service);
}
```

Create a child injector using the child function:
`var child_injector = injector.child(... child module functions ...);`

A child injector will inherit bindings but won't expose binding to the parent.

## Provider Helpers
Sometimes you don't want to write out a long provider function, instead use a helper:

Alias one binding to another:
`bind('my_service').to(cider.alias('your_service'));`

Bind to an instance value:
`bind('my_service').to(cider.instance(service_instance));`

Turn a provider into a singleton:
`bind('my_service').to(cider.singleton(instance_provider));`

Get a list of values:
`bind('services').to(cider.list([cider.alias('my_service'), cider.alias('your_service')]));`

Get an object with values:
`bind('service').to(cider.obj({my: cider.alias('my_service'), your: cider.alias('your_service')}));`

## Overriding bindings
You can create a binding override by specifying overridden modules:
`var injector = cider(cider.override(... module functions ...).with(... module functions... ));`
