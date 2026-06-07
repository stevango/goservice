import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { User } from "../../drizzle/schema";
import type { TrpcContext } from "./context";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

// appId precisa ser não-vazio: verifySession rejeita sessão sem ele.
const APP_ID = ENV.appId || "rede-oficinas-brasil";

export async function setSessionCookie(
  ctx: Pick<TrpcContext, "req" | "res">,
  user: User
): Promise<void> {
  const token = await sdk.signSession(
    {
      openId: user.openId,
      appId: APP_ID,
      name: user.name?.trim() || user.email || "Usuário",
    },
    { expiresInMs: ONE_YEAR_MS }
  );
  const options = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, token, { ...options, maxAge: ONE_YEAR_MS });
}
