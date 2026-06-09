import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>🗺️</div>
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            marginBottom: "0.75rem",
          }}
        >
          <span className="gradient-text">404</span> — Lost in transit
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.1rem", marginBottom: "2.5rem" }}>
          This page doesn't exist. Maybe the midpoint is elsewhere?
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" className="btn-primary">
            🏠 Go Home
          </Link>
          <Link to="/create" className="btn-secondary">
            🚀 Create a Trip
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
