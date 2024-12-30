
const sunIconPath = "/static/assets/sun.png";
const moonIconPath = "/static/assets/moon.png";

// Theme Switch
const toggleThemeButton = document.createElement("div");
toggleThemeButton.style.position = "absolute";
toggleThemeButton.style.top = "1em";
toggleThemeButton.style.left = "1em";
toggleThemeButton.style.width = "80px";
toggleThemeButton.style.height = "40px";
toggleThemeButton.style.backgroundColor = "#ddd";
toggleThemeButton.style.borderRadius = "50px";
toggleThemeButton.style.cursor = "pointer";
toggleThemeButton.style.transition = "background-color 0.3s, transform 0.3s";
toggleThemeButton.style.display = "flex";
toggleThemeButton.style.alignItems = "center";
toggleThemeButton.style.justifyContent = "space-between";
toggleThemeButton.style.padding = "0 5px";

// Dot Indicator
const themeCircle = document.createElement("div");
themeCircle.style.width = "30px";
themeCircle.style.height = "30px";
themeCircle.style.borderRadius = "50%";
themeCircle.style.backgroundColor = "#fff";
themeCircle.style.position = "absolute";
themeCircle.style.top = "5px";
themeCircle.style.transition = "left 0.3s, background-color 0.3s";

// Fixed sun icon
const sunLabel = document.createElement("img");
sunLabel.src = sunIconPath;
sunLabel.style.width = "20px";
sunLabel.style.height = "20px";
sunLabel.style.filter = "invert(1) brightness(2)";
sunLabel.style.position = "absolute";
sunLabel.style.left = "5px";
sunLabel.style.display = "block";

// Fixed moon icon
const moonLabel = document.createElement("img");
moonLabel.src = moonIconPath;
moonLabel.style.width = "20px";
moonLabel.style.height = "20px";
moonLabel.style.position = "absolute";
moonLabel.style.right = "5px";
moonLabel.style.display = "block";

// add in button
toggleThemeButton.appendChild(sunLabel);
toggleThemeButton.appendChild(moonLabel);
toggleThemeButton.appendChild(themeCircle);

// Add switch in body
document.body.appendChild(toggleThemeButton);

// Switch theme
const applyTheme = (theme) => {
  if (theme === "dark") {
    document.body.classList.add("swagger-ui-dark");
    document.body.classList.remove("swagger-ui");
    themeCircle.style.left = "45px"; // Move dot
    toggleThemeButton.style.backgroundColor = "#333";
  } else {
    document.body.classList.add("swagger-ui");
    document.body.classList.remove("swagger-ui-dark");
    themeCircle.style.left = "5px";
    toggleThemeButton.style.backgroundColor = "#ddd";
  }
  localStorage.setItem("swagger-theme", theme);
};

toggleThemeButton.addEventListener("click", () => {
  const currentTheme = document.body.classList.contains("swagger-ui-dark") ? "dark" : "light";
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

// System theme detection
const detectSystemTheme = () => {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

// Checking the preference saved in localStorage or detecting the system theme
window.addEventListener("load", () => {
  const savedTheme = localStorage.getItem("swagger-theme");
  const theme = savedTheme || detectSystemTheme();
  applyTheme(theme);
});
