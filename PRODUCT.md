# Gatepass Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

A modular monolith in NestJS with a Next.js frontend, PostgreSQL, Docker, Redis, and BullMQ. The monorepo contains `backend/` and `frontend/`; deploy the backend from Render and the frontend from Vercel.

## Users

Organizers sign up, create projects, switch between projects, and manage multiple events inside each project. Attendees open a shared event page, review its details and ticket types, and buy tickets when checkout is configured. Gatepass staff use a separate admin dashboard.

## Product Purpose

Gatepass is a multi-tenant ticketing platform. The initial slice supports account onboarding, project creation and switching, event and ticket-type creation, publishing shareable pages, and platform administration.

## Revenue

Gatepass charges a 3% platform fee per paid order (300 basis points). Payment provider selection, settlement handling, and production credentials are supplied by the user and remain outside this codebase until configured. Do not claim payment is active while checkout is unconfigured.

## Operating Context

Projects are organizer workspaces and can contain multiple events. Each project has a public event listing, and every published event has its own public page with details and ticket types.

## Capabilities and Constraints

- Organizers can register, create/switch projects, create events, configure ticket types, and publish shareable links.
- PostgreSQL is the application database; Redis and BullMQ provide queue infrastructure.
- Admin access is restricted by the backend `ADMIN_EMAILS` allowlist.
- A dedicated demo seed creates five dated sample events and a demo organizer account; it must not create false attendee, sales, or revenue figures.
- Live payment collection is not enabled until the payment provider and credentials are configured.

## Brand Commitments

Use Gatepass as the working product name. The user selected the Waymark Leadership Framer template as the frontend reference: editorial serif headings, restrained sans-serif UI, white and sage surfaces, forest-green actions, mint highlights, and generous spacing.

## Evidence on Hand

No payment provider, customer testimonials, sales history, or logo assets have been supplied. Demo event listings are clearly isolated in the Gatepass Demo project.
