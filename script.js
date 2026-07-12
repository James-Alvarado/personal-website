const sidebar = document.querySelector("[data-sidebar]");
const navLinks = [...document.querySelectorAll(".nav-link")];
const revealItems = [...document.querySelectorAll(".reveal")];
const cardToggles = [...document.querySelectorAll(".card-toggle")];
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

  navLinks.forEach((link) => {
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

const setActiveLink = (sectionId) => {
  navLinks.forEach((link) => link.removeAttribute("aria-current"));

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
