# AltudePay visual quality uplift plan

Status: planning document only. No product code changes in this branch.

## 1. Executive assessment

AltudePay already has the foundation for a strong product experience: a clean transaction flow, clear payment logic, a dark-mode visual base, and a few well-conceived motion/state patterns. The largest gap is not information architecture; it is product finish. The app reads as a generic fintech template rather than an Altude product, and the current palette still fails several WCAG AA checks in the main secondary-text and accent paths.

The design work should therefore focus on a compact, phased system pass instead of broad screen redesigns. The highest-return move is to establish a strict dark-mode token system, unify the shared shell and surfaces, and then only refine screens whose hierarchy or spacing is actually weak. The Send screen should remain structurally protected: it already has the correct information hierarchy and flow pattern and should be improved only through token, state, and accessibility consistency.

The repo already contains signals that the intended direction is correct: semantic theme tokens, a shared Screen wrapper, a design-focused layout model, and a few premium UI primitives. The main issue is the mismatch between the intended dark-fintech direction and the actual in-flight implementation. The plan below preserves the working flow and targets the minimum intervention necessary to raise finish, trust, and clarity.

## 2. What the current product already does well

- The Send flow has strong product logic and a clear task hierarchy: amount hero, keypad, validation state, and a single decision CTA.
- The payment progress screens are structurally elegant and emotionally reassuring: large visuals, a single primary action, and staged status language.
- The app already uses a dark, restrained transaction-first aesthetic in many places, which is better aligned with fintech quality than a bright or overly playful crypto pattern.
- Shared design tokens and type roles exist in the theme layer, which means the system can be improved without rebuilding the app from scratch.
- There is an existing notion of safe-area-aware layout, keyboard handling, and reusable screen shell behavior.
- The app copy is relatively calm and clear, which is a meaningful advantage for trust and transaction clarity.
- The Ascent indicator and staged progress patterns are good emotional anchors and should be preserved as product identity rather than discarded.

## 3. Fin design principles worth adapting

Use Fin as a benchmark for quality, not as a copied visual language.

- Premium dark surfaces with near-black or deep ink canvases, not generic crypto glows.
- Warm off-white text and controls instead of stark white everywhere.
- One controlled brand accent family, with green used for success and warnings used sparingly.
- Strong hierarchy: one oversized value or task, supporting data compactly arranged, little competing chrome.
- Clear bold sans-serif headings and balances, with mono or editorial treatment reserved for short metadata or labels.
- Generous spacing and deliberate rhythm rather than dense packed cards.
- Large circular action controls with simple line icons and short labels.
- Clean transaction rows driven by typography, spacing, and recognizable marks rather than heavy boxes.
- Minimal bottom navigation with one primary action emphasized.
- Subtle depth via tonal differences, borders, and restrained shadows instead of excessive glassmorphism or glow.
- Quick, subtle motion with clear states for pressed, focus, loading, empty, success, and error.

## 4. Fin-specific elements that should not be copied

- Do not copy the exact Fin palette or evergreen marketing color system.
- Do not introduce cinematic photography backgrounds into transactional app screens.
- Do not replicate Fin’s proprietary editorial typography choices wholesale.
- Do not build fake user avatars or country/asset illustrations where the product has no real contact model.
- Do not increase surface complexity merely to resemble a high-end marketing site; the app remains a wallet product, not a cinematic landing page.

Altude identity should remain explicit: dark ink surfaces, cyan brand accents, off-white type, and a technical product tone that feels calm, precise, and trustworthy.

## 5. Current screen inventory and change matrix

Change level legend: none, token-only, light component polish, targeted layout refinement, substantial redesign.

| Screen / route | User purpose | Current strengths | Visual or UX problems | Recommended change level | Rationale | Dependencies and risk |
| --- | --- | --- | --- | --- | --- | --- |
| Send | Enter amount and confirm payment | Strong task model and value hierarchy | State treatment, key feedback, accessory labeling, and amount overflow risk | Token-only + light component polish | Protected screen; no structural redesign required | Low risk; compare against existing key-by-key screenshots |
| Home | Balance + recent activity | Strong transaction concept and quick overview behavior | Hierarchy is sometimes inverted; generic hero and truncated address outweigh value | Targeted layout refinement | High-visibility screen that benefits most from hierarchy correction | Medium; depends on balance display and list-row primitives |
| Onboarding | Capture profile and initial set-up | Good flow logic and validation model | Small-screen keyboard collisions and modal/picker inconsistency | Targeted layout refinement | Real responsive defect, not taste-only issue | Medium; needs sheet and field primitives |
| PayAddress | Confirm recipient | good validation concept and scan path | Navigation appears ad hoc; recipient input treatment is not visually consistent | Light component polish | Mostly shell and field consistency work | Low |
| History | Review activity and status | clear list concept and empty-state intent | Border-heavy rows and a misaligned label/action pattern | Light component polish | Layout is workable; treatment is inconsistent | Low |
| Receipt | Review transaction details | Clear information grouping and copy affordance | long values can overflow; status labels and actions are under-polished | Light component polish | A good candidate for shared row and header treatment | Low |
| PaymentStatus | Progress and completion state | Strong stage logic and reassurance copy | palette and reduced-motion state need improvement | Token-only | Best screen in the product; preserve structure | Low |
| PreparingAccount | Setup screen | Strong onboarding intent and pacing | palette and reduced-motion state need improvement | Token-only | Good structure; mostly visual tuning | Low |
| Scan | QR capture | clear scanner flow and permission handling | dark/light scrim contrast and hook-order correctness need inspection | Token-only + small bug fix | Functional issue with visual quality rather than redesign | Low |
| QR / Receive | Payment request generation | out-of-scope or currently unreachable in the app | not in the product flow in the current repo state | None for now | Leave as-is and do not inflate scope | None |
| Tab bar | Primary app navigation | compact and accessible idea | icon treatment and emphasis need stronger hierarchy | Shared component change | global chrome quality issue | Medium |
| Root app shell | App load and error boundaries | boundary exists | some surfaces and alert patterns are visually rough | Token-only | important for first impression | Low |

## 6. Screens explicitly recommended for no structural change

- SendScreen: no structural redesign; keep the amount-flow model, keypad logic, and validation sequence intact.
- PaymentStatusScreen: keep the progress model and stage treatment; re-tint and improve accessibility only.
- PreparingAccountScreen: maintain the immersive setup flow, update visuals only.
- AscentIndicator and StageList: keep their logic and geometry; tune tokens and motion only.
- ScanScreen: keep the flow; fix the correctness issue and visual contrast without redesigning the interaction model.

Optional change only if evidence shows a real defect: the CTA state in Send should be disabled when the value is zero or invalid; structural redesign beyond that remains out of scope.

## 7. Proposed Altude visual direction

The goal is an Altude-specific premium dark-fintech tone: near-black ink, warm ivory text, controlled cyan accents, and general generosity in spacing and rhythm.

- Canvas: dark ink with tonal elevation steps, not a bright or blue-heavy generic template.
- Text: warm off-white for primary headings and values, not stark white.
- Accent: one cyan family for product emphasis, with green reserved mostly for success states.
- Surfaces: subtle tonal shifts, hairline borders, and restrained shadows rather than glassmorphism and glow.
- Navigation: minimal chrome with a single emphasized primary action.
- Motion: quick and subtle; no gratuitous animation.
- Product tone: trustworthy, calm, direct, and technical, not playful or “crypto-first.”

This should feel like Altude, not Fin. The visual direction should borrow the benchmark quality and restraint while remaining grounded in the product’s own brand and ecosystem.

## 8. Design-token and shared-component changes

### Global token changes

- Create semantic color tokens for canvas, surface, elevated surface, primary text, secondary text, borders, brand, success, warning, error, and disabled states.
- Replace color literals in screen code with centralized tokens.
- Standardize spacing, radius, border, elevation, and icon scale around a shared product scale.
- Adopt a single typography scale across all screens, with lightweight fallback handling and explicit platform-safe font selection.
- Define motion and reduced-motion behavior in one place.

### Shared component changes

- `Screen` wrapper to centralize safe-area and keyboard-aware layout.
- `ScreenHeader` for consistent back/close actions and titles.
- `BalanceDisplay` to establish the single oversized value pattern.
- `Button` with primary/secondary/ghost/destructive variants and consistent pressed/disabled states.
- `ListRow` for activity rows and details rows.
- `Field` as a single input primitive.
- `Surface` for cards and panels.
- `TabBar` with better icon affordance and stronger emphasis on the primary action.
- `Sheet` for modal-like pickers and country selection.
- `Toast` to replace multiple OS alerts for low-stakes feedback.
- `Skeleton` for loading placeholders and stable layout.
- `StatusPill` for transactional status semantics.
- `Icon` system built on a local stroke set, not text glyphs or ad hoc shapes.

### State specs

Each primitive should define default, pressed, focused, disabled, loading, selected, success, warning, and error states explicitly. The system should avoid relying on opacity-only feedback because it does not work well for accessibility or device responsiveness.

### Motion guidelines

- Use short press states and transitions; avoid gratuitous animation.
- Respect reduced-motion preferences across all major transitions.
- Keep motion subtle and purposeful, especially on payment progress and loading states.

## 9. Screen-by-screen recommendations

### Send

- Global token improvements only.
- Shared component adoption for buttons, icons, and screen shell.
- Improve pressed state and key feedback.
- Add better accessibility labels to keypad actions.
- Ensure the amount display supports long values and safe resizing.
- Disable the CTA when the value is zero or invalid, removing the alert-driven fallback path.
- No structure change.

### Home

- Rebuild the hierarchy so the balance is the leading element.
- Remove the generic hero treatment that currently elevates a truncated address above the value.
- Move utility actions to a cleaner header pattern.
- Improve row treatment with amount, direction, and date semantics where data allows.
- Use list rows and a balanced spacing model instead of a boxy activity look.

### Onboarding

- Wrap the form in a keyboard-aware scroll layout.
- Replace the ad hoc modal with a proper sheet-like control.
- Improve field spacing and focus states.
- Ensure touch targets and labels remain accessible on small devices.

### PayAddress

- Replace ad hoc header controls with a `ScreenHeader` pattern.
- Use clearer recipient labeling and input treatment.
- Ensure addresses are readable and visually distinct without a heavy card around them.

### History

- Replace card-like rows with a calmer, text-led transaction pattern.
- Fix mislabeling between row action and target screen.
- Replace full-screen spinner jumps with stable skeleton rows under a persistent header.

### Receipt

- Improve row spacing and long-value truncation handling.
- Add a clear status pill and confirmation feedback for copy actions.
- Ensure the header and screen actions align with the app’s global shell.

### PaymentStatus / PreparingAccount

- Preserve the overall experience and stage logic.
- Re-tint the surfaces and status colors.
- Respect reduced motion and live regions.

### Scan

- Ensure the camera preview remains legible under dark surfaces.
- Fix any hook-order or conditional rendering issue.
- Replace the ad hoc close treatment with the app-level header pattern.

## 10. Phased implementation plan

### Phase 0: Baseline and safeguards

- Capture screenshots of all current screens and the most important states.
- Record current lint, type-check, and test behavior as the baseline.
- Add or expand visual regression coverage for screens and repeatable states.
- Do not change tokens or shared primitives in this phase.

### Phase 1: Foundation

- Consolidate semantic tokens.
- Standardize typography roles and fallback behavior.
- Build the shared `Screen`, `Button`, `Field`, `ListRow`, and navigation primitives.
- Remove hard-coded palette fragments and adopt the shared system.
- Apply the dark-mode navigation theme and the shared app shell.

### Phase 2: Highest-impact screens

- Home: lead with balance and fix row hierarchy.
- Onboarding: fix keyboard layout and field treatment.
- History and PayAddress: align to the shared row and header patterns.
- Send: state, token, and accessibility polish only.

### Phase 3: Targeted refinements

- Re-tint payment-state screens and scan previews.
- Fix any remaining misalignment in reduced-motion and focus handling.
- Only refine other screens when the shared-system pass leaves a clear visual weakness.

### Phase 4: States, accessibility, responsiveness, and polish

- Improve empty/loading/error/success states.
- Add accessibility labels, states, and live regions where appropriate.
- Review dynamic type, long values, and small-device safe areas.
- Final visual review and regression pass against the baseline screenshots.

## 11. Exact files/components likely affected in each phase

### Phase 0

- `__tests__/`
- screenshot artifacts under `android/` or session artifacts
- no app source changes expected

### Phase 1

- `src/theme/tokens.ts`
- `src/theme/typography.ts`
- `src/navigation/AppNavigator.tsx`
- `src/components/ui/*`
- `App.tsx`
- shared screen shell components

### Phase 2

- `src/screens/HomeScreen.tsx`
- `src/screens/OnboardingScreen.tsx`
- `src/screens/HistoryScreen.tsx`
- `src/screens/PayAddressScreen.tsx`
- `src/screens/ReceiptScreen.tsx`
- `src/screens/SendScreen.tsx`
- `src/components/BalanceCard.tsx` and related value surfaces

### Phase 3

- `src/screens/PaymentStatusScreen.tsx`
- `src/screens/PreparingAccountScreen.tsx`
- `src/screens/ScanScreen.tsx`
- `src/components/AscentIndicator.tsx`
- `src/components/StageList.tsx`

### Phase 4

- all screen files requiring accessibility labeling and state treatment
- `src/components/ui/Toast.tsx`
- `src/components/ui/Skeleton.tsx`
- all snapshots and related test files

## 12. Risks and regression controls

- Hard-coded colors can persist even after tokenization. Use repo-wide grep and a finish line on legacy color literals.
- Dark-mode changes can degrade camera preview legibility; test the scan flow on-device before sign-off.
- Send flow must remain structurally untouched; compare against the baseline snapshot before finalizing this phase.
- Font adoption may affect packaging and Android rendering if custom fonts are not installed correctly.
- Shared design-system adoption can cause layout churn if done too broadly; use the phase plan to keep the scope bounded.

## 13. Accessibility and responsive requirements

- Ensure all primary color pairings meet AA contrast targets in dark mode.
- Ensure every touch target is at least 44x44 points.
- Provide accessibility labels, roles, and states for all interactive elements.
- Respect reduced motion preferences.
- Review 320pt and 430pt layouts and ensure the value displays do not clip.
- Support longer values, localization expansion, and safe-area insets.
- Ensure empty, loading, error, and slow-network states are clear and consistent.

## 14. Acceptance criteria for each phase

### Phase 0

- Screenshots captured for all core screens and critical states.
- Regression baseline recorded for lint, type-check, and tests.
- No source changes yet.

### Phase 1

- Semantic tokens exist and replace the legacy literals in the app shell.
- Shared primitives are implemented and adopted in the app shell and main navigation.
- Type and motion tokens are centralized.
- No runtime white-flash or dark-mode shell mismatch remains.

### Phase 2

- Home leads with the balance as the largest value.
- Onboarding remains usable with the keyboard open on small devices.
- Send remains structurally unchanged while improving states and accessibility.
- Shared rows and headers are consistent across key screens.

### Phase 3

- The dark scan and payment-state screens remain legible, readable, and accessible.
- No remaining visual defects remain in the most visible screens.

### Phase 4

- No contrast failures remain.
- All core screens pass small-device and large-device checks.
- Reduced-motion and accessibility checks are green.
- Final visual-regression review matches the approved baseline.

## 15. Open questions that truly block implementation

1. Are custom fonts acceptable for the product, or should the app remain system-font-only for performance and maintainability? This affects the final typography finish.
2. Is the app intended to remain dark-only, or is a theme switch planned? This materially changes token architecture and review scope.
3. Is there a device or emulator available for final visual verification beyond the source pass? Camera legibility and small-device details cannot be fully validated without a live device review.
4. Does the history/activity model expose amount, direction, and date values in all relevant states? Without the data, the home row improvement is limited to layout work only.

## App-run status and validation notes

This session confirmed the Metro bundle can be generated successfully:

- `npm run smoke:startup` completed successfully.
- `curl -I http://localhost:8081` responded from Metro, confirming the server is active.
- A live Android emulator or device was not available in this environment (`adb` is not installed), so the actual handset review could not be completed from this session.
- The existing repo already contains visual artifacts and an established dark-fintech direction, which reduces the risk of a completely ungrounded redesign.

This document is intentionally scoped as a planning artifact only and does not modify product code.
