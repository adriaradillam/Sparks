import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAvatarSource } from '../screens/ProfileScreen';

const { width } = Dimensions.get('window');

export default function MatchCelebrationModal({
  visible,
  matchData,
  onSendMessage,
  onKeepExploring
}) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true
          })
        )
      ]).start();
    }
  }, [visible]);

  if (!visible || !matchData) return null;

  const { partner, myUser, conversationId } = matchData;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepExploring}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Corona brillante de fondo */}
          <Animated.View
            style={[
              styles.sparkleRing,
              { transform: [{ rotate: spin }] }
            ]}
          >
            <Ionicons name="sparkles" size={28} color="#ff4d6d" style={styles.sparkleTop} />
            <Ionicons name="flame" size={26} color="#f77f00" style={styles.sparkleRight} />
            <Ionicons name="heart" size={24} color="#ff758f" style={styles.sparkleBottom} />
            <Ionicons name="sparkles" size={22} color="#00b4d8" style={styles.sparkleLeft} />
          </Animated.View>

          {/* Título de Celebración */}
          <Text style={styles.superTitle}>¡HA SURGIDO UN SPARK!</Text>
          <Text style={styles.mainTitle}>¡Es un Match! ✨💖</Text>
          <Text style={styles.subtitle}>
            A ti y a <Text style={{ fontWeight: 'bold', color: '#ff4d6d' }}>{partner.name}</Text> os ha gustado vuestro perfil mutuamente.
          </Text>

          {/* Círculos de Avatares Solapados */}
          <View style={styles.avatarsWrapper}>
            <View style={[styles.avatarBox, styles.leftAvatarBox]}>
              <Image source={getAvatarSource(myUser?.avatarUrl)} style={styles.avatarImg} />
            </View>

            <View style={styles.heartBadgeCenter}>
              <Ionicons name="flame" size={22} color="#ffffff" />
            </View>

            <View style={[styles.avatarBox, styles.rightAvatarBox]}>
              <Image source={getAvatarSource(partner?.avatarUrl)} style={styles.avatarImg} />
            </View>
          </View>

          {partner.pronouns ? (
            <Text style={styles.pronounsText}>{partner.name} ({partner.pronouns})</Text>
          ) : null}

          {/* Botones de Acción */}
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => onSendMessage(partner, conversationId)}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.messageBtnText}>Escribir a {partner.name}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.keepExploringBtn}
            onPress={onKeepExploring}
            activeOpacity={0.8}
          >
            <Text style={styles.keepExploringBtnText}>Seguir descubriendo perfiles</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 2, 8, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1b0813',
    borderRadius: 32,
    paddingVertical: 32,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ff4d6d60',
    shadowColor: '#ff4d6d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 20
  },
  sparkleRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    top: 50
  },
  sparkleTop: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center'
  },
  sparkleRight: {
    position: 'absolute',
    right: 0,
    top: '45%'
  },
  sparkleBottom: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center'
  },
  sparkleLeft: {
    position: 'absolute',
    left: 0,
    top: '45%'
  },
  superTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ff758f',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 14,
    color: '#e2e8f0',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
    marginBottom: 26
  },
  avatarsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginBottom: 12
  },
  avatarBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3.5,
    borderColor: '#ff4d6d',
    overflow: 'hidden',
    backgroundColor: '#331021'
  },
  leftAvatarBox: {
    marginRight: -16,
    zIndex: 1
  },
  rightAvatarBox: {
    marginLeft: -16,
    zIndex: 1
  },
  avatarImg: {
    width: '100%',
    height: '100%'
  },
  heartBadgeCenter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ff4d6d',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 3,
    borderColor: '#1b0813'
  },
  pronounsText: {
    fontSize: 12.5,
    color: '#cbd5e1',
    marginBottom: 24,
    fontWeight: '600'
  },
  messageBtn: {
    width: '100%',
    backgroundColor: '#ff4d6d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 12,
    shadowColor: '#ff4d6d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8
  },
  messageBtnText: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: 'bold'
  },
  keepExploringBtn: {
    width: '100%',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  keepExploringBtnText: {
    color: '#94a3b8',
    fontSize: 13.5,
    fontWeight: '600'
  }
});
