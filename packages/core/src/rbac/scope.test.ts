import { describe, expect, it } from 'vitest';
import {
  canTeacherActOnClassSubject,
  isGuardianOfStudent,
  isStudentEnrolledInClass,
} from './scope';

describe('canTeacherActOnClassSubject', () => {
  const assignments = [{ teacherId: 't1', classId: 'c1', subjectId: 's1' }];

  it('allows an assigned teacher for the exact class/subject pair', () => {
    expect(canTeacherActOnClassSubject(assignments, 't1', 'c1', 's1')).toBe(true);
  });

  it('denies the same teacher for a different subject', () => {
    expect(canTeacherActOnClassSubject(assignments, 't1', 'c1', 's2')).toBe(false);
  });

  it('denies an unrelated teacher', () => {
    expect(canTeacherActOnClassSubject(assignments, 't2', 'c1', 's1')).toBe(false);
  });
});

describe('isGuardianOfStudent', () => {
  const relationships = [{ guardianId: 'g1', studentId: 'st1' }];

  it('confirms an existing relationship', () => {
    expect(isGuardianOfStudent(relationships, 'g1', 'st1')).toBe(true);
  });

  it('rejects a guardian accessing an unrelated student', () => {
    expect(isGuardianOfStudent(relationships, 'g1', 'st2')).toBe(false);
  });
});

describe('isStudentEnrolledInClass', () => {
  const enrollments = [{ studentId: 'st1', classId: 'c1' }];

  it('confirms enrollment', () => {
    expect(isStudentEnrolledInClass(enrollments, 'st1', 'c1')).toBe(true);
  });

  it('rejects a student not enrolled in the class', () => {
    expect(isStudentEnrolledInClass(enrollments, 'st1', 'c2')).toBe(false);
  });
});
