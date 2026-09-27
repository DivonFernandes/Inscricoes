import type { Config, Context } from "@netlify/functions";
import { safeEqual } from "../../lib/auth.js";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../lib/session.js";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const form = await req.formData();
  const password = (form.get("password") ?? "").toString();

  const adminPassword = Netlify.env.get("ADMIN_PASSWORD");
  const sessionSecret = Netlify.env.get("SESSION_SECRET");

  if (!adminPassword || !sessionSecret) {
    console.error("ADMIN_PASSWORD or SESSION_SECRET is not configured");
    return new Response("Server misconfigured", { status: 500 });
  }

  if (!password || !safeEqual(password, adminPassword)) {
    return new Response(null, { status: 303, headers: { Location: "/admin?error=1" } });
  }

  context.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: createSessionToken(sessionSecret),
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });

  return new Response(null, { status: 303, headers: { Location: "/inscritos" } });
};

export const config: Config = {
  path: "/api/admin-login",
  method: "POST",
};
