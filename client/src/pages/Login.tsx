import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function getReturnTo(): string {
  if (typeof window === "undefined") return "/";
  const raw = new URLSearchParams(window.location.search).get("returnTo");
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default function Login() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const returnTo = getReturnTo();

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    tipo: "oficina" as "oficina" | "b2b" | "cliente",
  });

  const onAuthed = async (user: { name?: string | null }) => {
    utils.auth.me.setData(undefined, user as never);
    await utils.auth.me.invalidate();
    toast.success(`Bem-vindo, ${user.name || "usuário"}!`);
    navigate(returnTo);
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: onAuthed,
    onError: e => toast.error(e.message),
  });
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: onAuthed,
    onError: e => toast.error(e.message),
  });

  const pending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Rede de Oficinas Brasil</CardTitle>
          <CardDescription>
            Acesse sua conta ou crie uma para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form
                className="space-y-4 pt-4"
                onSubmit={e => {
                  e.preventDefault();
                  loginMutation.mutate(loginData);
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={loginData.email}
                    onChange={e =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={loginData.password}
                    onChange={e =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form
                className="space-y-4 pt-4"
                onSubmit={e => {
                  e.preventDefault();
                  registerMutation.mutate(signupData);
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome</Label>
                  <Input
                    id="signup-name"
                    required
                    minLength={2}
                    value={signupData.name}
                    onChange={e =>
                      setSignupData({ ...signupData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={signupData.email}
                    onChange={e =>
                      setSignupData({ ...signupData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={signupData.password}
                    onChange={e =>
                      setSignupData({ ...signupData, password: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 8 caracteres.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-tipo">Tipo de conta</Label>
                  <select
                    id="signup-tipo"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={signupData.tipo}
                    onChange={e =>
                      setSignupData({
                        ...signupData,
                        tipo: e.target.value as typeof signupData.tipo,
                      })
                    }
                  >
                    <option value="oficina">Sou uma Oficina</option>
                    <option value="b2b">
                      Sou Empresa / Seguradora / Associação (B2B)
                    </option>
                    <option value="cliente">Sou Cliente</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  {registerMutation.isPending
                    ? "Criando conta..."
                    : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
