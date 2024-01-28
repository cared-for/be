import Twilio from "twilio";
import queryString from 'query-string';
import "dotenv/config";
import { db } from "./db/db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = Twilio(accountSid, authToken);
const VoiceResponse = Twilio.twiml.VoiceResponse;

type Params = {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
}
const getUrlParams = (req: Request) => {
  const url = req.url;
  const params = queryString.parse(url) as Params;
  const userId = params.userId;
  
  if (!userId) throw new Error("userId is missing");
  
  return {
    ...params,
    userId: Number(userId),
  }
}

const outboundCall = async (req: Request) => {
  try {
    const { userId } = getUrlParams(req);
    console.log("user id: ", userId);

    const [user] = await db
      .select({ 
        checkedIn: users.checkedIn,
        fullName: users.fullName,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) throw new Error("User not found");

    await db.update(users).set({ checkedIn: false }).where(eq(users.id, userId));
    console.log("updated user checkin updated to false: ", userId);

    const call = await client.calls.create({
      method: "POST",
      url: `${process.env.HOST}/voice?userId=${userId}&name=${user.fullName}`,
      to: "+16195677998",
      from: user.phone as string,
      statusCallbackEvent: ["completed"],
      statusCallback: `${process.env.HOST}/status?userId=${userId}&name=${user.fullName}`,
      statusCallbackMethod: "POST",
    })

    return new Response(`Success`, {
      headers: { "content-type": "text/xml" },
    });
  } catch (error: any) {
    return new Response(error.message, {
      headers: { "content-type": "text/xml" },
    })
  }
}

const status = async (req: Request) => {
  try {
    const { userId } = getUrlParams(req);
    console.log("user id in status: ", userId);

    const [user] = await db
      .select({ checkedIn: users.checkedIn})
      .from(users)
      .where(eq(users.id, userId))

    if (!user) {
      return new Response("User not found", {
        headers: { "content-type": "text/xml" },
      })
    }

    if (user.checkedIn) {
      return new Response(`Success`, {
        headers: { "content-type": "text/xml" },
      });
    } else {
      console.log("User did not successfully check in");
      const voiceEndpoint = `${process.env.HOST}/voice?userId=${userId}`
      await fetch(`https://qstash.upstash.io/v2/publish/${voiceEndpoint}`,{
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_TOKEN}`,
          "Content-Type": "application/json",
          "Upstash-Delay": "1m",
        },
      })
      return new Response(`Success`, {
        headers: { "content-type": "text/xml" },
      });
    }

  } catch (error: any) {
    return new Response(error.message, {
      headers: { "content-type": "text/xml" },
    })
  }
}

// Create a route that will handle Twilio webhook requests, sent as an
// HTTP POST to /voice in our application
const voice = async (req: Request) => {
  const { userId, fullName } = getUrlParams(req);
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    numDigits: 1,
    action: `${process.env.HOST}/gather?userId=${userId}&name=${fullName}`,
  });
  gather.say(`Hello ${fullName}! It's time for your checkin. Please press 1 to check in.`);

  twiml.pause();
  twiml.say("Sorry, I didn't get your response.");

  // If the user doesn't enter input, loop
  twiml.redirect(`${process.env.HOST}/voice?userId=${userId}&name=${fullName}`);

  // Render the response as XML in reply to the webhook request
  return new Response(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
};

// Create a route that will handle <Gather> input
const gather = async (req: Request) => {
  const { userId, fullName } = getUrlParams(req);
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
        twiml.redirect(`${process.env.HOST}/voice?userId=${userId}&name=${fullName}`);
        break;
    }
  } else {
    // If no input was sent, redirect to the /voice route
    twiml.redirect(`${process.env.HOST}/voice?userId=${userId}&name=${fullName}`);
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
    if (req.method === "POST" && url.pathname === "/status") return status(req);

    return new Response("404!");
  },
});

console.log(`Listening on ${process.env.HOST}`);
