import { eq } from "drizzle-orm";

import { client } from "../twilio";
import { db } from "../db/db";
import * as table from "../db/schema";
import { getUrlParams } from "../utils";

export const status = async (req: Request) => {
  try {
    const { userId } = getUrlParams(req);

    const [user] = await db
      .select({ 
        checkedIn: table.users.checkedIn,
        attemptCount: table.users.attemptCount,
      })
      .from(table.users)
      .where(eq(table.users.id, userId))
    console.log("user in status: ", user);

    if (!user) {
      return new Response("User not found", {
        headers: { "content-type": "text/xml" },
      })
    }

    if (user.checkedIn) {
      console.log("User successfully checked in");
      await db
        .update(table.users)
        .set({ attemptCount: 0 })
        .where(eq(table.users.id, userId));

      return new Response(`Success`, {
        headers: { "content-type": "text/xml" },
      });
    } else {
      console.log("User did not successfully check in");
      if (user.attemptCount < 4) {
        console.log("updated user attempt count");
        await db
          .update(table.users)
          .set({ attemptCount: user.attemptCount + 1 })
          .where(eq(table.users.id, userId));
        
        const outboundEndpoint = `${process.env.HOST}?userId=${userId}`
        console.log("attempting to retry outbound endpoint: ", outboundEndpoint);
        await fetch(`https://qstash.upstash.io/v2/publish/${outboundEndpoint}`,{
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_TOKEN}`,
            "Content-Type": "application/json",
            "Upstash-Delay": "15m",
          },
        })

        console.log("retry scheduled");

        return new Response(`Retrying in 15 minutes`, {
          headers: { "content-type": "text/xml" },
        });
      } else {
        await db.update(table.users).set({ attemptCount: 0 }).where(eq(table.users.id, userId));
        await notifyDependents(userId);

        return new Response(`Contacting table.dependents`, {
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
    .select({ name: table.users.fullName })
    .from(table.users)
    .where(eq(table.users.id, userId));
  const dependents = await db
    .select({ phone: table.dependents.phone, name: table.dependents.fullName })
    .from(table.dependents)
    .where(eq(table.dependents.userId, userId));

  if (!user) return new Response("User not found", { status: 404 });
  if (dependents.length === 0) return new Response("No table.dependents found", { status: 404 });

  console.log("dependents: ", dependents);
  for (const dependent of dependents) {
    console.log("attempting to message")
    client.messages
      .create({
         body: `Hello ${dependent.name} - We are notifiying you that ${user.name} has failed to check in 4 times in a row over the hour. It may be in your best interest to try and contact them independently`,
         from: "+18889043674",
         to: dependent.phone as string
       })
    console.log("message sent");
  }
}

