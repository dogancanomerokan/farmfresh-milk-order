import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { cancellationId } = await req.json();

  if (!cancellationId) {
    return new Response("Missing cancellationId", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const mailFrom = Deno.env.get("MAIL_FROM");

  // cancellation kaydı
  const { data: cancellation } = await supabase
    .from("order_cancellations")
    .select("*")
    .eq("id", cancellationId)
    .single();

  if (!cancellation) {
    return new Response("Cancellation not found", { status: 404 });
  }

  if (cancellation.email_sent) {
    return new Response("Email already sent", { status: 200 });
  }

  // order bilgisi
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", cancellation.order_id)
    .single();

  if (!order) {
    return new Response("Order not found", { status: 404 });
  }

  let email = order.guest_email;
  let customerName = "Müşterimiz";

  // guest değilse user lookup
  if (!email && order.user_id) {
    const { data: user } = await supabase
      .from("users")
      .select("email,name")
      .eq("id", order.user_id)
      .single();

    if (user?.email) email = user.email;
    if (user?.name) customerName = user.name;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", order.user_id)
      .single();

    if (profile?.full_name) {
      customerName = profile.full_name;
    }
  }

  if (!email) {
    await supabase
      .from("order_cancellations")
      .update({
        email_error: "Email bulunamadı"
      })
      .eq("id", cancellationId);

    return new Response("Email missing", { status: 400 });
  }

  const html = `
  <div style="font-family:Arial">
    <h2>Siparişiniz iptal edildi</h2>
    <p>Merhaba ${customerName},</p>
    <p>Siparişiniz iptal edilmiştir.</p>
    ${
      cancellation.cancellation_reason
        ? `<p><b>İptal nedeni:</b> ${cancellation.cancellation_reason}</p>`
        : ""
    }
    <p>SadeSut</p>
  </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: mailFrom,
      to: [email],
      subject: "Siparişiniz iptal edildi",
      html
    })
  });

  const json = await res.json();

  if (!res.ok) {
    await supabase
      .from("order_cancellations")
      .update({
        email_error: JSON.stringify(json)
      })
      .eq("id", cancellationId);

    return new Response("Mail error", { status: 500 });
  }

  await supabase
    .from("order_cancellations")
    .update({
      email_sent: true,
      email_sent_at: new Date().toISOString(),
      email_provider_id: json.id
    })
    .eq("id", cancellationId);

  return new Response("ok");
});