# Contributing to Dump

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork and clone the repo
2. Copy `.env.example` to `.env.local` and fill in the required values
3. Install dependencies: `bun install`
4. Start the Convex dev server: `bun run deploy:convex:dev`
5. Start the Next.js dev server: `bun run dev`

## Making Changes

1. Create a feature branch from `main`
2. Make your changes
3. Run linting: `bun run lint`
4. Run tests: `bun run test`
5. Commit your changes with a clear message
6. Open a pull request against `main`

## Code Style

- TypeScript throughout — avoid `any` types
- Use TailwindCSS for styling
- Follow existing patterns in the codebase
- Keep components small and focused

## Reporting Issues

Open an issue on GitHub with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
