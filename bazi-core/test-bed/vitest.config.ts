import { defineConfig } from 'vitest/config';

// 冒烟专用配置：只跑 test-bed，超时放宽到 15 分钟（真 API 调用）。
// 用法见 test-bed/smoke.test.ts 顶部注释。
export default defineConfig({
  test: {
    globals: true,
    include: ['test-bed/**/*.test.ts'],
    testTimeout: 900_000,
    hookTimeout: 900_000,
  },
});
