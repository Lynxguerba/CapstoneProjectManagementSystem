# 🎓 Instructor Role – System Concept

The **Instructor** is the academic controller of the capstone flow.
They:

* Monitor groups
* Manage deadlines
* Validate requirements
* Oversee scheduling
* Finalize decisions
* Generate official documents

So their interface should feel like a **Control Center**.

---

# 🧭 MAIN STRUCTURE (Instructor Navigation)

Your Instructor module should have:

1. Dashboard
2. Groups Management
3. Title Repository
4. Concept Review
5. Defense Scheduling
6. Panel Evaluation Monitoring
7. Verdict Management
8. Minutes & Approval Sheet Generator
9. Deadline Management
10. Deployment & Archiving
11. Notifications
12. Reports & Analytics
13. Profile & Account Settings

Now let’s break them down properly.

---

# 🏠 1. Instructor Dashboard

### Purpose:

Quick overview of all capstone activities.

### Components:

* 📊 Statistics Cards

  * Total Groups
  * Pending Concepts
  * Scheduled Defenses
  * Re-Defense Cases
  * Approved Projects
* 📅 Upcoming Defenses (Table)
* ⏰ Upcoming Deadlines
* 🔔 Notifications Panel
* 📈 Charts (optional but powerful)

  * Approval Rate
  * Defense Status Distribution

---

# 👥 2. Capstone Groups Management Page

### Purpose:

View and manage all project groups.

### Page Elements:

* Search bar
* Filter (Section, Status, Adviser)
* Data Table:

  * Group Name
  * Members
  * Assigned Adviser
  * Concept Status
  * Defense Status
  * Payment Status
  * Actions (View / Assign Panel / Schedule)

### Sub-Page:

👉 Group Details Page

* Members with roles (PM, Programmer, etc.)
* Uploaded Documents
* Payment Status
* Adviser
* Panel Members
* Defense Schedule

---

# 📚 3. Title Repository Management

### Purpose:

Oversee all submitted titles.

### Elements:

* Search & filter (Approved, Pending, Rejected)
* Title duplication checker
* Table:

  * Title
  * Group
  * Adviser
  * Status
  * Date Submitted

### Actions:

* View Title Details
* Mark as Approved (if instructor controls this)
* Archive Title

---

# 📝 4. Concept Review Monitoring

Even if adviser approves, instructor monitors.

### Page Sections:

* Pending Concepts
* Approved Concepts
* Rejected Concepts

### Inside Concept Details:

* Concept description
* File attachment
* Adviser comments
* Submission history
* Status timeline

---

# 🗓 5. Defense Scheduling Page

### Purpose:

Centralized scheduling control.

### Components:

* Calendar View
* Schedule Table:

  * Group
  * Date
  * Time
  * Room
  * Panel Members
  * Payment Status
* Add Schedule Button
* Conflict detection logic (no overlapping room/time)

---

# 💰 6. Payment Validation Monitor

### Page:

* List of groups
* Payment status
* Upload receipt (if needed)
* Verified / Not Verified badge
* Restrict scheduling if unpaid

---

# 🧾 7. Panel Evaluation Monitoring

Instructor does not input evaluation but oversees.

### Elements:

* Evaluation Status per Panel
* Scores Summary
* Average Score Auto Computation
* Panel Comments Viewer

### Table:

* Group
* Panel Member
* Score
* Remarks
* Submitted Date

---

# ⚖ 8. Verdict Decision Page

### Purpose:

Finalize decision.

### Elements:

* Consolidated Scores
* Panel Recommendations
* System Suggested Verdict (optional AI logic)
* Buttons:

  * Approve
  * Re-Defense
* Verdict history log

---

# 🖨 9. Minutes & Approval Sheet Generator

### Page Sections:

* Select Group
* Auto-filled:

  * Title
  * Members
  * Adviser
  * Panel
  * Verdict
* Generate:

  * 📄 Minutes PDF
  * 📑 Approval Sheet PDF
* Digital Signature Preview
* Download & Archive Button

---

# ⏰ 10. Deadline Management

### Page Elements:

* Set Deadline (Concept, Proposal, Final Manuscript, Defense)
* Extend Deadline
* Add Reason for Extension
* Deadline Countdown Display

### Important:

* Auto notification 3 days before deadline
* Color coding:

  * Green – On Track
  * Yellow – Near Deadline
  * Red – Overdue

---

# 🚀 11. Deployment Verification & Archiving

### Purpose:

Verify final system output.

### Page:

* Upload deployed system link
* Upload final manuscript
* Check deployment status
* Archive button (lock group record)

Archived = read-only

---

# 🔔 12. Notifications Center

### Types:

* Concept submitted
* Adviser approved
* Panel evaluation submitted
* Deadline approaching
* Payment verified

---

# 📊 13. Reports & Analytics

Very important for capstone defense presentation.

### Reports:

* Approval rate per semester
* Average panel score
* Number of re-defenses
* Title categories
* Adviser workload

Export:

* PDF
* Excel

---

# 🧩 Core Components You Must Build (Technical View)

### UI Components

* Sidebar Navigation
* Header with User Info
* Stats Card Component
* Reusable Data Table Component
* Modal Component
* File Upload Component
* Calendar Component
* PDF Generator
* Notification Toast System

---

# 🔐 Instructor Permissions Matrix

Instructor CAN:
✔ View all groups
✔ Set deadlines
✔ Assign panel
✔ Schedule defense
✔ Validate payment
✔ Finalize verdict
✔ Generate official documents
✔ Archive projects

Instructor CANNOT:
❌ Edit student documents
❌ Submit panel scores

---

# 💡 Recommended UX Flow

Instructor logs in →
Dashboard →
Check pending concepts →
Set deadlines →
Assign panel →
Schedule defense →
Review evaluation →
Release verdict →
Generate documents →
Archive

---

# 🏗 Suggested Folder Structure (Frontend Example)

```
Instructor/
 ├── Dashboard.tsx
 ├── Groups/
 │    ├── GroupsList.tsx
 │    ├── GroupDetails.tsx
 ├── Titles/
 ├── Concepts/
 ├── Scheduling/
 ├── Evaluation/
 ├── Verdict/
 ├── Minutes/
 ├── Deadlines/
 ├── Reports/
```

---

# 🎯 Final Architecture Summary

Instructor Module =
**Monitoring + Control + Final Approval + Documentation**

It acts as the **academic command center** of the whole capstone system.

---

If you want, next we can:

* Design the **database tables for Instructor module**
* Or create a **UI wireframe layout**
* Or define the **role-based access control logic**
* Or create the **ER Diagram concept**

Tell me what you want to build next 🚀
