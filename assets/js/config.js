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
  betaRequestUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc6CessVM-ne8DAZRx-5C0WVipxjI065nFecHUUDdDxP6IDxw/viewform?usp=publish-editor",

  /* Open the beta link in a new tab. Set to false to navigate in the same tab. */
  betaOpensNewTab: true

};
