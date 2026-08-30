import * as authService from "../services/auth.service.js";
import { REFRESH_COOKIE_NAME, refreshCookieOptions, verifyRefreshToken, signAccessToken } from "../utils/token.js";
import User from "../models/User.js";
import { AuthenticationError } from "../utils/errors.js";

export async function login(req, res, next) {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.validatedBody);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { accessToken, user },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) throw new AuthenticationError("Session expired. Please log in again.");

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AuthenticationError("Session expired. Please log in again.");
    }

    const user = await User.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new AuthenticationError("Session expired. Please log in again.");
    }

    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
    res.status(200).json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req, res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  res.status(200).json({ success: true, message: "Logged out." });
}

export async function me(req, res, next) {
  try {
    const user = await authService.getAuthenticatedUser(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    await authService.requestPasswordReset(req.validatedBody.email);
    // Always the same response, whether or not the account exists.
    res.status(200).json({
      success: true,
      message: "If an account exists for this email, password recovery instructions have been sent.",
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.validatedBody);
    res.status(200).json({ success: true, message: "Your password has been reset. You may now log in." });
  } catch (err) {
    next(err);
  }
}
