(function (W) {

  // helper functions

  var extend,
      uniqueId;

  var extend = function (parent, child) {
    var Surrogate = function () {};
    Surrogate.prototype = parent.prototype;

    child.prototype = new Surrogate();
    child.prototype.constructor = child;

    child.prototype.parent = parent.prototype;

    return child;
  };

  var uniqueId = function () {
    id += tick;
    return id;
  };

  // variables

  var refreshInterval,
      id,
      tick,

      localClock,
      localDebugger;

  // local

  refreshInterval = 1;
  tick            = 0.1;
  id              = 0;

  // classes

  var Dependable,
      LogisticMap,
      Clock,
      Debugger,
      Recorder,
      DependencyException;

  // DependencyException

  DependencyError = function (message) {
    Error.captureStackTrace(this, this.constructor);

    this.message  = message;
    this.name     = "DependencyError";
  };

  extend(Error, DependencyError);

  // Dependable

  Dependable = function () {};

  Dependable.prototype.dependsOn = function (name, dependency) {
    if (typeof this[name] !== "undefined")
      throw new DependencyError("cannot create dependency " + name);

    if (typeof dependency === "function")
      this[name] = new dependency;
    else
      this[name] = dependency;
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
    this.parent.constructor.call(this);

    this.dependsOn("Clock", new Clock(tick, refreshInterval));

    this.running  = false;
    this.data     = null;
    this.id       = uniqueId();
  };

  // extends Dependable
  extend(Dependable, Recorder);

  Recorder.prototype.sep = {
    "column": " ",
    "row": "\n",
  }

  Recorder.prototype.monitorList = ["t", "d", "u"];

  Recorder.prototype.monitorThese = function (monitorString) {
    this.monitorList = monitorString.split("");

    return this;
  };

  Recorder.prototype.monitorTypes = {
    "d": function (data) {
      return data;
    },
    "t": function () {
      return this.Clock.time;
    },
    "u": function () {
      return this.id;
    }
  };

  Recorder.prototype.capture = function (data) {
    for (type in this.monitorList) {
      this.data += this.monitorTypes[this.monitorList[type]].call(this, data) + this.sep.column;
    }

    this.data += this.sep.row;
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

  // Logistic Map

  LogisticMap = function (x, r) {
    this.parent.constructor.call(this);

    this.dependsOn("Recorder", Recorder);

    this.step     = x;
    this.r        = r;
  };

  // extends Dependable
  extend(Dependable, LogisticMap);

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
    "Recorder":     null,
    "Debugger":     localDebugger,
    "runner":       null,
    "bootstrap": function (x, r, str) {
      this.runner = new LogisticMap(x, r);

      this.runner.Recorder.monitorThese(str);
      this.Recorder = this.runner.Recorder;
    },
    "expose": function () {
      var key;

      for (key in this) if (W[key]) return false;
      for (key in this) W[key] = this[key];
    }
  };

  W.LogisticSuite.expose();

  W.setInterval(function () {
    if (W.LogisticSuite.runner !== null && W.LogisticSuite.Recorder.running) {
      W.LogisticSuite.runner.run();
      if (W.LogisticSuite.Recorder.Clock.time > 0.1 * 200)
        W.LogisticSuite.Recorder.off();
    }
  }, refreshInterval);

  W.addEventListener("keydown", function (e) {
    switch (e.keyCode) {
      case 32:
        if (W.LogisticSuite.Recorder) {
          if (W.LogisticSuite.Recorder.running)
            W.LogisticSuite.Recorder.off();
          else
            W.LogisticSuite.Recorder.on();
        }
        break;
    }
  }, false);

})(window);