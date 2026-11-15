// 휴대폰용 답변 녹음. 브라우저 실시간 받아쓰기가 휴대폰에서 자주 끊겨서, 답하는 동안은 녹음만 하고
// 답변이 끝나면 녹음을 짧은 WAV(16kHz, 모노)로 바꿔 Gemini에 받아쓰기를 맡긴다. 녹음 파일은 보관하지 않는다.

export function openMic() {
  return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
}

function pickAudioMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  return ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported(t)) || '';
}

export function canRecordAudio() {
  return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof MediaRecorder !== 'undefined');
}

// stream의 소리만 녹음한다(영상 녹화와 같은 마이크를 같이 써도 된다).
export function startAudioRecorder(stream) {
  const audioOnly = new MediaStream(stream.getAudioTracks());
  const mime = pickAudioMime();
  const rec = new MediaRecorder(audioOnly, mime ? { mimeType: mime } : undefined);
  const chunks = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  rec.start(1000);
  const build = () => new Blob(chunks, { type: (rec.mimeType || mime || 'audio/webm').split(';')[0] });
  return {
    stop() {
      return new Promise(resolve => {
        if (rec.state === 'inactive') { resolve(build()); return; }
        rec.onstop = () => resolve(build());
        try { rec.stop(); } catch { resolve(build()); }
      });
    },
  };
}

// 녹음(webm/mp4)을 16kHz 모노 16비트 WAV로 바꿔 base64로 돌려준다. 90초 녹음이 약 2.9MB.
export async function toWavBase64(blob) {
  if (!blob || !blob.size) throw new Error('녹음된 소리가 없어요.');
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  let decoded;
  try {
    const buf = await blob.arrayBuffer();
    decoded = await new Promise((res, rej) => { const p = ctx.decodeAudioData(buf, res, rej); if (p && p.then) p.then(res, rej); });
  } finally {
    try { ctx.close(); } catch { /* 무시 */ }
  }
  const RATE = 16000;
  const length = Math.max(1, Math.ceil(decoded.duration * RATE));
  const OCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const off = new OCtx(1, length, RATE);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const pcm = (await off.startRendering()).getChannelData(0);
  const view = new DataView(new ArrayBuffer(44 + pcm.length * 2));
  const str = (o, t) => { for (let i = 0; i < t.length; i++) view.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); view.setUint32(4, 36 + pcm.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, RATE, true); view.setUint32(28, RATE * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  str(36, 'data'); view.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) {
    const v = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true);
  }
  const bytes = new Uint8Array(view.buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
