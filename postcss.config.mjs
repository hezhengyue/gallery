// postcss.config.mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},  // 👈 v4 用这个包
    autoprefixer: {},
  },
}
export default config