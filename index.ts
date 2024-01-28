import Twilio from "twilio";
import "dotenv/config";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = Twilio(accountSid, authToken);
const VoiceResponse = Twilio.twiml.VoiceResponse;

const slash = async (req: Request) => {
  console.log("url: ", req.url);

  //
  // await client.calls.create({
  //   url: "${process.env.URL}",
  //   to: "+16195677998",
  //   from: "+13239828587",
  // })
  //
  return new Response("Hello world!", {
    headers: { "content-type": "text/xml" },
  });
}

const voice = async (req: Request) => {
  const twiml = new VoiceResponse();

  twiml.say('Hello from your pals at Twilio! Have fun.');

  return new Response(twiml.toString(), {
    headers: { "content-type": "text/xml" },
  });
}
//
// // Create a route that will handle Twilio webhook requests, sent as an
// // HTTP POST to /voice in our application
// app.post('/voice', (request, response) => {
//   // Use the Twilio Node.js SDK to build an XML response
//   const twiml = new VoiceResponse();
//
//   const gather = twiml.gather({
//     numDigits: 1,
//     action: '/gather',
//   });
//   gather.say('For sales, press 1. For support, press 2.');
//
//   // If the user doesn't enter input, loop
//   twiml.redirect('/voice');
//
//   // Render the response as XML in reply to the webhook request
//   response.type('text/xml');
//   response.send(twiml.toString());
// });
//
// // Create a route that will handle <Gather> input
// app.post('/gather', (request, response) => {
//   // Use the Twilio Node.js SDK to build an XML response
//   const twiml = new VoiceResponse();
//
//   // If the user entered digits, process their request
//   if (request.body.Digits) {
//     switch (request.body.Digits) {
//       case '1':
//         twiml.say('You selected sales. Good for you!');
//         break;
//       case '2':
//         twiml.say('You need support. We will help!');
//         break;
//       default:
//         twiml.say("Sorry, I don't understand that choice.");
//         twiml.pause();
//         twiml.redirect('/voice');
//         break;
//     }
//   } else {
//     // If no input was sent, redirect to the /voice route
//     twiml.redirect('/voice');
//   }
//
//   // Render the response as XML in reply to the webhook request
//   response.type('text/xml');
//   response.send(twiml.toString());
// });
//




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
