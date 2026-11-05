function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
export async function onRequestPost({ request, env }) {
  try {
    if (!(request.headers.get("content-type") || "").includes("application/json")) {
      return json({ error: "Invalid request format." }, 415);
    }
    const body = await request.json();
    const fields = {
      name: clean(body.name, 120), phone: clean(body.phone, 60),
      email: clean(body.email, 254), service: clean(body.service, 100),
      date: clean(body.date, 20), time: clean(body.time, 20),
      passengers: clean(body.passengers, 10), pickup: clean(body.pickup, 500),
      destination: clean(body.destination, 500), notes: clean(body.notes, 3000)
    };
    const required = ["name","phone","email","service","date","time","pickup","destination"];
    if (required.some(k => !fields[k])) return json({ error: "Please complete all required booking fields." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return json({ error: "Please provide a valid email address." }, 400);
    if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL || !env.BOOKING_TO_EMAIL) {
      return json({ error: "Booking email service is not configured yet. Please try again later." }, 503);
    }
    const labels = {
      name:"Full name", phone:"Phone", email:"Customer email", service:"Service requested",
      date:"Pickup date", time:"Pickup time", passengers:"Passengers",
      pickup:"Pickup location", destination:"Destination", notes:"Additional details"
    };
    const escapeHtml = value => value.replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    })[ch]);
    const textBody = Object.entries(labels).map(([k,label]) => label + ": " + (fields[k] || "Not provided")).join("\n");
    const html = "<h2>New Strategic Drive Ride Request</h2><dl>" +
      Object.entries(labels).map(([k,label]) => "<dt><strong>"+escapeHtml(label)+
      "</strong></dt><dd>"+escapeHtml(fields[k] || "Not provided")+"</dd>").join("") + "</dl>";
    const sent = await fetch("https://api.resend.com/emails", {
      method:"POST",
      headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({
        from:env.RESEND_FROM_EMAIL, to:[env.BOOKING_TO_EMAIL], reply_to:fields.email,
        subject:"Strategic Drive Ride Request — "+fields.name, text:textBody, html
      })
    });
    if (!sent.ok) return json({ error: "We couldn't send your request just now. Please try again or email transport@strategic-drive.com." }, 502);
    return json({ ok:true });
  } catch {
    return json({ error:"Unexpected server error. Please try again or email transport@strategic-drive.com." }, 500);
  }
}