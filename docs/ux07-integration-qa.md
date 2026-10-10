# UX-07 · Integration and QA acceptance

This is the cross-workspace smoke checklist after UX-01 through UX-06 have merged.
It distinguishes automated checks from browser-only acceptance. No visual, storage,
memory or performance result should be marked PASS without observing it.

## Automated gates

- `bun run lint`, `bun run format:check`, `bun run data:validate`,
  `bun test`, `bun run check`, and `bun run build` in GitHub Actions.
- Focused navigation tests cover Fusion, Deck Workshop, Duel Companion and
  global search URLs; domain/serialization tests retain their existing scope.
- No e2e browser or performance benchmark is implied by passing CI.

## Manual integration checks · pending acceptance

| Area | Browser scenario | Expected result |
| --- | --- | --- |
| Shell | Follow Home, Cards, Fusion, Decks, Duel, Reference and the old `/recipes/`, `/coach/`, `/simulate/`, `/collection/`, `/lab/`, `/opponents/`, `/leaders/`, `/reincarnation/`, `/saves/` links | No missing route, wrong active navigation or unplanned redirect |
| Cards | Search by ID/name, flip with keyboard, scroll to compact toolbar and reopen Filters | Input/filter state remains usable; card flip and focus work |
| Global search | Ctrl/Cmd+K, type `blue eye` or `007`, arrows/Enter, Escape, no-result query, View all | Correct canonical suggestion, ID-filtered selection and query-preserving View all |
| Fusion | Open `/fusion/?mode=recipes&card=024`; change modes, edit Hand/Field, use browser Back/Forward and a recipe handoff | URL/view stay synchronized; Hand, Field, Undo and recipe selection persist across mode navigation; replacement still requires confirmation |
| Decks | Visit `/decks/?mode=practice`, navigate Build/Inventory/Practice and use Back/Forward; generate a proposal | Practice remains in memory, Inventory remounts safely and no proposal silently commits a deck |
| Duel | `/duel/?opponent=weevil` and `/duel/?mode=history`; switch Plan/History and browser Back/Forward | Planner inputs persist; history uses genuine local records, not predicted results |
| Battle History | Open `/lab/` and Duel History in separate tabs; record one result in A; attempt to record or remove in stale B | B blocks stale write and requests refresh, leaving A's result intact |
| Storage failures | Use a disposable browser profile to test blocked/corrupt localStorage and repeat unsafe actions | Clear warning; corrupt saved deck, collection and battle history are not silently overwritten |
| Keyboard and dialogs | Tab/Shift+Tab, Escape on recipe replacement and battle removal, ArrowUp/Down in card search | Visible focus, Escape cancels, no accidental deletion or replacement |
| Appearance | System, Light and Dark; switch OS appearance while System selected | Correct theme, legible panels, no forced palette |
| Layout | Desktop and ~550px browser beside PCSX2, then phone-size viewport | No clipped controls, horizontal overflow on top navigation only, dialogs fit viewport |
| Performance | Compare Chrome DevTools Network/Performance on Home, Cards, Fusion, Decks and Duel in a clean profile | Record actual JS, image transfer, load and interaction observations before claiming speed |

**Storage note:** Use throwaway browser data for destructive/corruption tests.
Do not alter the user's actual saved decks, collection or battle history during QA.

## Out of scope

No AI inference, backend, PCSX2 integration, save modification, schema migration,
fusion-rule change, drop-rate claim or new persistent shared store.
