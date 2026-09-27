import type { Config, Context } from "@netlify/functions";
import { desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { inscricoes } from "../../db/schema.js";
import { verifySessionToken, SESSION_COOKIE_NAME } from "../../lib/session.js";
import { renderPage, escapeHtml } from "../../lib/html.js";

function formatTimestamp(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().replace("T", " ").slice(0, 19);
}

export default async (_req: Request, context: Context) => {
  const sessionSecret = Netlify.env.get("SESSION_SECRET");
  const token = context.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionSecret || !verifySessionToken(token, sessionSecret)) {
    return new Response(null, { status: 303, headers: { Location: "/admin" } });
  }

  const registros = await db.select().from(inscricoes).orderBy(desc(inscricoes.createdAt));

  const rows = registros
    .map(
      (r) => `      <tr>
        <td>${r.id}</td>
        <td>${escapeHtml(r.cpf)}</td>
        <td>${escapeHtml(r.nome)}</td>
        <td>${r.idade ?? ""}</td>
        <td>${r.chefeDeEquipe ? "Sim" : "Não"}</td>
        <td>${escapeHtml(formatTimestamp(r.createdAt))}</td>
      </tr>`,
    )
    .join("\n");

  const body = `      <h1>Inscritos</h1>
      <p class="text-end"><a href="/logout" class="btn btn-sm btn-outline-secondary">Sair</a></p>
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th>#</th>
            <th>CPF</th>
            <th>Nome</th>
            <th>Idade</th>
            <th>Chefe?</th>
            <th>Criado em</th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>`;

  return new Response(renderPage("Inscritos", body), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

export const config: Config = {
  path: "/inscritos",
};
