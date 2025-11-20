import Organization from '../models/organization.js';

export const getAllOrganizations = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const organizations = await Organization.find(filter)
      .sort({ createdAt: -1 })
      .populate('users', 'name email role status') // Virtual population
      .lean();

    res.status(200).json({
      success: true,
      count: organizations.length,
      message:
        organizations.length > 0
          ? `${organizations.length} organization${
              organizations.length > 1 ? 's' : ''
            } found`
          : 'No organizations found',
      organizations,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrganizationById = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate('users', 'name email role status')
      .lean();

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.status(200).json({
      success: true,
      organization: org,
    });
  } catch (err) {
    next(err);
  }
};

export const createOrganization = async (req, res, next) => {
  try {
    const payload = req.body;

    payload.createdBy = req.user?._id;

    const org = await Organization.create(payload);

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization: org,
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrganization = async (req, res, next) => {
  try {
    const updated = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      organization: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteOrganization = async (req, res, next) => {
  try {
    const deleted = await Organization.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Organization deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
