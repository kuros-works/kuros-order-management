import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { DeliveryDetailForm } from "./delivery-detail-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DeliveryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const deliveryItemId = Number(id);
  if (!Number.isFinite(deliveryItemId)) {
    notFound();
  }

  const supabase = await createClient();

  const { data: deliveryItemRow, error } = await supabase
    .from("delivery_note_items")
    .select(
      "id, delivered_quantity, order_id, delivery_notes(delivery_note_code, created_date), orders(order_code, subject, drawing_number, unit_price, notes, companies(company_name))",
    )
    .eq("id", deliveryItemId)
    .maybeSingle();

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          delivery_note_itemsの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  if (!deliveryItemRow) {
    notFound();
  }

  type DeliveryNoteRef = { delivery_note_code: string; created_date: string };
  type CompanyRef = { company_name: string };
  type OrderRef = {
    order_code: string;
    subject: string;
    drawing_number: string | null;
    unit_price: number;
    notes: string | null;
    companies: CompanyRef[] | CompanyRef | null;
  };

  const {
    delivery_notes,
    orders: orderRef,
    ...rest
  } = deliveryItemRow as typeof deliveryItemRow & {
    delivery_notes: DeliveryNoteRef[] | DeliveryNoteRef | null;
    orders: OrderRef[] | OrderRef | null;
  };

  const deliveryNoteInfo = Array.isArray(delivery_notes)
    ? delivery_notes[0]
    : delivery_notes;
  const orderInfo = Array.isArray(orderRef) ? orderRef[0] : orderRef;
  const companyRef = orderInfo
    ? Array.isArray(orderInfo.companies)
      ? orderInfo.companies[0]
      : orderInfo.companies
    : null;

  const deliveryDetail = {
    ...rest,
    delivery_note_code: deliveryNoteInfo?.delivery_note_code ?? "-",
    delivery_date: deliveryNoteInfo?.created_date ?? "-",
    order_code: orderInfo?.order_code ?? "-",
    subject: orderInfo?.subject ?? "-",
    drawing_number: orderInfo?.drawing_number ?? null,
    unit_price: orderInfo?.unit_price ?? 0,
    company_name: companyRef?.company_name ?? "-",
    order_notes: orderInfo?.notes ?? null,
  };

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">納品明細編集</h1>
      <DeliveryDetailForm deliveryItem={deliveryDetail} />
    </div>
  );
}
