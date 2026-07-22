import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "./config/api";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await axios.post(`${API_BASE_URL}/auth/register`, formData);
      window.location.href = "/login";
    } catch (err) {
      const backendError = err.response?.data;
      const message = typeof backendError === "object" && backendError !== null
        ? backendError.message || "注册失败，请检查输入内容。"
        : typeof backendError === "string"
          ? backendError
          : "注册失败，该邮箱可能已被使用。";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={authWrapper}>
      <div style={{ ...authCard, border: error ? "1px solid #f1d2c9" : "1px solid #e7e0cf" }}>
        <h1 style={titleStyle}>创建上网账号</h1>
        <p style={subtitleStyle}>注册后即可购买船上 WiFi 套餐，并在航程内使用上网服务。</p>

        {error && (
          <div style={errorBanner}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} style={formStyle}>
          <div style={inputGroup}>
            <User size={18} style={{ ...fieldIcon, color: error ? "#cf5f45" : "#7d847f" }} />
            <input
              name="name"
              type="text"
              placeholder="姓名"
              required
              value={formData.name}
              onChange={(event) => {
                setFormData({ ...formData, name: event.target.value });
                if (error) setError("");
              }}
              style={{ ...inputStyle, borderColor: error ? "#efc7bd" : "#e5dfd0" }}
            />
          </div>

          <div style={inputGroup}>
            <Mail size={18} style={{ ...fieldIcon, color: error ? "#cf5f45" : "#7d847f" }} />
            <input
              name="email"
              type="email"
              placeholder="邮箱地址"
              required
              value={formData.email}
              onChange={(event) => {
                setFormData({ ...formData, email: event.target.value });
                if (error) setError("");
              }}
              style={{ ...inputStyle, borderColor: error ? "#efc7bd" : "#e5dfd0" }}
            />
          </div>

          <div style={inputGroup}>
            <Lock size={18} style={{ ...fieldIcon, color: error ? "#cf5f45" : "#7d847f" }} />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="设置密码"
              required
              value={formData.password}
              onChange={(event) => {
                setFormData({ ...formData, password: event.target.value });
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
            {isSubmitting ? "正在创建账号..." : "注册"}
            {!isSubmitting && <ChevronRight size={18} />}
          </button>
        </form>

        <p style={footerLinkText}>
          已有账号？
          <span onClick={() => navigate("/login")} style={linkBtn}>返回登录</span>
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
const subtitleStyle = { fontSize: "15px", color: "#6f7a74", marginBottom: "30px", lineHeight: 1.6 };
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
