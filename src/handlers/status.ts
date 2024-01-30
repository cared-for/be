import { eq } from "drizzle-orm";

import { client } from "../twilio";
import { db } from "../db/db";
import { users, dependents } from "../db/schema";
import { getUrlParams } from "../utils";

export const status = async (req: Request) => {
  try {
    const { userId } = getUrlParams(req);

    const [user] = await db
      .select({ 
        checkedIn: users.checkedIn,
        attemptCount: users.attemptCount,
      })
      .from(users)
      .where(eq(users.id, userId))
    console.log("user in status: ", user);

    if (!user) {
      return new Response("User not found", {
        headers: { "content-type": "text/xml" },
      })
    }

    if (user.checkedIn) {
      console.log("User successfully checked in");
      await db
        .update(users)
        .set({ attemptCount: 0 })
        .where(eq(users.id, userId));

      return new Response(`Success`, {
        headers: { "content-type": "text/xml" },
      });
    } else {
      console.log("User did not successfully check in");
      if (user.attemptCount < 4) {
        console.log("updated user attempt count");
        await db
          .update(users)
          .set({ attemptCount: user.attemptCount + 1 })
          .where(eq(users.id, userId));
        
        const outboundEndpoint = `${process.env.HOST}?userId=${userId}`
        console.log("attempting to retry outbound endpoint: ", outboundEndpoint);
        await fetch(`https://qstash.upstash.io/v2/publish/${outboundEndpoint}`,{
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_TOKEN}`,
            "Content-Type": "application/json",
            "Upstash-Delay": "10s",
          },
        })

        console.log("retry scheduled");

        return new Response(`Retrying in 15 minutes`, {
          headers: { "content-type": "text/xml" },
        });
      } else {
        console.log("does it get in here?");
        await db.update(users).set({ attemptCount: 0 }).where(eq(users.id, userId));
        await notifyDependents(userId);

        return new Response(`Contacting dependents`, {
          headers: { "content-type": "text/xml" },
        });
      }
    }
  } catch (error: any) {
    return new Response(error.message, {
      headers: { "content-type": "text/xml" },
    })
  }
}


const notifyDependents = async (userId: number) => {
  const [user] = await db
    .select({ name: users.fullName })
    .from(users)
    .where(eq(users.id, userId));
  const contacts = await db
    .select({ phone: dependents.phone, name: dependents.fullName })
    .from(dependents)
    .where(eq(dependents.userId, userId));
  
  if (!user) return new Response("User not found", { status: 404 });
  if (contacts.length === 0) return new Response("No dependents found", { status: 404 });

  for (const contact of contacts) {
    console.log("attempting to send message to: ", contact.phone);
    client.messages
      .create({
         body: `Hello ${contact.name} - We are notifiying you that ${user.name} has failed to check in 4 times in a row over the hour. It may be in your best interest to try and contact them independently`,
         from: "+13239828587",
         to: contact.phone as string
       })
    console.log("message sent");
  }
}

