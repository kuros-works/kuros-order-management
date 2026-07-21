import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

async function createOrder(formData: FormData) {
  "use server";

  const companyId = Number(formData.get("company_id"));
  if (!Number.isFinite(companyId)) {
    throw new Error("顧客を選択してください");
  }

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

  const desiredDeliveryDate =
    String(formData.get("desired_delivery_date") ?? "").trim() || null;
  const drawingNumber =
    String(formData.get("drawing_number") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase.from("orders").insert({
    company_id: companyId,
    subject,
    quantity,
    unit_price: unitPrice,
    unit,
    order_date: new Date().toISOString().slice(0, 10),
    status: "受注",
    desired_delivery_date: desiredDeliveryDate,
    drawing_number: drawingNumber,
    notes,
  });

  if (error) {
    throw new Error(`ordersへの保存に失敗しました: ${error.message}`);
  }

  redirect("/");
}

export default async function NewOrderPage() {
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, company_name")
    .order("id", { ascending: true });

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          companiesの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">新規受注</h1>
      <form action={createOrder} className="max-w-md space-y-4">
        <div>
          <label htmlFor="company_id" className="mb-1 block text-sm font-bold">
            顧客
          </label>
          <select
            id="company_id"
            name="company_id"
            required
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          >
            {companies?.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
          </select>
        </div>
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
        <div>
          <label
            htmlFor="desired_delivery_date"
            className="mb-1 block text-sm font-bold"
          >
            希望納期
          </label>
          <input
            id="desired_delivery_date"
            name="desired_delivery_date"
            type="date"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="drawing_number"
            className="mb-1 block text-sm font-bold"
          >
            図番
          </label>
          <input
            id="drawing_number"
            name="drawing_number"
            type="text"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-bold">
            備考
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
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
