import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@openregistro/ui';
import { auth } from '@/auth';
import { schoolIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { CreateTermDialog } from '@/components/school/create-term-dialog';

const KIND_LABELS: Record<string, string> = {
  trimester: 'Trimester',
  semester: 'Semester',
};

export default async function TermsPage() {
  const session = await auth();
  const schoolId = schoolIdOf(session!);
  const storage = await getStorage();
  const [schoolYear] = await storage.schoolYears.findMany({ schoolId, isActive: true });
  const terms = schoolYear ? await storage.terms.findMany({ schoolYearId: schoolYear.id }) : [];
  const sorted = [...terms].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="flex flex-col gap-4">
      {!schoolYear ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No active school year configured yet.
        </p>
      ) : (
        <>
          <div className="flex justify-end">
            <CreateTermDialog nextSequence={sorted.length + 1} />
          </div>

          {sorted.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No terms yet. Grades and report cards need at least one term.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead>Ends</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell className="font-medium">{term.label}</TableCell>
                    <TableCell>{KIND_LABELS[term.kind]}</TableCell>
                    <TableCell>{term.startDate}</TableCell>
                    <TableCell>{term.endDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
