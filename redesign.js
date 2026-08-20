(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const substitutions = {
    a: ["@", "^", "4"],
    b: ["8", "6"],
    e: ["3", "c"],
    g: ["9", "q"],
    h: ["#", "^", "n"],
    i: ["!", "|", "1"],
    l: ["1", "|", "/"],
    n: ["^", "h", "r"],
    o: ["0", "°", "()"],
    p: ["?", "9"],
    r: ["2", "k"],
    s: ["$", "5"],
    t: ["+", "7"],
    u: ["v", "µ"],
  };
  const colors = ["#7186b8", "#9a7188", "#648b82", "#a07f58", "#7e719f"];
  let rippleCount = 0;

  document.querySelectorAll(".minimal-home h1, .minimal-link").forEach((element) => {
    const label = element.textContent;
    const characters = [];
    const timers = new Map();

    element.classList.add("ripple-text");
    element.setAttribute("aria-label", label);
    element.replaceChildren();

    Array.from(label).forEach((character, index) => {
      const span = document.createElement("span");
      const isSpace = character === " ";
      span.className = `ripple-character${isSpace ? " ripple-character-space" : ""}`;
      span.textContent = isSpace ? "\u00a0" : character;
      span.setAttribute("aria-hidden", "true");
      element.append(span);
      characters.push(span);

      if (!isSpace) {
        span.addEventListener("pointerenter", () => startRipple(index));
      }
    });

    element.addEventListener("focus", () => {
      startRipple(Math.floor(characters.length / 2));
    });

    function startRipple(centerIndex) {
      rippleCount += 1;
      characters.forEach((span, index) => {
        const original = label[index];
        const alternatives = substitutions[original.toLowerCase()];
        if (!alternatives) {
          return;
        }

        const existingTimers = timers.get(span) || [];
        existingTimers.forEach(window.clearTimeout);
        span.classList.remove("is-rippling");
        span.textContent = original;

        const distance = Math.abs(index - centerIndex);
        const startTimer = window.setTimeout(() => {
          const choice = alternatives[(rippleCount + index) % alternatives.length];
          span.textContent = choice;
          span.style.setProperty("--ripple-color", colors[(rippleCount + index) % colors.length]);
          span.style.setProperty("--ripple-lift", `${distance % 2 === 0 ? -1 : 1}px`);
          span.classList.add("is-rippling");

          const endTimer = window.setTimeout(() => {
            span.textContent = original;
            span.classList.remove("is-rippling");
          }, 240 + distance * 18);
          timers.set(span, [endTimer]);
        }, distance * 48);
        timers.set(span, [startTimer]);
      });
    }
  });
})();
