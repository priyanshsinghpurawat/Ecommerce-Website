import { Newsletter } from '../models/newsletter.model.js';
import { asyncHandler, ApiError, ApiResponse } from '../utils/helpers.js';

export const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, 'Invalid email address.');
  }

  const exists = await Newsletter.findOne({ email: email.toLowerCase().trim() });
  if (exists) {
    return res.status(200).json(new ApiResponse(200, null, 'Already subscribed.'));
  }

  await Newsletter.create({ email: email.toLowerCase().trim() });

  return res.status(201).json(new ApiResponse(201, null, 'Subscribed successfully.'));
});
