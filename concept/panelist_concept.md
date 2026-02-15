# 🎓 Panelist Role – System Concept

The **Panelist** (Panel Member) is the evaluator and feedback provider in the capstone defense process.

They:

* Review capstone documents before defense
* Attend scheduled defenses
* Evaluate student presentations and systems
* Provide constructive feedback and comments
* Submit evaluation scores
* Recommend verdict (Approve/Re-Defense)

So their interface should feel like a:

> 📋 **Evaluation Workspace + Document Reviewer + Feedback Center**

---

# 🧭 MAIN STRUCTURE (Panelist Navigation)

To benchmark with the Instructor and Student concepts, your Panelist module should have:

1. Dashboard
2. Assigned Groups
3. Defense Schedule
4. Document Review Center
5. Evaluation & Scoring
6. Comments & Feedback Management
7. Verdict Recommendation
8. Past Evaluations & History
9. Notifications
10. Profile & Account Settings

---

# 🏠 1. Panelist Dashboard

### 🎯 Purpose:

Overview of all assigned evaluation tasks.

### Components:

* 📊 Statistics Cards

  * Total Assigned Groups
  * Pending Evaluations
  * Upcoming Defenses
  * Completed Evaluations
  * Average Score Given (optional)

* 📅 Upcoming Defense Schedule (Quick View)

  * Group Name
  * Defense Type
  * Date & Time
  * Room

* 📄 Documents Pending Review

  * Group Name
  * Document Type
  * Upload Date
  * Review Status (Not Reviewed / In Progress / Reviewed)

* ⏰ Urgent Tasks Panel

  * Defenses within 3 days
  * Pending evaluations
  * Documents needing review

* 🔔 Recent Notifications

---

# 👥 2. Assigned Groups Page

### 🎯 Purpose:

View all capstone groups assigned to this panelist.

### Page Elements:

* Search & Filter

  * Defense Type (Outline / Pre-Deployment / Final)
  * Status (Scheduled / Evaluated / Pending)
  * Section

* Data Table:

  * Group Name
  * Project Title
  * Members (with roles)
  * Adviser Name
  * Defense Type
  * Defense Date
  * Evaluation Status
  * Actions (View Details / Review Documents / Evaluate)

---

### 👉 Group Details Page

Clicking on a group shows:

* **Project Information**

  * Project Title
  * Concept Description
  * Technology Stack (if provided)

* **Group Members**

  * Student Name
  * Role (PM/Analyst, Programmer, Documentarian)
  * Student ID

* **Adviser & Panel Information**

  * Adviser Name
  * Co-Panel Members (other panelists)
  * Panel Chair (if applicable)

* **Defense Information**

  * Defense Type
  * Schedule (Date, Time, Room)
  * Payment Status

* **Documents Section**

  * Uploaded Documents List
  * Quick Preview
  * Download Button
  * Review Status Badge

* **Evaluation History**

  * Previous defense scores (if re-defense)
  * Previous comments
  * Verdict history

---

# 🗓 3. Defense Schedule Page

### 🎯 Purpose:

View all scheduled defenses assigned to the panelist.

### Display Options:

* 📅 Calendar View (Monthly/Weekly)
* 📋 List View

### Calendar Features:

* Color-coded by defense type:

  * 🟦 Outline Defense
  * 🟨 Pre-Deployment Defense
  * 🟩 Final Defense

* Click event to view details
* Filter by month/section

---

### Schedule List View Elements:

* Defense Date & Time
* Group Name
* Project Title
* Room Assignment
* Defense Type
* Co-Panel Members
* Document Review Status
* Evaluation Status

### Actions:

* View Group Details
* Review Documents
* Mark Attendance (if needed)

---

# 📂 4. Document Review Center

### 🎯 Purpose:

Centralized document review workspace with **inline commenting feature**.

### Main Components:

* Document Categories:

  * 📄 Proposal Manuscripts
  * 📊 Presentation Slides
  * 📘 Final Manuscripts
  * 📦 Supporting Documents (Source Code, User Manual, etc.)

* Filter & Search:

  * By Group
  * By Defense Type
  * By Review Status
  * By Upload Date

---

### 📄 Document Viewer Page

When panelist clicks on a document:

* **Document Preview Panel** (PDF/DOCX Viewer)

  * Embedded document viewer
  * Page navigation
  * Zoom controls
  * Download button

* **Comment Panel** (Side Panel or Below)

  * Add Comment Button
  * Comment input with:
    * Page/Section Reference (e.g., "Page 5, Chapter 2")
    * Comment Type Dropdown:
      * 💡 Suggestion
      * ⚠️ Issue/Error
      * ✅ Approval/Good Practice
      * ❓ Question/Clarification
    * Rich Text Editor for detailed feedback
    * Attach screenshot (optional)

* **Existing Comments List**

  * Shows all comments by this panelist
  * Edit/Delete own comments
  * Comment timestamp
  * Page reference
  * Comment type badge

* **Review Checklist** (Optional but helpful)

  * [ ] Content quality checked
  * [ ] Format and structure reviewed
  * [ ] Technical accuracy verified
  * [ ] References and citations checked
  * [ ] All comments added

* **Review Status Actions**

  * Mark as "Reviewed"
  * Mark as "Needs Revision"
  * Save Draft Comments

---

### 💬 Comment Features:

**During Defense Phase:**

* Panelist can add comments in real-time
* Comments are timestamped
* Can categorize by severity:
  * Minor (suggestion)
  * Major (must fix)
  * Critical (blocking issue)

**Comment Visibility:**

* Comments visible to:
  * Student group (after evaluation is submitted)
  * Adviser
  * Instructor
  * Other panel members

**Comment Management:**

* Edit comments before final submission
* Delete draft comments
* Pin important comments
* Filter comments by type/page

---

# 🧾 5. Evaluation & Scoring Page

### 🎯 Purpose:

Submit evaluation scores after defense.

### Page Flow:

1. **Select Group** (from scheduled defenses)
2. **Evaluation Form**

---

### Evaluation Form Components:

**Defense Information Display:**

* Group Name
* Project Title
* Defense Type
* Defense Date
* Co-Panelists

---

**Evaluation Criteria Section:**

Multiple criteria with scoring (customize based on your rubric):

1. **Presentation Quality** (1-5 or 1-10 scale)

   * Clarity of presentation
   * Time management
   * Visual aids effectiveness

2. **Technical Understanding** (1-5 or 1-10)

   * Grasp of concepts
   * Answer to technical questions
   * Problem-solving approach

3. **Project Feasibility** (1-5 or 1-10)

   * Scope and objectives
   * Implementation plan
   * Resource requirements

4. **Documentation Quality** (1-5 or 1-10)

   * Manuscript completeness
   * Technical accuracy
   * Proper citations

5. **Innovation/Originality** (1-5 or 1-10)

   * Uniqueness of approach
   * Contribution to field
   * Creative solutions

6. **Q&A Performance** (1-5 or 1-10)

   * Response quality
   * Confidence
   * Team collaboration

---

**Individual Member Evaluation** (Optional):

Evaluate each group member separately:

* Project Manager/Analyst - Score & Comments
* Programmer - Score & Comments
* Documentarian - Score & Comments

---

**Overall Evaluation Section:**

* **Total Score** (Auto-calculated)
* **Percentage** (Auto-calculated)
* **Overall Comments** (Rich Text Editor)

  * Strengths
  * Areas for Improvement
  * Specific Recommendations

* **Verdict Recommendation**

  * ✅ Approve
  * 🔁 Re-Defense
  * 📝 Conditional Approval (if applicable)

* **Required Revisions** (if Re-Defense recommended)

  * List of changes needed
  * Priority level
  * Estimated revision time

---

**Save Options:**

* Save as Draft
* Submit Evaluation (Final)

**Post-Submission:**

* Lock scores (cannot edit after final submission)
* Email confirmation to panelist
* Notification to instructor

---

# 💬 6. Comments & Feedback Management

### 🎯 Purpose:

Dedicated page to manage all document comments across all groups.

### Page Sections:

* **Comment Dashboard**

  * Total Comments Made
  * Comments by Type
  * Groups with Most Comments

* **Filter & Search**

  * By Group
  * By Document Type
  * By Comment Type
  * By Date Range

* **Comments Table**

  * Group Name
  * Document Name
  * Page/Section
  * Comment Type
  * Comment Preview
  * Date Added
  * Actions (View/Edit/Delete)

---

### Comment Export:

* Export all comments for a group as PDF
* Useful for generating feedback report

---

# ⚖ 7. Verdict Recommendation Page

### 🎯 Purpose:

View consolidated scores and provide final verdict input.

### Page Elements:

* **Group Selection Dropdown**

* **Evaluation Summary Display**

  * Your Score
  * Co-Panelist Scores
  * Average Panel Score
  * Adviser Comments (view only)

* **Your Verdict Recommendation**

  * Approve
  * Re-Defense
  * Reasoning (required if Re-Defense)

* **Collaborative Panel Decision** (if applicable)

  * View other panelists' recommendations
  * Panel consensus indicator

* **Submit Recommendation Button**

---

**Important Logic:**

* Cannot submit verdict without submitting evaluation first
* Can modify recommendation until instructor finalizes

---

# 📚 8. Past Evaluations & History

### 🎯 Purpose:

Reference past evaluations for consistency.

### Components:

* **Academic Year Filter**
* **Search by Group/Title**

* **Evaluations Table**

  * Group Name
  * Project Title
  * Defense Type
  * Defense Date
  * Score Given
  * Verdict
  * View Details

---

### Evaluation Details Page:

* All scores submitted
* Comments provided
* Verdict recommendation
* Final outcome
* Download evaluation PDF

---

### Analytics (Optional):

* Average score trends
* Evaluation distribution (Approved vs Re-Defense)
* Most common feedback themes

---

# 🔔 9. Notifications Center

### 🎯 Purpose:

Stay informed about assignments and updates.

### Notification Types:

* 📌 New group assignment
* 📄 New document uploaded for review
* 🗓 Defense schedule reminder (3 days, 1 day before)
* ⏰ Pending evaluation deadline
* ✅ Evaluation submitted confirmation
* 📢 Verdict finalized by instructor
* 📝 Student resubmission after re-defense

---

### Notification Features:

* Mark as read/unread
* Filter by type
* Clear all notifications
* Email notification toggle (in settings)

---

# 👤 10. Profile & Account Settings

### Profile Information:

* Full Name
* Employee ID
* Department/Position
* Contact Information
* Specialization/Expertise Areas

---

### Settings:

* Change Password
* Email Notifications:

  * Defense reminders
  * New assignments
  * Document uploads
  * Deadline alerts

* Preferred Evaluation Rubric (if customizable)
* Language Preference
* Time Zone

---

# 🧩 Core Panelist UI Components (Technical)

To align with Student and Instructor architecture:

### Components Needed:

* Sidebar Navigation
* Header with Role Badge ("Panelist")
* Stats Card Component
* Reusable Data Table Component
* Calendar Component
* Document Viewer Component
* **Comment Editor Component** (Rich Text)
* **Comment Thread Component**
* Evaluation Form Component
* Score Input Component
* Modal Component
* Status Badge Component
* Timeline Component
* PDF Preview Modal
* Notification Toast System
* File Download Component

---

# 🔐 Panelist Permission Matrix

### Panelist CAN:

✔ View assigned groups only
✔ Review all documents for assigned groups
✔ Add, edit, delete comments on documents (before final submission)
✔ Submit evaluation scores
✔ Provide verdict recommendations
✔ View defense schedules for assigned groups
✔ Download group documents
✔ View past evaluations
✔ Update own profile

### Panelist CANNOT:

❌ View unassigned groups
❌ Assign themselves to groups
❌ Schedule defenses
❌ Edit student documents
❌ Finalize verdict (only recommend)
❌ Edit evaluations after final submission
❌ View other panelists' scores before submission (optional)
❌ Modify deadlines
❌ Archive projects
❌ Generate official documents

---

# 🔁 Panelist Workflow (Connected to System Flow)

Panelist logs in →
View Dashboard (assigned groups) →
Check upcoming defenses →
Review uploaded documents →
Add comments on documents during review →
Attend defense →
Add real-time comments during presentation (optional) →
Submit evaluation scores →
Provide verdict recommendation →
View consolidated results (after instructor finalization) →
Reference past evaluations for next assignments

---

# 🏗 Suggested Frontend Folder Structure

```
Panelist/
 ├── _layout.tsx
 ├── dashboard.tsx
 ├── assigned-groups.tsx
 ├── group-details.tsx
 ├── schedule.tsx
 ├── documents/
 │    ├── document-list.tsx
 │    ├── document-viewer.tsx
 │    ├── comment-panel.tsx
 ├── evaluation/
 │    ├── evaluation-form.tsx
 │    ├── score-input.tsx
 ├── comments/
 │    ├── comments-dashboard.tsx
 │    ├── comment-manager.tsx
 ├── verdict/
 │    ├── verdict-recommendation.tsx
 ├── history/
 │    ├── past-evaluations.tsx
 │    ├── evaluation-details.tsx
 ├── notifications.tsx
 ├── settings.tsx
```

---

# 🎯 Final Architecture Summary

**Panelist Module =**
**Document Review + Commenting + Evaluation + Feedback Provider**

### Role Relationship:

* **Student** = Content Creator & Submitter
* **Adviser** = Primary Reviewer & Mentor
* **Panelist** = Secondary Evaluator & Feedback Provider
* **Instructor** = Academic Controller & Final Decision Maker

---

# 📊 Panelist-Specific Features Summary

### Key Differentiators:

1. **Document Commenting System**

   * Inline comments on manuscripts and documents
   * Categorized feedback (suggestion, issue, question)
   * Page/section referencing
   * Real-time or pre-defense commenting

2. **Multi-Defense Type Handling**

   * Outline Defense
   * Pre-Deployment Defense
   * Final Defense
   * Each with different evaluation criteria

3. **Collaborative Evaluation**

   * View co-panelist information
   * Panel consensus tracking
   * Individual verdict recommendations

4. **Historical Reference**

   * Access past evaluations
   * Maintain evaluation consistency
   * Trend analysis

---

# 💡 Advanced Features (Optional Enhancements)

### 1. AI-Assisted Review (Future Enhancement)

* Plagiarism detection integration
* Grammar/writing quality checker
* Auto-suggest common improvements

### 2. Rubric Customization

* Allow panelist to create custom evaluation criteria
* Template management for different defense types

### 3. Video Recording Integration

* Link to defense recording
* Add timestamp-based comments
* Review defense video before scoring

### 4. Collaborative Panel Chat

* Real-time chat with co-panelists
* Discuss evaluation before submission
* Consensus building tool

### 5. Comment Templates

* Pre-defined feedback templates
* Quick insert common comments
* Personalize and save custom templates

### 6. Mobile Responsive Review

* Review documents on mobile
* Quick comment addition
* View schedules on-the-go

---

# 🔄 Data Flow Integration

### When Document is Uploaded (Student Side):

1. Student uploads document
2. System routes to assigned panel members
3. Panelist receives notification
4. Document appears in "Pending Review"

### When Panelist Reviews:

1. Panelist opens document viewer
2. Adds inline comments
3. Marks review status
4. Comments stored in database
5. Student can view comments after evaluation

### When Defense Occurs:

1. Panelist attends defense
2. Can add real-time notes/comments
3. Submits evaluation form
4. Scores and comments stored
5. Instructor sees all panel evaluations

### When Verdict is Finalized:

1. Instructor consolidates panel scores
2. Makes final decision
3. Panelist can view final outcome
4. Evaluation archived in history

---

# 🎨 UI/UX Considerations

### Design Principles:

1. **Clean Document Viewer**

   * Minimal distractions
   * Focus on content review
   * Easy comment annotation

2. **Quick Access Navigation**

   * Dashboard shows urgent tasks first
   * One-click access to pending evaluations
   * Keyboard shortcuts for power users

3. **Responsive Forms**

   * Auto-save evaluation drafts
   * Progress indicators
   * Validation before submission

4. **Clear Status Indicators**

   * Color-coded badges
   * Progress bars
   * Visual cues for deadlines

5. **Mobile-Friendly**

   * Responsive design
   * Touch-friendly comment tools
   * Readable document viewer

---

# 📋 Database Considerations

### Tables Needed for Panelist Module:

* `panel_assignments` - Links panelists to groups
* `document_comments` - Stores inline comments
* `evaluations` - Stores scores and feedback
* `verdict_recommendations` - Panel member verdicts
* `defense_schedules` - Schedule information
* `notification_preferences` - User notification settings

---

# ✅ Development Checklist

### Phase 1 - Core Features:

- [ ] Dashboard with statistics
- [ ] Assigned groups list
- [ ] Defense schedule calendar
- [ ] Document viewer
- [ ] Basic evaluation form

### Phase 2 - Commenting System:

- [ ] Inline comment editor
- [ ] Comment categorization
- [ ] Comment management panel
- [ ] Comment visibility controls

### Phase 3 - Evaluation:

- [ ] Comprehensive evaluation form
- [ ] Score calculation
- [ ] Verdict recommendation
- [ ] Draft save functionality

### Phase 4 - History & Analytics:

- [ ] Past evaluations viewer
- [ ] Export functionality
- [ ] Analytics dashboard

### Phase 5 - Polish:

- [ ] Notifications system
- [ ] Profile settings
- [ ] Mobile responsiveness
- [ ] Performance optimization

---

# 🚀 Next Steps

Now that you have the Panelist concept, you can:

* **Create Database Schema** for panelist-related tables
* **Design UI Wireframes** for key pages (dashboard, document viewer, evaluation form)
* **Define API Endpoints** for panelist actions
* **Implement Comment System** architecture
* **Build Evaluation Logic** with score calculations
* **Create Permission Guards** for role-based access

---

**The Panelist module is the bridge between student work and final verdict - it's where quality assurance happens through thoughtful review, detailed feedback, and fair evaluation.** 🎯
