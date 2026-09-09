# Design System Documentation
## Phase 2 — Professional Design System

**Version:** 1.0  
**Last Updated:** September 8, 2026  
**Status:** Active

---

## Overview

This design system provides a consistent, professional visual language for the AI Internship Platform. It's built on Tailwind CSS with a focused color palette designed for an AI/career platform theme.

**Design Principles:**
- **Clarity:** Clear visual hierarchy and intuitive navigation
- **Consistency:** Unified design language across all components
- **Accessibility:** WCAG AA compliant color contrasts
- **Professional:** Modern, trustworthy aesthetic for career platform
- **AI-First:** Indigo/Blue primary color to represent AI technology

---

## Color System

### Primary Colors (Indigo/Blue)

**Purpose:** Primary actions, links, active navigation, AI recommendation elements, important actions

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `primary-50` | #EEF2FF | 238 242 255 | Backgrounds, subtle highlights |
| `primary-100` | #E0E7FF | 224 231 255 | Hover backgrounds, light accents |
| `primary-200` | #C7D2FE | 199 210 254 | Borders, dividers |
| `primary-300` | #A5B4FC | 165 180 252 | Active states, badges |
| `primary-400` | #818CF8 | 129 140 248 | Links, secondary actions |
| `primary-500` | #6366F1 | 99 102 241 | Tertiary actions |
| `primary-600` | #4F46E5 | 79 70 229 | **Primary buttons, main actions** |
| `primary-700` | #4338CA | 67 56 202 | **Primary hover states** |
| `primary-800` | #3730A3 | 55 48 163 | Dark backgrounds |
| `primary-900` | #312E81 | 49 46 129 | Very dark backgrounds |
| `primary-950` | #1E1B4B | 30 27 75 | Deepest backgrounds |

**Usage Guidelines:**
- Use `primary-600` for primary buttons and main CTAs
- Use `primary-700` for hover states on primary buttons
- Use `primary-50` for AI-related backgrounds (match score cards, recommendation highlights)
- Use `primary-100` for active navigation states
- Use `primary-400` for links and secondary actions

**Examples:**
```tsx
// Primary button
<button className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2">
  Apply Now
</button>

// Active navigation
<Link className="bg-primary-50 text-primary-700 font-semibold">Dashboard</Link>

// AI match score
<span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full">
  AI Match: 85%
</span>
```

---

### Neutral Colors

**Purpose:** Backgrounds, surfaces, borders, text, and neutral UI elements

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `neutral-50` | #F8FAFC | 248 250 252 | **Page background** |
| `neutral-100` | #F1F5F9 | 241 245 249 | Card backgrounds, secondary backgrounds |
| `neutral-200` | #E2E8F0 | 226 232 240 | **Borders, dividers** |
| `neutral-300` | #CBD5E1 | 203 213 225 | Disabled borders, subtle dividers |
| `neutral-400` | #94A3B8 | 148 163 184 | **Muted text, icons** |
| `neutral-500` | #64748B | 100 116 139 | **Secondary text, descriptions** |
| `neutral-600` | #475569 | 71 85 105 | Tertiary text |
| `neutral-700` | #334155 | 51 65 85 | Placeholder text |
| `neutral-800` | #1E293B | 30 41 59 | Dark text, headings |
| `neutral-900` | #0F172A | 15 23 42 | **Primary text, headings** |
| `neutral-950` | #020617 | 2 6 23 | Deepest text, code |

**Usage Guidelines:**
- Use `neutral-50` for page backgrounds
- Use `neutral-100` for card backgrounds and secondary surfaces
- Use `neutral-200` for borders and dividers
- Use `neutral-400` for muted icons and less important text
- Use `neutral-500` for secondary text and descriptions
- Use `neutral-900` for primary text and headings

**Examples:**
```tsx
// Page background
<body className="bg-neutral-50 text-neutral-900">

// Card
<div className="bg-white border border-neutral-200 rounded-xl p-6">

// Text hierarchy
<h1 className="text-neutral-900 font-semibold">Heading</h1>
<p className="text-neutral-500">Description text</p>
<span className="text-neutral-400">Muted text</span>
```

---

### Semantic Colors

**Purpose:** Communicate state (success, warning, error, info) - use sparingly and intentionally

#### Success (Green)

**Purpose:** Saved items, success states, healthy status, completed actions

| Token | Hex | Usage |
|-------|-----|-------|
| `success-50` | #F0FDF4 | Backgrounds |
| `success-100` | #DCFCE7 | Hover backgrounds |
| `success-200` | #BBF7D0 | Borders |
| `success-300` | #86EFAC | Light accents |
| `success-400` | #4ADE80 | Badges |
| `success-500` | #22C55E | Success indicators |
| `success-600` | #16A34A | **Main success color** |
| `success-700` | #15803D | Success hover |
| `success-800` | #166534 | Dark success |
| `success-900` | #14532D | Deepest success |

**Usage Guidelines:**
- Use `success-600` for success messages and saved states
- Use `success-50` for success message backgrounds
- Use `success-100` for healthy status indicators
- **Don't use green for primary actions** (use primary colors instead)

**Examples:**
```tsx
// Success message
<div className="bg-success-50 border border-success-200 text-success-700 p-4 rounded-lg">
  Profile updated successfully
</div>

// Saved badge
<span className="bg-success-100 text-success-700 px-2 py-1 rounded-full text-xs">
  Saved
</span>

// Healthy status
<span className="text-success-600 flex items-center gap-1">
  <span className="w-2 h-2 bg-success-600 rounded-full"></span>
  Active
</span>
```

---

#### Warning (Yellow/Amber)

**Purpose:** Warning states, approaching deadlines, caution messages

| Token | Hex | Usage |
|-------|-----|-------|
| `warning-50` | #FFFBEB | Backgrounds |
| `warning-100` | #FEF3C7 | Hover backgrounds |
| `warning-200` | #FDE68A | Borders |
| `warning-300` | #FCD34D | Light accents |
| `warning-400` | #FBBF24 | Badges |
| `warning-500` | #F59E0B | Warning indicators |
| `warning-600` | #D97706 | **Main warning color** |
| `warning-700` | #B45309 | Warning hover |
| `warning-800` | #92400E | Dark warning |
| `warning-900` | #78350F | Deepest warning |

**Usage Guidelines:**
- Use `warning-600` for warning messages and deadline alerts
- Use `warning-50` for warning message backgrounds
- Use `warning-100` for approaching deadline indicators
- **Don't use yellow for primary actions**

**Examples:**
```tsx
// Warning message
<div className="bg-warning-50 border border-warning-200 text-warning-700 p-4 rounded-lg">
  Application deadline approaching in 3 days
</div>

// Deadline badge
<span className="bg-warning-100 text-warning-700 px-2 py-1 rounded-full text-xs">
  Deadline: 2 days
</span>
```

---

#### Error (Red)

**Purpose:** Error states, expired items, problems, destructive actions

| Token | Hex | Usage |
|-------|-----|-------|
| `error-50` | #FEF2F2 | Backgrounds |
| `error-100` | #FEE2E2 | Hover backgrounds |
| `error-200` | #FECACA | Borders |
| `error-300` | #FCA5A5 | Light accents |
| `error-400` | #F87171 | Badges |
| `error-500` | #EF4444 | Error indicators |
| `error-600` | #DC2626 | **Main error color** |
| `error-700` | #B91C1C | Error hover |
| `error-800` | #991B1B | Dark error |
| `error-900` | #7F1D1D | Deepest error |

**Usage Guidelines:**
- Use `error-600` for error messages and invalid states
- Use `error-50` for error message backgrounds
- Use `error-100` for expired status indicators
- Use `error-600` for destructive buttons (delete, remove)
- **Don't use red for primary actions**

**Examples:**
```tsx
// Error message
<div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-lg">
  Failed to load data. Please try again.
</div>

// Destructive button
<button className="bg-error-600 hover:bg-error-700 text-white rounded-lg px-4 py-2">
  Delete Account
</button>

// Expired badge
<span className="bg-error-100 text-error-700 px-2 py-1 rounded-full text-xs">
  Expired
</span>
```

---

#### Info (Blue)

**Purpose:** Informational messages, neutral status, informational content

| Token | Hex | Usage |
|-------|-----|-------|
| `info-50` | #F0F9FF | Backgrounds |
| `info-100` | #E0F2FE | Hover backgrounds |
| `info-200` | #BAE6FD | Borders |
| `info-300` | #7DD3FC | Light accents |
| `info-400` | #38BDF8 | Badges |
| `info-500` | #0EA5E9 | Info indicators |
| `info-600` | #0284C7 | **Main info color** |
| `info-700` | #0369A1 | Info hover |
| `info-800` | #075985 | Dark info |
| `info-900` | #0C4A6E | Deepest info |

**Usage Guidelines:**
- Use `info-600` for informational messages
- Use `info-50` for informational message backgrounds
- Use `info-100` for neutral status indicators
- **Don't use blue for primary actions** (use primary/indigo instead)

**Examples:**
```tsx
// Info message
<div className="bg-info-50 border border-info-200 text-info-700 p-4 rounded-lg">
  New features available in your dashboard
</div>

// Info badge
<span className="bg-info-100 text-info-700 px-2 py-1 rounded-full text-xs">
  New
</span>
```

---

## Color Usage Rules

### DO ✅

- **Primary (Indigo):** Use for primary buttons, links, active navigation, AI elements
- **Success (Green):** Use for saved items, success states, healthy status
- **Warning (Yellow):** Use for warnings, approaching deadlines
- **Error (Red):** Use for errors, expired items, destructive actions
- **Info (Blue):** Use for informational messages, neutral status
- **Neutral:** Use for backgrounds, surfaces, borders, text

### DON'T ❌

- **Don't use semantic colors for decoration** - they should communicate state
- **Don't use green/yellow/red for primary actions** - use primary colors
- **Don't mix semantic colors arbitrarily** - each has a specific meaning
- **Don't use bright colors for large backgrounds** - use neutral colors
- **Don't use too many colors in one component** - stick to 2-3 colors max

### Color Combinations

**Recommended Combinations:**
```tsx
// Primary + Neutral
bg-primary-600 text-white hover:bg-primary-700

// Success + Neutral
bg-success-50 text-success-700 border-success-200

// Error + Neutral
bg-error-50 text-error-700 border-error-200

// Warning + Neutral
bg-warning-50 text-warning-700 border-warning-200

// Info + Neutral
bg-info-50 text-info-700 border-info-200
```

**Avoid These Combinations:**
```tsx
// ❌ Don't mix semantic colors
bg-success-500 text-error-600

// ❌ Don't use bright colors for text
bg-primary-600 text-primary-600

// ❌ Don't use low contrast
bg-neutral-100 text-neutral-200
```

---

## Typography

### Font Family

**Primary Font:** Inter

Inter is a professional, modern sans-serif font designed for clarity and readability. It's used consistently across the entire application.

**Font Weights Available:**
- 400 (Regular)
- 500 (Medium)
- 600 (Semibold)
- 700 (Bold)

**Font Loading:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Font Stack:**
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

---

### Typography Hierarchy

The typography system follows a clear visual hierarchy to communicate the structure of content:

```
Page Title (28-36px / bold)
    ↓
Section Heading (20-24px / semibold)
    ↓
Card Heading (16-18px / semibold)
    ↓
Body Text (14-16px / regular)
    ↓
Small Text (12-14px)
    ↓
Button Text (14px / semibold)
```

---

### Typography Scale

| Level | Tailwind Class | Size | Weight | Line Height | Usage |
|-------|---------------|------|--------|-------------|-------|
| **Page Title** | `text-page-title` | 36px | 700 (Bold) | 40px | Main page headings |
| **Page Title (Small)** | `text-page-title-sm` | 28px | 700 (Bold) | 32px | Smaller page headings |
| **Section Heading** | `text-section-heading` | 24px | 600 (Semibold) | 32px | Section titles |
| **Section Heading (Small)** | `text-section-heading-sm` | 20px | 600 (Semibold) | 28px | Smaller section titles |
| **Card Heading** | `text-card-heading` | 18px | 600 (Semibold) | 24px | Card titles |
| **Card Heading (Small)** | `text-card-heading-sm` | 16px | 600 (Semibold) | 24px | Smaller card titles |
| **Body Text** | `text-body` | 16px | 400 (Regular) | 24px | Primary body text |
| **Body Text (Small)** | `text-body-sm` | 14px | 400 (Regular) | 20px | Secondary body text |
| **Small Text** | `text-small` | 14px | 400 (Regular) | 20px | Captions, labels |
| **Small Text (Extra)** | `text-small-sm` | 12px | 400 (Regular) | 16px | Tiny labels |
| **Button Text** | `text-button` | 14px | 500 (Medium) | 20px | Button labels |

---

### Typography Usage Guidelines

#### Page Titles
**Use for:** Main page headings, hero sections

```tsx
<h1 className="text-page-title text-neutral-900">
  Dashboard
</h1>

<h1 className="text-page-title-sm text-neutral-900">
  Profile Settings
</h1>
```

**When to use:**
- Once per page (main heading)
- Hero sections
- Landing page headlines

---

#### Section Headings
**Use for:** Major sections within a page

```tsx
<h2 className="text-section-heading text-neutral-900">
  Your Recommendations
</h2>

<h2 className="text-section-heading-sm text-neutral-900">
  Personal Information
</h2>
```

**When to use:**
- Major content sections
- Grouped content areas
- Sub-page titles

---

#### Card Headings
**Use for:** Titles within cards, modals, panels

```tsx
<h3 className="text-card-heading text-neutral-900">
  Internship Details
</h3>

<h3 className="text-card-heading-sm text-neutral-900">
  Account Settings
</h3>
```

**When to use:**
- Card titles
- Modal titles
- Panel headings
- List item headings

---

#### Body Text
**Use for:** Primary content, descriptions, paragraphs

```tsx
<p className="text-body text-neutral-500">
  This is the main body text for descriptions and content.
</p>

<p className="text-body-sm text-neutral-500">
  This is secondary body text for less important content.
</p>
```

**When to use:**
- Paragraphs
- Descriptions
- Form labels
- List content

---

#### Small Text
**Use for:** Captions, labels, metadata

```tsx
<span className="text-small text-neutral-400">
  Last updated 2 hours ago
</span>

<span className="text-small-sm text-neutral-400">
  Required field
</span>
```

**When to use:**
- Captions
- Metadata
- Helper text
- Timestamps
- Labels

---

#### Button Text
**Use for:** Button labels, action buttons

```tsx
<button className="text-button text-white bg-primary-600">
  Apply Now
</button>
```

**When to use:**
- All button labels
- Action links
- Navigation items

---

### Typography Best Practices

#### DO ✅

- Use the hierarchy consistently
- Maintain visual contrast between levels
- Use appropriate line heights for readability
- Keep font weights consistent within levels
- Use semantic HTML (h1-h6)

#### DON'T ❌

- Don't skip levels in the hierarchy
- Don't use random font sizes
- Don't mix font weights within the same level
- Don't use bold for emphasis (use semibold)
- Don't use too many font sizes on one page

---

### Visual Hierarchy Examples

#### Example 1: Dashboard Page
```tsx
// Page Title
<h1 className="text-page-title text-neutral-900 mb-6">
  Dashboard
</h1>

// Section Heading
<h2 className="text-section-heading text-neutral-900 mb-4">
  Your Recommendations
</h2>

// Card Heading
<h3 className="text-card-heading text-neutral-900 mb-2">
  Software Engineer Intern
</h3>

// Body Text
<p className="text-body text-neutral-500 mb-4">
  This is a 12-week internship program focused on...
</p>

// Small Text
<span className="text-small text-neutral-400">
  Deadline: Dec 15, 2026
</span>
```

#### Example 2: Profile Page
```tsx
// Page Title
<h1 className="text-page-title-sm text-neutral-900 mb-6">
  Profile Settings
</h1>

// Section Heading
<h2 className="text-section-heading-sm text-neutral-900 mb-4">
  Personal Information
</h2>

// Card Heading
<h3 className="text-card-heading-sm text-neutral-900 mb-2">
  Contact Details
</h3>

// Body Text
<p className="text-body-sm text-neutral-500 mb-2">
  Update your contact information below.
</p>

// Small Text
<span className="text-small-sm text-neutral-400">
  Email address is required
</span>
```

---

### Typography in Components

#### Buttons
```tsx
<button className="text-button font-medium text-white bg-primary-600">
  Apply Now
</button>
```

#### Cards
```tsx
<div className="bg-white border border-neutral-200 rounded-xl p-6">
  <h3 className="text-card-heading text-neutral-900 mb-2">
    Card Title
  </h3>
  <p className="text-body text-neutral-500">
    Card description text goes here.
  </p>
</div>
```

#### Forms
```tsx
<label className="text-small font-medium text-neutral-700 mb-1 block">
  Email Address
</label>
<input className="text-body text-neutral-900" />
<p className="text-small-sm text-neutral-400 mt-1">
  We'll never share your email.
</p>
```

#### Badges
```tsx
<span className="text-small-sm font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded-full">
  New
</span>
```

---

### Responsive Typography

For mobile devices, consider using smaller sizes:

```tsx
// Desktop: text-page-title (36px)
// Mobile: text-page-title-sm (28px)
<h1 className="text-page-title text-page-title-sm md:text-page-title">
  Dashboard
</h1>
```

---

### Accessibility

- **Minimum font size:** 14px for body text (WCAG recommendation)
- **Line height:** Minimum 1.4 for body text, 1.2 for headings
- **Color contrast:** Ensure text meets WCAG AA standards (4.5:1 for normal text)
- **Font weight:** Don't rely solely on weight for emphasis (use color too)

---

### Migration Guide

#### Old Classes → New Classes

| Old Class | New Class |
|-----------|-----------|
| `text-3xl font-extrabold` | `text-page-title` |
| `text-2xl font-bold` | `text-page-title-sm` |
| `text-xl font-semibold` | `text-section-heading-sm` |
| `text-lg font-semibold` | `text-card-heading` |
| `text-base` | `text-body` |
| `text-sm` | `text-body-sm` or `text-small` |
| `text-xs` | `text-small-sm` |

#### Migration Steps

1. **Add Inter font** ✅ (Already done)
2. **Update Tailwind config** ✅ (Already done)
3. **Replace heading classes**
   - Replace `text-3xl font-extrabold` with `text-page-title`
   - Replace `text-2xl font-bold` with `text-page-title-sm`
   - Replace `text-xl font-semibold` with `text-section-heading-sm`
   - Replace `text-lg font-semibold` with `text-card-heading`
4. **Replace body text classes**
   - Replace `text-base` with `text-body`
   - Replace `text-sm` with `text-body-sm` or `text-small`
   - Replace `text-xs` with `text-small-sm`
5. **Test visual hierarchy**
6. **Ensure consistency across pages**

---

## Spacing

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `0` | 0px | No spacing |
| `1` | 4px | Tight spacing |
| `2` | 8px | Small spacing |
| `3` | 12px | Default spacing |
| `4` | 16px | Medium spacing |
| `5` | 20px | Large spacing |
| `6` | 24px | Extra large spacing |
| `8` | 32px | Section spacing |
| `10` | 40px | Large section spacing |
| `12` | 48px | Component spacing |
| `16` | 64px | Page section spacing |

### Spacing Guidelines

**Component Internal Spacing:**
```tsx
// Tight spacing (4-8px)
<div className="flex items-center gap-2">

// Default spacing (12-16px)
<div className="space-y-4">

// Medium spacing (20-24px)
<div className="space-y-6">

// Large spacing (32-48px)
<div className="space-y-12">
```

**Component External Spacing:**
```tsx
// Small margins (8-16px)
<div className="mb-4">

// Medium margins (24-32px)
<div className="mb-8">

// Large margins (48-64px)
<div className="mb-16">
```

---

## Border Radius

### Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0px | No radius |
| `sm` | 2px | Small radius (badges, tags) |
| `default` | 4px | Default radius (inputs, buttons) |
| `md` | 6px | Medium radius (cards) |
| `lg` | 8px | Large radius (large cards) |
| `xl` | 12px | Extra large radius (modals) |
| `2xl` | 16px | Very large radius (hero cards) |
| `full` | 9999px | Full radius (circles, pills) |

### Radius Guidelines

```tsx
// Badges, tags
<span className="rounded-sm px-2 py-1">

// Inputs, buttons
<button className="rounded-md px-4 py-2">

// Cards
<div className="rounded-lg p-6">

// Large cards
<div className="rounded-xl p-8">

// Modals
<div className="rounded-2xl p-6">

// Circles, pills
<span className="rounded-full">
```

---

## Shadows

### Shadow Scale

| Token | Usage |
|-------|-------|
| `sm` | Subtle elevation (cards, buttons) |
| `default` | Default elevation (dropdowns) |
| `md` | Medium elevation (modals) |
| `lg` | Large elevation (popovers) |
| `xl` | Extra large elevation (tooltips) |
| `2xl` | Very large elevation (drawers) |

### Shadow Guidelines

```tsx
// Cards
<div className="shadow-sm">

// Dropdowns
<div className="shadow">

// Modals
<div className="shadow-xl">

// Hover states
<div className="hover:shadow-md transition-shadow">
```

---

## Component Patterns

### Buttons

**Primary Button:**
```tsx
<button className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  Apply Now
</button>
```

**Secondary Button:**
```tsx
<button className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg px-4 py-2 font-medium transition-colors">
  Cancel
</button>
```

**Destructive Button:**
```tsx
<button className="bg-error-600 hover:bg-error-700 text-white rounded-lg px-4 py-2 font-medium transition-colors">
  Delete
</button>
```

**Outline Button:**
```tsx
<button className="border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg px-4 py-2 font-medium transition-colors">
  Learn More
</button>
```

**Ghost Button:**
```tsx
<button className="text-neutral-600 hover:bg-neutral-100 rounded-lg px-4 py-2 font-medium transition-colors">
  Edit
</button>
```

---

### Cards

**Standard Card:**
```tsx
<div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Card Title</h3>
  <p className="text-neutral-500">Card content goes here.</p>
</div>
```

**Card with Header:**
```tsx
<div className="bg-white border border-neutral-200 rounded-xl shadow-sm">
  <div className="p-6 border-b border-neutral-200">
    <h3 className="text-lg font-semibold text-neutral-900">Card Title</h3>
  </div>
  <div className="p-6">
    <p className="text-neutral-500">Card content goes here.</p>
  </div>
</div>
```

**Hover Card:**
```tsx
<div className="bg-white border border-neutral-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
  <div className="p-6">
    <h3 className="text-lg font-semibold text-neutral-900 mb-2">Card Title</h3>
    <p className="text-neutral-500">Card content goes here.</p>
  </div>
</div>
```

---

### Inputs

**Text Input:**
```tsx
<input
  type="text"
  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none bg-white disabled:opacity-60 disabled:cursor-not-allowed"
  placeholder="Enter text..."
/>
```

**Error Input:**
```tsx
<input
  type="text"
  className="w-full rounded-lg border border-error-300 text-sm text-neutral-900 focus:ring-2 focus:ring-error-500 focus:border-error-500 focus:outline-none bg-error-50"
  placeholder="Enter text..."
/>
```

**Textarea:**
```tsx
<textarea
  rows={4}
  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none bg-white resize-none"
  placeholder="Enter text..."
/>
```

---

### Badges

**Primary Badge:**
```tsx
<span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
  AI Match
</span>
```

**Success Badge:**
```tsx
<span className="bg-success-100 text-success-700 px-2 py-1 rounded-full text-xs font-medium">
  Active
</span>
```

**Warning Badge:**
```tsx
<span className="bg-warning-100 text-warning-700 px-2 py-1 rounded-full text-xs font-medium">
  Pending
</span>
```

**Error Badge:**
```tsx
<span className="bg-error-100 text-error-700 px-2 py-1 rounded-full text-xs font-medium">
  Expired
</span>
```

**Neutral Badge:**
```tsx
<span className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full text-xs font-medium">
  Draft
</span>
```

---

### Alerts

**Success Alert:**
```tsx
<div className="bg-success-50 border border-success-200 text-success-700 p-4 rounded-lg" role="alert">
  <p className="text-sm font-medium">Success message here</p>
</div>
```

**Error Alert:**
```tsx
<div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-lg" role="alert">
  <p className="text-sm font-medium">Error message here</p>
</div>
```

**Warning Alert:**
```tsx
<div className="bg-warning-50 border border-warning-200 text-warning-700 p-4 rounded-lg" role="alert">
  <p className="text-sm font-medium">Warning message here</p>
</div>
```

**Info Alert:**
```tsx
<div className="bg-info-50 border border-info-200 text-info-700 p-4 rounded-lg" role="alert">
  <p className="text-sm font-medium">Info message here</p>
</div>
```

---

## Accessibility

### Color Contrast

All color combinations meet WCAG AA standards:
- Normal text (4.5:1 contrast ratio)
- Large text (3:1 contrast ratio)
- UI components (3:1 contrast ratio)

### Focus States

All interactive elements must have visible focus states:
```tsx
<button className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Button
</button>
```

### ARIA Labels

Use ARIA labels for interactive elements without text:
```tsx
<button aria-label="Close modal">
  <X />
</button>
```

### Semantic HTML

Use proper semantic elements:
- Use `<button>` for actions
- Use `<a>` for navigation
- Use `<label>` for form inputs
- Use `<h1>`-`<h6>` for headings

---

## Migration Guide

### Old Color Classes → New Color Classes

| Old Class | New Class |
|-----------|-----------|
| `bg-gray-50` | `bg-neutral-50` |
| `bg-gray-100` | `bg-neutral-100` |
| `text-gray-900` | `text-neutral-900` |
| `text-gray-500` | `text-neutral-500` |
| `border-gray-200` | `border-neutral-200` |
| `border-gray-300` | `border-neutral-300` |
| `bg-indigo-600` | `bg-primary-600` |
| `hover:bg-indigo-700` | `hover:bg-primary-700` |
| `bg-red-50` | `bg-error-50` |
| `text-red-700` | `text-error-700` |
| `bg-green-50` | `bg-success-50` |
| `text-green-700` | `text-success-700` |

### Migration Steps

1. **Update Tailwind config** ✅ (Already done)
2. **Update CSS variables** ✅ (Already done)
3. **Replace color classes** (In progress)
   - Replace `gray-*` with `neutral-*`
   - Replace `indigo-*` with `primary-*`
   - Replace semantic colors with new semantic colors
4. **Test visual consistency**
5. **Update documentation**

---

## Design Tokens

### CSS Variables

```css
:root {
  --background: 248 250 252; /* neutral-50 */
  --foreground: 15 23 42; /* neutral-900 */
  --card: 255 255 255;
  --card-foreground: 15 23 42;
  --popover: 255 255 255;
  --popover-foreground: 15 23 42;
  --primary: 79 70 229; /* primary-600 */
  --primary-foreground: 255 255 255;
  --secondary: 241 245 249; /* neutral-100 */
  --secondary-foreground: 15 23 42;
  --muted: 148 163 184; /* neutral-400 */
  --muted-foreground: 100 116 139; /* neutral-500 */
  --accent: 241 245 249;
  --accent-foreground: 15 23 42;
  --destructive: 220 38 38; /* error-600 */
  --destructive-foreground: 255 255 255;
  --border: 226 232 240; /* neutral-200 */
  --input: 226 232 240;
  --ring: 79 70 229;
  --radius: 0.5rem;
}
```

---

## Best Practices

### DO ✅

- Use semantic colors to communicate state
- Maintain consistent spacing throughout
- Use proper heading hierarchy
- Ensure accessible color contrast
- Use focus states for interactive elements
- Keep component designs simple and consistent
- Use neutral colors for backgrounds and surfaces

### DON'T ❌

- Don't use semantic colors for decoration
- Don't mix too many colors in one component
- Don't use bright colors for large backgrounds
- Don't skip heading hierarchy
- Don't forget focus states
- Don't create custom color values (use design tokens)
- Don't use color as the only indicator (use icons + text)

---

## Resources

- **Tailwind CSS Documentation:** https://tailwindcss.com/docs
- **WCAG Accessibility Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **Design Tokens:** https://designsystems.com/what-are-design-tokens/

---

## Changelog

### Version 1.0 (September 8, 2026)
- Initial design system implementation
- Primary color system (Indigo/Blue)
- Neutral color system
- Semantic color system (Success, Warning, Error, Info)
- Typography scale
- Spacing scale
- Border radius scale
- Shadow scale
- Component patterns
- Accessibility guidelines
- Migration guide

---

## Support

For questions or issues related to the design system:
1. Check this documentation first
2. Review the component examples
3. Consult the migration guide
4. Contact the design team

**Last Updated:** September 8, 2026  
**Maintained By:** Design Team
