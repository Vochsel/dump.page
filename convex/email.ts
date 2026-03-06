import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const sendBoardInviteEmail = internalAction({
  args: {
    toEmail: v.string(),
    boardName: v.string(),
    boardId: v.id("boards"),
    inviterName: v.string(),
    inviteToken: v.string(),
    isExistingUser: v.boolean(),
  },
  handler: async (_ctx, args) => {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (!SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY not set, skipping email send");
      return;
    }

    const APP_URL = process.env.APP_URL ?? "https://dump.land";
    const boardUrl = args.isExistingUser
      ? `${APP_URL}/b/${args.boardId}`
      : `${APP_URL}/b/${args.boardId}?invite=${args.inviteToken}`;

    const subject = `${args.inviterName} added you to "${args.boardName}" on Dump`;
    const html = buildInviteHtml({
      inviterName: args.inviterName,
      boardName: args.boardName,
      boardUrl,
      isExistingUser: args.isExistingUser,
    });
    const plainText = `${args.inviterName} added you to the board "${args.boardName}" on Dump!\n\nView the board: ${boardUrl}\n\nDump is where teams drop links, notes, and ideas into shared boards that actually get used.`;

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: args.toEmail }] }],
          from: { email: "hello@dump.land", name: "Dump" },
          subject,
          content: [
            { type: "text/plain", value: plainText },
            { type: "text/html", value: html },
          ],
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.error(`SendGrid error ${response.status}: ${body}`);
      }
    } catch (error) {
      console.error("Failed to send invite email:", error);
    }
  },
});

function buildInviteHtml(args: {
  inviterName: string;
  boardName: string;
  boardUrl: string;
  isExistingUser: boolean;
}) {
  const ctaText = args.isExistingUser ? "Open Board" : "View Board";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=DynaPuff:wght@400;600&family=Poppins:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1ec; font-family: 'Poppins', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f1ec; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color: #7bd096; padding: 32px 40px; text-align: center;">
              <h1 style="font-family: 'DynaPuff', 'Comic Sans MS', cursive; font-size: 32px; color: #ffffff; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Dump
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px 0; font-family: 'DynaPuff', 'Comic Sans MS', cursive;">
                You're in!
              </p>
              <p style="font-size: 15px; color: #555555; line-height: 1.6; margin: 0 0 24px 0;">
                <strong>${escapeHtml(args.inviterName)}</strong> added you to the board
                <strong>"${escapeHtml(args.boardName)}"</strong> on Dump.
                ${args.isExistingUser
                  ? "Jump in and start dumping ideas together."
                  : "Sign in to start collaborating."}
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px 0;">
                    <a href="${args.boardUrl}"
                       style="display: inline-block; background-color: #7bd096; color: #ffffff; font-family: 'DynaPuff', 'Comic Sans MS', cursive; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 50px; box-shadow: 0 4px 12px rgba(123, 208, 150, 0.4);">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #eee; margin: 0 0 24px 0;">

              <!-- What is Dump -->
              <p style="font-size: 13px; color: #888888; line-height: 1.5; margin: 0;">
                Dump is where teams drop links, notes & ideas into shared boards that actually get used. It's like a collaborative mood board for your brain.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #faf9f7; padding: 20px 40px; text-align: center;">
              <p style="font-size: 12px; color: #aaaaaa; margin: 0;">
                Sent with love from <a href="https://dump.land" style="color: #7bd096; text-decoration: none;">dump.land</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
