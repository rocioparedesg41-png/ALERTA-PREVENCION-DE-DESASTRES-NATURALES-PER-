// Offline Emergency SOS Message Generator (Uses native cellular SMS protocol)

export interface SosOptions {
  type: 'a_salvo' | 'necesito_ayuda';
  recipientPhone: string;
  recipientName: string;
  districtName: string;
  provinceName: string;
  departmentName: string;
  coords?: { lat: number; lng: number };
}

export function buildSosMessage(options: SosOptions): string {
  const { type, districtName, provinceName, departmentName, coords } = options;
  const timestamp = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const textStatus =
    type === 'a_salvo'
      ? 'ESTOY A SALVO, NO TE PREOCUPES.'
      : '¡URGENTE! NECESITO AYUDA INMEDIATA ANTE EMERGENCIA.';

  const locationText = `Ubicación: ${districtName}, ${provinceName}, ${departmentName}.`;
  const coordsText = coords 
    ? ` Coordenadas GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (https://maps.google.com/?q=${coords.lat.toFixed(5)},${coords.lng.toFixed(5)})` 
    : '';

  return `[SMS ALERTA DESASTRE PERÚ - ${timestamp}] ${textStatus} ${locationText}${coordsText}`;
}

export function getSmsUri(options: SosOptions): string {
  const body = buildSosMessage(options);
  const cleanPhone = options.recipientPhone.replace(/\D/g, '');
  
  // Cross-platform SMS URI scheme:
  // iOS typically uses '&body=', Android standard uses '?body='
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';
  return `sms:${cleanPhone}${separator}body=${encodeURIComponent(body)}`;
}

export function sendOfflineSms(options: SosOptions): void {
  const smsUrl = getSmsUri(options);
  
  // Direct trigger using programmatic anchor element for iframe & browser compatibility
  try {
    const link = document.createElement('a');
    link.href = smsUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 100);
  } catch (e) {
    window.location.href = smsUrl;
  }
}

export function openWhatsAppSos(options: SosOptions): void {
  const body = buildSosMessage(options);
  let cleanPhone = options.recipientPhone.replace(/\D/g, '');
  if (!cleanPhone.startsWith('51') && cleanPhone.length === 9) {
    cleanPhone = '51' + cleanPhone;
  }
  const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(body)}`;
  window.open(waUrl, '_blank');
}

