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
  const [hoveredBar, setHoveredBar] = useState<{ platform: string; value: number } | null>(null);

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

  const getMetricUnit = () => {
    switch (selectedMetric) {
      case "followers":
        return "followers";
      case "posts":
        return "posts";
      case "views":
        return "views";
    }
  };

  // Calculate max value for scaling
  const maxValue = Math.max(...platforms.map(p => getMetricValue(p)), 1);

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
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
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

      {/* Chart Title */}
      <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
        {getMetricLabel()}
      </div>

      {/* Chart */}
      <div style={{ position: "relative" }}>
        {platforms.map((platform) => {
          const value = getMetricValue(platform);
          const percentage = (value / maxValue) * 100;
          const isHovered = hoveredBar?.platform === platform.id;
          
          return (
            <div
              key={platform.id}
              style={{
                marginBottom: 12,
                position: "relative"
              }}
              onMouseEnter={() => setHoveredBar({ platform: platform.id, value })}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{platformIcons[platform.id]}</span>
                <span style={{ fontSize: 12, color: "#6b7280", minWidth: 80 }}>{platform.name}</span>
              </div>
              <div style={{ 
                width: "100%", 
                height: 36, 
                backgroundColor: "#f3f4f6", 
                borderRadius: 6,
                position: "relative",
                overflow: "hidden"
              }}>
                <div
                  style={{
                    width: `${percentage}%`,
                    height: "100%",
                    backgroundColor: platformColors[platform.id] || "#3b82f6",
                    borderRadius: 6,
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 12,
                    transform: isHovered ? "scaleY(1.1)" : "scaleY(1)",
                    boxShadow: isHovered ? "0 4px 6px rgba(0,0,0,0.1)" : "none"
                  }}
                >
                  <span style={{ 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: "#ffffff",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                  }}>
                    {value.toLocaleString()}
                  </span>
                </div>
              </div>
              {isHovered && (
                <div style={{
                  position: "absolute",
                  top: -40,
                  left: `${Math.min(percentage, 90)}%`,
                  transform: "translateX(-50%)",
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                  zIndex: 10
                }}>
                  {value.toLocaleString()} {getMetricUnit()}
                  <div style={{
                    position: "absolute",
                    bottom: -4,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "4px solid transparent",
                    borderRight: "4px solid transparent",
                    borderTop: "4px solid #111827"
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
