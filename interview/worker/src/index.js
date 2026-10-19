// 면접 리허설 AI 평가 중계 서버 (Cloudflare Workers)
// 역할: Claude API 키를 브라우저에 두지 않고, 질문·답변 글만 받아 평가 결과(JSON)를 돌려준다.
// 답변은 저장하지 않는다. 로그에도 답변 내용을 남기지 않는다.

import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, RESULT_SCHEMA } from './rubric.js';

const MAX_QUESTION = 300;
const MAX_ANSWER = 3000;

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ ok: true }, 200, cors);
    if (url.pathname !== '/evaluate' || request.method !== 'POST') return json({ error: '없는 주소입니다' }, 404, cors);
    if (!cors['Access-Control-Allow-Origin']) return json({ error: '허용되지 않은 사이트입니다' }, 403, cors);
    if (env.CLASS_CODE && request.headers.get('X-Class-Code') !== env.CLASS_CODE) {
      return json({ error: '수업 코드가 맞지 않습니다' }, 401, cors);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: '요청 형식이 잘못되었습니다' }, 400, cors); }
    const question = String(body.question || '').trim().slice(0, MAX_QUESTION);
    const answer = String(body.answer || '').trim();
    if (!question || answer.length < 5) return json({ error: '질문과 답변이 필요합니다' }, 400, cors);
    if (answer.length > MAX_ANSWER) return json({ error: '답변이 너무 깁니다' }, 400, cors);
    const prev = body.previous && typeof body.previous === 'object' ? body.previous : null;

    const userText = [
      `<question>${question}</question>`,
      `<answer>${answer}</answer>`,
      `<meta>답변 시간 ${Number(body.durationSec) || 0}초 / 제한 ${Number(body.limitSec) || 60}초 / ${body.typed ? '글로 답함' : '말로 답함'}</meta>`,
      prev ? `<previous_answer>${String(prev.answer || '').slice(0, MAX_ANSWER)}</previous_answer>\n<previous_next_fix>${String(prev.next_fix || '').slice(0, 200)}</previous_next_fix>` : '',
    ].filter(Boolean).join('\n');

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    try {
      const response = await client.beta.messages.create({
        model: env.MODEL || 'claude-opus-5-5',
        max_tokens: 8000,
        // 안전 분류기가 거절하면 서버에서 대체 모델로 다시 시도한다.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        // 수업 중 대기 시간을 줄이려고 effort 기본값을 low로 둔다. 품질을 더 원하면 EFFORT=medium.
        output_config: { effort: env.EFFORT || 'low', format: { type: 'json_schema', schema: RESULT_SCHEMA } },
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userText }],
      });

      if (response.stop_reason === 'refusal') return json({ error: '이 답변은 평가할 수 없습니다' }, 422, cors);
      if (response.stop_reason === 'max_tokens') return json({ error: '평가 결과가 잘렸습니다. 다시 시도해 주세요' }, 502, cors);
      const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
      const result = JSON.parse(text);
      return json(result, 200, cors);
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) return json({ error: '요청이 많습니다. 잠시 후 다시 시도해 주세요' }, 429, cors);
      if (err instanceof Anthropic.AuthenticationError) return json({ error: '서버 API 키 설정을 확인해 주세요' }, 500, cors);
      if (err instanceof Anthropic.APIConnectionError) return json({ error: 'AI 서버에 연결하지 못했습니다' }, 502, cors);
      if (err instanceof Anthropic.APIError) return json({ error: `AI 서버 오류 (${err.status ?? '알 수 없음'})` }, 502, cors);
      if (err instanceof SyntaxError) return json({ error: '평가 결과를 읽지 못했습니다' }, 502, cors);
      return json({ error: '알 수 없는 오류' }, 500, cors);
    }
  },
};

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Class-Code',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
}
