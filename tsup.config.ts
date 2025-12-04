import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/main.ts'],
  clean: true,
  format: ['esm'],
  splitting: true,
  dts: true,
  treeshake: true,
  target: 'esnext',
  platform: 'node',
  /** 解决 tsup 构建 生成的 动态导入 require 方法 不存在问题 */
  banner: ({ format }) => {
    if (format === "esm") return ({
      js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
    })
    return {}
  },
})