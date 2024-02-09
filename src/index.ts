import "dotenv/config";

import * as handlers from "./handlers";

const server = Bun.serve({
  hostname: "::",
  port: process.env.PORT ?? 3000,
  fetch(req) {
    const url = new URL(req.url);
    
    if (req.method === "GET" && url.pathname === "/") return handlers.outboundCall(req);
    if (req.method === "POST" && url.pathname === "/") return handlers.outboundCall(req);
    if (req.method === "POST" && url.pathname === "/voice") return handlers.voice(req);
    if (req.method === "POST" && url.pathname === "/gather") return handlers.gather(req);
    if (req.method === "POST" && url.pathname === "/status") return handlers.status(req);

    return new Response("404!");
  },
});

console.log(`Listening on ${process.env.HOST}`);
