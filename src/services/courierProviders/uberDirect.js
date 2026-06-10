import { estimateLocalDelivery, estimateUberFallback } from "../../utils/deliveryPricing.js";

const UBER_TOKEN_URL = process.env.UBER_TOKEN_URL || "https://login.uber.com/oauth/v2/token";
const UBER_API_BASE = process.env.UBER_API_BASE || "https://api.uber.com/v1";

let cachedToken = null;
let tokenExpiresAt = 0;

const isConfigured = () =>
  Boolean(process.env.UBER_CLIENT_ID && process.env.UBER_CLIENT_SECRET && process.env.UBER_CUSTOMER_ID);

const getAccessToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const body = new URLSearchParams({
    client_id: process.env.UBER_CLIENT_ID,
    client_secret: process.env.UBER_CLIENT_SECRET,
    grant_type: "client_credentials",
    scope: "eats.deliveries"
  });

  const response = await fetch(UBER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error(`Uber OAuth failed: ${response.status}`);
  }

  const json = await response.json();
  cachedToken = json.access_token;
  tokenExpiresAt = Date.now() + (json.expires_in || 3600) * 1000;
  return cachedToken;
};

const fetchUberQuote = async ({ originLat, originLng, destLat, destLng }) => {
  const token = await getAccessToken();
  const customerId = process.env.UBER_CUSTOMER_ID;

  const response = await fetch(`${UBER_API_BASE}/customers/${customerId}/delivery_quotes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pickup_address: JSON.stringify({ location: { lat: originLat, lng: originLng } }),
      dropoff_address: JSON.stringify({ location: { lat: destLat, lng: destLng } })
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Uber quote failed: ${errText.slice(0, 200)}`);
  }

  const quote = await response.json();
  const fee = Number(quote.fee ? quote.fee / 100 : quote.currency_amount?.amount || 0);
  const etaMinutes = quote.duration
    ? Math.ceil(Number(quote.duration) / 60)
    : quote.dropoff_eta
      ? Math.max(20, Math.round((new Date(quote.dropoff_eta).getTime() - Date.now()) / 60000))
      : 35;

  return {
    courier: "uber",
    provider: "uber_direct",
    price: Number(fee.toFixed(2)) || estimateUberFallback({ originLat, originLng, destLat, destLng }).price,
    eta_minutes: etaMinutes,
    external_quote_id: quote.id || quote.quote_id || null,
    distance_km: quote.distance ? Number((quote.distance / 1000).toFixed(2)) : undefined
  };
};

const scheduleUberDelivery = async ({
  originLat,
  originLng,
  destLat,
  destLng,
  pickupName,
  dropoffName,
  externalQuoteId
}) => {
  const token = await getAccessToken();
  const customerId = process.env.UBER_CUSTOMER_ID;

  const payload = {
    pickup_name: pickupName || "Farmácia parceira",
    pickup_address: JSON.stringify({ location: { lat: originLat, lng: originLng } }),
    dropoff_name: dropoffName || "Cliente",
    dropoff_address: JSON.stringify({ location: { lat: destLat, lng: destLng } }),
    manifest_items: [{ name: "Medicamentos", quantity: 1 }]
  };

  if (externalQuoteId) payload.quote_id = externalQuoteId;

  const response = await fetch(`${UBER_API_BASE}/customers/${customerId}/deliveries`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Uber delivery create failed: ${errText.slice(0, 200)}`);
  }

  const delivery = await response.json();
  return {
    external_job_id: delivery.id || delivery.delivery_id,
    tracking_url: delivery.tracking_url || delivery.tracking_link || null,
    provider: "uber_direct",
    provider_payload: delivery
  };
};

export { isConfigured as isUberConfigured, fetchUberQuote, scheduleUberDelivery };
