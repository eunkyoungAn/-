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
  const speechRms = frames.filter((f, i) => speech[i]).map(f => f.rms).sort((a, b) => a - b);
  return {
    level: speechRms.length ? speechRms[Math.floor(speechRms.length / 2)] : 0,
    noise: floor,
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

const EYE_SIDE = ['eyeLookOutLeft', 'eyeLookOutRight', 'eyeLookInLeft', 'eyeLookInRight'];
const EYE_VERT = ['eyeLookUpLeft', 'eyeLookUpRight', 'eyeLookDownLeft', 'eyeLookDownRight'];

// 한 프레임 판단. 좌우(수평) 이탈과 위아래(수직) 이탈을 나눈다.
// 근거: 영상면접에서 수평 이탈은 인상에 부정적이지만 수직 이탈은 유의한 영향이 없었다(Basch & Melchers, 2025).
function judgeFrame(res) {
  if (!res || !res.faceLandmarks || !res.faceLandmarks.length) return { dir: 'noface' };
  const nose = res.faceLandmarks[0][1] || res.faceLandmarks[0][0];
  const out = { dir: 'look', x: nose.x, y: nose.y };
  const m = res.facialTransformationMatrixes && res.facialTransformationMatrixes[0];
  if (m && m.data) {
    // 얼굴이 향하는 방향(z축): 좌우 성분 data[8], 상하 성분 data[9]. 0.42 = sin(25도)
    if (Math.abs(m.data[8]) > 0.42) { out.dir = 'side'; return out; }
    if (Math.abs(m.data[9]) > 0.42) out.dir = 'vert';
  }
  const bs = res.faceBlendshapes && res.faceBlendshapes[0];
  if (bs && bs.categories) {
    const score = name => (bs.categories.find(c => c.categoryName === name) || {}).score || 0;
    if (EYE_SIDE.some(n => score(n) > 0.6)) out.dir = 'side';
    else if (out.dir === 'look' && EYE_VERT.some(n => score(n) > 0.6)) out.dir = 'vert';
  }
  return out;
}

export function startGaze(videoEl) {
  const frames = [];
  const luma = [];
  let timer = null;
  let stopped = false;
  let failed = false;
  let n = 0;
  const cv = document.createElement('canvas');
  cv.width = 32; cv.height = 32;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  loadGazeModel().then(lm => {
    if (stopped) return;
    timer = setInterval(() => {
      if (videoEl.readyState < 2) return;
      try { frames.push(judgeFrame(lm.detectForVideo(videoEl, performance.now()))); } catch { /* 한 프레임 실패는 무시 */ }
      if (n++ % 10 === 0 && cx) { // 2초마다 화면 밝기
        try {
          cx.drawImage(videoEl, 0, 0, 32, 32);
          const d = cx.getImageData(0, 0, 32, 32).data;
          let sum = 0;
          for (let k = 0; k < d.length; k += 4) sum += 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2];
          luma.push(sum / (d.length / 4));
        } catch { /* 무시 */ }
      }
    }, 200);
  }).catch(() => { failed = true; });
  return {
    stop() {
      stopped = true;
      clearInterval(timer);
      return failed || frames.length < 5 ? null : summarizeGaze(frames, 200, luma);
    },
  };
}

function summarizeGaze(frames, stepMs, luma = []) {
  const n = frames.length;
  const count = d => frames.filter(f => f.dir === d).length;
  const noface = count('noface');
  const seen = Math.max(1, n - noface);
  // 1초 넘게 이어진 좌우 이탈 횟수(잠깐 눈 깜빡임·생각하는 시선은 제외)
  let sideRuns = 0;
  let run = 0;
  for (const f of frames) {
    if (f.dir === 'side') run++; else { if (run * stepMs >= 1000) sideRuns++; run = 0; }
  }
  if (run * stepMs >= 1000) sideRuns++;
  // 움직임: 코 위치가 프레임 사이에 화면 너비의 3% 넘게 움직인 비율
  let moves = 0;
  let pairs = 0;
  for (let i = 1; i < n; i++) {
    const a = frames[i - 1];
    const b = frames[i];
    if (a.x == null || b.x == null) continue;
    pairs++;
    if (Math.hypot(b.x - a.x, b.y - a.y) > 0.03) moves++;
  }
  // 화면에서 벗어난 횟수(얼굴이 보이다가 1초 넘게 사라짐)
  let exits = 0;
  run = 0;
  let hadFace = false;
  for (const f of frames) {
    if (f.dir === 'noface') { run++; } else { if (hadFace && run * stepMs >= 1000) exits++; run = 0; hadFace = true; }
  }
  return {
    lookRatio: Math.round((count('look') / seen) * 100),
    sideRatio: Math.round((count('side') / seen) * 100),
    vertRatio: Math.round((count('vert') / seen) * 100),
    sideRuns,
    noFaceRatio: Math.round((noface / n) * 100),
    moveRatio: pairs ? Math.round((moves / pairs) * 100) : null,
    exits,
    brightness: luma.length ? Math.round(luma.reduce((a, b) => a + b, 0) / luma.length) : null,
  };
}

// ---------- 점수 ----------
const clamp = v => Math.max(1, Math.min(5, Math.round(v)));

// 비언어적 전달력(시선·움직임)과 영상 환경. 표정은 측정하지도 점수에 넣지도 않는다.
// 행동을 성격·정직성·역량으로 해석하지 않고, 영상에서 전달을 방해하는지만 본다.
export function scoreNonverbal({ gaze, audio }) {
  const out = { nonverbal: { score: null, reason: '' }, env: { score: null, reason: '' }, observed: [], tips: [] };

  // 영상 환경
  let env = 5;
  const envNotes = [];
  if (gaze) {
    if (gaze.noFaceRatio > 30) { env -= 2; envNotes.push(`얼굴이 화면에 안 보인 시간 ${gaze.noFaceRatio}%`); }
    else if (gaze.noFaceRatio > 10) { env -= 1; envNotes.push(`얼굴이 화면에 안 보인 시간 ${gaze.noFaceRatio}%`); }
    if (gaze.noFaceRatio > 10) out.tips.push('휴대폰을 눈높이에 세워 얼굴이 화면 가운데 오게 해 보세요.');
    if (gaze.brightness != null && gaze.brightness < 55) { env -= 1; envNotes.push('화면이 어두움'); out.tips.push('창이나 조명을 마주 보고 앉으면 얼굴이 밝게 나옵니다.'); }
    else if (gaze.brightness != null) envNotes.push('밝기 적당');
  }
  if (audio) {
    if (!audio.speechSec) { env -= 2; envNotes.push('목소리가 거의 녹음되지 않음'); out.tips.push('마이크 권한과 마이크를 가리는 케이스·손을 확인해 주세요.'); }
    else if (audio.level < 0.02) { env -= 1; envNotes.push('녹음된 목소리가 작음'); out.tips.push('목소리가 작게 녹음됐어요. 휴대폰을 조금 가까이 두거나 조용한 곳에서 녹음해 보세요. 마이크 설정이나 주변 소음 때문일 수 있습니다.'); }
    else envNotes.push('음성 녹음 양호');
    if (audio.noise > 0.03) { env -= 1; envNotes.push('주변 소음이 큼'); }
  }
  if (gaze || audio) { out.env.score = clamp(env); out.env.reason = envNotes.join(', '); }
  else out.env.reason = '영상 환경을 측정하지 못했습니다';

  // 비언어적 전달력
  if (!gaze) { out.nonverbal.reason = '이 기기에서는 시선·움직임을 측정하지 못했습니다'; return out; }
  if (gaze.noFaceRatio > 70) {
    out.nonverbal.reason = '얼굴이 화면에 거의 보이지 않아 시선·움직임을 측정하지 못했습니다(영상 환경 문제로 보고 감점하지 않습니다)';
    return out;
  }
  const side = gaze.sideRatio;
  let nv = side < 10 ? 5 : side < 20 ? 4 : side < 35 ? 3 : side < 50 ? 2 : 1;
  const notes = [`정면 ${gaze.lookRatio}%, 좌우 이탈 ${side}%(1초 넘게 ${gaze.sideRuns}번), 위아래 ${gaze.vertRatio}%`];
  out.observed.push(`시선: 카메라 쪽 ${gaze.lookRatio}%, 좌우 ${side}%, 위아래 ${gaze.vertRatio}%`);
  if (side >= 20) out.tips.push('답변 중 시선이 화면 옆쪽으로 자주 이동합니다. 영상면접에서 전달력이 떨어질 수 있으니 카메라 위치와 시선 처리를 점검해 보세요. 메모나 다른 화면을 옆에 두었다면 카메라 가까이로 옮겨 보세요.');
  if (gaze.vertRatio >= 30) out.tips.push('위아래로 향한 시선은 감점하지 않았어요. 화면 속 질문을 읽거나 생각할 때 자연스러운 움직임입니다.');
  if (gaze.moveRatio != null) {
    out.observed.push(`움직임: 큰 움직임 비율 ${gaze.moveRatio}%, 화면 밖으로 나간 횟수 ${gaze.exits}번`);
    if (gaze.moveRatio > 25 || gaze.exits >= 2) {
      nv -= 1;
      notes.push('반복적인 움직임이 시청을 방해할 수 있음');
      out.tips.push('답변 중 반복적인 움직임이 시선을 분산시킬 수 있습니다. 움직임을 억지로 참기보다, 내용을 강조하는 동작과 무의식적인 반복 동작을 구분해 연습해 보세요.');
    }
  }
  out.nonverbal.score = clamp(nv);
  out.nonverbal.reason = notes.join(', ');
  return out;
}

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
