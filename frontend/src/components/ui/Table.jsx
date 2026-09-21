/** Wide tables scroll inside this box so the page body never scrolls sideways. */
export const Table = ({ children, className = '' }) => (
  <div className="scroll-x">
    <table className={`w-full min-w-full border-collapse text-sm ${className}`}>{children}</table>
  </div>
);

export const Thead = ({ children }) => (
  <thead className="border-b border-line bg-ground/60">{children}</thead>
);

export const Th = ({ children, className = '' }) => (
  <th
    className={`whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted ${className}`}
  >
    {children}
  </th>
);

export const Tbody = ({ children }) => (
  <tbody className="divide-y divide-line">{children}</tbody>
);

export const Tr = ({ children, className = '', ...props }) => (
  <tr className={`transition-colors hover:bg-ground/60 ${className}`} {...props}>
    {children}
  </tr>
);

export const Td = ({ children, className = '' }) => (
  <td className={`px-4 py-3 align-middle text-ink ${className}`}>{children}</td>
);

export default Table;
