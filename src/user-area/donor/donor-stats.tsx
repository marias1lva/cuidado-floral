export function DonorStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card title="Doações realizadas" value="5" />
      <Card title="Valor total" value="R$ 250" />
      <Card title="Materiais doados" value="3" />
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-pink-600">{value}</p>
    </div>
  );
}