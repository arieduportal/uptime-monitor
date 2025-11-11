import { ExitStatus } from "typescript";

const server = Bun.serve({
  port: 3000,
  routes: {
    "/": () => new Response("Bun!"),
    "/api/history": () => new Response('hit me'),
    "/monitoring/reports":{
      POST: async (req) => {
        const body = await req.json() as object;
        console.log(req.headers);
        if (req.headers.get('User-Agent') !== "Hello World") return Response.error();
        return Response.json({ message: 'Report received', ...body }, 400);
      }
    }
  },
});

console.log(`Listening on ${server.url}`);
