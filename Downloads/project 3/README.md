# 섯다 (Seotta) - 한국 전통 카드 게임

실시간 멀티플레이어 섯다 게임입니다. FastAPI 백엔드와 React 프론트엔드를 사용하여 개발되었으며, Docker로 컨테이너화되어 있습니다.

## 기능

- 🎴 전통 한국 화투 기반 섯다 게임
- 👥 2인 실시간 멀티플레이어
- 💰 완전한 베팅 시스템 (콜, 다이, 하프, 올인)
- 🎮 실시간 WebSocket 통신
- 📱 반응형 디자인
- 🐳 Docker 컨테이너화

## 게임 규칙

섯다는 한국의 전통적인 화투 카드 게임입니다:

1. 각 플레이어는 2장의 카드를 받습니다
2. 플레이어들은 자신의 패를 보고 베팅을 합니다
3. 베팅 옵션: 콜, 다이(포기), 하프(판돈의 절반), 올인
4. 모든 베팅이 끝나면 카드를 공개합니다
5. 가장 높은 패를 가진 플레이어가 승리합니다

### 패의 등급 (높은 순서)
- **특수패**: 12땡, 14땡, 19땡, 110땡, 410땡, 46땡
- **땡**: 같은 달 카드 두 장 (12땡, 11땡, 10땡, ...)
- **끗**: 두 카드의 합을 10으로 나눈 나머지 (9끗, 8끗, ..., 1끗, 망통)

## 실행 방법

### Docker를 사용한 실행 (권장)

```bash
# 저장소 클론
git clone <repository-url>
cd seotta-game

# Docker Compose로 실행
docker-compose up --build

# 브라우저에서 접속
# 프론트엔드: http://localhost:3000
# 백엔드 API: http://localhost:8000
```

### 개발 환경에서 실행

#### 백엔드 실행
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 프론트엔드 실행
```bash
npm install
npm run dev
```

## 기술 스택

### 프론트엔드
- React 18 + TypeScript
- Vite (빌드 도구)
- Tailwind CSS (스타일링)
- Lucide React (아이콘)
- Socket.IO Client (실시간 통신)

### 백엔드
- FastAPI (Python 웹 프레임워크)
- WebSocket (실시간 통신)
- Python 3.11

### 인프라
- Docker & Docker Compose
- Nginx (프로덕션 웹 서버)

## 프로젝트 구조

```
seotta-game/
├── src/                    # React 프론트엔드
│   ├── components/         # React 컴포넌트
│   ├── types/             # TypeScript 타입 정의
│   └── utils/             # 유틸리티 함수
├── backend/               # FastAPI 백엔드
│   ├── main.py           # 메인 서버 파일
│   └── requirements.txt  # Python 의존성
├── docker-compose.yml    # Docker Compose 설정
├── Dockerfile.frontend   # 프론트엔드 Docker 설정
├── Dockerfile.backend    # 백엔드 Docker 설정
└── nginx.conf           # Nginx 설정
```

## 개발 팁

1. **개발 모드**: `npm run dev`로 프론트엔드를 실행하고, 별도 터미널에서 백엔드를 실행
2. **프로덕션**: Docker Compose를 사용하여 전체 스택을 컨테이너로 실행
3. **디버깅**: 브라우저 개발자 도구의 Network 탭에서 WebSocket 연결 상태 확인

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.