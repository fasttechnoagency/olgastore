/* =========================================================================
   OLGA Store — Centralized Server, Control Panel & Integration Config
   Edit this file to update database endpoints, AI assistant API, WhatsApp
   numbers, or map servers without touching application scripts.
   ========================================================================= */
window.OLGA_CONFIG = {
  /* Olga Control Panel / Orders Database */
  dbUrl: window.OLGA_DB_URL || "https://sktmniwsdipeaocxkykz.supabase.co",
  dbKey: window.OLGA_DB_KEY || "sb_publishable_z3nEmyXGA5H-fKXp1NdA-w_hSwYslK2",

  /* Shams Live AI Chat & Natural Voice (TTS) API */
  shamsApi: window.OLGA_HALA_API || "https://checkout-chat-bridge.lovable.app/api/public/",

  /* WhatsApp Contact & Order Fallback Numbers (international format, no +) */
  whatsappSupport: "962792000155",
  whatsappOrders: "962796738495",

  /* Map Tiles & Geocoding Services */
  mapTilesUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
  geocodingBaseUrl: "https://nominatim.openstreetmap.org"
};

/* Backward-compatible global aliases */
window.OLGA_DB_URL = window.OLGA_CONFIG.dbUrl;
window.OLGA_DB_KEY = window.OLGA_CONFIG.dbKey;
window.OLGA_HALA_API = window.OLGA_CONFIG.shamsApi;
