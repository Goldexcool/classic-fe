# Gatepass frontend design

## Reference

Use the user-selected Waymark Leadership Framer template as the visual reference. Carry over its editorial serif headings, restrained sans-serif UI, white and sage surfaces, deep forest-green actions, mint highlights, and generous spacing.

## Organizer dashboard

- The primary task is creating an event and its ticket types, then publishing a tenant and event link.
- Lead with the task and a useful empty state. Do not invent attendees, revenue, event counts, customer quotes, or ratings.
- Use a responsive workspace layout. Keep navigation compact and let event creation work as a focused page or panel.
- Use visible labels, keyboard focus, clear loading and error states, and mobile layouts that keep the form usable.
- Use `gatepass.usevoii.com` as the canonical site origin. Public DNS and deployment routing are configured separately.

## UI rules

- Display voice: Hedvig Letters Serif, with a reliable serif fallback.
- Interface voice: Hedvig Letters Sans, with a readable sans-serif fallback.
- Background: warm off-white; secondary surfaces: soft sage; text and primary action: deep forest; mint signals success or a published state.
- Keep borders light and surfaces flat; use shadows only to lift an active popover or dialog.
- Avoid decorative gradients, fabricated metrics, dead navigation, and decorative icon tiles.
