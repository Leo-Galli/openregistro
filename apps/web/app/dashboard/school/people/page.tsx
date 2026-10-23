import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@openregistro/ui';
import { auth } from '@/auth';
import { schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { CreatePersonDialog } from '@/components/school/create-person-dialog';
import { setUserActive } from './actions';

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
  const viewerId = userIdOf(session!);
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
            <TableHead />
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
              <TableCell>
                {person.id === viewerId ? null : (
                  <form action={setUserActive}>
                    <input type="hidden" name="userId" value={person.id} />
                    <input type="hidden" name="isActive" value={(!person.isActive).toString()} />
                    <Button type="submit" size="sm" variant="outline">
                      {person.isActive ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </form>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
