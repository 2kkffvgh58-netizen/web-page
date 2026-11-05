# Strategic Drive — Cloudflare Pages deployment package

This package contains the website and a Cloudflare Pages Function for server-side booking email delivery.

## Package contents
- `index.html` — website with booking form updated to POST to `/api/booking`
- `functions/api/booking.js` — validates booking submissions and sends notification email through Resend

## Before deploying
1. Create/verify a Resend account at https://resend.com/.
2. In Resend, add and verify a sending domain. Recommended: `notify.strategic-drive.com`.
3. Add only the DNS records Resend supplies. Preserve the existing MX records used by your working business mailbox.
4. Choose a sender address on the verified domain, for example `bookings@notify.strategic-drive.com`.
5. Upload this project to a GitHub repository (the `index.html` and `functions` directory must be at the repository root).

## Cloudflare Pages setup
1. Cloudflare dashboard → Workers & Pages → Create application → Pages → Connect to Git.
2. Select the repository.
3. Framework preset: `None`.
4. Build command: leave blank.
5. Build output directory: `/` (if the dashboard requires a directory, use the repository root).
6. Deploy.

Cloudflare Pages Functions are discovered from the root-level `functions/` directory. The route in this package is `/api/booking`.

## Configure secrets and variables
In the Pages project → Settings → Variables and Secrets, add these for Production (and Preview if you want preview testing):

- Secret `RESEND_API_KEY`: your Resend API key. Enter it directly in Cloudflare; never paste it into website code or a public GitHub repository.
- Variable `RESEND_FROM_EMAIL`: for example `Strategic Drive Bookings <bookings@notify.strategic-drive.com>`.
- Optional variable `BOOKING_TO_EMAIL`: `transport@strategic-drive.com`. If omitted, the function uses that destination by default.

After adding/changing variables, trigger a new deployment.

## Custom domain
Pages project → Custom domains → Set up a custom domain → `strategic-drive.com`.
You can also add `www.strategic-drive.com` if desired. Follow Cloudflare's prompts.

## Test
1. Confirm the site loads on its `pages.dev` URL.
2. Submit a test booking using an email address you can access.
3. Confirm the notification arrives at `transport@strategic-drive.com`.
4. Reply to the notification and confirm the reply-to address is the customer's email.
5. Test a missing required field and an invalid email.

## Important notes
- This endpoint sends booking notification emails; it does not confirm a ride or guarantee vehicle availability.
- The visitor sees a success message after Resend accepts the email request, not after a human has read it.
- This starter includes basic validation and a hidden honeypot-ready field. For stronger production spam protection, add Cloudflare Turnstile and/or rate limiting before advertising the form publicly.
- No DNS records are hard-coded in this package. Use the exact records shown in your Resend and Cloudflare dashboards.
