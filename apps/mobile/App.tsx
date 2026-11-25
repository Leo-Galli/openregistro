import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';
import { fetchDirectorySchools, type DirectorySchool } from './src/api';

const STORAGE_KEY = 'openregistro.selectedSchool';

const KIND_LABEL: Record<DirectorySchool['kind'], string> = {
  demo: 'Demo',
  hosted: 'Hosted by us',
  self_hosted: 'Self-hosted',
};

const ROLE_LABEL: Record<string, string> = {
  school_admin: 'School admin',
  secretary: 'Secretary',
  principal: 'Principal',
  teacher: 'Teacher',
  student: 'Student',
  guardian: 'Guardian',
};

const ROLE_ACCENT: Record<string, string> = {
  school_admin: '#2350e7',
  secretary: '#2350e7',
  principal: '#2350e7',
  teacher: '#20b657',
  student: '#f9911a',
  guardian: '#ef5478',
};

type MobileSession = {
  role: string;
  name: string;
  school: string;
  schoolId: string;
};

const SESSION_BRIDGE_JS = `
(function () {
  function readSession() {
    var el = document.getElementById('openregistro-mobile-session');
    if (!el) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'session', session: null }));
      return;
    }
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'session',
      session: {
        role: el.getAttribute('data-role') || '',
        name: el.getAttribute('data-name') || '',
        school: el.getAttribute('data-school') || '',
        schoolId: el.getAttribute('data-school-id') || ''
      }
    }));
  }
  readSession();
  setInterval(readSession, 1500);
  true;
})();
`;

export default function App() {
  const [schools, setSchools] = useState<DirectorySchool[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DirectorySchool | null>(null);
  const [session, setSession] = useState<MobileSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webRef = useRef<WebView>(null);

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
    setSession(null);
    setSelected(school);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(school));
  };

  const handleChangeSchool = async () => {
    setSelected(null);
    setSession(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        type: string;
        session: MobileSession | null;
      };
      if (payload.type !== 'session') return;
      setSession(payload.session);
    } catch {
      // ignore malformed bridge messages
    }
  };

  const handleNav = (nav: WebViewNavigation) => {
    if (nav.url.includes('/login') || nav.url.endsWith('/')) {
      setSession(null);
    }
  };

  if (selected) {
    const accent = session ? (ROLE_ACCENT[session.role] ?? '#2350e7') : '#ffcd29';
    const roleLabel = session ? (ROLE_LABEL[session.role] ?? session.role) : null;

    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={accent} />
        <View style={[styles.webHeader, { backgroundColor: accent }]}>
          <Pressable
            onPress={handleChangeSchool}
            accessibilityRole="button"
            accessibilityLabel="Change school"
            style={styles.changeButton}
          >
            <Text style={styles.changeButtonText}>Schools</Text>
          </Pressable>
          <View style={styles.webHeaderText}>
            <Text style={styles.webTitle} numberOfLines={1}>
              {session?.school || selected.name}
            </Text>
            <Text style={styles.webSubtitle} numberOfLines={1}>
              {session
                ? `${session.name}${roleLabel ? ` · ${roleLabel}` : ''}`
                : 'Sign in to continue'}
            </Text>
          </View>
        </View>
        <WebView
          ref={webRef}
          source={{ uri: `${selected.baseUrl.replace(/\/+$/, '')}/login` }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          onMessage={handleMessage}
          onNavigationStateChange={handleNav}
          injectedJavaScript={SESSION_BRIDGE_JS}
          onLoadEnd={() => webRef.current?.injectJavaScript(SESSION_BRIDGE_JS)}
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
        <Text style={styles.subtitle}>Pick your school, then sign in with your account</Text>
        <Text style={styles.heroHint}>
          Hosted and self-hosted schools appear here. Your role (teacher, student, guardian, …) is
          detected after login.
        </Text>
      </View>

      <View style={styles.body}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by school name or URL"
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
                  <View
                    style={[
                      styles.badge,
                      item.kind === 'demo'
                        ? styles.badgeDemo
                        : item.kind === 'hosted'
                          ? styles.badgeHosted
                          : styles.badgeSelf,
                    ]}
                  >
                    <Text style={styles.badgeText}>{KIND_LABEL[item.kind]}</Text>
                  </View>
                </View>
                <Text style={styles.cardUrl}>{item.baseUrl}</Text>
                <Text style={styles.cardCta}>Continue to sign in</Text>
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
    fontSize: 30,
    fontWeight: '800',
    color: '#151b32',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#151b32',
  },
  heroHint: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#151b32',
    opacity: 0.75,
    lineHeight: 18,
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
  list: { paddingBottom: 32, gap: 12 },
  card: {
    borderWidth: 2,
    borderColor: '#151b32',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    padding: 14,
    shadowColor: '#151b32',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
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
    fontWeight: '800',
    color: '#151b32',
  },
  badge: {
    borderWidth: 2,
    borderColor: '#151b32',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeDemo: { backgroundColor: '#f67996' },
  badgeHosted: { backgroundColor: '#e8edfc' },
  badgeSelf: { backgroundColor: '#fff3cc' },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#151b32',
  },
  cardUrl: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#5a5f72',
  },
  cardCta: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '800',
    color: '#2350e7',
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
  webHeaderText: { flex: 1 },
  webTitle: { fontWeight: '800', color: '#151b32', fontSize: 15 },
  webSubtitle: { marginTop: 2, fontWeight: '600', color: '#151b32', opacity: 0.85, fontSize: 12 },
  webview: { flex: 1 },
});
