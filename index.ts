import Twilio from "twilio";
import "dotenv/config";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = Twilio(accountSid, authToken);
const VoiceResponse = Twilio.twiml.VoiceResponse;

const slash = async (req: Request) => {
  await client.calls.create({
    url: "http://demo.twilio.com/docs/voice.xml",
    to: "+16195677998",
    from: "+13239828587",
  })

  return new Response("Hello world!", {
    headers: { "content-type": "text/xml" },
  });
}

const voice = async (req: Request) => {
    // Create TwiML response
  const twiml = new VoiceResponse();

  twiml.say('Hello from your pals at Twilio! Have fun.');

  return new Response(twiml.toString(), {
    headers: { "content-type": "text/xml" },
  });
}

const server = Bun.serve({
  hostname: "::",
  port: process.env.PORT ?? 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") return slash(req);
    if (url.pathname === "/voice") return voice(req);

    return new Response("404!");
  },
});

console.log(`Listening on http://localhost:${server.port}`);
