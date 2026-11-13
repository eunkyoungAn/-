// 말하기 지표 계산과 AI 미연결 시 쓰는 간이 피드백.
// 전달 점수는 AI 연결 여부와 관계없이 항상 여기서 계산한다(같은 기준으로 비교하기 위해).

import { RUBRIC, totalScore, voiceScore } from './rubric.js';
export { RUBRIC, totalScore, voiceScore };

// 단독으로 쓰인 군말만 센다. "그"는 "그래서" 같은 단어 안에서는 세지 않는다.
const FILLERS = ['음', '어', '으', '아', '그', '저', '뭐', '이제', '약간', '그니까', '그러니까', '막'];
const FILLER_RE = new RegExp(`(^|[\\s,.?!])(${FILLERS.join('|')})(?=[\\s,.?!]|$)`, 'g');

export function countFillers(text) {
  const found = {};
  let total = 0;
  for (const m of (text || '').matchAll(FILLER_RE)) {
    found[m[2]] = (found[m[2]] || 0) + 1;
    total += 1;
  }
  return { total, found };
}

export function syllables(text) {
  return ((text || '').match(/[가-힣]/g) || []).length;
}

export function measure(text, durationSec) {
  const sec = Math.max(1, Math.round(durationSec || 0));
  const syl = syllables(text);
  const perMin = Math.round(syl / (sec / 60));
  const fillers = countFillers(text);
  return {
    durationSec: sec,
    syllables: syl,
    perMin,
    fillers: fillers.total,
    fillerDetail: fillers.found,
  };
}

// 한국어 발표 속도는 대략 분당 250~380음절을 편하게 듣는다고 보고 기준을 잡았다.
export function speedLabel(perMin) {
  if (perMin < 200) return '느린 편';
  if (perMin > 420) return '빠른 편';
  return '적당함';
}

export function deliveryScore(metrics, limitSec) {
  let score = 5;
  const notes = [];
  const minGood = Math.round(limitSec * 0.6);
  if (metrics.durationSec < minGood * 0.6) { score -= 2; notes.push('답변이 많이 짧습니다'); }
  else if (metrics.durationSec < minGood) { score -= 1; notes.push('답변이 조금 짧습니다'); }
  if (metrics.syllables > 30) {
    if (metrics.perMin < 170 || metrics.perMin > 460) { score -= 2; notes.push(`말 속도가 ${speedLabel(metrics.perMin)}입니다`); }
    else if (metrics.perMin < 200 || metrics.perMin > 420) { score -= 1; notes.push(`말 속도가 ${speedLabel(metrics.perMin)}입니다`); }
  }
  const perMinFillers = metrics.fillers / (metrics.durationSec / 60);
  if (perMinFillers > 8) { score -= 2; notes.push('군말이 많습니다'); }
  else if (perMinFillers > 4) { score -= 1; notes.push('군말이 조금 있습니다'); }
  return { score: clamp(score), reason: notes.length ? notes.join(', ') : '길이와 속도가 적당하고 군말이 적습니다' };
}

function clamp(n) {
  return Math.max(1, Math.min(5, Math.round(n)));
}

function sentences(text) {
  return (text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.?!])\s+|(?<=(?:니다|어요|아요|해요|예요|이에요|습니다|죠))\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

const TIPS = {
  specific: {
    fix: '상황, 내가 직접 한 행동, 결과를 한 문장씩 넣어 보세요.',
    example: '"[당시 상황]에서 저는 [맡은 일]을 맡았습니다. 제가 직접 [구체적인 행동]을 했고, 그 결과 [지표]가 [전]에서 [후]로 바뀌었습니다."',
    probe: '어떤 문제가 있었고 본인이 직접 취한 행동은 무엇이었나요? 그 행동으로 어떤 변화가 있었나요?',
  },
  jobfit: {
    fix: '이 경험이 지원 직무의 어떤 역량을 보여 주는지 한 문장으로 이어 보세요.',
    example: '"이 경험으로 익힌 [역량]을 [지원 직무]의 [구체적인 업무]에서 이렇게 쓰겠습니다."',
    probe: '그 경험에서 얻은 역량을 지원 직무의 어떤 업무에 쓸 수 있나요?',
  },
  logic: {
    fix: '첫 문장에서 질문의 답을 바로 말해 보세요.',
    example: '"제 답은 [결론]입니다. 이유는 [근거 경험]입니다."처럼 결론을 먼저 말하고 근거를 이어 보세요.',
    probe: '질문에 대한 답을 한 문장으로 먼저 말씀해 주시겠어요?',
  },
};

// AI를 연결하지 않았을 때 쓰는 규칙 기반 간이 평가. 답변 속 표현을 세는 방식이라 내용 판단이 거칠다는 점을 화면에 밝힌다.
export function localEvaluate({ answer }) {
  const text = answer || '';
  const sents = sentences(text);
  const first = sents[0] || '';

  // 논리성과 질문 적합성: 첫 문장에서 답을 맺는가, 이유·순서를 잇는 말이 있는가
  let logic = 3;
  if (!first) logic = 1;
  else {
    if (first.length <= 60 && /(입니다|습니다|때문|위해|라고 생각)/.test(first)) logic += 1;
    if (/(왜냐하면|때문에|그래서|따라서|먼저|첫째|그 결과|이를 위해)/.test(text)) logic += 1;
    if (/^(음|어|그|저기|일단|사실)(?=[\s,]|$)/.test(first) || first.length > 110) logic -= 1;
    if (sents.length < 2) logic -= 1;
  }
  logic = clamp(logic);

  // 답변의 구체성: 상황, 본인 역할, 행동, 결과 신호와 숫자
  const star = {
    상황: /(당시|때|상황|시절|에서 일|근무하며|하면서)/.test(text),
    '본인 역할': /(제가|저는|맡|담당|역할)/.test(text),
    행동: /(했습니다|했고|했으며|하여|해서|진행|시도|제안|만들|정리|개선|해결|분석|검토|작성|설계|운영)/.test(text),
    결과: /(결과|덕분|이후|늘었|줄었|받았|달성|향상|단축)/.test(text),
  };
  const starHits = Object.values(star).filter(Boolean).length;
  const nums = numberHints(text);
  const abstractOnly = /(책임감|소통|성실|열정|노력|꼼꼼)/.test(text) && starHits <= 1;
  let specific = 1 + starHits * 0.75 + (nums.numbers_found.length ? 1 : 0);
  if (abstractOnly) specific = Math.min(specific, 2);
  specific = clamp(specific);

  // 직무역량 근거
  const jobHits = (text.match(/(직무|업무|회사|기여|입사|지원|현장|고객|역량|활용|도움이 되)/g) || []).length;
  const lastHasJob = /(기여|활용|도움|하겠습니다|싶습니다)/.test(sents[sents.length - 1] || '');
  const jobfit = clamp(1 + Math.min(3, jobHits) + (lastHasJob ? 1 : 0));

  const scores = { specific, jobfit, logic };
  const missing = Object.entries(star).filter(([, v]) => !v).map(([k]) => k);
  const reasons = {
    specific: abstractOnly ? '특성은 말했지만 실제 행동과 성과를 확인하기 어렵습니다'
      : `상황·본인 역할·행동·결과 중 ${starHits}가지가 보이고, 숫자 표현은 ${nums.numbers_found.length ? nums.numbers_found.length + '개' : '없습니다'}${missing.length ? ` (빠진 것: ${missing.join(', ')})` : ''}`,
    jobfit: lastHasJob ? '경험을 직무에서의 기여로 잇습니다' : '경험이 지원 직무의 어떤 역량을 보여 주는지 드러나지 않습니다',
    logic: logic >= 4 ? '첫 문장에서 답이 드러나고 흐름이 이어집니다' : '첫 문장만으로는 질문의 답이 잘 보이지 않습니다',
  };
  const order = ['specific', 'jobfit', 'logic'];
  const best = order.reduce((a, b) => (scores[b] > scores[a] ? b : a), order[0]);
  const worst = order.reduce((a, b) => (scores[b] < scores[a] ? b : a), order[0]);
  const label = key => RUBRIC.find(r => r.key === key).label;

  return {
    source: 'local',
    scores,
    reasons,
    strength: scores[best] >= 4 ? `${label(best)}: ${reasons[best]}.` : '끝까지 답을 마친 점이 좋습니다. 아직 4점 이상인 항목은 없으니 아래 고칠 점부터 하나씩 채워 보세요.',
    improvement: `${label(worst)}: ${reasons[worst]}.`,
    next_fix: TIPS[worst].fix,
    rewrite_example: TIPS[worst].example,
    probe: scores[worst] <= 3 ? TIPS[worst].probe : '',
    comparison: '',
    ...nums,
  };
}

// 답변 속 정량 표현을 찾고, 빠진 종류(결과 증감, 규모, 기간)를 채울 거리로 제안한다.
export function numberHints(text) {
  const found = [...new Set((text.match(/[0-9]+(?:[.,][0-9]+)?\s?(?:%|퍼센트|명|건|개|번|회|배|점|시간|일|주|개월|달|년|만\s?원|원|위|곳)|(?:한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s?(?:명|개|번|달|해|가지|시간|주|곳|건|배)/g) || []).map(t => t.trim()))].slice(0, 6);
  const add = [];
  if (!/(%|퍼센트|배|늘|줄|증가|감소|단축|→|에서 .{1,8}로)/.test(text)) add.push('결과: 바꾸기 전과 후를 숫자로 비교(예: [전]건 → [후]건, [증가율]%)');
  if (!/[0-9]+\s?(명|건|개|곳)|(한|두|세|네|다섯)\s?(명|건|개|곳)/.test(text)) add.push('규모: 몇 명, 몇 건을 대상으로 했는지');
  if (!/[0-9]+\s?(개월|달|주|년|일|시간)|(한|두|세)\s?(달|해|주)/.test(text)) add.push('기간: 얼마 동안 했는지');
  return { numbers_found: found, numbers_to_add: add };
}
