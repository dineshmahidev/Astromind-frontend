import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

const TABS = [
  { name: 'index',       label: 'Home',       icon: 'home',              iconOut: 'home-outline', route: '/(astro-tabs)' },
  { name: 'clients',     label: 'Clients',    icon: 'people',            iconOut: 'people-outline', route: '/(astro-tabs)/clients' },
  { name: 'profile',     label: 'Profile',    icon: 'person',            iconOut: 'person-outline', route: '/(astro-tabs)/profile' },
];

interface AstroCustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function AstroCustomTabBar({ state, descriptors, navigation }: AstroCustomTabBarProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const tabAnims = useRef(TABS.map(t => ({
    label: new Animated.Value(0),
    scale: new Animated.Value(1)
  }))).current;

  const tabWidth = (width - 40) / TABS.length;

  const activeTabName = state.routes[state.index]?.name;
  const matchByPath = TABS.findIndex(t => t.route === pathname || (t.name === 'index' && (pathname === '/' || pathname === '/(astro-tabs)')));
  const activeIndex = matchByPath >= 0 ? matchByPath : TABS.findIndex(t => t.name === activeTabName);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: Math.max(0, activeIndex) * tabWidth,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();

    TABS.forEach((tab, index) => {
      const focused = activeIndex === index;
      Animated.parallel([
        Animated.spring(tabAnims[index].scale, {
          toValue: focused ? 1.1 : 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(tabAnims[index].label, {
          toValue: focused ? 1 : 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeIndex, pathname]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.pill,
            { width: tabWidth - 10, transform: [{ translateX: slideAnim }] },
          ]}
        />

        {TABS.map((tab, index) => {
          const focused = activeIndex === index;
          const { label: labelAnim, scale: scaleAnim } = tabAnims[index];

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={() => {
                const route = state.routes.find((r: any) => r.name === tab.name);
                if (route) navigation.navigate(route.name);
              }}
            >
              <Animated.View 
                style={{ 
                  transform: [
                    { scale: scaleAnim },
                    { translateY: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [7, 0] }) }
                  ], 
                  alignItems: 'center' 
                }}
              >
                <Ionicons
                  name={focused ? tab.icon as any : tab.iconOut as any}
                  size={22}
                  color={focused ? '#fff' : '#555'}
                />
                <Animated.Text
                  style={[
                    styles.label,
                    {
                      opacity: labelAnim,
                      transform: [{ translateY: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [5, 0] }) }],
                      color: '#fff',
                    },
                  ]}
                >
                  {tab.label}
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    shadowColor: '#6c5ce7',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(12, 12, 28, 0.97)',
    borderRadius: 30,
    height: 65,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.25)',
    overflow: 'hidden',
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    left: 5,
    top: 8,
    height: 49,
    borderRadius: 22,
    backgroundColor: '#6c5ce7',
    shadowColor: '#6c5ce7',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
