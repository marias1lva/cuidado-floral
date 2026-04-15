export function DonorCampaigns() {
  return (
    <div className="bg-white border rounded-xl p-6">
      <h2 className="font-semibold mb-4">Campanhas ativas</h2>

      <Campaign name="Outubro Rosa" progress={65} />
      <Campaign name="Arrecadação de roupas" progress={40} />
    </div>
  );
}

function Campaign({ name, progress }: any) {
  return (
    <div className="mb-4">
      <p className="text-sm font-medium">{name}</p>
      <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
        <div
          className="bg-pink-500 h-2 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}