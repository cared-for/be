import "dotenv/config";
import * as handler

const server = Bun.serve({
  hostname: "::",
  port: process.env.PORT ?? 3000,
  fetch(req) {
    const url = new URL(req.url);
    
    if (req.method === "GET" && url.pathname === "/") return outboundCall(req);
    if (req.method === "POST" && url.pathname === "/") return outboundCall(req);
    if (req.method === "POST" && url.pathname === "/voice") return voice(req);
    if (req.method === "POST" && url.pathname === "/gather") return gather(req);
    if (req.method === "POST" && url.pathname === "/status") return status(req);

    return new Response("404!");
  },
});

console.log(`Listening on ${process.env.HOST}`);
