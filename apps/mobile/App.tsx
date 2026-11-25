import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { fetchDirectorySchools, type DirectorySchool } from './src/api';

const STORAGE_KEY = 'openregistro.selectedSchool';

const KIND_LABEL: Record<DirectorySchool['kind'], string> = {
  demo: 'Demo',
  hosted: 'Hosted',
  self_hosted: 'Self-hosted',
};

export default function App() {
  const [schools, setSchools] = useState<DirectorySchool[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DirectorySchool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, stored] = await Promise.all([
        fetchDirectorySchools(),
        AsyncStorage.getItem(STORAGE_KEY),
      ]);
      setSchools(list);
      if (stored) {
        const parsed = JSON.parse(stored) as DirectorySchool;
        const stillThere = list.find((school) => school.id === parsed.id);
        if (stillThere) setSelected(stillThere);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load schools.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (school) => school.name.toLowerCase().includes(q) || school.baseUrl.toLowerCase().includes(q),
    );
  }, [schools, query]);

  const handleSelect = async (school: DirectorySchool) => {
    setSelected(school);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(school));
  };

  const handleChangeSchool = async () => {
    setSelected(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  if (selected) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffcd29" />
        <View style={styles.webHeader}>
          <Pressable
            onPress={handleChangeSchool}
            accessibilityRole="button"
            accessibilityLabel="Change school"
            style={styles.changeButton}
          >
            <Text style={styles.changeButtonText}>Change school</Text>
          </Pressable>
          <Text style={styles.webTitle} numberOfLines={1}>
            {selected.name}
          </Text>
        </View>
        <WebView
          source={{ uri: `${selected.baseUrl.replace(/\/+$/, '')}/login` }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#2350e7" />
            </View>
          )}
          style={styles.webview}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffcd29" />
      <View style={styles.hero}>
        <Text style={styles.brand}>OpenRegistro</Text>
        <Text style={styles.subtitle}>Choose your school to sign in</Text>
      </View>

      <View style={styles.body}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search schools"
          placeholderTextColor="#5a5f72"
          accessibilityLabel="Search schools"
          style={styles.search}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2350e7" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={load} style={styles.retry} accessibilityRole="button">
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No schools match that search.</Text>}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => void handleSelect(item)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.name}`}
                style={styles.card}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{KIND_LABEL[item.kind]}</Text>
                  </View>
                </View>
                <Text style={styles.cardUrl}>{item.baseUrl}</Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fffbeb' },
  hero: {
    backgroundColor: '#ffcd29',
    borderBottomWidth: 2,
    borderBottomColor: '#151b32',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: '#151b32',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
    color: '#151b32',
    opacity: 0.8,
  },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  search: {
    borderWidth: 2,
    borderColor: '#151b32',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#151b32',
    marginBottom: 12,
  },
  list: { paddingBottom: 32, gap: 10 },
  card: {
    borderWidth: 2,
    borderColor: '#151b32',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    padding: 14,
    shadowColor: '#151b32',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#151b32',
  },
  badge: {
    borderWidth: 2,
    borderColor: '#151b32',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#e8edfc',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#151b32',
  },
  cardUrl: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#5a5f72',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  error: { color: '#d41f32', textAlign: 'center', fontWeight: '600' },
  retry: {
    borderWidth: 2,
    borderColor: '#151b32',
    borderRadius: 10,
    backgroundColor: '#2350e7',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { color: '#fffbeb', fontWeight: '800' },
  empty: { textAlign: 'center', color: '#5a5f72', marginTop: 24 },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffcd29',
    borderBottomWidth: 2,
    borderBottomColor: '#151b32',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  changeButton: {
    borderWidth: 2,
    borderColor: '#151b32',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  changeButtonText: { fontWeight: '800', color: '#151b32', fontSize: 13 },
  webTitle: { flex: 1, fontWeight: '700', color: '#151b32' },
  webview: { flex: 1 },
});
