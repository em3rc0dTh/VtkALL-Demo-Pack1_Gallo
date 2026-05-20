export default function EstadoBadge({ estado }) {
  const config = {
    pendiente: {
      bg: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      label: 'Pendiente'
    },
    confirmada: {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      label: 'Confirmada'
    },
    en_proceso: {
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      label: 'En Proceso'
    },
    completada: {
      bg: 'bg-green-500/10 text-green-400 border-green-500/20',
      label: 'Completada'
    },
    cancelada: {
      bg: 'bg-red-500/10 text-red-400 border-red-500/20',
      label: 'Cancelada'
    }
  };

  const current = config[estado] || { bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: estado };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg}`}>
      {current.label}
    </span>
  );
}
