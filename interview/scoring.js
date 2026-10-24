// 말하기 지표 계산과 AI 미연결 시 쓰는 간이 피드백.
// 전달 점수는 AI 연결 여부와 관계없이 항상 여기서 계산한다(같은 기준으로 비교하기 위해).

export const RUBRIC = [
  { key: 'lead', label: '두괄식', looks: '첫 문장에 핵심 답이 있는가' },
  { key: 'structure', label: '구조', looks: '상황-과제-행동-결과 흐름이 있는가' },
  { key: 'specificity', label: '구체성', looks: '수치, 기간, 고유한 사례가 있는가' },
  { key: 'jobfit', label: '직무 연결', looks: '경험을 지원 직무 역량과 잇는가' },
  { key: 'delivery', label: '전달', looks: '길이, 말 속도, 군말' },
];

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
  lead: {
    fix: '첫 문장에 질문의 답을 바로 말해 보세요.',
    example: '"제 강점은 [강점]입니다. [언제·어디서] [한 일]을 하며 이 강점을 키웠습니다."처럼 결론을 먼저 말하고 근거를 이어 보세요.',
  },
  structure: {
    fix: '상황 → 맡은 일 → 내가 한 행동 → 결과 순서로 말해 보세요.',
    example: '"[당시 상황]에서 저는 [맡은 일]을 맡았습니다. 그래서 [구체적인 행동]을 했고, 그 결과 [변화나 성과]가 있었습니다."',
  },
  specificity: {
    fix: '숫자나 기간을 하나 이상 넣어 보세요.',
    example: '"많은 고객을 응대했습니다" 대신 "하루 평균 [숫자]명의 고객을 [기간] 동안 응대했습니다"처럼 말해 보세요.',
  },
  jobfit: {
    fix: '마지막 문장을 지원 직무에서의 기여로 마무리해 보세요.',
    example: '"이 경험으로 익힌 [역량]을 [지원 직무]의 [구체적인 업무]에서 바로 활용하겠습니다."',
  },
  delivery: {
    fix: '시간을 넉넉히 쓰고, 군말 대신 짧게 멈췄다가 말해 보세요.',
    example: '말이 막힐 때 "음", "어" 대신 1초 멈추고 다음 문장을 시작하면 더 침착하게 들립니다.',
  },
};

// AI를 연결하지 않았을 때 쓰는 규칙 기반 간이 평가. 내용 판단이 거칠다는 점을 화면에 밝힌다.
export function localEvaluate({ answer, metrics, limitSec }) {
  const text = answer || '';
  const sents = sentences(text);
  const first = sents[0] || '';

  let lead = 3;
  if (!first) lead = 1;
  else {
    if (first.length <= 60) lead += 1;
    if (/^(음|어|그|저기|일단|사실)(?=[\s,]|$)/.test(first)) lead -= 1;
    if (/(입니다|습니다|때문|위해|라고 생각)/.test(first)) lead += 1;
    if (first.length > 110) lead -= 1;
  }

  const starHits = [
    /(당시|때|상황|시절|에서 일|근무하며|하면서)/,
    /(맡|담당|목표|과제|역할|해야 했)/,
    /(했습니다|진행|시도|제안|만들|정리|개선|해결)/,
    /(결과|덕분|그래서|이후|늘었|줄었|받았|배웠|달성)/,
  ].filter(re => re.test(text)).length;
  const structure = clamp(1 + starHits);

  const numHits = (text.match(/\d+|(?:한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s?(?:명|개|번|달|해|가지|시간|주|곳|건)|(?:개월|년간|퍼센트|%)/g) || []).length;
  const specificity = clamp(numHits === 0 ? 2 : numHits === 1 ? 3 : numHits <= 3 ? 4 : 5);

  const jobHits = (text.match(/(직무|업무|회사|기여|입사|지원|현장|고객|역량|활용|도움이 되)/g) || []).length;
  const lastHasJob = /(기여|활용|도움|하겠습니다|싶습니다)/.test(sents[sents.length - 1] || '');
  const jobfit = clamp(1 + Math.min(3, jobHits) + (lastHasJob ? 1 : 0));

  const delivery = deliveryScore(metrics, limitSec);

  const scores = { lead, structure, specificity, jobfit, delivery: delivery.score };
  const reasons = {
    lead: lead >= 4 ? '첫 문장에서 답이 드러납니다' : '첫 문장만으로는 답이 잘 보이지 않습니다',
    structure: `흐름 요소 4개 중 ${starHits}개가 보입니다`,
    specificity: numHits ? `숫자·기간 표현이 ${numHits}번 나옵니다` : '숫자나 기간 표현이 없습니다',
    jobfit: lastHasJob ? '직무 기여로 마무리합니다' : '직무와 잇는 문장이 약합니다',
    delivery: delivery.reason,
  };

  // 글로 답한 경우 전달은 평가하지 않으므로 잘한 점·고칠 점 후보에서 뺀다.
  const order = RUBRIC.map(r => r.key).filter(k => !(metrics.typed && k === 'delivery'));
  const best = order.reduce((a, b) => (scores[b] > scores[a] ? b : a), order[0]);
  const worst = order.reduce((a, b) => (scores[b] < scores[a] ? b : a), order[0]);
  const label = key => RUBRIC.find(r => r.key === key).label;

  return {
    source: 'local',
    scores,
    reasons,
    strength: `${label(best)} 항목이 가장 좋습니다. ${reasons[best]}.`,
    improvement: `${label(worst)} 항목을 먼저 보완해 보세요. ${reasons[worst]}.`,
    next_fix: TIPS[worst].fix,
    rewrite_example: TIPS[worst].example,
    comparison: '',
  };
}
