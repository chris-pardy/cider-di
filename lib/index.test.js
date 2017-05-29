var cider = require('./index.js');

describe('A standard injector', () => {
  it('binds and retrieves an instance', () => {
    const injector = cider(
      (bind) => {
        bind('test').to(cider.instance(1));
      }
    );
    expect(injector('test')).toBe(1);
  });

  it('binds a value and an alias', () => {
    const injector = cider(
      (bind) => {
        bind('test').to(cider.instance(1));
        bind('alias').to(cider.alias('test'));
      }
    );
    expect(injector('alias')).toBe(1);
  });

  it('binds a provider', () => {
    const injector = cider(
      (bind) => {
        bind('test').to(() => 1);
      }
    );
    expect(injector('test')).toBe(1);
  });

  it('binds a provider with dependencies', () => {
    const injector = cider(
      (bind) => {
        bind('test').to(cider.instance(1));
        bind('prov').to((inj) => inj('test'));
      }
    );
    expect(injector('prov')).toBe(1);
  });

  it('throws if a binding isnt found', () => {
    const injector = cider();
    expect(() => injector('test')).toThrow();
  });

  it ('throws on duplicate providers', () => {
    expect(() => cider(
        (bind) => {
          bind('test').to(cider.instance(1));
          bind('test').to(cider.instance(2));
        }
      )
    ).toThrow();
  });

  it('passes through args', () => {
    const injector = cider(
      (bind) => {
        bind('test').to((inj, counter) => {
          return 'test' + counter;
        });
      }
    );
    expect(injector('test', 2)).toBe('test2');
  });

  it('throws for circular dependencies', () => {
    const injector = cider(
      (bind) => {
        bind('a').to((inj) => inj('b'));
        bind('b').to((inj) => inj('a'));
      }
    );
    expect(() => injector('a')).toThrow();
  });

});

describe('An injector with multiple modules', () => {

  it('can access all declared bindings', () => {
    const injector = cider(
      (bind) => {
        bind('mod_a_1').to(cider.instance(1));
      },
      (bind) => {
        bind('mod_b_1').to(cider.alias('mod_a_1'));
      }
    );
    expect(injector('mod_b_1')).toBe(1);
  })

});

describe('A child injector', () => {

  it ('can access parent bindings', () => {
    const injector = cider(
      (bind) => {
        bind('test').to(cider.instance(1));
      }
    ).child();
    expect(injector('test')).toBe(1);
  });

  it ('can depend on parent bindings', () => {
    const injector = cider(
      (bind) => {
        bind('test').to(cider.instance(1));
      }
    ).child(
      (bind) => {
        bind('alias').to(cider.alias('test'));
      }
    );
    expect(injector('alias')).toBe(1);
  });

  it('cant override parent bindings', () => {
    const injector = cider(
      (bind) => {
        bind('test').to(cider.instance(2));
      }
    );
    expect(() => {
      injector.child(
        (bind) => {
          bind('test').to(cider.instance(1));
        }
      );
    }).toThrow();
  });

  it ('will not push bindings to parent', () => {
    const injector = cider(
      (bind) => {
        bind('test').to(cider.instance(2));
      }
    );
    const child = injector.child(
      (bind) => {
        bind('missing').to(cider.instance(1));
      }
    );
    expect(() => injector('missing')).toThrow();
  });

  // This behavior is important since
  it('cannot be accessed by parent', () => {
    const injector = cider(
      (bind) => {
        bind('test').to(cider.alias('missing'));
      }
    ).child(
      (bind) => {
        bind('missing').to(cider.instance(1));
      }
    );
    expect(() => injector('test')).toThrow();
  });

});

describe('a singleton', () => {
  it('will return the same value with each invocation', () => {
    let incrementor = 1;
    const provider = cider.singleton(() => incrementor++);
    const injector = cider();
    const v1 = provider(injector);
    const v2 = provider(injector);
    expect(v1).toBe(v2);
  });

  it('will be different for different children', () => {
    let incrementor = 1;
    const provider = cider.singleton(() => incrementor++);
    const injector = cider();
    const v1 = provider(injector.child());
    const v2 = provider(injector.child());
    expect(v1).toBe(1);
    expect(v2).toBe(2);
  });

  it('will lazy initalize', () => {
    let incrementor = 1;
    const provider = cider.singleton(() => incrementor);
    const injector = cider();
    incrementor = 3;
    expect(provider(injector)).toBe(3);
  });

  it('will initalize at defined scope', () => {
    let incrementor = 1;
    const injector = cider(
      (bind) => {
        bind('test').to(cider.singleton(() => incrementor++));
      }
    );
    const child1 = injector.child();
    expect(child1('test')).toBe(1);
    const child2 = injector.child();
    expect(child2('test')).toBe(1);
    expect(injector('test')).toBe(1);
  });

  it('both singletons are unique', () => {
    let incrementor = 1;
    const injector = cider(
      (bind) => {
        bind('test1').to(cider.singleton(() => incrementor++));
        bind('test2').to(cider.singleton(() => incrementor++));
      });
    expect(injector('test1')).toBe(1);
    expect(injector('test2')).toBe(2);
    expect(injector('test1')).toBe(1);
    expect(injector('test2')).toBe(2);
  });

});

describe('Overriden modules', () => {
  it('doesnt cause name conflicts', () => {
    const injector = cider(
      cider.override(
        (bind) => {
          bind('test').to(cider.instance(1));
        }
      ).with(
        (bind) => {
          bind('test').to(cider.instance(2));
        }
      )
    );
    expect(injector('test')).toBe(2);
  });

  it('exposes non-overriden values', () => {
    const injector = cider(
      cider.override(
        (bind) => {
          bind('test1').to(cider.instance(2));
          bind('test2').to(cider.instance(2));
        }
      ).with(
        (bind) => {
          bind('test1').to(cider.instance(1));
        }
      )
    );
    expect(injector('test2')).toBe(2);
  });

  it('can depend on overriden values', () => {
    const injector = cider(
      cider.override(
        (bind) => {
          bind('test1').to(cider.instance(1));
        }
      ).with (
        (bind) => {
          bind('test_override').to(cider.alias('test1'));
        }
      )
    );
    expect(injector('test_override')).toBe(1);
  });

  it('can be depended on by overriden values', () => {
    const injector = cider(
      cider.override(
        (bind) => {
          bind('test').to(cider.alias('test_value'))
        }
      ).with(
        (bind) => {
          bind('test_value').to(cider.instance(1));
        }
      )
    );
    expect(injector('test')).toBe(1);
  });

  it('can have a dependency overriden', () => {
    const injector = cider(
      cider.override(
        (bind) => {
          bind('test').to(cider.alias('test_value'));
          bind('test_value').to(cider.instance(1));
        }
      ).with(
        (bind) => {
          bind('test_value').to((inj) => 'test_value');
        }
      )
    );
    expect(injector('test')).toBe('test_value');
  });

});

describe('Multiple bindings', () => {
  it ('list returns a list', () => {
    const injector = cider(
      (bind) => {
        bind('1').to(cider.instance(1));
        bind('2').to(cider.instance(2));
        bind('num_list').to(cider.list([
          cider.alias('1'),
          cider.alias('2')
        ]));
      }
    );
    expect(injector('num_list')).toEqual([
      1,
      2
    ]);
  });

  it('obj returns an object', () => {
    const injector = cider(
      (bind) => {
        bind('1').to(cider.instance(1));
        bind('2').to(cider.instance(2));
        bind('num_obj').to(cider.obj({
          test1: cider.alias('1'),
          test2: cider.alias('2')
        }));
      }
    );
    expect(injector('num_obj')).toEqual({
      test1: 1,
      test2: 2
    });
  });

});

describe('extension spi', () => {
  it('is invoked on injector construction', () => {
    let was_invoked = false;
    cider(
      (bind) => {
        bind.extension(() => {
          was_invoked = true;
        });
      }
    );
    expect(was_invoked).toBe(true);
  });

  it('can access providers', () => {
    const p1 = cider.instance(1);
    const p2 = cider.instance(2);
    const injector = cider(
      (bind) => {
        bind('test1').to(p1);
        bind('test2').to(p2);
      },
      (bind) => {
        bind.extension(({providers}) => {
          expect(providers.test1).toBe(p1);
          expect(providers.test2).toBe(p2);
        });
      }
    );
  });

  it('can access modules', () => {
    const m1 = (bind) => bind('test1').to(cider.instance(1));
    const m2 = (bind) => bind('test2').to(cider.instance(2));
    cider(
      m1, m2,
      (bind) => {
        bind.extension(({modules}) => {
          expect(modules[0]).toBe(m1);
          expect(modules[1]).toBe(m2);
        });
      }
    )
  });

  it('can update provider', () => {
    const injector = cider(
      (bind) => {
        bind('test').to(cider.instance(1));
        bind.extension(({update_provider}) => {
          update_provider('test', cider.instance(2));
        });
      }
    );
    expect(injector('test')).toBe(2);
  });

  it('can create provider', () => {
    const injector = cider(
      (bind) => {
        bind.extension(({update_provider}) => {
          update_provider('test', cider.instance(1));
        });
      }
    );
    expect(injector('test')).toBe(1);
  });

  it('can remove provider', () => {
    const injector = cider(
      (bind)=> {
        bind('test').to(cider.instance(1));
        bind.extension(({update_provider}) => {
          update_provider('test');
        });
      }
    );
    expect(() => injector('test')).toThrow();
  });

  it('deletes from parent on child', () => {
    const injector = cider(
      (bind) => {
        bind('test').to(cider.instance(1));
      }
    ).child(
      (bind) => {
        bind.extension(({update_provider}) => {
          update_provider('test');
        });
      }
    );
    expect(() => injector('test')).toThrow();
  });

  it('doesnt remove from parent on child', () => {
    const injector = cider(
      (bind) => {
        bind('test').to(cider.instance(1));
      }
    );
    const child = injector.child(
      (bind) => {
        bind.extension(({update_provider}) => {
          update_provider('test');
        });
      }
    );
    expect(injector('test')).toBe(1);
  });

  it('can access parent modules on child', () => {
    const m1 = (bind) => bind('test1').to(cider.instance(1));
    cider(m1).child(
      (bind) => {
        bind.extension(({modules}) => {
          expect(modules[0]).toBe(m1);
        });
      }
    );
  });

  it('is invoked with each child', () => {
    var invokeCount = 0;
    cider(
      (bind) => {
        bind.extension(() => {
          invokeCount++;
        });
      }
    ).child();
    expect(invokeCount).toBe(2);
  })

});
