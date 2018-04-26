export interface Mapping {
  [name: string]: any
}

export interface Binding<T extends Mapping,R> {
  (
    dependencies: Dependencies<T>,
    providers: Providers<T>,
    context: Context
  ): R;
  tags?: string[];
}

export interface Provider<R> {
  (): R;
  tags: string[];
}

export type Module<T extends Mapping> = {
  [P in keyof T]: Binding<T, T[P]>;
}

export interface Context {
  [key: string]: any;
};

export type Dependencies<T extends Mapping> = {
  [P in keyof T]: T[P];
}

export type Providers<T extends Mapping> = {
  [P in keyof T]: Provider<T[P]>;
}

export interface Injector<T extends Mapping> {
  dependencies: Dependencies<T>;
  providers: Providers<T>;
  context: Context;
}

export function createInjector<T extends Mapping>(mod: Module<T>): Injector<T> {
  const dependencies: any = {};
  const providers: any = {};
  const context: Context = {};
  const injecting: {[P in keyof T]?: number} = {};
  let injectingCounter = 0;
  Object.keys(mod).forEach(
    key => {
      const binding = mod[key];
      providers[key] = function(this: any) {
        if (injecting[key]) {
          const graph = Object.keys(injecting)
          .map(key => ({
            name: key,
            ord: injecting[key as keyof T] as number|undefined
          }))
          .filter(({ord}) => ord !== undefined)
          .sort((l, r) => (l.ord || 0) - (r.ord || 0))
          .map(({name}) => name)
          .join('=>');
          throw new Error(`Detected Circular Dependency ${graph}=>${key}`);
        }
        injecting[key] = injectingCounter++;
        const r = binding.call(this, dependencies, providers, context);
        injecting[key] = undefined;
        injectingCounter--;
        return r;
      }
      providers[key].tags = binding.tags || [];
      Object.defineProperty(
        dependencies,
        key,
        {
          enumerable: true,
          get: providers[key]
        }
      );
  });
  return {
    dependencies: dependencies as Dependencies<T>,
    providers: providers as Providers<T>,
    context
  };
}

let singletonId = 0;
export function singleton<T extends Mapping,R>(
  binding: Binding<T,R>
): Binding<T,R> {
  const id = `singleton_${singletonId++}`;
  const s: Binding<T,R> = function(
    this: any,
    dependencies: Dependencies<T>,
    providers: Providers<T>,
    context: Context
  ): R {
    if (context[id] === undefined) {
      context[id] = binding.call(this,dependencies,providers,context);
    }
    return context[id];
  }
  s.tags = binding.tags;
  return s;
}

export function instance<V>(v: V): Binding<Mapping, V> {
  return () => {
    return v;
  }
}

export function tagged<T extends Mapping, R>(
  tags: string[],
  binding: Binding<T,R>
): Binding<T,R> {
  binding.tags = (binding.tags || []).concat(tags);
  return binding;
}

export function alias<T extends Mapping, K extends keyof T>(
  name: K
): Binding<T,T[K]> {
  return function(_,providers: Providers<T>): T[K] {
    return providers[name]();
  }
}

export default {
  createInjector,
  singleton,
  instance,
  tagged,
  alias
}
