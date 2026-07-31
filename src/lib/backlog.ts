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
  delivered_quantity: number;
  remaining_quantity: number;
  latest_delivery_date: string | null;
};

export async function getOrdersWithRemainingQuantity(
  supabase: SupabaseClient,
): Promise<{ data: OrderWithRemainingQuantity[] | null; error: string | null }> {
  const { data: rawOrders, error: ordersError } = await supabase
    .from("orders")
    .select("*, companies(company_name)")
    .order("id", { ascending: true });

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
    const { companies, ...rest } = order as typeof order & {
      companies: { company_name: string } | null;
    };
    const deliveredQuantity = deliveredByOrderId.get(order.id) ?? 0;
    return {
      ...rest,
      company_name: companies?.company_name ?? null,
      delivered_quantity: deliveredQuantity,
      remaining_quantity: order.quantity - deliveredQuantity,
      latest_delivery_date: latestDeliveryDateByOrderId.get(order.id) ?? null,
    };
  });

  return { data: orders, error: null };
}
