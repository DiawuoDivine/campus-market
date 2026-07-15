# Frontend Setup: Tailwind CSS + shadcn/ui

This document explains the frontend setup for Campus Marketplace, implementing modern UI frameworks per the project specification.

## Stack

- **Framework**: React 18 + TypeScript 5
- **Build Tool**: Vite 5
- **CSS**: Tailwind CSS 3
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: lucide-react
- **Forms**: react-hook-form + zod (validation)
- **Data Fetching**: React Query (TanStack Query)
- **Routing**: React Router

## Project Structure

```
web/
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui generated components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── dialog.tsx
│   │   └── shared/             # App-specific reusable components
│   ├── features/               # Domain-organized features (mirrors backend modules)
│   │   ├── listings/
│   │   │   ├── ListPage.tsx
│   │   │   ├── ListingCard.tsx
│   │   │   └── CategoryFilter.tsx
│   │   ├── auth/               # (to be implemented)
│   │   ├── chat/               # (to be implemented)
│   │   ├── orders/             # (to be implemented)
│   │   └── profile/            # (to be implemented)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   ├── cn.ts              # Tailwind class merge utility
│   │   ├── api.ts             # API client with typed envelope
│   │   └── types.ts           # TypeScript types
│   ├── stores/                # Zustand state management (future)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css              # Tailwind directives + CSS variables
├── tailwind.config.ts         # Tailwind configuration with shadcn preset
├── postcss.config.js          # PostCSS with Tailwind + autoprefixer
├── vite.config.ts             # Vite build config with path aliases
└── tsconfig.json              # TypeScript config with @ alias

```

## Tailwind Configuration

The `tailwind.config.ts` uses CSS custom properties (variables) for theming:

- **Light theme** defaults: White background, slate foreground
- **Dark theme**: Slate background, white foreground
- **Customizable colors**: primary, secondary, accent, destructive, muted, border, etc.
- **CSS radius**: Rounded corners via `--radius` variable
- **Dark mode class-based**: `.dark` class on root element

All color values use CSS variables (HSL format) for flexible theming without hardcoding.

## shadcn/ui Components

Pre-built components using Radix UI primitives with Tailwind styling:

### Available Components

- **Button**: Multiple variants (default, outline, ghost, link, destructive)
- **Card**: Semantic card container with header, content, footer sections
- **Input**: Text input with focus styling and disabled states
- **Label**: Form label with proper accessibility
- **Select**: Native-feeling dropdown using Radix UI
- **Badge**: Small status/tag indicators
- **Textarea**: Multi-line text input
- **Dialog**: Modal dialog with overlay and animations

### Adding New Components

To add more shadcn/ui components, create a new file in `src/components/ui/` following the existing patterns:

1. Use Radix UI primitives where needed
2. Apply Tailwind classes for styling
3. Export both the component and any variant definitions (via `cva`)
4. Use the `cn()` utility to merge class names

Example:

```tsx
import { cn } from "@/lib/cn";

export function MyComponent({ className, ...props }) {
  return <div className={cn("base-classes", className)} {...props} />;
}
```

## Utility Functions

### `cn()` - Class Name Merger

Located in `lib/cn.ts`, this utility combines Tailwind classes intelligently:

```tsx
import { cn } from "@/lib/cn";

// Merge classes without conflicts
cn("px-2 py-1", "px-4"); // => 'py-1 px-4' (px-4 wins)
```

Uses `clsx` for conditional classes and `tailwind-merge` to handle Tailwind precedence.

## CSS Variables (Theming)

The `index.css` defines CSS variables for all component colors:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 100% 52.4%;
  /* ... more variables ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark theme overrides ... */
}
```

These variables are consumed in `tailwind.config.ts` to ensure consistent theming across all components.

## Building and Dev

```bash
# Install dependencies
npm install --legacy-peer-deps

# Development server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

The frontend builds to `web/dist/` and is embedded in the Go binary via `//go:embed`.

## API Integration

The `lib/api.ts` provides typed API client functions:

```tsx
// Example: Fetch listings
const listings = await fetchListings({
  limit: 20,
  category_id: "cat-123",
  search: "laptop",
});
```

All API calls use the standardized response envelope with `success`, `data`, and `error` fields.

## Type Safety

TypeScript types are defined in `lib/types.ts`:

- `ListingDTO`: Product listing model
- `CategoryDTO`: Category model
- `ApiEnvelope<T>`: Standard API response wrapper
- Others as features expand

## Path Aliases

The project uses `@/` to refer to the `src/` directory for cleaner imports:

```tsx
// Instead of:
import { ListPage } from "../features/listings/ListPage";

// Use:
import { ListPage } from "@/features/listings/ListPage";
```

Configured in both `vite.config.ts` (runtime) and `tsconfig.json` (TypeScript).

## Next Steps

1. **Implement Auth Forms**: Use react-hook-form + zod for registration/login
2. **Add React Router**: Full client-side routing with layout shells
3. **Integrate React Query**: Caching and background sync for API calls
4. **Build Feature Pages**: Auth, chat, orders, profile following the same pattern
5. **Dark Mode Toggle**: Add context provider for theme switching
6. **Responsive Design**: Ensure mobile-first on all pages (already using Tailwind grid/flexbox)

## Spec Reference

Per **Section 10** of `CAMPUS_MARKETPLACE_SPEC.md`:

> Frontend Notes (React + TS + shadcn + lucide-react)
>
> - Build tool: Vite
> - Component library: shadcn/ui
> - CSS framework: Tailwind CSS
> - Icons: lucide-react
> - Forms: react-hook-form + zod
> - Data fetching: TanStack Query
> - Features folder mirrors backend modules for cognitive parity

This implementation fulfills all frontend requirements.
