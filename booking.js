const DESTINATION = "transport@strategic-drive.com";

const FIELDS = [
  ["Full name", "name"],
  ["Phone", "phone"],
  ["Email", "email"],
  ["Service requested", "service"],
  ["Pickup date", "date"],
  ["Pickup time", "time"],
  ["Passengers", "passengers"],
  ["Pickup location", "pickup"],
  ["Destination", "destination"],
  ["Additional details", "notes"],
];

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) {
    return json({ error: "Booking email is not configured yet. Please try again later." }, 503);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return json({ error: "Please submit the booking form again." }, 415);
  }

  let raw;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Invalid booking submission." }, 400);
  }

  // Honeypot: bots that fill this hidden field receive a generic success response.
  if (clean(raw.website, 200)) return json({ ok: true });

  const booking = Object.fromEntries(
    FIELDS.map(([label, key]) => [key, clean(raw[key], key === "notes" ? 2000 : 500)])
  );

  const required = ["name", "phone", "email", "service", "date", "time", "pickup", "destination"];
  if (required.some((key) => !booking[key])) {
    return json({ error: "Please complete all required booking fields." }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }

  const from = env.RESEND_FROM_EMAIL;
  if (!from) {
    return json({ error: "The booking sender address has not been configured." }, 503);
  }

  const subject = `Strategic Drive Ride Request - ${booking.name}`;
  const text = FIELDS.map(([label, key]) => `${label}: ${booking[key] || "Not provided"}`).join("\n");

  let providerResponse;
  try {
    providerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [env.BOOKING_TO_EMAIL || DESTINATION],
        reply_to: booking.email,
        subject,
        text,
      }),
    });
  } catch {
    return json({ error: "Email service is temporarily unavailable. Please try again." }, 502);
  }

  if (!providerResponse.ok) {
    // Do not expose provider response details or secrets to the browser.
    return json({ error: "We couldn't send your request just now. Please try again or email transport@strategic-drive.com." }, 502);
  }

  return json({ ok: true });
}
