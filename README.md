# 🎲 Fair Catan

Fair Catan is a 2d6 bag-based dice roller designed to reduce streaky luck in games like Catan. Instead of rolling independently every time, it draws results from a finite distribution that matches the true 2d6 probabilities (72 for example). This keeps the long-term probabilities intact while smoothing out extreme short-term variance in typical game sessions.

## Tech Stack

- Next.js 16 (Turbopack)
- React 19
- TypeScript
- Tailwind CSS
- pnpm

## Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [pnpm](https://pnpm.io/)

If you don't have pnpm installed:

```bash
npm install -g pnpm
```

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

To stop the server, press `Ctrl + C` in the terminal.

## Other Commands

```bash
pnpm build   # Production build
pnpm start   # Start production server
pnpm lint    # Run linter
```
