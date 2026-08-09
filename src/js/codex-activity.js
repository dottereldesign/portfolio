const codexActivity = document.querySelector("[data-codex-activity]");

if (codexActivity) {
  const calendar = codexActivity.querySelector("[data-codex-calendar]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const monthFormatter = new Intl.DateTimeFormat("en-NZ", {
    month: "short",
    timeZone: "UTC",
  });
  const dateFormatter = new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const calendarStart = new Date(Date.UTC(2026, 1, 15));
  const activityRows = [
    "11101211211122112212112400",
    "1011121111112132212311024.",
    "1111121111113232412221222.",
    "0112111111112241111212223.",
    "0101111111111311211113221.",
    "0111111211112211122103212.",
    "0111221311121301111012421.",
  ];
  const cells = [];
  const monthStarts = new Map();

  for (let column = 0; column < 26; column += 1) {
    for (let row = 0; row < 7; row += 1) {
      const level = activityRows[row][column];
      if (level === ".") continue;
      const date = new Date(calendarStart);
      date.setUTCDate(calendarStart.getUTCDate() + (column * 7) + row);
      cells.push({ column, date, level: Number(level), row });

      const monthKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
      if (!monthStarts.has(monthKey)) {
        monthStarts.set(monthKey, { label: monthFormatter.format(date), week: column });
      }
    }
  }

  const activeCellCount = cells.filter(({ level }) => level > 0).length;
  const revealStep = 2200 / Math.max(activeCellCount - 1, 1);
  const fragment = document.createDocumentFragment();
  let activeCellIndex = 0;

  calendar.style.setProperty("--week-count", "26");

  [
    ["Mon", 1],
    ["Wed", 3],
    ["Fri", 5],
  ].forEach(([label, day]) => {
    const element = document.createElement("span");
    element.className = "github-calendar__day codex-calendar__day";
    element.textContent = label;
    element.style.gridColumn = "1";
    element.style.gridRow = String(day + 2);
    fragment.appendChild(element);
  });

  cells.forEach(({ column, date, level, row }) => {
    const cell = document.createElement("i");
    const position = (column * 7) + row;
    cell.className = "codex-calendar__cell";
    cell.dataset.level = String(level);
    cell.style.gridColumn = String(column + 2);
    cell.style.gridRow = String(row + 2);
    cell.setAttribute("aria-hidden", "true");
    cell.title = level === 0
      ? `No Codex activity on ${dateFormatter.format(date)}`
      : `Codex activity level ${level} of 4 on ${dateFormatter.format(date)}`;

    if (level > 0 && !prefersReducedMotion) {
      const revealOrder = activeCellCount - activeCellIndex - 1;
      const scatterSeed = position + level;
      cell.classList.add("is-reveal-ready");
      cell.style.setProperty("--reveal-delay", `${revealOrder * revealStep}ms`);
      cell.style.setProperty("--reveal-x", `${((scatterSeed * 7) % 5 - 2) * 0.12}rem`);
      cell.style.setProperty("--reveal-y", `${((scatterSeed * 11) % 5 - 2) * 0.08}rem`);
      cell.style.setProperty("--reveal-rotation", `${((scatterSeed * 13) % 7 - 3) * 4}deg`);
      activeCellIndex += 1;
    }

    fragment.appendChild(cell);
  });

  let previousMonthWeek = -3;
  monthStarts.forEach(({ label, week }) => {
    if (week - previousMonthWeek < 2) return;
    const month = document.createElement("span");
    month.className = "github-calendar__month codex-calendar__month";
    month.textContent = label;
    month.style.gridColumn = String(week + 2);
    month.style.gridRow = "1";
    fragment.appendChild(month);
    previousMonthWeek = week;
  });

  calendar.appendChild(fragment);
  codexActivity.classList.add("is-ready");

  calendar.addEventListener("animationend", (event) => {
    if (event.animationName !== "codex-calendar-cell-reveal") return;
    event.target.classList.remove("is-reveal-ready");
  });

  const reveal = () => codexActivity.classList.add("is-reveal-active");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      reveal();
      revealObserver.disconnect();
    }, { rootMargin: "0px 0px -12% 0px" });
    revealObserver.observe(codexActivity);
  } else {
    reveal();
  }
}
