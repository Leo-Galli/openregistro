export type DirectorySchool = {
  id: string;
  name: string;
  baseUrl: string;
  kind: 'demo' | 'hosted' | 'self_hosted';
};

export const DIRECTORY_API_URL =
  'https://api.openregistro.another-horizon.eu/api/directory/schools';

export async function fetchDirectorySchools(): Promise<DirectorySchool[]> {
  const response = await fetch(DIRECTORY_API_URL);
  if (!response.ok) {
    throw new Error(`Could not load schools (HTTP ${response.status}).`);
  }
  const body = (await response.json()) as { schools?: DirectorySchool[] };
  return body.schools ?? [];
}
