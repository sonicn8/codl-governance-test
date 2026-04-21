# codl-governance-test

Test repo for Codl Phase 5.0 end-to-end verification.

This repo exists to exercise Codl's governance pipeline against real
GitHub webhook events: installations, pushes, and pull requests. The
code here is intentionally simple — the value is the intent contract
attached to it, not the code itself.

## Modules

- `src/pricing.ts` — order pricing with promo codes, tax, and free-
  shipping threshold. Plausible business logic where semantic intent
  matters and governed changes are meaningful.
