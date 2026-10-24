---
language: ko
license: [확인 필요]
tags: [careercatcher, todo, python, flask, 비개발자]
service_type: 데스크톱·웹 앱 (콘솔/Flask/EXE/설치 프로그램)
ai_used: 아니오
demo: [확인 필요 — 설치 파일 배포 위치]
---

# Card: Career Todo (저장소: node-test)

## 1. Details
- **설명**: 커리어 목표와 할 일을 관리하는 초보자용 Todo 앱. "비개발자도 GitHub 프로젝트를 만들어 배포할 수 있다"는 것을 보여 주는 사례
- **형태**: 콘솔(`career_todo.py`), 웹(`app.py`, Flask), EXE(PyInstaller), 설치 프로그램(NSIS)
- **저장소**: eunkyoungAn/node-test → 이름을 `career-todo`로 바꾸기를 권장

## 2. Uses
### 의도한 사용
- 구직 활동 할 일 관리(추가·조회·수정·삭제, 완료 표시, 필터, 진행률)
### 응용 사용
- 비개발자 대상 GitHub·Python 입문 강의 예제
### 쓰면 안 되는 경우
- 여러 사람이 함께 쓰거나 민감한 정보를 저장하는 용도(로컬 JSON 저장)

## 3. Bias, Risks, and Limitations
- 데이터를 로컬 JSON 파일로만 저장한다. 동기화·백업 기능이 없다.
- 학습용 프로젝트라 보안·다중 사용자는 고려하지 않았다.

## 4. How to Get Started
- 콘솔: `python career_todo.py` / 웹: `python app.py` / Windows: `run_career_todo.bat` 또는 설치 프로그램

## 5. Data
- 커리어캐쳐 기반 샘플 Todo를 자동으로 만든다. 사용자 데이터는 로컬 JSON에 저장한다.

## 6. Evaluation
- [확인 필요 — 테스트 기록 없음]

## 7. Technical Specifications
- Python, Flask, Bootstrap, PyInstaller, NSIS, Pillow(아이콘 생성)
- 학습 예정: Tkinter/PyQt GUI, SQLite

## 8. Citation / Contact
- 커리어캐쳐(CareerCatcher) · dms5147@gmail.com
