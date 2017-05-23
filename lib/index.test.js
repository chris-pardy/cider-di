var binder = require('./index.js');

test('define and get a function', () => {
  var c = binder((b) => {
    b.bind('test').to(() => 'test');
  });
  expect(c('test')).toBe('test');
});

test('define and get an instance', () => {
  var c = binder((b) => {
    b.bind('test').toInstance('test');
  });
  expect(c('test')).toBe('test');
});

test('define dependencies', () => {
  var c = binder((b) => {
    b.bind('test').toInstance(1);
    b.bind('test_dep').to(b.provides((test) => {
      return test + 1;
    }).bind('test'));
  });
  expect(c('test_dep')).toBe(2);
});

test('multiple dependencies', () => {
  var b = binder((b) => {
    b.bind('test1').to(() => 1);
  }, (b) => {
    b.bind('test2').to(b.provides((test1) => { return test1 + test1 }).bind('test1'));
  }, (b) => {
    b.bind('test3').to(b.provides((test1, test2) => { return test1 + test2 }).bind('test1','test2'));
  });
  expect(b('test3')).toBe(3);
});

test('aliasing', () => {
  var c = binder((b) => {
    b.bind('test1').to(() => 1);
  }, (b) => {
    b.bind('test').to('test1');
  });
  expect(c('test')).toBe(1);
})

test('children', () => {
  var c = binder((b) => {
    b.bind('test1').toInstance(1);
    b.bind('test2').to(b.provides((test1) => {return test1 + 1}).bind('test1'));
  });
  var c1 = c.child((b) => {
    b.bind('test1').toInstance(2);
  });
  expect(c('test2')).toBe(2);
  expect(c1('test2')).toBe(3);
})
