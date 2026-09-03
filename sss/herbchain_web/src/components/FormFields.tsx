import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Shared form controls for the long data-entry screens: laboratory check-in
 * and analysis, manufacturer goods-inward, and product creation.
 *
 * Declared at module scope rather than inside the page component: a component
 * defined during render is a new type on every keystroke, which remounts the
 * input and drops focus mid-typing.
 */

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Acceptance criterion shown beside the label. */
  limit?: string;
  required?: boolean;
  span?: boolean;
  /** Native input type — 'date' and 'datetime-local' get real pickers. */
  type?: string;
}

export function TextField({ label, value, onChange, placeholder, limit, required, span, type }: FieldProps) {
  return (
    <div className={`space-y-1.5 ${span ? 'md:col-span-2' : ''}`}>
      <Label className="text-sm font-medium flex items-center gap-1.5">
        {label}
        {required && <span className="text-red-500">*</span>}
        {limit && <span className="text-[10px] font-normal text-muted-foreground">({limit})</span>}
      </Label>
      <Input
        className="h-9"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  required?: boolean;
  span?: boolean;
}

export function SelectField({ label, value, onChange, options, placeholder = 'Select', required, span }: SelectProps) {
  return (
    <div className={`space-y-1.5 ${span ? 'md:col-span-2' : ''}`}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <select
        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

/** Pass / Fail / Pending selector used for every laboratory test. */
export function TestField({ label, value, onChange, limit }: Omit<FieldProps, 'placeholder' | 'span'>) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium flex items-center gap-1.5">
        {label}
        {limit && <span className="text-[10px] font-normal text-muted-foreground">({limit})</span>}
      </Label>
      <select
        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="Pass">Pass</option>
        <option value="Fail">Fail</option>
        <option value="Pending">Pending</option>
      </select>
    </div>
  );
}

/** Yes/No pill pair — faster to answer than a dropdown on inspection forms. */
export function ChoiceField({
  label,
  value,
  onChange,
  options,
  span,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  span?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${span ? 'md:col-span-2' : ''}`}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                active
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function NotesField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5 md:col-span-2">
      <Label className="text-sm font-medium">{label}</Label>
      <textarea
        className="w-full min-h-[64px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
