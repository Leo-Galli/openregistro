/**
 * Role-level permissions (see roles.ts) only answer "can a teacher ever write
 * grades". They do not answer "can THIS teacher write grades for THIS class".
 * That second question depends on relationship data (assignments,
 * enrollments, guardianships) and is answered here. Server actions and route
 * handlers must call both layers: hasPermission() for the capability, and the
 * relevant scope check below for the specific record being touched.
 */

export interface TeacherClassAssignment {
  teacherId: string;
  classId: string;
}

export interface TeacherClassSubjectAssignment extends TeacherClassAssignment {
  subjectId: string;
}

/** Is this teacher assigned to this class at all, regardless of subject - for class-wide actions like attendance. */
export function canTeacherActOnClass(
  assignments: readonly TeacherClassAssignment[],
  teacherId: string,
  classId: string,
): boolean {
  return assignments.some(
    (assignment) => assignment.teacherId === teacherId && assignment.classId === classId,
  );
}

export function canTeacherActOnClassSubject(
  assignments: readonly TeacherClassSubjectAssignment[],
  teacherId: string,
  classId: string,
  subjectId: string,
): boolean {
  return assignments.some(
    (assignment) =>
      assignment.teacherId === teacherId &&
      assignment.classId === classId &&
      assignment.subjectId === subjectId,
  );
}

export interface GuardianRelationship {
  guardianId: string;
  studentId: string;
}

export function isGuardianOfStudent(
  relationships: readonly GuardianRelationship[],
  guardianId: string,
  studentId: string,
): boolean {
  return relationships.some(
    (relationship) =>
      relationship.guardianId === guardianId && relationship.studentId === studentId,
  );
}

export interface ClassEnrollment {
  studentId: string;
  classId: string;
}

export function isStudentEnrolledInClass(
  enrollments: readonly ClassEnrollment[],
  studentId: string,
  classId: string,
): boolean {
  return enrollments.some(
    (enrollment) => enrollment.studentId === studentId && enrollment.classId === classId,
  );
}
