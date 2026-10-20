// 영상 모드: 카메라 녹화 + 휴대폰 안에서만 하는 비언어 분석(시선, 억양 변화, 말 빠르기·멈춤).
// 영상과 분석 결과는 어디에도 보내지 않는다. 저장은 참여자가 직접 내려받거나 공유 창으로 한다.

const VENDOR = new URL('./vendor/mediapipe/', import.meta.url).href;

// ---------- 카메라·녹화 ----------
export async function openCamera() {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
    audio: { echoCancellation: true, noiseSuppression: true },
  });
}

export function stopStream(stream) {
  if (stream) stream.getTracks().forEach(t => t.stop());
}

// 아이폰은 mp4, 최신 Chrome도 mp4를 지원하면 mp4(사진첩 호환이 좋음), 아니면 webm.
function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  const list = ['video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return list.find(t => MediaRecorder.isTypeSupported(t)) || '';
}

export function canRecord() {
  return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof MediaRecorder !== 'undefined');
}

export function startRecorder(stream) {
  const mime = pickMime();
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 1_200_000 } : undefined);
  const chunks = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  rec.start(1000);
  return {
    stop() {
      return new Promise(resolve => {
        if (rec.state === 'inactive') { resolve(build()); return; }
        rec.onstop = () => resolve(build());
        rec.stop();
      });
    },
  };
  function build() {
    const type = (rec.mimeType || mime || 'video/webm').split(';')[0];
    return { blob: new Blob(chunks, { type }), type, ext: type.includes('mp4') ? 'mp4' : 'webm' };
  }
}

// ---------- 소리 분석: 억양 변화, 멈춤 ----------
// 목소리의 높낮이 자체(성별·나이와 관련)는 점수에 쓰지 않고, 얼마나 변화하는지만 본다.
export function startAudioAnalysis(stream) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return { stop: () => null };
  const ctx = new Ctx();
  const src = ctx.createMediaStreamSource(stream);
  const an = ctx.createAnalyser();
  an.fftSize = 2048;
  src.connect(an);
  const buf = new Float32Array(an.fftSize);
  const frames = []; // {rms, f0}
  const STEP_MS = 100;
  const timer = setInterval(() => {
    an.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    frames.push({ rms, f0: rms > 0.008 ? pitch(buf, ctx.sampleRate) : 0 });
  }, STEP_MS);
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return {
    stop() {
      clearInterval(timer);
      try { src.disconnect(); ctx.close(); } catch { /* 무시 */ }
      return summarizeAudio(frames, STEP_MS);
    },
  };
}

// 자기상관으로 기본 주파수(75~400Hz)를 찾는다. 소리가 주기적이지 않으면 0.
function pitch(buf, rate) {
  const n = 1024;
  const minLag = Math.floor(rate / 400);
  const maxLag = Math.min(Math.floor(rate / 75), buf.length - n - 1);
  let energy = 0;
  for (let i = 0; i < n; i++) energy += buf[i] * buf[i];
  if (energy === 0) return 0;
  const corr = new Float32Array(maxLag + 2);
  let best = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += buf[i] * buf[i + lag];
    corr[lag] = s;
    if (s > best) best = s;
  }
  if (best / energy < 0.6) return 0;
  // 한 옥타브 아래(주기 2배)를 잘못 고르지 않도록, 최댓값의 90%를 넘는 첫 봉우리를 고른다.
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (corr[lag] >= best * 0.9 && corr[lag] >= corr[lag - 1] && corr[lag] >= corr[lag + 1]) return rate / lag;
  }
  return 0;
}

function summarizeAudio(frames, stepMs) {
  if (frames.length < 10) return null;
  const sorted = frames.map(f => f.rms).sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.2)];
  // 쉬지 않고 말한 경우 하위 20%도 말소리라서, 큰 소리(상위 10%)의 40%를 넘지 않게 상한을 둔다.
  const loud = sorted[Math.floor(sorted.length * 0.9)];
  const thr = Math.max(0.01, Math.min(floor * 3, loud * 0.4));
  const speech = frames.map(f => f.rms > thr);
  const first = speech.indexOf(true);
  const last = speech.lastIndexOf(true);
  if (first < 0) return { speechSec: 0, pitchVar: null, longPauses: 0, pauseSec: 0, voicedFrames: 0 };

  // 첫 발화부터 마지막 발화 사이의 2.5초 이상 멈춤
  let longPauses = 0;
  let pauseFrames = 0;
  let run = 0;
  for (let i = first; i <= last; i++) {
    if (!speech[i]) { run++; pauseFrames++; } else { if (run * stepMs >= 2500) longPauses++; run = 0; }
  }

  // 억양 변화: 말하는 동안의 음높이를 반음 단위로 바꿔 표준편차를 본다.
  const f0s = frames.filter((f, i) => speech[i] && f.f0 > 0).map(f => f.f0);
  let pitchVar = null;
  if (f0s.length >= 15) {
    const med = [...f0s].sort((a, b) => a - b)[Math.floor(f0s.length / 2)];
    const st = f0s.map(f => 12 * Math.log2(f / med)).filter(v => Math.abs(v) <= 12);
    const mean = st.reduce((a, b) => a + b, 0) / st.length;
    pitchVar = Math.sqrt(st.reduce((a, b) => a + (b - mean) ** 2, 0) / st.length);
  }
  return {
    speechSec: Math.round(speech.filter(Boolean).length * stepMs / 1000),
    pauseSec: Math.round(pauseFrames * stepMs / 1000),
    longPauses,
    pitchVar: pitchVar == null ? null : Math.round(pitchVar * 10) / 10,
    voicedFrames: f0s.length,
  };
}

// ---------- 시선 분석 ----------
let landmarkerPromise = null;

// 모델(약 17MB)을 처음 한 번만 불러온다. 준비 30초 동안 미리 불러 둔다.
export function loadGazeModel() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker } = await import(VENDOR + 'vision_bundle.mjs');
      const fileset = { wasmLoaderPath: VENDOR + 'vision_wasm_internal.js', wasmBinaryPath: VENDOR + 'vision_wasm_internal.wasm' };
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: VENDOR + 'face_landmarker.task', delegate: 'CPU' },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
    })().catch(err => { landmarkerPromise = null; throw err; });
  }
  return landmarkerPromise;
}

const EYE_AWAY = ['eyeLookOutLeft', 'eyeLookOutRight', 'eyeLookInLeft', 'eyeLookInRight', 'eyeLookUpLeft', 'eyeLookUpRight', 'eyeLookDownLeft', 'eyeLookDownRight'];

// 한 프레임 판단: 얼굴이 카메라 쪽을 향하고(고개 25도 이내) 눈동자가 크게 벗어나지 않으면 '응시'.
function judgeFrame(res) {
  if (!res || !res.faceLandmarks || !res.faceLandmarks.length) return 'noface';
  const m = res.facialTransformationMatrixes && res.facialTransformationMatrixes[0];
  if (m && m.data) {
    const r22 = Math.abs(m.data[10]);
    const angle = Math.acos(Math.min(1, r22)) * 180 / Math.PI;
    if (angle > 25) return 'away';
  }
  const bs = res.faceBlendshapes && res.faceBlendshapes[0];
  if (bs && bs.categories) {
    const score = name => (bs.categories.find(c => c.categoryName === name) || {}).score || 0;
    if (EYE_AWAY.some(n => score(n) > 0.6)) return 'away';
  }
  return 'look';
}

export function startGaze(videoEl) {
  const frames = [];
  let timer = null;
  let stopped = false;
  let failed = false;
  loadGazeModel().then(lm => {
    if (stopped) return;
    timer = setInterval(() => {
      if (videoEl.readyState < 2) return;
      try { frames.push(judgeFrame(lm.detectForVideo(videoEl, performance.now()))); } catch { /* 한 프레임 실패는 무시 */ }
    }, 200);
  }).catch(() => { failed = true; });
  return {
    stop() {
      stopped = true;
      clearInterval(timer);
      return failed || frames.length < 5 ? null : summarizeGaze(frames, 200);
    },
  };
}

function summarizeGaze(frames, stepMs) {
  const n = frames.length;
  const look = frames.filter(f => f === 'look').length;
  const noface = frames.filter(f => f === 'noface').length;
  // 1초 이상 이어진 이탈만 '시선 이탈'로 센다(잠깐 눈 깜빡임·생각하는 시선은 제외).
  let away = 0;
  let run = 0;
  for (const f of frames) {
    if (f !== 'look') run++; else { if (run * stepMs >= 1000) away++; run = 0; }
  }
  if (run * stepMs >= 1000) away++;
  return {
    lookRatio: Math.round((look / n) * 100),
    noFaceRatio: Math.round((noface / n) * 100),
    awayCount: away,
  };
}

// ---------- 점수 ----------
const clamp = v => Math.max(1, Math.min(5, Math.round(v)));

export function scoreNonverbal({ gaze, audio, metrics, durationSec }) {
  const out = { scores: {}, reasons: {}, tips: [] };

  if (gaze && gaze.noFaceRatio > 70) {
    out.scores.gaze = null;
    out.reasons.gaze = `얼굴이 화면에 거의 보이지 않아(${gaze.noFaceRatio}%) 시선을 측정하지 못했습니다`;
    out.tips.push('휴대폰을 눈높이에 세워 얼굴이 화면 가운데 오게 해 보세요.');
  } else if (gaze) {
    const r = gaze.lookRatio;
    out.scores.gaze = r >= 80 ? 5 : r >= 65 ? 4 : r >= 50 ? 3 : r >= 30 ? 2 : 1;
    out.reasons.gaze = `카메라를 본 시간 ${r}%, 1초 넘게 시선이 벗어난 횟수 ${gaze.awayCount}번`;
    if (gaze.noFaceRatio > 30) { out.reasons.gaze += ` (얼굴이 화면에 안 보인 시간 ${gaze.noFaceRatio}%)`; out.tips.push('휴대폰을 눈높이에 세워 얼굴이 화면 가운데 오게 해 보세요.'); }
    if (out.scores.gaze <= 3) out.tips.push('화면 속 내 얼굴 대신 카메라 렌즈를 본다고 생각하고 말해 보세요.');
  } else {
    out.scores.gaze = null;
    out.reasons.gaze = '이 기기에서는 시선을 측정하지 못했습니다';
  }

  if (audio && audio.pitchVar != null) {
    const v = audio.pitchVar;
    out.scores.tone = v < 1.2 ? 2 : v < 1.8 ? 3 : v < 2.5 ? 4 : v <= 6 ? 5 : 4;
    out.reasons.tone = v < 1.8 ? `억양 변화가 작은 편입니다(${v}반음)` : v > 6 ? `억양 변화가 큰 편입니다(${v}반음)` : `억양에 적당한 변화가 있습니다(${v}반음)`;
    if (v < 1.8) out.tips.push('강조하고 싶은 낱말(숫자, 결과)에서 목소리를 살짝 올려 보세요.');
  } else {
    out.scores.tone = null;
    out.reasons.tone = '목소리가 충분히 잡히지 않아 억양을 측정하지 못했습니다';
  }

  let tempo = 5;
  const notes = [];
  if (metrics && !metrics.typed && metrics.syllables > 30) {
    if (metrics.perMin < 170 || metrics.perMin > 460) { tempo -= 2; notes.push(metrics.perMin < 170 ? '많이 느림' : '많이 빠름'); }
    else if (metrics.perMin < 200 || metrics.perMin > 420) { tempo -= 1; notes.push(metrics.perMin < 200 ? '조금 느림' : '조금 빠름'); }
    notes.unshift(`분당 ${metrics.perMin}음절`);
  }
  if (audio) {
    const perMin = audio.longPauses / Math.max(durationSec / 60, 0.5);
    if (perMin > 3) { tempo -= 2; } else if (perMin > 1.5) { tempo -= 1; }
    notes.push(`2.5초 넘는 멈춤 ${audio.longPauses}번`);
    if (audio.longPauses >= 2) out.tips.push('말이 막히면 길게 멈추기보다 "다시 말씀드리면"처럼 짧게 이어 보세요.');
  }
  out.scores.tempo = notes.length ? clamp(tempo) : null;
  out.reasons.tempo = notes.length ? notes.join(', ') : '말 빠르기를 측정하지 못했습니다';
  return out;
}

export const NV_ITEMS = [
  { key: 'gaze', label: '시선', looks: '카메라를 바라본 시간 비율과 1초 넘는 시선 이탈 횟수' },
  { key: 'tone', label: '억양', looks: '말하는 동안 목소리 높낮이가 얼마나 변하는지(목소리 높이 자체는 보지 않음)' },
  { key: 'tempo', label: '템포', looks: '말 빠르기(분당 음절)와 2.5초 넘는 멈춤 횟수' },
];

// ---------- 저장 ----------
export async function saveVideo(video, name) {
  const file = new File([video.blob], `${name}.${video.ext}`, { type: video.type });
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // 아이폰은 공유 창의 "비디오 저장"으로 사진첩에 바로 저장된다. 그 외는 파일로 내려받는다.
  if (ios && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return 'shared'; }
    catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(video.blob);
  const a = document.createElement('a');
  a.href = url; a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'downloaded';
}
