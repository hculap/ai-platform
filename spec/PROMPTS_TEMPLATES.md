Here’s a clean English translation of your idea, structured as a short, ready-to-use product spec.

Prompt Templates Library — Product Requirements

1) Summary

In
4.1troduce a Prompt Templates Library where users can browse ready-made sales/marketing prompts. Each template can be auto-filled with the user’s own data (e.g., business profile, competitors). Users can then copy & paste the final prompt into any chat/LLM tool. Templates are organized by categories and show requirements (e.g., “requires competitors”). If required data is missing, the UI clearly indicates this and guides the user to generate it first.

2) Goals & Non-Goals

Goals
	•	Provide curated, categorized prompt templates.
	•	Personalize templates using user data (business profile, competitors, etc.).
	•	One-click copy of the personalized prompt.
	•	Clearly indicate data dependencies and missing data.

Non-Goals (for now)
	•	In-app LLM execution of prompts (the feature focuses on generation + copy).
	•	Community marketplace or user-to-user template sharing.
	•	Complex workflow automation (outside simple autofill).

3) Key Concepts
	•	Prompt Template: A reusable text with placeholders (tokens) that can be auto-filled with user data.
	•	Placeholder/Token: A variable in the template (e.g., {{business_profile.name}}, {{competitors.top_3}}).
	•	Data Dependency: A requirement that certain user data must exist to render the template (e.g., competitors list).

4) Functional Requirements

4.1 Template Catalog
	•	Users can browse a list/grid of templates with name, short description, category badges, and dependency badges.
	•	Filters: by category, dependency (e.g., “doesn’t require competitors”), and popularity/recent.
	•	Search: full-text search over title/description.

4.2 Categories
	•	Each template belongs to at least one category (e.g., Sales, Marketing, Copywriting, Outreach, Social, Ads).
	•	Users can filter by one or more categories.

4.3 Template Content & Structure
	•	A template includes:
	•	Title
	•	Description/Use case
	•	Category/Tags
	•	Content (the prompt text) with placeholders
	•	Dependencies (e.g., requires business profile, requires competitors)
	•	Notes (optional tips for usage)

4.4 Personalization (Autofill) Function
	•	When viewing a template, user can click “Personalize”.
	•	The system resolves placeholders from the user’s stored data.
	•	Example sources: Business Profile, Competitors, other available datasets.
	•	If a placeholder requires a choice (e.g., pick which business profile), show a selector to choose one.
	•	If required data is missing, show a clear warning and link to generate/fill that data.

4.5 Copy & Export
	•	After autofill, show a read-only Rendered Prompt with a Copy button.
	•	Provide “Copy with Markdown” vs “Copy as Plain Text” (if formatting present).

4.6 Dependency Handling
	•	Each template declares its required data elements (e.g., requires_competitors).
	•	In catalog and detail, show status: “Ready to use” or “Missing: Competitors”.
	•	If missing, display a CTA to create/fetch the missing data (e.g., “Generate competitors now”).

4.7 Empty States
	•	If the user has no business profile/competitors:
	•	Catalog still visible, but templates that require them are marked Unavailable with guidance.
	•	Provide a quick path to create the needed data.

4.8 Roles & Access
	•	End users: browse, personalize, copy.
	•	Admins/Editors: create, edit, categorize templates; set dependencies; publish/unpublish.

4.9 Versioning (Nice-to-have)
	•	Track template version and changelog.
	•	Show last updated date.
0 Analytics (Nice-to-have)
	•	Track views, personalizations, copies per template.
	•	Filter catalog by Most used.

5) Placeholder & Autofill Specification

Placeholder syntax (example):
	•	{{business_profile.name}}
	•	{{business_profile.value_proposition}}
	•	{{competitors.top_3}} → renders as a concise, comma-separated list or short bullets
	•	{{competitors.compare_table}} → optional richer block (if supported)

Resolution rules
	•	If a placeholder requires a single entity, default to the primary one; allow user override via selector.
	•	If a placeholder needs a list, provide a formatting rule (comma-separated or bullet list).
	•	If data is missing:
	•	If required → block rendering; show guidance.
	•	If optional → render a labeled placeholder (e.g., “[Add competitor insights]”) and flag it visually.

Example template (content excerpt):

You are a sales strategist. Using the following context:
- Business: {{business_profile.name}} — {{business_profile.value_proposition}}
- Top competitors: {{competitors.top_3}}

Write an outreach message for LinkedIn DM targeting {{business_profile.ideal_customer_profile.short}}.
Focus on differentiation versus {{competitors.top_1}}.

6) UX Flows & Views

Catalog View
	•	Header: search + filters (categories, dependency availability, sort).
	•	Cards: title, description, badges (category, requires competitors/business profile), “Ready”/“Missing data” status.
	•	Actions: View.

Template Detail View
	•	Header: title, categories, updated date, usage stats (optional).
	•	Body tabs:
	•	Overview (description, dependencies, notes)
	•	Template (raw text with placeholders)
	•	Personalize (form/selector + preview)
	•	Footer: Personalize button.

Personalization Drawer/Modal
	•	Selectors for data choices (e.g., choose business profile).
	•	“Resolve placeholders” button.
	•	Rendered Prompt panel with Copy.

Missing Data Dialog
	•	Shows what’s missing and a CTA to create/generate.
	•	Returns to personalization on completion.

7) Acceptance Criteria (samples)
	1.	Catalog filtering

	•	Given templates exist across multiple categories
	•	When I filter by “Marketing”
	•	Then only Marketing templates appear.

	2.	Dependency badge

	•	Given a template requires competitors
	•	When the user has no competitors in the system
	•	Then the template card shows “Requires competitors” and status “Unavailable”.

	3.	Personalization with choice

	•	Given a user has multiple business profiles
	•	When Personalize is opened
	•	Then the user can select which profile to use, and placeholders resolve accordingly.

	4.	Missing data block

	•	Given a required dependency is missing
	•	When user clicks Personalize
	•	Then personalization is blocked and a guided CTA to generate that data is shown.

	5.	Copy prompt

	•	Given a prompt is rendered
	•	When Copy is clicked
	•	Then the full rendered text (placeholders resolved) is placed on the clipboard without placeholders.

8) Edge Cases
	•	User has data but with empty fields → treat as missing for the affected placeholder; show which fields are empty.
	•	Template references deprecated placeholders → show an error to admins; hide from users until fixed.
	•	Long outputs (e.g., competitor tables) → provide a compact vs expanded rendering option.

9) Permissions & Safety
	•	Only public, non-sensitive user data is injected.
	•	No PII beyond what the user has already chosen to store and mark as usable for prompts.
	•	Admins can mark any template as Internal (hidden from end users).

10) Open Questions
	•	Which placeholder syntax do we standardize on (double-braces vs. ${})?:
        double-braces 
	•	Do we allow optional fallback text, e.g., {{competitors.top_3 | "no competitors yet"}}?
        No
	•	Should users be able to save their personalized prompt as a reusable “My Prompt”?
        They are generated on demand so no need for now
	•	Do we need multi-language versions of templates now or later?
        Now, wee neeed PL and EN localization automaticly fit user business profile language (or system profile)
