(function filterNg0953ConsoleNoise() {
  var originalWarn = console.warn;
  console.warn = function patchedConsoleWarn() {
    var first = arguments[0];
    if (
      typeof first === 'string' &&
      first.indexOf('NG0953') !== -1 &&
      first.indexOf('OutputRef') !== -1
    ) {
      return;
    }
    return originalWarn.apply(console, arguments);
  };
})();
