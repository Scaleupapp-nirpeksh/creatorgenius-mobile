// src/screens/app/CalendarScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator, Chip, IconButton, FAB, Menu } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import { getScheduledContent, ScheduledContent } from '../../services/calendarService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type MarkedDates = {
  [date: string]: {
    marked: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
  };
};

type StatusColors = {
  [key: string]: string;
};

const CalendarScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [scheduledItems, setScheduledItems] = useState<ScheduledContent[]>([]);
  const [filteredItems, setFilteredItems] = useState<ScheduledContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  
  const statusColors: StatusColors = {
    scheduled: theme.colors.primary, // blue
    'in-progress': '#F59E0B', // amber
    posted: '#10B981', // green
    delayed: '#EF4444', // red
  };
  
  // Fetch calendar data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCalendarData();
    }, [])
  );
  
  // Fetch calendar data
  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the first day of current month
      const date = new Date(selectedDate);
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      // Get the last day of current month
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
      
      // Fetch schedule data for current month
      const response = await getScheduledContent({
        startDate: firstDay,
        endDate: lastDay
      });
      
      // Process the data
      setScheduledItems(response.data || []);
      processCalendarData(response.data || [], selectedDate);
      
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
      setError('Failed to load calendar data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Process calendar data to mark dates and filter items
  const processCalendarData = (items: ScheduledContent[], currentDate: string) => {
    // Create marked dates for calendar
    const marked: MarkedDates = {};
    
    // Group by date
    const itemsByDate = items.reduce((acc, item) => {
      const dateKey = new Date(item.scheduledDate).toISOString().split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {} as { [key: string]: ScheduledContent[] });
    
    // Create marks for dates with content
    Object.keys(itemsByDate).forEach(date => {
      const itemsForDate = itemsByDate[date];
      // Use status color of first item for now (you can extend this)
      const firstItem = itemsForDate[0];
      const color = statusColors[firstItem.status] || theme.colors.primary;
      
      marked[date] = {
        marked: true,
        dotColor: color,
        ...(date === currentDate && {
          selected: true,
          selectedColor: theme.colors.primaryContainer
        })
      };
    });
    
    // Make sure current date is also marked if selected
    if (!marked[currentDate]) {
      marked[currentDate] = {
        marked: false,
        selected: true,
        selectedColor: theme.colors.primaryContainer
      };
    }
    
    setMarkedDates(marked);
    
    // Filter items for the selected date
    filterItemsByDate(items, currentDate);
  };
  
  // Filter items by selected date
  const filterItemsByDate = (items: ScheduledContent[], date: string) => {
    const filtered = items.filter(item => {
      const itemDate = new Date(item.scheduledDate).toISOString().split('T')[0];
      return itemDate === date;
    });
    
    if (statusFilter) {
      setFilteredItems(filtered.filter(item => item.status === statusFilter));
    } else {
      setFilteredItems(filtered);
    }
  };
  
  // Handle date selection on calendar
  const onDayPress = (day: DateData) => {
    const newSelectedDate = day.dateString;
    setSelectedDate(newSelectedDate);
    
    const newMarkedDates = { ...markedDates };
    Object.keys(newMarkedDates).forEach(date => {
      if (newMarkedDates[date].selected) {
        newMarkedDates[date] = {
          ...newMarkedDates[date],
          selected: false
        };
      }
    });
    
    newMarkedDates[newSelectedDate] = {
      ...(newMarkedDates[newSelectedDate] || { marked: false }),
      selected: true,
      selectedColor: theme.colors.primaryContainer
    };
    
    setMarkedDates(newMarkedDates);
    filterItemsByDate(scheduledItems, newSelectedDate);
  };
  
  // Apply status filter
  const applyStatusFilter = (status: string | null) => {
    setStatusFilter(status);
    setMenuVisible(false);
    
    if (status) {
      setFilteredItems(
        scheduledItems.filter(item => {
          const itemDate = new Date(item.scheduledDate).toISOString().split('T')[0];
          return itemDate === selectedDate && item.status === status;
        })
      );
    } else {
      filterItemsByDate(scheduledItems, selectedDate);
    }
  };
  
  // Navigate to item detail
  const navigateToItemDetail = (itemId: string) => {
    navigation.navigate('ScheduleDetail', { id: itemId });
  };
  
  // Navigate to add schedule screen
  const navigateToAddSchedule = () => {
    navigation.navigate('AddSchedule');
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };
  
  // Format time for display
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  // Get status chip color
  const getStatusColor = (status: string): string => {
    return statusColors[status] || theme.colors.primary;
  };
  
  // Render status filter menu
  const renderStatusFilterMenu = () => (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Button 
          mode="outlined" 
          onPress={() => setMenuVisible(true)} 
          icon="filter-variant"
          style={styles.filterButton}
        >
          {statusFilter || 'Filter By Status'}
        </Button>
      }
    >
      <Menu.Item 
        onPress={() => applyStatusFilter(null)} 
        title="All Status"
        leadingIcon="filter-remove"
      />
      <Menu.Item 
        onPress={() => applyStatusFilter('scheduled')} 
        title="Scheduled"
        leadingIcon="calendar-clock"
      />
      <Menu.Item 
        onPress={() => applyStatusFilter('in-progress')} 
        title="In Progress"
        leadingIcon="progress-clock"
      />
      <Menu.Item 
        onPress={() => applyStatusFilter('posted')} 
        title="Posted"
        leadingIcon="check-circle"
      />
      <Menu.Item 
        onPress={() => applyStatusFilter('delayed')} 
        title="Delayed"
        leadingIcon="clock-alert"
      />
    </Menu>
  );
  
  // Render scheduled item card using Approach 1: Column layout for header
  const renderScheduledItem = (item: ScheduledContent) => (
    <Card 
      key={item._id} 
      style={styles.itemCard}
      onPress={() => navigateToItemDetail(item._id)}
    >
      <Card.Content>
        <View style={styles.itemHeader}>
          <Text variant="titleMedium" numberOfLines={2} style={styles.ideaTitle}>
            {item.ideaId?.title || 'Untitled Content'}
          </Text>
          <Chip 
            style={[styles.statusChip, { backgroundColor: `${getStatusColor(item.status)}20` }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
        </View>
        
        <View style={styles.itemDetail}>
          <View style={styles.itemDetailRow}>
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={16} 
              color={theme.colors.onSurfaceVariant} 
              style={styles.itemIcon}
            />
            <Text variant="bodySmall">{formatTime(item.scheduledDate)}</Text>
          </View>
          
          <View style={styles.itemDetailRow}>
            <MaterialCommunityIcons 
              name="monitor-cellphone" 
              size={16} 
              color={theme.colors.onSurfaceVariant} 
              style={styles.itemIcon}
            />
            <Text variant="bodySmall">{item.publishingPlatform}</Text>
          </View>
          
          {item.priority && (
            <View style={styles.itemDetailRow}>
              <MaterialCommunityIcons 
                name="flag-outline" 
                size={16} 
                color={theme.colors.onSurfaceVariant} 
                style={styles.itemIcon}
              />
              <Text variant="bodySmall">Priority: {item.priority}</Text>
            </View>
          )}
        </View>
        
        {item.postingNotes && (
          <View style={styles.notes}>
            <Text variant="bodySmall" numberOfLines={2}>{item.postingNotes}</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Content Calendar</Text>
        {renderStatusFilterMenu()}
      </View>
      
      {/* Calendar Component */}
      <RNCalendar
        current={selectedDate}
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          calendarBackground: theme.colors.background,
          textSectionTitleColor: theme.colors.onSurface,
          dayTextColor: theme.colors.onSurface,
          todayTextColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.onPrimaryContainer,
          monthTextColor: theme.colors.onSurface,
          indicatorColor: theme.colors.primary,
          textDisabledColor: theme.colors.surfaceVariant,
          arrowColor: theme.colors.primary,
        }}
        style={styles.calendar}
      />
      
      <View style={styles.selectedDateHeader}>
        <Text variant="titleMedium">{formatDate(selectedDate)}</Text>
        <Text variant="bodySmall">
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} scheduled
        </Text>
      </View>
      
      {/* Scheduled Items List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          <Button mode="contained" onPress={fetchCalendarData} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="calendar-blank-outline" 
            size={64} 
            color={theme.colors.primary} 
          />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No content scheduled
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {statusFilter 
              ? `No "${statusFilter}" items scheduled for this date.` 
              : 'Schedule content for this date to see it here.'}
          </Text>
          <Button 
            mode="contained" 
            onPress={navigateToAddSchedule} 
            style={styles.emptyButton}
            icon="calendar-plus"
          >
            Schedule Content
          </Button>
        </View>
      ) : (
        <ScrollView
          style={styles.itemsList}
          contentContainerStyle={styles.itemsListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.map(item => renderScheduledItem(item))}
        </ScrollView>
      )}
      
      {/* FAB to add new scheduled item */}
      <FAB
        icon="calendar-plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={navigateToAddSchedule}
        color={theme.colors.onPrimary}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  filterButton: {
    height: 40,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  selectedDateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemsList: {
    flex: 1,
  },
  itemsListContent: {
    padding: 16,
    paddingBottom: 80,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'column',   // Column layout
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ideaTitle: {
    marginBottom: 4,
  },
  statusChip: {
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  itemDetail: {
    marginBottom: 8,
  },
  itemDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemIcon: {
    marginRight: 8,
  },
  notes: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default CalendarScreen;
