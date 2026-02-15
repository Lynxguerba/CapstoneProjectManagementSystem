Great. Let’s design the **Adviser Role** clearly and structurally so you can visualize the full workflow inside your **Capstone Project Management System (CPMS)**.

Since your system behaves like a project management system, the **Adviser** acts as:

> 🎓 Academic Gatekeeper
> 📂 Document Reviewer
> 📊 Progress Evaluator
> 🖊 Approval Authority (before panel level)

---

# 🎯 ADVISER ROLE CONCEPT

## 👤 Main Responsibilities of Adviser

Based on your modules:

* Review and approve/reject project concepts
* Guide assigned capstone groups
* Review and comment on documents (Outline, Pre-Oral, Final, etc.)
* Validate readiness for defense
* Provide evaluation and recommendations
* Monitor group progress
* Participate in minutes & approval sheet signing

---

# 📂 Proposed Adviser File Structure

```markdown
📂 pages
└── 📂 Adviser/
    ├── 📄 _layout.tsx
    ├── 📄 dashboard.tsx
    ├── 📄 groups.tsx
    ├── 📄 group-details.tsx
    ├── 📄 concepts.tsx
    ├── 📄 documents.tsx
    ├── 📄 evaluations.tsx
    ├── 📄 schedule.tsx
    ├── 📄 verdict.tsx
    ├── 📄 minutes.tsx
    ├── 📄 notifications.tsx
    ├── 📄 deadlines.tsx
    ├── 📄 reports.tsx
    ├── 📄 settings.tsx
```

Now let’s break down each page.

---

# 📊 1. `dashboard.tsx`

## 🎯 Purpose:

Quick overview of adviser’s assigned groups.

## UI Components:

* 📈 Summary Cards:

  * Total Assigned Groups
  * Pending Concept Reviews
  * Pending Document Reviews
  * Upcoming Defenses
* 📅 Upcoming Schedule List
* 🔔 Recent Notifications
* 📌 Quick Actions:

  * Review Concepts
  * View Documents
  * Approve Submission

---

# 👥 2. `groups.tsx`

## 🎯 Purpose:

List all groups assigned to this adviser.

## Components:

* Search & filter (by status)
* Table:

  * Group Name
  * Members
  * Current Phase
  * Concept Status
  * Document Status
  * Defense Schedule
  * Actions (View Details)

---

# 📄 3. `group-details.tsx`

## 🎯 Purpose:

Full academic view of a single group.

## Sections:

### 📌 Group Information

* Group Name
* Members & Roles (PM, Programmer, Documentarian)
* Assigned Panel
* Payment Status

### 📊 Project Status Tracker (Stepper UI)

* Concept Submitted
* Concept Approved
* Outline Defense
* Pre-Oral
* Final Defense
* Deployment

### 📂 Documents Overview

* Submitted Files
* Adviser Comments
* Revision History

---

# 💡 4. `concepts.tsx`

## 🎯 Purpose:

Manage concept submissions (3 proposals).

## Features:

* View 3 submitted concepts
* Compare originality (linked to Title Repository)
* Approve / Reject / Request Revision
* Add feedback comment
* Change concept status:

  * Pending
  * Approved
  * Rejected
  * For Revision

## Validation Logic:

* Only 1 concept can be marked as Approved
* Once approved → Lock editing

---

# 📑 5. `documents.tsx`

## 🎯 Purpose:

Review phase-based documents.

### Document Types:

* Chapter 1–3 (Outline)
* Full Manuscript (Pre-Oral)
* Revised Manuscript
* Final Copy
* Deployment Docs

## Components:

* File preview
* Download button
* Comment section
* Status update:

  * Approved
  * For Revision
  * Rejected

---

# 📝 6. `evaluations.tsx`

## 🎯 Purpose:

Adviser scoring & recommendation.

Even if adviser is not a panel, they may:

* Provide internal grading
* Recommend for defense
* Recommend for re-defense

## Components:

* Rubric scoring form
* Text feedback
* Recommendation dropdown:

  * Ready for Defense
  * Needs Revision

---

# 📅 7. `schedule.tsx`

## 🎯 Purpose:

View defense schedules of assigned groups.

## Components:

* Calendar view
* List view:

  * Date
  * Time
  * Room
  * Panel Members
* Defense Status:

  * Scheduled
  * Completed
  * Re-Defense

---

# 🏁 8. `verdict.tsx`

## 🎯 Purpose:

View consolidated verdict from panel.

Adviser can:

* View evaluation breakdown
* See final decision:

  * Approved
  * Re-Defense
* Add Adviser remarks
* Acknowledge decision

---

# 📋 9. `minutes.tsx`

## 🎯 Purpose:

Access generated Minutes of Meeting.

## Features:

* Auto-generated minutes preview
* Download PDF
* Attach Digital Signature
* Approve Minutes

---

# 🔔 10. `notifications.tsx`

## 🎯 Purpose:

System alerts.

Examples:

* Concept submitted
* Document revised
* Defense scheduled
* Deadline approaching

---

# ⏰ 11. `deadlines.tsx`

## 🎯 Purpose:

View instructor-set deadlines.

Adviser can:

* View submission deadlines
* Request deadline extension
* Approve student extension requests (optional rule)

---

# 📊 12. `reports.tsx`

## 🎯 Purpose:

Performance and monitoring analytics.

### Reports:

* Group Progress Summary
* Concept Approval Rate
* Defense Outcomes
* Revision Frequency
* Deployment Completion Status

---

# ⚙️ 13. `settings.tsx`

* Profile Management
* Change Password
* Notification Preferences

---

# 🔁 Adviser Workflow Flow (Visual Concept)

```
Student submits concept
        ↓
Adviser reviews concept
        ↓
Approve / Reject / Revise
        ↓
Student submits documents
        ↓
Adviser reviews & approves
        ↓
Defense scheduled
        ↓
Panel evaluates
        ↓
Verdict released
        ↓
Adviser signs minutes & approval sheet
```

---

# 🧠 Adviser System Permissions

| Action                 | Allowed? |
| ---------------------- | -------- |
| Approve Concept        | ✅        |
| Assign Panel           | ❌        |
| Set Defense Schedule   | ❌        |
| Review Documents       | ✅        |
| Give Evaluation        | ✅        |
| Final Verdict Override | ❌        |
| Sign Approval Sheet    | ✅        |

---

# 🏗 UI Architecture Concept (Material UI Friendly)

Use:

* `Drawer` for sidebar navigation
* `Stepper` for phase tracking
* `DataGrid` for group tables
* `Dialog` for approve/reject modal
* `Tabs` inside Group Details:

  * Overview
  * Concepts
  * Documents
  * Evaluation
  * Schedule
  * Verdict

---

# 🎓 Adviser Role Summary

The Adviser module is:

> 🔍 Academic Reviewer
> 🧑‍🏫 Project Mentor
> 📄 Document Validator
> 🖊 Pre-Defense Authority

---