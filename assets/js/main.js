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
      if (window.innerWidth > 900) setOpen(false);
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

  /* --- Cinematic messages ---------------------------------------------- */
  function initCinematicMessages() {
    var frame = document.querySelector(".crashdash-cinematic-frame");
    var conversion = document.querySelector("[data-video-conversion]");
    if (!frame) return;

    window.addEventListener("message", function (event) {
      if (event.origin !== window.location.origin || event.source !== frame.contentWindow) return;
      if (!event.data || typeof event.data.type !== "string") return;

      if (event.data.type === "crashdash:request-beta") {
        var betaLink = conversion && conversion.querySelector("[data-beta-link]");
        if (betaLink) betaLink.click();
      }

      if (event.data.type === "crashdash:cinematic-complete" && conversion) {
        conversion.classList.remove("is-emphasized");
        void conversion.offsetWidth;
        conversion.classList.add("is-emphasized");
      }
    });
  }

  /* --- Footer year ------------------------------------------------------ */
  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* --- Scroll reveal ----------------------------------------------------
     Deliberately NOT implemented. An earlier revision faded sections in on
     scroll, but a class-name mismatch between the script and the stylesheet
     could leave content permanently invisible. On a conversion page the copy
     must always be visible, so no element starts hidden. */

  function init() {
    initNav();
    initBetaLinks();
    initCinematicMessages();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
