(() => {
  const authorLoginHotspot = document.querySelector("#authorLoginHotspot");
  const musicAuthorLoginHotspot = document.querySelector("#musicAuthorLoginHotspot");
  const photoAuthorLoginHotspot = document.querySelector("#photoAuthorLoginHotspot");
  const homeAuthorLoginHotspot = document.querySelector("#homeAuthorLoginHotspot");
  [
    authorLoginHotspot,
    musicAuthorLoginHotspot,
    photoAuthorLoginHotspot,
    homeAuthorLoginHotspot,
  ].forEach((hotspot) => {
    hotspot.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("terminal:author-login"));
    });
  });

  const aboutLink = document.querySelector('a[href="#about"]');
  const aboutPanel = document.querySelector("#aboutPanel");

  function setAboutOpen(isOpen) {
    aboutLink.setAttribute("aria-expanded", String(isOpen));
    aboutPanel.classList.toggle("is-visible", isOpen);
    aboutPanel.setAttribute("aria-hidden", String(!isOpen));
  }

  aboutLink.addEventListener("click", (event) => {
    event.preventDefault();
    const isOpen = !aboutPanel.classList.contains("is-visible");
    if (isOpen) {
      window.history.pushState(null, "", "#about");
    } else {
      window.history.pushState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    setAboutOpen(isOpen);
  });

  window.addEventListener("hashchange", () => {
    setAboutOpen(window.location.hash === "#about");
  });
  window.addEventListener("popstate", () => {
    setAboutOpen(window.location.hash === "#about");
  });
  setAboutOpen(window.location.hash === "#about");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const substitutions = {
    a: ["@", "^", "4"],
    b: ["8", "6"],
    e: ["3", "c"],
    g: ["9", "q"],
    h: ["^", "n"],
    i: ["!", "|", "1"],
    l: ["1", "|", "/"],
    m: ["w", "ɯ"],
    n: ["^", "h", "r"],
    o: ["0", "°"],
    p: ["?", "9"],
    r: ["2", "k"],
    s: ["$", "5"],
    t: ["+", "7"],
    u: ["v", "µ"],
  };
  const colors = ["#f4c430", "#ff9f1c", "#ff5a36", "#e83f6f", "#9b5de5"];
  let rippleCount = 0;
  const loadingAnimations = new Map();

  function stopLoadingAnimation(element) {
    const animation = loadingAnimations.get(element);
    if (!animation) {
      return;
    }
    window.clearInterval(animation.interval);
    animation.timers.forEach(window.clearTimeout);
    loadingAnimations.delete(element);
  }

  function startLoadingAnimation(element) {
    stopLoadingAnimation(element);
    const label = element.textContent;
    const characters = [];
    const timers = new Set();
    let centerIndex = 0;

    element.setAttribute("aria-label", label);
    element.replaceChildren();
    Array.from(label).forEach((character) => {
      const span = document.createElement("span");
      span.className = "loading-character";
      span.textContent = character;
      span.setAttribute("aria-hidden", "true");
      element.append(span);
      characters.push(span);
    });

    function ripple() {
      rippleCount += 1;
      characters.forEach((span, index) => {
        const original = label[index];
        const distance = Math.abs(index - centerIndex);
        const startTimer = window.setTimeout(() => {
          timers.delete(startTimer);
          const alternatives = substitutions[original.toLowerCase()];
          span.textContent = alternatives
            ? alternatives[(rippleCount + index) % alternatives.length]
            : original;
          span.style.setProperty("--ripple-color", colors[(rippleCount + index) % colors.length]);
          span.classList.add("is-rippling");
          const endTimer = window.setTimeout(() => {
            timers.delete(endTimer);
            span.textContent = original;
            span.classList.remove("is-rippling");
          }, 300);
          timers.add(endTimer);
        }, distance * 42);
        timers.add(startTimer);
      });
      centerIndex = (centerIndex + 2) % characters.length;
    }

    ripple();
    const interval = window.setInterval(ripple, 760);
    loadingAnimations.set(element, { interval, timers });
  }

  window.addEventListener("redesign:loading-status", (event) => {
    if (event.detail.isLoading) {
      startLoadingAnimation(event.detail.element);
    } else {
      stopLoadingAnimation(event.detail.element);
    }
  });
  document.querySelectorAll(".blog-message.is-loading").forEach(startLoadingAnimation);

  document.querySelectorAll(".minimal-home h1, .minimal-link").forEach((element) => {
    const label = element.textContent.trim();
    const characters = [];
    const timers = new Map();
    let lastRippleAt = 0;

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
    element.addEventListener("redesign:ripple", () => {
      startRipple(Math.floor(characters.length / 2));
    });

    window.addEventListener("redesign:home-visible", () => {
      timers.forEach((activeTimers) => {
        activeTimers.forEach(window.clearTimeout);
      });
      timers.clear();
      characters.forEach((span, index) => {
        span.textContent = label[index] === " " ? "\u00a0" : label[index];
        span.classList.remove("is-rippling");
      });
    });

    function startRipple(centerIndex) {
      const now = Date.now();
      if (now - lastRippleAt < 110) {
        return;
      }
      lastRippleAt = now;
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
          span.style.setProperty("--ripple-lift", `${distance % 2 === 0 ? -0.5 : 0.5}px`);
          span.classList.add("is-rippling");

          const endTimer = window.setTimeout(() => {
            span.textContent = original;
            span.classList.remove("is-rippling");
          }, 280 + distance * 20);
          timers.set(span, [endTimer]);
        }, distance * 56);
        timers.set(span, [startTimer]);
      });
    }
  });
})();
