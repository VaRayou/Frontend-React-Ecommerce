import React from "react";

function Loader({ message = "Loading...", fullScreen = false }) {
  if (fullScreen) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}
      >
        <div className="spinner"></div>
        {message && (
          <p style={{ marginTop: 16, fontSize: 14, color: "#696763", fontWeight: 500 }}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      {message && (
        <p style={{ marginTop: 14, fontSize: 13, color: "#888" }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default Loader;

