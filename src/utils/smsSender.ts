// Offline Emergency SOS Message Generator (Uses native cellular SMS protocol)

export interface SosOptions {
  type: 'a_salvo' | 'necesito_ayuda';
  recipientPhone?: string;
  recipientName?: string;
  districtName: string;
  provinceName: string;
  departmentName?: string;
  coords?: { lat: number; lng: number };
  includeMapLink?: boolean; // false = SMS celular puro 100% offline (sin enlace web para evitar que RCS o Android falle sin internet)
}

/**
 * Normaliza y elimina caracteres especiales no compatibles con GSM-7 (acentos, signos invertidos, corchetes)
 * para evitar que las operadoras celulares peruanas (Claro, Movistar, Entel, Bitel)
 * fuercen la codificación UCS-2 (la cual reduce el límite a 70 caracteres y fragmenta el SMS,
 * provocando el error "No se envió. Revisar opciones").
 */
export function sanitizeToGsm7(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
    .replace(/[¡¿!]/g, '')           // Elimina signos invertidos o exclamaciones
    .replace(/[\[\]\(\)]/g, '')      // Elimina corchetes y paréntesis
    .replace(/[—–]/g, '-')           // Normaliza guiones largos
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Construye un mensaje de texto SOS ultra-ligero optimizado para GSM-7 (menos de 100 caracteres sin enlaces)
 * o con enlace web si el usuario lo activa explícitamente.
 */
export function buildSosMessage(options: SosOptions): string {
  const { type, districtName, provinceName, coords, includeMapLink = false } = options;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const estado =
    type === 'a_salvo'
      ? 'ESTOY A SALVO'
      : 'EMERGENCIA: NECESITO AYUDA';

  // Ubicación compacta y limpia (sin tildes ni caracteres especiales)
  const ubicacion = sanitizeToGsm7(`${districtName}, ${provinceName}`);

  let mensaje = `ALERTA PERU ${timeStr}: ${estado}. Ubicacion: ${ubicacion}.`;

  if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
    const latStr = coords.lat.toFixed(5);
    const lngStr = coords.lng.toFixed(5);
    mensaje += ` GPS: ${latStr},${lngStr}`;

    // Si se incluye el enlace a Google Maps (solo recomendado cuando hay datos móviles)
    if (includeMapLink) {
      mensaje += ` https://maps.google.com/?q=${latStr},${lngStr}`;
    }
  }

  return sanitizeToGsm7(mensaje);
}

/**
 * Limpia y normaliza el número de teléfono celular para la marcación SMS en Perú.
 */
export function formatPhoneNumber(phone?: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  // Si es un celular peruano de 9 dígitos que empieza con 9, agregar +51 para compatibilidad internacional y roaming
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return `+51${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('51')) {
    return `+${cleaned}`;
  }
  return cleaned;
}

/**
 * Genera la URI 'sms:' compatible de forma nativa con Android e iOS.
 * Si attachPhone es falso, genera 'sms:?body=...' para que el sistema abra la agenda de contactos nativa.
 */
export function getSmsUri(options: SosOptions, attachPhone: boolean = true): string {
  const body = buildSosMessage(options);
  const formattedPhone = attachPhone && options.recipientPhone ? formatPhoneNumber(options.recipientPhone) : '';

  // Detección de iOS vs Android para el delimitador del intent SMS:
  // iOS requiere '&body=', Android y el estándar RFC 5724 usan '?body='
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';

  // Codificación segura URI del cuerpo del mensaje
  const encodedBody = encodeURIComponent(body);

  return formattedPhone 
    ? `sms:${formattedPhone}${separator}body=${encodedBody}`
    : `sms:${separator}body=${encodedBody}`;
}

/**
 * Despacha el intent SMS de manera segura hacia la app nativa del teléfono.
 */
export function sendOfflineSms(options: SosOptions, attachPhone: boolean = true): void {
  const smsUrl = getSmsUri(options, attachPhone);

  const link = document.createElement('a');
  link.href = smsUrl;
  link.setAttribute('target', '_top');
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 300);
}

/**
 * Envío alternativo por WhatsApp si el usuario cuenta con conexión a internet.
 */
export function openWhatsAppSos(options: SosOptions): void {
  const body = buildSosMessage({ ...options, includeMapLink: true });
  let cleaned = options.recipientPhone ? options.recipientPhone.replace(/\D/g, '') : '';
  if (cleaned && !cleaned.startsWith('51') && cleaned.length === 9) {
    cleaned = '51' + cleaned;
  }
  const waUrl = cleaned
    ? `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(body)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(body)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}



