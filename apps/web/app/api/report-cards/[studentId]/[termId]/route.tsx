import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { hasPermission, isGuardianOfStudent, termIdSchema, userIdSchema } from '@openregistro/core';
import { auth } from '@/auth';
import { schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { ReportCardDocument, type ReportCardRow } from '@/lib/report-card-pdf';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string; termId: string }> },
) {
  const session = await auth();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { studentId: rawStudentId, termId: rawTermId } = await params;
  const parsedStudentId = userIdSchema.safeParse(rawStudentId);
  const parsedTermId = termIdSchema.safeParse(rawTermId);
  if (!parsedStudentId.success || !parsedTermId.success) {
    return new NextResponse('Not found', { status: 404 });
  }

  const storage = await getStorage();
  const viewerId = userIdOf(session);
  const role = session.user.role;

  if (role === 'student') {
    if (parsedStudentId.data !== viewerId) return new NextResponse('Forbidden', { status: 403 });
  } else if (role === 'guardian') {
    const guardianships = await storage.guardianships.findMany({ guardianId: viewerId });
    if (!isGuardianOfStudent(guardianships, viewerId, parsedStudentId.data)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  } else if (!hasPermission(role, 'reports:read')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const [student, term, school] = await Promise.all([
    storage.users.findById(parsedStudentId.data),
    storage.terms.findById(parsedTermId.data),
    storage.schools.findById(schoolIdOf(session)),
  ]);
  if (!student || !term || !school) return new NextResponse('Not found', { status: 404 });

  const enrollments = await storage.enrollments.findMany({ studentId: student.id });
  const activeEnrollment = enrollments.find((e) => !e.withdrawnAt);
  const klass = activeEnrollment ? await storage.classes.findById(activeEnrollment.classId) : null;

  const evaluations = await storage.termEvaluations.findMany({
    studentId: student.id,
    termId: term.id,
  });
  const subjects = await Promise.all(
    evaluations.map((e) => storage.subjects.findById(e.subjectId)),
  );
  const rows: ReportCardRow[] = evaluations.map((evaluation, index) => ({
    subjectName: subjects[index]?.name ?? 'Unknown',
    finalGrade: evaluation.finalGrade,
    comment: evaluation.comment,
  }));

  const buffer = await renderToBuffer(
    <ReportCardDocument
      schoolName={school.name}
      studentName={student.fullName}
      className={klass?.name ?? 'Not enrolled'}
      termLabel={term.label}
      rows={rows}
    />,
  );

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="report-card-${student.fullName.replace(/\s+/g, '-').toLowerCase()}-${term.label.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
    },
  });
}
