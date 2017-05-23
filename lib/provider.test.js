var provider = require('./provider.js');

test ('__type is provider', () => {
  var p = provider(() => {});
  expect(p.__type).toBe('provider');
});

test('bind uses string names', () => {
  var p = provider(() => {}).bind('test1', 'test2');
  expect(p.dependencies).toEqual(['test1','test2']);
});

test('singleton uses the same instance', () => {
  var p = provider((a, b) => {
    return { a: a, b: b }
  }).singleton();
  expect(p.factory(1,2)).toBe(p.factory(3,4));
});
