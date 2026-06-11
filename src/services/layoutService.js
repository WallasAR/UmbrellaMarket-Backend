import sdb from "./database.js";

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
    return mapLayout(presetData);
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
    await sdb.from("PharmacyLayout")
      .update({ is_active: false })
      .eq("pharmacy_id", pharmacyId);
  }

  const { data: layout, error: layoutError } = await sdb.from("PharmacyLayout")
    .upsert({
      id: layoutData.id,
      pharmacy_id: pharmacyId,
      name: layoutData.name,
      is_active: layoutData.is_active,
      is_preset: false
    })
    .select()
    .single();

  if (layoutError) throw new Error(layoutError.message);

  if (layoutData.sections) {
    // Upsert sections
    for (const sec of layoutData.sections) {
      const { data: sectionData, error: secError } = await sdb.from("PharmacyLayoutSection")
        .upsert({
          id: sec.id,
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
        for (const item of sec.items) {
          await sdb.from("PharmacyLayoutItem").upsert({
            id: item.id,
            section_id: sectionData.id,
            title: item.title,
            subtitle: item.subtitle,
            image_url: item.image_url,
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
