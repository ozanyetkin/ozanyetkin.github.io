# Fonts

Place monospace TTF fonts here for jsPDF.

Default expected filenames:

- JetBrainsMono-Regular.ttf
- JetBrainsMono-Bold.ttf (optional but recommended)

Use another monospace by:

- Placing your TTF(s) here
- Updating the fetch URLs in script.js (search for 'assets/fonts/JetBrainsMono-')

Behavior:

- If regular is present, jsPDF will use it.
- If bold is present, jsPDF will use true bold; otherwise bold falls back to regular.
- If no files are found, it falls back to built-in 'courier'.
