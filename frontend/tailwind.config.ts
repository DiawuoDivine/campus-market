import type { Config } from 'tailwindcss'

const config = {
    darkMode: ['class'],
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            colors: {
                border: '#e2bfb9',
                input: '#8e706c',
                ring: '#570000',
                background: '#fcf9f8',
                foreground: '#1c1b1b',
                primary: {
                    DEFAULT: '#570000',
                    foreground: '#ffffff',
                },
                secondary: {
                    DEFAULT: '#705d00',
                    foreground: '#ffffff',
                },
                destructive: {
                    DEFAULT: '#ba1a1a',
                    foreground: '#ffffff',
                },
                muted: {
                    DEFAULT: '#f0eded',
                    foreground: '#5a413d',
                },
                accent: {
                    DEFAULT: '#fcd400',
                    foreground: '#6e5c00',
                },
                popover: {
                    DEFAULT: '#ffffff',
                    foreground: '#1c1b1b',
                },
                card: {
                    DEFAULT: '#ffffff',
                    foreground: '#1c1b1b',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            fontFamily: {
                sans: ['Source Sans 3', 'sans-serif'],
                serif: ['Source Serif 4', 'serif'],
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
} satisfies Config

export default config
