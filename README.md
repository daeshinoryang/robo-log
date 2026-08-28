# ROBO-LOG: 물류센터 로봇 관제실

이진법 부품 추적과 비둘기집 원리 기반 충전 정책 비교를 직접 조작하는 한국어 교육 시뮬레이터입니다.

## 로컬 실행

Node.js 22 이상과 pnpm이 필요합니다.

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## GitHub Pages 배포

1. 이 폴더를 GitHub 저장소의 `main` 브랜치에 올립니다.
2. 저장소 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택합니다.
3. Actions의 `Deploy to GitHub Pages` 작업이 끝나면 Pages 주소가 생성됩니다.

프로젝트 저장소(`사용자명/저장소명`)와 사용자 사이트 저장소(`사용자명.github.io`)의 경로를 배포 작업이 자동으로 구분합니다.

