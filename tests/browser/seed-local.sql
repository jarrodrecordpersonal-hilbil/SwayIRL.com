-- CI fixtures only. The workflow executes this with Wrangler --local against
-- a fresh local state directory and the placeholder database ID. Never --remote.
INSERT INTO partners(id,email,name,company,role,created_at,updated_at)
VALUES('qa-owner-private','qa@example.invalid','QA Owner','QA Fixture Only','retailer','2026-01-01','2026-01-01');

INSERT INTO stores(id,name,city,state,type,capacity,monthly_cents,annual_cents,status,partner_id,description,created_at,updated_at) VALUES
('qa-cedar','QA Cedar Market','Test City','MO','Bottle shop',5,12000,100000,'published','qa-owner-private','QA only: <img src=x onerror="window.__qaXss=1"> must display as text.','2026-01-01','2026-01-01'),
('qa-harbor','QA Harbor Shop','Test Harbor','TN','Grocery',3,12000,100000,'published','qa-owner-private','Isolated CI location, never a production listing.','2026-01-01','2026-01-01'),
('qa-full','QA Full Store','Test City','MO','Bottle shop',1,12000,100000,'published','qa-owner-private','','2026-01-01','2026-01-01'),
('qa-draft','QA Draft Store','Test City','MO','Bottle shop',5,12000,100000,'draft','qa-owner-private','','2026-01-01','2026-01-01'),
('qa-paused','QA Paused Store','Test City','MO','Bottle shop',5,12000,100000,'paused','qa-owner-private','','2026-01-01','2026-01-01');

INSERT INTO requests(id,partner_id,store_id,campaign,billing,status,rate_cents,created_at,updated_at)
VALUES('qa-request-private','qa-owner-private','qa-full','QA full inventory','monthly','confirmed',12000,'2026-01-01','2026-01-01');
