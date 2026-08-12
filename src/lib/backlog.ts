import { SupabaseClient } from "@supabase/supabase-js";

export type OrderWithRemainingQuantity = {
  id: number;
  order_code: string;
  subject: string;
  company_id: number;
  unit_price: number;
  quantity: number;
  unit: string;
  order_date: string;
  status: string;
  desired_delivery_date: string | null;
  drawing_number: string | null;
  notes: string | null;
  batch_invoice_id: number | null;
  company_name: string | null;
  assignee: string | null;
  delivered_quantity: number;
  remaining_quantity: number;
  latest_delivery_date: string | null;
};

export const ALLOWED_SORT_COLUMNS = [
  "id",
  "order_date",
  "desired_delivery_date",
  "completion_date",
  "subject",
  "drawing_number",
  "quantity",
  "unit_price",
  "total_amount",
  "company_name",
  "order_code",
] as const;

export async function getOrdersWithRemainingQuantity(
  supabase: SupabaseClient,
  filters?: {
    drawingNumber?: string;
    subject?: string;
    companyName?: string;
    orderDateFrom?: string;
    orderDateTo?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
): Promise<{ data: OrderWithRemainingQuantity[] | null; error: string | null }> {
  let ordersQuery = supabase
    .from("orders")
    .select("*, companies(company_name), work_orders(assignee)");

  if (
    filters?.sortBy &&
    (ALLOWED_SORT_COLUMNS as readonly string[]).includes(filters.sortBy)
  ) {
    const ascending = filters.sortOrder !== "desc";
    ordersQuery =
      filters.sortBy === "company_name"
        ? ordersQuery.order("company_name", {
            referencedTable: "companies",
            ascending,
          })
        : ordersQuery.order(filters.sortBy, { ascending });
  } else {
    ordersQuery = ordersQuery.order("id", { ascending: true });
  }

  if (filters?.drawingNumber) {
    ordersQuery = ordersQuery.ilike(
      "drawing_number",
      `%${filters.drawingNumber}%`,
    );
  }

  if (filters?.subject) {
    ordersQuery = ordersQuery.ilike("subject", `%${filters.subject}%`);
  }

  if (filters?.companyName) {
    const { data: matchedCompanies, error: companiesError } = await supabase
      .from("companies")
      .select("id")
      .ilike("company_name", `%${filters.companyName}%`);

    if (companiesError) {
      return {
        data: null,
        error: `companiesの取得に失敗しました: ${companiesError.message}`,
      };
    }

    const companyIds = (matchedCompanies ?? []).map((company) => company.id);
    ordersQuery = ordersQuery.in("company_id", companyIds);
  }

  if (filters?.orderDateFrom) {
    ordersQuery = ordersQuery.gte("order_date", filters.orderDateFrom);
  }

  if (filters?.orderDateTo) {
    ordersQuery = ordersQuery.lte("order_date", filters.orderDateTo);
  }

  const { data: rawOrders, error: ordersError } = await ordersQuery;

  if (ordersError) {
    return {
      data: null,
      error: `ordersの取得に失敗しました: ${ordersError.message}`,
    };
  }

  const { data: deliveryNoteItems, error: deliveryNoteItemsError } =
    await supabase
      .from("delivery_note_items")
      .select("order_id, delivered_quantity, delivery_notes(created_date)");

  if (deliveryNoteItemsError) {
    return {
      data: null,
      error: `delivery_note_itemsの取得に失敗しました: ${deliveryNoteItemsError.message}`,
    };
  }

  const deliveredByOrderId = new Map<number, number>();
  const latestDeliveryDateByOrderId = new Map<number, string>();
  for (const item of deliveryNoteItems ?? []) {
    const { delivery_notes } = item as typeof item & {
      delivery_notes: { created_date: string } | null;
    };

    const current = deliveredByOrderId.get(item.order_id) ?? 0;
    deliveredByOrderId.set(item.order_id, current + item.delivered_quantity);

    const createdDate = delivery_notes?.created_date;
    if (createdDate) {
      const latest = latestDeliveryDateByOrderId.get(item.order_id);
      if (!latest || createdDate > latest) {
        latestDeliveryDateByOrderId.set(item.order_id, createdDate);
      }
    }
  }

  const orders = (rawOrders ?? []).map((order) => {
    const { companies, work_orders, ...rest } = order as typeof order & {
      companies: { company_name: string } | null;
      work_orders: { assignee: string }[] | { assignee: string } | null;
    };
    const deliveredQuantity = deliveredByOrderId.get(order.id) ?? 0;
    const workOrderRecord = Array.isArray(work_orders)
      ? work_orders[0]
      : work_orders;
    return {
      ...rest,
      company_name: companies?.company_name ?? null,
      assignee: workOrderRecord?.assignee ?? null,
      delivered_quantity: deliveredQuantity,
      remaining_quantity: order.quantity - deliveredQuantity,
      latest_delivery_date: latestDeliveryDateByOrderId.get(order.id) ?? null,
    };
  });

  return { data: orders, error: null };
}

export async function getInvoicedOrderIds(
  supabase: SupabaseClient,
): Promise<{ data: Set<number> | null; error: string | null }> {
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("order_id");

  if (invoicesError) {
    return {
      data: null,
      error: `invoicesの取得に失敗しました: ${invoicesError.message}`,
    };
  }

  return {
    data: new Set((invoices ?? []).map((invoice) => invoice.order_id)),
    error: null,
  };
}

export async function getWorkOrderedOrderIds(
  supabase: SupabaseClient,
): Promise<{ data: Set<number> | null; error: string | null }> {
  const { data: workOrders, error: workOrdersError } = await supabase
    .from("work_orders")
    .select("order_id");

  if (workOrdersError) {
    return {
      data: null,
      error: `work_ordersの取得に失敗しました: ${workOrdersError.message}`,
    };
  }

  return {
    data: new Set((workOrders ?? []).map((workOrder) => workOrder.order_id)),
    error: null,
  };
}

export function getAggregatedStatus(statuses: {
  manufacturingStatus: string;
  deliveryStatus: string;
  invoiceStatus: string;
  paymentStatusLabel: string;
}): string {
  const { manufacturingStatus, deliveryStatus, invoiceStatus, paymentStatusLabel } =
    statuses;

  if (paymentStatusLabel === "入金済み") {
    return "入金済み";
  }
  if (invoiceStatus === "請求済み") {
    return "請求済み";
  }
  if (deliveryStatus === "完納") {
    return "納品済み";
  }
  if (manufacturingStatus === "製造指示済み") {
    return "製造指示済み";
  }
  return "受注";
}
