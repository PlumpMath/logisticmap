(function (W) {

  // helper functions

  var extend = function (parent, child) {
    var Surrogate = function () {};
    Surrogate.prototype = parent.prototype;

    child.prototype = new Surrogate();
    child.prototype.constructor = child;

    child.parent = parent.prototype;

    return child;
  };

  // variables

  var refreshInterval,

      localClock,
      localDebugger;

  // local

  refreshInterval = 100;

  // classes

  var Dependable,
      LogisticMap,
      Clock,
      Debugger,
      Recorder,
      DependencyException;

  // DependencyException

  DependencyException = function (message) {
    this.message  = message;
    this.name     = "DependencyException";
  };

  // Dependable

  Dependable = function () {

  };

  Dependable.prototype.dependencies = {};
  Dependable.prototype.dependsOn = function (name, obj) {
    if (this.dependencies[name] || this[name])
      throw new DependencyException("Dependency namespace [" + name + "] already exists.");
    
    this[name] = this.dependencies[name] = obj;
  };

  // Clock

  Clock = function (tick, interval) {
    W.setInterval(function (Clock, tick) {
      return function () {
        Clock.time += tick;
      }
    }(this, tick), interval);
  };

  Clock.prototype.time = 0;
  Clock.prototype.reset = function () {
    this.time = 0;
  };

  // Recorder

  Recorder = function () {
    this.running  = false;
    this.data     = null;
  };

  // extends Dependable
  extend(Dependable, Recorder);

  // set dependencies

  Recorder.prototype.dependsOn("Clock", new Clock(0.1, refreshInterval));

  Recorder.prototype.capture = function (data) {
    this.data += this.Clock.time + " " + data + "\n";
  };

  Recorder.prototype.on = function () {
    W.console.log("Recorder::on");

    this.reset();

    return this.running = true;
  };

  Recorder.prototype.off = function () {
    W.console.log(this.data);
    W.console.log("Recorder::off");
    return this.running = false;
  };

  Recorder.prototype.reset = function () {
    this.data = "";
    this.Clock.reset();
  };

  localRecorder = new Recorder();

  // Logistic Map

  LogisticMap = function (x, r) {
    this.step     = x;
    this.r        = r;
  };

  // extends Dependable
  extend(Dependable, LogisticMap);

  // set dependencies

  LogisticMap.prototype.dependsOn("Recorder", localRecorder);

  LogisticMap.prototype.solve = function (x) {
    return this.r * x * (1 - x);
  };

  LogisticMap.prototype.run = function () {
    this.Recorder.capture(this.step);
    this.step = this.solve(this.step);
  };

  // Debugger

  Debugger = function () {};

  Debugger.prototype.running = false;
  Debugger.prototype.alert = function (from, message) {
    if (this.running) {
      W.console.log("Debugger::alert");
      W.console.log(message);
    }
  };

  Debugger.prototype.on = function () {
    return this.running = true;
  };

  Debugger.prototype.off = function () {
    return this.running = false;
  };

  localDebugger = new Debugger();

  // local to global

  W.LogisticSuite = {
    "LogisticMap":  LogisticMap,
    "Recorder":     localRecorder,
    "Debugger":     localDebugger,
    "runner":       null,
    "expose": function () {
      var key;

      for (key in this) if (W[key]) return false;
      for (key in this) W[key] = this[key];
    }
  };

  W.LogisticSuite.expose();

  W.setInterval(function () {
    if (W.LogisticSuite.Recorder.running && W.LogisticSuite.runner !== null) W.LogisticSuite.runner.run();
  }, refreshInterval);

  W.addEventListener("keydown", function (e) {
    switch (e.keyCode) {
      case 32:
        if (W.LogisticSuite.Recorder.running)
          W.LogisticSuite.Recorder.off();
        else
          W.LogisticSuite.Recorder.on();
        break;
    }
  }, false);

})(window);