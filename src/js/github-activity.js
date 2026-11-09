const githubActivity = document.querySelector("[data-github-activity]");

if (githubActivity) {
  const calendar = githubActivity.querySelector("[data-github-calendar]");
  const totalLabel = githubActivity.querySelector("[data-github-total]");
  const statusLabel = githubActivity.querySelector("[data-github-status]");
  const cacheKey = "jw-github-contributions-v1";
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
    const weekCount = 26;
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

  const renderCalendar = (
    { contributions },
    {
      animate = true,
      status = "Public GitHub activity · synced automatically",
    } = {},
  ) => {
    if (!Array.isArray(contributions) || contributions.length < 350) {
      throw new Error("The contribution response was incomplete.");
    }

    const yearEntries = contributions
      .filter(({ date }) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .map((entry) => ({
        count: Math.max(0, Number(entry.count) || 0),
        date: entry.date,
        level: Math.max(0, Math.min(4, Number(entry.level) || 0)),
        parsedDate: parseCalendarDate(entry.date),
      }))
      .sort((first, second) => first.parsedDate - second.parsedDate);
    const latestDate = yearEntries.at(-1)?.parsedDate;

    if (!latestDate) throw new Error("The contribution response did not contain valid dates.");

    const windowStart = new Date(latestDate);
    windowStart.setUTCDate(latestDate.getUTCDate() - latestDate.getUTCDay() - (25 * 7));
    const entries = yearEntries.filter(({ parsedDate }) => parsedDate >= windowStart);

    if (entries.length < 176) {
      throw new Error("The six-month contribution response was incomplete.");
    }

    const firstDayOffset = entries[0].parsedDate.getUTCDay();
    const weekCount = Math.ceil((firstDayOffset + entries.length) / 7);
    const fragment = document.createDocumentFragment();
    const monthStarts = new Map();
    const activeEntryCount = entries.filter(({ level }) => level > 0).length;
    const revealStep = 2400 / Math.max(activeEntryCount - 1, 1);
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

      if (entry.level > 0 && animate && !prefersReducedMotion) {
        const revealOrder = activeEntryCount - activeEntryIndex - 1;
        const scatterSeed = position + entry.level;
        cell.classList.add("is-reveal-ready");
        cell.style.setProperty("--reveal-delay", `${revealOrder * revealStep}ms`);
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

    const contributionTotal = entries.reduce((sum, entry) => sum + entry.count, 0);
    totalLabel.textContent = `${contributionTotal.toLocaleString("en-NZ")} contributions in the last six months`;
    statusLabel.textContent = status;
    calendar.setAttribute(
      "aria-label",
      `${contributionTotal.toLocaleString("en-NZ")} GitHub contributions by Jamie Wilson in the last six months`,
    );
    githubActivity.classList.remove("is-error", "is-stale");
    githubActivity.classList.add("is-ready");

  };

  calendar.addEventListener("animationend", (event) => {
    if (event.animationName !== "github-calendar-cell-reveal") return;
    event.target.classList.remove("is-reveal-ready");
  });

  const readCachedActivity = () => {
    try {
      const cached = JSON.parse(window.localStorage.getItem(cacheKey));
      if (!cached?.data || !Array.isArray(cached.data.contributions)) return null;
      return cached;
    } catch {
      return null;
    }
  };

  const writeCachedActivity = (data) => {
    try {
      window.localStorage.setItem(cacheKey, JSON.stringify({
        data,
        savedAt: Date.now(),
      }));
    } catch {
      // The live calendar still works when storage is disabled or full.
    }
  };

  const renderUnavailableCalendar = () => {
    if (!calendar.querySelector(".github-calendar__cell")) renderSkeleton();
    calendar.querySelectorAll(".github-calendar__cell").forEach((cell) => {
      cell.classList.remove("is-loading", "is-reveal-ready");
      cell.dataset.level = "0";
    });
    calendar.setAttribute("aria-label", "GitHub contribution calendar awaiting a live update");
    totalLabel.textContent = "GitHub contribution calendar";
    statusLabel.textContent = "Live update unavailable · calendar retained";
    githubActivity.classList.remove("is-error");
    githubActivity.classList.add("is-ready", "is-stale");
  };

  const markCachedCalendarStale = () => {
    statusLabel.textContent = "Saved GitHub activity · live update unavailable";
    githubActivity.classList.remove("is-error");
    githubActivity.classList.add("is-ready", "is-stale");
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

  const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

  const fetchGithubActivityWithRetry = async (attempts = 2) => {
    let lastError;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await fetchGithubActivity();
      } catch (error) {
        lastError = error;
        if (attempt < attempts - 1) await wait(650 * (attempt + 1));
      }
    }

    throw lastError;
  };

  const loadGithubActivity = async () => {
    if (activityHasLoaded) return;
    activityHasLoaded = true;

    const cachedActivity = readCachedActivity();
    let hasCachedCalendar = false;

    if (cachedActivity) {
      try {
        renderCalendar(cachedActivity.data, {
          animate: true,
          status: "Saved GitHub activity · checking for updates…",
        });
        hasCachedCalendar = true;
      } catch {
        try {
          window.localStorage.removeItem(cacheKey);
        } catch {
          // Ignore unavailable storage and continue with the live request.
        }
      }
    }

    if (!hasCachedCalendar && !prefetchedContributions) renderSkeleton();

    try {
      const freshActivity = await fetchGithubActivityWithRetry();
      renderCalendar(freshActivity, { animate: !hasCachedCalendar });
      writeCachedActivity(freshActivity);
    } catch {
      if (hasCachedCalendar) {
        markCachedCalendarStale();
      } else {
        renderUnavailableCalendar();
      }
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
