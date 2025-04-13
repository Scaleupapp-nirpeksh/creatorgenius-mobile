// src/components/navigation/CustomTabBar.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// Tab configuration with icons
type TabConfig = {
  [key: string]: {
    activeIcon: string;
    inactiveIcon: string;
    label: string;
  }
};

const TAB_CONFIG: TabConfig = {
  Dashboard: {
    activeIcon: 'view-dashboard',
    inactiveIcon: 'view-dashboard-outline',
    label: 'Home'
  },
  Generate: {
    activeIcon: 'lightbulb-on',
    inactiveIcon: 'lightbulb-on-outline',
    label: 'AI Ideas'
  },
  SavedItems: {
    activeIcon: 'bookmark-multiple',
    inactiveIcon: 'bookmark-multiple-outline',
    label: 'Saved'
  },
  Calendar: {
    activeIcon: 'calendar-month',
    inactiveIcon: 'calendar-month-outline',
    label: 'Calendar'
  },
  Trends: {
    activeIcon: 'trending-up',
    inactiveIcon: 'trending-up',
    label: 'Trends'
  },
  SEO: {
    activeIcon: 'magnify',
    inactiveIcon: 'magnify',
    label: 'SEO'
  },
  Scripts: {
    activeIcon: 'script-text',
    inactiveIcon: 'script-text-outline',
    label: 'Scripts'
  }
};

// Use BottomTabBarProps from React Navigation
const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Filter out hidden tabs
  const visibleRoutes = state.routes.filter(
    route => route.name !== 'AccountSettings'
  );
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.elevation.level2,
        paddingBottom: insets.bottom || 8,
        borderTopColor: theme.colors.outlineVariant
      }
    ]}>
      {visibleRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const config = TAB_CONFIG[route.name];
        const label = config?.label || route.name;
        const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);
        
        // Get the appropriate icon name
        const iconName = isFocused ? config?.activeIcon : config?.inactiveIcon;
        
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // @ts-ignore: React Navigation's navigate method handles params correctly
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={styles.tabButton}
          >
            <View style={[
              styles.tabContent,
              isFocused && { 
                backgroundColor: theme.colors.primaryContainer,
                borderRadius: 16 
              }
            ]}>
              {iconName && (
                <MaterialCommunityIcons
                  name={iconName}
                  size={22}
                  color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  style={styles.icon}
                />
              )}
              
              <Text 
                style={[
                  styles.tabLabel,
                  { 
                    color: isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant,
                    fontWeight: isFocused ? '600' : '400',
                  }
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 68, // Increased height to accommodate icons better
    width: '100%', // Ensure full width
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2, // Reduce horizontal padding to fit all tabs
    paddingTop: 8, // Add padding to the top to prevent icons from being cut
  },
  tabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    width: '100%', // Full width of the tab button
    height: 44, // Reduced height of tab content to fit better
  },
  icon: {
    marginBottom: 3, // Add margin to ensure proper spacing between icon and text
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 1, // Reduced from 2 to bring label closer to icon
    textAlign: 'center',
  }
});

export default CustomTabBar;