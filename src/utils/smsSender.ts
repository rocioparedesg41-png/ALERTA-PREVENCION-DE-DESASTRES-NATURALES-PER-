export interface SmsLocationPayload {
  lat: number;
  lng: number;
  districtName: string;
  provinceName: string;
  departmentName: string;
  precisionMetros?: number;
}

/**
 * Genera URL de Google Maps gratuita (sin API key) con coordenadas exactas.
 * Funciona en SMS convencional como texto plano — el destinatario puede abrirlo
 * desde cualquier móvil con navegador o app de Maps.
 */
export const buildGoogleMapsUrl = (lat: number, lng: number): string => {
  // URL corta de Google Maps sin API key — 100% gratuita y universal
  return `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
};

/**
 * Construye el mensaje SMS offline completo con ubicación exacta.
 * Formato optimizado para antenas 2G/3G (SMS puro, sin datos).
 */
export const buildSmsOfflineMessage = (
  tipo: 'EMERGENCIA' | 'SALVO',
  payload: SmsLocationPayload
): string => {
  const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const mapsUrl = buildGoogleMapsUrl(payload.lat, payload.lng);
  const precision = payload.precisionMetros ? ` (±${Math.round(payload.precisionMetros)}m)` : '';

  if (tipo === 'EMERGENCIA') {
    return (
      `🆘 ALERTA PERU ${hora}: NECESITO AYUDA. ` +
      `Ubicacion: ${payload.districtName}, ${payload.provinceName}, ${payload.departmentName}. ` +
      `GPS: ${payload.lat.toFixed(5)},${payload.lng.toFixed(5)}${precision}. ` +
      `Mapa: ${mapsUrl}`
    );
  }

  return (
    `✅ PERU ${hora}: ESTOY A SALVO. ` +
    `Ubicacion: ${payload.districtName}, ${payload.provinceName}. ` +
    `GPS: ${payload.lat.toFixed(5)},${payload.lng.toFixed(5)}. ` +
    `Mapa: ${mapsUrl}`
  );
};

/**
 * Construye el mensaje de WhatsApp con formato enriquecido + enlace Maps clicable.
 * Usa wa.me (API oficial gratuita de WhatsApp sin registro).
 */
export const buildWhatsappUrl = (
  tipo: 'EMERGENCIA' | 'SALVO',
  payload: SmsLocationPayload,
  phoneNumber: string
): string => {
  const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const mapsUrl = buildGoogleMapsUrl(payload.lat, payload.lng);
  const precision = payload.precisionMetros ? ` (±${Math.round(payload.precisionMetros)}m)` : '';

  let mensaje: string;

  if (tipo === 'EMERGENCIA') {
    mensaje =
      `🆘 *ALERTA DE EMERGENCIA* 🆘\n` +
      `*Hora:* ${hora}\n` +
      `*Estado:* NECESITO AYUDA URGENTE\n\n` +
      `📍 *Mi ubicación exacta:*\n` +
      `${payload.districtName}, ${payload.provinceName}\n` +
      `${payload.departmentName}, Perú\n\n` +
      `🛰️ *Coordenadas GPS:*\n` +
      `Lat: ${payload.lat.toFixed(5)}\n` +
      `Lng: ${payload.lng.toFixed(5)}${precision}\n\n` +
      `🗺️ *Ver en Google Maps:*\n` +
      `${mapsUrl}\n\n` +
      `_Mensaje generado por AlertaPerú_`;
  } else {
    mensaje =
      `✅ *ESTOY A SALVO* ✅\n` +
      `*Hora:* ${hora}\n` +
      `*Estado:* En zona segura\n\n` +
      `📍 *Mi ubicación:*\n` +
      `${payload.districtName}, ${payload.provinceName}\n` +
      `${payload.departmentName}, Perú\n\n` +
      `🗺️ *Ver en Google Maps:*\n` +
      `${mapsUrl}\n\n` +
      `_Mensaje generado por AlertaPerú_`;
  }

  // wa.me es la API oficial gratuita de WhatsApp — no requiere registro ni API key
  const phoneClean = phoneNumber.replace(/\D/g, '');
  const phoneWithCode = phoneClean.startsWith('51') ? phoneClean : `51${phoneClean}`;
  return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(mensaje)}`;
};

export interface SosOptions {
  type: 'a_salvo' | 'necesito_ayuda';
  recipientPhone?: string;
  recipientName?: string;
  districtName: string;
  provinceName: string;
  departmentName?: string;
  coords?: { lat: number; lng: number };
  includeMapLink?: boolean;
}

export function sanitizeToGsm7(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¡¿!]/g, '')
    .replace(/[\[\]\(\)]/g, '')
    .replace(/[—–]/g, '-')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSosMessage(options: SosOptions): string {
  const { type, districtName, provinceName, departmentName, coords, includeMapLink = false } = options;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const estado = type === 'a_salvo' ? 'ESTOY A SALVO' : 'EMERGENCIA: NECESITO AYUDA';
  const ubicacion = sanitizeToGsm7(`${districtName}, ${provinceName}${departmentName ? `, ${departmentName}` : ''}`);

  let mensaje = `ALERTA PERU ${timeStr}: ${estado}. Ubicacion: ${ubicacion}.`;

  if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
    const latStr = coords.lat.toFixed(5);
    const lngStr = coords.lng.toFixed(5);
    mensaje += ` GPS: ${latStr},${lngStr}`;

    if (includeMapLink) {
      mensaje += ` ${buildGoogleMapsUrl(coords.lat, coords.lng)}`;
    }
  }

  return sanitizeToGsm7(mensaje);
}

export function formatPhoneNumber(phone?: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return `+51${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('51')) {
    return `+${cleaned}`;
  }
  return cleaned;
}

export function getSmsUri(options: SosOptions, attachPhone: boolean = true): string {
  const body = buildSosMessage(options);
  const formattedPhone = attachPhone && options.recipientPhone ? formatPhoneNumber(options.recipientPhone) : '';

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';
  const encodedBody = encodeURIComponent(body);

  return formattedPhone 
    ? `sms:${formattedPhone}${separator}body=${encodedBody}`
    : `sms:${separator}body=${encodedBody}`;
}

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

export function openWhatsAppSos(options: SosOptions): void {
  const { coords, districtName, provinceName, departmentName = 'Perú', recipientPhone = '' } = options;
  if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
    const payload: SmsLocationPayload = {
      lat: coords.lat,
      lng: coords.lng,
      districtName,
      provinceName,
      departmentName,
    };
    const waUrl = buildWhatsappUrl(options.type === 'a_salvo' ? 'SALVO' : 'EMERGENCIA', payload, recipientPhone);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  } else {
    const body = buildSosMessage({ ...options, includeMapLink: true });
    let cleaned = recipientPhone.replace(/\D/g, '');
    if (cleaned && !cleaned.startsWith('51') && cleaned.length === 9) {
      cleaned = '51' + cleaned;
    }
    const waUrl = cleaned
      ? `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(body)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(body)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }
}
