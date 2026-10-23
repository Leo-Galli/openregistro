import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: 'Helvetica' },
  title: { fontSize: 18, marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#555555', marginBottom: 24 },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    paddingVertical: 6,
  },
  headerRow: { fontWeight: 700, borderBottomWidth: 2, borderBottomColor: '#111111' },
  subjectCell: { flex: 2 },
  gradeCell: { flex: 1, textAlign: 'right' },
  commentCell: { flex: 3, color: '#444444' },
  empty: { marginTop: 24, color: '#555555' },
});

export interface ReportCardRow {
  subjectName: string;
  finalGrade: number;
  comment: string | null;
}

export function ReportCardDocument({
  schoolName,
  studentName,
  className,
  termLabel,
  rows,
}: {
  schoolName: string;
  studentName: string;
  className: string;
  termLabel: string;
  rows: ReportCardRow[];
}) {
  return (
    <Document title={`Report card - ${studentName} - ${termLabel}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{schoolName}</Text>
        <Text style={styles.subtitle}>
          Report card for {studentName} · {className} · {termLabel}
        </Text>

        {rows.length === 0 ? (
          <Text style={styles.empty}>No term evaluations recorded yet.</Text>
        ) : (
          <View>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={styles.subjectCell}>Subject</Text>
              <Text style={styles.gradeCell}>Grade</Text>
              <Text style={styles.commentCell}>Comment</Text>
            </View>
            {rows.map((row) => (
              <View key={row.subjectName} style={styles.row}>
                <Text style={styles.subjectCell}>{row.subjectName}</Text>
                <Text style={styles.gradeCell}>{row.finalGrade.toFixed(2)}</Text>
                <Text style={styles.commentCell}>{row.comment ?? ''}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
