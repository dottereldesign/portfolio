const title = document.querySelector(".hero__title span");
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*";

function scrambleText(element) {
  const text = element.textContent.trim();
  element.textContent = "";

  const letters = [...text].map((character) => {
    const letter = document.createElement("span");
    letter.className = "scramble-character";
    letter.setAttribute("aria-hidden", "true");
    letter.textContent = character === " " ? "\u00a0" : character;
    element.appendChild(letter);
    return { character, letter };
  });

  const startTime = performance.now();
  const resolveEvery = 78;
  const scrambleFor = 560;

  function animate(now) {
    const elapsed = now - startTime;
    let unresolved = false;

    letters.forEach(({ character, letter }, index) => {
      if (character === " ") {
        letter.textContent = "\u00a0";
        return;
      }

      const characterElapsed = elapsed - index * resolveEvery;
      if (characterElapsed < scrambleFor) {
        unresolved = true;
        letter.textContent = characters[Math.floor(Math.random() * characters.length)];
      } else {
        letter.textContent = character;
        letter.classList.add("is-resolved");
      }
    });

    if (unresolved) window.requestAnimationFrame(animate);
  }

  window.requestAnimationFrame(animate);
}

if (title) scrambleText(title);
