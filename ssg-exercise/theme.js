const THEME_KEY = "theme";

// Reads the saved theme; storage can be blocked, so failures fall back to light
function readSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch (error) {
    return "light";
  }
}

// Saves the theme; if storage is blocked the theme still works on this page
function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.log("Theme could not be saved:", error);
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

let currentTheme = readSavedTheme();
applyTheme(currentTheme);

// The button does not exist yet while the head is loading, so wait for the HTML
document.addEventListener("DOMContentLoaded", () => {
  const control = document.getElementById("theme-control");
  if (!control) {
    return;
  }
  const button = control.querySelector("button");
  
  // The label names the theme the button will switch to
  function updateLabel() {
    button.textContent =
      currentTheme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  }

  function switchTheme() {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(currentTheme);
    saveTheme(currentTheme);
    updateLabel();
  }

  button.addEventListener("click", () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Cross-fade between themes with the View Transition API. If the browser
    // does not support it, or the user asked for less motion, switch instantly.
    if (!document.startViewTransition || reduceMotion) {
      switchTheme();
    } else {
      document.startViewTransition(switchTheme);
    }
  });

  // a page restored by the Back button may be showing an outdated theme
  window.addEventListener("pageshow", () => {
    currentTheme = readSavedTheme();
    applyTheme(currentTheme);
    updateLabel();
  });

  // reveal the control now that it works
  updateLabel();
  control.hidden = false;
});