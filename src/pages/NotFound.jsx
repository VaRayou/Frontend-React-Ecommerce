import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="container text-center" style={{ padding: "60px 15px 80px" }}>
      <div className="logo-404" style={{ marginBottom: 30 }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img
            src="/user/images/home/veayor-logo.jpg"
            alt="VEAYOR"
            style={{ height: 50, width: 50, objectFit: "cover", borderRadius: 10 }}
          />
          <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "2px", color: "#1e293b", fontFamily: "serif" }}>
            VEAYOR
          </span>
        </Link>
      </div>

      <div className="content-404">
        <img
          src="/user/images/404/404.png"
          className="img-responsive"
          alt="404 Not Found"
          style={{ margin: "0 auto 30px", maxHeight: 260 }}
        />
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#363432", marginBottom: 12 }}>
          <b>OPPS!</b> We Couldn’t Find this Page
        </h1>
        <p style={{ fontSize: 16, color: "#696763", maxWidth: 500, margin: "0 auto 30px" }}>
          Uh... It looks like the page you are looking for has been moved or vanished.
        </p>
        <h2>
          <Link
            to="/"
            style={{
              backgroundColor: "#fe980f",
              color: "#fff",
              padding: "12px 30px",
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 4,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            <i className="fa fa-home" style={{ marginRight: 8 }}></i>
            Bring me back Home
          </Link>
        </h2>
      </div>
    </div>
  );
}

export default NotFound;

