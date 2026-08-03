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
