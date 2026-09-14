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
    var targets = document.querySelectorAll(".card, .statement, .flow__step, .video__frame, .qa");
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

  /* --- Video facade (click-to-load) ------------------------------------- */
  function extractVideoId(url) {
    var match = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{6,})/);
    return match ? match[1] : null;
  }

  function initVideo() {
    var block = document.querySelector("[data-video-block]");
    if (!block) return;

    var button = block.querySelector("[data-video-play]");
    var caption = block.querySelector("[data-video-caption]");
    var url = (config.videoUrl || "").trim();
    var id = url ? extractVideoId(url) : null;

    /* No configured video: keep the placeholder exactly as shipped. */
    if (!button || !id) return;

    if (caption) {
      caption.textContent = "Sixty seconds on what CrashDash is, and who it is for.";
    }

    button.addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?rel=0";
      frame.title = config.videoTitle || "CrashDash introduction";
      frame.setAttribute("loading", "lazy");
      frame.setAttribute("allowfullscreen", "");
      frame.setAttribute("allow", "encrypted-media; picture-in-picture");
      button.replaceWith(frame);
      if (caption) caption.remove();
      frame.focus();
    });
  }

  function init() {
    initNav();
    initBetaLinks();
    initVideo();
    initYear();
    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
