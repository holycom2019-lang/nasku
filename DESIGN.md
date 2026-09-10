# Design Brief

## Direction

NAS Command Deck — a premium NAS/cloud-storage dashboard (Synology-DSM inspired) for sharing folders and files, clean and productive.

## Tone

Refined, professional tech with high information density — restrained decoration, crisp grids, and a sharp electric-teal accent that reads as data, network, and storage.

## Differentiation

A storage-native accent (teal) plus mono-font file metadata and a dedicated storage-usage gauge make the interface feel like a real NAS console rather than a generic file app.

## Color Palette

| Token      | OKLCH (dark)    | OKLCH (light)   | Role                                  |
| ---------- | --------------- | --------------- | ------------------------------------- |
| background | 0.145 0.014 260 | 0.985 0.006 260 | App canvas                            |
| foreground | 0.95 0.01 260   | 0.16 0.015 260  | Primary text                          |
| card       | 0.18 0.014 260  | 1.0 0.004 260   | File rows, panels                     |
| primary    | 0.72 0.16 190   | 0.42 0.14 190   | Electric teal — CTAs, active states   |
| accent     | 0.72 0.16 190   | 0.42 0.14 190   | Highlights, focus ring                |
| muted      | 0.22 0.02 260   | 0.95 0.01 260   | Secondary surfaces                    |
| destructive | 0.55 0.2 25    | 0.55 0.22 25    | Delete / revoke actions               |
| success    | 0.65 0.18 145   | 0.55 0.18 150   | Upload complete, shared status        |

## Typography

- Display: Space Grotesk — headings, breadcrumb, app name
- Body: General Sans — UI labels, file names, paragraphs
- Mono: JetBrains Mono — file sizes, storage stats, timestamps
- Scale: hero `text-3xl md:text-4xl font-bold tracking-tight`, h2 `text-xl font-semibold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm`

## Elevation & Depth

Flat, layered surfaces separated by thin borders and subtle shadows; the sidebar is the only elevated plane, with content cards lifted by `shadow-subtle`.

## Structural Zones

| Zone    | Background   | Border   | Notes                              |
| ------- | ------------ | -------- | ---------------------------------- |
| Sidebar | bg-sidebar   | border-r | Elevated plane, storage gauge      |
| Header  | bg-card      | border-b | Breadcrumb, search, actions        |
| Content | bg-background | —       | File list table, alternating rows  |
| Footer  | bg-muted/40  | border-t | Storage summary, status            |

## Spacing & Rhythm

Consistent 4px scale; dense table rows (py-2) for file lists, generous sidebar padding (p-4); section gaps of 24px with 16px card padding.

## Component Patterns

- Buttons: rounded-md, primary teal for upload, ghost for row actions, destructive for delete
- Cards: rounded-lg, bg-card, shadow-subtle
- Badges: rounded-full, muted bg with teal for "shared" status

## Motion

- Entrance: 200ms fade + 8px rise for list rows
- Hover: 150ms background/border transition on rows and sidebar items
- Decorative: subtle progress shimmer on upload bars

## Constraints

- Bahasa Indonesia for all UI copy
- Responsive: sidebar collapses to drawer on mobile, table to cards
- AA+ contrast in both light and dark themes
- Do not build sync, versioning, or deleted-file recovery zones

## Signature Detail

The mono-font storage-usage gauge in the sidebar — a live, technical readout of used/available space that anchors the "NAS console" identity.
