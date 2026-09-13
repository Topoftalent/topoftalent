// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT · GA4 en el dashboard (Analytics Data API)
//
// Callable solo para admins. Corre como la cuenta de servicio
// firebase-adminsdk-fbsvc (que tiene acceso de Lector a la propiedad
// GA4 395605586) y trae métricas de los últimos 28 días.
//
// Requiere: API "analyticsdata.googleapis.com" habilitada en el
// proyecto (una sola vez, desde la consola).
// ─────────────────────────────────────────────────────────────────
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const { BetaAnalyticsDataClient } = require("@google-analytics/data");

const PROPERTY = "properties/395605586";
const SA = "firebase-adminsdk-fbsvc@top-of-talent.iam.gserviceaccount.com";
let client;

exports.getAnalytics = onCall(
  { region: "us-east1", serviceAccount: SA, memory: "256MiB" },
  async (req) => {
    const uid = req.auth && req.auth.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Inicia sesión.");
    const snap = await getFirestore().doc("users/" + uid).get();
    if (!snap.exists || snap.data().isAdmin !== true) {
      throw new HttpsError("permission-denied", "Solo administradores.");
    }

    if (!client) client = new BetaAnalyticsDataClient();
    const dateRanges = [{ startDate: "28daysAgo", endDate: "today" }];

    try {
      const [tot] = await client.runReport({
        property: PROPERTY,
        dateRanges,
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }, { name: "sessions" }],
      });
      const mv = (tot.rows && tot.rows[0])
        ? tot.rows[0].metricValues
        : [{ value: "0" }, { value: "0" }, { value: "0" }];

      const [cRep] = await client.runReport({
        property: PROPERTY,
        dateRanges,
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 5,
      });
      const [pRep] = await client.runReport({
        property: PROPERTY,
        dateRanges,
        dimensions: [{ name: "pageTitle" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 6,
      });

      return {
        ok: true,
        days: 28,
        activeUsers: Number(mv[0].value || 0),
        views: Number(mv[1].value || 0),
        sessions: Number(mv[2].value || 0),
        countries: (cRep.rows || []).map((r) => ({
          name: r.dimensionValues[0].value,
          users: Number(r.metricValues[0].value || 0),
        })),
        pages: (pRep.rows || []).map((r) => ({
          name: r.dimensionValues[0].value,
          views: Number(r.metricValues[0].value || 0),
        })),
      };
    } catch (e) {
      // API sin habilitar, sin datos, o sin permisos → mensaje claro al front.
      throw new HttpsError("failed-precondition", (e && e.message) || "GA4 no disponible todavía.");
    }
  }
);
