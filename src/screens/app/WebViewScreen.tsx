// src/screens/app/WebViewScreen.tsx
import React, { useState, useRef } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme, Appbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { WebView, WebViewNavigation } from 'react-native-webview';

type ParamList = {
  WebView: {
    url: string;
    title?: string;
  };
};

const WebViewScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'WebView'>>();
  const { url, title = 'Web Content' } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(url);
  const webviewRef = useRef<WebView>(null);
  
  // Handle navigation state change
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCurrentUrl(navState.url);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['left', 'right']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={title} subtitle={currentUrl} />
        <Appbar.Action icon="reload" onPress={() => {
          setLoading(true);
          webviewRef.current?.reload();
        }} />
      </Appbar.Header>
      
      <WebView
        ref={webviewRef}
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator 
            style={styles.loader} 
            size="large" 
            color={theme.colors.primary} 
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WebViewScreen;