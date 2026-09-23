import * as adminReportsService from "../services/adminReports.service.js";
import { toCsv, sendCsv } from "../utils/csv.js";

// Every handler is reachable only via adminOnly (see adminReports.routes.js)
// — req.user.role is guaranteed ADMIN before any of these run.

function filtersFromQuery(req) {
  return { barangayId: req.query.barangayId, from: req.query.from, to: req.query.to };
}

export async function getBarangays(req, res, next) {
  try {
    const data = await adminReportsService.listReportBarangays();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getReport(req, res, next) {
  try {
    const data = await adminReportsService.getSystemReport(req.user, filtersFromQuery(req));
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ---- CSV export ----
// Each export re-derives the SAME report the Admin is currently viewing
// (same barangayId/from/to filters, passed as query params by the
// frontend export button) rather than accepting a client-supplied
// dataset — so an export can never diverge from, or be spoofed against,
// what getSystemReport actually computed server-side.

export async function exportBarangaySummaryCsv(req, res, next) {
  try {
    const report = await adminReportsService.getSystemReport(req.user, filtersFromQuery(req));
    const rows =
      report.scope === "all"
        ? report.byBarangay
        : report.barangay
        ? [
            {
              barangayId: report.barangay.id,
              name: report.barangay.name,
              municipality: report.barangay.municipality,
              seniors: report.totals.seniors,
              bedridden: report.totals.bedridden,
              pensionBeneficiaries: report.pension.totalBeneficiaries,
              activeApplications: report.applications.reduce((a, c) => (c.status !== "REJECTED" ? a + c.count : a), 0),
            },
          ]
        : [];
    const csv = toCsv(rows, [
      { key: "name", label: "Barangay" },
      { key: "municipality", label: "Municipality" },
      { key: "seniors", label: "Total Seniors" },
      { key: "bedridden", label: "Bedridden" },
      { key: "pensionBeneficiaries", label: "Pension Beneficiaries" },
      { key: "activeApplications", label: "Active Applications" },
    ]);
    sendCsv(res, "barangay-summary.csv", csv);
  } catch (err) {
    next(err);
  }
}

export async function exportDemographicsCsv(req, res, next) {
  try {
    const report = await adminReportsService.getSystemReport(req.user, filtersFromQuery(req));
    const rows = [
      { metric: "Total Seniors", value: report.totals.seniors },
      { metric: "Male", value: report.totals.male },
      { metric: "Female", value: report.totals.female },
      { metric: "Bedridden", value: report.totals.bedridden },
      { metric: "Non-Bedridden", value: report.totals.nonBedridden },
      { metric: "Bedridden %", value: report.totals.bedriddenPercent },
      ...report.ageGroups.map((g) => ({ metric: `Age ${g.label}`, value: g.count })),
    ];
    const csv = toCsv(rows, [
      { key: "metric", label: "Metric" },
      { key: "value", label: "Value" },
    ]);
    sendCsv(res, "senior-demographics.csv", csv);
  } catch (err) {
    next(err);
  }
}

export async function exportPensionCsv(req, res, next) {
  try {
    const report = await adminReportsService.getSystemReport(req.user, filtersFromQuery(req));
    const rows = [
      { metric: "Total Beneficiaries", value: report.pension.totalBeneficiaries },
      { metric: "Active", value: report.pension.active },
      { metric: "Inactive", value: report.pension.inactive },
      { metric: "Claims — Scheduled", value: report.pension.claims.scheduled },
      { metric: "Claims — Claimed", value: report.pension.claims.claimed },
      { metric: "Claims — Missed", value: report.pension.claims.missed },
      { metric: "Claims — Cancelled", value: report.pension.claims.cancelled },
    ];
    const csv = toCsv(rows, [
      { key: "metric", label: "Metric" },
      { key: "value", label: "Value" },
    ]);
    sendCsv(res, "pension-statistics.csv", csv);
  } catch (err) {
    next(err);
  }
}

export async function exportApplicationsCsv(req, res, next) {
  try {
    const report = await adminReportsService.getSystemReport(req.user, filtersFromQuery(req));
    const csv = toCsv(
      report.applications.map((a) => ({ status: a.status, count: a.count })),
      [
        { key: "status", label: "Status" },
        { key: "count", label: "Count" },
      ]
    );
    sendCsv(res, "assistance-applications.csv", csv);
  } catch (err) {
    next(err);
  }
}

export async function exportUserStatsCsv(req, res, next) {
  try {
    const report = await adminReportsService.getSystemReport(req.user, filtersFromQuery(req));
    const rows = [
      { metric: "Total Users", value: report.users.total },
      ...Object.entries(report.users.byRole).map(([role, count]) => ({ metric: `Role — ${role}`, value: count })),
      ...Object.entries(report.users.byStatus).map(([status, count]) => ({ metric: `Status — ${status}`, value: count })),
    ];
    const csv = toCsv(rows, [
      { key: "metric", label: "Metric" },
      { key: "value", label: "Value" },
    ]);
    sendCsv(res, "user-statistics.csv", csv);
  } catch (err) {
    next(err);
  }
}
