export type WorkOrderPrintCardData = {
  id: number;
  work_order_code: string;
  assignee: string | null;
  issued_date: string | null;
  order_code: string | null;
  subject: string | null;
  drawing_number: string | null;
  quantity: number | null;
  desired_delivery_date: string | null;
  company_name: string | null;
  order_notes: string | null;
};

const FIELDS: {
  key: keyof WorkOrderPrintCardData;
  label: string;
}[] = [
  { key: "work_order_code", label: "製造指示書No" },
  { key: "assignee", label: "担当者" },
  { key: "issued_date", label: "発行日" },
  { key: "order_code", label: "受注No" },
  { key: "subject", label: "件名" },
  { key: "drawing_number", label: "図番" },
  { key: "quantity", label: "数量" },
  { key: "desired_delivery_date", label: "希望納期" },
  { key: "company_name", label: "会社名" },
  { key: "order_notes", label: "備考" },
];

export function WorkOrderPrintCard({
  workOrder,
}: {
  workOrder: WorkOrderPrintCardData;
}) {
  return (
    <div className="work-order-print-page flex min-h-screen items-center justify-center">
      <div className="w-[105mm] border border-zinc-400 p-6 text-sm">
        <h2 className="mb-4 text-center text-lg font-bold">製造指示書</h2>
        <table className="w-full border-collapse">
          <tbody>
            {FIELDS.map(({ key, label }) => (
              <tr key={key}>
                <th className="w-24 border border-zinc-400 bg-zinc-50 px-2 py-1 text-left align-top">
                  {label}
                </th>
                <td className="whitespace-pre-wrap border border-zinc-400 px-2 py-1 align-top">
                  {workOrder[key] ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
