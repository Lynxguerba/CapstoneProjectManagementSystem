# 🎓 Student Role – System Concept

The **Student** is the primary actor of the capstone lifecycle.

They:

* Form groups
* Submit titles & concepts
* Upload documents
* Comply with deadlines
* Attend defense
* View verdict
* Deploy and archive their system

So the Student interface should feel like a:

> 📌 **Project Workspace + Submission Portal + Progress Tracker**

---

# 🧭 MAIN STRUCTURE (Student Navigation)

To benchmark with the Instructor concept, your Student module should have:

1. Dashboard
2. My Capstone Group
3. Title Repository (View Only)
4. Concept Submission
5. Documents & Uploads
6. Defense Schedule
7. Evaluation & Feedback
8. Verdict Results
9. Deployment Submission
10. Deadlines & Notifications
11. Profile & Account Settings

---

# 🏠 1. Student Dashboard

### 🎯 Purpose:

Personal capstone progress overview.

### Components:

* 📊 Progress Tracker (Stepper UI)

  * Concept Phase
  * Outline Defense
  * Pre-Deployment Defense
  * Deployment
  * Archived

* 📌 Status Cards:

  * Concept Status
  * Defense Schedule
  * Payment Status
  * Verdict Status

* 📅 Upcoming Schedule

* ⏰ Deadline Countdown

* 🔔 Notifications Panel

---

# 👥 2. My Capstone Group Page

### 🎯 Purpose:

Group management & transparency.

### Sections:

* Group Name
* Section
* Adviser Assigned
* Panel Members (once assigned)
* Member List with Roles:

  * Project Manager / Analyst
  * Programmer
  * Documentarian

### Features:

* Invite / Join Group (if allowed)
* View member responsibilities
* Group progress tracker
* Payment status display

---

# 📚 3. Title Repository (View Only)

Students can check for originality before submitting.

### Components:

* 🔍 Search Bar
* Filter (Approved / Archived / Category)
* Title List Table:

  * Title
  * Year
  * Adviser
  * Status

### System Logic:

* Auto duplication checker when submitting title
* Warning modal if similarity detected

---

# 📝 4. Concept Submission Module

### 🎯 Purpose:

Submit three (3) concepts during Capstone 1.

### Page Structure:

## Concept List Page

* Concept 1 – Status
* Concept 2 – Status
* Concept 3 – Status

Statuses:

* Pending
* Approved
* Rejected
* Resubmit Required

---

## Concept Detail Page

* Concept Title
* Description (Rich Text Editor)
* File Upload (PDF/DOC)
* Submission History
* Adviser Comments
* Resubmit Button (if rejected)

### Important Logic:

* Max 3 submissions
* Lock after approval

---

# 📂 5. Documents & Upload Center

### 🎯 Purpose:

Centralized file management.

### Tabs:

* 📄 Proposal Manuscript
* 📊 Presentation Slides
* 📘 Final Manuscript
* 📦 Supporting Documents

### Features:

* Version control
* Upload history log
* File status (Pending / Routed to Panel / Approved)
* Download previous versions

---

# 🗓 6. Defense Schedule Page

### 🎯 Purpose:

View schedule only (cannot edit).

![Image](https://cdn11.bigcommerce.com/s-10c6f/images/stencil/1280x1280/products/69260/131653/24HR-military-time-board-3624__95010.1629749075.jpg?c=2)

![Image](https://www.assertion-evidence.com/uploads/5/6/1/4/56145985/cover-image_orig.jpg)

![Image](https://graduateschool.nd.edu/assets/342751/400x/grad_defense_room_web.jpg)

![Image](https://about.proquest.com/contentassets/db60e6a04c014c77b01c489ecd9bc7aa/shutterstock_484426825.jpg)

### Page Elements:

* Defense Type:

  * Outline Defense
  * Pre-Deployment Defense
  * Final Defense

* Date

* Time

* Room

* Assigned Panel

* Payment Status (Verified / Not Verified)

### Restriction:

If unpaid → show:

> “Defense scheduling locked until payment verification.”

---

# 🧾 7. Evaluation & Feedback Page

After defense.

### Elements:

* Panel Member List
* Individual Scores
* Comments
* Average Score (Auto-computed)

### Timeline View:

* Submitted Date
* Panel Remarks

Students cannot edit — View only.

---

# ⚖ 8. Verdict Results Page

### 🎯 Purpose:

Official decision transparency.

### Components:

* Consolidated Score Summary

* Final Verdict:

  * ✅ Approved
  * 🔁 Re-Defense Required

* Required Revisions (if applicable)

* Download Evaluation Summary PDF

---

# 🚀 9. Deployment Submission Page

### Purpose:

Submit final deployed system & manuscript.

### Fields:

* Live System URL
* Git Repository Link (optional)
* Final Manuscript Upload
* Deployment Evidence (screenshots)

### Status:

* Pending Verification
* Verified
* Archived (Read-only mode)

---

# ⏰ 10. Deadlines & Notifications

### Components:

* Deadline Table:

  * Concept Deadline
  * Manuscript Deadline
  * Defense Schedule
  * Deployment Deadline

* Countdown Timer

* Color Coding:

  * 🟢 On Track
  * 🟡 Near Deadline
  * 🔴 Overdue

* System Auto Notifications:

  * 3 days before
  * 1 day before
  * Overdue alert

---

# 👤 11. Profile & Account Settings

* Change password
* Update profile
* View academic details
* Role display (Student)
* Group membership info

---

# 🧩 Core Student UI Components (Technical)

To align with Instructor architecture:

* Sidebar Navigation
* Header with Role Badge
* Progress Stepper Component
* Reusable Data Table
* File Upload Component (with validation)
* Status Badge Component
* Timeline Component
* PDF Preview Modal
* Notification Toast System

---

# 🔐 Student Permission Matrix

Student CAN:
✔ Create / Join group
✔ Submit concepts (max 3)
✔ Upload documents
✔ View schedules
✔ View evaluation & verdict
✔ Submit deployment

Student CANNOT:
❌ Assign panel
❌ Schedule defense
❌ Approve concepts
❌ Edit evaluation scores
❌ Finalize verdict

---

# 🔁 Student Workflow (Connected to Instructor Flow)

Student logs in →
Create group →
Check Title Repository →
Submit 3 concepts →
Adviser reviews →
Instructor monitors →
Panel assigned →
Defense scheduled →
Panel evaluates →
Instructor finalizes verdict →
Student views result →
Submit deployment →
Instructor archives

This keeps both modules synchronized.

---

# 🏗 Suggested Frontend Folder Structure

```
Student/
 ├── Dashboard.tsx
 ├── Group/
 │    ├── GroupDetails.tsx
 ├── Titles/
 ├── Concepts/
 │    ├── ConceptList.tsx
 │    ├── ConceptForm.tsx
 ├── Documents/
 ├── Schedule/
 ├── Evaluation/
 ├── Verdict/
 ├── Deployment/
 ├── Deadlines/
 ├── Profile/
```

---

# 🎯 Final Architecture Summary

Student Module =
**Submission + Tracking + Compliance + Transparency**

Instructor = Control Center
Student = Project Workspace

Both modules are tightly connected through:

* Status updates
* Role-based routing
* Controlled permissions
* Automated workflow transitions
