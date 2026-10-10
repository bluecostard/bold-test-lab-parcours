import { useEffect, useState } from "react";
import { campaigns as seedCampaigns } from "./data.js";
import { listCampaigns } from "./campaignsApi.js";

export function useCampaignCatalog() {
  const [list, setList] = useState(seedCampaigns);
  useEffect(() => {
    listCampaigns()
      .then((items) => {
        const ids = new Set(seedCampaigns.map((item) => item.id));
        setList([...seedCampaigns, ...items.filter((item) => item.id && !ids.has(item.id))]);
      })
      .catch(() => setList(seedCampaigns));
  }, []);
  return list;
}
