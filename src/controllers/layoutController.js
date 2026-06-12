import { getActiveLayout } from "../services/layoutService.js";

const getPublicLayout = async (req, res, next) => {
  try {
    // If pharmacyId is provided in query, fetch that specific layout
    const pharmacyId = req.query.pharmacy_id || null;
    const layout = await getActiveLayout(pharmacyId);
    res.status(200).json(layout);
  } catch (error) {
    next(error);
  }
};

const forceRestorePreset = async (req, res, next) => {
  try {
    const sdb = (await import('../services/database.js')).default;
    const { seedPresetLayout } = await import('../services/layoutService.js');
    
    // Wipe all preset sections
    await sdb.from('PharmacyLayoutSection').delete().in('layout_id', ['00000000-0000-0000-0000-000000000001']);
    // Ensure the preset layout exists and has the correct name
    await sdb.from('PharmacyLayout').upsert({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Default Modern Layout',
      is_preset: true,
      is_active: true
    });
    // Seed it
    await seedPresetLayout();
    
    res.status(200).json({ success: true, message: "Original factory layout restored." });
  } catch (error) {
    next(error);
  }
};

export { getPublicLayout, forceRestorePreset };
