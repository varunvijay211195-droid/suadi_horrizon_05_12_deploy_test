---
trigger: always_on
---

# Next.js Admin Panel — Systematic Workflow Rules
> A structured blueprint to translate business requirements into clean, scalable, and premium Next.js admin screens.
> **Use this process for EVERY new admin feature in the Saudi Horizon project.**
---
## STEP 1 — Define the Domain Model (Data First)
**Never start with UI.**
### 1.1 Identify the Entity
- List every field with its TypeScript type.
- Mark required vs optional fields.
- Define default values.
### 1.2 Define Relationships
- Belongs to (foreign key / parent).
- Has many (child collections).
- Many-to-many.
### 1.3 Create the TypeScript Interface & Schema
```typescript
// src/types/feature.ts
export interface Feature {
    _id: string;
    name: string;
    isActive: boolean;
    createdAt: string; // ISO Date string
    updatedAt: string;
}
// src/models/Feature.ts (Mongoose)
const FeatureSchema = new mongoose.Schema({
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
STEP 2 — Define Use Cases (User Actions)
List ALL possible user actions. These become Handler functions.

View Table/List
Search / Filter / Sort
Pagination
Create New Item (via Modal or Page)
Update Existing Item
Delete Item (with confirmation)
Toggle Status (Instant UI update)
Export Data (CSV/PDF)
STEP 3 — Define Screen States (Critical)
UI = Function(State). Every screen must handle these explicitly.

Required States
LOADING: Initial fetch or action in progress.
EMPTY: Data found is empty.
SUCCESS: List has content or action completed.
ERROR: API error or validation failure.
MODAL_OPEN: (Create/Edit/Delete) state.
State Type Pattern
typescript
type FeatureState = 
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: Feature[] };
STEP 4 — Define Layout Skeleton (Structure Only)
Describe layout hierarchy using React components.

jsx
<AdminLayout>
  <AdminHeader
    title="Feature Management"
    actions={<Button onClick={onAdd}>Add New</Button>}
  />
  <div className="admin-container">
    <section className="filter-bar">
      <SearchInput />
      <FilterGroup />
    </section>
    <main className="content">
      <DataTable data={state.data} />
    </main>
  </div>
</AdminLayout>
STEP 5 — Define Component Specifications
Describe every reusable component before implementation.

DataTable / DataGrid
Columns: (ID, Thumbnail, Primary Title, Badge Status, Creation Date, Actions).
Interactions: Hover styles, density toggle.
Form Dialog (Modal)
Inputs: TextField, Select, Switch, ImageUpload.
Buttons: Cancel (Silver) | Save (Gold).
Feedback Components
SkeletonLoader: Pulsing table rows.
EmptyPlaceholder: Premium SVG icon + "Start by adding X" message.
STEP 6 — Define Event Flow (Behavior Map)
Map every user interaction to a state transition.

text
Add Button Click    →  setModal('create')
Form Submit         →  status: 'loading' → API Call → Success Toast → Close Modal → Revalidate
Delete Click        →  setModal('delete', item)
Confirm Delete      →  API Delete → Optimistic UI Update → Revalidate on Error
Search Input        →  Debounce (300ms) → URL SearchParam Update → API Refetch
STEP 7 — Define "ViewModel" (Store/Hook) Contract
In React, the "ViewModel" is usually a Custom Hook or a Context Provider.

State Ownership Rules
State	Owner
Domain Data	Hook (SWR / React-Query / Local State)
Loading / Action States	Hook
Modal Visibility	Local Page State
Form Values	react-hook-form
Custom Hook Structure
typescript
// src/hooks/useFeatureAdmin.ts
export function useFeatureAdmin() {
    const [state, setState] = useState<FeatureState>({ status: 'loading' });
    
    async function fetchAll() { /* ... */ }
    async function create(data: Partial<Feature>) { /* ... */ }
    async function remove(id: string) { /* ... */ }
    
    return { state, create, remove, refresh: fetchAll };
}
STEP 8 — Connect UI to State
jsx
const { state, refresh } = useFeatureAdmin();
return (
  <>
    {state.status === 'loading' && <LoadingTableRows />}
    {state.status === 'empty' && <EmptyUI onAdd={openAdd} />}
    {state.status === 'success' && <DataTable data={state.data} />}
    {state.status === 'error' && <ErrorAlert message={state.message} onRetry={refresh} />}
  </>
);
STEP 9 — Repository Layer (API Services)
Separate API calls from UI logic.

typescript
// src/lib/api/admin/features.ts
export const featureApi = {
    getAll: () => axios.get('/api/admin/features'),
    getOne: (id: string) => axios.get(`/api/admin/features/${id}`),
    create: (data: any) => axios.post('/api/admin/features', data),
    delete: (id: string) => axios.delete(`/api/admin/features/${id}`),
};
STEP 10 — Define Validation Rules
Validation occurs in:

Client-side: Zod schema with react-hook-form.
Server-side: API Route validation (Mongoose or Zod).
typescript
const FeatureSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 chars"),
  price: z.number().positive("Price must be positive"),
});
STEP 11 — Final Pre-Implementation Checklist
Complete every item before writing production code.

 Types Defined: Interfaces created in @types.
 Mongoose Schema: Updated or created.
 API Routes: Documented endpoints (GET, POST, PATCH, DELETE).
 Sealed States: Model states handled (Loading, Success, Empty, Error).
 Component Specs: List of UI atoms needed (shadcn/ui or custom).
 Premium Check: Hover effects, smooth transitions, HSL colors.
 Edge Cases: No network, slow upload, large data handling.
CRITICAL: Do NOT begin implementation until Step 11 is fully checked.