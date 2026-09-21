import { initials } from '../../lib/format';

const SIZES = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

const Avatar = ({ name, size = 'md', className = '' }) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent ${SIZES[size]} ${className}`}
    aria-hidden="true"
  >
    {initials(name)}
  </span>
);

export default Avatar;
