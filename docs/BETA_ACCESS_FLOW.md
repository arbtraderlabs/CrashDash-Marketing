# CrashDash Beta Access Flow

> Operational reference for the CrashDash early-access signup and invite
> delivery automation.
>
> **Status: implemented, exercised and verified.** This document describes what
> has actually been built and tested — the live form trigger, the visible
> `SENDING → SENT` transition, successful recipient delivery, captured send
> failures, and a full pending-row recovery run have all been observed. It is
> not an aspirational design.
>
> **Public-safe by construction.** Every private Google resource is referenced
> by placeholder only. See §17.

---

## 1. Purpose

This document records how a CrashDash beta request becomes a delivered access
email, so the flow can be audited, operated, or rebuilt without relying on chat
history or anyone's memory.

Goals of the beta flow:

- someone requests CrashDash early access through the public site;
- they receive access without manual intervention;
- the system visibly records whether the invite was actually sent;
- a missed or failed send can be recovered deliberately;
- the whole thing stays small enough for a POC;
- no CRM or custom backend is introduced before there is evidence one is needed.

---

## 2. Why Google Form + Sheet + Apps Script

| Reason | Detail |
| --- | --- |
| Low operational overhead | Nothing to host, patch or monitor |
| No custom backend | No server, no queue, no deployment pipeline |
| No API key for delivery | Sending uses the signed-in Google account's own mail quota |
| Easy to inspect manually | The Sheet is readable by a human at any time |
| Easy to audit | Every submission is a row; every send attempt is a written status |
| Right-sized for POC volume | Fits early beta; no premature platform build |
| Replaceable later | Can be swapped for a CRM / transactional email platform if scale demands |

This is **not** production-scale email infrastructure. See §20.

The design is deliberately lightweight:

```
Google Form  →  Google Sheet  →  Apps Script trigger  →  MailApp  →  access email
```

---

## 3. High-level flow

The flow below has been exercised end to end:

```
CrashDash Marketing CTA (Request beta access)
        ↓
Public Google Form
        ↓
Google Form response Sheet
        ↓
Installable Apps Script trigger (only one)
        ↓
sendCrashDashInvite(e)
        ↓
processInviteRow_(sheet, row)
        ↓
Sheet shows SENDING
        ↓
MailApp.sendEmail()
        ↓
Invite Status = SENT
        ↓
Invite Sent At = timestamp
        ↓
recipient receives the CrashDash Early Access email
```

---

## 4. Components

### A. Public Google Form

**Purpose:** collect beta requests.

Current public respondent form URL:

```
https://docs.google.com/forms/d/e/1FAIpQLSc6CessVM-ne8DAZRx-5C0WVipxjI065nFecHUUDdDxP6IDxw/viewform?usp=publish-editor
```

This **public respondent URL is safe to publish** and is the value used by the
public site's *Request beta access* call to action.

- The **editor URL is different** and must never be shared or committed.
- A **copied Form receives a new public respondent URL**; any site or signup link
  pointing at the old Form must be updated when that happens.

### B. Google Sheet

**Purpose:** durable, lightweight response and audit store.

Form responses occupy columns **A–F**. The automation owns two operational
columns:

| Col | Field | Meaning |
| --- | --- | --- |
| G | Invite Status | `SENDING`, `SENT`, `FAILED: <reason>`, or blank |
| H | Invite Sent At | Timestamp of a successful send |

The Sheet is the **system of record** for the beta — there is no other store.

### C. Apps Script

**Purpose:** event-driven glue between Form/Sheet and email delivery.

The canonical, public-safe example lives at
[`examples/crashdash_beta_invite.gs`](examples/crashdash_beta_invite.gs).

### D. Sender / account ownership

Beta mail is sent from the **dedicated CrashDash Gmail identity**, not a
personal mailbox:

```
ai.crashdash@gmail.com
```

Why this matters:

- **Installable triggers run as the account that created the trigger.** If a
  personal account creates the trigger, mail can be sent from that personal
  identity.
- Therefore the trigger must be created **while signed in to the dedicated
  CrashDash account**.
- Any older trigger created under a personal account should be removed, or the
  same submission can produce two sends.
- The access email is sent with `MailApp.sendEmail(...)`, which uses the
  effective (executing) account. The script logs
  `Session.getEffectiveUser().getEmail()` before every send so the sending
  identity is always visible in the execution log.

Approval self-check — the delivered message's `From:` should be the dedicated
CrashDash identity, never a personal address.

---

## 5. Shell column contract (A–H)

| Col | Field | Owner |
| --- | --- | --- |
| A | Timestamp | Form |
| B | Name | Form |
| C | Email address | Form |
| D | What best describes you? | Form |
| E | What are you mainly interested in? | Form |
| F | Mobile number | Form |
| G | Invite Status | Automation |
| H | Invite Sent At | Automation |

Only columns **G** and **H** are written by the automation. Columns **A–F** are
form-owned and are never modified.

---

## 6. Trigger configuration

Exactly **one** installable trigger is required:

| Setting | Value |
| --- | --- |
| Function to run | `sendCrashDashInvite` |
| Deployment | `Head` |
| Event source | From spreadsheet |
| Event type | On form submit |

Important:

- **No Apps Script "Deploy" action is required.** Deploy is for web apps, APIs
  and add-ons. An installable trigger is sufficient.
- **Do NOT create a second trigger** for backlog or recovery processing.
- `processPendingInvites()` (§10) is a **manual recovery** entry point and must
  **not** have its own trigger.

The live event processes **only the row that triggered the form submission**. It
does **not** scan the whole spreadsheet.

---

## 7. Operating model — two paths

### 1. Normal live path

```
Google Form submission
    ↓
Spreadsheet "On form submit" trigger
    ↓
sendCrashDashInvite(e)
    ↓
processInviteRow_(sheet, row)
    ↓
blank status
    ↓
SENDING
    ↓
MailApp.sendEmail()
    ↓
SENT + timestamp
```

### 2. Manual recovery / ops path

Executed by hand from the Apps Script editor:

```
processPendingInvites()
```

It scans the response sheet and:

| Row status | Action |
| --- | --- |
| `SENT` | skip |
| `SENDING` | skip |
| blank | process / send |
| `FAILED: ...` | retry |

It **must continue processing later rows** when an earlier row is already `SENT`
or another row fails. This exists as an operational recovery mechanism in case a
row is missed or a send fails.

`processPendingInvites()` has **no trigger** and is not scheduled.

---

## 8. State transitions

```
        blank
          ↓  (live trigger or recovery)
       SENDING            ← written before the send is attempted
          ↓
        SENT              ← written only after MailApp.sendEmail() returns
          │
          └── on error →  FAILED: <reason>   ← retryable by recovery
```

| Status | Meaning |
| --- | --- |
| blank | Pending — not yet processed |
| `SENDING` | Processing in progress (also prevents a second concurrent attempt) |
| `SENT` | `MailApp.sendEmail()` completed successfully |
| `FAILED: <reason>` | Send did not complete; recoverable by retry |

The intermediate `SENDING` state is written and flushed **before** the send, so
an in-flight row is never mistaken for a pending one.

---

## 9. Concurrency — `LockService`

`processInviteRow_` wraps the whole row operation in
`LockService.getScriptLock()`:

- `lock.waitLock(30000)` before any work;
- `lock.releaseLock()` in a `finally` block.

Why:

- a live trigger and a manual recovery run can overlap;
- without a lock, both could read a blank status and both send an invite;
- the lock also serialises a recovery scan against a concurrent form submission.

If the lock cannot be acquired the attempt throws, the row is marked
`FAILED: ...`, and recovery can retry it later.

---

## 10. Recovery / backlog procedure

Run manually from the Apps Script editor when invites need to be caught up.

```
processPendingInvites()
```

Behaviour:

1. Read the active sheet and the last row.
2. For each row from 2 to last:
   - `SENT` / `SENDING` → skip, **continue**;
   - blank / invalid email → skip;
   - `FAILED: ...` → count as a retry and process;
   - otherwise → `processInviteRow_`.
3. A thrown error on one row is caught, counted, and **processing continues**
   with the remaining rows.
4. A summary is logged: sent, skipped, retried, failed, rows scanned.

This proves an already-`SENT` row does **not** terminate processing of other
pending rows.

---

## 11. Execution log

Both entry points log to the Apps Script **Executions** log. The live path logs,
for each row:

- processing start, row number, sheet name;
- the effective account (`Session.getEffectiveUser().getEmail()`);
- lock acquisition/release;
- the current `Invite Status`;
- `SENDING` transition;
- recipient address and sending account immediately before the send;
- the `SENT` transition and completion;
- on failure: the error message and the `FAILED` write.

Recovery adds a per-row scan trace and a final summary
(`Sent / Skipped / Retried / Failed / Rows scanned`).

The log is the first place to look when an invite does not arrive.

---

## 12. Manual operational procedure

### Normal operation

Nothing to do. A form submission triggers the send automatically.

### If a submission appears unprocessed

1. Open the response Sheet and read column **G** for the row.
2. If **G** is blank or `FAILED: ...`, run `processPendingInvites()` from the
   Apps Script editor.
3. Read the execution log; confirm the summary counts.
4. Confirm **G = SENT** and **H** holds a timestamp for the affected row.

### If email stops sending

See the operator checklist in §19.

---

## 13. Email design and deliverability

**Testing outcome that drove the design.**

The first attempt was a heavily styled, marketing-style HTML email — dark
branded header, green call-to-action button, multiple styled cards and sections.

**Result:** this automated onboarding mail from the new CrashDash Gmail address
was noticeably more likely to land in **Spam/Junk**. A plain, ordinary email
from the same sender reached the **Inbox**.

**Decision:** deliberately simplify the message to a lightweight, conversational
HTML + plain-text email:

- ordinary paragraphs;
- very limited styling;
- standard links;
- a plain-text fallback body;
- no large call-to-action button;
- no large branded header;
- no newsletter-style layout;
- fewer "bulk marketing email" signals.

**Reason:** during POC and beta, **inbox placement and human trust matter more
than visual polish.**

The message contains:

- a personalised greeting (the name is title-cased; when blank it falls back to
  `Hi there,`);
- CrashDash access URL;
- a "How to use CrashDash" link;
- a "What to expect" link;
- reply-for-feedback wording;
- the CrashDash Team signature;
- "Discover. Investigate. Decide."

---

## 14. `SENT` means "accepted for delivery" — not "delivered to the Inbox"

**The Sheet records that the send call succeeded, not that the recipient read or
even received the message.**

- `Invite Status = SENT` means `MailApp.sendEmail()` returned without throwing.
- Downstream inbox filtering is outside this system and is not observable here.
- Never treat `SENT` as a guarantee of delivery.

`MailApp.getRemainingDailyQuota()` is available and is surfaced by the optional
diagnostic `checkCrashDashMailStatus()`. Quota exhaustion is one reason a send
can fail.

---

## 15. Duplicate protection

Documented honestly, including the gap.

**Current protection is row level** — handled inside `processInviteRow_`:

```
status is SENT or SENDING  →  skip
```

This protects against:

- a trigger retry on the same response;
- an accidental re-run of recovery over an already-processed row;
- a concurrent attempt while a row is `SENDING`.

**Current limitation:** if the same email address submits the Form twice, it
creates a **second row with a blank status**. That row passes the row-level guard
and receives another invite.

```
row-level dedupe   ✅
email-level dedupe ❌  (not implemented)
```

**Recommended future hardening:** before sending, scan existing rows for the same
normalised email address with `Invite Status = SENT`, and skip if found. This is
future work and is **not** part of the current implementation.

---

## 16. Google Form confirmation copy

The Form's submission confirmation should set expectations, because the invite is
sent by a separate automation and may be filtered:

> Thanks — your CrashDash access request has been received.
> Check your email for your access link and quick-start guide.
> If it hasn't arrived after a few minutes, have a quick look in your
> Spam/Junk folder.

Do not imply guaranteed delivery. `SENT` reflects a completed send call, not
guaranteed inbox placement (§14).

---

## 17. Security / public repository rules

This is a **public GitHub repository**. Anything committed is publicly visible,
**even if it is not served as the site**.

### ✅ Safe to commit

- public CrashDash URLs (`arbtraderlabs.github.io` product links)
- the **public respondent** URL of the beta form (§4A) — never the editor URL
- the dedicated public sender address (§4D), where operationally relevant
- the sanitized Apps Script example
- the generic Sheet column contract
- the testing procedure and this architectural reasoning

### ❌ Never commit

- passwords
- Google account recovery details (recovery phone, recovery email)
- OAuth tokens or API keys
- the Form **editor** URL
- the spreadsheet URL or **Sheet ID**
- the Apps Script **project ID**
- **trigger IDs**
- private Drive links or IDs
- customer responses, names, email addresses, or form data
- screenshots containing real beta-user information
- any secret or credential of any kind

**Rule of thumb:** if it identifies a real person or grants access to a Google
resource, it does not belong in this repository.

---

## 18. Canonical script location

The canonical, public-safe Apps Script lives at:

```
docs/examples/crashdash_beta_invite.gs
```

It contains:

| Function | Role |
| --- | --- |
| `sendCrashDashInvite(e)` | Live entry point (trigger target) |
| `processInviteRow_(sheet, row)` | Single-row worker; lock, states, send |
| `processPendingInvites()` | Manual recovery / backlog scan |
| `checkCrashDashMailStatus()` | Optional diagnostic (account + quota) |

The obsolete early helper `testCrashDashInvite()` has been **removed** so the
documented script matches what runs in production. Manual testing is done with
`processPendingInvites()` against a real pending row.

---

## 19. Operator troubleshooting checklist

### If email stops sending

- [ ] check Apps Script **Executions** for errors;
- [ ] inspect column **G** (`Invite Status`) for `FAILED: ...`;
- [ ] confirm the trigger still exists and is `From spreadsheet → On form submit`;
- [ ] confirm the trigger owner is the dedicated CrashDash account;
- [ ] confirm authorisation has not expired or been revoked;
- [ ] run `processPendingInvites()` and read the summary;
- [ ] check `MailApp.getRemainingDailyQuota()` via `checkCrashDashMailStatus()`;
- [ ] check the Gmail account state / sending limits.

### If two emails arrive for one person

- [ ] confirm only **one** installable trigger exists;
- [ ] confirm no personal-account trigger remains;
- [ ] remember that a duplicate *submission* creates a second row — currently
      that is expected behaviour (§15).

---

## 20. Tested acceptance evidence

The implementation has been exercised manually and end to end.

1. A real Google Form submission created a response row.
2. The installable `On form submit` trigger fired automatically.
3. The executing account was confirmed in the log as the dedicated CrashDash
   identity (`ai.crashdash@gmail.com`).
4. The Sheet visibly showed the transitional state before completion:

   ```
   pending / blank  →  SENDING  →  SENT
   ```

5. On success: `Invite Status = SENT`, `Invite Sent At = timestamp`.
6. The received email was confirmed with:

   ```
   From:     ai.crashdash@gmail.com
   Subject:  Your CrashDash Early Access
   ```

7. The email contained: personalised greeting, CrashDash access URL, "How to use
   CrashDash" link, "What to expect" link, reply-for-feedback wording, and
   "Discover. Investigate. Decide."
8. Recovery was tested with row 2 = blank status and row 3 = `SENT`. Running
   `processPendingInvites()` produced:

   ```
   row 2  → processed → SENDING → MailApp completed → SENT
   row 3  → skipped as already SENT

   Sent: 1   Skipped: 1   Retried: 0   Failed: 0   Rows scanned: 2
   ```

   This proves an already-`SENT` row does not terminate processing of other
   pending rows.
9. Error handling was observed: an invalid email produced
   `SENDING → MailApp error → FAILED: Invalid email...`, the exception was
   logged, and the script lock was released correctly.

---

## 21. Current maturity

```
BUILT:      YES
TESTED:     YES
INTEGRATED: YES
READY:      YES for beta / POC use
```

This is appropriate for early-access POC / limited beta volume.

It is **not** enterprise-ready, production-scale email infrastructure. Volume
limits, deliverability guarantees, and domain-level authentication (SPF/DKIM/
DMARC on a future custom domain) are open items that only matter once usage
justifies them.
