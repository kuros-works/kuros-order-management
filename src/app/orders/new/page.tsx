import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

async function createOrder(formData: FormData) {
  "use server";

  const subject = String(formData.get("subject") ?? "").trim();
  if (!subject) {
    throw new Error("件名を入力してください");
  }

  const unit = String(formData.get("unit") ?? "").trim();
  if (!unit) {
    throw new Error("単位を入力してください");
  }

  const quantity = Number(formData.get("quantity"));
  if (!Number.isFinite(quantity)) {
    throw new Error("数量を入力してください");
  }

  const unitPrice = Number(formData.get("unit_price"));
  if (!Number.isFinite(unitPrice)) {
    throw new Error("単価を入力してください");
  }

  const { error } = await supabase.from("orders").insert({
    company_id: 2,
    subject,
    quantity,
    unit_price: unitPrice,
    unit,
    order_date: new Date().toISOString().slice(0, 10),
    status: "受注",
  });

  if (error) {
    throw new Error(`ordersへの保存に失敗しました: ${error.message}`);
  }

  redirect("/");
}

export default function NewOrderPage() {
  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">新規受注</h1>
      <form action={createOrder} className="max-w-md space-y-4">
        <div>
          <label htmlFor="subject" className="mb-1 block text-sm font-bold">
            件名
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="quantity" className="mb-1 block text-sm font-bold">
            数量
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            required
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="unit" className="mb-1 block text-sm font-bold">
            単位
          </label>
          <input
            id="unit"
            name="unit"
            type="text"
            required
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="unit_price" className="mb-1 block text-sm font-bold">
            単価
          </label>
          <input
            id="unit_price"
            name="unit_price"
            type="number"
            required
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
        >
          保存
        </button>
      </form>
    </div>
  );
}
