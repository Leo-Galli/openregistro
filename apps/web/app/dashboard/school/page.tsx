import { redirect } from 'next/navigation';

export default function SchoolIndexPage() {
  redirect('/dashboard/school/classes');
}
