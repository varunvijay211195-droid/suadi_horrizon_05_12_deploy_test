# Admin Orders — UI Mapping Detailer (M3 Three-Thing Pattern)

> This document maps the "Three-Thing" architecture (Primary, Secondary, Badge) from the Systematic Workflow Rules specifically to the Admin Order management module.

---

## 🏗️ The "Three-Thing" Mapping: Admin Orders

To ensure a clean, hierarchy-driven UI, every list item (OrderRow) must strictly follow this visual mapping:

### 1. Primary (The Anchor)
**Goal:** Identifying the order and the customer at a glance.
- **Fields:** 
    - `Order ID` (Display as bold, e.g., **#ORD-7721**)
    - `Customer Name` (Display as primary headline, e.g., **Ahmed Al-Zahrani**)
- **Material Element:** `Text` (Headline Medium/Small)
- **Design Rule:** Highest contrast (Pure White), Semi-Bold weight.

### 2. Secondary (The Context)
**Goal:** Providing logistical and financial details without cluttering the View.
- **Fields:**
    - `Timestamp`: (e.g., "2 hours ago" or "Mar 04, 2024")
    - `Item Summary`: (e.g., "Fresh Vegetables + 4 more items")
    - `Transaction Total`: (e.g., "SAR 250.00")
- **Material Element:** `Text` (Body Small / Label Medium)
- **Design Rule:** Muted contrast (Slate-400 or White/0.4), Regular weight, often accompanied by micro-icons (Clock, Package).

### 3. Badge (The Status)
**Goal:** Communicating the current lifecycle state and priority.
- **Fields:**
    - `Lifecycle State`: (Pending, Processing, Shipped, Delivered, Cancelled)
    - `Fulfillment Flag`: (Urgent, Flagged, Refunded)
- **Material Element:** `Surface` / `Chip` / `Badge`
- **Design Rule:** High-visibility semantic colors (Gold for Pending, Emerald for Delivered), subtle background tint with a 1px border.

---

## 📐 Overall Layout & Design Skeleton

### Structure (LazyColumn / Table)
Following Material Design 3 (M3) list patterns:

```
OrderRow (Card)
├── Leading: [Customer Initial Avatar / Order Icon]
├── Content (Column):
│   ├── Row (Top): [PRIMARY INFO]
│   └── Row (Bottom): [SECONDARY INFO]
└── Trailing: [STATUS BADGE] + [Chevron Right]
```

### Visual Specifications
- **Container**: `bg-[#0A1017]` with `border-white/[0.03]`.
- **Hover State**: `border-gold/20` with a subtle elevation/glow effect.
- **Micro-Animations**: 0.2s ease transitions for state changes and hover entries.
- **Glassmorphism**: Backdrop blur on sticky headers and action bars.

---

## 🎯 Implementation Strategy

| Requirement | Implementation Component |
|---|---|
| **Layout Control** | `src/app/admin/orders/page.tsx` (Grid Layout) |
| **Row Logic** | `src/components/admin/orders/OrderRow.tsx` (Mapping 1, 2, 3) |
| **Status Styling** | `STATUS_CONFIG` in `admin-helpers.ts` (Badge definition) |
| **Data Flow** | `useAdminOrders` hook (Providing the items to the list) |

---

> [!NOTE]
> This mapping ensures that the Admin can scan 50+ orders quickly by focusing only on the **Primary** (Who/ID) and **Badge** (State) while using **Secondary** for confirmation.
