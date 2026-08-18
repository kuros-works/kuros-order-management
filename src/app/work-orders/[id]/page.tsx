import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getWorkOrderedOrderIds } from "@/lib/backlog";
import { WorkOrderForm } from "./work-order-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const isNew = id === "new";

  const supabase = await createClient();

  if (isNew) {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, order_code, subject")
      .order("id", { ascending: true });

    if (error) {
      return (
        <div className="p-8">
          <h1 className="text-xl font-bold text-red-600">
            ordersの取得に失敗しました
          </h1>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
            {error.message}
          </pre>
        </div>
      );
    }

    const { data: workOrderedOrderIds, error: workOrderedOrderIdsError } =
      await getWorkOrderedOrderIds(supabase);

    if (workOrderedOrderIdsError) {
      return (
        <div className="p-8">
          <h1 className="text-xl font-bold text-red-600">
            {workOrderedOrderIdsError}
          </h1>
        </div>
      );
    }

    const eligibleOrders = (orders ?? []).filter(
      (order) => !workOrderedOrderIds?.has(order.id),
    );

    return (
      <div className="p-8">
        <h1 className="mb-4 text-xl font-bold">新規製造指示書</h1>
        <WorkOrderForm workOrder={null} orders={eligibleOrders} />
      </div>
    );
  }

  const workOrderId = Number(id);
  if (!Number.isFinite(workOrderId)) {
    notFound();
  }

  const { data: workOrderRow, error: workOrderError } = await supabase
    .from("work_orders")
    .select(
      "id, work_order_code, assignee, issued_date, order_id, orders(order_code, subject, drawing_number, quantity, desired_delivery_date, notes, companies(company_name))",
    )
    .eq("id", workOrderId)
    .maybeSingle();

  if (workOrderError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          work_ordersの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {workOrderError.message}
        </pre>
      </div>
    );
  }

  if (!workOrderRow) {
    notFound();
  }

  type CompanyRef = { company_name: string };
  type OrderRef = {
    order_code: string;
    subject: string;
    drawing_number: string | null;
    quantity: number;
    desired_delivery_date: string | null;
    notes: string | null;
    companies: CompanyRef[] | CompanyRef | null;
  };
  const { orders: orderRef, ...rest } = workOrderRow as typeof workOrderRow & {
    orders: OrderRef[] | OrderRef | null;
  };
  const orderInfo = Array.isArray(orderRef) ? orderRef[0] : orderRef;
  const companyRef = orderInfo
    ? Array.isArray(orderInfo.companies)
      ? orderInfo.companies[0]
      : orderInfo.companies
    : null;

  const workOrder = {
    ...rest,
    order_code: orderInfo?.order_code ?? "-",
    subject: orderInfo?.subject ?? "-",
    drawing_number: orderInfo?.drawing_number ?? null,
    quantity: orderInfo?.quantity ?? null,
    desired_delivery_date: orderInfo?.desired_delivery_date ?? null,
    company_name: companyRef?.company_name ?? "-",
    order_notes: orderInfo?.notes ?? null,
  };

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">製造指示書編集</h1>
      <WorkOrderForm workOrder={workOrder} orders={[]} />
    </div>
  );
}
