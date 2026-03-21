# Admin Orders — Systematic Workflow Blueprint

> **Status:** Planning Phase (Step 1-11)
> **Context:** Saudi Horizon Fresh Admin Panel
> **Architecture:** UI → Custom Hook (ViewModel) → Repository (API) → MongoDB

---

## STEP 1 — Define the Domain Model (Data First)

### 1.1 Identify the Entity: `AdminOrder`
| Field | Type | Description |
|---|---|---|
| `_id` | `string` | Unique MongoDB Identifier |
| `user` | `{ email: string, name?: string }` | Customer identification |
| `items` | `Array<OrderItem>` | List of products, quantities, and prices |
| `totalAmount` | `number` | Sum total in SAR |
| `status` | `OrderStatus` | Lifecycle state (pending, processing, etc.) |
| `shippingAddress`| `ShippingAddress` | Destination and contact details |
| `adminNote` | `string` | Internal CRM/Handling notes |
| `createdAt` | `string (ISO)` | Creation timestamp |
| `updatedAt` | `string (ISO)` | Last modification timestamp |

### 1.2 Identify Sub-Entities
- **OrderItem**: `{ productId, name, quantity, price, image }`
- **ShippingAddress**: `{ fullName, address, city, country, phone }`

### 1.3 Target Statuses
- `pending`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`, `flagged`.

---

## STEP 2 — Define Use Cases (User Actions)

1. **View List**: Paginated/Scrollable list of all orders.
2. **Search**: Filter by Customer Email or Order ID.
3. **Filter by Status**: Tabs/Pills for quick status grouping.
4. **View Details**: Open modal with full breakdown and timeline.
5. **Update Status**: Step-by-step state transition (Processing → Shipped).
6. **Refund Order**: Trigger refund flow with reason requirement.
7. **Flag Order**: Mark as suspicious for investigation.
8. **Export/Invoice**: Generate PDF/CSV invoice for taxation.

---

## STEP 3 — Define Screen States (Critical)

**UI = Function(OrdersState)**

1. **LOADING**: Initial fetch or broad filter change.
2. **EMPTY**: Search returned no results or store has zero orders.
3. **SUCCESS**: Render `OrderRow` list or `OrderDetail`.
4. **ERROR**: API failure (401, 500) with "Retry" button.
5. **ACTION_PENDING**: Modal open (Delete confirmation, Status change).

```typescript
type OrdersUiState = 
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'success'; data: AdminOrder[]; stats: OrderStats }
  | { status: 'error'; message: string };
```

---

## STEP 4 — Define Layout Skeleton

```jsx
<AdminLayout>
  <Header title="Orders" stats={<KpiCards />} />
  <div className="container">
    <section className="controls">
      <SearchBar />
      <StatusTabs />
    </section>
    <main className="table-wrapper">
      <AnimatePresence>
        {state.status === 'loading' && <OrderSkeletons />}
        {state.status === 'success' && <OrderTable rows={state.data} />}
      </AnimatePresence>
    </main>
  </div>
  <OrderDetailModal order={selectedOrder} />
</AdminLayout>
```

---

## STEP 5 — Define Component Specifications

### 5.1 `OrderRow`
- **Visuals**: HSL-based status badge, customer avatar, relative timestamp.
- **Interactions**: Left-click for Edit, Right-click for Quick Actions.

### 5.2 `FulfillmentTimeline`
- **Logic**: Visualizes `pending → processing → shipped → delivered`.
- **Validation**: Current step highlighted; future steps dimmed.

### 5.3 `OrderActionModal`
- **Inputs**: `reason` (text), `confirm` (checkbox).
- **Styles**: Red theme for Refund/Delete, Blue for Note.

---

## STEP 6 — Define Event Flow (Behavior Map)

- **Search Input (Change)** → Debounce 300ms → Update URL Params → Hook Refetch.
- **Status Tab (Click)** → Clear Selection → Set Status Filter → Hook Refetch.
- **Action Button (Click)** → Open Confirmation Modal → Set Local `activeAction`.
- **Confirm Action** → API Call → Success Toast → Refresh Local Data → Close Modal.

---

## STEP 7 — Define "ViewModel" (Hook) Contract

**`useAdminOrders()` Hook**
- **State**: `orders`, `filtering`, `pagination`, `stats`.
- **Exposed Functions**:
    - `updateStatus(id, newStatus)`
    - `handleRefund(id, reason)`
    - `generateInvoice(id)`
    - `refreshData()`

---

## STEP 8 — Connect UI to State

- The Page component maps `state.data` to `OrderRow` items.
- Modals are controlled by a `selectedOrderId` state.
- Toasts (Sonner) are triggered by Hook `useEffect` or Promise results.

---

## STEP 9 — Repository Layer (API Services)

**`src/lib/api/admin/orders.ts`**
- `GET /api/admin/orders`: Fetch with query params.
- `PATCH /api/admin/orders/:id/status`: Transition state.
- `POST /api/admin/orders/:id/refund`: Process reversal.
- `GET /api/admin/orders/:id/invoice`: PDF generation.

---

## STEP 10 — Define Validation Rules

1. **Inventory Alignment**: Cannot mark "Processing" if stock is insufficient. (Server handles, UI displays error).
2. **Refund Rules**: Amount must be <= Total Paid. Reason required > 10 chars.
3. **Status Transitions**: Valid paths only (e.g., Cannot go from Pending to Delivered directly).

---

## STEP 11 — Pre-Implementation Checklist

- [x] Domain Model Interface (Step 1)
- [x] Use Cases Listed (Step 2)
- [x] Sealed States Defined (Step 3)
- [x] Skeleton Layout Drafted (Step 4)
- [x] Component Atoms Specified (Step 5)
- [x] Event Flow Logic Mapped (Step 6)
- [x] Hook Contract Defined (Step 7)
- [x] API Service Routes Mapped (Step 9)
- [x] Premium Theme (HSL/Dark) Planned
