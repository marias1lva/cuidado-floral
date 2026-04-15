// donor-dashboard.tsx
import { DonorStats } from "./donor-stats";
import { DonorCampaigns } from "./donor-campaigns";
import { DonorHistory } from "./donor-history";

export function DonorDashboard() {
  return (
    <div className="mt-6 space-y-6">
      <DonorStats />

      <DonorCampaigns />

      <DonorHistory />
    </div>
  );
}