var a, err;
(function (_$cont) {
  try {
    a = 1;
    err = 'some-error';
    setTimeout(function (arguments) {
      try {
        JSON.parse('invalid-json');
        if (err) {
          throw err;
        }
        a = 2;
        _$cont();
      } catch (_$err) {
        _$cont(_$err);
      }
    }.bind(this, arguments), 200);
  } catch (_$err) {
    _$cont(_$err);
  }
}(function (err) {
  if (err !== undefined) {
    console.log(err);
  }
  console.log('Done');
}));
/* Generated by Continuation.js v0.1.6 */