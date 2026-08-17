# Política de Privacidad y Protección de Datos (RGPD)

**Última actualización:** 17 de agosto de 2026  
**Responsable del Tratamiento:** Sparks Community Inc. / Sparks App S.L.  
**Contacto DPO / Delegado de Protección de Datos:** privacidad@sparks.app

---

## 1. Información General
En **Sparks**, la privacidad y seguridad física y digital de nuestra comunidad sáfica/queer es nuestra máxima prioridad. Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos tus datos personales de acuerdo con el **Reglamento General de Protección de Datos (RGPD UE 2016/679)** y la legislación aplicable en materia de protección de datos.

---

## 2. Datos que Recopilamos y Finalidad

| Categoría de Datos | Datos Específicos | Finalidad Principal | Base Legal |
| :--- | :--- | :--- | :--- |
| **Cuenta y Registro** | Correo electrónico, contraseña cifrada (bcrypt), nombre, edad. | Crear tu cuenta, autenticación JWT y verificar mayoría de edad (+18). | Ejecución del contrato (Art. 6.1.b RGPD). |
| **Perfil Público** | Biografía, fotos, pronombres, etiquetas de intereses, intención de conexión. | Mostrar tu perfil a otras usuarias afines en el grid de exploración. | Consentimiento explícito (Art. 6.1.a RGPD). |
| **Ubicación Geográfica** | Coordenadas GPS (latitud y longitud). | Calcular distancias aproximadas en el feed cercano. | Consentimiento explícito (Art. 6.1.a RGPD). |
| **Música & Spotify** | Himno musical, top artistas, nombre de usuario de Spotify. | Personalizar tu obsesión musical mediante Spotify Web API (OAuth PKCE). | Consentimiento explícito (Art. 6.1.a RGPD). |
| **Mensajería Privada** | Mensajes de chat, fotos efímeras de un solo vistazo. | Facilitar la comunicación consentida entre usuarias con Match. | Ejecución del contrato (Art. 6.1.b RGPD). |
| **Seguridad y Denuncias** | Registros de bloqueos, reportes y motivos de denuncia. | Moderación comunitaria, prevención de acoso y fraude. | Interés legítimo y seguridad (Art. 6.1.f RGPD). |

---

## 3. Privacidad Reforzada y Modo Discreción
* **Modo Fantasma (Invisible)**: Al activarlo, tu perfil deja de mostrarse en el grid de exploración inmediatamente.
* **Distancia Aproximada**: Te permite ocultar metros exactos y mostrar únicamente "< 5 km" para evitar triangulaciones.
* **Modo Discreción (Quick Exit)**: Permite cubrir instantáneamente la interfaz con una pantalla de notas neutras si estás en un entorno físico no seguro.

---

## 4. Conservación y Supresión de Datos (Derecho al Olvido)
* Tus datos se conservan únicamente mientras mantengas activa tu cuenta en Sparks.
* Si decides **Eliminar tu Cuenta** desde Ajustes, todos tus datos personales, fotos subidas, conversaciones y relaciones de afinidad son **eliminados de forma permanente e irrecuperable** de nuestros servidores.

---

## 5. Ejercicio de Derechos RGPD
Tienes derecho a acceder, rectificar, suprimir (derecho al olvido), limitar el tratamiento, oponerte al tratamiento y solicitar la portabilidad de tus datos personales enviando un correo a `privacidad@sparks.app`.

---

## 6. Seguridad de la Información
Aplicamos medidas técnicas y organizativas avanzadas, tales como:
* Cifrado en tránsito mediante protocolos seguros HTTPS / TLS.
* Cifrado de contraseñas mediante hashing unidireccional `bcrypt` (10 rounds).
* Autenticación sin contraseñas de terceros mediante protocolo OAuth 2.0 PKCE.
