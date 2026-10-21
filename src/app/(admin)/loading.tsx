export default function AdminLoading() {
  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "26px 36px 36px",
        background: "#F8FAFC",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes adminShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .admin-shimmer-box {
          background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%);
          background-size: 200% 100%;
          animation: adminShimmer 1.5s ease-in-out infinite;
          border-radius: 8px;
        }
      `}</style>

      {/* Top Header Skeleton */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "28px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            className="admin-shimmer-box"
            style={{ width: "48px", height: "48px", borderRadius: "14px" }}
          />
          <div>
            <div
              className="admin-shimmer-box"
              style={{ width: "220px", height: "28px", marginBottom: "8px" }}
            />
            <div
              className="admin-shimmer-box"
              style={{ width: "340px", height: "14px" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div
            className="admin-shimmer-box"
            style={{ width: "120px", height: "40px", borderRadius: "10px" }}
          />
          <div
            className="admin-shimmer-box"
            style={{ width: "140px", height: "40px", borderRadius: "10px" }}
          />
        </div>
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
          marginBottom: "28px",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              padding: "20px 22px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <div
                className="admin-shimmer-box"
                style={{ width: "90px", height: "14px" }}
              />
              <div
                className="admin-shimmer-box"
                style={{ width: "34px", height: "34px", borderRadius: "10px" }}
              />
            </div>
            <div
              className="admin-shimmer-box"
              style={{ width: "110px", height: "30px", marginBottom: "8px" }}
            />
            <div
              className="admin-shimmer-box"
              style={{ width: "140px", height: "12px" }}
            />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          flex: 1,
        }}
      >
        {/* Search / Filter bar skeleton */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "22px",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div
            className="admin-shimmer-box"
            style={{ width: "260px", height: "42px", borderRadius: "10px" }}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <div
              className="admin-shimmer-box"
              style={{ width: "100px", height: "42px", borderRadius: "10px" }}
            />
            <div
              className="admin-shimmer-box"
              style={{ width: "120px", height: "42px", borderRadius: "10px" }}
            />
          </div>
        </div>

        {/* Rows skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
                padding: "16px 18px",
                borderRadius: "12px",
                border: "1px solid #F1F5F9",
                background: "#FAFAFA",
              }}
            >
              <div
                className="admin-shimmer-box"
                style={{ width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div
                  className="admin-shimmer-box"
                  style={{ width: `${60 + (row % 3) * 15}%`, height: "16px", marginBottom: "6px" }}
                />
                <div
                  className="admin-shimmer-box"
                  style={{ width: "40%", height: "12px" }}
                />
              </div>
              <div
                className="admin-shimmer-box"
                style={{ width: "70px", height: "26px", borderRadius: "999px" }}
              />
              <div
                className="admin-shimmer-box"
                style={{ width: "90px", height: "34px", borderRadius: "8px" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Floating Modern Loading Pill */}
      <div
        style={{
          position: "fixed",
          bottom: "28px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(10px)",
          color: "#FFFFFF",
          padding: "10px 22px",
          borderRadius: "999px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "0.875rem",
          fontWeight: 600,
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15)",
          zIndex: 50,
          letterSpacing: "-0.01em",
        }}
      >
        <div
          style={{
            width: "16px",
            height: "16px",
            border: "2px solid rgba(255, 255, 255, 0.25)",
            borderTopColor: "#818CF8",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span>Loading page data...</span>
      </div>
    </div>
  );
}
