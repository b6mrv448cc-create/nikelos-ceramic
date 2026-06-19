# Design System — Nikolos Ceramic

## Brand
Personal handmade ceramics brand. Warm, calm, honest. Feels like a master's studio — not a shop.

## Palette
- `--cream`: #F7F3EE — background main
- `--warm-white`: #FDFAF6 — hero bg, cards
- `--sand`: #E8DECE — subtle accents, borders
- `--beige-gray`: #C9BFB0 — muted text, lines
- `--graphite`: #3A3530 — headings, strong text
- `--graphite-light`: #6B6059 — body text
- `--accent`: #A08060 — CTA buttons, links
- `--accent-dark`: #7A5F42

## Typography
- Display: `Cormorant Garamond` — titles, big headings (elegant, serif)
- Body: `Jost` — clean modern sans for body text, labels
- Google Fonts: `Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400` + `Jost:wght@300;400;500`

## Spacing
- Generous negative space. Sections breathe. No crowding.
- Section padding: 120px top/bottom desktop, 80px mobile
- Max content width: 1200px

## Motion
- Fade + slight translate-Y on scroll (IntersectionObserver)
- Hero: scale from 1.05 → 1.0 on load, opacity 0 → 1
- Cards: translateY(-6px) + box-shadow on hover
- Scroll-linked: feature ceramic slowly rotates in parallax
- All transitions: cubic-bezier(0.25, 0.46, 0.45, 0.94) or ease-out
- Duration: 0.6–1.2s. Nothing fast. Nothing bouncy.

## Visual Style
- Photography: natural light, neutral backgrounds, close-up textures
- Cards: no borders, subtle cream bg, generous padding
- Buttons: simple, understated. Primary = graphite fill. Secondary = ghost with graphite border
- Icons: none or very minimal, Lucide at 18px max
- No shadows on text. Generous letter-spacing on uppercase labels (+0.15em)
