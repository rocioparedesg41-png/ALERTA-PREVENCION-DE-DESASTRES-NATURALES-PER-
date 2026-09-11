import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Phone, User, CheckCircle, AlertTriangle, MessageSquare, Copy, Check, Radio, Smartphone } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);

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

  const currentContact =
    selectedRecipient === 'contact1'
      ? { name: contact1Name, phone: contact1Phone }
      : { name: contact2Name, phone: contact2Phone };

  const messagePreview = buildSosMessage({
    type: sosType,
    recipientName: currentContact.name,
    recipientPhone: currentContact.phone,
    districtName: district.name,
    provinceName,
    departmentName,
    coords: { lat: district.lat, lng: district.lng },
  });

  const smsDirectUri = getSmsUri({
    type: sosType,
    recipientName: currentContact.name,
    recipientPhone: currentContact.phone,
    districtName: district.name,
    provinceName,
    departmentName,
    coords: { lat: district.lat, lng: district.lng },
  });

  const handleSendSms = () => {
    setSentNotice(true);
    setTimeout(() => setSentNotice(false), 5000);
    sendOfflineSms({
      type: sosType,
      recipientName: currentContact.name,
      recipientPhone: currentContact.phone,
      districtName: district.name,
      provinceName,
      departmentName,
      coords: { lat: district.lat, lng: district.lng },
    });
  };

  const handleSendWhatsApp = () => {
    openWhatsAppSos({
      type: sosType,
      recipientName: currentContact.name,
      recipientPhone: currentContact.phone,
      districtName: district.name,
      provinceName,
      departmentName,
      coords: { lat: district.lat, lng: district.lng },
    });
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
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 uppercase">
                    100% Sin Internet (Red Celular GSM)
                  </span>
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

          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            En caso de sismo o caída de datos móviles, este sistema despacha un mensaje SMS de texto estándar directamente a través de las antenas celulares sin requerir internet.
          </p>

          {/* Contact 1 & 2 Config */}
          <div className="space-y-3 mb-5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Sus 2 Contactos de Emergencia Designados:
            </span>

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
                  placeholder="Número de celular"
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
                  placeholder="Número de celular"
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>
          </div>

          {/* SOS Message Selection: 2 Options */}
          <div className="space-y-2 mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Seleccione el Tipo de Mensaje a Transmitir:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSosType('necesito_ayuda')}
                className={`p-3 rounded-lg text-left border transition-colors cursor-pointer flex items-center gap-2.5 ${
                  sosType === 'necesito_ayuda'
                    ? 'bg-red-50 border-2 border-red-600 text-red-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 shrink-0 ${
                    sosType === 'necesito_ayuda' ? 'text-red-600' : 'text-slate-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">1. Necesito ayuda urgente</div>
                  <div className="text-[10px] text-slate-500">Urgencia inmediata / Rescate</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSosType('a_salvo')}
                className={`p-3 rounded-lg text-left border transition-colors cursor-pointer flex items-center gap-2.5 ${
                  sosType === 'a_salvo'
                    ? 'bg-green-50 border-2 border-green-600 text-green-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CheckCircle
                  className={`w-5 h-5 shrink-0 ${
                    sosType === 'a_salvo' ? 'text-green-600' : 'text-slate-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">2. Estoy a salvo</div>
                  <div className="text-[10px] text-slate-500">Sin lesiones graves</div>
                </div>
              </button>
            </div>
          </div>

          {/* Live Message Preview Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
              <span className="font-mono">
                Destinatario: <strong className="text-slate-900 font-bold">{currentContact.name}</strong> ({currentContact.phone})
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
            <p className="text-xs font-mono text-slate-800 leading-relaxed bg-white p-2.5 rounded border border-slate-200 select-all">
              {messagePreview}
            </p>
          </div>

          {/* Primary Action Button: Dispatch Direct SMS Text Message */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={smsDirectUri}
              onClick={handleSendSms}
              className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs sm:text-sm text-center"
            >
              <Smartphone className="w-4 h-4" />
              Enviar SMS directo al Celular
            </a>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs sm:text-sm shadow-xs"
            >
              <MessageSquare className="w-4 h-4 text-green-600" />
              Enviar por WhatsApp
            </button>
          </div>

          {sentNotice && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                Abriendo la aplicación de <strong>Mensajes de Texto SMS</strong> para enviar directo al número móvil <strong>{currentContact.phone}</strong>.
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
