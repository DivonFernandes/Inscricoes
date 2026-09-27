import type { Config, Context } from "@netlify/functions";
import { SESSION_COOKIE_NAME } from "../../lib/session.js";

export default async (_req: Request, context: Context) => {
  context.cookies.delete(SESSION_COOKIE_NAME);
  return new Response(null, { status: 303, headers: { Location: "/" } });
};

export const config: Config = {
  path: "/logout",
};
