# 커리어캐쳐 · GitHub Pages 배포용

Gemini API를 이용해 기업 분석과 경험 기반 자기소개서 초안을 만드는 웹앱입니다.
기존 Netlify 사이트와 일치하는 배포 파일 및 원본 소스를 확인하여 2026-10-06에 정리했습니다.
설치나 빌드 없이 저장소에 올려 배포할 수 있습니다.

## 가장 쉬운 배포 방법

1. 이 ZIP을 컴퓨터에서 압축 해제합니다.
2. GitHub에서 새 저장소를 만듭니다. 저장소 이름 예: `career-catcher`.
3. 저장소의 **Add file → Upload files**에서 압축을 푼 폴더의 **내용물**을 올립니다.
   `index.html`, `app.js`, `app.css`가 저장소 첫 화면에 보여야 합니다.
   ZIP 파일 자체나 바깥 폴더만 업로드하면 웹페이지가 열리지 않습니다.
   `source` 폴더는 수정용 소스이므로 배포만 할 경우 생략해도 됩니다.
4. **Commit changes**로 저장합니다.
5. **Settings → Pages → Build and deployment → Source: Deploy from a branch**를 선택합니다.
6. **Branch: main / 폴더: /(root)**를 선택하고 **Save**를 누릅니다.
7. 배포 완료 후 Pages 화면에 표시되는 주소를 엽니다.
   일반적인 주소: `https://깃허브아이디.github.io/career-catcher/`.

공식 안내: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 파일 구성

- `index.html`, `app.js`, `app.css`: 바로 배포하는 완성 파일
- `manifest.webmanifest`, `sw.js`, 아이콘 2개: 휴대폰 홈 화면 추가 관련 파일
- `.nojekyll`: 정적 파일 배포 설정
- `source/`: 수정 가능한 React/TypeScript 코드, 프롬프트, 기존 자동화 테스트
- `PROVENANCE.md`: 원본 확인 및 변경 내역

## 사용 방법

본인의 Gemini API 키를 입력하고 시작하거나, ‘API 키 없이 먼저 입력하기’를 눌러 입력 화면을 엽니다.
기업리스트와 경험 노트를 입력한 뒤 생성할 항목을 선택합니다.
모델 목록 확인 또는 모델 이름 직접 입력 기능을 사용할 수 있습니다.
AI 생성은 인터넷 연결과 유효한 사용자 API 키가 필요합니다.
API 키는 접속 중 메모리에서 사용하며 작업 저장 파일에는 넣지 않습니다.
기기 간 작업 이동에는 ‘작업 저장’과 ‘작업 불러오기’를 사용합니다.
호스팅 주소가 바뀌면 기존 Netlify 사이트의 브라우저 저장 내용은 자동으로 이전되지 않습니다.
기존 사이트에서 작업 저장 후 새 사이트에서 불러오세요.

## 소스 수정 후 다시 배포

Node.js 22.13 이상과 pnpm을 준비한 뒤 `source` 폴더에서 실행합니다.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm preview
```

미리보기 주소는 `http://127.0.0.1:3000/`입니다.
`source/dist`에 생성된 파일을 저장소 루트의 같은 이름 파일에 덮어쓰고 커밋하면 갱신됩니다.
소스만 수정한 경우 루트의 배포 파일은 자동으로 바뀌지 않습니다.

## 확인 범위

배포 파일의 경로, manifest, service worker, JavaScript 문법과 기존 자동화 테스트를 확인했습니다.
실제 Gemini API 생성은 개인 API 키로 별도 확인해야 합니다.
GitHub 업로드 및 공개 배포는 사용자가 위 절차에 따라 진행합니다.
