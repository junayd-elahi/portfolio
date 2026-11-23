/* Prototype layer: builds the typing-rhythm bars on the keystroke cover. */
(function () {
  document.querySelectorAll('.pat--bars').forEach(function (p) {
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var k = 0; k < 30; k++) {
      var b = document.createElement('i');
      b.style.setProperty('--h', (14 + rnd() * 70) + '%');
      b.style.setProperty('--h2', (10 + rnd() * 80) + '%');
      b.style.setProperty('--d', (-rnd() * 1.4).toFixed(2) + 's');
      p.appendChild(b);
    }
  });
})();
