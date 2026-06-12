import sdb from "./database.js";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const BANNER_DIR = path.join(path.resolve(), "src/public/banners");

const ensureDir = () => {
  if (!fs.existsSync(BANNER_DIR)) {
    fs.mkdirSync(BANNER_DIR, { recursive: true });
  }
};

const seedPresetLayout = async () => {
  const layoutId = '00000000-0000-0000-0000-000000000001';
  
  const sections = [
    { id: '11111111-1111-1111-1111-111111111111', layout_id: layoutId, section_type: 'hero_carousel', title: null, display_order: 10, config: {} },
    { id: '11111111-1111-1111-1111-111111111112', layout_id: layoutId, section_type: 'category_circles', title: 'Compre por Categoria', display_order: 20, config: {} },
    { id: '11111111-1111-1111-1111-111111111113', layout_id: layoutId, section_type: 'product_slider', title: 'Medicamentos em destaque', display_order: 30, config: {"filter": {"is_featured": true}} },
    { id: '11111111-1111-1111-1111-111111111114', layout_id: layoutId, section_type: 'promo_grid', title: 'Ofertas Especiais', display_order: 40, config: {} }
  ];

  for (const sec of sections) {
    await sdb.from('PharmacyLayoutSection').upsert(sec);
  }

  const items = [
    { section_id: '11111111-1111-1111-1111-111111111112', title: 'Higiene', metadata: {"icon": "hygiene"}, display_order: 1 },
    { section_id: '11111111-1111-1111-1111-111111111112', title: 'Vitaminas', metadata: {"icon": "vitamins"}, display_order: 2 },
    { section_id: '11111111-1111-1111-1111-111111111112', title: 'Fitness', metadata: {"icon": "fitness"}, display_order: 3 },
    { section_id: '11111111-1111-1111-1111-111111111112', title: 'Diabetes', metadata: {"icon": "diabetes"}, display_order: 4 }
  ];

  for (const item of items) {
    await sdb.from('PharmacyLayoutItem').upsert(item);
  }
};


/**
 * Gets the active layout for a pharmacy. If no active layout exists,
 * it returns the global default preset layout.
 */
export const getActiveLayout = async (pharmacyId = null) => {
  let layoutQuery = sdb.from("PharmacyLayout")
    .select(`
      id,
      name,
      is_preset,
      is_active,
      PharmacyLayoutSection(
        id, section_type, title, subtitle, display_order, config,
        PharmacyLayoutItem(
          id, title, subtitle, image_url, link_url, display_order, metadata
        )
      )
    `)
    .eq("is_active", true);

  if (pharmacyId) {
    layoutQuery = layoutQuery.eq("pharmacy_id", pharmacyId);
  } else {
    // Global layout
    layoutQuery = layoutQuery.eq("is_preset", true);
  }

  const { data, error } = await layoutQuery.order("created_at", { ascending: false }).limit(1).single();

  if (error || !data) {
    // Fallback to default preset
    const { data: presetData, error: presetError } = await sdb.from("PharmacyLayout")
      .select(`
        id,
        name,
        is_preset,
        is_active,
        PharmacyLayoutSection(
          id, section_type, title, subtitle, display_order, config,
          PharmacyLayoutItem(
            id, title, subtitle, image_url, link_url, display_order, metadata
          )
        )
      `)
      .eq("is_preset", true)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (presetError) throw presetError;

    if (presetData && presetData.PharmacyLayoutSection.length === 0) {
      await seedPresetLayout();
      const { data: newData } = await sdb.from("PharmacyLayout")
        .select(`
          id, name, is_preset, is_active,
          PharmacyLayoutSection(
            id, section_type, title, subtitle, display_order, config,
            PharmacyLayoutItem(
              id, title, subtitle, image_url, link_url, display_order, metadata
            )
          )
        `)
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single();
      return mapLayout(newData);
    }

    return mapLayout(presetData);
  }

  if (data && data.is_preset && data.PharmacyLayoutSection.length === 0) {
    await seedPresetLayout();
    const { data: newData } = await sdb.from("PharmacyLayout")
      .select(`
        id, name, is_preset, is_active,
        PharmacyLayoutSection(
          id, section_type, title, subtitle, display_order, config,
          PharmacyLayoutItem(
            id, title, subtitle, image_url, link_url, display_order, metadata
          )
        )
      `)
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single();
    return mapLayout(newData);
  }

  return mapLayout(data);
};

const mapLayout = (layoutData) => {
  if (!layoutData) return null;
  // Sort sections
  const sections = (layoutData.PharmacyLayoutSection || []).sort((a, b) => a.display_order - b.display_order);
  
  // Sort items inside sections
  sections.forEach(sec => {
    sec.items = (sec.PharmacyLayoutItem || []).sort((a, b) => a.display_order - b.display_order);
    delete sec.PharmacyLayoutItem;
  });

  return {
    id: layoutData.id,
    name: layoutData.name,
    isPreset: layoutData.is_preset,
    is_active: layoutData.is_active,
    sections: sections
  };
};

export const getPharmacyLayout = async (pharmacyId) => {
  const { data, error } = await sdb.from("PharmacyLayout")
    .select(`
      id, name, is_preset, is_active,
      PharmacyLayoutSection(
        id, section_type, title, subtitle, display_order, config,
        PharmacyLayoutItem(
          id, title, subtitle, image_url, link_url, display_order, metadata
        )
      )
    `)
    .eq("pharmacy_id", pharmacyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data.map(mapLayout);
};

export const savePharmacyLayout = async (pharmacyId, layoutData) => {
  // Simple implementation: Disable other active layouts, upsert new
  if (layoutData.is_active) {
    let query = sdb.from("PharmacyLayout").update({ is_active: false });
    if (pharmacyId) {
       query = query.eq("pharmacy_id", pharmacyId);
    } else {
       query = query.eq("is_preset", true);
    }
    await query;
  }

  const { data: layout, error: layoutError } = await sdb.from("PharmacyLayout")
    .upsert({
      id: layoutData.id || undefined,
      pharmacy_id: pharmacyId,
      name: layoutData.name || 'Layout',
      is_active: layoutData.is_active,
      is_preset: layoutData.is_preset !== undefined ? layoutData.is_preset : false
    })
    .select()
    .single();

  if (layoutError) throw new Error(layoutError.message);

  if (layoutData.sections) {
    const incomingSecIds = layoutData.sections.filter(s => s.id).map(s => s.id);
    if (incomingSecIds.length > 0) {
      await sdb.from("PharmacyLayoutSection").delete()
        .eq("layout_id", layout.id)
        .not("id", "in", incomingSecIds);
    } else {
      await sdb.from("PharmacyLayoutSection").delete().eq("layout_id", layout.id);
    }

    // Upsert sections
    for (const sec of layoutData.sections) {
      const { data: sectionData, error: secError } = await sdb.from("PharmacyLayoutSection")
        .upsert({
          id: sec.id || undefined,
          layout_id: layout.id,
          section_type: sec.section_type,
          title: sec.title,
          subtitle: sec.subtitle,
          display_order: sec.display_order,
          config: sec.config
        })
        .select().single();
      
      if (secError) throw new Error(secError.message);

      if (sec.items) {
        const incomingItemIds = sec.items.filter(i => i.id).map(i => i.id);
        if (incomingItemIds.length > 0) {
          await sdb.from("PharmacyLayoutItem").delete()
            .eq("section_id", sectionData.id)
            .not("id", "in", incomingItemIds);
        } else {
          await sdb.from("PharmacyLayoutItem").delete().eq("section_id", sectionData.id);
        }

        for (const item of sec.items) {
          let imageUrl = item.image_url;

          // If the item contains file data, upload it
          if (item.file_data && item.file_name) {
            ensureDir();
            const extension = path.extname(item.file_name || ".jpg") || ".jpg";
            const safeName = `${pharmacyId}-${uuidv4()}${extension}`;
            const filePath = path.join(BANNER_DIR, safeName);
            const buffer = Buffer.from(item.file_data, "base64");
            fs.writeFileSync(filePath, buffer);
            imageUrl = `/static/banners/${safeName}`;
          }

          await sdb.from("PharmacyLayoutItem").upsert({
            id: item.id || undefined,
            section_id: sectionData.id,
            title: item.title,
            subtitle: item.subtitle,
            image_url: imageUrl,
            link_url: item.link_url,
            display_order: item.display_order,
            metadata: item.metadata
          });
        }
      }
    }
  }

  return mapLayout(layout);
};
