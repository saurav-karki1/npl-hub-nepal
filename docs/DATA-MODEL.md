# NPL Hub Nepal — Data Model

## Purpose

This document defines the main data entities required by NPL Hub Nepal.

The initial website may use static/mock data.

A database such as Supabase will be introduced later when dynamic data and an admin system are required.

## Main Entities

### 1. Season

Stores tournament season information.

Fields:

* id
* name
* year
* start_date
* end_date
* status

Example:

`NPL Season 3`

### 2. Team

Stores NPL team information.

Fields:

* id
* name
* short_name
* logo
* city
* description

### 3. Player

Stores player information.

Fields:

* id
* name
* photo
* team_id
* nationality
* role
* batting_style
* bowling_style

Possible roles:

* Batter
* Bowler
* All-rounder
* Wicketkeeper

### 4. Match

Stores tournament match information.

Fields:

* id
* season_id
* match_number
* team_a_id
* team_b_id
* date
* time
* venue
* status
* winner_id

Possible statuses:

* Upcoming
* Live
* Completed
* Abandoned
* Postponed

### 5. Match Score

Stores match scoring information.

Fields:

* id
* match_id
* team_id
* runs
* wickets
* overs

More detailed ball-by-ball data can be added later if required.

### 6. Points Table

Stores or calculates team standings.

Fields:

* team_id
* matches_played
* wins
* losses
* ties
* no_results
* points
* net_run_rate

The points table should eventually be calculated from match results rather than manually duplicated wherever possible.

### 7. Player Statistics

Stores tournament statistics.

Fields:

* player_id
* matches
* runs
* batting_average
* strike_rate
* wickets
* bowling_average
* economy_rate

Additional statistics can be added later.

### 8. News Article

Stores NPL news content.

Fields:

* id
* title
* slug
* excerpt
* content
* featured_image
* author
* published_at
* updated_at
* category

### 9. Venue

Stores match venue information.

Fields:

* id
* name
* city
* location
* image
* capacity

### 10. Ticket Information

Stores verified ticket information when available.

Fields:

* id
* match_id
* provider
* price
* purchase_url
* availability
* updated_at

Ticket information must be verified before publication.

## Relationships

```text
Season
  │
  ├── Teams
  │     │
  │     └── Players
  │
  └── Matches
        │
        ├── Team A
        ├── Team B
        ├── Venue
        ├── Score
        └── Result

Players
  │
  └── Player Statistics

News Articles
  └── Independent content

Tickets
  └── Match
```

## Data Principles

* Never invent real tournament data.
* Verify important data before publishing.
* Keep data separate from UI components.
* Use reusable data structures.
* Avoid duplicating the same information in multiple places.
* Prefer calculated values for statistics and points tables when practical.
* Keep the data model flexible enough for future live-score functionality.

## Development Approach

### Phase 1

Use local/static data to build and test the UI.

### Phase 2

Create structured data files or a simple data layer.

### Phase 3

Connect Supabase.

### Phase 4

Build an admin dashboard for updating:

* Teams
* Players
* Matches
* Results
* Scores
* Points
* News
* Ticket information

### Phase 5

Add live data functionality if a reliable and permitted data source is available.
