import sdb from "./database.js";
import { saveBannerImage } from "./bannerUploadService.js";

const LAYOUT_SELECT = `
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
`;

const resolveLayoutItemImageUrl = async (item) => {
  if (item.file_data) {
    return saveBannerImage({
      fileName: item.file_name || "layout-banner.jpg",
      fileData: item.file_data
    });
  }

  const url = item.image_url;
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/static/")) {
    return url;
  }

  const dataUrlMatch = url.match(/^data:image\/[\w+.+-]+;base64,(.+)$/);
  if (dataUrlMatch) {
    return saveBannerImage({
      fileName: item.file_name || "layout-banner.jpg",
      fileData: dataUrlMatch[1]
    });
  }

  return url;
};

const resolveChromeLogoBlock = async (block) => {
  if (!block) return block;

  const next = { ...block };
  if (next.logo_file_data) {
    next.logo_url = await saveBannerImage({
      fileName: next.logo_file_name || "layout-logo.png",
      fileData: next.logo_file_data
    });
    delete next.logo_file_data;
    delete next.logo_file_name;
  }

  return next;
};

const resolveThemeConfig = async (config) => {
  if (!config) return config;

  const next = { ...config };
  if (next.navbar) {
    next.navbar = await resolveChromeLogoBlock(next.navbar);
  }
  if (next.footer) {
    next.footer = await resolveChromeLogoBlock(next.footer);
  }

  return next;
};

const getLayoutById = async (layoutId) => {
  const { data: result, error } = await sdb
    .from("PharmacyLayout")
    .select(LAYOUT_SELECT)
    .eq("id", layoutId)
    .limit(1);

  const data = result && result.length > 0 ? result[0] : null;

  if (error) throw new Error(error.message);
  return mapLayout(data);
};

const PRESET_LAYOUT_ID = "00000000-0000-0000-0000-000000000001";

export const getFactoryLayoutTemplate = () => ({
  name: "Default Modern Layout",
  is_active: true,
  isPreset: true,
  sections: [
    {
      section_type: "hero_carousel",
      title: null,
      display_order: 10,
      config: {},
      items: []
    },
    {
      section_type: "category_circles",
      title: "Compre por Categoria",
      display_order: 20,
      config: {},
      items: [
        { title: "Higiene", metadata: { icon: "hygiene" }, display_order: 1 },
        { title: "Vitaminas", metadata: { icon: "vitamins" }, display_order: 2 },
        { title: "Fitness", metadata: { icon: "fitness" }, display_order: 3 },
        { title: "Diabetes", metadata: { icon: "diabetes" }, display_order: 4 }
      ]
    },
    {
      section_type: "product_slider",
      title: "Medicamentos em destaque",
      display_order: 30,
      config: { filter: { is_featured: true } },
      items: []
    },
    {
      section_type: "promo_grid",
      title: "Ofertas Especiais",
      display_order: 40,
      config: {},
      items: []
    }
  ]
});

export const restoreFactoryPreset = async () => {
  const { data: sections } = await sdb.from("PharmacyLayoutSection").select("id").eq("layout_id", PRESET_LAYOUT_ID);
  if (sections && sections.length > 0) {
    const sectionIds = sections.map(s => s.id);
    await sdb.from("PharmacyLayoutItem").delete().in("section_id", sectionIds);
  }
  await sdb.from("PharmacyLayoutSection").delete().eq("layout_id", PRESET_LAYOUT_ID);

  await sdb.from("PharmacyLayout").upsert({
    id: PRESET_LAYOUT_ID,
    name: "Default Modern Layout",
    is_preset: true,
    is_active: true
  });

  await seedPresetLayout();
  return getActiveLayout(null);
};

export const seedPresetLayout = async () => {
  const layoutId = PRESET_LAYOUT_ID;
  
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
    .select(LAYOUT_SELECT)
    .eq("is_active", true);

  if (pharmacyId) {
    layoutQuery = layoutQuery.eq("pharmacy_id", pharmacyId);
  } else {
    // Global layout
    layoutQuery = layoutQuery.eq("is_preset", true);
  }

  const { data: result, error } = await layoutQuery.order("created_at", { ascending: false }).limit(1);
  const data = result && result.length > 0 ? result[0] : null;

  if (error || !data) {
    // Fallback to default preset
    const { data: presetResult, error: presetError } = await sdb.from("PharmacyLayout")
      .select(LAYOUT_SELECT)
      .eq("is_preset", true)
      .eq("is_active", true)
      .limit(1);
    
    const presetData = presetResult && presetResult.length > 0 ? presetResult[0] : null;

    if (presetError) throw presetError;

    if (!presetData || (presetData && presetData.PharmacyLayoutSection.length === 0)) {
      await sdb.from('PharmacyLayout').upsert({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Default Modern Layout',
        is_preset: true,
        is_active: true
      });
      await seedPresetLayout();
      return getLayoutById(PRESET_LAYOUT_ID);
    }

    return mapLayout(presetData);
  }

  if (data && data.is_preset && data.PharmacyLayoutSection.length === 0) {
    await seedPresetLayout();
    return getLayoutById(PRESET_LAYOUT_ID);
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
    .select(LAYOUT_SELECT)
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
      const { data: oldSections } = await sdb.from("PharmacyLayoutSection")
        .select("id")
        .eq("layout_id", layout.id)
        .not("id", "in", `(${incomingSecIds.join(",")})`);
        
      if (oldSections && oldSections.length > 0) {
        const oldSecIds = oldSections.map(s => s.id);
        await sdb.from("PharmacyLayoutItem").delete().in("section_id", oldSecIds);
        await sdb.from("PharmacyLayoutSection").delete().in("id", oldSecIds);
      }
    } else {
      const { data: oldSections } = await sdb.from("PharmacyLayoutSection").select("id").eq("layout_id", layout.id);
      if (oldSections && oldSections.length > 0) {
        const oldSecIds = oldSections.map(s => s.id);
        await sdb.from("PharmacyLayoutItem").delete().in("section_id", oldSecIds);
      }
      await sdb.from("PharmacyLayoutSection").delete().eq("layout_id", layout.id);
    }

    // Upsert sections
    for (const sec of layoutData.sections) {
      const sectionPayload = {
        id: sec.id || undefined,
        layout_id: layout.id,
        section_type: sec.section_type,
        title: sec.title,
        subtitle: sec.subtitle,
        display_order: sec.display_order,
        config: sec.section_type === "theme_config" && sec.config
          ? await resolveThemeConfig(sec.config)
          : sec.config
      };

      const { data: sectionData, error: secError } = await sdb.from("PharmacyLayoutSection")
        .upsert(sectionPayload)
        .select().single();
      
      if (secError) throw new Error(secError.message);

      if (sec.items) {
        const incomingItemIds = sec.items.filter(i => i.id).map(i => i.id);
        if (incomingItemIds.length > 0) {
          await sdb.from("PharmacyLayoutItem").delete()
            .eq("section_id", sectionData.id)
            .not("id", "in", `(${incomingItemIds.join(",")})`);
        } else {
          await sdb.from("PharmacyLayoutItem").delete().eq("section_id", sectionData.id);
        }

        for (const item of sec.items) {
          const imageUrl = await resolveLayoutItemImageUrl(item);

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

  return getLayoutById(layout.id);
};
