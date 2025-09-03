## **1\. Student**

- Fingerprint Scanning

---

## **2\. Parent**

- **Read:**

  - Their linked child(ren)’s `attendancelog` (per day, per subject/section).

  - Their child’s `attendancereport` (download daily/weekly/monthly).

  - `subject` list (to understand class schedule).

  - `studentsubject` (which subjects their child takes).

- **Write:**

  - Submit `excuseletter` (Status \= Pending by default).

  - File `parentconcern` (if added later).

- **Notifications:**

  - Receives entries in `notification` table when child absent/late/excused.

- **No direct access** to `teacherschedule` or `audittrail`.

---

## **3\. Teacher**

- **Read:**

  - `attendancelog` of students in their `teacherschedule` (by SubjectID/Section/GradeLevel).

  - Linked `studentrecord` and `studentsubject`.

  - Submitted `excuseletter` (to review).

- **Write:**

  - Update `attendancelog` → Validate attendance, mark Late/Excused.

  - Approve/Reject `excuseletter` (Status updated, ReviewedBy set).

  - Generate `attendancereport` (class/subject level).

- **Notifications:** Can trigger `notification` records (absence alerts to parents).

- **Audit:** Minimal; their actions logged into `audittrail`.

---

## **4\. Registrar**

- **Read:**

  - All `attendancelog`, `attendancereport`, `excuseletter`, `studentrecord`.

  - All `teacherschedule`.

- **Write:**

  - Manage `registration` (approve Teacher/Parent accounts).

  - Generate official `attendancereport` (school-wide).

  - Approve high-level excuse requests.

- **Admin Controls:**

  - Oversee all attendance and can override teacher entries.

- **Audit:** Strongly tracked in `audittrail`.

---

## **5\. Admin**

- **Read/Write:**

  - Higher authority than Registrar, but not full system control.

  - Can manage `useraccount` (activate/deactivate).

  - Can view and manage `audittrail`.

  - Can generate any `attendancereport`.

- **Approvals:** Can review/approve `registration`.

- **Scope:** Full school-level, but may not have multi-school control like SuperAdmin.

---

## **6\. SuperAdmin**

- **Full Access (Read/Write/Delete):**

  - All entities: `useraccount`, `studentrecord`, `parent`, `teacherschedule`, `attendancelog`, `attendancereport`, `excuseletter`, `notification`, `registration`, `audittrail`.

- **System Management:**

  - Create/Edit/Delete user accounts (all roles).

  - Configure system settings (school year, cutoff times).

  - Oversee all reports across grade levels/sections.

- **Audit:** Can read full `audittrail` and purge/archive logs.

---

✅ **Summary Matrix**

| Table              | Student  | Parent            | Teacher                       | Registrar      | Admin          | SuperAdmin |
| ------------------ | -------- | ----------------- | ----------------------------- | -------------- | -------------- | ---------- |
| `useraccount`      | Read own | None              | Read (own)                    | Manage         | Manage         | Full       |
| `studentrecord`    | Read own | Read linked child | Read (class students)         | Full           | Full           | Full       |
| `attendancelog`    | Read own | Read child        | Read/Write (class students)   | Full           | Full           | Full       |
| `attendancereport` | Read own | Read child        | Generate (class level)        | Full           | Full           | Full       |
| `excuseletter`     | None     | Submit            | Review/Approve (own students) | Review/Approve | Full           | Full       |
| `teacherschedule`  | None     | None              | Read own                      | Full           | Full           | Full       |
| `studentsubject`   | Read own | Read child        | Read (own students)           | Full           | Full           | Full       |
| `notification`     | Receive  | Receive           | Trigger (own students)        | Trigger        | Full           | Full       |
| `registration`     | None     | Apply             | Apply                         | Review/Approve | Review/Approve | Full       |
| `audittrail`       | None     | None              | Logged                        | Read           | Manage         | Full       |
