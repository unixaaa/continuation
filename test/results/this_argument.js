var Cons, obj;
Cons = function () {
  this.field = 1;
  this.showWithDelay = function () {
    var callback, delay, i;
    callback = arguments[arguments.length - 1];
    delay = arguments[arguments.length - 2];
    setTimeout(function (arguments) {
      i = 0;
      while (i < arguments.length - 2) {
        console.log(arguments[i]);
        i++;
      }
      console.log(this.field);
      callback();
    }.bind(this, arguments), delay);
  };
};
obj = new Cons();
obj.showWithDelay(10, function (arguments) {
  obj.showWithDelay('a', 'b', 10, function (arguments) {
  }.bind(this, arguments));
}.bind(this, arguments));
/* Generated by Continuation.js v0.1.6 */