import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import './index.css';
import { inicializarServiciosSegundoPlano } from './servicios/index';
import { pwaUpdateManager } from './utils/pwaUpdate';

// Inicialización de servicios en segundo plano y auto-actualización PWA
inicializarServiciosSegundoPlano();
// Activar el gestor de sincronización y comprobación de nuevas versiones
pwaUpdateManager.buscarActualizacionesSilenciosas();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
