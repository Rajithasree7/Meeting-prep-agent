export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  const borders = { sm: 'border-2', md: 'border-2', lg: 'border-[3px]' };
  return (
    <div
      className={`${sizes[size]} ${borders[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin`}
    />
  );
}
