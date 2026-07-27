import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

async function createWorkOrder(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const orderId = Number(formData.get("order_id"));
  if (!Number.isFinite(orderId)) {
    throw new Error("受注を選択してください");
  }

  const assignee = String(formData.get("assignee") ?? "").trim();
  if (!assignee) {
    throw new Error("担当者を入力してください");
  }

  const { data: lastWorkOrder, error: lastWorkOrderError } = await supabase
    .from("work_orders")
    .select("work_order_code")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastWorkOrderError) {
    throw new Error(
      `work_order_codeの採番に失敗しました: ${lastWorkOrderError.message}`,
    );
  }

  const lastNumber = lastWorkOrder?.work_order_code
    ? Number(String(lastWorkOrder.work_order_code).replace(/^\D+/, ""))
    : 0;
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  const workOrderCode = `WO-${String(nextNumber).padStart(4, "0")}`;

  const { error } = await supabase.from("work_orders").insert({
    order_id: orderId,
    assignee,
    work_order_code: workOrderCode,
    issued_date: new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Tokyo",
    }),
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("この受注にはすでに製造指示書が存在します");
    }
    throw new Error(`work_ordersへの保存に失敗しました: ${error.message}`);
  }

  revalidatePath("/");
  redirect("/");
}

export default async function NewWorkOrderPage() {
  const supabase = await createClient();
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

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">新規work_order</h1>
      <form action={createWorkOrder} className="max-w-md space-y-4">
        <div>
          <label htmlFor="order_id" className="mb-1 block text-sm font-bold">
            受注
          </label>
          <select
            id="order_id"
            name="order_id"
            required
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          >
            {orders?.map((order) => (
              <option key={order.id} value={order.id}>
                {order.order_code} - {order.subject}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="assignee" className="mb-1 block text-sm font-bold">
            担当者
          </label>
          <input
            id="assignee"
            name="assignee"
            type="text"
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
