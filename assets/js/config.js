/* ===========================================================================
   CrashDash Marketing — site configuration
   ---------------------------------------------------------------------------
   This is the ONLY file you need to edit before deploying.

   It contains no secrets. Do not add any.
   =========================================================================== */

window.CRASHDASH_SITE = {

  /* -------------------------------------------------------------------------
     BETA REQUEST LINK
     -------------------------------------------------------------------------
     Paste the public URL that should open when a visitor clicks
     "Request beta access" — for example a Google Form, Tally form or similar.

     Example:
       betaRequestUrl: "https://forms.example.com/crashdash-beta"

     Leave it as an empty string to keep every button on-page: visitors are
     routed to the "Private beta" section instead, so the site never ships a
     broken link.
     ------------------------------------------------------------------------- */
  betaRequestUrl: "",

  /* -------------------------------------------------------------------------
     INTRODUCTION VIDEO (optional)
     -------------------------------------------------------------------------
     Paste a YouTube URL to activate the "Why CrashDash?" section, e.g.

       videoUrl: "https://www.youtube.com/watch?v=XXXXXXXXXXX"

     Leave it as an empty string to keep the polished placeholder state. When
     empty the section never creates an iframe, so the site ships nothing broken.

     Nothing third-party is requested until a visitor clicks play.
     ------------------------------------------------------------------------- */
  videoUrl: "",

  /* Accessible title used on the embedded player. */
  videoTitle: "Why CrashDash? — 60 second introduction",

  /* Open the beta link in a new tab. Set to false to navigate in the same tab. */
  betaOpensNewTab: true

};
