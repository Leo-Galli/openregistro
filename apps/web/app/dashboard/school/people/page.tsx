import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@openregistro/ui';
import { auth } from '@/auth';
import { schoolIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { CreatePersonDialog } from '@/components/school/create-person-dialog';

const ROLE_LABELS: Record<string, string> = {
  school_admin: 'School admin',
  secretary: 'Secretary office',
  principal: 'Principal',
  teacher: 'Teacher',
  student: 'Student',
  guardian: 'Guardian',
};

export default async function PeoplePage() {
  const session = await auth();
  const schoolId = schoolIdOf(session!);
  const storage = await getStorage();
  const people = await storage.users.findMany({ schoolId });
  const students = people
    .filter((person) => person.role === 'student')
    .map((student) => ({ id: student.id, fullName: student.fullName }));

  const sorted = [...people].sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreatePersonDialog students={students} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((person) => (
            <TableRow key={person.id}>
              <TableCell className="font-medium">{person.fullName}</TableCell>
              <TableCell>{person.email}</TableCell>
              <TableCell>{ROLE_LABELS[person.role] ?? person.role}</TableCell>
              <TableCell>
                <Badge variant={person.isActive ? 'success' : 'secondary'}>
                  {person.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
