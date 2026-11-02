import type { Config } from "@netlify/functions";
import { asc, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { scores } from "../../db/schema.js";

const LIMIT = 100;

async function list() {
  const rows = await db
    .select()
    .from(scores)
    .orderBy(desc(scores.score), asc(scores.createdAt))
    .limit(LIMIT);
  return rows.map((r) => ({ id: r.id, name: r.name, s: r.score, t: r.createdAt.toISOString() }));
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { ...CORS, "cache-control": "no-store" } });

export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  try {
    if (req.method === "GET") return json(await list());

    if (req.method === "POST") {
      let body: any;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Requête invalide" }, 400);
      }
      const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, 40) : "";
      const score = body?.score;
      if (!name) return json({ error: "Nom manquant" }, 400);
      if (name.toLowerCase() === "fabrice") return json({ error: "Ce nom est pris par Fabrice." }, 400);
      if (!Number.isInteger(score) || score < 0 || score > 1_000_000) {
        return json({ error: "Score invalide" }, 400);
      }
      const [row] = await db.insert(scores).values({ name, score }).returning({ id: scores.id });
      return json({ id: row.id, scores: await list() }, 201);
    }

    return new Response("Method not allowed", { status: 405, headers: CORS });
  } catch (err) {
    console.error("scores error", err);
    return json({ error: "Erreur serveur, réessaie plus tard." }, 500);
  }
};

export const config: Config = {
  path: "/api/scores",
};
