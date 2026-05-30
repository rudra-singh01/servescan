-- Run in Supabase SQL editor after Drizzle migrations
-- Enable RLS on all tables

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE slug_redirects ENABLE ROW LEVEL SECURITY;

-- Tenants: owner only
CREATE POLICY tenant_isolation ON tenants
  FOR ALL USING (owner_id = auth.uid());

-- Team members can read their tenant's data
CREATE POLICY menu_read ON menus
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY menu_write ON menus
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
      AND role IN ('owner', 'manager')
    )
  );

-- Public read for active public menus
CREATE POLICY public_menu_read ON menus
  FOR SELECT USING (is_public = true AND is_active = true);

CREATE POLICY public_category_read ON categories
  FOR SELECT USING (
    menu_id IN (SELECT id FROM menus WHERE is_public = true AND is_active = true)
  );

CREATE POLICY public_item_read ON items
  FOR SELECT USING (
    menu_id IN (SELECT id FROM menus WHERE is_public = true AND is_active = true)
  );
