STRATEGIC DRIVE — CLOUDFLARE PAGES DEPLOYMENT

Repository layout:
- index.html (website homepage)
- functions/api/booking.js (booking API endpoint)

Cloudflare Pages:
- Framework preset: None
- Build command: leave blank if accepted; otherwise use exit 0
- Build output directory: . (repository root)
- Root directory: repository root
- Production branch: main

Resend:
1. Create an account at https://resend.com/
2. Add a sending domain, recommended: notify.strategic-drive.com.
3. Add the exact DNS records Resend provides to your Cloudflare DNS zone.
4. Do not delete or replace existing MX records for your working business mailbox.
5. Verify the sending domain and create an API key.

Cloudflare Pages project variables/secrets:
- RESEND_API_KEY: store as a Secret; never commit it to GitHub.
- RESEND_FROM_EMAIL: Strategic Drive Bookings <bookings@notify.strategic-drive.com>
- BOOKING_TO_EMAIL: transport@strategic-drive.com

The From address must belong to a domain verified in Resend. If using another verified sender, set RESEND_FROM_EMAIL to that exact sender.

Deploy only after confirming index.html contains the updated form that POSTs JSON to /api/booking. Then deploy and test on the pages.dev address before attaching the custom domain.

Before public launch, add anti-spam protection such as Cloudflare Turnstile and test successful and failed submissions.