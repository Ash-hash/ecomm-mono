import { toast } from "react-hot-toast";

type ToastType = "success" | "error" | "info";

const showToast = (message: string, type: ToastType = "info") => {
  const backgroundColor =
    type === "success"
      ? "#4CAF50"
      : type === "error"
      ? "#F44336"
      : "#333";

  toast(message, {
    duration: 2500,
    position: "top-center",
    style: {
      background: backgroundColor,
      color: "#fff",
      borderRadius: "10px",
      padding: "12px 16px",
      margin: "0 20px",
      fontSize: "14px",
    },
  });
};

export const showSuccess = (message: string) => showToast(message, "success");
export const showError = (message: string) => showToast(message, "error");
export const showInfo = (message: string) => showToast(message, "info");