const aboutDialog = document.querySelector("#aboutDialog");
const openAboutButton = document.querySelector("#openAbout");
const closeAboutButton = document.querySelector("#closeAbout");
const whyDialog = document.querySelector("#whyDialog");
const openWhyButton = document.querySelector("#openWhy");
const closeWhyButton = document.querySelector("#closeWhy");

function setupDialog(dialog, openButton, closeButton) {
  openButton.addEventListener("click", () => {
    dialog.showModal();
  });

  closeButton.addEventListener("click", () => {
    dialog.close();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}

if (aboutDialog && openAboutButton && closeAboutButton) {
  setupDialog(aboutDialog, openAboutButton, closeAboutButton);
}

if (whyDialog && openWhyButton && closeWhyButton) {
  setupDialog(whyDialog, openWhyButton, closeWhyButton);
}

document.querySelectorAll("[data-scroll-modern]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (window.parent !== window) {
      event.preventDefault();
      window.parent.postMessage("scroll-modern", window.location.origin);
    }
  });
});

const terminalWindow = document.querySelector(".terminal-window");

if (terminalWindow) {
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const savedTheme = localStorage.getItem("terminalThemePreference");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const themeChoices = ["system", "light", "dark"];
  let themePreference = themeChoices.includes(savedTheme) ? savedTheme : "light";
  let activeTheme = "dark";

  function applyTheme(preference) {
    themePreference = preference;
    activeTheme = preference === "system" ? (systemTheme.matches ? "dark" : "light") : preference;
    document.body.dataset.theme = activeTheme;
    localStorage.setItem("terminalThemePreference", preference);
    themeColor.content = activeTheme === "dark" ? "#101216" : "#d9dce3";
  }

  systemTheme.addEventListener("change", () => {
    if (themePreference === "system") {
      applyTheme("system");
    }
  });
  applyTheme(themePreference);

  const output = document.querySelector("#terminalOutput");
  const form = document.querySelector("#terminalForm");
  const input = document.querySelector("#terminalInput");
  const commandPalette = document.querySelector("#commandPalette");
  const modernStage = document.querySelector("#modernStage");
  const retroStage = document.querySelector("#retroStage");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const commandDefinitions = [
    { name: "/about", description: "Print my profile" },
    { name: "/github", description: "Show my GitHub profile" },
    { name: "/linkedin", description: "Show my LinkedIn profile" },
    { name: "/email", description: "Open a new email draft" },
    { name: "/theme", description: "Set theme [light | dark | system]" },
    { name: "/clear", description: "Clear terminal output" },
    { name: "/help", description: "List available commands" },
    { name: "/fun", description: "Find out what happens..." },
  ];
  const themeDefinitions = [
    { name: "light", value: "/theme light", description: "Use the light terminal theme" },
    { name: "dark", value: "/theme dark", description: "Use the dark terminal theme" },
    { name: "system", value: "/theme system", description: "Follow the operating system" },
  ];
  const commandHistory = [];
  let filteredCommands = [];
  let selectedCommandIndex = 0;
  let historyIndex = 0;

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function showRetro() {
    terminalWindow.classList.remove("is-restored");
    terminalWindow.classList.add("is-falling");
    window.setTimeout(() => {
      modernStage.inert = true;
      retroStage.inert = false;
      retroStage.setAttribute("aria-hidden", "false");
      retroStage.classList.add("is-active");
    }, reduceMotion.matches ? 0 : 1760);
  }

  function showModern() {
    retroStage.classList.remove("is-active");
    retroStage.inert = true;
    retroStage.setAttribute("aria-hidden", "true");
    terminalWindow.classList.replace("is-falling", "is-restored");
    output.querySelectorAll(".fun-transition-line").forEach((line) => line.remove());
    modernStage.inert = false;
    input.focus();
  }

  window.addEventListener("message", (event) => {
    if (event.origin === window.location.origin && event.data === "scroll-modern") {
      showModern();
    }
  });

  function scrollOutput() {
    output.scrollTop = output.scrollHeight;
  }

  function appendLine(text, className = "terminal-line") {
    const line = document.createElement("p");
    line.className = className;
    line.textContent = text;
    output.append(line);
    scrollOutput();
    return line;
  }

  function appendLink(label, href) {
    const line = document.createElement("p");
    line.className = "terminal-line terminal-result";
    const marker = document.createElement("span");
    marker.textContent = "✦ ";
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    if (href.startsWith("http")) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }
    line.append(marker, link);
    output.append(line);
    scrollOutput();
  }

  function showStatus(label) {
    const status = document.createElement("div");
    status.className = "terminal-status";
    const sparkle = document.createElement("span");
    sparkle.className = "status-sparkle";
    sparkle.textContent = "✦";
    const text = document.createElement("span");
    text.textContent = label;
    const dots = document.createElement("span");
    dots.className = "status-dots";
    dots.innerHTML = "<i></i><i></i><i></i>";
    status.append(sparkle, text, dots);
    output.append(status);
    scrollOutput();
    return status;
  }

  async function streamText(element, text, speed) {
    if (reduceMotion.matches) {
      element.textContent = text;
      return;
    }
    element.classList.add("is-streaming");
    for (const character of text) {
      element.textContent += character;
      scrollOutput();
      await wait(speed);
    }
    element.classList.remove("is-streaming");
  }

  function closeCommandPalette() {
    commandPalette.hidden = true;
    commandPalette.replaceChildren();
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }

  function renderCommandPalette() {
    const query = input.value.trimStart().toLowerCase();
    const isThemeQuery = query.startsWith("/theme ");
    if (!query.startsWith("/") || (!isThemeQuery && query.includes(" ")) || input.disabled) {
      closeCommandPalette();
      return;
    }

    if (isThemeQuery) {
      const themeQuery = query.slice("/theme ".length);
      filteredCommands = themeDefinitions.filter(({ name }) => name.startsWith(themeQuery));
    } else {
      filteredCommands = commandDefinitions
        .filter(({ name }) => name.startsWith(query))
        .map((command) => ({ ...command, value: command.name }));
    }
    commandPalette.replaceChildren();
    selectedCommandIndex = Math.min(selectedCommandIndex, Math.max(0, filteredCommands.length - 1));

    filteredCommands.forEach(({ name, description, value }, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.id = `command-option-${index}`;
      option.className = "command-option";
      option.dataset.command = value;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(index === selectedCommandIndex));
      option.classList.toggle("is-selected", index === selectedCommandIndex);
      const commandName = document.createElement("strong");
      commandName.textContent = name;
      const commandDescription = document.createElement("span");
      commandDescription.textContent = description;
      option.append(commandName, commandDescription);
      commandPalette.append(option);
    });

    commandPalette.hidden = filteredCommands.length === 0;
    input.setAttribute("aria-expanded", String(filteredCommands.length > 0));
    if (filteredCommands.length > 0) {
      input.setAttribute("aria-activedescendant", `command-option-${selectedCommandIndex}`);
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function moveCommandSelection(direction) {
    selectedCommandIndex =
      (selectedCommandIndex + direction + filteredCommands.length) % filteredCommands.length;
    commandPalette.querySelectorAll(".command-option").forEach((option, index) => {
      const isSelected = index === selectedCommandIndex;
      option.classList.toggle("is-selected", isSelected);
      option.setAttribute("aria-selected", String(isSelected));
      if (isSelected) {
        option.scrollIntoView({ block: "nearest" });
      }
    });
    input.setAttribute("aria-activedescendant", `command-option-${selectedCommandIndex}`);
  }

  function chooseCommand(command, runImmediately) {
    if (command === "/theme") {
      input.value = "/theme ";
      selectedCommandIndex = 0;
      renderCommandPalette();
      return;
    }
    input.value = runImmediately ? "" : command;
    closeCommandPalette();
    if (runImmediately) {
      runCommand(command);
    }
  }

  async function runCommand(rawCommand) {
    const entered = rawCommand.trim();
    if (!entered || input.disabled) {
      return;
    }
    commandHistory.push(entered);
    historyIndex = commandHistory.length;
    appendLine(`❯ ${entered}`, "terminal-line terminal-command");
    closeCommandPalette();
    input.disabled = true;

    const [command, ...argumentsList] = entered.toLowerCase().replace(/^\//, "").split(/\s+/);
    if (command === "clear") {
      [...output.children].forEach((child) => {
        if (!child.classList.contains("terminal-profile")) {
          child.remove();
        }
      });
      input.disabled = false;
      input.focus();
      return;
    }

    const status = showStatus("Working");
    await wait(reduceMotion.matches ? 0 : 360);
    status.remove();

    if (command === "help") {
      commandDefinitions.forEach(({ name, description }) => {
        appendLine(`${name.padEnd(10)} ${description}`, "terminal-line terminal-result");
      });
    } else if (command === "about") {
      appendLine("about.md", "terminal-line terminal-section-title");
      appendLine(
        "I'm Harper, a computer science student at Brown University. I enjoy turning interesting ideas into useful software, exploring new technologies, and making things for the web.",
        "terminal-line terminal-result",
      );
    } else if (command === "github") {
      appendLink("github.com/harperaustin", "https://github.com/harperaustin");
    } else if (command === "linkedin") {
      appendLink("linkedin.com/in/harperaustin", "https://www.linkedin.com/in/harperaustin");
    } else if (command === "email") {
      appendLink("Compose an email", "mailto:?subject=Hello%20Harper");
    } else if (command === "theme") {
      const requestedTheme = argumentsList[0];
      if (themeChoices.includes(requestedTheme)) {
        applyTheme(requestedTheme);
        appendLine(`Theme set to ${requestedTheme}.`, "terminal-line terminal-result");
      } else {
        appendLine("Usage: /theme [light | dark | system]", "terminal-line terminal-error");
      }
    } else if (command === "fun") {
      appendLine(
        "✦ Launching something different...",
        "terminal-line terminal-fun fun-transition-line",
      );
      await wait(reduceMotion.matches ? 0 : 240);
      showRetro();
    } else {
      appendLine(`Unknown command: ${entered}. Type /help.`, "terminal-line terminal-error");
    }

    input.disabled = false;
    input.focus();
    scrollOutput();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const paletteOpen = !commandPalette.hidden && filteredCommands.length > 0;
    if (paletteOpen) {
      chooseCommand(filteredCommands[selectedCommandIndex].value, true);
      return;
    }
    const command = input.value;
    if (command.trim().toLowerCase() === "/theme") {
      input.value = "/theme ";
      selectedCommandIndex = 0;
      renderCommandPalette();
      return;
    }
    input.value = "";
    closeCommandPalette();
    runCommand(command);
  });

  input.addEventListener("input", () => {
    selectedCommandIndex = 0;
    renderCommandPalette();
  });

  input.addEventListener("keydown", (event) => {
    const paletteOpen = !commandPalette.hidden && filteredCommands.length > 0;
    if (paletteOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      moveCommandSelection(event.key === "ArrowDown" ? 1 : -1);
    } else if (paletteOpen && event.key === "Tab") {
      event.preventDefault();
      chooseCommand(filteredCommands[selectedCommandIndex].value, false);
    } else if (paletteOpen && event.key === "Escape") {
      event.preventDefault();
      closeCommandPalette();
    } else if (event.key === "ArrowUp" && commandHistory.length > 0) {
      event.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = commandHistory[historyIndex];
    } else if (event.key === "ArrowDown" && commandHistory.length > 0) {
      event.preventDefault();
      historyIndex = Math.min(commandHistory.length, historyIndex + 1);
      input.value = commandHistory[historyIndex] || "";
    }
  });

  commandPalette.addEventListener("click", (event) => {
    const option = event.target.closest("[data-command]");
    if (option) {
      chooseCommand(option.dataset.command, true);
    }
  });

  async function bootTerminal() {
    input.disabled = true;
    const status = showStatus("Loading profile");
    await wait(reduceMotion.matches ? 0 : 720);
    status.remove();

    const heading = document.createElement("h1");
    const description = document.createElement("p");
    const profile = document.createElement("div");
    profile.className = "terminal-profile";
    description.className = "terminal-intro";
    profile.append(heading, description);
    output.append(profile);
    await streamText(heading, "Harper Austin", 42);
    await streamText(
      description,
      "CS @ Brown University. I like working on AI.",
      12,
    );
    const hint = document.createElement("p");
    hint.className = "terminal-line terminal-hint";
    hint.textContent = "Type / to browse commands.";
    profile.append(hint);
    input.disabled = false;
    input.focus();
    scrollOutput();
  }

  bootTerminal();
}
