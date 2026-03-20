# Updating Design Tokens

This guide explains how to update the Draftr design system when colour tokens change in Figma.

## How it works

```
Figma Variables → JSON files → Build script → Generated CSS → App
```

- **Source of truth:** `src/tokens/primitives.json` and `src/tokens/semantics.json`
- **Generated output:** `src/tokens/generated/tokens.css` (never edit this directly)
- **Build command:** `npm run tokens:build`

The build script runs automatically before `npm run dev` and `npm run build`, so you only need to run it manually when you've changed the JSON files and want to see the results immediately.

---

## Scenario 1: A colour value changed

**Example:** primary-500 changes from `#DE0387` to `#E5058F`

**Designer:**

1. Update the variable in Figma
2. Export the updated Primitives collection as JSON
3. Hand the JSON file to the developer

**Developer:**

1. Replace `src/tokens/primitives.json` with the new file
2. Run `npm run tokens:build`
3. Verify the app looks correct in both light and dark mode
4. Commit both `primitives.json` and `tokens.css` together

That's it. The generated CSS updates, semantic tokens follow via `var()` references, and all components auto-update.

---

## Scenario 2: A new step or alpha variant added

**Example:** Adding `primary-425` or `error-500-alpha-20`

Same process as Scenario 1. The build script picks up any new steps automatically from the JSON structure. No code changes needed.

---

## Scenario 3: A new colour family added

**Example:** Adding a `tertiary` ramp

**Designer:**

1. Create the new Variable collection/group in Figma following the same structure
2. Export as JSON. The structure should match existing families:
   ```json
   "tertiary": {
     "$description": "Description here",
     "50": { "$type": "color", "$value": "#..." },
     "100": { "$type": "color", "$value": "#..." },
     ...
   }
   ```
3. If semantic tokens should reference the new family, add those to the Semantic collection too

**Developer:**

1. Replace `src/tokens/primitives.json` with the new file
2. Run `npm run tokens:build` — the new `--color-tertiary-*` vars appear in the generated CSS automatically
3. If semantic tokens reference the new family, also replace `src/tokens/semantics.json` and rebuild
4. **Manual step:** If you want the new tokens available as Tailwind utility classes (e.g. `bg-action-tertiary`), add entries to the `@theme inline` block in `src/app/globals.css`
5. **Manual step:** If shadcn components need the new tokens, add bridge mappings in `globals.css`
6. Commit all changes together

---

## Scenario 4: A new semantic token category added

**Example:** Adding `interaction/link/default` and `interaction/link/hover`

**Designer:**

1. Add to the Semantic collection in Figma with Light and Dark mode values
2. Export as JSON. The structure should include mode aliases:
   ```json
   "interaction": {
     "link": {
       "default": {
         "$type": "color",
         "$value": "{color.primary.500}",
         "$extensions": {
           "com.figma": {
             "modes": {
               "Light": "{color.primary.500}",
               "Dark": "{color.primary.400}"
             }
           }
         }
       }
     }
   }
   ```

**Developer:**

1. Replace `src/tokens/semantics.json`
2. Run `npm run tokens:build` — new `--interaction-link-default` vars generated automatically
3. Register in `@theme inline` block in `globals.css` if Tailwind class access is needed
4. Commit all changes together

---

## Quick reference

| What changed           | Files to update   | Manual CSS work needed?               |
| ---------------------- | ----------------- | ------------------------------------- |
| Colour value           | `primitives.json` | No                                    |
| New ramp step          | `primitives.json` | No                                    |
| New colour family      | `primitives.json` | Only if Tailwind/shadcn access needed |
| New semantic token     | `semantics.json`  | Only if Tailwind/shadcn access needed |
| Semantic alias changed | `semantics.json`  | No                                    |

## Commands

```bash
npm run tokens:build    # Regenerate CSS from JSON
npm run dev             # Starts dev server (auto-runs tokens:build)
npm run build           # Production build (auto-runs tokens:build)
```

## File locations

```
src/tokens/
├── primitives.json         ← Canonical colour ramps (from Figma)
├── semantics.json          ← Canonical semantic mappings (from Figma)
└── generated/
    └── tokens.css          ← AUTO-GENERATED (never edit)

src/app/globals.css         ← shadcn bridge + component tokens (hand-maintained)
scripts/build-tokens.ts     ← The build script
```
