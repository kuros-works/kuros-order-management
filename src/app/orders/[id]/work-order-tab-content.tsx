import Link from "next/link";

type WorkOrder = {
  id: number;
  work_order_code: string;
  assignee: string | null;
  issued_date: string;
};

export function WorkOrderTabContent({
  workOrder,
}: {
  workOrder: WorkOrder | null;
}) {
  if (!workOrder) {
    return (
      <div className="space-y-2">
        <p className="text-zinc-500">製造指示未作成</p>
        <Link href="/work-orders/new" className="text-blue-600 hover:underline">
          製造指示書を新規作成
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 block text-sm font-bold">製造指示書番号</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {workOrder.work_order_code}
        </div>
      </div>
      <div>
        <p className="mb-1 block text-sm font-bold">担当者</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {workOrder.assignee ?? "-"}
        </div>
      </div>
      <div>
        <p className="mb-1 block text-sm font-bold">指示日</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {workOrder.issued_date}
        </div>
      </div>
    </div>
  );
}
