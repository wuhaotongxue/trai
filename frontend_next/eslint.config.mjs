import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // TRAI 项目前端强制中文规范
  // JSX 中禁止出现英文字符串字面量（用户可见文本必须是中文）
  {
    rules: {
      // react/jsx-no-literals: 禁止 JSX 中出现英文字符串
      // 排除以大写字母开头的组件名（React 组件）和 $ 开头（变量）
      "react/no-unescaped-entities": "off",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
