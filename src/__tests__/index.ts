import cider from '../index';

interface ModuleShape {
  foo: string;
  bar: number;
}

interface AliasedShape extends ModuleShape {
  baz: string;
}

describe('dependency injection', () => {
  it('injects value as expected', () => {
    const injector = cider.createInjector<ModuleShape>({
      foo: ({bar}) => {
        let f = '';
        for(let i = 0; i < bar; i++) {
          f+= '.';
        }
        return f;
      },
      bar: cider.instance(3)
    });
    expect(injector.dependencies.foo).toBe('...');
  });

  it('injects providers', () => {
    const injector = cider.createInjector<ModuleShape>({
      foo: (_,{bar}) => {
        return `${typeof bar} ${bar()}`
      },
      bar: cider.instance(3)
    });
    expect(injector.dependencies.foo).toBe('function 3');
  })

  it('detects circular dependencies', () => {
    const injector = cider.createInjector<ModuleShape>({
      foo: ({bar}) => `${bar}`,
      bar: ({foo}) => Number(foo)
    });
    expect(() => injector.dependencies.foo).toThrow();
  });

  it ('singleton only creates the value once', () => {
    let counter = 0;
    const injector = cider.createInjector<ModuleShape>({
      foo: cider.instance('test'),
      bar: cider.singleton(() => counter++),
    });
    expect(injector.providers.bar()).toBe(0);
    expect(injector.providers.bar()).toBe(0);
  });

  it('tags are maintained on providers', () => {
    const injector = cider.createInjector<ModuleShape>({
      foo: (_,{bar}) => bar.tags.join(','),
      bar: cider.tagged(['test','value'], cider.instance(3))
    });
    expect(injector.dependencies.foo).toBe('test,value');
  })

  it('allows for aliasing', () => {
    const injector = cider.createInjector<AliasedShape>({
      foo: cider.instance('test'),
      bar: cider.instance(3),
      baz: cider.alias('foo')
    });
    expect(injector.dependencies.baz).toBe('test');
  })

})
