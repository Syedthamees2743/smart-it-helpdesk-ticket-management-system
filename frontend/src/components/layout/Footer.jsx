const Footer = () => {
  return (
    <div
      className="d-flex align-items-center justify-content-between px-3 bg-white border-top"
      style={{
        height: "38px",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: "0.73rem", color: "#6c757d" }}>
        © {new Date().getFullYear()} Smart IT Service Desk
      </span>

      <div className="d-flex align-items-center gap-3">
        <a
          href="#"
          style={{
            fontSize: "0.72rem",
            color: "#6c757d",
            textDecoration: "none",
          }}
        >
          Help
        </a>
        <a
          href="#"
          style={{
            fontSize: "0.72rem",
            color: "#6c757d",
            textDecoration: "none",
          }}
        >
          Privacy
        </a>
        <span style={{ fontSize: "0.68rem", color: "#adb5bd" }}>
          v2.4.1
        </span>
      </div>
    </div>
  );
};

export default Footer;