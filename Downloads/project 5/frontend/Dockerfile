FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR ./

ENV NODE_OPTIONS=--max-old-space-size=4096

# npm 관련 파일 복사 → 의존성 설치
COPY package*.json ./
RUN npm install

# 앱 소스 복사
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]