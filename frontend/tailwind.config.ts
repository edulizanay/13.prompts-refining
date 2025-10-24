import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAFA',
        primary: '#8685ef',
        'accent-light': '#faf8ff',
        'accent-dark': '#dedbee',
      },
    },
  },
  plugins: [],
};

export default config;
