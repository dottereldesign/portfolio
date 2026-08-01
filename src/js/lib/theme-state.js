export const normaliseTheme = (theme) => (theme === "light" ? "light" : "dark");

export const getNextTheme = (theme) => (normaliseTheme(theme) === "dark" ? "light" : "dark");

export const getThemeColour = (theme) => (normaliseTheme(theme) === "dark" ? "#10110f" : "#efebe2");
