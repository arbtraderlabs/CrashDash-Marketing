/* ===========================================================================
   CrashDash Marketing — progressive enhancement
   ---------------------------------------------------------------------------
   The site is fully usable with this file absent. Everything below is
   enhancement only: navigation on small screens, the footer year, wiring the
   beta buttons, and a subtle scroll reveal.

   No network requests. No cookies. No storage.
   =========================================================================== */

(function () {
  "use strict";

  var config = window.CRASHDASH_SITE || {};

  /* --- Mobile navigation ------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 880) setOpen(false);
    });
  }

  /* --- Beta buttons ----------------------------------------------------- */
  function initBetaLinks() {
    var url = (config.betaRequestUrl || "").trim();
    if (!url) return;

    var links = document.querySelectorAll("[data-beta-link]");
    Array.prototype.forEach.call(links, function (link) {
      link.setAttribute("href", url);
      if (config.betaOpensNewTab !== false) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  /* --- Footer year ------------------------------------------------------ */
  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* --- Scroll reveal ---------------------------------------------------- */
  function initReveal() {
    var targets = document.querySelectorAll(".card, .sample, .pull, .qa");
    if (!targets.length) return;

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add("reveal");
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    Array.prototype.forEach.call(targets, function (el) {
      observer.observe(el);
    });
  }

  function init() {
    initNav();
    initBetaLinks();
    initYear();
    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
