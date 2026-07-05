"use client";

import { useState, useRef, useEffect } from "react";
import { useAIChat, useComboBuilder } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Wand2, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import { cop } from "@/lib/format";

const SUGGESTIONS = [
  "¿Qué me recomiendas para almorzar hoy?",
  "Tengo antojo de algo picante 🌶️",
  "Opciones saludables bajo $25.000",
  "Algo para compartir con 4 amigos",
  "Un postre para celebrar 🎉",
];

type Msg = { role: "user" | "assistant"; content: string };

export function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "¡Hola! Soy Sazón AI 🍳 Tu asistente culinario en Antojo. Dime qué se te antoja, tu presupuesto o cuántos comen, y te recomiendo el plato perfecto en Bogotá." },
  ]);
  const [input, setInput] = useState("");
  const chat = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages.length]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    try {
      const { reply } = await chat.mutateAsync({ message: content, history: next.slice(0, -1) });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "En este momento no puedo responder, pero échale un ojo a las recomendaciones 'Para ti' en la pantalla de inicio 🍔" }]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col px-3 pt-4 sm:px-5 lg:px-0 lg:h-[calc(100vh-8rem)]">
      <div className="mb-3 flex items-center gap-2">
        <div className="relative grid h-10 w-10 place-items-center rounded-2xl text-white shadow-glow" style={{ background: "linear-gradient(135deg, var(--lima), var(--antojo))" }}>
          <Wand2 size={18} />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-background" />
        </div>
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight">Sazón AI</h1>
          <p className="text-xs text-muted-foreground">Tu asistente de antojos · responde en segundos</p>
        </div>
      </div>

      {/* ─── Combo Builder AI ─── */}
      <ComboBuilder />

      <Card className="flex flex-1 flex-col overflow-hidden shadow-soft">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex items-end gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--lima), var(--antojo))" }}><Sparkles size={13} /></div>
              )}
              <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed", m.role === "user" ? "rounded-br-sm text-white" : "rounded-bl-sm bg-secondary") }
                style={m.role === "user" ? { background: "var(--antojo)" } : undefined}>
                {m.content}
              </div>
            </div>
          ))}
          {chat.isPending && (
            <div className="flex items-end gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--lima), var(--antojo))" }}><Sparkles size={13} /></div>
              <div className="rounded-2xl rounded-bl-sm bg-secondary px-4 py-3">
                <span className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="border-t border-border/60 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sugerencias</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium hover:bg-secondary">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 border-t border-border/60 p-2.5">
          <Input placeholder="Pregúntame cualquier antojo…" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()} className="h-10" disabled={chat.isPending} />
          <Button size="icon" className="h-10 w-10 rounded-full" style={{ background: "var(--antojo)", color: "white" }} onClick={() => send()} disabled={chat.isPending || !input.trim()}>
            <Send size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ComboBuilder() {
  const comboMut = useComboBuilder();
  const addToCart = useApp((s) => s.addToCart);
  const setCustomerView = useApp((s) => s.setCustomerView);
  const [budget, setBudget] = useState("50000");
  const [people, setPeople] = useState("1");
  const [pref, setPref] = useState("");
  const [result, setResult] = useState<any>(null);

  const build = async () => {
    try {
      const r = await comboMut.mutateAsync({ budget: parseInt(budget), people: parseInt(people), preference: pref });
      setResult(r);
    } catch (e: any) { toast.error(e.message); }
  };

  const addAll = () => {
    if (!result?.combo) return;
    result.combo.forEach((item: any) => {
      addToCart({ menuItemId: item.id, name: item.name, emoji: item.emoji, price: item.price, qty: 1, restaurantId: "", restaurantName: item.restaurant });
    });
    toast.success(`¡Combo de ${result.combo.length} items añadido al carrito! 🛒`);
    setCustomerView("checkout");
  };

  return (
    <Card className="p-4 shadow-soft">
      <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold">
        <Wand2 size={16} style={{ color: "var(--lima)" }} /> Combo Builder AI
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">Arma un combo completo dentro de tu presupuesto</p>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <Input value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))} placeholder="Presupuesto" className="h-9" />
        <Input value={people} onChange={(e) => setPeople(e.target.value.replace(/\D/g, ""))} placeholder="Personas" className="h-9" />
        <Input value={pref} onChange={(e) => setPref(e.target.value)} placeholder="Preferencia" className="h-9" />
      </div>
      <Button className="w-full rounded-xl" style={{ background: "var(--lima)", color: "white" }} disabled={comboMut.isPending} onClick={build}>
        {comboMut.isPending ? "Armando combo..." : "Armar combo con IA"}
      </Button>
      {result && (
        <div className="mt-3 space-y-2 rounded-xl bg-secondary/40 p-3">
          {result.reason && <p className="text-xs italic text-muted-foreground">{result.reason}</p>}
          {result.combo?.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-lg">{item.emoji ?? "🍽️"}</span>
              <span className="flex-1 truncate">{item.name}</span>
              <span className="text-xs text-muted-foreground truncate">{item.restaurant}</span>
              <span className="font-bold">{cop(item.price)}</span>
            </div>
          ))}
          {result.total != null && (
            <>
              <div className="flex justify-between border-t border-border/40 pt-2 text-sm font-bold">
                <span>Total</span><span style={{ color: "var(--lima)" }}>{cop(result.total)}</span>
              </div>
              <Button className="w-full rounded-xl gap-2" style={{ background: "var(--antojo)", color: "white" }} onClick={addAll}>
                <ShoppingCart size={15} /> Agregar todo al carrito
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
