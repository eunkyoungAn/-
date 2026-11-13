// 면접 피드백 평가 기준 (2026년 11월 기준, 대표 정리본 「AI면접 및 일반면접 피드백 평가기준과 근거자료」).
// 기준·가중치·주의점·근거를 바꾸려면 이 파일만 고친다.
// 원칙: 답변 내용의 구체성과 직무역량 입증이 주요 평가항목이고,
//       목소리·시선·표정·움직임은 전달력 개선을 위한 코칭 지표다. 행동을 성격이나 능력으로 단정하지 않는다.

export const RUBRIC = [
  {
    key: 'specific', label: '답변의 구체성', weight: 25, group: '내용',
    looks: '상황·본인 행동·성과가 충분히 나타나는가',
    caution: '추상적인 성격 설명만으로 역량을 판단하지 않습니다.',
    anchors: { 5: '실제 상황, 본인 역할, 직접 한 행동, 결과(수치·전후 비교)가 모두 드러난다', 3: '상황과 행동은 있으나 본인 역할이나 결과가 흐릿하다', 1: '"책임감 있게 소통했다"처럼 특성만 말하고 실제 행동·결과가 없다' },
    basis: 'A', refs: ['levashina2014', 'campion1988', 'star'],
  },
  {
    key: 'jobfit', label: '직무역량 근거', weight: 25, group: '내용',
    looks: '지원 직무에 필요한 역량을 경험으로 입증하는가',
    caution: '직무마다 필요한 역량이 다르므로 지원 직무 기준으로 봅니다.',
    anchors: { 5: '경험이 지원 직무의 요구역량과 분명히 이어지고 어떻게 쓸지까지 말한다', 3: '직무와 관련된 경험이지만 어떤 역량을 증명하는지 설명이 약하다', 1: '직무와의 연결이 없다' },
    basis: 'A', refs: ['levashina2014', 'campion1988'],
  },
  {
    key: 'logic', label: '논리성과 질문 적합성', weight: 20, group: '내용',
    looks: '질문에 직접 답하고 논리적으로 설명하는가',
    caution: '말의 길이보다 핵심 내용을 우선합니다.',
    anchors: { 5: '첫머리에 질문의 답을 말하고 근거가 순서대로 이어진다', 3: '답은 있으나 늦게 나오거나 흐름이 끊긴다', 1: '질문과 다른 이야기를 하거나 답이 없다' },
    basis: 'A', refs: ['levashina2014'],
  },
  {
    key: 'voice', label: '음성 전달력', weight: 15, group: '전달',
    looks: '목소리·속도·명료도가 이해에 적합한가',
    caution: '낮은 목소리, 억양·방언·말더듬은 감점하지 않습니다. 목소리로 자신감이나 성실성을 추정하지 않습니다.',
    basis: 'A·C', refs: ['banfi2023', 'koutsoumpis2024', 'eeoc'],
  },
  {
    key: 'nonverbal', label: '비언어적 전달력', weight: 10, group: '전달',
    looks: '시선·동작이 전달을 방해하지 않는가',
    caution: '시선 이탈을 거짓말이나 부정행위로, 움직임을 불안이나 부적합으로 해석하지 않습니다. 표정(웃는 횟수 등)은 점수에 넣지 않습니다.',
    basis: 'A·C', refs: ['banfi2023', 'basch2025', 'shinya2024'],
  },
  {
    key: 'env', label: '영상 환경', weight: 5, group: '전달',
    looks: '얼굴·음성·화면이 안정적으로 전달되는가',
    caution: '환경 문제와 지원자 역량을 분리합니다.',
    basis: 'B·C', refs: ['hirevue'],
  },
];

export const BASIS = {
  A: '학술연구·메타분석·검증된 면접평가 연구',
  B: '대학 커리어센터·공공기관·AI면접 운영사 공식 가이드',
  C: '코치의 경험적 관찰, 자체 개발한 개선 지침(추후 검증 필요)',
};

export const REFS = {
  levashina2014: { grade: 'A', cite: 'Levashina et al. (2014). The Structured Employment Interview. Personnel Psychology.', url: 'https://doi.org/10.1111/peps.12052', use: '답변별 평정척도, 구조화 질문, 꼬리질문' },
  campion1988: { grade: 'A', cite: 'Campion et al. (1988). Structured interviewing. Personnel Psychology.', url: 'https://doi.org/10.1111/j.1744-6570.1988.tb00630.x', use: '행동기준 평정척도(BARS), 직무 관련 질문' },
  star: { grade: 'B', cite: 'Princeton, University of Washington 커리어센터 STAR 가이드', url: 'https://careerdevelopment.princeton.edu/interview-guide/types-interview-questions/behavioral-or-situational', use: '상황·과제·행동·결과의 구체성, 본인 행동과 성과에 초점' },
  banfi2023: { grade: 'A', cite: 'Banfi & Martín-Raugh (2023). Speaking without words: 비언어 단서 메타분석. Journal of Organizational Behavior.', url: 'https://doi.org/10.1002/job.2670', use: '시선·머리 움직임 등이 면접 평가와 관련(직무수행 예측을 뜻하지는 않음)' },
  basch2025: { grade: 'A', cite: 'Basch & Melchers (2025). Eye contact in video interviews. Journal of Business and Psychology.', url: 'https://doi.org/10.1007/s10869-024-09981-4', use: '좌우(수평) 시선 이탈은 인상에 부정적, 위아래(수직) 이탈은 유의한 영향 없음' },
  shinya2024: { grade: 'A', cite: 'Shinya et al. (2024). Scientific Reports.', url: 'https://doi.org/10.1038/s41598-024-60371-5', use: '카메라 밖 시선이 모의 온라인 면접 평가에 미치는 영향' },
  koutsoumpis2024: { grade: 'A', cite: 'Koutsoumpis et al. (2024). Computers in Human Behavior.', url: 'https://doi.org/10.1016/j.chb.2023.108128', use: '언어적 특징이 표정·음성 특징보다 중요, 알고리즘 편향 주의' },
  eeoc: { grade: 'B', cite: '미국 평등고용기회위원회(EEOC) AI 채용도구 안내', url: 'https://www.eeoc.gov/', use: '말더듬 등 음성 특성을 쓰는 자동평가의 불공정 위험' },
  hirevue: { grade: 'B', cite: 'HireVue 공식 AI 평가 설명자료', url: 'https://www.hirevue.com/platform/our-science', use: '표정·몸짓·목소리 톤을 채점하지 않고 답변 내용을 분석. AI면접마다 평가방식이 다름' },
  nist: { grade: 'A', cite: 'NIST AI Risk Management Framework (2023)', url: 'https://doi.org/10.6028/NIST.AI.100-1', use: '공정성, 정확성, 평가결과의 설명 가능성' },
};

export const NOTICE = '이 평가표는 면접 연습을 위한 자체 평가도구입니다. 과학적으로 타당성이 검증된 채용 선발 척도가 아니며, 특정 AI면접 기업의 공식 채점표도 아닙니다. 가중치는 임시 제안값입니다. 장애, 언어적 특성, 비언어적 차이를 이유로 낮게 평가하지 않습니다.';

const clamp = n => Math.max(1, Math.min(5, Math.round(n)));

// 가중 총점(100점 만점). 측정하지 못한 항목(null)은 빼고 남은 항목의 가중치로 다시 나눈다.
export function totalScore(scores) {
  let sum = 0;
  let w = 0;
  const missing = [];
  for (const r of RUBRIC) {
    const v = scores[r.key];
    if (v == null) { missing.push(r.label); continue; }
    sum += v * r.weight;
    w += r.weight;
  }
  return { total: w ? Math.round((sum / w) * 20 * 10) / 10 : null, measuredWeight: w, missing };
}

// 음성 전달력: 듣는 사람이 이해하는 데 방해가 되는지만 본다. 목소리 높낮이 자체, 답변 길이는 보지 않는다.
export function voiceScore(metrics, audio) {
  if (!metrics || metrics.typed) return { score: null, reason: '글로 답해 음성 전달력은 평가하지 않습니다', tips: [] };
  let score = 5;
  const notes = [];
  const tips = [];
  if (metrics.syllables > 30) {
    notes.push(`분당 ${metrics.perMin}음절`);
    if (metrics.perMin < 170 || metrics.perMin > 460) { score -= 2; notes.push(metrics.perMin < 170 ? '속도가 많이 느려 흐름을 따라가기 어려울 수 있음' : '속도가 많이 빨라 내용을 놓칠 수 있음'); }
    else if (metrics.perMin < 200 || metrics.perMin > 420) { score -= 1; notes.push(metrics.perMin < 200 ? '속도가 조금 느림' : '속도가 조금 빠름'); }
    if (metrics.perMin > 420) tips.push('문장이 끝날 때마다 반 박자 쉬면 듣는 사람이 따라오기 쉬워요.');
  }
  const perMinFillers = metrics.fillers / Math.max(metrics.durationSec / 60, 0.5);
  if (perMinFillers > 8) { score -= 1; notes.push(`불필요한 반복 표현 ${metrics.fillers}번`); tips.push('"음", "어"가 나올 자리에서 1초 멈췄다가 말해 보세요. 군말은 전달을 흐릴 뿐 역량과는 무관합니다.'); }
  if (audio) {
    const perMinPause = audio.longPauses / Math.max(metrics.durationSec / 60, 0.5);
    if (perMinPause > 3) { score -= 2; notes.push(`2.5초 넘는 긴 침묵 ${audio.longPauses}번`); }
    else if (perMinPause > 1.5) { score -= 1; notes.push(`2.5초 넘는 긴 침묵 ${audio.longPauses}번`); }
    if (audio.longPauses >= 2) tips.push('말이 막히면 길게 멈추기보다 "다시 말씀드리면"처럼 짧게 이어 보세요.');
    if (audio.pitchVar != null && audio.pitchVar < 1.2) { score -= 1; notes.push('억양 변화가 작아 중요한 내용이 강조되지 않음'); tips.push('강조하고 싶은 낱말(숫자, 결과)을 조금 더 또렷하게 말해 보세요. 목소리가 낮은 것은 문제가 아닙니다.'); }
  }
  return { score: clamp(score), reason: notes.length ? notes.join(', ') : '속도와 명료도가 이해하기에 적당합니다', tips };
}
