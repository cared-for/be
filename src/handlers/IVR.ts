import { eq } from "drizzle-orm";
import queryString from "query-string";

import { client, VoiceResponse } from "../twilio";
import { getUrlParams } from "../utils";
import { db } from "../db/db";

// db
import { users } from "../db/schema";

export const outboundCall = async (req: Request) => {
  try {
    const { userId } = getUrlParams(req);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) return new Response("User not found", { status: 404 });

    await db
      .update(users)
      .set({ 
        checkedIn: false,
      })
      .where(eq(users.id, userId));
    const urlQueryName = user.fullName!.replaceAll(" ", "%20");
    console.log("user checkin updated to false: ", userId);
 
    client.calls.create({
      method: "POST",
      url: `${process.env.HOST}/voice?userId=${userId}&name=${urlQueryName}`,
      to: user.phone as string,
      from: "+13239828587",
      statusCallbackEvent: ["completed"],
      statusCallback: `${process.env.HOST}/status?userId=${userId}&name=${urlQueryName}`,
      statusCallbackMethod: "POST",
    })

    return new Response(`Success`, {
      headers: { "content-type": "text/xml" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(error.message, {
      headers: { "content-type": "text/xml" },
      status: 500,
    })
  }
}


// Create a route that will handle Twilio webhook requests, sent as an
// HTTP POST to /voice in our application
export const voice = async (req: Request) => {
  try {
    const { userId, name } = getUrlParams(req);
    // Use the Twilio Node.js SDK to build an XML response
    const twiml = new VoiceResponse();

    const urlQueryName = name.replaceAll(" ", "%20");

    const gather = twiml.gather({
      numDigits: 1,
      action: `${process.env.HOST}/gather?userId=${userId}&name=${urlQueryName}`,
    });
    gather.say(`Hello ${name}! It's time for your checkin. Please press 1 to check in.`);

    twiml.pause();
    twiml.say("Sorry, I didn't get your response.");

    // If the user doesn't enter input, loop
    twiml.redirect(`${process.env.HOST}/voice?userId=${userId}&name=${urlQueryName}`);

    // Render the response as XML in reply to the webhook request
    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(error.message, {
      headers: { "content-type": "text/xml" },
      status: 500,
    })
  }
};

// Create a route that will handle <Gather> input
export const gather = async (req: Request) => {
  const { userId, name } = getUrlParams(req);
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse();
  const body = await req.text();
  const params = queryString.parse(body);
  const urlQueryName = name.replaceAll(" ", "%20");

  // If the user entered digits, process their request
  if (params.Digits) {
    switch (params.Digits) {
      case '1':
        await db.update(users).set({ checkedIn: true }).where(eq(users.id, userId));
        twiml.say('Thanks for checking in! Have a great day!');
        break;
      default:
        twiml.say("Sorry, look like you picked a different number");
        twiml.pause();
        twiml.redirect(`${process.env.HOST}/voice?userId=${userId}&name=${urlQueryName}`);
        break;
    }
  } else {
    // If no input was sent, redirect to the /voice route
    twiml.redirect(`${process.env.HOST}/voice?userId=${userId}&name=${urlQueryName}`);
  }

  // Render the response as XML in reply to the webhook request
  return new Response(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
    status: 200,
  });
}

