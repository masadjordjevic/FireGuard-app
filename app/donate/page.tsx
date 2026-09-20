import { redirect } from "next/navigation";

// Donations now live per-campaign — see /campaigns and /campaigns/[id]
// (the wallet-connect-and-donate form that used to live on this page moved
// to components/CampaignDonateForm.tsx).
export default function DonatePage() {
  redirect("/campaigns");
}
