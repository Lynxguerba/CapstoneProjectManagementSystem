Now for if there is new table need to add in Database initialize my codebase, database(apply normalization) and file structure. Provide command for migration or changes in DB, note: i used Docker. Then at the end suggest commi message for the changes.


SEEDING:

    <!-- DROP TABLES -->
    docker compose exec app php artisan migrate:fresh --no-interaction


    <!-- ADD RECORDS -->
    docker compose exec app php artisan db:seed --class=Database\\Seeders\\UserSeeder --no-interaction

    docker compose exec app php artisan db:seed \
    --class=Database\\Seeders\\CsvAccountsAndAcademicYearsSeeder \
    --no-interaction

    docker compose exec app php artisan db:seed --class=Database\\Seeders\\AuditLogsPageSeeder --no-interaction



    # Feature: Cross-Set Student Grouping with Approval Flow

## Project Context
This is a Laravel 12 + Inertia.js (React TSX) + Tailwind CSS 4 project called CPMS
(Capstone Project Management System). The project uses:
- Laravel 12, Inertia.js v2, React 19 with TypeScript
- Tailwind CSS 4, Vite
- MySQL 8.0
- Existing pattern reference: `GroupAdviserRequest` model and its related
  controller/migration — follow the same approval flow pattern for this feature.

---

## Feature Overview
Instructors are scoped to their own Program Sets (e.g. Instructor 1 → BSIT-A-2025-2026,
Instructor 2 → BSIT-B-2025-2026). When creating a capstone group, an instructor can
only see and enroll students from their own set. This feature allows Instructor 1 to
request students from Instructor 2's set to be added to a cross-set group — requiring
Instructor 2's explicit approval before the student is linked.

---

## What to Build

### 1. Migration: `cross_set_group_requests` table
File: `database/migrations/{timestamp}_create_cross_set_group_requests_table.php`

Columns:
- `id` — primary key
- `group_id` — foreign key → groups.id, cascadeOnDelete
- `student_id` — foreign key → users.id
- `requested_by` — foreign key → users.id (Instructor 1, the requester)
- `requested_to` — foreign key → users.id (Instructor 2, the approver)
- `from_program_set_id` — foreign key → program_sets.id (requester's set)
- `to_program_set_id` — foreign key → program_sets.id (target student's set)
- `status` — enum: ['pending', 'approved', 'rejected'], default 'pending'
- `remarks` — nullable text
- `responded_at` — nullable timestamp
- `timestamps()`

### 2. Migration: add `is_cross_set` to `groups` table
File: `database/migrations/{timestamp}_add_is_cross_set_to_groups_table.php`

Add:
- `is_cross_set` — boolean, default false

### 3. Migration: add `is_cross_set` to `group_members` table
File: `database/migrations/{timestamp}_add_is_cross_set_to_group_members_table.php`

Add:
- `is_cross_set` — boolean, default false

---

### 4. Model: `CrossSetGroupRequest`
File: `app/Models/CrossSetGroupRequest.php`

- `$fillable`: all columns listed above
- Relationships:
  - `group()` → BelongsTo Group
  - `student()` → BelongsTo User (student_id)
  - `requestedBy()` → BelongsTo User (requested_by)
  - `requestedTo()` → BelongsTo User (requested_to)
  - `fromProgramSet()` → BelongsTo ProgramSet (from_program_set_id)
  - `toProgramSet()` → BelongsTo ProgramSet (to_program_set_id)
- Helper method: `isPending(): bool` → returns true if status === 'pending'

---

### 5. Controller: Cross-Set Student Search
File: `app/Http/Controllers/Instructor/CrossSetStudentSearchController.php`

- Method: `__invoke(Request $request): JsonResponse`
- Logic:
  1. Get all program_set IDs managed by the authenticated instructor.
  2. Query `users` with role 'student' who are NOT enrolled in any of those sets.
  3. Filter by search query `$request->q` matching `first_name`, `last_name`, or
     `student_id_number` (use `like "%{q}%"`).
  4. Eager-load `programSets` (select: id, name only).
  5. Select ONLY these columns on the user: `id`, `first_name`, `last_name`,
     `student_id_number`. DO NOT expose any submission, document, or grade data.
  6. Limit results to 20.
  7. Return as JSON.

---

### 6. Controller: Store Cross-Set Request
File: `app/Http/Controllers/Instructor/StoreCrossSetGroupRequestController.php`

- Method: `__invoke(StoreCrossSetGroupRequestRequest $request): RedirectResponse`
- Logic:
  1. Find the target student and resolve their current program set.
  2. Find the instructor who manages that program set (`requested_to`).
  3. Create a `CrossSetGroupRequest` with status 'pending'.
  4. Return back() with a success flash message.

---

### 7. Controller: Approve Cross-Set Request
File: `app/Http/Controllers/Instructor/ApproveCrossSetGroupRequestController.php`

- Method: `__invoke(CrossSetGroupRequest $crossSetRequest): RedirectResponse`
- Logic:
  1. Abort 403 if `$crossSetRequest->requested_to !== auth()->id()`.
  2. Abort 422 if the request is not in 'pending' status.
  3. Wrap in a DB transaction:
     a. Update the request: status → 'approved', responded_at → now().
     b. Create a `GroupMember` record: group_id, user_id (student_id), is_cross_set → true.
     c. Update the Group: set is_cross_set → true.
  4. Return back() with success flash.

---

### 8. Controller: Reject Cross-Set Request
File: `app/Http/Controllers/Instructor/RejectCrossSetGroupRequestController.php`

- Method: `__invoke(CrossSetGroupRequest $crossSetRequest): RedirectResponse`
- Logic:
  1. Abort 403 if `$crossSetRequest->requested_to !== auth()->id()`.
  2. Abort 422 if not pending.
  3. Update: status → 'rejected', remarks → optional input, responded_at → now().
  4. Return back() with success flash.

---

### 9. Form Request: StoreCrossSetGroupRequestRequest
File: `app/Http/Requests/Instructor/StoreCrossSetGroupRequestRequest.php`

Validation rules:
- `group_id` — required, exists:groups,id
- `student_id` — required, exists:users,id

---

### 10. Routes
File: `routes/instructor.php`

Add under the authenticated instructor middleware group:
```php
Route::get('students/cross-set-search', CrossSetStudentSearchController::class)
    ->name('instructor.students.cross-set-search');

Route::post('groups/cross-set-request', StoreCrossSetGroupRequestController::class)
    ->name('instructor.groups.cross-set-request.store');

Route::patch('groups/cross-set-request/{crossSetRequest}/approve', ApproveCrossSetGroupRequestController::class)
    ->name('instructor.groups.cross-set-request.approve');

Route::patch('groups/cross-set-request/{crossSetRequest}/reject', RejectCrossSetGroupRequestController::class)
    ->name('instructor.groups.cross-set-request.reject');
```

---

### 11. Frontend: Update CreateGroupModal.tsx
File: `resources/js/components/Instructor/groups/CreateGroupModal.tsx`

Add a new collapsible section below the existing student list titled
**"Add students from other sets"** with these behaviors:

- A search input that fires a debounced GET request to
  `route('instructor.students.cross-set-search')` with param `q`.
- Minimum 2 characters before triggering search.
- Results display: show `first_name + last_name`, `student_id_number`, and the
  student's `programSets[0].name` as a badge.
- Each result has a "Request" button. Clicking it adds the student to a local
  `pendingCrossSetRequests` state array (does not immediately call the API).
- Below the search, show a list of pending cross-set students staged for request,
  with a remove (×) button per entry.
- On group creation form submit: after the group is created and the group_id is
  returned, loop through `pendingCrossSetRequests` and POST each one to
  `route('instructor.groups.cross-set-request.store')` with `{ group_id, student_id }`.
- Show a note to the user: "These students require approval from their managing
  instructor before being added to the group."
- Use existing modal styles, Tailwind CSS 4 utility classes, and match the UI
  patterns already present in the file.

---

### 12. Frontend: Instructor Pending Cross-Set Requests Panel
File: `resources/js/pages/Instructor/groups/managePage.tsx`
(or create a new component `CrossSetRequestsPanel.tsx` imported into this page)

Display a list of incoming cross-set requests where `requested_to === auth user`:

Each row shows:
- Student name + student_id_number
- Group name being requested for
- Requesting instructor's name
- Status badge (pending / approved / rejected)
- For pending: "Approve" and "Reject" buttons that call the respective routes via
  Inertia `router.patch()`

Pass the pending requests from the controller via Inertia props. Name the prop
`crossSetRequests`.

---

### 13. Backend: Pass crossSetRequests to managePage
In the existing instructor groups controller that renders `managePage`, add:
```php
'crossSetRequests' => CrossSetGroupRequest::with([
    'student:id,first_name,last_name,student_id_number',
    'group:id,name',
    'requestedBy:id,first_name,last_name',
])
->where('requested_to', auth()->id())
->where('status', 'pending')
->latest()
->get(),
```

---

## Constraints and Rules
- DO NOT expose document submissions, grades, evaluation data, or any academic
  records through the cross-set search endpoint. Only: id, first_name, last_name,
  student_id_number, and their program set name.
- All approval logic must verify that the authenticated user is the `requested_to`
  instructor — never allow self-approval or third-party approval.
- Use DB transactions when updating both the request status and creating the
  GroupMember simultaneously.
- Follow the existing code style: single-action controllers, Form Request classes
  for validation, Inertia responses for page renders, JSON responses for API-style
  endpoints.
- Migrations must be additive — do not modify existing migration files.
- Match the existing `GroupAdviserRequest` model and controller structure as a
  reference pattern throughout.