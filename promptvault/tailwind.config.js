/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-primary': '#F5F5F7',
        'bg-surface': '#FFFFFF',
        'bg-sidebar': '#F5F5F7',
        
        // Borders
        'border-subtle': '#E5E5E5',
        'border-divider': '#E5E7EB',
        
        // Text
        'text-primary': '#1D1D1F',
        'text-secondary': '#86868B',
        'text-muted': '#9CA3AF',
        
        // Accent
        'accent-blue': '#007AFF',
        'accent-blue-hover': '#0066D6',
        
        // Traffic lights
        'traffic-red': '#FF5F57',
        'traffic-yellow': '#FEBC2E',
        'traffic-green': '#28C840',
        
        // Tags/Badges
        'badge-bg': '#F3F4F6',
        'badge-border': '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'floating': '0 8px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)',
        'sheet': '0 20px 40px -10px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
