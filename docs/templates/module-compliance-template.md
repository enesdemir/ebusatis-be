# Module Compliance Template

Use this checklist when creating or refactoring a module to ensure full
CLAUDE.md compliance. Each module must pass every item before its PR
can be merged.

## Backend checklist

### Entity layer
- [ ] Every entity extends the correct base class:
  - `BaseEntity` — platform-scoped (no tenant filter)
  - `BaseTenantEntity` — tenant-scoped (has `@Filter('tenant')`)
  - `BaseDefinitionEntity` — master data (tenant-scoped + name/code/isActive/sortOrder/scope)
- [ ] `@Index()` on every foreign key used in list queries
- [ ] Tenant-scoped unique fields use composite unique: `@Unique({ properties: ['tenant', 'code'] })`

### DTO layer (`src/modules/{name}/dto/`)
- [ ] One DTO per `@Body()` and `@Query()` parameter — **no `any`**
- [ ] All DTOs use `class-validator` decorators (`@IsString`, `@IsUUID`, etc.)
- [ ] Query DTOs extend `PaginatedQueryDto` for list endpoints
- [ ] Update DTOs use `PartialType(CreateDto)` when appropriate
- [ ] Barrel export via `dto/index.ts`

### Controller layer
- [ ] `@UseGuards(JwtAuthGuard, TenantGuard)` on tenant-scoped controllers
- [ ] `@UseGuards(JwtAuthGuard, SuperAdminGuard)` on platform-admin controllers
- [ ] Every parameter is typed with its DTO class
- [ ] `@HttpCode(HttpStatus.NO_CONTENT)` on DELETE endpoints

### Service layer
- [ ] `TenantContext.getTenantId()` check on every write method (defense in depth)
- [ ] Custom `AppException` classes for every failure path — **no hardcoded TR/EN strings**
- [ ] Error responses use `ErrorCode` enum + i18n key + optional metadata
- [ ] Uses `QueryBuilderHelper.paginate()` for list methods when applicable

### Test layer (`src/modules/{name}/tests/`)
- [ ] At least one `.service.spec.ts` per service
- [ ] Minimum test cases per CRUD service:
  - `findAll()` — applies filters, returns paginated result
  - `findOne()` — returns when found, throws custom exception when missing
  - `create()` — happy path, throws `TenantContextMissingException` without context
  - `update()` — patches fields, throws on not-found
  - `delete/remove()` — soft-deletes or removes, throws on not-found
- [ ] `BaseDefinitionService` subclasses do NOT need individual tests (generic test covers them)
- [ ] Coverage target: ≥80% branch coverage on the service file

### Module file
- [ ] All entities registered in `MikroOrmModule.forFeature([...])`
- [ ] All controllers and providers listed
- [ ] Module exports `MikroOrmModule` + relevant services

### Code quality
- [ ] All comments and JSDoc in English
- [ ] No Turkish characters in source code (except migrations/seeders)
- [ ] `pnpm exec tsc --noEmit -p tsconfig.build.json` — zero errors
- [ ] `pnpm lint` — zero errors on this module's files

---

## Frontend checklist (stage 5)

### i18n
- [ ] Locale namespace file exists: `src/lib/i18n/locales/{tr,en}/{module}.json`
- [ ] Namespace registered in `src/lib/i18n/index.ts`
- [ ] Every user-facing string uses `t('namespace:key')`
- [ ] Locale file contains: `help.what`, `help.how`, `fields.*.hint`, `empty_state.*`

### Components
- [ ] `<PageHelp>` on every page
- [ ] `<EmptyState>` for empty lists
- [ ] `<FormField>` for form inputs (raw `<input>` only for search/filter)
- [ ] `<ConfirmDialog>` for destructive actions (no `window.confirm`)
- [ ] `<StatusBadge>` for status display
- [ ] Zod validation on every form

### React Query
- [ ] Every `queryKey` includes `tenantId`
- [ ] Mutations call `queryClient.invalidateQueries()` on success

### Hooks
- [ ] Custom hooks in `src/features/{name}/hooks/`
- [ ] API calls in `src/features/{name}/api/index.ts`
- [ ] At least one unit test per custom hook

---

## Example: definitions module (pilot)

The definitions module (`src/modules/definitions/`) is the reference
implementation. Its 9 services all extend `BaseDefinitionService<T>`
and its 9 controllers all extend `BaseDefinitionController<T>`, so
they inherit CRUD, pagination, reorder and toggle-active for free.

If your module manages simple master data (name + code + isActive +
sortOrder), extend these generic classes. If it has custom business
logic, write a standalone service but follow the same patterns for
tenant context, error handling and testing.
