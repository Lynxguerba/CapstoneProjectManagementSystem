Perfect 👌 Let’s now design the **Student Module** of your **Capstone Project Management System (CPMS)** properly and professionally.

The **Student role** is the execution side of the capstone process.
They submit, upload, respond to feedback, prepare for defense, and comply with deadlines.

So their interface should feel like a:

> 🎯 **Project Workspace + Submission Portal + Progress Tracker**

---

# 🎓 STUDENT ROLE – SYSTEM CONCEPT

## 🔐 Student Core Capabilities

Students should be able to:

* Manage their group
* Submit project concepts
* Upload documents
* View adviser feedback
* Track deadlines
* View defense schedule
* See evaluation results
* Download official documents
* Submit deployment requirements

---

# 🧭 MAIN NAVIGATION (Student Sidebar)

1. Dashboard
2. My Group
3. Title Repository
4. Concept Submission
5. Document Submission
6. Defense Schedule
7. Evaluation Results
8. Minutes & Approval Sheet
9. Deployment Submission
10. Notifications
11. Profile & Settings

Now let’s break each one down clearly.

---

# 🏠 1. Student Dashboard

### 🎯 Purpose:

Quick overview of their capstone progress.

### Components:

#### 📊 Progress Cards

* Group Status
* Concept Status
* Defense Status
* Payment Status
* Final Verdict

#### ⏰ Deadline Tracker

* Countdown Timer
* Status Color Indicator

#### 📝 Recent Adviser Feedback

#### 📅 Upcoming Defense Schedule

#### 🔔 Notifications Panel

---

# 👥 2. My Group Page

### 🎯 Purpose:

Group information and collaboration visibility.

### Components:

#### Group Info Card

* Group Name
* Section
* Adviser
* Panel Members

#### Members Table

* Name
* Role (PM / Programmer / Documentarian)
* Email

#### Group Status Timeline

* Concept Submitted
* Concept Approved
* Proposal Defense
* Final Defense
* Deployment

---

# 📚 3. Title Repository Page

### 🎯 Purpose:

Check originality before submitting concept.

### Components:

* Search bar
* Filter (Year / Category / Adviser)
* List of Approved Titles
* Duplicate Detection Warning (real-time validation)

---

# 📝 4. Concept Submission Page

### 🎯 Purpose:

Submit 3 required concepts (Capstone 1)

### Page Structure:

#### Section A – Concept Form

* Title
* Abstract / Description
* Category
* Technology Stack
* Upload File (optional)

#### Section B – Submitted Concepts Table

* Title
* Submission Date
* Status (Pending / Approved / Rejected)
* Adviser Feedback
* Resubmit Button

### Rules:

* Maximum of 3 submissions
* Disable if already approved

---

# 📂 5. Document Submission Page

This handles:

* Proposal Manuscript
* Final Manuscript
* Source Code
* Required Forms

### Components:

#### Upload Section

* Select Document Type
* File Upload Component
* Version Number
* Remarks

#### Submission History Table

* File Name
* Version
* Date Uploaded
* Status
* Adviser/Panel Comments

---

# 🗓 6. Defense Schedule Page

### 🎯 Purpose:

Students view — not edit.

### Components:

* Date
* Time
* Room
* Panel Members
* Payment Validation Status
* Defense Type (Proposal / Final)

### If unpaid:

⚠ Show “Defense Locked – Payment Required”

---

# 📊 7. Evaluation Results Page

After defense.

### Components:

#### Score Summary

* Individual Panel Scores
* Average Score
* Rating Breakdown

#### Panel Comments Section

#### Verdict Display

* Approved
* Re-Defense

---

# 🖨 8. Minutes & Approval Sheet Page

### 🎯 Purpose:

Download official documents.

### Elements:

* Minutes of Meeting PDF Download
* Approval Sheet PDF Download
* Digital Signatures Preview
* Status (Available / Not Yet Released)

---

# 🚀 9. Deployment Submission Page

### 🎯 Purpose:

Submit final working system proof.

### Fields:

* Deployed System URL
* GitHub Repository Link
* Upload Final Documentation
* Upload Source Code ZIP
* Upload User Manual

### Status:

* Pending Verification
* Verified
* Needs Revision

---

# 🔔 10. Notifications Page

### Notification Types:

* Adviser approved concept
* Adviser rejected concept
* Deadline reminder
* Defense schedule posted
* Evaluation released
* Deployment verified

---

# 👤 11. Profile & Settings

* Update profile picture
* Change password
* View academic info
* View capstone history

---

# 🧩 Core UI Components to Build (Student Side)

You should create reusable components:

### 1️⃣ Sidebar Navigation Component

### 2️⃣ Dashboard Card Component

### 3️⃣ Deadline Countdown Component

### 4️⃣ File Upload Component

### 5️⃣ Document Versioning Component

### 6️⃣ Status Badge Component

### 7️⃣ Timeline Component

### 8️⃣ Notification Toast Component

### 9️⃣ PDF Viewer Component

### 🔟 Evaluation Summary Card

---

# 🔐 Student Permission Matrix

Students CAN:
✔ Submit concepts
✔ Upload documents
✔ View feedback
✔ View schedule
✔ View scores
✔ Download official documents
✔ Submit deployment

Students CANNOT:
❌ Assign panel
❌ Schedule defense
❌ Change verdict
❌ Edit other groups

---

# 🏗 Suggested Folder Structure (Frontend Example)

```
Student/
 ├── Dashboard.tsx
 ├── Group/
 │    ├── GroupDetails.tsx
 ├── Titles/
 ├── Concepts/
 │    ├── SubmitConcept.tsx
 │    ├── ConceptHistory.tsx
 ├── Documents/
 ├── Schedule/
 ├── Evaluation/
 ├── Deployment/
 ├── Minutes/
 ├── Notifications/
```

---

# 🎯 Overall Student Module Architecture

Student Module =
**Workspace + Submission Portal + Progress Tracker + Feedback Viewer**

It is designed to:

* Guide students step-by-step
* Prevent process confusion
* Reduce paperwork
* Improve transparency
* Track academic compliance

---

If you want next, we can:

* Design the Student Database Tables
* Create ER Diagram for Student + Instructor
* Design Capstone Workflow Diagram
* Create UI Wireframe Layout
* Define API Endpoints Structure

Tell me which one you want to build next 🚀
