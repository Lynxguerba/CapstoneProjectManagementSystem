## OVERALL SYSTEM FLOW (END TO END)

    This flow describes how the Capstone Project Management System works from Capstone 1 (Concept Phase) up to Capstone 2 (Defense & Completion), based directly on the 02/09/2026 meeting.
    ________________________________________
    # PHASE 0: SYSTEM SETUP (ADMIN / FACULTY)
        Actors: Admin, Dean, Instructor/Coordinator
        1.	Admin creates:
        o	Academic Year / Semester
        o	Program (IT / ISPED)
        o	Sections
        2.	Admin registers Faculty accounts (Instructor, Advisor, Panelist, Chair, Dean).
        3.	Instructor sets:
        o	Capstone deadlines
        o	Defense rooms and time slots (system prevents overlap)
        4.	Admin uploads or initializes:
        o	Existing Capstone Title Repository (Anti Duplication)
    ________________________________________
    # PHASE 1: GROUP CREATION & ACCESS CONTROL
        Actors: Students, Instructor, System
        Students are grouped by Instructor.
        System assigns Group Roles:
        Project Manager / Analyst → Upload access
        Programmer / Documentarian → View only
        System enforces Group Data Isolation:
        Group A cannot see files of Group B
        Instructor can view all groups under their section only.
        Additional Adviser Assignment Flow:
        •	Instructor assigns a Final Adviser to each group.
        •	Adviser assignment is recorded and locked in the system once finalized.
        •	Assigned adviser is displayed on the group dashboard and faculty views.
        Adviser Load Visualization:
        •	System tracks the number of groups per adviser.
        •	Instructor and Admin can view adviser load (slots used vs available).
        •	System prevents adviser overloading once slot limit is reached.**.
    ________________________________________
    PHASE 2: CAPSTONE 1 – CONCEPT SUBMISSION
        Actors: Students (PM/Analyst), System
        1.	PM/Analyst submits three (3) project titles/concepts.
        2.	System checks each title against:
        o	Existing Title Repository (Anti Duplication)
        3.	Status is set to:
        o	Submitted
        4.	System locks submission after deadline (unless overridden).
    ________________________________________
    PHASE 3: ADVISOR REVIEW & FEEDBACK LOOP
        Actors: Adviser, Students, System
        Advisor reviews submitted concepts inside the system.
        Advisor provides:
        Comments
        Approval or Rejection
        System updates status:
        Approved by Advisor → forwarded to Faculty
        Resubmit → returned to students
        If Resubmit:
        Students revise and resubmit
        Deadline rules still apply
        Adviser Activity Tracking:
        •	All adviser reviews and decisions are logged.
        •	Adviser dashboard updates workload based on assigned and active groups.
    ________________________________________
    PHASE 4: FACULTY & PANEL ROUTING
        Actors: Panelists, Chair
        1.	Instructor routes approved concept to Panelists.
        2.	Panelists:
        o	View documents
        o	Add direct online comments
        3.	Chair accesses:
        o	Evaluation Sheet inside system
        4.	Chair submits final verdict:
        o	Approved
        o	Re Defense
    ________________________________________
    PHASE 5: DEFENSE SCHEDULING & PAYMENT CHECK
        Actors: Instructor, System, Students
        1.	Instructor assigns:
        o	Room
        o	Date & Time
        2.	System validates:
        o	No room overlap
        o	No double booking per group
        3.	System checks Payment Status:
        o	Paid → defense unlocked
        o	Unpaid → defense access locked
    ________________________________________
    PHASE 6: DEFENSE DAY & LIVE DOCUMENTATION
        Actors: Panelists, Chair, System
        1.	Panelists log in and confirm attendance.
        2.	Panelists enter live comments.
        3.	System automatically generates:
        o	Attendance list
        o	Minutes of the Meeting
        4.	Chair confirms final remarks.
    ________________________________________
    PHASE 7: DIGITAL APPROVAL & DOCUMENT GENERATION
        Actors: Panelists, Chair, Dean
        1.	When users click Approve:
        o	Digital signature auto attached
        2.	System generates:
        o	PDF Approval Sheet
        	Members
        	Advisor
        	Panelists
        	Chair
        	Dean
        3.	Documents are stored in group repository.
    ________________________________________
    PHASE 8: CAPSTONE 2 – DEPLOYMENT VERIFICATION
        Actors: Students, Instructor
        1.	Students upload:
        o	Scanned Deployment Certificate
        o	With client signature
        2.	Instructor verifies deployment.
        3.	Status updates to:
        o	Completed
    ________________________________________
    PHASE 9: NOTIFICATIONS & DEADLINE AUTOMATION
        Actors: System, Instructor
        1.	System sends dashboard alerts:
        o	3 days before deadline
        2.	Instructor can:
        o	Extend deadlines
        o	Override system locks
    ________________________________________
    FINAL OUTPUTS OF THE SYSTEM
        •	Complete Capstone Timeline
        •	Digital Approval Sheets (PDF)
        •	Minutes of the Meeting
        •	Evaluation Records
        •	Secure Group based Repository
        •	IT & ISPED compatible workflow
    ________________________________________
    ________________________________________
    DETAILED PHASE FLOWS & ACTOR RESPONSIBILITIES
    Below is the expanded flow per phase and the specific actions of each actor, including students, as requested.
    ________________________________________
    ACTORS IN THE SYSTEM
        1. Students (Grouped Users)
        Students are the primary users of the system and are organized into groups. Each student is assigned a specific role that determines their permissions.
        Student Roles & Permissions
        a. Project Manager (PM)
        •	Full access to the group dashboard
        •	Upload and submit concept papers and main documents
        •	Submit three (3) project titles/concepts
        •	Resubmit revised documents when required
        •	View all feedback, comments, schedules, and system notifications
        b. System Analyst
        •	Same permissions as Project Manager
        •	Upload and update system-related documents
        •	Coordinate revisions based on advisor and panel feedback
        •	Track project status and deadlines in the dashboard
        c. Documentarian
        •	View-only access to all group documents
        •	Download approved files and templates
        •	View comments, evaluation results, and defense schedules
        •	Cannot upload or modify official submissions
        d. Programmer
        •	View-only access to documents and system feedback
        •	View schedules, deadlines, and verdicts
        •	No permission to upload or edit capstone documents
        General Student Capabilities (All Roles):
        •	Login and access group dashboard
        •	Receive deadline and system notifications
        •	View defense schedules and results
    ________________________________________
    2. Advisor
        •	View assigned student groups
        •	Review submitted concepts and documents
        •	Add comments and recommendations
        •	Approve or reject submissions
        •	Trigger resubmission workflow
    ________________________________________
    2. Advisor
        •	View assigned groups
        •	Review submitted concepts
        •	Add comments and suggestions
        •	Approve or reject submissions
        •	Trigger resubmission flow
    ________________________________________
    3. Panelist
        •	View routed documents
        •	Add online comments during evaluation
        •	Confirm attendance on defense day
        •	Digitally approve documents
    ________________________________________
    4. Chair
        •	Access evaluation sheets
        •	Review panel comments
        •	Input final verdict (Approved / Re-defense)
        •	Digitally sign approval sheets
    ________________________________________
    5. Instructor / Coordinator
        •	Create and manage student groups
        •	Assign advisors and panelists
        •	Set defense schedules (room/date/time)
        •	Manage deadlines and overrides
        •	Verify payment status
        •	View all groups under their section
    ________________________________________
    6. Dean / Admin
        •	View all capstone records under department
        •	Digitally sign final approval sheets
        •	Manage system-wide settings
    ________________________________________
    PHASE-BY-PHASE DETAILED FLOW
    PHASE 0: SYSTEM INITIALIZATION
        Actors: Admin, Instructor
        Flow:
        1.	Admin sets academic structure (AY, semester, program).
        2.	Admin creates faculty accounts.
        3.	Instructor configures deadlines and defense slots.
        4.	System enforces no-overlap scheduling.
    ________________________________________
    PHASE 1: STUDENT GROUPING & ROLE ASSIGNMENT
        Actors: Instructor, Students
        Flow:
        1.	Instructor creates student groups.
        2.	System assigns role permissions.
        3.	Students log in and view assigned roles.
        4.	System isolates group data automatically.
    ________________________________________
    PHASE 2: CAPSTONE 1 – CONCEPT SUBMISSION
        Actors: Students (PM/Analyst), System
        Flow:
        1.	PM/Analyst submits three (3) project titles.
        2.	System checks title duplication.
        3.	Submission status becomes Submitted.
        4.	System notifies Advisor.
    ________________________________________
    PHASE 3: ADVISOR REVIEW & RESUBMISSION
        Actors: Advisor, Students
        Flow:
        1.	Advisor reviews concepts.
        2.	Advisor adds comments.
        3.	Advisor selects:
        o	Approve → forwarded to faculty
        o	Reject → status set to Resubmit
        4.	Students revise and resubmit before deadline.
    ________________________________________
    PHASE 4: FACULTY & PANEL EVALUATION
        Actors: Panelists, Chair
        Flow:
        1.	Instructor routes approved concepts to panelists.
        2.	Panelists review and comment online.
        3.	Chair fills out evaluation sheet.
        4.	Chair submits verdict:
        o	Approved
        o	Re-defense
    ________________________________________
    PHASE 5: DEFENSE SCHEDULING & PAYMENT VALIDATION
        Actors: Instructor, System
        Flow:
        1.	Instructor assigns defense schedule.
        2.	System checks room and time conflicts.
        3.	System validates payment status.
        4.	If unpaid, defense access is locked.
    ________________________________________
    PHASE 6: DEFENSE DAY EXECUTION
        Actors: Panelists, Chair, System
        Flow:
        1.	Panelists log attendance.
        2.	Panelists input live comments.
        3.	System auto-generates minutes.
        4.	Chair confirms results.
    ________________________________________
    PHASE 7: DIGITAL APPROVAL & DOCUMENT GENERATION
        Actors: Panelists, Chair, Dean
        Flow:
        1.	Approvers click Approve.
        2.	System attaches digital signatures.
        3.	System generates PDF approval sheets.
        4.	Files saved to group repository.
    ________________________________________
    PHASE 8: CAPSTONE 2 – DEPLOYMENT VERIFICATION
        Actors: Students, Instructor
        Flow:
        1.	Students upload deployment certificate.
        2.	Instructor verifies client signature.
        3.	Status updated to Completed.
    ________________________________________
    PHASE 9: AUTOMATION & NOTIFICATIONS
        Actors: System, Instructor
        Flow:
        1.	System sends deadline alerts (3 days before).
        2.	Instructor overrides deadlines if needed.
    ________________________________________
    END OF SYSTEM FLOW
