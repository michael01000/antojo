import "server-only";
import ZAI from "z-ai-web-dev-sdk";

let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

export async function getAI() {
  if (!_zai) _zai = await ZAI.create();
  return _zai;
}

export async function aiChat(messages: { role: "assistant" | "user"; content: string }[]): Promise<string> {
  const zai = await getAI();
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: "disabled" },
  });
  return completion.choices[0]?.message?.content ?? "";
}
