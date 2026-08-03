const githubActivity = document.querySelector("[data-github-activity]");

if (githubActivity) {
  const calendar = githubActivity.querySelector("[data-github-calendar]");
  const totalLabel = githubActivity.querySelector("[data-github-total]");
  const statusLabel = githubActivity.querySelector("[data-github-status]");
  const profileUrl = "https://github.com/dottereldesign";
  const contributionsUrl =
    "https://github-contributions-api.jogruber.de/v4/dottereldesign?y=last";
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
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const parseCalendarDate = (value) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const positionCalendarItem = (element, week, day) => {
    element.style.gridColumn = String(week + 2);
    element.style.gridRow = String(day + 2);
  };

  const addDayLabels = () => {
    [
      ["Mon", 1],
      ["Wed", 3],
      ["Fri", 5],
    ].forEach(([label, day]) => {
      const element = document.createElement("span");
      element.className = "github-calendar__day";
      element.textContent = label;
      element.style.gridColumn = "1";
      element.style.gridRow = String(day + 2);
      calendar.appendChild(element);
    });
  };

  const renderSkeleton = () => {
    const weekCount = 53;
    const fragment = document.createDocumentFragment();
    calendar.replaceChildren();
    calendar.style.setProperty("--week-count", String(weekCount));
    addDayLabels();

    for (let week = 0; week < weekCount; week += 1) {
      for (let day = 0; day < 7; day += 1) {
        const cell = document.createElement("i");
        cell.className = "github-calendar__cell is-loading";
        cell.setAttribute("aria-hidden", "true");
        cell.style.setProperty("--loading-delay", `${((week + day) % 11) * -90}ms`);
        positionCalendarItem(cell, week, day);
        fragment.appendChild(cell);
      }
    }

    calendar.appendChild(fragment);
  };

  const renderCalendar = ({ contributions, total }) => {
    if (!Array.isArray(contributions) || contributions.length < 350) {
      throw new Error("The contribution response was incomplete.");
    }

    const entries = contributions
      .filter(({ date }) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .map((entry) => ({
        count: Math.max(0, Number(entry.count) || 0),
        date: entry.date,
        level: Math.max(0, Math.min(4, Number(entry.level) || 0)),
        parsedDate: parseCalendarDate(entry.date),
      }));
    const firstDayOffset = entries[0].parsedDate.getUTCDay();
    const weekCount = Math.ceil((firstDayOffset + entries.length) / 7);
    const fragment = document.createDocumentFragment();
    const monthStarts = new Map();
    const activeEntryCount = entries.filter(({ level }) => level > 0).length;
    let activeEntryIndex = 0;

    calendar.replaceChildren();
    calendar.style.setProperty("--week-count", String(weekCount));
    addDayLabels();

    entries.forEach((entry, index) => {
      const position = firstDayOffset + index;
      const week = Math.floor(position / 7);
      const day = position % 7;
      const monthKey = `${entry.parsedDate.getUTCFullYear()}-${entry.parsedDate.getUTCMonth()}`;

      if (!monthStarts.has(monthKey)) {
        monthStarts.set(monthKey, {
          label: monthFormatter.format(entry.parsedDate),
          week,
        });
      }

      const cell = document.createElement("i");
      const contributionWord = entry.count === 1 ? "contribution" : "contributions";
      cell.className = "github-calendar__cell";
      cell.dataset.level = String(entry.level);
      cell.setAttribute("aria-hidden", "true");
      cell.title = `${entry.count} ${contributionWord} on ${dateFormatter.format(entry.parsedDate)}`;

      if (entry.level > 0 && !prefersReducedMotion) {
        const revealOrder = activeEntryCount - activeEntryIndex - 1;
        const scatterSeed = position + entry.level;
        cell.classList.add("is-reveal-ready");
        cell.style.setProperty("--reveal-delay", `${revealOrder * 9}ms`);
        cell.style.setProperty("--reveal-x", `${((scatterSeed * 7) % 5 - 2) * 0.12}rem`);
        cell.style.setProperty("--reveal-y", `${((scatterSeed * 11) % 5 - 2) * 0.08}rem`);
        cell.style.setProperty("--reveal-rotation", `${((scatterSeed * 13) % 7 - 3) * 4}deg`);
        activeEntryIndex += 1;
      }

      positionCalendarItem(cell, week, day);
      fragment.appendChild(cell);
    });

    const monthsByWeek = new Map();
    monthStarts.forEach(({ label, week }) => monthsByWeek.set(week, label));

    let previousMonthWeek = -3;
    monthsByWeek.forEach((label, week) => {
      if (week - previousMonthWeek < 2) return;
      const month = document.createElement("span");
      month.className = "github-calendar__month";
      month.textContent = label;
      month.style.gridColumn = String(week + 2);
      month.style.gridRow = "1";
      fragment.appendChild(month);
      previousMonthWeek = week;
    });

    calendar.appendChild(fragment);

    const calculatedTotal = entries.reduce((sum, entry) => sum + entry.count, 0);
    const contributionTotal = Number(total?.lastYear) || calculatedTotal;
    totalLabel.textContent = `${contributionTotal.toLocaleString("en-NZ")} contributions in the last year`;
    statusLabel.textContent = "Public GitHub activity · synced automatically";
    calendar.setAttribute(
      "aria-label",
      `${contributionTotal.toLocaleString("en-NZ")} GitHub contributions by Jamie Wilson in the last year`,
    );
    githubActivity.classList.add("is-ready");

  };

  calendar.addEventListener("animationend", (event) => {
    if (event.animationName !== "github-calendar-cell-reveal") return;
    event.target.classList.remove("is-reveal-ready");
  });

  const renderFallback = () => {
    const fallback = document.createElement("p");
    const link = document.createElement("a");
    fallback.className = "github-calendar__fallback";
    fallback.textContent = "The live calendar could not be reached. ";
    link.href = profileUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "View the contribution graph directly on GitHub.";
    fallback.appendChild(link);
    calendar.replaceChildren(fallback);
    calendar.style.setProperty("--week-count", "1");
    calendar.setAttribute("aria-label", "GitHub contribution calendar unavailable");
    totalLabel.textContent = "GitHub contribution calendar";
    statusLabel.textContent = "Live feed unavailable · profile link still works";
    githubActivity.classList.add("is-error");
  };

  let activityHasLoaded = false;
  let contributionsPromise = null;
  let prefetchedContributions = null;

  const fetchGithubActivity = () => {
    if (prefetchedContributions) return Promise.resolve(prefetchedContributions);
    if (contributionsPromise) return contributionsPromise;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    contributionsPromise = fetch(contributionsUrl, {
      headers: { Accept: "application/json" },
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Contribution request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        prefetchedContributions = data;
        return data;
      })
      .catch((error) => {
        contributionsPromise = null;
        throw error;
      })
      .finally(() => window.clearTimeout(timeout));

    return contributionsPromise;
  };

  const loadGithubActivity = async () => {
    if (activityHasLoaded) return;
    activityHasLoaded = true;

    try {
      if (!prefetchedContributions) renderSkeleton();
      renderCalendar(await fetchGithubActivity());
    } catch {
      renderFallback();
    }
  };

  const connection = navigator.connection
    || navigator.mozConnection
    || navigator.webkitConnection;
  const shouldPrefetch = !connection?.saveData
    && !["slow-2g", "2g"].includes(connection?.effectiveType);

  const schedulePrefetch = () => {
    if (!shouldPrefetch) return;

    const prefetch = () => {
      if (document.visibilityState !== "visible") return;
      fetchGithubActivity().catch(() => {});
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(prefetch, { timeout: 1500 });
    } else {
      window.setTimeout(prefetch, 250);
    }
  };

  if (document.readyState === "complete") {
    schedulePrefetch();
  } else {
    window.addEventListener("load", schedulePrefetch, { once: true });
  }

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      revealObserver.disconnect();
      githubActivity.classList.add("is-reveal-active");
    }, { rootMargin: "0px 0px -12% 0px" });
    revealObserver.observe(githubActivity);

    const activityObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      activityObserver.disconnect();
      loadGithubActivity();
    }, { rootMargin: "0px 0px 480px 0px" });
    activityObserver.observe(githubActivity);
  } else {
    githubActivity.classList.add("is-reveal-active");
    loadGithubActivity();
  }
}
