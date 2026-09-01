import * as seniorService from "../services/senior.service.js";

export async function getMyProfile(req, res, next) {
  try {
    const profile = await seniorService.getMySeniorProfile(req.user.id);
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}
