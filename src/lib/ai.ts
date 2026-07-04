import "server-only";
import ZAI from "z-ai-web-dev-sdk";

let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

export async function getAI() {
  if (!_zai) _zai = await ZAI.create();
  return _zai;
}

/**
 * Chat con el LLM (Sazón AI).
 *
 * Robustez:
 *  - Timeout de 15 segundos para evitar que la app se cuelgue en Vercel.
 *  - Si el SDK falla (credenciales, red, etc.), lanza un error que el caller
 *    debe atrapar y mostrar un fallback graceful.
 *
 * Nota sobre credenciales en Vercel:
 *  El SDK z-ai-web-dev-sdk se autentica con variables internas del entorno
 *  Z.ai. En el sandbox estas están inyectadas automáticamente. En Vercel,
 *  si no están presentes, ZAI.create() o chat.completions.create() fallarán.
 *  El catch en /api/ai/chat retorna un mensaje fallback graceful.
 *
 *  Para producción con un LLM propio, reemplazar esta función por una
 *  llamada a OpenAI/Anthropic con su API key correspondiente.
 */
export async function aiChat(messages: { role: "assistant" | "user"; content: string }[]): Promise<string> {
  const zai = await getAI();

  // Timeout de 15s: si el LLM no responde, lanzar error para que el caller haga fallback
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("AI_TIMEOUT")), 15000);
  });

  const completionPromise = zai.chat.completions.create({
    messages,
    thinking: { type: "disabled" },
  });

  const completion = await Promise.race([completionPromise, timeoutPromise]);
  return completion.choices[0]?.message?.content ?? "";
}
