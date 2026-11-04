# Agent instructions for QuijoteFinanzas

Before changing the user interface, homepage, CSS, navigation, calculators, QuijoCuentas, QuijoLista or QuijoCartera:

1. Read `PRODUCT.md` for product intent and trust rules.
2. Read `DESIGN.md` for the visual system and anti-patterns.
3. Preserve the existing static GitHub Pages architecture unless a change clearly requires otherwise.
4. Verify current financial data before changing rates, deadlines, costs, returns, taxes or promotions.
5. Do not expose absolute euro amounts in public QuijoCartera UI or screenshots.
6. Do not invent portfolio metrics, risk labels, testimonials or product data for visual purposes.
7. Referral relationships must not determine QuijoCuentas ranking or QuijoLista editorial selection.
8. For visual changes, prefer real product UI/screenshots over generic illustrations or fake dashboards.
9. Run `python scripts/validate-site.py` and `python scripts/check-nav.py` before finishing.
10. When available, run `npx --yes impeccable@3.5.0 detect index.html` as an additional design check. Impeccable findings are diagnostic; deliberate rules in `PRODUCT.md` and `DESIGN.md` take precedence over generic style opinions.

For homepage changes specifically, preserve the editorial/product-first direction: navy + warm gold, Playfair Display + DM Sans, restrained cards/pills, real QuijoCuentas and QuijoCartera visuals, visible newsletter/contact paths, keyboard focus and reduced-motion support.
