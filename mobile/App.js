import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/theme';
import AuthScreen from './src/screens/AuthScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import PlansScreen from './src/screens/PlansScreen';
import ChatsScreen from './src/screens/ChatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { setAuthToken } from './src/api';

function MainApp() {
  const { theme, isDarkMode } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('explore');
  const [activeChatParam, setActiveChatParam] = useState(null);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveTab('explore');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setActiveTab('explore');
    setActiveChatParam(null);
  };

  const handleOpenChatWithUser = (partner, conversationId = null) => {
    setActiveChatParam({ partner, conversationId });
    setActiveTab('chats');
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="light" />

      {/* Barra de Título Superior */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDarkMode ? '#1a050d' : theme.colors.primaryDark,
            borderBottomColor: isDarkMode ? '#3d0c1e' : 'transparent',
            borderBottomWidth: isDarkMode ? 1 : 0
          }
        ]}
      >
        <View style={styles.headerBrand}>
          <Ionicons
            name="flame"
            size={24}
            color={isDarkMode ? '#ff2a6d' : '#ffffff'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#ff2a6d' : '#ffffff' }]}>
            Sparks
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={[styles.headerGreeting, { color: isDarkMode ? '#ffb3c1' : '#ffe5ec' }]}>
            Hola, {currentUser.name}
          </Text>
        </View>
      </View>

      {/* Contenido de la Pantalla Activa */}
      <View style={styles.mainContent}>
        {activeTab === 'explore' && (
          <ExploreScreen onOpenChat={handleOpenChatWithUser} />
        )}
        {activeTab === 'plans' && (
          <PlansScreen onOpenChatWithOrganizer={handleOpenChatWithUser} />
        )}
        {activeTab === 'chats' && (
          <ChatsScreen
            initialActiveChat={activeChatParam}
            onClearActiveChat={() => setActiveChatParam(null)}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileScreen
            user={currentUser}
            onUpdateUser={(updated) => setCurrentUser(updated)}
            onLogout={handleLogout}
          />
        )}
      </View>

      {/* Barra de Navegación Inferior (4 Tabs con Ionicons) */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border
          }
        ]}
      >
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab('explore')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'explore' ? 'flame' : 'flame-outline'}
            size={24}
            color={activeTab === 'explore' ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.navLabel,
              { color: activeTab === 'explore' ? theme.colors.primary : theme.colors.textMuted },
              activeTab === 'explore' && styles.navLabelActive
            ]}
          >
            Explorar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab('plans')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'plans' ? 'calendar' : 'calendar-outline'}
            size={23}
            color={activeTab === 'plans' ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.navLabel,
              { color: activeTab === 'plans' ? theme.colors.primary : theme.colors.textMuted },
              activeTab === 'plans' && styles.navLabelActive
            ]}
          >
            Planes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => {
            setActiveChatParam(null);
            setActiveTab('chats');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'chats' ? 'chatbubbles' : 'chatbubbles-outline'}
            size={23}
            color={activeTab === 'chats' ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.navLabel,
              { color: activeTab === 'chats' ? theme.colors.primary : theme.colors.textMuted },
              activeTab === 'chats' && styles.navLabelActive
            ]}
          >
            Chats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'profile' ? 'person' : 'person-outline'}
            size={23}
            color={activeTab === 'profile' ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.navLabel,
              { color: activeTab === 'profile' ? theme.colors.primary : theme.colors.textMuted },
              activeTab === 'profile' && styles.navLabelActive
            ]}
          >
            Perfil
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 10
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerGreeting: {
    fontSize: 14,
    fontWeight: '500'
  },
  mainContent: {
    flex: 1
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3
  },
  navLabelActive: {
    fontWeight: 'bold'
  }
});
