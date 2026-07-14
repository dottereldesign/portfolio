const title = document.querySelector(".hero__title span");
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*";
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function scrambleText(element) {
  const text = element.textContent.trim();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  element.textContent = "";

  const letters = [...text].map((character) => {
    const letter = document.createElement("span");
    letter.className = "scramble-character";
    letter.setAttribute("aria-hidden", "true");
    const finalCharacter = character === " " ? "\u00a0" : character;
    letter.textContent = finalCharacter;
    element.appendChild(letter);

    // Reserve room for the widest possible random glyph. This keeps every
    // slot stable without letting symbols get cropped during the reveal.
    const finalWidth = letter.getBoundingClientRect().width;
    const widestGlyph = character === " " ? finalWidth : [...characters].reduce((widest, randomCharacter) => {
      letter.textContent = randomCharacter;
      return Math.max(widest, letter.getBoundingClientRect().width);
    }, finalWidth);
    letter.style.width = `${widestGlyph + 4}px`;
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
