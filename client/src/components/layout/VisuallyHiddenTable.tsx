import type { ReactNode } from 'react';

interface VisuallyHiddenTableProps {
  caption: string;
  headers: string[];
  rows: ReactNode[][];
}

// The text equivalent of a chart: the same numbers as a table that only screen readers see.
export function VisuallyHiddenTable({ caption, headers, rows }: VisuallyHiddenTableProps) {
  // The wrapper is what is hidden: a table ignores a width of 1px, so hiding the table itself could still
  // make the page scroll sideways on a narrow screen.
  return (
    <div className="sr-only">
      <table>
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
    </div>
  );
}
