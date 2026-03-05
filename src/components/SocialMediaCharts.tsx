import { useState } from "react";

type Platform = {
  id: string;
  name: string;
  followers: number;
  posts30d: number;
  views30d: number;
};

type SocialMediaChartsProps = {
  platforms: Platform[];
};

type MetricType = "followers" | "posts" | "views";

export function SocialMediaCharts({ platforms }: SocialMediaChartsProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("followers");
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [isChartVisible, setIsChartVisible] = useState(true);

  if (platforms.length === 0) {
    return null;
  }

  // Get data based on selected metric
  const getMetricValue = (platform: Platform) => {
    switch (selectedMetric) {
      case "followers":
        return platform.followers;
      case "posts":
        return platform.posts30d;
      case "views":
        return platform.views30d;
    }
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case "followers":
        return "Followers";
      case "posts":
        return "Posts (Last 30 Days)";
      case "views":
        return "Views (Last 30 Days)";
    }
  };

  // Platform colors
  const platformColors: Record<string, string> = {
    instagram: "#E4405F",
    facebook: "#1877F2",
    tiktok: "#000000",
    youtube: "#FF0000"
  };

  const platformIcons: Record<string, string> = {
    instagram: "📷",
    facebook: "👥",
    tiktok: "🎵",
    youtube: "▶️"
  };

  return (
    <div>
      {/* Filter Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setSelectedMetric("followers")}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              backgroundColor: selectedMetric === "followers" ? "#2563eb" : "#ffffff",
              color: selectedMetric === "followers" ? "#ffffff" : "#6b7280",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Followers
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("posts")}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              backgroundColor: selectedMetric === "posts" ? "#2563eb" : "#ffffff",
              color: selectedMetric === "posts" ? "#ffffff" : "#6b7280",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Posts
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("views")}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              backgroundColor: selectedMetric === "views" ? "#2563eb" : "#ffffff",
              color: selectedMetric === "views" ? "#ffffff" : "#6b7280",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Views
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsChartVisible(!isChartVisible)}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            backgroundColor: "#dc2626",
            color: "#ffffff",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          {isChartVisible ? "Hide Chart" : "Show Chart"}
        </button>
      </div>

      {/* Chart Title */}
      {isChartVisible && (
        <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
          {getMetricLabel()}
        </div>
      )}

      {/* Pie Chart */}
      {isChartVisible && (
        <div style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <div style={{ position: "relative", width: 400, height: 400 }}>
            <svg width="400" height="400" style={{ transform: "rotate(-90deg)" }}>
              {(() => {
                const total = platforms.reduce((sum, p) => sum + getMetricValue(p), 0);
                let currentAngle = 0;
                
                return platforms.map((platform) => {
                  const value = getMetricValue(platform);
                  const percentage = value / total;
                  const angle = percentage * 360;
                  const radius = 160;
                  const centerX = 200;
                  const centerY = 200;
                  
                  const startAngle = (currentAngle * Math.PI) / 180;
                  const endAngle = ((currentAngle + angle) * Math.PI) / 180;
                  
                  const x1 = centerX + radius * Math.cos(startAngle);
                  const y1 = centerY + radius * Math.sin(startAngle);
                  const x2 = centerX + radius * Math.cos(endAngle);
                  const y2 = centerY + radius * Math.sin(endAngle);
                  
                  const largeArcFlag = angle > 180 ? 1 : 0;
                  
                  const pathData = [
                    `M ${centerX} ${centerY}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    "Z"
                  ].join(" ");
                  
                  const slice = (
                    <path
                      key={platform.id}
                      d={pathData}
                      fill={platformColors[platform.id] || "#3b82f6"}
                      stroke="#ffffff"
                      strokeWidth="2"
                      style={{
                        cursor: "pointer",
                        opacity: hoveredSlice === platform.id ? 0.8 : 1,
                        transform: hoveredSlice === platform.id ? "scale(1.05)" : "scale(1)",
                        transformOrigin: "200px 200px",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={() => setHoveredSlice(platform.id)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  );
                  
                  currentAngle += angle;
                  return slice;
                });
              })()}
            </svg>
          </div>
          
          {/* Legend */}
          <div style={{ flex: 1 }}>
            {platforms.map((platform) => {
              const value = getMetricValue(platform);
              const total = platforms.reduce((sum, p) => sum + getMetricValue(p), 0);
              const percentage = ((value / total) * 100).toFixed(1);
              
              return (
                <div
                  key={platform.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8,
                    padding: "8px 12px",
                    borderRadius: 6,
                    backgroundColor: hoveredSlice === platform.id ? "#f3f4f6" : "transparent",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease"
                  }}
                  onMouseEnter={() => setHoveredSlice(platform.id)}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      backgroundColor: platformColors[platform.id] || "#3b82f6"
                    }}
                  />
                  <span style={{ fontSize: 16 }}>{platformIcons[platform.id]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>
                      {platform.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {value.toLocaleString()} ({percentage}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}