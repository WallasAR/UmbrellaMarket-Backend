import { estimateLocalDelivery, estimate99Fallback } from "../../utils/deliveryPricing.js";

const API_BASE = process.env.NINETYNINE_API_URL || "https://api.99app.com/v1/logistics";

const isConfigured = () => Boolean(process.env.NINETYNINE_API_KEY);

const fetch99Quote = async ({ originLat, originLng, destLat, destLng }) => {
  const response = await fetch(`${API_BASE}/quotes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NINETYNINE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng },
      service_type: "express"
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`99 quote failed: ${errText.slice(0, 200)}`);
  }

  const quote = await response.json();
  const local = estimateLocalDelivery({ originLat, originLng, destLat, destLng });

  return {
    courier: "99",
    provider: "99_api",
    price: Number((quote.price || quote.total_price || local.price * 1.28).toFixed(2)),
    eta_minutes: Number(quote.eta_minutes || quote.estimated_minutes || Math.max(28, local.eta_minutes - 5)),
    external_quote_id: quote.id || quote.quote_id || null,
    distance_km: quote.distance_km || local.distance_km
  };
};

const schedule99Delivery = async ({
  originLat,
  originLng,
  destLat,
  destLng,
  pickupAddress,
  dropoffAddress,
  externalQuoteId
}) => {
  const response = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NINETYNINE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      quote_id: externalQuoteId,
      origin: { lat: originLat, lng: originLng, address: pickupAddress },
      destination: { lat: destLat, lng: destLng, address: dropoffAddress },
      package_description: "Medicamentos"
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`99 delivery create failed: ${errText.slice(0, 200)}`);
  }

  const order = await response.json();
  return {
    external_job_id: order.id || order.order_id,
    tracking_url: order.tracking_url || order.tracking_link || null,
    provider: "99_api",
    provider_payload: order
  };
};

export { isConfigured as is99Configured, fetch99Quote, schedule99Delivery };
