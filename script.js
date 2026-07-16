const sidebar = document.querySelector("[data-sidebar]");
const homeLink = document.querySelector(".sidebar-home-link");
const navLinks = [...document.querySelectorAll(".nav-link")];
const sidebarLinks = homeLink ? [homeLink, ...navLinks] : navLinks;
const revealItems = [...document.querySelectorAll(".reveal")];
const cardToggles = [...document.querySelectorAll(".card-toggle")];
const heroTimelineNav = document.querySelector(".hero-timeline-nav");
const heroTimelinePanel = document.querySelector(".hero-timeline-panel");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (sidebar) {
  const setExpanded = (expanded) => {
    sidebar.classList.toggle("is-expanded", expanded);
  };

  sidebar.addEventListener("mouseenter", () => setExpanded(true));
  sidebar.addEventListener("mouseleave", () => setExpanded(false));
  sidebar.addEventListener("focusin", () => setExpanded(true));
  sidebar.addEventListener("focusout", (event) => {
    if (!sidebar.contains(event.relatedTarget)) {
      setExpanded(false);
    }
  });

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => setExpanded(false));
  });
}

cardToggles.forEach((button) => {
  button.addEventListener("click", () => {
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    const contentId = button.getAttribute("aria-controls");
    const content = document.getElementById(contentId);

    button.setAttribute("aria-expanded", String(!isExpanded));

    if (content) {
      content.hidden = isExpanded;
    }
  });
});

if (heroTimelineNav && heroTimelinePanel) {
  const timelineItems = [...document.querySelectorAll("#journey .timeline-item")];
  const heroTimelineItems = timelineItems
    .map((item) => {
      const step = item.querySelector(".timeline-year")?.textContent?.trim();
      const title = item.querySelector("h3")?.textContent?.trim();
      const description = item.querySelector("p")?.textContent?.trim();

      if (!step || !title || !description) {
        return null;
      }

      return { step, title, description };
    })
    .filter(Boolean)
    .reverse();

  let activeHeroTimelineIndex = 0;

  const renderHeroTimeline = () => {
    heroTimelineNav.innerHTML = "";

    heroTimelineItems.forEach((item, index) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "hero-timeline-step";
      tab.id = `hero-timeline-tab-${item.step}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(index === activeHeroTimelineIndex));
      tab.setAttribute("aria-controls", `hero-timeline-panel-${item.step}`);
      tab.setAttribute("tabindex", index === activeHeroTimelineIndex ? "0" : "-1");
      tab.setAttribute("aria-label", `Step ${item.step}: ${item.title}`);
      tab.textContent = item.step;

      tab.addEventListener("click", () => {
        activeHeroTimelineIndex = index;
        renderHeroTimeline();
      });

      tab.addEventListener("keydown", (event) => {
        const keyMap = {
          ArrowLeft: -1,
          ArrowUp: -1,
          ArrowRight: 1,
          ArrowDown: 1,
          Home: "start",
          End: "end",
        };

        if (!(event.key in keyMap)) {
          return;
        }

        event.preventDefault();

        if (keyMap[event.key] === "start") {
          activeHeroTimelineIndex = 0;
        } else if (keyMap[event.key] === "end") {
          activeHeroTimelineIndex = heroTimelineItems.length - 1;
        } else {
          activeHeroTimelineIndex =
            (activeHeroTimelineIndex + keyMap[event.key] + heroTimelineItems.length) %
            heroTimelineItems.length;
        }

        renderHeroTimeline();

        const nextTab = heroTimelineNav.querySelector(
          `[aria-controls="hero-timeline-panel-${heroTimelineItems[activeHeroTimelineIndex].step}"]`
        );

        nextTab?.focus();
      });

      heroTimelineNav.appendChild(tab);
    });

    const activeItem = heroTimelineItems[activeHeroTimelineIndex];

    heroTimelinePanel.id = `hero-timeline-panel-${activeItem.step}`;
    heroTimelinePanel.setAttribute("role", "tabpanel");
    heroTimelinePanel.setAttribute("aria-labelledby", `hero-timeline-tab-${activeItem.step}`);
    heroTimelinePanel.innerHTML = `
      <div class="hero-timeline-meta">
        <span class="hero-timeline-number">${activeItem.step}</span>
        <span class="hero-timeline-label">Journey Step</span>
      </div>
      <h3>${activeItem.title}</h3>
      <p>${activeItem.description}</p>
    `;
  };

  if (heroTimelineItems.length > 0) {
    renderHeroTimeline();
  }
}

if (!reducedMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -5% 0px",
    }
  );

  revealItems.forEach((item) => {
    if (!item.classList.contains("visible")) {
      revealObserver.observe(item);
    }
  });
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

const currentPage = window.location.pathname.split("/").pop() || "index.html";
const pageSections = [...document.querySelectorAll("main section[id]")];
const pageLinkMap = new Map();

navLinks.forEach((link) => {
  const url = new URL(link.getAttribute("href"), window.location.href);
  const linkPage = url.pathname.split("/").pop() || "index.html";
  const sectionId = url.hash.replace("#", "");

  if (linkPage === currentPage && sectionId) {
    pageLinkMap.set(sectionId, link);
  }
});

if (homeLink) {
  const url = new URL(homeLink.getAttribute("href"), window.location.href);
  const linkPage = url.pathname.split("/").pop() || "index.html";
  const sectionId = url.hash.replace("#", "");

  if (linkPage === currentPage && sectionId) {
    pageLinkMap.set(sectionId, homeLink);
  }
}

const setActiveLink = (sectionId) => {
  sidebarLinks.forEach((link) => link.removeAttribute("aria-current"));

  const activeLink = pageLinkMap.get(sectionId);
  if (activeLink) {
    activeLink.setAttribute("aria-current", "page");
  }
};

if (pageSections.length > 0) {
  const hashTarget = window.location.hash.replace("#", "");
  const initialSection =
    hashTarget && pageLinkMap.has(hashTarget) ? hashTarget : pageSections[0].id;

  setActiveLink(initialSection);

  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio);

        if (visibleSections[0]) {
          setActiveLink(visibleSections[0].target.id);
        }
      },
      {
        threshold: [0.25, 0.55, 0.8],
        rootMargin: "-20% 0px -45% 0px",
      }
    );

    pageSections.forEach((section) => navObserver.observe(section));
  }

  window.addEventListener("hashchange", () => {
    const targetId = window.location.hash.replace("#", "");
    if (targetId && pageLinkMap.has(targetId)) {
      setActiveLink(targetId);
    }
  });
}
