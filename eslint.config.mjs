import coreWebVitals from "eslint-config-next/core-web-vitals"
import typescript from "eslint-config-next/typescript"

/**
 * `npm run lint` là một trong bốn cổng của CI. Cấu hình phẳng của ESLint 9;
 * mã sinh sẵn và thư mục worker Python nằm ngoài phạm vi.
 */
const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/generated/**",
      "workers/**",
      "next-env.d.ts",
    ],
  },
  ...coreWebVitals,
  ...typescript,
]

export default config
