import { defineConfig, devices } from "@playwright/test";

// Playwright 테스트 프로세스는 Next.js dev 서버와 별도 프로세스라 .env.local을 직접 로드해야 한다.
try {
  process.loadEnvFile(".env.local");
} catch {
  // 파일이 없으면 무시 (CI 등에서는 환경변수를 직접 주입)
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
