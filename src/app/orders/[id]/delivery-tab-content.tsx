import Link from "next/link";

type DeliveryNoteItem = {
  id: number;
  delivered_quantity: number;
  delivery_note_code: string;
  created_date: string;
};

export function DeliveryTabContent({
  items,
  orderNotes,
}: {
  items: DeliveryNoteItem[];
  orderNotes: string | null;
}) {
  if (items.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-zinc-500">納品履歴なし</p>
        <Link href="/deliveries/new" className="text-blue-600 hover:underline">
          納品を新規作成
        </Link>
      </div>
    );
  }

  return (
    <table className="min-w-full border-collapse border border-zinc-300">
      <thead>
        <tr>
          <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
            納品日
          </th>
          <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
            納品書番号
          </th>
          <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
            納品数量
          </th>
          <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
            備考
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td className="border border-zinc-300 px-3 py-2">
              {item.created_date}
            </td>
            <td className="border border-zinc-300 px-3 py-2">
              {item.delivery_note_code}
            </td>
            <td className="border border-zinc-300 px-3 py-2">
              {item.delivered_quantity}
            </td>
            <td className="border border-zinc-300 px-3 py-2">
              {orderNotes ?? ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
