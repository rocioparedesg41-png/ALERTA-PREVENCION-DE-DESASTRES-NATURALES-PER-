import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Phone, User, CheckCircle, AlertTriangle, MessageSquare, Copy, Check, Radio, Smartphone, Users, MapPin } from 'lucide-react';
import { DistrictData } from '../types/disasters';
import { sendOfflineSms, openWhatsAppSos, buildSosMessage, getSmsUri } from '../utils/smsSender';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  district: DistrictData;
  provinceName: string;
  departmentName: string;
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  district,
  provinceName,
  departmentName,
}) => {
  // Emergency Contacts 1 & 2 stored in localStorage
  const [contact1Name, setContact1Name] = useState(() => localStorage.getItem('peru_sos_c1_name') || 'Mamá / Familiar');
  const [contact1Phone, setContact1Phone] = useState(() => localStorage.getItem('peru_sos_c1_phone') || '987654321');
  const [contact2Name, setContact2Name] = useState(() => localStorage.getItem('peru_sos_c2_name') || 'Hermano / Cónyuge');
  const [contact2Phone, setContact2Phone] = useState(() => localStorage.getItem('peru_sos_c2_phone') || '912345678');

  const [selectedRecipient, setSelectedRecipient] = useState<'contact1' | 'contact2'>('contact1');
  const [sosType, setSosType] = useState<'a_salvo' | 'necesito_ayuda'>('necesito_ayuda');
  // false = SMS Celular Puro 100% Offline sin enlaces web (evita que Google Messages/RCS falle sin internet)
  const [includeMapLink, setIncludeMapLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  // Save contacts on change
  useEffect(() => {
    try {
      localStorage.setItem('peru_sos_c1_name', contact1Name);
      localStorage.setItem('peru_sos_c1_phone', contact1Phone);
      localStorage.setItem('peru_sos_c2_name', contact2Name);
      localStorage.setItem('peru_sos_c2_phone', contact2Phone);
    } catch (e) {}
  }, [contact1Name, contact1Phone, contact2Name, contact2Phone]);

  if (!isOpen) return null;

  // Resolver coordenadas y nombres de ubicación exacta fijada por GPS si existe
  const activeLocation = (() => {
    try {
      const saved = localStorage.getItem('ultima_ubicacion');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return {
            lat: parsed.lat,
            lng: parsed.lng,
            districtName: parsed.districtName || district.name,
            provinceName: parsed.provinceName || provinceName,
            departmentName: parsed.departmentName || departmentName,
            isGpsLive: true,
          };
        }
      }
    } catch (e) {}
    return {
      lat: district.lat,
      lng: district.lng,
      districtName: district.name,
      provinceName,
      departmentName,
      isGpsLive: false,
    };
  })();

  const currentContact =
    selectedRecipient === 'contact1'
      ? { name: contact1Name, phone: contact1Phone }
      : { name: contact2Name, phone: contact2Phone };

  const isDefaultPhone = currentContact.phone.trim() === '987654321' || currentContact.phone.trim() === '912345678';

  const sosOptions = {
    type: sosType,
    recipientName: currentContact.name,
    recipientPhone: currentContact.phone,
    districtName: activeLocation.districtName,
    provinceName: activeLocation.provinceName,
    departmentName: activeLocation.departmentName,
    coords: { lat: activeLocation.lat, lng: activeLocation.lng },
    includeMapLink,
  };

  const messagePreview = buildSosMessage(sosOptions);
  const smsUriContactPicker = getSmsUri(sosOptions, false);
  const smsUriDirect = getSmsUri(sosOptions, true);

  // Enviar a la agenda o contacto nativo (sin número predefinido)
  const handleOpenSmsContactPicker = () => {
    setSentNotice('Abriendo la aplicación de Mensajes SMS para seleccionar de tu agenda de contactos...');
    setTimeout(() => setSentNotice(null), 5000);
  };

  // Enviar directo al número ingresado
  const handleSendDirectSms = () => {
    setSentNotice(`Abriendo Mensajes SMS para enviar directamente al número ${currentContact.phone}...`);
    setTimeout(() => setSentNotice(null), 5000);
  };

  const handleSendWhatsApp = () => {
    openWhatsAppSos(sosOptions);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messagePreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative max-w-xl w-full bg-white border border-slate-200 border-t-4 border-t-red-600 rounded-xl shadow-2xl p-5 sm:p-6 my-8 text-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 uppercase">
                    100% Sin Internet (Red Celular GSM)
                  </span>
                  {activeLocation.isGpsLive && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      GPS Actual
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Mensajería de Emergencia SOS
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            Envía tu ubicación exacta y coordenadas satelitales mediante SMS convencional sin necesidad de datos móviles o internet.
          </p>

          {/* Contact 1 & 2 Config */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Tus 2 Contactos de Emergencia:
              </span>
              {isDefaultPhone && (
                <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ⚠️ Modifica el número con tu celular real
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Contact 1 */}
              <div
                onClick={() => setSelectedRecipient('contact1')}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedRecipient === 'contact1'
                    ? 'bg-slate-50 border-2 border-slate-900 text-slate-900 shadow-xs'
                    : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold flex items-center gap-1 text-slate-900">
                    <User className="w-3 h-3 text-slate-600" /> Contacto #1 {selectedRecipient === 'contact1' && '✓'}
                  </span>
                  <input
                    type="radio"
                    name="recipient"
                    checked={selectedRecipient === 'contact1'}
                    onChange={() => setSelectedRecipient('contact1')}
                    className="accent-slate-900"
                  />
                </div>
                <input
                  type="text"
                  value={contact1Name}
                  onChange={(e) => setContact1Name(e.target.value)}
                  placeholder="Nombre Contacto 1"
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 mb-1.5 text-slate-900 focus:outline-none focus:border-slate-800"
                />
                <input
                  type="tel"
                  value={contact1Phone}
                  onChange={(e) => setContact1Phone(e.target.value)}
                  placeholder="Número celular (9 dígitos)"
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:border-slate-800"
                />
              </div>

              {/* Contact 2 */}
              <div
                onClick={() => setSelectedRecipient('contact2')}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedRecipient === 'contact2'
                    ? 'bg-slate-50 border-2 border-slate-900 text-slate-900 shadow-xs'
                    : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold flex items-center gap-1 text-slate-900">
                    <User className="w-3 h-3 text-slate-600" /> Contacto #2 {selectedRecipient === 'contact2' && '✓'}
                  </span>
                  <input
                    type="radio"
                    name="recipient"
                    checked={selectedRecipient === 'contact2'}
                    onChange={() => setSelectedRecipient('contact2')}
                    className="accent-slate-900"
                  />
                </div>
                <input
                  type="text"
                  value={contact2Name}
                  onChange={(e) => setContact2Name(e.target.value)}
                  placeholder="Nombre Contacto 2"
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 mb-1.5 text-slate-900 focus:outline-none focus:border-slate-800"
                />
                <input
                  type="tel"
                  value={contact2Phone}
                  onChange={(e) => setContact2Phone(e.target.value)}
                  placeholder="Número celular (9 dígitos)"
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>
          </div>

          {/* SOS Message Selection */}
          <div className="space-y-2 mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Tipo de Mensaje:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSosType('necesito_ayuda')}
                className={`p-2.5 rounded-lg text-left border transition-colors cursor-pointer flex items-center gap-2.5 ${
                  sosType === 'necesito_ayuda'
                    ? 'bg-red-50 border-2 border-red-600 text-red-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 ${
                    sosType === 'necesito_ayuda' ? 'text-red-600' : 'text-slate-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Necesito ayuda urgente</div>
                  <div className="text-[10px] text-slate-500">Rescate / Evacuación</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSosType('a_salvo')}
                className={`p-2.5 rounded-lg text-left border transition-colors cursor-pointer flex items-center gap-2.5 ${
                  sosType === 'a_salvo'
                    ? 'bg-green-50 border-2 border-green-600 text-green-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CheckCircle
                  className={`w-4 h-4 shrink-0 ${
                    sosType === 'a_salvo' ? 'text-green-600' : 'text-slate-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Estoy a salvo</div>
                  <div className="text-[10px] text-slate-500">En zona segura</div>
                </div>
              </button>
            </div>
          </div>

          {/* Formato de Transmisión: Celular Puro vs Con Enlace Maps */}
          <div className="mb-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block">Formato de SMS:</span>
              <span className="text-[11px] text-slate-500">
                {includeMapLink
                  ? 'Con enlace web Google Maps (requiere que el receptor tenga datos)'
                  : 'SMS puro sin enlaces (100% garantizado en antenas 2G/3G sin datos)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIncludeMapLink(!includeMapLink)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
                !includeMapLink
                  ? 'bg-emerald-600 border-emerald-700 text-white'
                  : 'bg-slate-200 border-slate-300 text-slate-700'
              }`}
            >
              {!includeMapLink ? '✓ 100% Offline' : 'Con Link Maps'}
            </button>
          </div>

          {/* Live Message Preview Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
              <span className="font-mono">
                Ubicación: <strong className="text-slate-900">{activeLocation.districtName}, {activeLocation.provinceName}</strong>
              </span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-slate-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado' : 'Copiar texto'}
              </button>
            </div>
            <p className="text-xs font-mono text-slate-800 leading-relaxed bg-white p-2.5 rounded border border-slate-200 select-all break-all">
              {messagePreview}
            </p>
          </div>

          {/* Action Buttons: Reestructurados con enlaces nativos del protocolo sms: para máxima fiabilidad offline */}
          <div className="space-y-2">
            {/* Opción 1: Abrir la aplicación de SMS y elegir de la agenda (Evita números erróneos) */}
            <a
              href={smsUriContactPicker}
              target="_top"
              rel="noopener"
              onClick={handleOpenSmsContactPicker}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs sm:text-sm text-center active:scale-95 no-underline"
            >
              <Users className="w-4 h-4" />
              <span>Abrir Mensajes SMS (Elegir de mi Agenda de Contactos)</span>
            </a>

            {/* Opción 2: Enviar directo al número configurado */}
            <a
              href={smsUriDirect}
              target="_top"
              rel="noopener"
              onClick={handleSendDirectSms}
              className="w-full py-2 px-4 bg-slate-900 hover:bg-black text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs text-center active:scale-95 no-underline"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-300" />
              <span>Enviar directo al número: {currentContact.phone} ({currentContact.name})</span>
            </a>

            {/* Opción 3: WhatsApp si cuenta con datos */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full py-1.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs shadow-xs active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5 text-green-600" />
              <span>Enviar por WhatsApp (requiere internet)</span>
            </button>
          </div>

          {sentNotice && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{sentNotice}</span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
