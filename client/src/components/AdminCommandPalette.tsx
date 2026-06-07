import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ADMIN_NAV } from "@/lib/adminNav";

// Paleta de comandos do admin (Cmd/Ctrl+K). Lista todos os itens do
// menu, filtrável por busca; selecionar navega imediatamente.
export default function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ir = useCallback(
    (href: string) => {
      setOpen(false);
      navigate(href);
    },
    [navigate]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Busca rápida"
      description="Pule para qualquer área do admin"
    >
      <CommandInput placeholder="Buscar telas, áreas ou ações..." />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        {ADMIN_NAV.map(section => (
          <CommandGroup key={section.id} heading={section.titulo}>
            {section.itens.map(item => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  value={`${section.titulo} ${item.label}`}
                  onSelect={() => ir(item.href)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.emBreve && (
                    <span className="ml-auto text-[10px] uppercase tracking-wide rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
                      Em breve
                    </span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
