-- ============================================================================
-- AyurTrace+ — demo complaints
--
-- GENERATED DEMO DATA. These complaints are fabricated for demonstration; they
-- reference real batch numbers and product codes so the register looks
-- plausible, but no one actually filed them.
--
-- To remove them later:
--   delete from public.complaints where payload->>'assignedOfficer' is not null
--     and created_at < now();
-- or simply: truncate public.complaints;
--
-- Requires public.complaints to exist — run sql/create_complaints_table.sql
-- first, or run this file straight after it.
--
-- WHERE: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ============================================================================

insert into public.complaints (payload) values
  ('{"batchId":"BATCH-2026-3122","type":"Compliance","source":"Manufacturer","description":"Goods-inward record for BATCH-2026-3122 was raised without a GMP-verified receiving area being confirmed.","status":"Closed","priority":"Medium","assignedOfficer":"Ravi Shankar","resolution":"Partial credit note issued for the shortfall. Collection centre counselled on weighing procedure.","createdAt":"2026-08-29T09:18:50.804Z","updatedAt":"2026-08-30T06:18:50.804Z"}'::jsonb),
  ('{"batchId":"BATCH-2026-6540","type":"Compliance","source":"Collection Center","description":"Goods-inward record for BATCH-2026-6540 was raised without a GMP-verified receiving area being confirmed.","status":"Open","priority":"Medium","assignedOfficer":"Anitha Rajan","createdAt":"2026-08-28T09:18:50.826Z","updatedAt":"2026-08-28T09:18:50.826Z"}'::jsonb),
  ('{"batchId":"BATCH-2026-5121","type":"Fraud","source":"Manufacturer","description":"Certificate number quoted for BATCH-2026-5121 does not appear on the issuing laboratory''s own register. Requesting verification.","status":"Open","priority":"High","assignedOfficer":"Dr. Lakshmi Iyer","createdAt":"2026-08-23T09:18:50.826Z","updatedAt":"2026-08-23T09:18:50.826Z"}'::jsonb),
  ('{"batchId":"BATCH-2026-9016","type":"Quality","source":"Collection Center","description":"Consignment of Clove (BATCH-2026-9016) received with visible moisture above the declared level. Requesting re-test before release to production.","status":"Under Review","priority":"High","assignedOfficer":"S. Balasubramanian","createdAt":"2026-08-12T09:18:50.826Z","updatedAt":"2026-08-12T09:18:50.826Z"}'::jsonb),
  ('{"batchId":"BATCH-2026-2199","type":"Quality","source":"Processing","description":"Colour and aroma of Moringa (Drumstick) in BATCH-2026-2199 inconsistent with the reference sample held at the collection centre.","status":"Under Review","priority":"Low","assignedOfficer":"Ravi Shankar","createdAt":"2026-08-02T09:18:50.826Z","updatedAt":"2026-08-02T09:18:50.826Z"}'::jsonb),
  ('{"batchId":"BATCH-2026-5121","type":"Fraud","source":"Supply Chain","description":"Certificate number quoted for BATCH-2026-5121 does not appear on the issuing laboratory''s own register. Requesting verification.","status":"Closed","priority":"High","assignedOfficer":"S. Balasubramanian","resolution":"Transporter issued a written explanation; cold chain records subsequently produced and accepted.","createdAt":"2026-08-10T09:18:50.826Z","updatedAt":"2026-08-13T00:18:50.826Z"}'::jsonb),
  ('{"batchId":"BATCH-2026-8098","type":"Quality","source":"Manufacturer","description":"Moisture reading on arrival for BATCH-2026-8098 was 11.4%, above the 10% pharmacopoeial limit stated on the certificate.","status":"Resolved","priority":"Low","assignedOfficer":"Anitha Rajan","resolution":"Documentation corrected and re-issued by the originating party. Verified by the reviewing officer.","createdAt":"2026-08-16T09:18:50.826Z","updatedAt":"2026-08-19T23:18:50.826Z"}'::jsonb),
  ('{"batchId":"BATCH-2026-5956","type":"Delivery","source":"Manufacturer","description":"Vehicle carrying BATCH-2026-5956 was rerouted without notice; seal numbers on arrival did not match the dispatch documentation.","status":"Resolved","priority":"High","assignedOfficer":"Ravi Shankar","resolution":"Re-tested at an accredited laboratory; results within specification. No further action.","createdAt":"2026-08-31T09:18:50.826Z","updatedAt":"2026-09-02T13:18:50.826Z"}'::jsonb),
  ('{"batchId":"BATCH-2026-8628","type":"Fraud","source":"Consumer","description":"Certificate number quoted for BATCH-2026-8628 does not appear on the issuing laboratory''s own register. Requesting verification.","status":"Resolved","priority":"High","assignedOfficer":"Anitha Rajan","resolution":"Transporter issued a written explanation; cold chain records subsequently produced and accepted.","createdAt":"2026-08-12T09:18:50.826Z","updatedAt":"2026-08-13T12:18:50.826Z"}'::jsonb),
  ('{"batchId":"BATCH-2026-8098","type":"Delivery","source":"Collection Center","description":"Vehicle carrying BATCH-2026-8098 was rerouted without notice; seal numbers on arrival did not match the dispatch documentation.","status":"Closed","priority":"Low","assignedOfficer":"S. Balasubramanian","resolution":"Documentation corrected and re-issued by the originating party. Verified by the reviewing officer.","createdAt":"2026-08-30T09:18:50.826Z","updatedAt":"2026-09-02T06:18:50.826Z"}'::jsonb),
  ('{"batchId":"BATCH-2026-5956","type":"Quality","source":"Collection Center","description":"Moisture reading on arrival for BATCH-2026-5956 was 11.4%, above the 10% pharmacopoeial limit stated on the certificate.","status":"Open","priority":"High","assignedOfficer":"Arjun Menon IAS","createdAt":"2026-08-29T09:18:50.826Z","updatedAt":"2026-08-29T09:18:50.826Z"}'::jsonb),
  ('{"batchId":"BATCH-2026-5068","type":"Other","source":"Consumer","description":"Retailer queried the expiry date printed on Aloe Vera Digestive Juice; the pack shows a date earlier than the batch documentation.","status":"Under Review","priority":"High","assignedOfficer":"Ravi Shankar","createdAt":"2026-08-27T09:18:50.826Z","updatedAt":"2026-08-27T09:18:50.826Z"}'::jsonb),
  ('{"batchId":"BATCH-2026-5068","type":"Other","source":"Consumer","description":"Consumer reported that the QR code printed on Aloe Vera Herbal Gel (AYUR-PRD-7MLY8Z) did not resolve when scanned in store.","status":"Open","priority":"Low","assignedOfficer":"Dr. Lakshmi Iyer","createdAt":"2026-08-22T09:18:50.826Z","updatedAt":"2026-08-22T09:18:50.826Z"}'::jsonb),
  ('{"batchId":"BATCH-2026-5046","type":"Other","source":"Consumer","description":"Complaint received regarding sediment in Shatavari Wellness Powder (AYUR-PRD-2PV1PI). Sample retained for examination.","status":"Resolved","priority":"Low","assignedOfficer":"Meera Krishnan","resolution":"Re-tested at an accredited laboratory; results within specification. No further action.","createdAt":"2026-08-26T09:18:50.826Z","updatedAt":"2026-08-26T09:18:50.826Z"}'::jsonb);

-- ── Verification ────────────────────────────────────────────────────────────
select
  count(*)                                          as total,
  count(*) filter (where status = 'Open')           as open,
  count(*) filter (where status = 'Under Review')   as under_review,
  count(*) filter (where status in ('Resolved','Closed')) as resolved,
  count(*) filter (where priority = 'High')         as high_priority
from public.complaints;
