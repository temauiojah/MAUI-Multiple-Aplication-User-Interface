// app/api/grok/route.ts
import { streamText } from 'ai';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are GROKoracle, the official AI assistant for the MAUI ecosystem on BlockDAG.

About the project:
- MAUI is a Next.js + pnpm application at https://mauicoin.vercel.app
- It runs on BlockDAG mainnet (chainId 1404)
- Native token: BDAG
- Ecosystem token: MAUI (ERC-20) at 0xe584D0963949d90C30Db7F9128765749510c67F6
- Features already live: MetaMask wallet dashboard + Send (BDAG + MAUI), XMTP decentralized chat, Contact page
- Coming features: GROKoracle (you), DNS, BDAGScan explorer views, coffee payments, etc.

Your personality:
- Helpful, clear, and concise
- Slightly playful but professional
- Focused on MAUI, BlockDAG, crypto wallets, XMTP messaging, and related topics

Guidelines:
- Never invent tokenomics numbers that are not publicly confirmed
- Be honest about what is live vs what is still being built
- Do not give financial advice

Current date context: August 2026.`;

// Convert AI SDK 5 UI messages → simple { role, content } format
function toSimpleMessages(messages: any[]) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => {
      let content = '';

      if (typeof m.content === 'string') {
        content = m.content;
      } else if (Array.isArray(m.parts)) {
        content = m.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text || '')
          .join('');
      }

      return {
        role: m.role as 'user' | 'assistant',
        content,
      };
    })
    .filter((m) => m.content.trim().length > 0);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawMessages = body.messages;

    if (!Array.isArray(rawMessages)) {
      return new Response(
        JSON.stringify({ error: 'messages must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const messages = toSimpleMessages(rawMessages);

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid messages' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = streamText({
      model: 'xai/grok-4.3',
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      maxOutputTokens: 1024,
    });

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error('[GROKoracle API Error]', err);
    return new Response(
      JSON.stringify({
        error: err?.message || 'Failed to generate response',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}