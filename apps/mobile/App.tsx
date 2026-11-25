import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import { LinearGradient } from 'expo-linear-gradient';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';
import { fetchDirectorySchools, type DirectorySchool } from './src/api';

const STORAGE_KEY = 'openregistro.selectedSchool';

const COLORS = {
  ink: '#151b32',
  cream: '#fffbeb',
  yellow: '#ffcd29',
  yellowDeep: '#ffc300',
  cobalt: '#2350e7',
  cobaltSoft: '#e8edfc',
  pink: '#f67996',
  muted: '#5a5f72',
  white: '#ffffff',
  success: '#20b657',
  danger: '#d41f32',
  orange: '#f9911a',
};

const KIND_LABEL: Record<DirectorySchool['kind'], string> = {
  demo: 'Demo',
  hosted: 'Hosted',
  self_hosted: 'Self-hosted',
};

const KIND_COLOR: Record<DirectorySchool['kind'], string> = {
  demo: COLORS.pink,
  hosted: COLORS.cobaltSoft,
  self_hosted: '#fff3cc',
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
  school_admin: COLORS.cobalt,
  secretary: COLORS.cobalt,
  principal: COLORS.cobalt,
  teacher: COLORS.success,
  student: COLORS.orange,
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

function SchoolCard({
  school,
  index,
  onPress,
}: {
  school: DirectorySchool;
  index: number;
  onPress: () => void;
}) {
  const appear = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 420,
      delay: 80 + index * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [appear, index]);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: appear,
        transform: [
          {
            translateY: appear.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            }),
          },
          { scale },
        ],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Open ${school.name}`}
        style={styles.card}
      >
        <View style={styles.cardAccent} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {school.name}
            </Text>
            <View style={[styles.badge, { backgroundColor: KIND_COLOR[school.kind] }]}>
              <Text style={styles.badgeText}>{KIND_LABEL[school.kind]}</Text>
            </View>
          </View>
          <Text style={styles.cardUrl} numberOfLines={1}>
            {school.baseUrl.replace(/^https?:\/\//, '')}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardCta}>Continue</Text>
            <Text style={styles.cardArrow}>→</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function App() {
  const [schools, setSchools] = useState<DirectorySchool[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DirectorySchool | null>(null);
  const [session, setSession] = useState<MobileSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webRef = useRef<WebView>(null);
  const heroAnim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [heroAnim, pulse]);

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
    const accent = session ? (ROLE_ACCENT[session.role] ?? COLORS.cobalt) : COLORS.yellow;
    const roleLabel = session ? (ROLE_LABEL[session.role] ?? session.role) : null;
    const headerLight = !session;

    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle={headerLight ? 'dark-content' : 'light-content'}
          backgroundColor={accent}
        />
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
            <Text
              style={[styles.webTitle, !headerLight && styles.webTitleOnColor]}
              numberOfLines={1}
            >
              {session?.school || selected.name}
            </Text>
            <Text
              style={[styles.webSubtitle, !headerLight && styles.webSubtitleOnColor]}
              numberOfLines={1}
            >
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
              <ActivityIndicator size="large" color={COLORS.cobalt} />
            </View>
          )}
          style={styles.webview}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellow} />
      <Animated.View
        style={[
          styles.heroWrap,
          {
            opacity: heroAnim,
            transform: [
              {
                translateY: heroAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-16, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[COLORS.yellow, COLORS.yellowDeep, '#ffe799']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.blob,
              styles.blobOne,
              {
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.08],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.blob,
              styles.blobTwo,
              {
                opacity: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 0.55],
                }),
              },
            ]}
          />
          <Text style={styles.brandMark}>OR</Text>
          <Text style={styles.brand}>OpenRegistro</Text>
          <Text style={styles.subtitle}>Your school register, in your pocket</Text>
          <Text style={styles.heroHint}>
            Pick a hosted or self-hosted school. After you sign in, we detect your role
            automatically.
          </Text>
        </LinearGradient>
      </Animated.View>

      <View style={styles.body}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search schools"
            placeholderTextColor={COLORS.muted}
            accessibilityLabel="Search schools"
            style={styles.search}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.cobalt} />
            <Text style={styles.loadingText}>Loading schools…</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Could not load schools</Text>
              <Text style={styles.error}>{error}</Text>
              <Pressable
                onPress={load}
                style={styles.retry}
                accessibilityRole="button"
                accessibilityLabel="Retry loading schools"
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.empty}>No schools match that search.</Text>}
            renderItem={({ item, index }) => (
              <SchoolCard school={item} index={index} onPress={() => void handleSelect(item)} />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  heroWrap: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.ink,
  },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 26,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.ink,
  },
  blobOne: {
    width: 140,
    height: 140,
    right: -36,
    top: -40,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  blobTwo: {
    width: 90,
    height: 90,
    left: -28,
    bottom: -24,
    backgroundColor: COLORS.pink,
  },
  brandMark: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.ink,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: 1,
  },
  brand: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
  },
  heroHint: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
    opacity: 0.78,
    lineHeight: 19,
    maxWidth: 340,
  },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.ink,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    marginBottom: 14,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    color: COLORS.muted,
    marginRight: 8,
    fontWeight: '700',
  },
  search: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.ink,
    fontWeight: '600',
  },
  list: { paddingBottom: 36, gap: 14 },
  card: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: COLORS.ink,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    shadowColor: COLORS.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardAccent: {
    width: 8,
    backgroundColor: COLORS.cobalt,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  badge: {
    borderWidth: 2,
    borderColor: COLORS.ink,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink,
  },
  cardUrl: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'monospace',
    color: COLORS.muted,
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardCta: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.cobalt,
  },
  cardArrow: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.cobalt,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: {
    color: COLORS.muted,
    fontWeight: '700',
  },
  errorCard: {
    width: '100%',
    borderWidth: 2,
    borderColor: COLORS.ink,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    padding: 18,
    gap: 10,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.ink,
  },
  error: { color: COLORS.danger, fontWeight: '600', lineHeight: 20 },
  retry: {
    marginTop: 4,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: COLORS.ink,
    borderRadius: 12,
    backgroundColor: COLORS.cobalt,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { color: COLORS.cream, fontWeight: '900' },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 28, fontWeight: '600' },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.ink,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  changeButton: {
    borderWidth: 2,
    borderColor: COLORS.ink,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  changeButtonText: { fontWeight: '900', color: COLORS.ink, fontSize: 13 },
  webHeaderText: { flex: 1 },
  webTitle: { fontWeight: '900', color: COLORS.ink, fontSize: 15 },
  webTitleOnColor: { color: COLORS.white },
  webSubtitle: { marginTop: 2, fontWeight: '700', color: COLORS.ink, opacity: 0.85, fontSize: 12 },
  webSubtitleOnColor: { color: COLORS.white, opacity: 0.92 },
  webview: { flex: 1 },
});
