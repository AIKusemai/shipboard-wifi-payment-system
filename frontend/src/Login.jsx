import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ChevronRight, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "./config/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/authenticate`, {
        email,
        password
      });

      const { token, role, name } = response.data;
      localStorage.setItem("jwt_token", token);
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_name", name);
      localStorage.setItem("user_role", role || "USER");
      window.location.href = "/home";
    } catch (err) {
      const backendError = err.response?.data;
      const message = typeof backendError === "object" && backendError !== null
        ? backendError.message
        : typeof backendError === "string"
          ? backendError
          : "登录失败，请检查账号和密码。";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={authWrapper}>
      <div style={{ ...authCard, border: error ? "1px solid #f1d2c9" : "1px solid #e7e0cf" }}>
        <h1 style={titleStyle}>登录船上 WiFi</h1>
        <p style={subtitleStyle}>登录后可查看套餐、开通网络并管理当前上网状态。</p>

        {error && (
          <div style={errorBanner}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={formStyle}>
          <div style={inputGroup}>
            <Mail size={18} style={{ ...fieldIcon, color: error ? "#cf5f45" : "#7d847f" }} />
            <input
              type="email"
              placeholder="邮箱地址"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError("");
              }}
              style={{ ...inputStyle, borderColor: error ? "#efc7bd" : "#e5dfd0" }}
            />
          </div>

          <div style={inputGroup}>
            <Lock size={18} style={{ ...fieldIcon, color: error ? "#cf5f45" : "#7d847f" }} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="密码"
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError("");
              }}
              style={{ ...inputStyle, borderColor: error ? "#efc7bd" : "#e5dfd0" }}
            />
            <button type="button" onClick={() => setShowPassword((open) => !open)} style={toggleIcon}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={isSubmitting ? { ...submitBtn, opacity: 0.72, cursor: "not-allowed" } : submitBtn}
          >
            {isSubmitting ? "正在登录..." : "登录"}
            {!isSubmitting && <ChevronRight size={18} />}
          </button>
        </form>

        <p style={footerLinkText}>
          还没有账号？
          <span onClick={() => navigate("/register")} style={linkBtn}>立即注册</span>
        </p>
      </div>
    </div>
  );
}

const authWrapper = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  padding: "24px",
  backgroundColor: "#f6f4ee",
  fontFamily: "Inter, sans-serif",
  boxSizing: "border-box"
};
const authCard = {
  padding: "50px 40px",
  borderRadius: "24px",
  backgroundColor: "#fffdf8",
  boxShadow: "0 18px 40px rgba(31, 42, 37, 0.06)",
  width: "100%",
  maxWidth: "420px",
  textAlign: "center",
  boxSizing: "border-box"
};
const titleStyle = { fontSize: "30px", fontWeight: "900", color: "#173229", margin: "0 0 10px 0", letterSpacing: "-0.8px" };
const subtitleStyle = { fontSize: "15px", color: "#6f7a74", marginBottom: "34px", lineHeight: 1.6 };
const errorBanner = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  backgroundColor: "#fff3ef",
  color: "#b64d35",
  padding: "12px 16px",
  borderRadius: "12px",
  fontSize: "13px",
  fontWeight: "700",
  marginBottom: "25px",
  border: "1px solid #f5d3ca",
  textAlign: "left"
};
const formStyle = { display: "flex", flexDirection: "column", gap: "20px" };
const inputGroup = { position: "relative", display: "flex", alignItems: "center" };
const fieldIcon = { position: "absolute", left: "15px" };
const inputStyle = {
  width: "100%",
  padding: "16px 44px 16px 45px",
  borderRadius: "14px",
  border: "1px solid #e5dfd0",
  backgroundColor: "#f8f5ed",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box"
};
const toggleIcon = {
  position: "absolute",
  right: "12px",
  cursor: "pointer",
  color: "#7d847f",
  border: "none",
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center"
};
const submitBtn = {
  padding: "18px",
  background: "#1a6a56",
  color: "#fff9ee",
  border: "none",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "800",
  fontSize: "14px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "10px",
  marginTop: "10px"
};
const footerLinkText = { marginTop: "30px", fontSize: "14px", color: "#66736c" };
const linkBtn = { color: "#1a6a56", fontWeight: "800", cursor: "pointer", marginLeft: "6px" };
