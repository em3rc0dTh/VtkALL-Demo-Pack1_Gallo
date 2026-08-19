import { PintaTuCocheScreen } from '@/components/pinta/PintaTuCocheScreen';
import './pinta-vehicle-v2.css';

export const metadata = {
  title: 'Pinta tu coche | Gallo Autos',
  description: 'Configura visualmente las zonas de tu vehículo que quieres pintar o evaluar.',
};

export default function PintaTuCochePage() {
  return (
    <div className="pinta-module-v2">
      <PintaTuCocheScreen />
    </div>
  );
}
