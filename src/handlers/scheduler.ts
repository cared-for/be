import { eq } from "drizzle-orm";

import { db } from "../db/db";
import { users } from "../db/schema";

export const schedule = async (req: Request) => {
  try {
    const body = await req.json();
    
    if (!body.time) return new Response("Time is missing", { status: 400 });
    if (!body.userId) return new Response("user id is missing", { status: 400 });
    
    const time = new Date(body.time);
    const utcHour = String(time.getUTCHours()).padStart(2, "0");
    const utcMinute = String(time.getUTCMinutes()).padStart(2, "0");

    const outboundCallEndpoint = `${process.env.HOST}?userId=${body.userId}`
    const res = await fetch(`https://qstash.upstash.io/v2/schedules/${outboundCallEndpoint}`, {
      method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_TOKEN}`,
          "Content-Type": "application/json",
          "Upstash-Cron": `${utcMinute} ${utcHour} * * *`,
        }
    })

    if (!res.ok) throw new Response("Error scheduling call", { status: 500 });

    await db
      .update(users)
      .set({ checkInTime: `${utcHour}:${utcMinute}` })
      .where(eq(users.id, body.userId));
    console.log("user checkin time updated");

    return new Response(`Success`, {
      status: 200
    });

  } catch (error: any) {
    console.log("error: ", error);
    return new Response(error.message, {
      headers: { "content-type": "text/xml" },
      status: 500,
    })
  }
}

