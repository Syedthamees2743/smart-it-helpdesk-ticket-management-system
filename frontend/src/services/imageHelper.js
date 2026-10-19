// Base host URL மட்டும் எடுக்கும் (கடைசியில் உள்ள /api-ஐ நீக்கிவிடும்)
const BASE_HOST = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, "")
  : "https://smart-it-service-desk-api.onrender.com";

export const getFullImageUrl = (imagePath) => {
  if (!imagePath) return "";

  // ஒருவேளை Backend தவறுதலாக localhost/127.0.0.1 அனுப்பினால்
  if (imagePath.includes("127.0.0.1:8000") || imagePath.includes("localhost:8000")) {
    return imagePath.replace(/http:\/\/(127\.0\.0\.1|localhost):8000/, BASE_HOST);
  }

  // ஏற்கனவே சரியான https:// URL ஆக இருந்தால்
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // வெறும் relative path-ஆக (/media/... அல்லது media/...) வந்தால்
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${BASE_HOST}${cleanPath}`;
};