<div align="center">

# 🍳 Recipot Backend

### *NestJS 기반 레시피 공유 플랫폼 백엔드 API*

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)

</div>


## 💻 기술 스택

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)

![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

![Infisical](https://img.shields.io/badge/Infisical-000000?style=for-the-badge&logo=infisical&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)

</div>

<details>
<summary>📋 상세 기술 스펙</summary>

| 카테고리 | 기술 | 버전 |
|---------|------|------|
| **Framework** | NestJS | 10.x |
| **Language** | TypeScript | 5.x |
| **Database** | MariaDB | 10.8.2 |
| **ORM** | TypeORM | 0.3.x |
| **Cache** | Redis | 7.2.4 |
| **Authentication** | JWT + Passport | - |
| **Container** | Docker Compose | - |

</details>

## 🚀 빠른 시작

### 📋 사전 요구사항
- Node.js 18.0.0 이상
- Docker & Docker Compose
- Infisical CLI (환경변수 관리용)

### 🔧 로컬 사전 작업

#### 1. Infisical 설치
```bash
# macOS (Homebrew)
brew install infisical/infisical/infisical

# 또는 다른 설치 방법은 https://infisical.com/docs 참조
```

#### 2. Infisical 로그인
```bash
# 웹 브라우저를 통한 로그인
infisical login

# 또는 서비스 토큰 사용 (CI/CD 환경)
export INFISICAL_TOKEN=your-service-token
```

### 🎯 개발 환경 실행

```bash
# 1. 의존성 설치
npm install

# 2. Docker 컨테이너 실행 (DB, Redis)
docker-compose -f docker-compose.dev.yml up -d
docker network create docker-network

# 3. 개발 서버 실행 (자동으로 infisical에서 환경변수 동기화)
npm run start:dev

# 수동으로 환경변수 동기화만 하고 싶은 경우
npm run env:sync
```

### ⚠️ 중요 안내
- `.env.development` 파일은 Git에 포함되지 않습니다
- `npm run env:sync` 명령어로 개별적으로 환경변수를 동기화해야 합니다
- infisical 로그인이 필요합니다: `infisical login`

### 🔄 동작 방식
- `npm run start:dev` 실행 시 자동으로 infisical dev 환경의 환경변수를 `.env.development` 파일로 동기화
- 그 후 `.env.development` 파일을 사용하여 애플리케이션 실행

## 📁 프로젝트 구조

```
📦 src/
├── 🌐 api/             # 도메인별 API 모듈
│   ├── 👤 user/        # 사용자 관리
│   ├── 📋 board/       # 게시판
│   └── 🔐 login/       # 인증
├── 🔧 common/          # 공통 유틸리티
├── 🗄️ database/        # 엔티티, 마이그레이션
└── ⚙️ config/          # 설정 관리
```

## 🛠️ 주요 명령어

<table>
<tr>
<td width="50%">

### 🔨 개발
```bash
npm run start:dev     # 개발 서버 (환경변수 자동 동기화 + watch)
npm run start:debug   # 디버그 모드 (infisical 직접 사용)
npm run start         # 일반 실행 (infisical 직접 사용)
npm run build         # 빌드
npm run env:sync      # 환경변수 수동 동기화 (dev 환경)
npm run lint          # 코드 검사
```

</td>
<td width="50%">

### 🧪 테스트
```bash
npm test              # 단위 테스트
npm run test:e2e      # E2E 테스트
npm run test:cov      # 커버리지
npm run test:watch    # 테스트 watch
```

</td>
</tr>
<tr>
<td width="50%">

### 🗄️ 데이터베이스
```bash
npm run migration:run       # 마이그레이션 실행 (infisical 직접 사용)
npm run migration:revert    # 마이그레이션 되돌리기 (infisical 직접 사용)
npm run migration:generate  # 마이그레이션 생성 (infisical 직접 사용)
npm run migration:create    # 새 마이그레이션 생성
npm run migration:show      # 마이그레이션 상태 확인 (infisical 직접 사용)
```

</td>
</tr>
</table>

## 🌐 API 문서

<div align="left">

| 서비스 | URL | 설명 |
|--------|-----|------|
| 📖 **Swagger UI** | http://3.34.40.123/api/document | API 문서 |
| 💚 **Health Check** | http://3.34.40.123/health | 상태 확인 |

</div>

## 👥 기여자 

<div align="center">

<a href="https://github.com/recipot/recipot-backend/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=recipot/recipot-backend" />
</a>

</div>

<div align="center">

### 📚 더 많은 정보

[![Notion](https://img.shields.io/badge/Notion-BE%20문서-000000?style=for-the-badge&logo=notion&logoColor=white)](https://www.notion.so/BE-1a24ef5609948036a98ffd9c066dede9)

</div>
