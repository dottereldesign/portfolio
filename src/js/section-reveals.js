const timeline = document.querySelector("[data-timeline]");

if (timeline) {
  const events = [...timeline.querySelectorAll(".timeline-event")];
  const progress = timeline.querySelector(".timeline__progress");
  let timelineIsNearby = false;
  let scrollFrame;

  timeline.classList.add("timeline--reveal-ready");

  const updateTimeline = () => {
    const bounds = timeline.getBoundingClientRect();
    const travel = Math.max(1, bounds.height);
    const viewportPoint = window.innerHeight * 0.55;
    const progressAmount = Math.min(100, Math.max(0, ((viewportPoint - bounds.top) / travel) * 100));
    progress.style.height = `${progressAmount}%`;
    scrollFrame = undefined;
  };

  if ("IntersectionObserver" in window) {
    const revealEvents = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealEvents.unobserve(entry.target);
      });
    }, { threshold: 0.22, rootMargin: "0px 0px -8% 0px" });

    events.forEach((event) => revealEvents.observe(event));

    const timelineVisibility = new IntersectionObserver(([entry]) => {
      timelineIsNearby = entry.isIntersecting;
      if (timelineIsNearby) updateTimeline();
    }, { rootMargin: "100% 0px" });

    timelineVisibility.observe(timeline);
  } else {
    timelineIsNearby = true;
    events.forEach((event) => event.classList.add("is-visible"));
  }

  const onScroll = () => {
    if (!timelineIsNearby) return;
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateTimeline);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateTimeline);
  updateTimeline();
}

const capabilities = document.querySelector("[data-capabilities-reveal]");
const capabilityShowcase = document.querySelector("[data-capabilities-flow-reveal]");

if (capabilities) {
  capabilities.classList.add("capabilities--reveal-ready");
  const capabilitiesIntro = capabilities.querySelector(".capabilities__intro");

  if ("IntersectionObserver" in window) {
    const revealCapabilitiesIntro = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      capabilities.classList.add("is-visible");
      revealCapabilitiesIntro.disconnect();
    }, { threshold: 0.25, rootMargin: "0px 0px -6% 0px" });

    if (capabilitiesIntro) revealCapabilitiesIntro.observe(capabilitiesIntro);
  } else {
    capabilities.classList.add("is-visible");
  }
}

if (capabilityShowcase) {
  capabilityShowcase.classList.add("capabilities--reveal-ready");
  const capabilitiesFlow = capabilityShowcase.querySelector(".capabilities__flow");

  if ("IntersectionObserver" in window) {
    const revealCapabilitiesFlow = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      capabilityShowcase.classList.add("is-flow-visible");
      revealCapabilitiesFlow.disconnect();
    }, { threshold: 0.16, rootMargin: "0px 0px -6% 0px" });

    if (capabilitiesFlow) revealCapabilitiesFlow.observe(capabilitiesFlow);
  } else {
    capabilityShowcase.classList.add("is-flow-visible");
  }
}

const workSection = document.querySelector("#work[data-section-reveal]");

if (workSection) {
  const workHeading = workSection.querySelector(".work-heading");
  const projectCards = [...workSection.querySelectorAll(".project-card")];

  workSection.classList.add("work--reveal-ready");
  projectCards.forEach((card, index) => {
    card.classList.add("project-card--reveal-ready");
    card.style.setProperty("--project-reveal-delay", `${(index % 3) * 110}ms`);
  });

  if ("IntersectionObserver" in window) {
    const revealWorkHeading = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      workSection.classList.add("is-visible");
      revealWorkHeading.disconnect();
    }, { threshold: 0.3, rootMargin: "0px 0px -8% 0px" });

    const revealProjects = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealProjects.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -7% 0px" });

    if (workHeading) revealWorkHeading.observe(workHeading);
    projectCards.forEach((card) => revealProjects.observe(card));
  } else {
    workSection.classList.add("is-visible");
    projectCards.forEach((card) => card.classList.add("is-visible"));
  }
}

const journeySection = document.querySelector("#journey[data-section-reveal]");

if (journeySection) {
  const journeyIntro = journeySection.querySelector(".journey__intro");
  journeySection.classList.add("journey--reveal-ready");

  if ("IntersectionObserver" in window && journeyIntro) {
    const revealJourneyIntro = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      journeySection.classList.add("is-visible");
      revealJourneyIntro.disconnect();
    }, { threshold: 0.3, rootMargin: "0px 0px -8% 0px" });

    revealJourneyIntro.observe(journeyIntro);
  } else {
    journeySection.classList.add("is-visible");
  }
}

const cvSection = document.querySelector("#cv[data-cv-reveal]");

if (cvSection) {
  const cvRevealItems = [...cvSection.querySelectorAll("[data-cv-reveal-item]")];
  cvSection.classList.add("cv--reveal-ready");

  if ("IntersectionObserver" in window) {
    const revealCVItems = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealCVItems.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -7% 0px" });

    window.requestAnimationFrame(() => {
      cvRevealItems.forEach((item) => revealCVItems.observe(item));
    });
  } else {
    cvRevealItems.forEach((item) => item.classList.add("is-visible"));
  }
}

const study = document.querySelector("[data-study-reveal]");

if (study) {
  const bounds = study.getBoundingClientRect();
  const visibleHeight = Math.max(0, Math.min(window.innerHeight, bounds.bottom) - Math.max(0, bounds.top));
  const isVisibleOnLoad = window.scrollY < 10 && visibleHeight >= bounds.height * 0.25;

  if (isVisibleOnLoad) study.classList.add("hero__study--initial-reveal");
  study.classList.add("hero__study--reveal-ready");

  const revealStudy = () => study.classList.add("is-visible");

  if ("IntersectionObserver" in window) {
    const studyVisibility = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      revealStudy();
      studyVisibility.disconnect();
    }, { threshold: 0.2, rootMargin: "0px 0px -4% 0px" });

    window.requestAnimationFrame(() => studyVisibility.observe(study));
  } else {
    revealStudy();
  }
}
