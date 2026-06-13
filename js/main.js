/* PRIMA — Miell & Pasta — interactions */
(function () {
  "use strict";

  /* Progressive enhancement: mark that JS is running so the CSS can hide
     reveal elements only when we are able to bring them back. */
  document.documentElement.classList.add("js");

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nudge background videos to play ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("video"), function (v) {
    var tryPlay = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    if (v.readyState >= 2) tryPlay();
    v.addEventListener("canplay", tryPlay, { once: true });
  });

  /* ---------- Preloader (looping brand video) ---------- */
  var preloader = document.getElementById("preloader");
  if (preloader) {
    var MIN_MS = prefersReducedMotion ? 400 : 2200; // let one beat of the video breathe
    var MAX_MS = 6000;                               // hard fallback if assets stall
    var t0 = Date.now();
    var dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      preloader.classList.add("is-done");
      document.body.classList.remove("is-loading");
      window.setTimeout(function () {
        if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 1000);
    }
    function readyDismiss() {
      window.setTimeout(dismiss, Math.max(0, MIN_MS - (Date.now() - t0)));
    }

    if (document.readyState === "complete") readyDismiss();
    else window.addEventListener("load", readyDismiss);
    window.setTimeout(dismiss, MAX_MS);
    preloader.addEventListener("click", dismiss); // tap to skip
  } else {
    document.body.classList.remove("is-loading");
  }

  /* ---------- Sticky header ---------- */
  var header = document.getElementById("siteHeader");
  var backToTop = document.getElementById("backToTop");

  function onScroll() {
    var solid = window.scrollY > 40;
    header.classList.toggle("is-solid", solid);
    backToTop.classList.toggle("is-visible", window.scrollY > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  /* ---------- Mobile menu ---------- */
  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");

  function setMenu(open) {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Mbyll menunë" : "Hap menunë");
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
  }

  navToggle.addEventListener("click", function () {
    setMenu(navToggle.getAttribute("aria-expanded") !== "true");
  });

  mobileMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) {
      setMenu(false);
      navToggle.focus(); // return focus so keyboard users keep their place
    }
  });

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  var revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    // Stagger siblings that enter together: group by parent
    revealEls.forEach(function (el) {
      var siblings = el.parentElement
        ? Array.prototype.filter.call(el.parentElement.children, function (c) {
            return c.classList.contains("reveal");
          })
        : [el];
      var idx = siblings.indexOf(el);
      el.style.setProperty("--stagger", Math.min(idx, 5) * 0.09 + "s");
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll("[data-count]");

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }
    var duration = 1800;
    var start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window) {
    var counterIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            counterIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { counterIO.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Active nav highlighting ---------- */
  var sections = document.querySelectorAll("main section[id]");
  var navLinks = document.querySelectorAll(".main-nav a");

  if ("IntersectionObserver" in window && sections.length) {
    var sectionIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            navLinks.forEach(function (link) {
              link.classList.toggle(
                "is-active",
                link.getAttribute("href") === "#" + entry.target.id
              );
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) { sectionIO.observe(s); });
  }

  /* ---------- Forms (demo handlers) ---------- */
  function handleForm(formId, noteId, message) {
    var form = document.getElementById(formId);
    var note = document.getElementById(noteId);
    if (!form || !note) return;
    var timer;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      note.textContent = message;
      form.reset();
      clearTimeout(timer); // cancel any pending clear so a quick resubmit keeps its note
      timer = setTimeout(function () { note.textContent = ""; }, 6000);
    });
  }

  handleForm("contactForm", "formNote", "Faleminderit — ekipi ynë do t'ju përgjigjet brenda një dite pune.");
  handleForm("newsletterForm", "newsletterNote", "Mirë se vini! Shihemi në lajmin e radhës.");
})();
