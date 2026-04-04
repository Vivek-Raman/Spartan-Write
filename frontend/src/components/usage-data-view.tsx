import { useMemo } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type UsageRow = {
  ai_model: string;
  generations: number;
  total_cost: number;
};

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

function coerceUsageRow(row: unknown): UsageRow {
  if (!row || typeof row !== "object") {
    return {
      ai_model: "",
      generations: 0,
      total_cost: 0,
    };
  }
  const o = row as Record<string, unknown>;
  return {
    ai_model:
      typeof o.ai_model === "string" ? o.ai_model : String(o.ai_model ?? ""),
    generations: toNumber(o.generations, 0),
    total_cost: toNumber(o.total_cost, 0),
  };
}

/** API shape: `{ data: UsageRow[] }` from `/usage-info`. */
function getUsageRowArray(data: unknown): unknown[] | undefined {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "data" in data) {
    const inner = (data as { data: unknown }).data;
    if (Array.isArray(inner)) return inner;
  }
  return undefined;
}

function isFlatPrimitiveRecord(
  value: unknown,
): value is Record<string, string | number | boolean> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every(
    (v) =>
      typeof v === "string" || typeof v === "number" || typeof v === "boolean",
  );
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

function buildColumns(compact: boolean): ColumnDef<UsageRow>[] {
  const cellText = compact ? "text-xs" : "text-sm";
  return [
    {
      accessorKey: "ai_model",
      header: "Model",
      cell: ({ row }) => {
        const model = String(row.getValue("ai_model"));
        return (
          <span
            className={`${cellText} block max-w-[min(280px,50vw)] truncate`}
            title={model}
          >
            {model}
          </span>
        );
      },
    },
    {
      accessorKey: "generations",
      header: () => <div className="text-right">Generations</div>,
      cell: ({ row }) => (
        <div className={`text-right tabular-nums ${cellText}`}>
          {row.getValue("generations")}
        </div>
      ),
    },
    {
      accessorKey: "total_cost",
      header: () => <div className="text-right">Cost (USD)</div>,
      cell: ({ row }) => {
        const amount = toNumber(row.getValue("total_cost"), 0);
        return (
          <div className={`text-right font-medium tabular-nums ${cellText}`}>
            {usd.format(amount)}
          </div>
        );
      },
    },
  ];
}

function UsageDataTable({
  rows,
  compact,
}: {
  rows: UsageRow[];
  compact: boolean;
}) {
  const columns = useMemo(() => buildColumns(compact), [compact]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const wrapperClass = compact
    ? "max-h-48 overflow-y-auto rounded-md border"
    : "overflow-hidden rounded-md border";

  return (
    <div className={wrapperClass}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No usage rows.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function UsageDataView({
  data,
  compact = false,
}: {
  data: unknown;
  compact?: boolean;
}) {
  const rawRows = getUsageRowArray(data);
  if (rawRows !== undefined) {
    const rows = rawRows.map(coerceUsageRow);
    return <UsageDataTable rows={rows} compact={compact} />;
  }

  if (isFlatPrimitiveRecord(data)) {
    return (
      <dl
        className={
          compact
            ? "space-y-1 text-xs max-h-28 overflow-y-auto"
            : "space-y-2 text-sm"
        }
      >
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium wrap-break-word">{String(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <pre
      className={
        compact
          ? "text-[11px] bg-muted/50 rounded-md p-2 max-h-28 overflow-auto whitespace-pre-wrap wrap-break-word"
          : "text-xs bg-muted/50 rounded-md p-3 max-h-64 overflow-auto whitespace-pre-wrap wrap-break-word"
      }
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
