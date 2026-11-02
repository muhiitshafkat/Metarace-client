import { useEffect, useState } from "react";
import { getTotalStaked } from "../utils/Contract";

export const DataFeed = () => {
  const [totalEthLocked, setTotalEthLocked] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const staked = await getTotalStaked("0x0000000000000000000000000000000000000000");
        setTotalEthLocked(staked);
      } catch (e) {
        setTotalEthLocked(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Mock data for demonstration — replace with real contract calls
  const stats = [
    {
      label: "Total ETH Locked",
      value: loading ? "..." : totalEthLocked !== null ? `${totalEthLocked}` : "1,024",
      suffix: "ETH",
      trend: "+12.5%",
    },
    {
      label: "Total MRT Staked",
      value: "92.4K",
      suffix: "MRT",
      trend: "+8.2%",
    },
    {
      label: "NFT Holders",
      value: "1,247",
      suffix: "",
      trend: "+156",
    },
  ];

  return (
    <div className="DataFeed">
      <div className="FeedWrap">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-item">
            <span className="stat-label">{stat.label}</span>
            <div className="stat-value-row">
              <span className="stat-value">{stat.value}</span>
              {stat.suffix && <span className="stat-suffix">{stat.suffix}</span>}
            </div>
            <span className="stat-trend">{stat.trend}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
