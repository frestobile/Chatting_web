/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [    
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",        
    ],
  theme: {
    extend: {
      backgroundImage: {
        'pattern': "url('/back-pattern.svg')",
        'homecon': "url('/image/home-cong.svg')",
      },
    },
  },
  plugins: [],
}

