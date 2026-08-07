import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // 防回归：重库禁止在客户端组件里静态 import（会进首屏 chunk）。
  // warn 级仅提示不阻塞 CI；服务端代码（src/lib、API route）不受限。
  {
    files: ["src/app/**/*Client*.tsx", "src/components/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "lunar-javascript",
              message: "重库需动态 import,见性能审查报告",
            },
            {
              name: "html2canvas",
              message: "重库需动态 import,见性能审查报告",
            },
            {
              name: "html-to-image",
              message: "重库需动态 import,见性能审查报告",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
