import type { ReactNode } from 'react';

interface VisuallyHiddenTableProps {
  caption: string;
  headers: string[];
  rows: ReactNode[][];
}

// The text equivalent of a chart: the same numbers as a table that only screen readers see.
export function VisuallyHiddenTable({ caption, headers, rows }: VisuallyHiddenTableProps) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
