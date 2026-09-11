import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, LogIn, UserPlus, KeyRound, Mail, MapPin, Eye, EyeOff, Radio, AlertTriangle } from 'lucide-react';

interface LoginCoverProps {
  onLoginSuccess: (user: { email: string; name: string }) => void;
}

export const LoginCover: React.FC<LoginCoverProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('ciudadano@alerta.gob.pe');
  const [password, setPassword] = useState('Peruseguro2026!');
  const [fullName, setFullName] = useState('Brigadista Civil');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated 3D globe fallback on canvas only when video is not yet ready
  useEffect(() => {
    if (videoLoaded) return;
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let angle = 0;
    const render = () => {
      if (videoLoaded) return;
      angle += 0.008;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.45;
      const cy = height * 0.5;
      const radius = Math.min(width, height) * 0.38;

      // Glow behind globe
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.2);
      grad.addColorStop(0, 'rgba(185, 28, 28, 0.25)');
      grad.addColorStop(0.6, 'rgba(30, 58, 138, 0.18)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Globe sphere outline
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.clip();

      // Lat/Long grid
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 20) {
        const y = cy + (lat / 90) * radius;
        const rLat = Math.sqrt(Math.max(0, radius * radius - (y - cy) * (y - cy)));
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.beginPath();
        ctx.ellipse(cx, y, rLat, rLat * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let lon = 0; lon < Math.PI * 2; lon += Math.PI / 6) {
        const curLon = lon + angle;
        const xOffset = Math.sin(curLon) * radius;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.abs(xOffset), radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Peru highlighted boundary simulation (golden glow)
      const peruX = cx + Math.sin(angle * 0.8) * (radius * 0.35) - 30;
      const peruY = cy - 20;

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 15;

      ctx.beginPath();
      // approximate Peru silhouette vertices on sphere
      ctx.moveTo(peruX - 45, peruY - 50); // Tumbes / Piura
      ctx.lineTo(peruX + 20, peruY - 65); // Loreto / Putumayo
      ctx.lineTo(peruX + 45, peruY - 10); // Ucayali
      ctx.lineTo(peruX + 60, peruY + 40); // Madre de Dios
      ctx.lineTo(peruX + 35, peruY + 75); // Puno
      ctx.lineTo(peruX + 20, peruY + 95); // Tacna
      ctx.lineTo(peruX - 10, peruY + 60); // Arequipa / Ica
      ctx.lineTo(peruX - 35, peruY + 15); // Lima
      ctx.lineTo(peruX - 55, peruY - 20); // Ancash / La Libertad
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
      ctx.fill();

      // Pulsing telemetry pin on Peru
      const pulse = Math.sin(Date.now() / 250) * 4 + 8;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(peruX - 5, peruY + 20, pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('PERÚ [LAT: -9.18°S | LON: -75.01°W]', peruX + 15, peruY + 25);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [videoLoaded]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.0;
      videoRef.current.defaultPlaybackRate = 1.0;
    }
  }, [videoLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor complete todos los campos requeridos.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    onLoginSuccess({
      email,
      name: fullName || email.split('@')[0],
    });
  };

  const handleQuickEmergencyEntry = () => {
    onLoginSuccess({
      email: 'emergencia.peru@alerta.gob.pe',
      name: 'Operador de Emergencia Nacional',
    });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950 font-sans">
      {/* Background Video (mapaperu.mp4) - Fluid, smooth, non-lagging video playback */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover origin-center z-0 opacity-100 transition-opacity duration-300 transform-gpu"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        key="login-bg-video-peru-2026-stabilized"
        onLoadedData={() => setVideoLoaded(true)}
        onCanPlay={() => setVideoLoaded(true)}
      >
        <source src="/mapaperu.mp4?v=2026_stabilized_v2" type="video/mp4" />
        <source src="/alarma.mp4?v=2026_stabilized_v2" type="video/mp4" />
      </video>

      {/* Canvas Fallback only when video is not loaded yet */}
      {!videoLoaded && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-90"
        />
      )}

      {/* Very light subtle translucent overlay so background video is vividly seen */}
      <div className="absolute inset-0 bg-slate-950/10 pointer-events-none z-10" />

      {/* Login / Register Card Container - Translucent Frosted Glassmorphism */}
      <div className="relative z-20 w-full max-w-lg px-4 py-6 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-slate-950/20 backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-7 text-white"
        >
          {/* Header Badge */}
          <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[11px] uppercase tracking-wider font-bold text-red-400">Sistema SAT Oficial</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                  Alerta & Prevención Perú <span className="text-red-400">2026</span>
                </h1>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-white/70 block font-medium">Cobertura Nacional</span>
              <span className="text-[11px] font-mono font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded border border-white/20">24 Dptos • 196 Prov • 1893 Dist</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-white/80 mb-5 leading-relaxed drop-shadow-xs">
            Plataforma de alerta temprana para sismos, tsunamis, huaicos, inundaciones, heladas, sequías y erupciones volcánicas del Perú.
          </p>

          {/* Quick Tabs: Iniciar Sesión / Registrarse */}
          <div className="flex rounded-lg bg-black/40 p-1 mb-5 border border-white/20">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !isRegister
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isRegister
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Registrarse
            </button>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 rounded-lg bg-red-500/25 border border-red-400 text-red-200 text-xs font-medium flex items-center gap-2 backdrop-blur-sm"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-300" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">
                  Nombres y Apellidos
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Juan Pérez Quispe"
                  required
                  className="w-full px-3.5 py-2.5 bg-black/30 border border-white/25 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 text-sm transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-white/90 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-red-400" />
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@ejemplo.com"
                required
                className="w-full px-3.5 py-2.5 bg-black/30 border border-white/25 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 text-sm transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/90 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-red-400" />
                  Contraseña
                </span>
                <span className="text-[11px] text-white/60 font-normal">Mínimo 6 caracteres</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2.5 bg-black/30 border border-white/25 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 text-sm transition-all font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-[0.99] text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              {isRegister ? 'Crear Cuenta y Entrar al Sistema' : 'Ingresar a Alerta Perú'}
            </button>
          </form>

          {/* Quick Emergency / Guest Access */}
          <div className="mt-4 pt-3 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={handleQuickEmergencyEntry}
              className="w-full sm:w-auto px-3.5 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-200 font-bold rounded-lg border border-red-400/40 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-inner"
            >
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              Ingreso Rápido de Emergencia (Sin Registro)
            </button>
            <span className="text-white/70 text-[11px] text-center">
              Acceso 100% libre y compatible con celulares
            </span>
          </div>

          {/* Footer Author Stamp - Layout and style matching official reference */}
          <div className="mt-5 pt-3 border-t border-white/15 flex justify-center">
            <div className="inline-flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/10 shadow-lg">
              <div className="text-right leading-tight tracking-[0.16em] uppercase text-[10px] sm:text-[11px] font-normal text-slate-300 font-sans">
                <div>AUTORÍA, DESARROLLO <span className="font-serif italic lowercase text-slate-200">y</span></div>
                <div><span className="font-serif italic lowercase text-slate-200">y</span> DIRECCIÓN TÉCNICA:</div>
              </div>
              <div className="w-[1px] h-8 sm:h-9 bg-slate-400/50 self-center shrink-0" />
              <div className="text-left leading-tight">
                <div
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#caa257' }}
                  className="text-sm sm:text-base font-bold tracking-wide drop-shadow-sm"
                >
                  Ing. Rocío Paredes Gamarra
                </div>
                <div
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f3e5c2' }}
                  className="text-xs sm:text-sm italic tracking-wide"
                >
                  Casa Serpentis
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
