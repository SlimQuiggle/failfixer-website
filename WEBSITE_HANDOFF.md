# FailFixer Website — Handoff Notes

Updated: 2026-02-28

## Current state
- All `data-cta` buttons now route to `beta.html` (beta form), not Lemon Squeezy checkout.
- Beta page includes a **Current features vs Coming soon** section.
- Requested two internal bullets were removed from that section.
- Latest live deploy is on `failfixer.com`.

## Key files
- `assets/js/main.js` — CTA wiring (`wireCTAs`)
- `beta.html` — beta form + feature status section

## Recent commits (website repo)
- `5481be3` — Route all CTA buttons to beta form + add feature status section
- `021c856` — Remove two feature bullets from status section

## Next website tasks
- Keep CTA behavior stable (no checkout redirect in beta campaign period).
- If pricing returns later, add a separate CTA class (do not reuse `data-cta` blindly).
- Keep beta form copy aligned with current app release posture (On-Plate public, In-Air beta).
