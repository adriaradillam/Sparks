import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

export default function LegalTermsModal({ visible, onClose, initialTab = 'terms' }) {
  const { theme, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab); // 'terms' | 'privacy' | 'safety'

  useEffect(() => {
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  const handleOpenEmail = (email) => {
    Linking.openURL(`mailto:${email}`).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Cabecera */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#2d0c1b' : '#ffe5ec' }]}>
                <Ionicons name="shield-checkmark" size={18} color={theme.colors.primaryDark} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                    Centro Legal & Seguridad
                  </Text>
                </View>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  Versión 2.4.0 • Vigente desde Sep 2026
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Pestañas Selectoras */}
          <View style={[styles.tabsRow, { backgroundColor: theme.colors.surfaceSubtle }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'terms' && { backgroundColor: theme.colors.primaryDark }
              ]}
              onPress={() => setActiveTab('terms')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'terms' ? '#ffffff' : theme.colors.textSecondary }
                ]}
              >
                Términos (EULA)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'privacy' && { backgroundColor: theme.colors.primaryDark }
              ]}
              onPress={() => setActiveTab('privacy')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'privacy' ? '#ffffff' : theme.colors.textSecondary }
                ]}
              >
                Privacidad (RGPD)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'safety' && { backgroundColor: theme.colors.primaryDark }
              ]}
              onPress={() => setActiveTab('safety')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'safety' ? '#ffffff' : theme.colors.textSecondary }
                ]}
              >
                Seguridad en Citas
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contenido Legal Scrollable */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.body} contentContainerStyle={{ paddingBottom: 20 }}>
            {activeTab === 'terms' && (
              <View style={styles.textContainer}>
                {/* Banner Resumen */}
                <View style={[styles.summaryBox, { backgroundColor: isDarkMode ? '#1e1122' : '#fff0f5', borderColor: theme.colors.border }]}>
                  <Text style={[styles.summaryTitle, { color: theme.colors.primaryDark }]}>
                    Lo Esencial de los Términos
                  </Text>
                  <Text style={[styles.summaryItem, { color: theme.colors.textPrimary }]}>
                    • Requisito estricto de mayoría de edad (+18). No se permite el acceso a menores.
                  </Text>
                  <Text style={[styles.summaryItem, { color: theme.colors.textPrimary }]}>
                    • Tolerancia cero ante acoso, odio, transfobia, lesbofobia o bifobia.
                  </Text>
                  <Text style={[styles.summaryItem, { color: theme.colors.textPrimary }]}>
                    • Prohibido el catfishing, perfiles falsos, cuentas comerciales o solicitar dinero.
                  </Text>
                  <Text style={[styles.summaryItem, { color: theme.colors.textPrimary }]}>
                    • Bloqueo y reporte inmediato en dos toques con revisión en menos de 24 horas.
                  </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  1. Aceptación del Contrato y Ámbito
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Al descargar, instalar o utilizar Sparks, aceptas quedar vinculada contractualmente por estos Términos y Condiciones y por nuestro Contrato de Licencia de Usuario Final (EULA). Este documento constituye un acuerdo legal vinculante entre tú y Sparks App S.L. conforme a las directrices de Apple App Store y Google Play.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  2. Requisitos de Elegibilidad (+18)
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Debes tener al menos 18 años cumplidos para crear una cuenta. Declaras que no has sido condenada por delitos sexuales o violentos y que tienes plena capacidad legal. Si detectamos cualquier cuenta perteneciente a una persona menor de edad, procederemos a su eliminación inmediata.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  3. Normas de Conducta y Tolerancia Cero (Guideline 1.2)
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Sparks es un espacio seguro sáfico y queer. Queda expresamente prohibido:
                  {'\n'}• Acoso, amenazas, insistencia no consentida o acecho (stalking).
                  {'\n'}• Discurso de odio, transfobia, lesbofobia, bifobia o racismo.
                  {'\n'}• Envío no solicitado de imágenes íntimas o contenido explícito.
                  {'\n'}• Suplantación de identidad (catfishing) o uso de fotos ajenas.
                  {'\n'}• Prostitución, venta de servicios comerciales o estafas financieras.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  4. Contenido de la Usuaria (UGC) y Licencia
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Conservas la titularidad de tus fotos y textos. Concedes a Sparks una licencia no exclusiva, libre de regalías y mundial para alojar, mostrar y procesar dicho contenido exclusivamente con la finalidad de prestar y operar el Servicio.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  5. Verificación Biométrica Facial
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Con el fin de certificar la autenticidad y prevenir perfiles falsos, Sparks permite y puede requerir el cotejo de una fotografía selfie con gestos específicos contra las fotos públicas de tu perfil. Dicha verificación es tratada con estricta confidencialidad.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  6. Moderación, Bloqueo y Cancelación
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Dispones de botones visibles de denuncia y bloqueo bidireccional instantáneo en cada perfil y chat. Nuestro equipo de seguridad audita los casos en menos de 24 horas. Las infracciones acarrean la suspensión inmediata y definitiva de la cuenta.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  7. Ley Aplicable y Fuero
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Estos Términos se rigen por la legislación española y comunitaria europea. Para cualquier controversia, las partes se someten a los juzgados competentes según la normativa de protección de personas consumidoras.
                </Text>

                <TouchableOpacity
                  style={[styles.contactRow, { borderColor: theme.colors.border }]}
                  onPress={() => handleOpenEmail('legal@sparks.app')}
                >
                  <Ionicons name="mail-outline" size={16} color={theme.colors.primaryDark} />
                  <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                    Contacto legal formal: <Text style={{ color: theme.colors.primaryDark, fontWeight: 'bold' }}>legal@sparks.app</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'privacy' && (
              <View style={styles.textContainer}>
                {/* Banner Resumen */}
                <View style={[styles.summaryBox, { backgroundColor: isDarkMode ? '#0d1f2d' : '#e6f7ff', borderColor: theme.colors.border }]}>
                  <Text style={[styles.summaryTitle, { color: isDarkMode ? '#00f2fe' : '#0077b6' }]}>
                    Compromiso de Privacidad (RGPD)
                  </Text>
                  <Text style={[styles.summaryItem, { color: theme.colors.textPrimary }]}>
                    • No vendemos tus datos a anunciantes ni terceros bajo ningún concepto.
                  </Text>
                  <Text style={[styles.summaryItem, { color: theme.colors.textPrimary }]}>
                    • Modo Fantasma y Distancia Aproximada (&lt; 5 km) disponibles en Ajustes.
                  </Text>
                  <Text style={[styles.summaryItem, { color: theme.colors.textPrimary }]}>
                    • Fotos efímeras con autodestrucción inmediata tras su visualización.
                  </Text>
                  <Text style={[styles.summaryItem, { color: theme.colors.textPrimary }]}>
                    • Derecho al olvido real: al eliminar tu cuenta, todos tus datos se borran.
                  </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  1. Responsable del Tratamiento
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Sparks App S.L. / Sparks Community Inc. (Paseo de la Castellana 95, Madrid, España). Delegada de Protección de Datos (DPO): dpo@sparks.app.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  2. Datos que Recopilamos y Base Jurídica
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Tratamos tus datos de cuenta (email, contraseña cifrada, fecha de nacimiento para verificar mayoría de edad), datos de perfil (fotos, biografía, pronombres, intereses), geolocalización aproximada o exacta con tu consentimiento y datos de interacción. Los datos relativos a orientación e identidad sáfica se tratan exclusivamente sobre la base de tu consentimiento explícito (Art. 9.2.a RGPD).
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  3. Integración con Spotify (OAuth 2.0 PKCE)
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Accedemos en modo de solo lectura a tus 5 artistas principales y tu tema favorito mediante el protocolo seguro OAuth 2.0 PKCE. Sparks nunca almacena ni tiene acceso a tu contraseña de Spotify.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  4. Modos de Discreción y Seguridad Personal
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  • Modo Fantasma: Deja de mostrarte en la cuadrícula de descubrimiento sin perder tus chats.
                  {'\n'}• Distancia Aproximada: Muestra solo un rango difuso (&lt; 5 km) para impedir la triangulación.
                  {'\n'}• Disfraz de Pánico: Cubre en 1 toque la pantalla con un bloc de notas neutral ante miradas ajenas.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  5. Fotos Efímeras
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Las fotografías temporales enviadas en las conversaciones privadas se destruyen de forma automatizada e irrecuperable una vez visualizadas por la persona destinataria.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  6. Conservación y Derecho al Olvido (Art. 17 RGPD)
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Tus datos se mantienen mientras tu cuenta permanezca activa. Cuando seleccionas "Eliminar Cuenta" en los Ajustes, todos tus datos, fotos, mensajes y matches se suprimen de manera irreversible.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  7. Ejercicio de tus Derechos
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Puedes ejercer tus derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición escribiendo directamente a privacidad@sparks.app.
                </Text>

                <TouchableOpacity
                  style={[styles.contactRow, { borderColor: theme.colors.border }]}
                  onPress={() => handleOpenEmail('privacidad@sparks.app')}
                >
                  <Ionicons name="mail-outline" size={16} color={theme.colors.primaryDark} />
                  <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                    Canal DPO y Privacidad: <Text style={{ color: theme.colors.primaryDark, fontWeight: 'bold' }}>privacidad@sparks.app</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'safety' && (
              <View style={styles.textContainer}>
                {/* Banner Resumen */}
                <View style={[styles.summaryBox, { backgroundColor: isDarkMode ? '#241a0e' : '#fffbeb', borderColor: theme.colors.border }]}>
                  <Text style={[styles.summaryTitle, { color: isDarkMode ? '#f59e0b' : '#d97706' }]}>
                    Pautas de Seguridad para Citas Presenciales (IRL)
                  </Text>
                  <Text style={[styles.summaryItem, { color: theme.colors.textPrimary }]}>
                    • Queda siempre en lugares públicos, concurridos e iluminados.
                  </Text>
                  <Text style={[styles.summaryItem, { color: theme.colors.textPrimary }]}>
                    • Comunica tus planes y ubicación en tiempo real a una amiga o familiar.
                  </Text>
                  <Text style={[styles.summaryItem, { color: theme.colors.textPrimary }]}>
                    • Organiza tu propio medio de transporte de ida y vuelta.
                  </Text>
                  <Text style={[styles.summaryItem, { color: theme.colors.textPrimary }]}>
                    • Nunca envíes dinero ni compartas claves financieras.
                  </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  1. Conoce a tu cita antes de quedar
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Mantén las primeras conversaciones a través del chat de Sparks. Comprueba si su perfil cuenta con la insignia de verificación biométrica y haz preguntas previas para conocer su personalidad y verificar afinidad.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  2. Primeros encuentros en lugares públicos
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Planifica tu primera cita en una cafetería, parque céntrico o espacio cultural con afluencia de personas. Evita acudir a domicilios privados o lugares aislados en las primeras citas.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  3. Avisa a tu círculo de confianza
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Informa a una amiga o persona de confianza de con quién vas a quedar, el lugar y la hora estimada de regreso. Activa la función de compartir ubicación en tiempo real en tu teléfono.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  4. Controla tus consumiciones y transporte
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Mantén el control de tus bebidas en todo momento. Llega y márchate por tus propios medios (transporte público, taxi o vehículo particular); no permitas que te recojan en tu casa si apenas os estáis conociendo.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  5. Tolerancia Cero con solicitudes de dinero
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Nunca envíes transferencias, criptomonedas ni facilites datos bancarios a ninguna usuaria de Sparks, por muy urgente o convincente que parezca su historia. Si alguien te pide dinero, denúnciala de inmediato.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  6. Confía en tu instinto
                </Text>
                <Text style={[styles.legalPara, { color: theme.colors.textSecondary }]}>
                  Si en cualquier momento de la cita te sientes incómoda, presionada o insegura, tienes todo el derecho a terminar el encuentro y marcharte. Tu seguridad y bienestar están siempre por encima de la cortesía.
                </Text>

                <TouchableOpacity
                  style={[styles.contactRow, { borderColor: theme.colors.border }]}
                  onPress={() => handleOpenEmail('seguridad@sparks.app')}
                >
                  <Ionicons name="shield-outline" size={16} color={theme.colors.primaryDark} />
                  <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                    Equipo de Convivencia y Seguridad: <Text style={{ color: theme.colors.primaryDark, fontWeight: 'bold' }}>seguridad@sparks.app</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Botón de Aceptación */}
            <TouchableOpacity
              style={[styles.acceptBtn, { backgroundColor: theme.colors.primaryDark }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.acceptBtnText}>Entendido y Acepto las Condiciones</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 25,
    borderTopWidth: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  body: {
    marginTop: 2
  },
  textContainer: {
    paddingBottom: 12
  },
  summaryBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16
  },
  summaryTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 8
  },
  summaryItem: {
    fontSize: 12.2,
    lineHeight: 18,
    marginBottom: 4
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6
  },
  legalPara: {
    fontSize: 12.5,
    lineHeight: 19,
    marginBottom: 10
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 12
  },
  contactText: {
    fontSize: 12,
    marginLeft: 8
  },
  acceptBtn: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700'
  }
});
