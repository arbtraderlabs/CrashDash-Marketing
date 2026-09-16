/**
 * CrashDash beta invite — CANONICAL, PUBLIC-SAFE EXAMPLE
 * =============================================================================
 *
 * This is the reference implementation of the beta access flow described in
 * ../BETA_ACCESS_FLOW.md. It matches the script that has been run in production
 * for the CrashDash beta: live "On form submit" trigger, visible
 * SENDING -> SENT transitions, captured failures, and a manual pending-row
 * recovery scan.
 *
 * This file is PUBLIC-SAFE and contains no private identifiers. It is a
 * copy-paste starting point, not a deployed artifact.
 *
 * INSTALL (manual, in the Apps Script project bound to the response Sheet):
 *   1. Paste this file into the Apps Script project bound to the response Sheet.
 *   2. Save.
 *   3. Add EXACTLY ONE installable trigger:
 *        function:   sendCrashDashInvite
 *        deployment: Head
 *        event:      From spreadsheet -> On form submit
 *   4. Create the trigger while signed in to the dedicated CrashDash Google
 *      account, so invites are sent from the CrashDash identity (see doc S4D).
 *
 * processPendingInvites() is a MANUAL recovery entry point and must NOT have a
 * trigger of its own.
 *
 * NEVER commit real values for: the form editor URL, Sheet ID, Apps Script
 * project ID, trigger IDs, credentials, or customer/form-response data.
 *
 * Columns (see doc S5):
 *   A Timestamp | B Name | C Email address | D What best describes you?
 *   E What are you mainly interested in? | F Mobile number
 *   G Invite Status | H Invite Sent At
 */

const ACCESS_LINK =
  "https://arbtraderlabs.github.io/CrashDash-v4-live-test/";

const GUIDE_LINK =
  "https://arbtraderlabs.github.io/CrashDash-v4-live-test/?view=guide";

const EXPECT_LINK =
  "https://arbtraderlabs.github.io/CrashDash-v4-live-test/?view=expect";

/**
 * LIVE ENTRY POINT
 *
 * Installable trigger:
 *   From spreadsheet -> On form submit
 */
function sendCrashDashInvite(e) {
  if (!e || !e.range) {
    throw new Error(
      "sendCrashDashInvite requires a spreadsheet form-submit event. " +
      "For manual recovery use processPendingInvites()."
    );
  }

  const sheet = e.range.getSheet();
  const row = e.range.getRow();

  processInviteRow_(sheet, row);
}

/**
 * INTERNAL SINGLE-ROW WORKER
 *
 * States:
 *   blank      -> pending
 *   SENDING    -> currently processing
 *   SENT       -> completed successfully
 *   FAILED:... -> send failed / recoverable
 */
function processInviteRow_(sheet, row) {
  const lock = LockService.getScriptLock();

  console.log("--------------------------------------------------");
  console.log("CrashDash invite processing started");
  console.log("Row: " + row);
  console.log("Sheet: " + sheet.getName());
  console.log(
    "Effective account: " +
    Session.getEffectiveUser().getEmail()
  );

  try {
    console.log("Attempting to acquire script lock...");

    lock.waitLock(30000);

    console.log("Script lock acquired.");

    // Columns:
    // A Timestamp
    // B Name
    // C Email address
    // D What best describes you?
    // E What are you mainly interested in?
    // F Mobile number
    // G Invite Status
    // H Invite Sent At

    const name = sheet
      .getRange(row, 2)
      .getValue()
      .toString()
      .trim();

    const displayName = name
      ? name.replace(/\b\w/g, c => c.toUpperCase())
      : "there";

    const email = sheet
      .getRange(row, 3)
      .getValue()
      .toString()
      .trim();

    const inviteStatus = sheet
      .getRange(row, 7)
      .getValue()
      .toString()
      .trim();

    console.log("Name: " + displayName);
    console.log("Email: " + email);
    console.log(
      "Current Invite Status: " +
      (inviteStatus || "<blank>")
    );

    if (
      inviteStatus === "SENT" ||
      inviteStatus === "SENDING"
    ) {
      console.log(
        "Invite skipped because row already has status: " +
        inviteStatus
      );

      return {
        status: "SKIPPED",
        reason: inviteStatus
      };
    }

    if (inviteStatus.startsWith("FAILED:")) {
      console.log(
        "Previous failure detected. Retrying row."
      );
    }

    if (!email) {
      const message = "Missing email address";

      sheet
        .getRange(row, 7)
        .setValue("FAILED: " + message);

      console.error(
        "Row " + row + " failed: " + message
      );

      return {
        status: "FAILED",
        reason: message
      };
    }

    sheet
      .getRange(row, 7)
      .setValue("SENDING");

    SpreadsheetApp.flush();

    console.log("Row marked SENDING.");
    console.log("Preparing email...");

    const subject = "Your CrashDash Early Access";

    const plainBody = `
Hi ${displayName},

Thanks for requesting early access to CrashDash.

CrashDash is designed to surface overlooked and beaten-down UK stocks worth a closer look, giving you a focused starting point for your own research.

Your CrashDash access:
${ACCESS_LINK}

How to use CrashDash:
${GUIDE_LINK}

What to expect:
${EXPECT_LINK}

This is an early POC, so feedback is especially useful while we continue refining the experience.

If you have any questions or feedback, just reply to this email.

Thanks,
CrashDash Team

Discover. Investigate. Decide.
`;

    const htmlBody = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;color:#202124;line-height:1.6;">

  <p>Hi ${displayName},</p>

  <p>
    Thanks for requesting early access to <strong>CrashDash</strong>.
  </p>

  <p>
    CrashDash helps surface overlooked and beaten-down UK stocks worth a closer look,
    giving you a focused starting point for your own research.
  </p>

  <p>
    <strong>Your access:</strong><br>
    <a href="${ACCESS_LINK}">${ACCESS_LINK}</a>
  </p>

  <p>
    A couple of useful links before you start:
  </p>

  <p>
    <a href="${GUIDE_LINK}">How to use CrashDash</a><br>
    <a href="${EXPECT_LINK}">What to expect</a>
  </p>

  <p>
    This is still an early POC, so any feedback is genuinely useful.
    Just reply to this email if you have questions or spot anything we should improve.
  </p>

  <p>
    Thanks,<br>
    <strong>CrashDash Team</strong>
  </p>

  <p style="font-size:12px;color:#777;">
    Discover. Investigate. Decide.
  </p>

</div>
`;

    console.log("About to send invite.");
    console.log("To: " + email);
    console.log(
      "From account: " +
      Session.getEffectiveUser().getEmail()
    );

    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody
    });

    console.log(
      "MailApp.sendEmail completed successfully."
    );

    sheet
      .getRange(row, 7)
      .setValue("SENT");

    sheet
      .getRange(row, 8)
      .setValue(new Date());

    SpreadsheetApp.flush();

    console.log(
      "Row " + row + " marked SENT."
    );

    console.log(
      "Invite successfully sent to: " + email
    );

    return {
      status: "SENT",
      email: email,
      row: row
    };

  } catch (error) {
    const message =
      error && error.message
        ? error.message
        : String(error);

    console.error(
      "CrashDash invite processing failed."
    );

    console.error(
      "Row: " + row
    );

    console.error(
      "Error: " + message
    );

    try {
      sheet
        .getRange(row, 7)
        .setValue("FAILED: " + message);

      SpreadsheetApp.flush();

      console.log(
        "Row marked FAILED."
      );

    } catch (statusError) {
      console.error(
        "Unable to write FAILED status: " +
        statusError.message
      );
    }

    throw error;

  } finally {
    try {
      lock.releaseLock();
      console.log("Script lock released.");
    } catch (lockError) {
      console.log(
        "Lock release skipped: " +
        lockError.message
      );
    }

    console.log(
      "CrashDash invite processing finished."
    );

    console.log(
      "--------------------------------------------------"
    );
  }
}

/**
 * OPS / BACKLOG RECOVERY
 *
 * Run manually from Apps Script when required.
 * Has NO trigger.
 *
 * SENT       -> skip
 * SENDING    -> skip
 * blank      -> process
 * FAILED:*   -> retry
 */
function processPendingInvites() {
  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getActiveSheet();

  const lastRow = sheet.getLastRow();

  console.log(
    "=================================================="
  );

  console.log(
    "CrashDash pending invite recovery started."
  );

  console.log(
    "Sheet: " + sheet.getName()
  );

  console.log(
    "Last row: " + lastRow
  );

  console.log(
    "Effective account: " +
    Session.getEffectiveUser().getEmail()
  );

  if (lastRow < 2) {
    console.log("No response rows found.");
    return;
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let retried = 0;

  for (let row = 2; row <= lastRow; row++) {
    const email = sheet
      .getRange(row, 3)
      .getValue()
      .toString()
      .trim();

    const inviteStatus = sheet
      .getRange(row, 7)
      .getValue()
      .toString()
      .trim();

    console.log(
      "--------------------------------------------------"
    );

    console.log(
      "Scanning row " + row
    );

    console.log(
      "Email: " + (email || "<blank>")
    );

    console.log(
      "Status: " +
      (inviteStatus || "<blank>")
    );

    if (
      inviteStatus === "SENT" ||
      inviteStatus === "SENDING"
    ) {
      console.log(
        "Row " + row +
        " skipped: already " +
        inviteStatus
      );

      skipped++;
      continue;
    }

    if (!email || !email.includes("@")) {
      console.log(
        "Row " + row +
        " skipped: email is blank or invalid."
      );

      skipped++;
      continue;
    }

    if (inviteStatus.startsWith("FAILED:")) {
      console.log(
        "Row " + row +
        " is a previous failure and will be retried."
      );

      retried++;
    }

    try {
      const result =
        processInviteRow_(sheet, row);

      if (
        result &&
        result.status === "SENT"
      ) {
        sent++;

      } else if (
        result &&
        result.status === "SKIPPED"
      ) {
        skipped++;
      }

    } catch (error) {
      failed++;

      console.error(
        "Recovery processing failed for row " +
        row
      );

      console.error(
        error && error.message
          ? error.message
          : String(error)
      );

      // Continue processing remaining rows.
      continue;
    }
  }

  console.log(
    "=================================================="
  );

  console.log(
    "CrashDash pending invite recovery complete."
  );

  console.log(
    "Sent: " + sent
  );

  console.log(
    "Skipped: " + skipped
  );

  console.log(
    "Retried: " + retried
  );

  console.log(
    "Failed: " + failed
  );

  console.log(
    "Rows scanned: " + (lastRow - 1)
  );

  console.log(
    "=================================================="
  );
}

/**
 * OPTIONAL DIAGNOSTIC
 */
function checkCrashDashMailStatus() {
  console.log(
    "Effective user: " +
    Session.getEffectiveUser().getEmail()
  );

  console.log(
    "Active user: " +
    Session.getActiveUser().getEmail()
  );

  console.log(
    "Remaining daily recipient quota: " +
    MailApp.getRemainingDailyQuota()
  );
}
