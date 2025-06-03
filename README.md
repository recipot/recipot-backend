## frame-typeorm
### 1. 로컬 환경 실행
```sh
npm install
docker-compose -f docker-compose.yml -p recipot up -d
docker network create docker-network
```
```sh
npm run start
```

### 2. NestJS + TypeORM 마이그레이션 적용
1. src/database/migrations 폴더에 새로운 마이그레이션 파일을 생성합니다.
```sh
npm run migration:create
```
2. 생성된 마이그레이션 파일을 열어 up과 down 메서드를 정의합니다. 
3. 마이그레이션 파일을 적용합니다.
```sh
npm run migration:run
```

### 3. EsLint 자동 적용
```sh
npm run lint
```

### 4. 개발환경 (dev) 시크릿 env 값 세팅
1. 시크릿 오픈소스 Infisical 설치
```sh
brew install infisical/get-cli/infisical
```
2. token으로 로그인
```sh
infisical login
```
3. 현재 로컬 프로젝트를 Infisical 프로젝트와 연결
```sh
infisical init
```

### 5. 도커 이미지
docker build --platform=linux/amd64 -t recipot-api:1.01 .
