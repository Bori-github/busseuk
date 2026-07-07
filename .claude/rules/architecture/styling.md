---
paths:
  - 'apps/web/src/**/*.{ts,tsx,css}'
---

# 스타일링 — Tailwind CSS v4

## 설정 방식

Tailwind **v4**를 `@tailwindcss/vite` 플러그인으로 쓴다. **`tailwind.config.js`가 없다.**

- 진입: `app/index.css`의 `@import "tailwindcss";`
- 커스터마이즈(테마 토큰 등)가 필요하면 config 파일이 아니라 CSS의 `@theme` 블록에 둔다.
- JS config 파일을 새로 만들지 않는다 (v4 방식 유지).

## 클래스 조합

- 조건부·병합 클래스는 `shared/lib/cn.ts`(clsx + tailwind-merge)로 합친다. 문자열
  템플릿 직접 결합 대신 `cn(...)`을 쓴다.
- 변형(variant)이 많은 컴포넌트는 `class-variance-authority(cva)`로 정의한다.

```tsx
import { cn } from '@shared/lib';

<button className={cn('px-3 py-2', isActive && 'bg-blue-500')} />;
```

## 원칙

- 스타일은 **유틸리티 클래스 우선**. 별도 CSS 파일·CSS-in-JS를 늘리지 않는다.
- 재사용 UI는 `shared/ui`에 두고, 도메인 색이 없는 프리미티브로 유지한다.
- 아이콘은 `shared/icons`의 SVG를 `vite-plugin-svgr`로 컴포넌트화해 쓴다.
