export const SUPPORT_EMAIL = "help.nobilix@outlook.com";
const SUBJECT = "TrapMan account deletion request";

/**
 * The two blank fields are deliberate — the player fills in their own
 * username and the email their game account is registered to. Neither can be
 * pre-filled: the player-account portal was removed, so this page is a
 * guided email rather than a signed-in flow, and the site never knows who
 * is reading it.
 */
const BODY = `Hello Nobilix support,

I would like to permanently delete my TrapMan account and the personal data connected to it.

TrapMan username:
In-game email address:

I understand this is permanent and cannot be undone.

Thank you.`;

const to = encodeURIComponent(SUPPORT_EMAIL);
const subject = encodeURIComponent(SUBJECT);
const body = encodeURIComponent(BODY);

/** Opens the device's default mail app. */
const MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
/** Webmail fallbacks for browsers with no mail app registered, where a
 *  mailto: click otherwise appears to do nothing. */
const GMAIL = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
const OUTLOOK = `https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${subject}&body=${body}`;

/**
 * A prepared deletion request. The button hands the whole message — address,
 * subject and body — to the player's email app so all they add is their
 * username and account email before sending. The template is also rendered
 * as selectable text, so the flow survives even when no mail client opens.
 */
export function DeleteAccountRequest() {
  return (
    <div className="delete-request">
      <div className="delete-request__meta">
        <span className="delete-request__label">To</span>
        <span>{SUPPORT_EMAIL}</span>
        <span className="delete-request__label">Subject</span>
        <span>{SUBJECT}</span>
      </div>

      <pre className="delete-request__body">{BODY}</pre>

      <div className="delete-request__actions">
        <a className="delete-request__btn delete-request__btn--primary" href={MAILTO}>
          Open this email to send
        </a>
      </div>

      <p className="delete-request__alt">
        Nothing opened, or you use webmail? Open it in{" "}
        <a href={GMAIL} target="_blank" rel="noopener noreferrer">
          Gmail
        </a>{" "}
        or{" "}
        <a href={OUTLOOK} target="_blank" rel="noopener noreferrer">
          Outlook
        </a>
        {" "}— or copy the message above into any email to {SUPPORT_EMAIL}.
      </p>
    </div>
  );
}
