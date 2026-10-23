const THEME_SCRIPT = `
(function () {
  try {
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  } catch (error) {
    /* ignore: falls back to the light theme */
  }
})();
`;

export function ThemeScript() {
  // Inline and blocking so the dark theme class is applied before first
  // paint - avoids a light-mode flash for users with a dark system theme.
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
