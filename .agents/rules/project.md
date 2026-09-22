---
trigger: always_on
---

# NPL Hub Nepal — Antigravity Project Rules

## Project Identity

You are working on **NPL Hub Nepal**, an independent Nepal Premier League information platform.

The website is not affiliated with or presented as the official NPL or Cricket Association of Nepal website.

## Core Rule

**Do not start building the entire project automatically.**

Only implement the specific task requested by the user.

Before implementing a major feature:

1. Inspect the existing project.
2. Understand the relevant files.
3. Explain the implementation approach when necessary.
4. Make a focused plan.
5. Implement only the requested scope.
6. Test the result.
7. Check the UI visually when applicable.

## Preserve Existing Work

Do not unnecessarily:

* Rewrite working components
* Replace the existing architecture
* Change unrelated files
* Add unnecessary dependencies
* Change the design system without a reason
* Remove existing functionality

For small fixes, make the smallest reasonable change.

## Technology

Preferred stack:

* Next.js
* TypeScript
* Tailwind CSS
* GitHub
* Vercel

Supabase should be introduced later when database functionality is required.

## Design Rules

The website should look like a professional sports-media platform.

Prefer:

* Strong typography
* Clear hierarchy
* Cricket/sports imagery
* Scoreboards
* Tables
* Match cards
* Editorial layouts
* Information density
* Consistent spacing
* Mobile-first responsive design

Avoid:

* Excessive gradients
* Glassmorphism
* Excessive rounded cards
* Excessive shadows
* Generic SaaS dashboard layouts
* Unnecessary animations
* Decorative blobs
* Random icons
* Visual effects without a functional purpose

Do not make every section look like a floating card.

## Data Accuracy

Never invent real-world NPL information.

Do not invent:

* Match dates
* Match results
* Player statistics
* Team information
* Ticket prices
* Broadcasting information
* News
* Venues

When real data is required, use verified sources.

Keep external data separate from presentation components.

## Content

NPL Hub Nepal should provide useful original content.

Do not copy articles, images, statistics, commentary, or other copyrighted material without appropriate permission or licensing.

Do not make the website appear officially affiliated with NPL or CAN.

## SEO

Follow the project's `docs/SEO.md`.

Every important page should have:

* Appropriate title
* Meta description
* Clear H1
* Clean URL
* Internal links
* Mobile-friendly layout
* Appropriate structured data where applicable

## Responsive Design

Every UI feature must work on:

* Mobile
* Tablet
* Desktop

Do not design desktop first and ignore mobile behavior.

## Accessibility

Maintain:

* Good contrast
* Keyboard accessibility
* Visible focus states
* Meaningful alt text
* Semantic HTML
* Accessible buttons and links

## Performance

Prefer:

* Optimized images
* Efficient components
* Minimal unnecessary JavaScript
* Reusable components
* Fast page loading

Do not add libraries when existing functionality can solve the problem.

## Code Quality

Use:

* Clear component names
* Meaningful variable names
* Reusable components
* TypeScript types
* Consistent formatting

Avoid unnecessary abstraction.

Do not create a complex architecture for a simple feature.

## Implementation Workflow

### Small Task

For a small task:

1. Inspect relevant code.
2. Make the smallest change.
3. Test it.
4. Report what changed.

### Major Feature

For a major feature:

1. Explore the project.
2. Identify affected files.
3. Create an implementation plan.
4. Wait for the user's approval when the change has significant architectural impact.
5. Implement the feature.
6. Test it.
7. Review the UI.
8. Fix obvious issues.

## AI Design Prevention

Do not use generic AI-generated website patterns simply because they are visually popular.

The final website should feel intentionally designed for **Nepal Premier League cricket**.

Every visual element should have a purpose.

When choosing between visual complexity and usability, prioritize usability.

## Current Development Stage

The project is currently in the **planning and foundation stage**.

The project documentation is being prepared before implementation.

Do not build the complete website unless explicitly instructed.

## Source of Truth

Use these documents as project references:

* `docs/PROJECT.md`
* `docs/SITEMAP.md`
* `docs/DESIGN.md`
* `docs/DATA-MODEL.md`
* `docs/SEO.md`

If a new decision conflicts with an existing document, identify the conflict before making a major change.
