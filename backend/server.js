require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const twilio = require("twilio");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Connect to Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ── Send WhatsApp message ──────────────────────────────
async function sendWhatsApp(to, message) {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: "whatsapp:" + process.env.TWILIO_WHATSAPP_FROM,
      to: "whatsapp:" + to,
    });
    console.log("Message sent! SID:", result.sid);
    return true;
  } catch (err) {
    console.error("Message failed:", err.message);
    return false;
  }
}

// ── ROUTE 1: Save appointment + send confirmation ──────
app.post("/appointments", async (req, res) => {
  const { customer_name, phone_number, appointment_time } = req.body;

  if (!customer_name || !phone_number || !appointment_time) {
    return res.status(400).json({ error: "All fields required" });
  }

  // Save to Supabase
  const { data, error } = await supabase
    .from("appointments")
    .insert([{ customer_name, phone_number, appointment_time }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: "Database error: " + error.message });
  }

  // Send WhatsApp confirmation
  const msg = `Hi ${customer_name}! Your appointment is confirmed for ${new Date(appointment_time).toLocaleString()}. See you then!`;
  const sent = await sendWhatsApp(phone_number, msg);

  if (sent) {
    await supabase
      .from("appointments")
      .update({ confirmation_sent: true })
      .eq("id", data.id);
  }

  res.status(201).json({ success: true, appointment: data, whatsapp_sent: sent });
});

// ── ROUTE 2: Get all appointments (for dashboard) ──────
app.get("/appointments", async (req, res) => {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("appointment_time", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── ROUTE 3: Delete appointment ────────────────────────
app.delete("/appointments/:id", async (req, res) => {
  await supabase.from("appointments").delete().eq("id", req.params.id);
  res.json({ success: true });
});

// ── BONUS: Auto-reminder cron job (runs every minute) ──
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const in60 = new Date(now.getTime() + 60 * 60 * 1000);

  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("reminder_sent", false)
    .gte("appointment_time", now.toISOString())
    .lte("appointment_time", in60.toISOString());

  if (!data) return;

  for (const appt of data) {
    const msg = `Reminder: Hi ${appt.customer_name}! Your appointment is in less than 1 hour. Please be ready!`;
    const sent = await sendWhatsApp(appt.phone_number, msg);
    if (sent) {
      await supabase
        .from("appointments")
        .update({ reminder_sent: true })
        .eq("id", appt.id);
    }
  }
});

app.listen(3001, () => console.log("Backend running on http://localhost:3001")); 