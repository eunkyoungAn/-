# MediaPipe (자체 호스팅)

영상 모드의 시선 분석에 쓰는 Google MediaPipe Tasks Vision 파일입니다. 외부 CDN 없이 이 사이트에서 직접 불러옵니다.

- `vision_bundle.mjs`, `vision_wasm_internal.js`, `vision_wasm_internal.wasm`: npm `@mediapipe/tasks-vision@1.1.1` (Apache-2.0)
- `face_landmarker.task`: MediaPipe Face Landmarker 모델 float16 v1 (Apache-2.0)
  출처: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

SIMD를 지원하는 브라우저(아이폰 iOS 16.4 이상, 최신 Chrome)용 파일만 넣었습니다. 지원하지 않으면 시선 분석만 빠지고 녹화와 나머지 분석은 그대로 동작합니다.
