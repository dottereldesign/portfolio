const title = document.querySelector("[data-value]");
const target = title?.dataset.value ?? "";
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*";

function scrambleText(element, text) {
  let frame = 0;
  const totalFrames = text.length * 4;

  const animate = () => {
    element.textContent = text
      .split("")
      .map((character, index) => {
        if (character === " ") return " ";
        if (index / text.length < frame / totalFrames) return character;
        return characters[Math.floor(Math.random() * characters.length)];
      })
      .join("");

    frame += 1;
    if (frame <= totalFrames) window.requestAnimationFrame(animate);
  };

  window.requestAnimationFrame(animate);
}

if (title) {
  scrambleText(title.querySelector("span"), target);
}
