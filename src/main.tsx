import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import './index.css';
import { inicializarServiciosSegundoPlano } from './servicios/index';

// Inicialización de Service Worker FCM y servicios en segundo plano
inicializarServiciosSegundoPlano();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
