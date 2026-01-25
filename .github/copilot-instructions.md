# PXI-OS Copilot Instructions

## Architecture Overview
PXI-OS is an AI-native enterprise operating system built with:
- **Frontend**: React 19 + TypeScript + Vite, deployed as PWA with offline support
- **Backend**: Supabase (PostgreSQL) with real-time subscriptions and Row Level Security
- **AI**: Google Gemini integration for market price grounding and agentic automation
- **State**: Zustand stores (auth, data, settings) with optimistic updates
- **Routing**: HashRouter with protected routes using role-based permissions

## Key Patterns & Conventions

### Data Flow & Sync
- Use `useDataStore` for CRUD operations with automatic Supabase sync
- Implement optimistic updates in components, handle conflicts in store
- Subscribe to real-time updates via `subscribeToRealtimeUpdates()` in useEffect
- Manual sync: `useDataStore.getState().syncWithCloud()` or `hydrateFromCloud()` for pulling data
- Example: `useDataStore.getState().hydrateFromCloud();` in component mount

### Authentication & Permissions
- Check `user.role` (enum from `types.ts`) and `user.permissionTags` array
- Use `ProtectedRoute` component with `allowedRoles` and `requiredPermission`
- Super admins bypass all checks: `if (user.isSuperAdmin) return <>{children}</>`
- Permission tags example: `requiredPermission="access:finance"`
- Role enum includes: SUPER_ADMIN, CEO, ADMIN, MANAGER, etc. (see `types.ts`)

### AI Integration
- Import from `@google/generative-ai`, use `getAIInstance()` helper
- Ground prices with `bulkGroundIngredientPrices()` for market data on ingredients
- Get live prices for recipes: `getLiveRecipeIngredientPrices(recipe)`
- Agent modes: `AIAgentMode.HUMAN_FIRST`, `AI_AGENTIC`, `HYBRID`
- Check `strictMode` from settings store before AI operations
- AI key: `VITE_GEMINI_API_KEY` in environment

### Component Structure
- Modular components in `/src/components/`, one per major feature (e.g., Inventory, Catering, HR)
- Use Tailwind CSS with custom `--brand-primary` CSS variable
- Error boundaries and loading states with consistent UI patterns
- Example: `<Loader2 size={24} className="animate-spin" />` for loading
- PWA components: `PWAInstallPrompt`, `AppUpdateNotification`

### Database Schema
- Tables use `company_id` or `organization_id` (check `syncTableToCloud` for mapping)
- RLS policies enforce data isolation between companies
- Use SQL scripts in `/src/services/` for schema fixes and migrations
- Some tables: organization_id for reusable_items, ingredients, products, etc.; company_id for others
- syncTableToCloud handles camelCase to snake_case mapping (e.g., companyId -> company_id)

## Developer Workflows

### Environment Setup
- Copy `.env.example` to `.env.local` with Supabase and Gemini keys
- Run `npm install` then `npm run dev` (Vite on port 3000)
- For database issues, run `node check_rls.js` or `bash SYNC_REPO.sh`

### Testing & Validation
- Use `npm run test` (Vitest) for unit tests
- Validate with `npm run build` to check for TypeScript errors
- Check database health with `checkCloudHealth()` from supabase service

### Common Fixes
- Permission errors: Run `node fix_rls.sql` or check user `permissionTags`
- Sync issues: Call `useDataStore.getState().hydrateFromCloud()`
- AI failures: Verify `VITE_GEMINI_API_KEY` in environment
- Repo issues: Run `SYNC_REPO.bat` (Windows) or `bash SYNC_REPO.sh` (Mac/Linux)

## Code Examples

### Adding a New Feature Component
```tsx
// In App.tsx routes
<Route path="/new-feature" element={
  <ProtectedRoute user={user} requiredPermission="access:new_feature">
    <NewFeature />
  </ProtectedRoute>
} />

// In component
const { data, updateData } = useDataStore();
useEffect(() => {
  useDataStore.getState().hydrateFromCloud();
}, []);
```

### Database Query with RLS
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('company_id', user.companyId);
```

### AI-Powered Operation
```typescript
if (!useSettingsStore.getState().strictMode) {
  const ai = getAIInstance();
  // Use Gemini for analysis
}
```

### Syncing Data
```typescript
// Optimistic update
updateData(item);
// Then sync
useDataStore.getState().syncWithCloud();
```

Reference: `src/types.ts` for interfaces, `src/services/supabase.ts` for DB patterns, `src/services/ai.ts` for AI integration.