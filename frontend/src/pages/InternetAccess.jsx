import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Wifi, ShieldCheck, Timer, Database, RefreshCw } from "lucide-react";

const API_BASE = "http://localhost:8080";

const InternetAccess = () => {
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("jwt_token");

    const config = useMemo(() => ({
        headers: {
            Authorization: `Bearer ${token}`
        }
    }), [token]);

    const checkStatus = async () => {
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const res = await axios.get(
                `${API_BASE}/api/wifi/status`,
                config
            );

            const data = res.data;

            if (!data || data.status === "NO_SESSION") {
                navigate("/wifi?reason=unauthorized");
                return;
            }

            if (data.status !== "ACTIVE") {
                navigate("/wifi?reason=expired");
                return;
            }

            setSession(data);
        } catch (err) {
            console.error("Check Wi-Fi status failed:", err);
            navigate("/wifi?reason=unauthorized");
        } finally {
            setLoading(false);
        }
    };

    const simulateUsage = async () => {
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const res = await axios.post(
                `${API_BASE}/api/wifi/usage`,
                { usedMb: 5 },
                config
            );

            const data = res.data;

            if (!data || data.status !== "ACTIVE") {
                navigate("/wifi?reason=disconnected");
                return;
            }

            setSession(data);
        } catch (err) {
            console.error("Simulate Wi-Fi usage failed:", err);
            navigate("/wifi?reason=disconnected");
        }
    };

    useEffect(() => {
        checkStatus();

        const timer = setInterval(() => {
            simulateUsage();
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    if (loading) {
        return (
            <div style={page}>
                <div style={loadingBox}>
                    <RefreshCw size={28} />
                    <h2>Checking Wi-Fi Access...</h2>
                </div>
            </div>
        );
    }

    return (
        <div style={page}>
            <div style={card}>
                <div style={iconBox}>
                    <Wifi size={42} color="#6f42c1" />
                </div>

                <h1 style={title}>Internet Access Enabled</h1>

                <p style={subtitle}>
                    Your shipboard Wi-Fi package is active. You are now allowed to access the internet.
                </p>

                {session && (
                    <div style={statusGrid}>
                        <div style={statusItem}>
                            <ShieldCheck size={22} color="#198754" />
                            <div>
                                <div style={label}>Status</div>
                                <div style={value}>{session.status}</div>
                            </div>
                        </div>

                        <div style={statusItem}>
                            <Timer size={22} color="#6f42c1" />
                            <div>
                                <div style={label}>Ends At</div>
                                <div style={value}>
                                    {new Date(session.endTime).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div style={statusItem}>
                            <Database size={22} color="#0d6efd" />
                            <div>
                                <div style={label}>Data Usage</div>
                                <div style={value}>
                                    {session.usedDataMb}MB / {session.dataLimitMb}MB
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={demoBox}>
                    <h3>Simulated Internet Page</h3>
                    <p>
                        This page represents the internet access area. If the Wi-Fi package expires
                        or the data limit is reached, the system will automatically disconnect this
                        passenger and redirect back to the Wi-Fi purchase portal.
                    </p>
                </div>
            </div>
        </div>
    );
};

const page = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eef7ff, #f7f2ff)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px"
};

const loadingBox = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    color: "#333"
};

const card = {
    width: "100%",
    maxWidth: "900px",
    backgroundColor: "#fff",
    borderRadius: "24px",
    padding: "36px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.12)"
};

const iconBox = {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#f1e8ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px"
};

const title = {
    fontSize: "32px",
    marginBottom: "10px",
    color: "#222"
};

const subtitle = {
    fontSize: "16px",
    color: "#666",
    marginBottom: "28px"
};

const statusGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "28px"
};

const statusItem = {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: "16px",
    borderRadius: "16px"
};

const label = {
    fontSize: "12px",
    color: "#777",
    marginBottom: "4px"
};

const value = {
    fontSize: "15px",
    fontWeight: "700",
    color: "#222"
};

const demoBox = {
    backgroundColor: "#f8f5ff",
    borderRadius: "16px",
    padding: "20px",
    color: "#333"
};

export default InternetAccess;