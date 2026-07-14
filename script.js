const title = document.querySelector(".hero__title span");
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function scrambleText(element) {
  const text = element.textContent.trim();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  element.textContent = "";

  // Use one shared cell width for the whole word. Different widths per
  // letter make the gaps look uneven even when the layout itself is stable.
  const measure = document.createElement("span");
  measure.className = "scramble-character";
  measure.style.position = "absolute";
  measure.style.visibility = "hidden";
  measure.style.whiteSpace = "nowrap";
  element.appendChild(measure);
  const widestGlyph = [...characters, ...text.replaceAll(" ", "")].reduce((widest, character) => {
    measure.textContent = character;
    return Math.max(widest, measure.getBoundingClientRect().width);
  }, 0);
  measure.remove();

  const cellWidth = widestGlyph + 4;

  const letters = [...text].map((character) => {
    const letter = document.createElement("span");
    letter.className = "scramble-character";
    letter.setAttribute("aria-hidden", "true");
    const finalCharacter = character === " " ? "\u00a0" : character;
    letter.textContent = finalCharacter;
    element.appendChild(letter);

    letter.style.width = `${character === " " ? cellWidth * 0.45 : cellWidth}px`;
    letter.style.textAlign = "center";
    letter.textContent = character === " " ? "\u00a0" : characters[randomBetween(0, characters.length - 1)];

    return {
      character,
      letter,
      resolveAt: character === " " ? 0 : randomBetween(10, 42),
    };
  });

  const frameDelay = 42;
  let currentChange = 0;
  let lastChange = 0;

  function animate(now) {
    if (now - lastChange < frameDelay) {
      window.requestAnimationFrame(animate);
      return;
    }

    lastChange = now;
    currentChange += 1;

    letters.forEach((letter) => {
      if (letter.resolveAt <= currentChange) {
        letter.letter.textContent = letter.character === " " ? "\u00a0" : letter.character;
        letter.letter.classList.add("is-resolved");
      }
    });

    const unresolved = letters.filter(({ resolveAt }) => resolveAt > currentChange);

    if (!unresolved.length) return;

    const active = unresolved[randomBetween(0, unresolved.length - 1)];
    active.letter.textContent = characters[randomBetween(0, characters.length - 1)];

    window.requestAnimationFrame(animate);
  }

  window.requestAnimationFrame(animate);
}

if (title) {
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => scrambleText(title));
  } else {
    scrambleText(title);
  }
}
