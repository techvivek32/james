import { useState } from "react";

type Platform = {
  id: string;
  platform: string;
  platformName: string;
  followers: number;
  posts30d: number;
  views30d: number;
  [key: string]: any;
};

type CustomColumn = {
  id: string;
  name: string;
  datatype: "string" | "number" | "boolean" | "date";
};

type SocialMediaChartsProps = {
  platforms: Platform[];
  customColumns?: CustomColumn[];
};

export function SocialMediaCharts({ platforms, customColumns = [] }: SocialMediaChartsProps) {
  const numericColumns = customColumns.filter(col => col.datatype === "number");
  
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>(platforms[0]?.id || "");
  const [isChartVisible, setIsChartVisible] = useState(true);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  if (platforms.length === 0 || numericColumns.length === 0) {
    return null;
  }

  const selectedPlatform = platforms.find(p => p.id === selectedPlatformId);
  if (!selectedPlatform) return null;

  // Color palette for columns
  const columnColors = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
    "#06b6d4", "#f97316", "#6366f1", "#14b8a6", "#d946ef", "#0ea5e9"
  ];

  const getColumnColor = (index: number) => columnColors[index % columnColors.length];

  // Get max value for progress bars
  const getMaxValue = (columnName: string) => {
    return Math.max(...platforms.map(p => {
      const val = p[columnName];
      return typeof val === 'number' ? val : 0;
    }));
  };

  const selectedValue = (columnName: string) => {
    const val = selectedPlatform[columnName];
    return typeof val === 'number' ? val : 0;
  };

  return (
    <div>
      {/* Platform Selection Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {platforms.map((platform) => (
            <button
              key={platform.id}
              type="button"
              onClick={() => setSelectedPlatformId(platform.id)}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                backgroundColor: selectedPlatformId === platform.id ? "#2563eb" : "#ffffff",
                color: selectedPlatformId === platform.id ? "#ffffff" : "#6b7280",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap"
              }}
            >
              {platform.platformName}
            </button>
          ))}
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

      {/* Chart Section */}
      {isChartVisible && (
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          {/* Left: Pie Chart */}
          <div style={{ flex: 0.4 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
              {selectedPlatform.platformName} - All Columns
            </div>
            <div style={{ position: "relative", width: 300, height: 300 }}>
              <svg width="300" height="300" style={{ transform: "rotate(-90deg)" }}>
                {(() => {
                  const total = numericColumns.reduce((sum, col) => sum + selectedValue(col.name), 0);
                  let currentAngle = 0;
                  
                  return numericColumns.map((col, index) => {
                    const value = selectedValue(col.name);
                    const percentage = value / total;
                    const angle = percentage * 360;
                    const radius = 120;
                    const centerX = 150;
                    const centerY = 150;
                    
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
                        key={col.id}
                        d={pathData}
                        fill={getColumnColor(index)}
                        stroke="#ffffff"
                        strokeWidth="2"
                        style={{
                          cursor: "pointer",
                          opacity: hoveredColumn === col.id ? 0.8 : 1,
                          transform: hoveredColumn === col.id ? "scale(1.05)" : "scale(1)",
                          transformOrigin: "150px 150px",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={() => setHoveredColumn(col.id)}
                        onMouseLeave={() => setHoveredColumn(null)}
                      />
                    );
                    
                    currentAngle += angle;
                    return slice;
                  });
                })()}
              </svg>
            </div>
          </div>

          {/* Right: Progress Bars */}
          <div style={{ flex: 0.6 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
              Column Data Progress
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {numericColumns.map((col, index) => {
                const value = selectedValue(col.name);
                const maxValue = getMaxValue(col.name);
                const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                const color = getColumnColor(index);
                
                return (
                  <div
                    key={col.id}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      backgroundColor: hoveredColumn === col.id ? "#f3f4f6" : "#f9fafb"
                    }}
                    onMouseEnter={() => setHoveredColumn(col.id)}
                    onMouseLeave={() => setHoveredColumn(null)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: color
                          }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                          {col.name}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                        {value.toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{
                      width: "100%",
                      height: 8,
                      backgroundColor: "#e5e7eb",
                      borderRadius: 4,
                      overflow: "hidden"
                    }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${percentage}%`,
                          backgroundColor: color,
                          transition: "width 0.3s ease",
                          borderRadius: 4
                        }}
                      />
                    </div>
                    
                    {/* Percentage */}
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                      {percentage.toFixed(1)}% of max ({maxValue.toLocaleString()})
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
