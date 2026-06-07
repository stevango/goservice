export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Login próprio (e-mail/senha). Devolve a rota interna /login, levando
// junto o caminho de retorno para voltar pra onde o usuário estava.
export const getLoginUrl = (returnPath?: string) => {
  const fallback =
    typeof window !== "undefined" ? window.location.pathname : "/";
  const candidate = returnPath || fallback || "/";
  const returnTo =
    candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : "/";
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
};
