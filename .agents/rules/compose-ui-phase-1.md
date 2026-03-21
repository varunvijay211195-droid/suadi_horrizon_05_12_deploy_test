---
trigger: always_on
---

# Android Compose Admin Panel — Systematic Workflow Rules

> A single structured blueprint to translate business requirements into a clean, scalable Jetpack Compose admin screen.
> **Use this process for EVERY new admin feature.**

---

## STEP 1 — Define the Domain Model (Data First)

**Never start with UI.**

### 1.1 Identify the Entity
- List every field with its type
- Mark required vs optional fields
- Define default values where applicable

### 1.2 Define Relationships
- Belongs to (foreign key / parent)
- Has many (child collections)
- Many-to-many (junction tables)

### 1.3 Create the Data Class

```kotlin
data class Entity(
    val id: String,
    val name: String,
    val isActive: Boolean,
    val createdAt: Long
)
```

> Do NOT proceed until the data model is clear.

---

## STEP 2 — Define Use Cases (User Actions)

List ALL possible user actions. These become ViewModel functions.

- View list
- Search / filter
- Add new item
- Edit existing item
- Delete item
- Toggle status (active/inactive)
- Refresh / reload
- Bulk actions (if applicable)

---

## STEP 3 — Define Screen States (Critical)

Every screen must define explicit states. UI = Function(State).

### Required States
- `Loading` — data is being fetched
- `Empty` — fetch succeeded but list is empty
- `Success(data)` — list has content
- `Error(message)` — fetch or action failed
- `AddDialogOpen` — creation dialog visible
- `EditDialogOpen(item)` — edit dialog visible with item

### State Model Pattern

```kotlin
sealed class FeatureUiState {
    object Loading : FeatureUiState()
    object Empty : FeatureUiState()
    data class Success(val items: List<Entity>) : FeatureUiState()
    data class Error(val message: String) : FeatureUiState()
}
```

---

## STEP 4 — Define Layout Skeleton (Structure Only)

Describe layout hierarchy without styling.

```
Scaffold
├── TopAppBar
│   └── Title + Action icons
├── Body
│   ├── SearchBar (optional)
│   ├── FilterChips (optional)
│   └── LazyColumn → ItemCard (repeated)
└── FloatingActionButton
```

```kotlin
Scaffold(
    topBar = { TopBar() },
    floatingActionButton = { AddFab() }
) { padding ->
    Column(Modifier.padding(padding)) {
        SearchBar()
        FilterChips()
        ItemList()
    }
}
```

---

## STEP 5 — Define Component Specifications

Describe every reusable component before implementing it.

### ListItem Card
- Fields to display (primary, secondary, badge)
- Interactions: click → edit, long press → delete
- Visual indicators: status, stock, priority, etc.

### Add / Edit Dialog
- All input fields with types (TextField, NumberField, Switch, Dropdown)
- Buttons: Cancel | Save
- Validation feedback inline

### Empty State
- Illustration or icon
- Message text
- CTA button (e.g. "Add First Item")

### Error State
- Error message
- Retry button

---

## STEP 6 — Define Event Flow (Behavior Map)

Map every user interaction to a state transition before writing code.

```
FAB Click            →  showAddDialog = true
Save Click           →  validate → insert → closeDialog → reload
Item Click           →  showEditDialog = true (with item)
Edit Save Click      →  validate → update → closeDialog → reload
Delete Confirm       →  delete → reload
Search Input         →  filter list in-memory or re-fetch
Filter Chip Toggle   →  update active filter → re-fetch or filter
Pull to Refresh      →  reload data
Retry Click          →  reload data (from Error state)
```

---

## STEP 7 — Define ViewModel Contract

### State Ownership Rules
| State | Owner |
|---|---|
| List data | ViewModel |
| Loading / error flags | ViewModel |
| Dialog visibility | ViewModel |
| Form input values | ViewModel |
| Validation errors | ViewModel |

### ViewModel Structure

```kotlin
class FeatureViewModel(
    private val repository: FeatureRepository
) : ViewModel() {

    var uiState by mutableStateOf<FeatureUiState>(FeatureUiState.Loading)
        private set

    var showAddDialog by mutableStateOf(false)
        private set

    var showEditDialog by mutableStateOf(false)
        private set

    var selectedItem by mutableStateOf<Entity?>(null)
        private set

    fun loadItems() { /* fetch from repository */ }
    fun addItem(item: Entity) { /* validate → insert → reload */ }
    fun updateItem(item: Entity) { /* validate → update → reload */ }
    fun deleteItem(item: Entity) { /* delete → reload */ }
    fun search(query: String) { /* filter */ }

    fun openAddDialog() { showAddDialog = true }
    fun openEditDialog(item: Entity) { selectedItem = item; showEditDialog = true }
    fun closeDialogs() { showAddDialog = false; showEditDialog = false; selectedItem = null }
}
```

> The UI never modifies data directly — it only calls ViewModel functions.

---

## STEP 8 — Connect UI to State

```kotlin
when (val state = viewModel.uiState) {
    is FeatureUiState.Loading -> LoadingScreen()
    is FeatureUiState.Empty   -> EmptyScreen { viewModel.openAddDialog() }
    is FeatureUiState.Success -> ItemList(state.items)
    is FeatureUiState.Error   -> ErrorScreen(state.message) { viewModel.loadItems() }
}

if (viewModel.showAddDialog) {
    AddItemDialog(
        onDismiss = { viewModel.closeDialogs() },
        onSave    = { viewModel.addItem(it) }
    )
}

if (viewModel.showEditDialog) {
    EditItemDialog(
        item      = viewModel.selectedItem!!,
        onDismiss = { viewModel.closeDialogs() },
        onSave    = { viewModel.updateItem(it) }
    )
}
```

---

## STEP 9 — Repository Layer

Separate data source from business logic. The ViewModel talks only to the repository.

```kotlin
interface FeatureRepository {
    suspend fun getAll(): List<Entity>
    suspend fun insert(item: Entity)
    suspend fun update(item: Entity)
    suspend fun delete(item: Entity)
    suspend fun search(query: String): List<Entity>
}
```

- Repository implementations can swap Room / Retrofit / Mock without touching the ViewModel.
- Always inject via constructor (Hilt / Koin recommended).

---

## STEP 10 — Define Validation Rules

All validation lives in the ViewModel or a dedicated Validator class.

```kotlin
fun validate(item: Entity): ValidationResult {
    if (item.name.isBlank()) return ValidationResult.Error("Name cannot be empty")
    if (item.price <= 0)     return ValidationResult.Error("Price must be greater than 0")
    if (item.stock < 0)      return ValidationResult.Error("Stock cannot be negative")
    return ValidationResult.Success
}
```

---

## STEP 11 — Final Pre-Implementation Checklist

Complete every item before writing production code.

- [ ] Domain model defined (fields, types, defaults)
- [ ] Relationships defined
- [ ] Use cases listed
- [ ] Screen states modeled (sealed class)
- [ ] Layout skeleton written
- [ ] Component specs described
- [ ] Event flow mapped (every interaction → state change)
- [ ] ViewModel contract defined (state ownership, functions)
- [ ] Repository interface designed
- [ ] Validation rules documented
- [ ] Edge cases identified (empty, error, loading, offline)

> Only begin implementation once ALL items above are checked.

---

## Quick Reference Cheatsheet

```
Domain Model  →  Use Cases  →  UI States  →  Layout Skeleton
     ↓               ↓              ↓               ↓
  Data Class    ViewModel Fns   sealed class    Scaffold tree

Component Specs  →  Event Flow  →  ViewModel  →  Repository
      ↓                 ↓              ↓              ↓
  UI units map     Transitions    State owner    Data source
```

**Architecture:** UI → ViewModel → Repository → DataSource
**Data flow:** Unidirectional (one-way, top-down)
**State:** Single source of truth in ViewModel