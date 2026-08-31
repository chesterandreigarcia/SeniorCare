import * as adminService from "../services/admin.service.js";

export async function createBarangay(req, res, next) {
  try {
    const barangay = await adminService.createBarangay(req.validatedBody);
    res.status(201).json({ success: true, message: "Barangay created successfully.", data: barangay });
  } catch (err) {
    next(err);
  }
}

export async function listBarangays(req, res, next) {
  try {
    const barangays = await adminService.listBarangaysWithStats();
    res.status(200).json({ success: true, data: barangays });
  } catch (err) {
    next(err);
  }
}

export async function createStaff(req, res, next) {
  try {
    const { user, temporaryPassword } = await adminService.createStaffAccount(req.validatedBody);
    res.status(201).json({
      success: true,
      message: "Barangay Staff account created successfully.",
      data: { user, temporaryPassword },
    });
  } catch (err) {
    next(err);
  }
}

export async function listStaff(req, res, next) {
  try {
    const staff = await adminService.listStaff();
    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
}

export async function getStaff(req, res, next) {
  try {
    const staff = await adminService.getStaffById(req.params.staffId);
    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
}

export async function updateStaffAssignment(req, res, next) {
  try {
    const staff = await adminService.updateStaffAssignment(req.params.staffId, req.validatedBody.assignedBarangayId);
    res.status(200).json({ success: true, message: "Staff assignment updated.", data: staff });
  } catch (err) {
    next(err);
  }
}

export async function updateStaffStatus(req, res, next) {
  try {
    const staff = await adminService.updateStaffStatus(req.params.staffId, req.validatedBody.status);
    res.status(200).json({ success: true, message: "Staff account status updated.", data: staff });
  } catch (err) {
    next(err);
  }
}
