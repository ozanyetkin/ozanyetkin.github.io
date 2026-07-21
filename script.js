/**
 * Navigation and UI Functions
 * Handles sidebar toggling, theme switching, and responsive behavior
 */

// Constants
let _sidebarWidth = null;
const getSidebarWidth = () => {
  if (_sidebarWidth === null) {
    const rootStyles = getComputedStyle(document.documentElement);
    const sidebarWidthVar = rootStyles
      .getPropertyValue("--sidebar-width")
      .trim();
    _sidebarWidth = parseInt(sidebarWidthVar || "340", 10);
  }
  return _sidebarWidth;
};

// Keep in sync with CSS transition duration (e.g. `--transition: 0.3s ease` in the stylesheet)
// If you change this value, update the corresponding CSS transition so animations stay aligned.
const ANIMATION_DURATION = 300;

// Keep in sync with the `.reveal` opacity transition duration in style.css (0.5s).
const cardRevealDuration = 500;

// Keep in sync with CSS media queries that use the same breakpoint (e.g. `@media (max-width: 768px)`).
// If you change this value, update the CSS media query breakpoint to match.
const MOBILE_BREAKPOINT = 768;
const SWIPE_THRESHOLD = 50;
const SCROLL_HIDE_TIMEOUT = 1000;

/**
 * Toggle navigation sidebar
 * Desktop: slides sidebar left/right
 * Mobile: slides sidebar down from top
 */
function toggleNav() {
  const sidebar = document.getElementById("mySidebar");
  const mainContent = document.querySelector(".main-content");
  const downloadBtn = document.querySelector(".downloadbtn");
  const openBtn = document.querySelector(".openbtn");
  const sidebarWidth = getSidebarWidth();

  if (window.innerWidth > MOBILE_BREAKPOINT) {
    // Desktop: toggle sidebar left/right
    if (
      sidebar.style.transform === "translateX(0px)" ||
      sidebar.style.transform === ""
    ) {
      sidebar.style.transform = `translateX(-${sidebarWidth}px)`;
      mainContent.style.marginLeft = "0";
      setTimeout(() => {
        downloadBtn.style.display = "flex";
      }, ANIMATION_DURATION);
    } else {
      sidebar.style.transform = "translateX(0px)";
      mainContent.style.marginLeft = `${sidebarWidth}px`;
      downloadBtn.style.display = "none";
    }
  } else {
    // Mobile: toggle sidebar up/down
    if (sidebar.style.transform === "translateY(0px)") {
      sidebar.style.transform = "translateY(-100%)";
      sidebar.setAttribute("data-open", "false");
      openBtn.textContent = "■";
      downloadBtn.style.display = "none";
      document.body.style.overflow = "";
      setTimeout(() => {
        sidebar.style.display = "none";
      }, ANIMATION_DURATION);
    } else {
      sidebar.style.display = "block";
      sidebar.setAttribute("data-open", "true");
      openBtn.textContent = "⨯";
      downloadBtn.style.display = "flex";
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        sidebar.style.transform = "translateY(0px)";
      }, 10);
    }
  }
}

/**
 * Toggle between light and dark theme
 * Persists choice to localStorage
 */
function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById("theme-icon");
  const currentTheme = body.getAttribute("data-theme");

  if (currentTheme === "light") {
    body.removeAttribute("data-theme");
    themeIcon.textContent = "⬤";
    localStorage.setItem("theme", "dark");
  } else {
    body.setAttribute("data-theme", "light");
    themeIcon.textContent = "⬤";
    localStorage.setItem("theme", "light");
  }
}

/**
 * Initialize theme from saved preference
 * Loads theme from localStorage and applies it on page load
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme");
  const themeIcon = document.getElementById("theme-icon");

  if (savedTheme === "light") {
    document.body.setAttribute("data-theme", "light");
    themeIcon.textContent = "⬤";
  } else {
    document.body.removeAttribute("data-theme");
    themeIcon.textContent = "⬤";
  }
}

/**
 * Initialize sidebar state based on viewport width
 * Desktop: sidebar visible, positioned left
 * Mobile: sidebar hidden off-screen
 */
function initializeSidebar() {
  const sidebar = document.getElementById("mySidebar");
  const mainContent = document.querySelector(".main-content");
  const downloadBtn = document.querySelector(".downloadbtn");
  const openBtn = document.querySelector(".openbtn");
  const sidebarWidth = getSidebarWidth();

  if (window.innerWidth > MOBILE_BREAKPOINT) {
    // Desktop layout: sidebar visible on left
    sidebar.style.display = "block";
    sidebar.style.transform = "translateX(0px)";
    sidebar.setAttribute("data-open", "true");
    mainContent.style.marginLeft = `${sidebarWidth}px`;
    downloadBtn.style.display = "none";
    openBtn.style.display = "flex";
    openBtn.textContent = "■";
  } else {
    // Mobile layout: sidebar hidden above viewport
    sidebar.style.display = "none";
    sidebar.style.transform = "translateY(-100%)";
    sidebar.setAttribute("data-open", "false");
    mainContent.style.marginLeft = "0";
    downloadBtn.style.display = "none";
    openBtn.style.display = "flex";
    openBtn.textContent = "■";
  }
}

// Initialize the sidebar state and theme on page load
initializeSidebar();
initializeTheme();

// Reinitialize the sidebar state on window resize
window.onresize = initializeSidebar;

/**
 * Handle swipe gestures on mobile
 * Swipe up to close the sidebar when it's open
 */
let touchStartY = 0;
let touchEndY = 0;

function handleSwipeGesture() {
  const swipeDistance = touchStartY - touchEndY;
  const sidebar = document.getElementById("mySidebar");
  const isSidebarOpen = sidebar.getAttribute("data-open") === "true";

  // Swipe up gesture (distance > threshold) when sidebar is open
  if (
    swipeDistance > SWIPE_THRESHOLD &&
    isSidebarOpen &&
    window.innerWidth <= MOBILE_BREAKPOINT
  ) {
    toggleNav();
  }
}

document.addEventListener(
  "touchstart",
  (e) => {
    const sidebar = document.getElementById("mySidebar");
    const isSidebarOpen = sidebar.getAttribute("data-open") === "true";

    if (isSidebarOpen && window.innerWidth <= MOBILE_BREAKPOINT) {
      touchStartY = e.changedTouches[0].screenY;
    }
  },
  false,
);

document.addEventListener(
  "touchend",
  (e) => {
    const sidebar = document.getElementById("mySidebar");
    const isSidebarOpen = sidebar.getAttribute("data-open") === "true";

    if (isSidebarOpen && window.innerWidth <= MOBILE_BREAKPOINT) {
      touchEndY = e.changedTouches[0].screenY;
      handleSwipeGesture();
    }
  },
  false,
);

/**
 * Hide/show UI buttons on scroll for mobile devices
 * Buttons hide when scrolling down, show when scrolling up or stopped
 */
let lastScrollTop = 0;
let scrollTimeout;

window.addEventListener(
  "scroll",
  () => {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      const sidebar = document.getElementById("mySidebar");
      const isSidebarOpen = sidebar.getAttribute("data-open") === "true";

      // Don't hide buttons if sidebar is open
      if (isSidebarOpen) {
        return;
      }

      const currentScroll =
        window.pageYOffset || document.documentElement.scrollTop;
      const themeToggle = document.querySelector(".theme-toggle");
      const openBtn = document.querySelector(".openbtn");
      const buttonBar = document.querySelector(".mobile-button-bar");

      clearTimeout(scrollTimeout);

      if (currentScroll > lastScrollTop && currentScroll > 50) {
        // Scrolling down - hide buttons and bar
        themeToggle.style.transform = "translateY(-80px)";
        openBtn.style.transform = "translateY(-80px)";
        if (buttonBar) buttonBar.style.transform = "translateY(-80px)";
      } else {
        // Scrolling up - show buttons and bar
        themeToggle.style.transform = "translateY(0)";
        openBtn.style.transform = "translateY(0)";
        if (buttonBar) buttonBar.style.transform = "translateY(0)";
      }

      // Reset button position after scrolling stops
      scrollTimeout = setTimeout(() => {
        themeToggle.style.transform = "translateY(0)";
        openBtn.style.transform = "translateY(0)";
        if (buttonBar) buttonBar.style.transform = "translateY(0)";
      }, SCROLL_HIDE_TIMEOUT);

      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }
  },
  false,
);

document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".section");
  const navLinks = document.querySelectorAll(".sidebar a");

  /**
   * Auto-close sidebar when navigation link is clicked on mobile
   * Provides smooth scroll to target section
   */
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        const sidebar = document.getElementById("mySidebar");
        const isSidebarOpen = sidebar.getAttribute("data-open") === "true";
        if (isSidebarOpen) {
          e.preventDefault();

          // Add visual feedback - highlight the clicked link
          navLinks.forEach((l) => (l.style.background = ""));
          link.style.background = "var(--accent-color)";
          link.style.color = "var(--bg-color)";

          // Close sidebar after a brief delay to show selection
          setTimeout(() => {
            toggleNav();

            // Scroll to target after sidebar is closed
            setTimeout(() => {
              const targetId = link.getAttribute("href");
              const targetElement = document.querySelector(targetId);
              if (targetElement) {
                targetElement.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
              // Reset link style
              link.style.background = "";
              link.style.color = "";
            }, ANIMATION_DURATION + 50);
          }, ANIMATION_DURATION);
        }
      }
    });
  });

  /**
   * Update active navigation link based on scroll position
   * Highlights which section is currently in view
   */
  window.addEventListener("scroll", () => {
    let current = "";
    const scrollPosition =
      window.pageYOffset || document.documentElement.scrollTop;

    // Adjust offset based on screen size for better UX
    const offset = window.innerWidth <= MOBILE_BREAKPOINT ? 100 : 200;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (
        scrollPosition >= sectionTop - offset &&
        scrollPosition < sectionTop + sectionHeight - offset
      ) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href").substring(1) === current) {
        link.classList.add("active");

        // Update mobile bar title on mobile devices
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
          const mobileBarTitle = document.querySelector(".mobile-bar-title");
          if (mobileBarTitle) {
            const linkText = link.innerText.trim().replace(/^-\s*/, "");
            mobileBarTitle.textContent = linkText || "Ozan Yetkin";
          }
        }
      }
    });
  });
});

const heroPrefersReducedMotion =
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Scroll-reveal micro-interactions
 * Portfolio thumbnails still fade/type in lazily as the user scrolls to
 * them (there are dozens of them — too many to front-load). Featured-work
 * cards *used* to be on this same scroll-triggered path, but there are only
 * 4 of them, sitting right under the hero — practically always at least
 * partly in the initial viewport — so gating them behind
 * IntersectionObserver meant their reveal timing rode on the observer's
 * batching, which isn't reliable (a fast scroll can coalesce entering and
 * leaving into one event, or split simultaneously-visible cards across
 * separate callback invocations with no stagger between them, or — if the
 * observer never got a chance to register the intersection on the way past
 * — only actually fire once the user scrolls back up to it, reading as "it
 * retypes after I scroll down and up"). They're now front-loaded instead,
 * the same way CV sections are: revealed deterministically right when
 * Featured Work's own title finishes typing (see revealFeaturedCards,
 * called from revealSectionTitles) — no observer involved at all. CV
 * sections themselves are NOT scroll-triggered either: every section title
 * types out at the same time, right after the boot splash (see
 * `revealSectionTitles`) — a section near the top of the page used to race
 * the boot overlay's fade (IntersectionObserver fires as soon as
 * `observe()` is called for anything already in the viewport), finishing
 * its whole typing animation invisibly behind the still-opaque overlay. This
 * setup wraps every section title into hidden tw-chars up front too (see
 * sectionTitleSpans) — otherwise a title lower on the page sits fully
 * visible as plain text until its turn, then suddenly blanks out and
 * retypes, which read as "displayed first, animates after". Restrained by
 * design otherwise (short duration, small travel distance, one-time per
 * element, and a no-op under prefers-reduced-motion).
 */
function initScrollReveal() {
  const cardTargets = document.querySelectorAll(".thumbnail");
  const sectionTargets = document.querySelectorAll(".section");
  if (!cardTargets.length && !sectionTargets.length) return;

  if (
    heroPrefersReducedMotion ||
    typeof IntersectionObserver === "undefined"
  ) {
    cardTargets.forEach((el) => el.classList.add("is-visible"));
    sectionTargets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  // Hero pieces: the name types out letter-by-letter (wrapped into hidden
  // tw-chars up front, same reasoning as sectionTitleSpans below — otherwise
  // it'd sit fully visible until its turn, then blank out and retype), while
  // the title/contact lines pop in item-by-item once the boot splash
  // finishes — see revealHeroItems.
  const nameEl = document.querySelector(".profile-info h1");
  if (nameEl) heroNameSpans = wrapCharsForTypewriter(nameEl);
  getHeroPopItems().forEach((el) => el.classList.add("item-pending"));

  // Deliberately NOT giving .section the box-level `.reveal` fade (only
  // cards/thumbnails get it): that fade animates the *parent's* opacity
  // 0→1 over 500ms, and since opacity compounds through parent and child,
  // it visually smothered the much snappier per-character title typing
  // underneath into one blurry fade instead of distinct letters appearing —
  // that's what made the letter-by-letter animation hard to see. Sections
  // reveal purely through their title's tw-char typing and their content's
  // item-pending pop-in, with no extra wrapper animation on top.
  cardTargets.forEach((el) => el.classList.add("reveal"));
  sectionTargets.forEach((el) => {
    // Every section title is wrapped into (hidden) tw-chars right now,
    // up front, rather than lazily when its turn to type comes around —
    // otherwise a title further down the page sits fully visible as plain
    // text (nothing hid it) until the reveal sequence reaches it, at which
    // point it would suddenly blank out and only then start typing: a
    // visible "shown first, animates after" flash. The spans are stashed in
    // sectionTitleSpans so revealSectionTitles can just type them later
    // without re-wrapping (wrapping already-wrapped text would nest tw-c
    // inside tw-c).
    const titleEl = el.querySelector(":scope > .section-title");
    if (titleEl) {
      sectionTitleSpans.set(titleEl, wrapCharsForTypewriter(titleEl));
    }

    // Featured Work reveals each card individually (see revealFeaturedCards)
    // rather than the section's single .featured-grid wrapper as one block —
    // mark the cards themselves hidden, not the grid.
    if (el.id === "featured-work") {
      el.querySelectorAll(".featured-card").forEach((card) =>
        card.classList.add("item-pending"),
      );
      return;
    }

    // Sections type their title letter-by-letter and only then reveal the
    // body, item by item — mark each item hidden up front so there's no
    // flash of fully-visible content before that handoff happens. Research
    // Interests' single paragraph gets split into comma-separated keyword
    // chips instead (see revealResearchKeywords) once its title finishes —
    // marking the whole .item hidden here (already the default child of
    // .section-content) is enough to keep its raw, unsplit text from
    // flashing before that split happens.
    const contentEl = el.querySelector(":scope > .section-content");
    if (contentEl) {
      Array.from(contentEl.children).forEach((child) =>
        child.classList.add("item-pending"),
      );
    }
  });

  // threshold: 0 fires on the first pixel of overlap. A higher threshold looks
  // nicer for small cards, but breaks for elements taller than the viewport
  // (e.g. the Portfolio section on mobile) since their intersection ratio can
  // never reach it — they'd stay permanently hidden.
  const cardObserver = new IntersectionObserver(
    (entries) => {
      // Cards that scroll into view together (e.g. a whole row/grid at
      // once, or a fast scroll past a run of thumbnails) used to all fade
      // and start typing in the same instant — no perceptible order at all.
      // Staggering by position within *this* batch makes them cascade in
      // one after another instead, budgeted the same way section items are
      // (see computeStaggerInterval) so a big batch doesn't take forever.
      const visible = entries.filter((entry) => entry.isIntersecting);
      if (!visible.length) return;
      const staggerInterval = computeStaggerInterval(visible.length);

      visible.forEach((entry, i) => {
        const el = entry.target;
        cardObserver.unobserve(el);

        setTimeout(() => {
          el.classList.add("is-visible");

          // Wait for the card's own `.reveal` opacity fade-in (500ms, see
          // style.css) to finish before starting the letter-by-letter
          // title/desc typing inside it — see afterOpacityTransition.
          afterOpacityTransition(el, cardRevealDuration, () => {
            typeElementText(el, null, () => contentTypeSpeed);
          });
        }, i * staggerInterval);
      });
    },
    { threshold: 0 },
  );

  cardTargets.forEach((el) => cardObserver.observe(el));
}

document.addEventListener("DOMContentLoaded", initScrollReveal);

/**
 * Terminal typewriter engine
 * Wraps the visible text inside an element into one <tw-c class="tw-char">
 * per character (whitespace stays as plain text nodes so wrapping/spacing is
 * unaffected), then reveals those elements one at a time via a
 * self-scheduling setTimeout loop. A custom `<tw-c>` tag (undefined elements
 * are inline by default) is used instead of `<span>` on purpose: this
 * stylesheet has several existing `span`-targeting rules (`.contact-info
 * span`, `.item span:first-of-type`, `.item span:first-child::before`)
 * meant for the CV's structural spans — reusing `<span>` for character
 * wrappers would make those rules misfire on individual letters. The
 * original text nodes stay intact until the moment they're wrapped, so
 * markup (links, bold, etc.) and copy/paste both keep working normally.
 */
let contentTypeSpeed = 32; // ms between characters for CV/section content
const bootTypeSpeed = 60; // ms between characters typing the boot splash
const bootEraseSpeed = 26; // ms between characters rolling the boot splash back

// Item-by-item pop-in (hero pieces, section-content children, card/thumbnail
// batches) uses a budget-based interval rather than one flat speed: a fixed
// 45ms gap was too fast to read as separate items for short lists (2-4
// items, e.g. Research Interests' single paragraph, Featured Work's cards)
// while, for a long list, the same *ceiling* would make the whole section
// take forever to finish. Spending a roughly fixed total budget across the
// list — clamped between a floor (keeps very long sections snappy) and a
// ceiling (keeps very short ones from feeling instant) — makes short lists
// visibly cascade without letting long ones (Organized Events, Assisted
// Courses, ~13-14 items) run past ~0.7s.
const ITEM_REVEAL_MIN_INTERVAL = 40;
const ITEM_REVEAL_MAX_INTERVAL = 130;
const ITEM_REVEAL_BUDGET = 700;

// Keep in sync with the item-pop transition duration in style.css (0.26s) —
// used to predict when a section's last item finishes fading in, not just
// when it starts (see revealSectionTitles).
const ITEM_POP_TRANSITION_MS = 260;

function computeStaggerInterval(count) {
  if (count <= 1) return 0;
  const budgeted = ITEM_REVEAL_BUDGET / (count - 1);
  return Math.max(
    ITEM_REVEAL_MIN_INTERVAL,
    Math.min(ITEM_REVEAL_MAX_INTERVAL, budgeted),
  );
}

// Section titles are wrapped into (hidden) tw-chars up front by
// initScrollReveal, before any of them are actually typed — this map holds
// on to those spans so revealSectionTitles can type them later without
// re-wrapping already-wrapped text.
const sectionTitleSpans = new WeakMap();

// Same idea for the hero name (.profile-info h1) — a single element, so a
// plain variable rather than a WeakMap is enough. Populated by
// initScrollReveal, consumed by revealHeroItems.
let heroNameSpans = [];

// Splits the text nodes under `root` into individually-revealable <span>s and
// returns them in document order. `skipSelector`, if given, excludes text
// nodes whose nearest matching ancestor isn't `root` itself (for excluding a
// nested subtree that's typed independently, should one ever exist again —
// nothing currently passes a non-null skipSelector).
function wrapCharsForTypewriter(root, skipSelector) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !/\S/.test(node.nodeValue)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (skipSelector) {
        const container = node.parentElement && node.parentElement.closest(skipSelector);
        if (container && container !== root) return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);

  const spans = [];
  textNodes.forEach((textNode) => {
    const frag = document.createDocumentFragment();
    for (const ch of textNode.nodeValue) {
      if (ch === " " || ch === "\n" || ch === "\t") {
        frag.appendChild(document.createTextNode(ch));
        continue;
      }
      const span = document.createElement("tw-c");
      span.className = "tw-char";
      span.textContent = ch;
      frag.appendChild(span);
      spans.push(span);
    }
    textNode.parentNode.replaceChild(frag, textNode);
  });

  return spans;
}

// Reveals `spans` one at a time, in order.
function typeSpans(spans, speedGetter, onComplete) {
  let i = 0;
  function step() {
    if (i >= spans.length) {
      if (onComplete) onComplete();
      return;
    }
    spans[i].classList.add("tw-in");
    i += 1;
    setTimeout(step, speedGetter());
  }
  step();
}

// Hides `spans` one at a time, starting from the last character — a
// terminal "rolling back" what it just typed.
function untypeSpans(spans, speedGetter, onComplete) {
  let i = spans.length - 1;
  function step() {
    if (i < 0) {
      if (onComplete) onComplete();
      return;
    }
    spans[i].classList.remove("tw-in");
    i -= 1;
    setTimeout(step, speedGetter());
  }
  step();
}

function typeElementText(root, skipSelector, speedGetter, onComplete) {
  const spans = wrapCharsForTypewriter(root, skipSelector);
  typeSpans(spans, speedGetter, onComplete);
}

// Waits for `el`'s own opacity transition to finish before calling `cb` —
// used to sequence a container's fade-in ahead of an independently
// opacity-animating child (typed text) so the two don't compound (see
// feedback-compounding-opacity-masks-child-animation). Checks
// `e.propertyName === "opacity"` and only unregisters once that specific
// event fires, rather than `{once: true}` alone — a container fading both
// `opacity` and `transform` can finish either one first, and `{once: true}`
// would consume the listener on whichever fires first even if it's the
// wrong property, silently missing the one this is actually waiting for.
// `fallbackMs` covers the case where no transition ever plays at all (e.g.
// the hidden -> visible class change lands in the same tick as first
// paint, so the browser never renders an intermediate state to animate
// from, and no `transitionend` fires).
function afterOpacityTransition(el, fallbackMs, cb) {
  let done = false;
  function finish() {
    if (done) return;
    done = true;
    el.removeEventListener("transitionend", onTransitionEnd);
    cb();
  }
  function onTransitionEnd(e) {
    if (e.propertyName === "opacity") finish();
  }
  el.addEventListener("transitionend", onTransitionEnd);
  setTimeout(finish, fallbackMs);
}

// Types every element in `elements` concurrently (each on its own
// character-by-character schedule), calling `onAllComplete` once every one
// of them has finished. Used to type the hero and sidebar pieces at the same
// time and only move on to the section sequence once both are fully done.
function typeElementsInParallel(elements, speedGetter, onAllComplete) {
  if (!elements.length) {
    if (onAllComplete) onAllComplete();
    return;
  }
  let remaining = elements.length;
  elements.forEach((el) => {
    typeElementText(el, null, speedGetter, () => {
      remaining -= 1;
      if (remaining === 0 && onAllComplete) onAllComplete();
    });
  });
}

// Pops each element in `elements` in one at a time (removing the
// `item-pending` class that starts it hidden/offset — see the
// `.item-pending` CSS), instead of typing every character of every CV item,
// which is too slow for long sections.
function revealElementsStaggered(elements, speedGetter, onComplete) {
  let i = 0;
  function step() {
    if (i >= elements.length) {
      if (onComplete) onComplete();
      return;
    }
    elements[i].classList.remove("item-pending");
    i += 1;
    setTimeout(step, speedGetter());
  }
  step();
}

/**
 * Boot splash + hero/sidebar/section typewriter intro
 * Types a "> hello world!" terminal boot line on every page load, pauses,
 * rolls it back out (character by character, in reverse), then fades the
 * splash away while: the hero name types out letter-by-letter, the title
 * and contact lines pop in item-by-item underneath it, the sidebar types
 * itself out letter-by-letter too (echoing the "> hello world!" prompt
 * already used there), and once *both* the hero and sidebar finish, every
 * CV section title starts typing at the same time (see revealSectionTitles)
 * — not one after another, and not gated by scroll position, so a section
 * that happens to start out in the viewport (Research Interests, Education,
 * ...) still gets to play its animation instead of finishing invisibly
 * behind the overlay. Each section's own items only pop in once *that
 * section's* title finishes, independent of every other section. Not
 * skippable by design, and skipped entirely under prefers-reduced-motion,
 * matching the rest of the site's motion-reduction handling.
 */
// The name (h1) types out letter-by-letter instead — see heroNameSpans —
// so it's excluded here; these are the pieces that still pop in as whole
// items.
function getHeroPopItems() {
  return [
    document.querySelector(".profile-info h2"),
    ...document.querySelectorAll(".profile-info .contact-info > span"),
  ].filter(Boolean);
}

// Types the name first (echoing the boot prompt's own letter-by-letter
// "hello world!"), then pops the title/contact lines in underneath it once
// the name's done — same title-then-items shape sections use.
function revealHeroItems(onComplete) {
  const popItems = getHeroPopItems();
  const revealPopItems = () => {
    revealElementsStaggered(
      popItems,
      () => computeStaggerInterval(popItems.length),
      onComplete,
    );
  };
  if (heroNameSpans.length) {
    typeSpans(heroNameSpans, () => contentTypeSpeed, revealPopItems);
  } else {
    revealPopItems();
  }
}

function revealSidebar(onComplete) {
  const sidebarTargets = Array.from(
    document.querySelectorAll("#mySidebar h1, #mySidebar a"),
  );
  typeElementsInParallel(sidebarTargets, () => contentTypeSpeed, onComplete);
}

// Reveals each featured-work card one at a time — item-pending pop-in
// (fade+rise) for the whole card, staggered the same way section items are
// (see computeStaggerInterval). Text is left as plain, ordinary text rather
// than typed letter-by-letter — typing it after the card had already faded
// in read as a second, redundant reveal stacked on top of the first.
// Deterministic and front-loaded (called once Featured Work's title
// finishes typing) rather than scroll-gated — see the comment above
// initScrollReveal for why.
function revealFeaturedCards(cards, onComplete) {
  const staggerInterval = computeStaggerInterval(cards.length);
  cards.forEach((card, i) => {
    setTimeout(() => {
      card.classList.remove("item-pending");
    }, i * staggerInterval);
  });
  if (onComplete) onComplete();
}

// Splits Research Interests' single comma-separated paragraph into
// individually-revealable keyword chips (a custom `<tw-kw>` tag, not
// `<span>` — see feedback-typewriter-span-selectors) instead of popping the
// whole paragraph in as one block. The surrounding `.item` was already
// hidden as a whole by initScrollReveal (so the raw, unsplit text never
// flashes before this runs); it's unhidden here with its transition
// switched off for one frame so its own opacity change is instant rather
// than an animated fade compounding with the chips' (see
// feedback-compounding-opacity-masks-child-animation) — only the chips
// animate.
function revealResearchKeywords(section, onComplete) {
  const item = section.querySelector(":scope > .section-content > .item");
  const span = item && item.querySelector("span");
  if (!item || !span) {
    if (onComplete) onComplete();
    return;
  }

  const text = span.textContent.replace(/\s+/g, " ").trim();
  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  span.textContent = "";
  const chips = parts.map((part, i) => {
    const chip = document.createElement("tw-kw");
    chip.className = "kw-chip item-pending";
    chip.textContent = i < parts.length - 1 ? `${part},` : part;
    return chip;
  });
  chips.forEach((chip, i) => {
    span.appendChild(chip);
    if (i < chips.length - 1) span.appendChild(document.createTextNode(" "));
  });

  item.style.transition = "none";
  item.classList.remove("item-pending");
  void item.offsetWidth; // force a reflow so transition: none actually applies before...
  item.style.transition = "";

  revealElementsStaggered(chips, () => computeStaggerInterval(chips.length), onComplete);
}

// Types every section's title at the same time (all independently, each on
// its own schedule — not one after another) rather than making sections
// wait their turn: the sequential version had a section's title finish
// letter-typing and then just sit there while earlier sections were still
// working through theirs, which read as "waiting on scroll" even though
// nothing was scroll-gated. Each section's items still only pop in — one by
// one — once *that section's own* title finishes, independent of any other
// section's progress.
//
// Left alone, sections with a longer title or more items simply take
// longer end-to-end, so they finish trickling in well after short ones —
// "Assisted Courses" still popping items in while "Languages" settled a
// second ago. Every section's total reveal time (title typing + item
// stagger) is predicted up front (see predictSectionRevealDuration), and
// every section but the single slowest one is given a matching *start*
// delay so they all still finish at the same moment — short sections just
// wait a beat before they start, rather than racing ahead and idling.
function getSectionItemCount(el) {
  if (el.id === "featured-work") {
    return el.querySelectorAll(".featured-card").length;
  }
  if (el.id === "research-interests") {
    const span = el.querySelector(":scope > .section-content > .item span");
    const text = span ? span.textContent.replace(/\s+/g, " ").trim() : "";
    return text ? text.split(",").filter((part) => part.trim()).length : 0;
  }
  const contentEl = el.querySelector(":scope > .section-content");
  return contentEl ? contentEl.children.length : 0;
}

function predictSectionRevealDuration(el) {
  const titleEl = el.querySelector(":scope > .section-title");
  const spans = titleEl ? sectionTitleSpans.get(titleEl) : null;
  const titleDuration = spans && spans.length ? spans.length * contentTypeSpeed : 0;

  const itemCount = getSectionItemCount(el);
  if (itemCount === 0) return titleDuration;
  const staggerTail =
    itemCount > 1 ? (itemCount - 1) * computeStaggerInterval(itemCount) : 0;

  return titleDuration + staggerTail + ITEM_POP_TRANSITION_MS;
}

function revealSectionTitles() {
  const sections = Array.from(document.querySelectorAll(".section"));
  const durations = sections.map(predictSectionRevealDuration);
  const maxDuration = durations.length ? Math.max(...durations) : 0;

  sections.forEach((el, i) => {
    const startDelay = maxDuration - durations[i];
    setTimeout(() => {
      const titleEl = el.querySelector(":scope > .section-title");
      const contentEl = el.querySelector(":scope > .section-content");
      const revealItems = () => {
        if (el.id === "featured-work") {
          const cards = Array.from(el.querySelectorAll(".featured-card"));
          if (cards.length) revealFeaturedCards(cards);
          return;
        }
        if (el.id === "research-interests") {
          revealResearchKeywords(el);
          return;
        }
        if (contentEl) {
          const items = Array.from(contentEl.children);
          revealElementsStaggered(items, () => computeStaggerInterval(items.length));
        }
      };
      const spans = titleEl ? sectionTitleSpans.get(titleEl) : null;
      if (spans && spans.length) {
        typeSpans(spans, () => contentTypeSpeed, revealItems);
      } else {
        revealItems();
      }
    }, startDelay);
  });
}

// Grows/shrinks `el`'s plain text content one character at a time. Used only
// for the boot splash's "hello world!" input (a single flat string with no
// markup to preserve), rather than the <tw-c>-span engine used everywhere
// else — see the comment above #boot-input in style.css for why: real,
// ordinary text here gives the blinking cursor a normal baseline to track,
// instead of needing width/overflow tricks that threw off the whole line's
// vertical alignment.
function typeBootInput(el, text, speedGetter, onComplete) {
  let i = 0;
  function step() {
    el.textContent = text.slice(0, i);
    if (i >= text.length) {
      if (onComplete) onComplete();
      return;
    }
    i += 1;
    setTimeout(step, speedGetter());
  }
  step();
}

function untypeBootInput(el, text, speedGetter, onComplete) {
  let i = text.length;
  function step() {
    el.textContent = text.slice(0, i);
    if (i <= 0) {
      if (onComplete) onComplete();
      return;
    }
    i -= 1;
    setTimeout(step, speedGetter());
  }
  step();
}

function startBootSequence() {
  const overlay = document.getElementById("boot-overlay");
  const bootInputEl = document.getElementById("boot-input");

  if (
    heroPrefersReducedMotion ||
    !overlay ||
    !bootInputEl ||
    typeof IntersectionObserver === "undefined"
  ) {
    if (overlay) overlay.style.display = "none";
    return;
  }

  const bootText = "hello world!";

  typeBootInput(bootInputEl, bootText, () => bootTypeSpeed, () => {
    setTimeout(() => {
      untypeBootInput(bootInputEl, bootText, () => bootEraseSpeed, () => {
        setTimeout(() => {
          overlay.classList.add("is-hidden");

          let remaining = 2;
          const afterHeroAndSidebar = () => {
            remaining -= 1;
            if (remaining === 0) revealSectionTitles();
          };
          revealHeroItems(afterHeroAndSidebar);
          revealSidebar(afterHeroAndSidebar);

          setTimeout(() => {
            overlay.style.display = "none";
          }, 500);
        }, 200);
      });
    }, 700);
  });
}

document.addEventListener("DOMContentLoaded", startBootSequence);

/**
 * Generate ATS-friendly PDF CV
 * Creates downloadable resume with proper formatting for Applicant Tracking Systems
 */

// Generate ATS-friendly PDF for CV using jsPDF
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("ats-toggle-btn");
  if (btn) btn.addEventListener("click", generateATS);
});

// Preferred monospace font for jsPDF (fallbacks to 'courier' if not available)
let MONO_FONT = "courier";

async function ensureMonospaceFont(doc) {
  try {
    const regularUrl = "assets/fonts/JetBrainsMono-VariableFont_wght.ttf";
    const italicUrl = "assets/fonts/JetBrainsMono-Italic-VariableFont_wght.ttf";

    const [regularB64, italicB64] = await Promise.all([
      fetchFontAsBase64(regularUrl),
      fetchFontAsBase64(italicUrl),
    ]);

    if (!regularB64) return; // graceful fallback to built-in 'courier'

    const fontName = "JetBrainsMono";
    // Register regular
    doc.addFileToVFS("JetBrainsMono-VariableFont_wght.ttf", regularB64);
    doc.addFont("JetBrainsMono-VariableFont_wght.ttf", fontName, "normal");

    // Register bold using the same regular font
    doc.addFont("JetBrainsMono-VariableFont_wght.ttf", fontName, "bold");

    // Register italic if available
    if (italicB64) {
      doc.addFileToVFS("JetBrainsMono-Italic-VariableFont_wght.ttf", italicB64);
      doc.addFont(
        "JetBrainsMono-Italic-VariableFont_wght.ttf",
        fontName,
        "italic",
      );
    }

    MONO_FONT = fontName;
  } catch (_) {
    // ignore and keep default 'courier'
  }
}

async function fetchFontAsBase64(url) {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return arrayBufferToBase64(buf);
  } catch (_) {
    return null;
  }
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function drawTextWithWeight(doc, text, x, y, weight = "normal") {
  doc.text(text, x, y);
  if (weight === "bold") {
    doc.text(text, x + 0.25, y);
  }
}

function drawLinesWithWeight(
  doc,
  lines,
  x,
  startY,
  lineHeight,
  weight = "normal",
) {
  lines.forEach((line, index) => {
    drawTextWithWeight(doc, line, x, startY + index * lineHeight, weight);
  });
}

async function generateATS() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "A4" });
  const margin = 40;
  const lineHeight = 14;
  const itemGap = 4;
  const sectionGap = 8;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Attempt to load a simpler monospace font before rendering
  await ensureMonospaceFont(doc);

  // Load and draw photo
  const imgEl = document.querySelector(".profile-header img");
  if (imgEl) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgEl.src;
    img.onload = () => {
      const imgH = lineHeight * 5.4;
      const imgW = (img.width / img.height) * imgH;
      const imgX = margin;
      const imgY = margin;
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      doc.addImage(dataURL, "PNG", imgX, imgY, imgW, imgH);
      buildText(imgW + 10);
    };
  } else {
    buildText(0);
  }

  function buildText(offsetX) {
    let xStart = margin + offsetX;
    let y = margin;

    // Name
    const name =
      document.querySelector("#contact-info")?.innerText.trim() || "";
    if (name) {
      doc.setTextColor("#1a73e8");
      doc.setFont(MONO_FONT, "bold").setFontSize(12);
      drawTextWithWeight(doc, name, xStart, y, "bold");
      y += lineHeight * 1.2;

      // Title
      doc.setFont(MONO_FONT, "bold").setFontSize(10);
      const titleElement = document.querySelector(".profile-info h2");
      const title = titleElement
        ? titleElement.innerText.trim()
        : "Researcher | Developer | Designer";
      doc.setTextColor("#000000");
      doc.text(title, xStart, y);
      y += lineHeight * 1.2;

      doc.setTextColor("#000000");
    }

    // Contact Info: bold labels, comma-separated, link colored & underlined
    doc.setFont(MONO_FONT, "normal").setFontSize(8);
    document.querySelectorAll(".contact-info span").forEach((span) => {
      let x = xStart;
      const labelEl = span.querySelector("strong");
      if (labelEl) {
        const label = labelEl.innerText.replace(":", "").trim() + ": ";
        doc.setFont(MONO_FONT, "bold");
        doc.text(label, x, y);
        x += doc.getTextWidth(label);
      }
      const links = Array.from(span.querySelectorAll("a"));
      links.forEach((a, i) => {
        const text = a.innerText.trim();
        doc.setTextColor("#fe4f68").setFont(MONO_FONT, "normal");
        doc.textWithLink(text, x, y, { url: a.href.trim() });
        const w = doc.getTextWidth(text);
        doc.setDrawColor("#fe4f68").setLineWidth(0.5);
        doc.line(x, y + 1, x + w, y + 1);
        x += w;
        if (i < links.length - 1) {
          const sep = ", ";
          doc.setTextColor("#000000");
          doc.text(sep, x, y);
          x += doc.getTextWidth(sep);
        }
        doc.setTextColor("#000000");
      });
      y += lineHeight;
    });
    y += lineHeight;

    // Research Interests: wrap
    const riEl = document.querySelector("#research-interests .section-content");
    const riText = riEl?.innerText.replace(/\s+/g, " ").trim() || "";
    if (riText) {
      doc.setTextColor("#1a73e8").setFont(MONO_FONT, "bold").setFontSize(10);
      drawTextWithWeight(doc, "RESEARCH INTERESTS", margin, y, "bold");
      y += lineHeight;
      doc.setTextColor("#000000").setFont(MONO_FONT, "normal").setFontSize(8);
      const availW = pageWidth - 2 * margin;
      const lines = doc.splitTextToSize(riText, availW);
      doc.text(lines, margin, y);
      y += lines.length * lineHeight + sectionGap;
    }

    // ATS-friendly unique section mapping
    const sectionMapping = {
      education: "EDUCATION",
      "work-experience": "PROFESSIONAL EXPERIENCE",
      "research-experience": "RESEARCH PROJECTS",
      publications: "PUBLICATIONS",
      "organized-events": "LEADERSHIP & EVENTS",
      "assisted-courses": "TEACHING EXPERIENCE",
      "workshops-certificates": "CERTIFICATIONS",
      languages: "LANGUAGES",
      "computer-literacy": "TECHNICAL SKILLS",
    };

    // Group sections by standard titles
    const groupedSections = {};
    const sections = [
      "education",
      "work-experience",
      "research-experience",
      "publications",
      "organized-events",
      "assisted-courses",
      "workshops-certificates",
      "languages",
      "computer-literacy",
    ];

    sections.forEach((id) => {
      const standardTitle = sectionMapping[id];
      if (!groupedSections[standardTitle]) {
        groupedSections[standardTitle] = [];
      }
      groupedSections[standardTitle].push(id);
    });

    // Render sections in standard order
    const standardOrder = [
      "EDUCATION",
      "PROFESSIONAL EXPERIENCE",
      "RESEARCH PROJECTS",
      "PUBLICATIONS",
      "LEADERSHIP & EVENTS",
      "TEACHING EXPERIENCE",
      "CERTIFICATIONS",
      "LANGUAGES",
      "TECHNICAL SKILLS",
    ];

    function renderStandardItem(item) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      const [lblEl, dateEl] = item.querySelectorAll(".item-header span");
      const lbl = lblEl?.innerText.trim() || "";
      const date = dateEl?.innerText.trim() || "";
      const dtW = date ? doc.getTextWidth(date) : 0;
      const availW = pageWidth - 2 * margin - dtW - 20;

      doc.setFont(MONO_FONT, "bold");
      const lines = doc.splitTextToSize(`- ${lbl}`, availW);
      drawLinesWithWeight(doc, lines, margin, y, lineHeight, "bold");
      if (date) {
        doc.setFont(MONO_FONT, "bold");
        drawTextWithWeight(doc, date, pageWidth - margin - dtW, y, "bold");
      }
      y += lines.length * lineHeight;

      const detailSpans = Array.from(item.querySelectorAll(":scope > span"));
      detailSpans.forEach((span) => {
        const detail = span.innerText.trim();
        if (!detail) return;
        const dls = doc.splitTextToSize(detail, availW - 20);
        const isSecondaryDetail =
          span.classList.contains("item-description") ||
          span.classList.contains("thesis-title");
        doc.setFont(MONO_FONT, isSecondaryDetail ? "italic" : "normal");
        doc.setFontSize(isSecondaryDetail ? 7 : 8);
        doc.setTextColor(isSecondaryDetail ? "#666666" : "#000000");
        drawLinesWithWeight(doc, dls, margin + 20, y, lineHeight, "normal");
        y += dls.length * lineHeight;
      });

      doc.setFont(MONO_FONT, "normal");
      doc.setFontSize(8);
      doc.setTextColor("#000000");
      y += itemGap;
    }

    standardOrder.forEach((standardTitle) => {
      if (!groupedSections[standardTitle]) return;

      // Print section header once
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.setTextColor("#1a73e8").setFont(MONO_FONT, "bold").setFontSize(10);
      drawTextWithWeight(doc, standardTitle, margin, y, "bold");
      y += lineHeight;
      doc.setTextColor("#000000").setFont(MONO_FONT, "normal").setFontSize(8);

      groupedSections[standardTitle].forEach((id) => {
        const sec = document.getElementById(id);
        if (!sec) return;

        if (id === "workshops-certificates") {
          sec.querySelectorAll(".item").forEach((item) => {
            if (y > pageHeight - margin) {
              doc.addPage();
              y = margin;
            }
            const [lblEl, dateEl] = item.querySelectorAll(".item-header span");
            const lbl = lblEl?.innerText.trim() || "";
            const date = dateEl?.innerText.trim() || "";
            const entity =
              item.querySelector(":scope>span")?.innerText.trim() || "";

            const dtW = date ? doc.getTextWidth(date) : 0;
            const availW = pageWidth - 2 * margin - dtW;

            // Split text to handle bold formatting
            const bulletAndLabel = `- ${lbl}`;
            const commaAndEntity = entity ? `, ${entity}` : "";

            doc.setFont(MONO_FONT, "bold");
            const boldLines = doc.splitTextToSize(bulletAndLabel, availW);

            boldLines.forEach((ln, i) => {
              drawTextWithWeight(doc, ln, margin, y + i * lineHeight, "bold");
              if (i === boldLines.length - 1 && commaAndEntity) {
                const boldWidth = doc.getTextWidth(ln);
                doc.setFont(MONO_FONT, "normal");
                const normalLines = doc.splitTextToSize(
                  commaAndEntity,
                  availW - boldWidth,
                );
                drawTextWithWeight(
                  doc,
                  normalLines[0] || commaAndEntity,
                  margin + boldWidth,
                  y + i * lineHeight,
                  "normal",
                );
                if (normalLines.length > 1) {
                  normalLines.slice(1).forEach((normalLn, j) => {
                    drawTextWithWeight(
                      doc,
                      normalLn,
                      margin,
                      y + (i + j + 1) * lineHeight,
                      "normal",
                    );
                  });
                }
              }
            });

            if (date) {
              doc.setFont(MONO_FONT, "bold");
              drawTextWithWeight(
                doc,
                date,
                pageWidth - margin - dtW,
                y,
                "bold",
              );
            }

            const totalLines =
              boldLines.length +
              (commaAndEntity && boldLines.length > 0
                ? Math.max(
                    0,
                    doc.splitTextToSize(
                      commaAndEntity,
                      availW -
                        doc.getTextWidth(boldLines[boldLines.length - 1]),
                    ).length - 1,
                  )
                : 0);
            y += totalLines * lineHeight + itemGap;
          });
          y += sectionGap;
          return;
        }

        if (id === "languages") {
          const items = Array.from(
            sec.querySelectorAll(".section-content-languages .item"),
          );
          const arr = items.map((it) => ({
            name: it.querySelectorAll("span")[0].innerText.trim(),
            level: it.querySelectorAll("span")[2].innerText.trim(),
          }));
          const col = (pageWidth - 2 * margin) / 2;
          const half = Math.ceil(arr.length / 2);
          for (let i = 0; i < half; i++) {
            if (y > pageHeight - margin) {
              doc.addPage();
              y = margin;
            }
            doc.setFont(MONO_FONT, "bold");
            drawTextWithWeight(doc, `- ${arr[i].name}`, margin, y, "bold");
            doc.setFont(MONO_FONT, "normal");
            drawTextWithWeight(
              doc,
              `: ${arr[i].level}`,
              margin + doc.getTextWidth(`- ${arr[i].name}`),
              y,
              "normal",
            );
            if (arr[i + half]) {
              doc.setFont(MONO_FONT, "bold");
              drawTextWithWeight(
                doc,
                `- ${arr[i + half].name}`,
                margin + col,
                y,
                "bold",
              );
              doc.setFont(MONO_FONT, "normal");
              drawTextWithWeight(
                doc,
                `: ${arr[i + half].level}`,
                margin + col + doc.getTextWidth(`- ${arr[i + half].name}`),
                y,
                "normal",
              );
            }
            y += lineHeight;
          }
          y += sectionGap;
          return;
        }

        if (id === "computer-literacy") {
          sec
            .querySelectorAll(".section-content-computer-literacy")
            .forEach((gr) => {
              const sub = gr.querySelector("h3")?.innerText.trim();
              if (sub) {
                if (y > pageHeight - margin) {
                  doc.addPage();
                  y = margin;
                }
                doc.setFont(MONO_FONT, "bold").setFontSize(9);
                drawTextWithWeight(doc, sub, margin, y, "bold");
                y += lineHeight;
                doc.setFont(MONO_FONT, "normal").setFontSize(8);
              }
              const arr = Array.from(gr.querySelectorAll(".item")).map(
                (it) => ({
                  name: it.querySelectorAll("span")[0].innerText.trim(),
                  level: it.querySelectorAll("span")[2].innerText.trim(),
                }),
              );
              const col2 = (pageWidth - 2 * margin) / 2;
              const half2 = Math.ceil(arr.length / 2);
              for (let i = 0; i < half2; i++) {
                if (y > pageHeight - margin) {
                  doc.addPage();
                  y = margin;
                }
                doc.setFont(MONO_FONT, "bold");
                drawTextWithWeight(doc, `- ${arr[i].name}`, margin, y, "bold");
                doc.setFont(MONO_FONT, "normal");
                drawTextWithWeight(
                  doc,
                  `: ${arr[i].level}`,
                  margin + doc.getTextWidth(`- ${arr[i].name}`),
                  y,
                  "normal",
                );
                if (arr[i + half2]) {
                  doc.setFont(MONO_FONT, "bold");
                  drawTextWithWeight(
                    doc,
                    `- ${arr[i + half2].name}`,
                    margin + col2,
                    y,
                    "bold",
                  );
                  doc.setFont(MONO_FONT, "normal");
                  drawTextWithWeight(
                    doc,
                    `: ${arr[i + half2].level}`,
                    margin +
                      col2 +
                      doc.getTextWidth(`- ${arr[i + half2].name}`),
                    y,
                    "normal",
                  );
                }
                y += lineHeight;
              }
              y += sectionGap;
            });
          return;
        }

        if (id === "publications") {
          const pubContent = sec.querySelector(".section-content");
          if (!pubContent) return;

          const publicationSubheadingTopGap = 3;
          const publicationSubheadingBottomGap = 3;

          const blocks = pubContent.querySelectorAll(
            ":scope > h3, :scope > .item",
          );
          blocks.forEach((block) => {
            if (block.tagName.toLowerCase() === "h3") {
              y += publicationSubheadingTopGap;
              if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
              }
              doc
                .setFont(MONO_FONT, "bold")
                .setFontSize(9)
                .setTextColor("#000000");
              drawTextWithWeight(
                doc,
                block.innerText.trim(),
                margin,
                y,
                "bold",
              );
              y += lineHeight + publicationSubheadingBottomGap;
              doc.setFont(MONO_FONT, "normal").setFontSize(8);
            } else {
              renderStandardItem(block);
            }
          });

          y += sectionGap;
          return;
        }

        sec
          .querySelectorAll(".item")
          .forEach((item) => renderStandardItem(item));
        y += sectionGap;
      });
    });

    // Portfolio at bottom: QR to right, text
    const portfolio = document.getElementById("portfolio");
    if (portfolio) {
      if (y > pageHeight - margin - 100) {
        doc.addPage();
        y = margin;
      }
      doc.setTextColor("#1a73e8").setFont(MONO_FONT, "bold").setFontSize(10);
      drawTextWithWeight(doc, "PORTFOLIO", margin, y, "bold");
      y += lineHeight;
      doc.setTextColor("#000000").setFont(MONO_FONT, "normal").setFontSize(8);
      const message =
        "Thank you for your time, please click the link or scan the QR code to enjoy some of my works";
      const availW = pageWidth - 2 * margin - 120;
      const msgLines = doc.splitTextToSize(message, availW);
      doc.text(msgLines, margin, y);
      // QR on right
      const link = "https://ozanyetkin.com/#portfolio";
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(link)}`;
      const qrImg = new Image();
      qrImg.crossOrigin = "Anonymous";
      qrImg.src = qrUrl;
      qrImg.onload = () => {
        doc.addImage(qrImg, "PNG", pageWidth - margin - 50, y - 20, 50, 50);
        doc.setTextColor("#000000").setFont(MONO_FONT, "normal");
        const msgLines = doc.splitTextToSize(message, availW);
        doc.text(msgLines, margin, y);
        y += msgLines.length * lineHeight + lineHeight * 0.5;
        doc.setTextColor("#fe4f68").setFont(MONO_FONT, "bold");
        doc.textWithLink("View Portfolio", margin, y, { url: link });
        doc.setTextColor("#000000");
        doc.save("Ozan_Yetkin_CV_ATS.pdf");
      };
    } else {
      doc.save("Ozan_Yetkin_CV.pdf");
    }
  }
}
