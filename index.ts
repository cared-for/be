import Twilio from "twilio";
import queryString from 'query-string';
import "dotenv/config";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = Twilio(accountSid, authToken);
const VoiceResponse = Twilio.twiml.VoiceResponse;

const outboundCall = async (req: Request) => {
  const call = await client.calls.create({
    method: "POST",
    url: `${process.env.HOST}/voice`,
    to: "+16195677998",
    from: "+13239828587",
  })

  console.log("call: ", call);

  return new Response(`Success: ${call.sid}`, {
    headers: { "content-type": "text/xml" },
  });
}

// Create a route that will handle Twilio webhook requests, sent as an
// HTTP POST to /voice in our application
const voice = async (req: Request) => {
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    numDigits: 1,
    action: `${process.env.HOST}/gather`,
  });
  gather.say("Hello Stanley! It's time for your checkin. Please press 1 to check in.");

  twiml.pause();
  twiml.say("Sorry, I didn't get your response.");

  // If the user doesn't enter input, loop
  twiml.redirect(`${process.env.HOST}/voice`);

  // Render the response as XML in reply to the webhook request
  return new Response(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
};

// Create a route that will handle <Gather> input
const gather = async (req: Request) => {
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse();
  const body = await req.text();
  const params = queryString.parse(body);

  // If the user entered digits, process their request
  if (params.Digits) {
    switch (params.Digits) {
      case '1':
        twiml.say('Thanks for checking in! Have a great day!');
        break;
      default:
        twiml.say("Sorry, look like you picked a different number");
        twiml.pause();
        twiml.redirect(`${process.env.HOST}/voice`);
        break;
    }
  } else {
    // If no input was sent, redirect to the /voice route
    twiml.redirect(`${process.env.HOST}/voice`);
  }

  // Render the response as XML in reply to the webhook request
  return new Response(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

const server = Bun.serve({
  hostname: "::",
  port: process.env.PORT ?? 3000,
  fetch(req) {
    const url = new URL(req.url);
    
    if (req.method === "GET" && url.pathname === "/") return outboundCall(req);
    if (req.method === "POST" && url.pathname === "/voice") return voice(req);
    if (req.method === "POST" && url.pathname === "/gather") return gather(req);

    return new Response("404!");
  },
});

console.log(`Listening on ${process.env.HOST}`);
