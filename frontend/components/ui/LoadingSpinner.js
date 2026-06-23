export default function LoadingSpinner({ size = 'default', text }) {
  const sizeMap = {
    sm: 'w-6 h-6 border-2',
    default: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4'
  };

  const spinnerClass = sizeMap[size] || sizeMap.default;

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <div className="relative">
        <div className={`rounded-full border-gray-800 ${spinnerClass}`}></div>
        <div className={`absolute top-0 left-0 rounded-full border-primary border-t-transparent animate-spin ${spinnerClass}`}></div>
      </div>
      {text && <span className="text-sm font-medium text-gray-400 animate-pulse">{text}</span>}
    </div>
  );
}
