import { defineConfig } from 'drizzle-kit'
import { resolve } from 'path'

export default defineConfig({
  schema: './src/platform/database/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: resolve(process.cwd(), 'data/campus-market.sqlite'),
  },
  verbose: true,
  strict: true,
})
