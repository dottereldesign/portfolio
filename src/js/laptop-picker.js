const laptopPicker = document.querySelector("[data-laptop-picker]");

if (laptopPicker) {
  const options = [...laptopPicker.querySelectorAll("[data-laptop-option]")];
  const previousButton = laptopPicker.querySelector("[data-laptop-previous]");
  const nextButton = laptopPicker.querySelector("[data-laptop-next]");
  const count = laptopPicker.querySelector("[data-laptop-count]");
  const name = laptopPicker.querySelector("[data-laptop-name]");
  const dockProperties = [
    ["--dock-left", "dockLeft"],
    ["--dock-top", "dockTop"],
    ["--dock-width", "dockWidth"],
    ["--dock-rotate", "dockRotate"],
  ];
  let activeIndex = 0;

  const warmImage = (index) => {
    const image = options[index]?.querySelector("img");
    if (!image) return;
    image.loading = "eager";
    image.decode?.().catch(() => {});
  };

  const selectOption = (nextIndex) => {
    activeIndex = (nextIndex + options.length) % options.length;
    const activeOption = options[activeIndex];

    options.forEach((option, index) => {
      const isActive = index === activeIndex;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-hidden", String(!isActive));
    });

    dockProperties.forEach(([property, datasetName]) => {
      laptopPicker.style.setProperty(property, activeOption.dataset[datasetName]);
    });

    count.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(options.length).padStart(2, "0")}`;
    name.textContent = activeOption.dataset.name;
    laptopPicker.dataset.activeIndex = String(activeIndex);
    warmImage((activeIndex + 1) % options.length);
    warmImage((activeIndex - 1 + options.length) % options.length);
  };

  previousButton?.addEventListener("click", () => selectOption(activeIndex - 1));
  nextButton?.addEventListener("click", () => selectOption(activeIndex + 1));

  laptopPicker.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    selectOption(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
  });

  selectOption(0);
}
