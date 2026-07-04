
export const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label 
          htmlFor={props.id} 
          className="text-[11px] font-bold uppercase tracking-wider text-app-text/70 block"
        >
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full rounded-xl border bg-surface-50/70 px-4 py-2.5 text-xs focus:outline-none focus:border-brand-primary transition-colors ${
          error ? 'border-red-300' : 'border-surface-100'
        } ${className}`}
      />
      {error && (
        <p className="text-[9px] font-bold text-red-500 animate-in fade-in duration-150">
          {error}
        </p>
      )}
    </div>
  );
};
