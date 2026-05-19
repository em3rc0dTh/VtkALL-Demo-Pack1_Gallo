export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[150px] w-full">
      <div className="relative w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-gray-800"></div>
        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
}
